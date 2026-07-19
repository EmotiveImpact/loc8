//
// MeshService.swift
// Loc8Mesh
//
// Dual-role CoreBluetooth GATT mesh for Loc8 (spike brief §2/§3).
// Heavily simplified adaptation of bitchat's BLEService.swift (The Unlicense —
// public domain): no announce/noise/fragments/sync/signing, single message
// type (0x30), raw 47-byte frames on egress (decode also accepts the
// bitchat-style 256-padded form).
//
// Roles run concurrently:
//   - CBCentralManager scans for the LOC8-MESH service and connects (max 6
//     links); ingress via characteristic notifications, egress via
//     write-without-response to the peer's characteristic.
//   - CBPeripheralManager advertises the service with one characteristic;
//     ingress via GATT writes, egress via updateValue notifications to
//     subscribed centrals.
//
// Simplifications vs bitchat, called out per the spike brief:
//   - Continuous scanning with a periodic stop/start restart (~20 s) so iOS
//     re-delivers already-seen peripherals after disconnects; no duty cycling —
//     revisit for battery before v2 ships.
//   - Full fanout on egress/relay (no ~log2(degree) message-ID-seeded subset)
//     — fine at spike scale (handfuls of phones), required change for
//     festival-density meshes.
//   - No central/peripheral role tie-breaking: two phones may hold two links
//     to each other (one per role). Dedup makes this harmless.
//

import CoreBluetooth
import Foundation
import os.log

final class MeshService: NSObject {
    static let shared = MeshService()

    /// (25-byte payload, relayVia) — invoked on the main queue.
    var onPacket: ((Data, String?) -> Void)?
    /// (nearbyCount, connected) — invoked on the main queue.
    var onStatus: ((Int, Bool) -> Void)?

    private let queue = DispatchQueue(label: "me.loc8.mesh.ble", qos: .userInitiated)
    private let log = Logger(subsystem: "me.loc8.mesh", category: "MeshService")

    private var central: CBCentralManager?
    private var peripheralManager: CBPeripheralManager?
    private var running = false

    // Central role: peripherals we retain while connecting / connected.
    private var pendingPeripherals: [UUID: CBPeripheral] = [:]
    private var centralLinks: [UUID: CBPeripheral] = [:]
    private var centralCharacteristics: [UUID: CBCharacteristic] = [:]
    private var lastConnectAttempt = Date.distantPast
    /// Peers with a rate-limit deferred connect scheduled (so a discovery
    /// discarded by the 0.5 s rate limit isn't lost until the next rescan).
    private var scheduledConnectRetries: Set<UUID> = []
    /// Token per pending connect attempt; the 10 s timeout only fires for the
    /// attempt it was armed for (a reconnect mints a fresh token).
    private var pendingConnectTokens: [UUID: Date] = [:]
    /// Frames waiting on writeWithoutResponse backpressure, per peer.
    /// Bounded (drop-oldest); flushed from peripheralIsReady.
    private var pendingWrites: [UUID: [Data]] = [:]
    /// Periodic scan stop/start so iOS re-delivers already-seen peripherals.
    private var scanRestartTimer: DispatchSourceTimer?

    // Peripheral role.
    private var meshCharacteristic: CBMutableCharacteristic?
    private var serviceAdded = false
    private var subscribers: [UUID: CBCentral] = [:]
    /// Notifications that failed because the update queue was full; retried on
    /// peripheralManagerIsReady(toUpdateSubscribers:).
    private var pendingNotifies: [(data: Data, centralIDs: [UUID])] = []

    // Mesh logic.
    private let dedup = MeshDeduplicator()
    private var pendingRelays: [String: DispatchWorkItem] = [:]
    /// senderID of our own frames (derived from the last broadcast payload).
    private var mySenderID: Data?
    private var lastReportedLinkCount = -1

    private override init() {
        super.init()
    }

    // MARK: - Public API (thread-safe; hops onto the BLE queue)

    /// Idempotent: repeated calls while running are no-ops.
    func start() {
        queue.async { [self] in
            guard !running else { return }
            running = true

            // State restoration requires the matching UIBackgroundModes entries;
            // CoreBluetooth hard-crashes when a restore identifier is passed
            // without them. Degrade to non-restoring managers so a build without
            // the app.json background modes still runs (foreground-only).
            let backgroundModes = Bundle.main.object(forInfoDictionaryKey: "UIBackgroundModes") as? [String] ?? []

            var centralOptions: [String: Any] = [:]
            if backgroundModes.contains("bluetooth-central") {
                centralOptions[CBCentralManagerOptionRestoreIdentifierKey] = MeshConstants.centralRestoreID
            }
            central = CBCentralManager(delegate: self, queue: queue, options: centralOptions)

            var peripheralOptions: [String: Any] = [:]
            if backgroundModes.contains("bluetooth-peripheral") {
                peripheralOptions[CBPeripheralManagerOptionRestoreIdentifierKey] = MeshConstants.peripheralRestoreID
            }
            peripheralManager = CBPeripheralManager(delegate: self, queue: queue, options: peripheralOptions)
            // Scanning/advertising is armed from the poweredOn state callbacks.

            // Periodic scan restart (H2): a long-lived iOS scan with
            // allow-duplicates=false never re-delivers a peripheral it has
            // already reported, so a dropped peer would otherwise be
            // unreachable until app restart. Mirrors bitchat.
            let timer = DispatchSource.makeTimerSource(queue: queue)
            timer.schedule(
                deadline: .now() + MeshConstants.scanRestartIntervalSeconds,
                repeating: MeshConstants.scanRestartIntervalSeconds
            )
            timer.setEventHandler { [weak self] in self?.restartScan() }
            timer.resume()
            scanRestartTimer = timer
        }
    }

    /// Idempotent: tears down all links, scanning and advertising.
    func stop() {
        queue.async { [self] in
            guard running else { return }
            running = false

            for item in pendingRelays.values { item.cancel() }
            pendingRelays.removeAll()

            scanRestartTimer?.cancel()
            scanRestartTimer = nil

            if central?.isScanning == true { central?.stopScan() }
            for peripheral in centralLinks.values { central?.cancelPeripheralConnection(peripheral) }
            for peripheral in pendingPeripherals.values { central?.cancelPeripheralConnection(peripheral) }
            centralLinks.removeAll()
            centralCharacteristics.removeAll()
            pendingPeripherals.removeAll()
            pendingConnectTokens.removeAll()
            scheduledConnectRetries.removeAll()
            pendingWrites.removeAll()

            peripheralManager?.stopAdvertising()
            peripheralManager?.removeAllServices()
            serviceAdded = false
            meshCharacteristic = nil
            subscribers.removeAll()
            pendingNotifies.removeAll()

            central?.delegate = nil
            peripheralManager?.delegate = nil
            central = nil
            peripheralManager = nil

            dedup.reset()
            emitStatusIfChanged(force: true)
        }
    }

    /// Originate a frame: TTL=7, FRESH header timestamp (dedup keys on it —
    /// rally-pin re-broadcasts must not be swallowed), full fanout.
    /// `payload` must be exactly 25 bytes (validated by the module layer).
    func broadcast(payload: Data) {
        queue.async { [self] in
            guard running else { return }

            // senderID(8) = "LOC8" ‖ uint32 senderId (BE). The uint32 comes from
            // payload bytes 1..4 — packetCodec.ts layout is type(1) THEN senderId(4).
            var senderID = Data(MeshConstants.senderIDPrefix)
            senderID.append(payload.subdata(in: 1..<5))
            mySenderID = senderID

            let frame = MeshFrame(
                ttl: MeshConstants.originTTL,
                timestampMs: UInt64(Date().timeIntervalSince1970 * 1000),
                senderID: senderID,
                payload: payload
            )
            // Record our own frame so loopback arrivals (peer relaying back to
            // us, or our dual-role twin link) are dropped as duplicates.
            dedup.markProcessed(MeshDeduplicator.key(for: frame))
            sendFrame(MeshFrameCodec.encode(frame), excludingLink: nil)
        }
    }

    // MARK: - Egress

    /// Send a wire frame to every connected link, minus the split-horizon exclusion.
    /// Full fanout — see header comment.
    private func sendFrame(_ data: Data, excludingLink excluded: UUID?) {
        // Central role: write to each connected peer's characteristic.
        // Write-without-response ONLY — long (prepared) writes via
        // .withResponse are broken cross-platform, so links whose negotiated
        // MTU can't carry the frame are skipped, never downgraded.
        for (id, peripheral) in centralLinks {
            if id == excluded { continue }
            guard let characteristic = centralCharacteristics[id] else { continue }
            guard peripheral.maximumWriteValueLength(for: .withoutResponse) >= data.count else {
                log.warning("mesh egress: skipping link \(id, privacy: .public) — MTU too small for \(data.count)-byte frame")
                continue
            }
            // Backpressure (M1): respect canSendWriteWithoutResponse and keep
            // per-peer FIFO order; queued frames flush from peripheralIsReady.
            if peripheral.canSendWriteWithoutResponse, pendingWrites[id]?.isEmpty ?? true {
                peripheral.writeValue(data, for: characteristic, type: .withoutResponse)
            } else {
                enqueueWrite(data, for: id)
            }
        }

        // Peripheral role: notify subscribed centrals whose notification MTU
        // can carry the frame; undersized subscribers are skipped (a truncated
        // frame would fail decode anyway).
        guard let characteristic = meshCharacteristic, !subscribers.isEmpty else { return }
        let targets = subscribers.values.filter { central in
            guard central.identifier != excluded else { return false }
            guard central.maximumUpdateValueLength >= data.count else {
                log.warning("mesh egress: skipping subscriber \(central.identifier, privacy: .public) — notify MTU too small for \(data.count)-byte frame")
                return false
            }
            return true
        }
        guard !targets.isEmpty else { return }
        let ok = peripheralManager?.updateValue(data, for: characteristic, onSubscribedCentrals: targets) ?? false
        if !ok {
            // Update queue full — retry when CoreBluetooth signals readiness.
            pendingNotifies.append((data: data, centralIDs: targets.map { $0.identifier }))
        }
    }

    /// Per-peer bounded FIFO for backpressured write-without-response frames.
    private func enqueueWrite(_ data: Data, for id: UUID) {
        var backlog = pendingWrites[id, default: []]
        if backlog.count >= MeshConstants.maxPendingWritesPerPeer {
            backlog.removeFirst() // drop-oldest: stale positions are worthless
        }
        backlog.append(data)
        pendingWrites[id] = backlog
    }

    // MARK: - Ingress

    private func handleIngress(_ data: Data, fromLink linkID: UUID) {
        guard running, let frame = MeshFrameCodec.decode(data) else { return }

        // Freshness guards (brief §3): reject future clock skew > 120 s and
        // broadcasts older than 900 s.
        let nowMs = UInt64(Date().timeIntervalSince1970 * 1000)
        if frame.timestampMs > nowMs + MeshConstants.maxFutureSkewMs { return }
        if frame.timestampMs + MeshConstants.maxAgeMs < nowMs { return }

        let senderIsSelf = (frame.senderID == mySenderID)
        let key = MeshDeduplicator.key(for: frame)

        // A duplicate arrival cancels our pending scheduled relay for the same
        // frame — someone else already flooded it.
        if let pending = pendingRelays.removeValue(forKey: key) {
            pending.cancel()
            return
        }
        if dedup.isDuplicate(key) || senderIsSelf { return }

        // relayVia: arrival TTL == originate TTL (7) means a direct neighbor.
        // A lower TTL means at least one relay hop — without announce packets
        // we can't map the ingress link to a human-meaningful last-hop sender
        // ID (the frame's senderID is the ORIGINATOR, relays don't rewrite it),
        // so we honestly report "mesh".
        let relayVia: String? = frame.ttl == MeshConstants.originTTL ? nil : "mesh"

        let payload = frame.payload
        DispatchQueue.main.async { [weak self] in
            self?.onPacket?(payload, relayVia)
        }

        // Relay decision (TTL clamp + decrement + jitter), split horizon.
        let decision = MeshRelayController.decide(
            ttl: frame.ttl,
            senderIsSelf: senderIsSelf,
            degree: linkCount()
        )
        guard decision.shouldRelay else { return }

        var relayFrame = frame
        relayFrame.ttl = decision.newTTL
        let relayData = MeshFrameCodec.encode(relayFrame)
        let item = DispatchWorkItem { [weak self] in
            guard let self else { return }
            self.pendingRelays.removeValue(forKey: key)
            guard self.running else { return }
            self.sendFrame(relayData, excludingLink: linkID)
        }
        pendingRelays[key] = item
        queue.asyncAfter(deadline: .now() + .milliseconds(decision.delayMs), execute: item)
    }

    // MARK: - Status

    private func linkCount() -> Int {
        centralLinks.count + subscribers.count
    }

    private func emitStatusIfChanged(force: Bool = false) {
        let count = linkCount()
        guard force || count != lastReportedLinkCount else { return }
        lastReportedLinkCount = count
        DispatchQueue.main.async { [weak self] in
            self?.onStatus?(count, count > 0)
        }
    }

    // MARK: - Scan / advertise arming

    private func startScanningIfPossible() {
        guard running, let central, central.state == .poweredOn, !central.isScanning else { return }
        // Continuous scan — duty cycling deliberately skipped for the spike.
        central.scanForPeripherals(
            withServices: [MeshConstants.serviceUUID],
            options: [CBCentralManagerScanOptionAllowDuplicatesKey: false]
        )
    }

    /// Stop + restart the scan so already-reported peripherals are
    /// re-delivered (reconnect path). Called by the periodic timer and on
    /// peer disconnect.
    private func restartScan() {
        guard running, let central, central.state == .poweredOn else { return }
        if central.isScanning { central.stopScan() }
        startScanningIfPossible()
    }

    private func startAdvertisingIfPossible() {
        guard running, let peripheralManager, peripheralManager.state == .poweredOn else { return }
        if !serviceAdded {
            let characteristic = CBMutableCharacteristic(
                type: MeshConstants.characteristicUUID,
                properties: [.notify, .write, .writeWithoutResponse, .read],
                value: nil,
                permissions: [.readable, .writeable]
            )
            let service = CBMutableService(type: MeshConstants.serviceUUID, primary: true)
            service.characteristics = [characteristic]
            meshCharacteristic = characteristic
            peripheralManager.add(service)
            serviceAdded = true
        }
        if !peripheralManager.isAdvertising {
            peripheralManager.startAdvertising([
                CBAdvertisementDataServiceUUIDsKey: [MeshConstants.serviceUUID]
            ])
        }
    }
}

// MARK: - CBCentralManagerDelegate

extension MeshService: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state == .poweredOn {
            startScanningIfPossible()
        } else {
            // Links die with the radio; report honestly.
            centralLinks.removeAll()
            centralCharacteristics.removeAll()
            pendingPeripherals.removeAll()
            pendingConnectTokens.removeAll()
            pendingWrites.removeAll()
            emitStatusIfChanged()
        }
    }

    /// State restoration re-arm: adopt restored peripherals so backgrounded
    /// links survive an app relaunch (scan re-arms in didUpdateState).
    func centralManager(_ central: CBCentralManager, willRestoreState dict: [String: Any]) {
        let restored = (dict[CBCentralManagerRestoredStatePeripheralsKey] as? [CBPeripheral]) ?? []
        for peripheral in restored {
            peripheral.delegate = self
            switch peripheral.state {
            case .connected:
                pendingPeripherals[peripheral.identifier] = peripheral
                peripheral.discoverServices([MeshConstants.serviceUUID])
            case .connecting:
                pendingPeripherals[peripheral.identifier] = peripheral
            default:
                break
            }
        }
    }

    func centralManager(_ central: CBCentralManager,
                        didDiscover peripheral: CBPeripheral,
                        advertisementData: [String: Any],
                        rssi RSSI: NSNumber) {
        guard running else { return }

        // RSSI gate: -90 dBm, relaxed to -95 when we have no links at all.
        // 127 is CoreBluetooth's "unavailable" sentinel.
        let rssi = RSSI.intValue
        guard rssi != 127 else { return }
        let gate = linkCount() == 0 ? MeshConstants.rssiGateIsolated : MeshConstants.rssiGate
        guard rssi >= gate else { return }

        attemptConnect(peripheral)
    }

    /// Connect with capacity + rate-limit guards. A rate-limited attempt is
    /// re-scheduled for the remaining interval (H2) instead of discarded —
    /// otherwise a peer discovered in the shadow of another connect would be
    /// invisible until the next scan restart.
    private func attemptConnect(_ peripheral: CBPeripheral) {
        guard running, let central, central.state == .poweredOn else { return }
        let id = peripheral.identifier
        guard centralLinks[id] == nil, pendingPeripherals[id] == nil else { return }
        // L1: in-flight connects count against the cap too.
        guard centralLinks.count + pendingPeripherals.count < MeshConstants.maxCentralLinks else { return }

        // 0.5 s connect rate-limit — defer, don't drop.
        let now = Date()
        let elapsed = now.timeIntervalSince(lastConnectAttempt)
        if elapsed < MeshConstants.connectRateLimitSeconds {
            guard !scheduledConnectRetries.contains(id) else { return }
            scheduledConnectRetries.insert(id)
            let remaining = MeshConstants.connectRateLimitSeconds - elapsed
            queue.asyncAfter(deadline: .now() + remaining + 0.01) { [weak self] in
                guard let self else { return }
                self.scheduledConnectRetries.remove(id)
                self.attemptConnect(peripheral)
            }
            return
        }
        lastConnectAttempt = now

        peripheral.delegate = self
        pendingPeripherals[id] = peripheral
        let token = now
        pendingConnectTokens[id] = token
        central.connect(peripheral, options: nil)

        // M2: connect/discovery timeout — a peripheral stuck pending blocks a
        // capacity slot forever (CoreBluetooth connects never time out on
        // their own). Cancel so the periodic rescan can retry it.
        queue.asyncAfter(deadline: .now() + MeshConstants.connectTimeoutSeconds) { [weak self] in
            guard let self, self.running else { return }
            guard self.pendingConnectTokens[id] == token, let stuck = self.pendingPeripherals[id] else { return }
            self.log.warning("mesh connect: timeout for \(id, privacy: .public) — cancelling so rescan can retry")
            self.pendingPeripherals.removeValue(forKey: id)
            self.pendingConnectTokens.removeValue(forKey: id)
            self.central?.cancelPeripheralConnection(stuck)
        }
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        peripheral.delegate = self
        peripheral.discoverServices([MeshConstants.serviceUUID])
    }

    func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        pendingPeripherals.removeValue(forKey: peripheral.identifier)
        pendingConnectTokens.removeValue(forKey: peripheral.identifier)
    }

    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        let id = peripheral.identifier
        pendingPeripherals.removeValue(forKey: id)
        pendingConnectTokens.removeValue(forKey: id)
        centralLinks.removeValue(forKey: id)
        centralCharacteristics.removeValue(forKey: id)
        pendingWrites.removeValue(forKey: id)
        emitStatusIfChanged()
        // H2: restart the scan so this (already-reported) peripheral is
        // re-delivered and can be reconnected.
        restartScan()
    }
}

// MARK: - CBPeripheralDelegate (central role, talking to remote GATT servers)

extension MeshService: CBPeripheralDelegate {
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard error == nil,
              let service = peripheral.services?.first(where: { $0.uuid == MeshConstants.serviceUUID }) else {
            central?.cancelPeripheralConnection(peripheral)
            return
        }
        peripheral.discoverCharacteristics([MeshConstants.characteristicUUID], for: service)
    }

    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        guard error == nil,
              let characteristic = service.characteristics?.first(where: { $0.uuid == MeshConstants.characteristicUUID }) else {
            central?.cancelPeripheralConnection(peripheral)
            return
        }
        let id = peripheral.identifier
        pendingPeripherals.removeValue(forKey: id)
        pendingConnectTokens.removeValue(forKey: id)
        centralLinks[id] = peripheral
        centralCharacteristics[id] = characteristic
        peripheral.setNotifyValue(true, for: characteristic)
        emitStatusIfChanged()
    }

    /// L2: a link that can't deliver notifications is half-deaf (we could
    /// write to it but never hear back) — treat it as dead so it doesn't
    /// occupy a slot or count toward nearbyCount.
    func peripheral(_ peripheral: CBPeripheral,
                    didUpdateNotificationStateFor characteristic: CBCharacteristic,
                    error: Error?) {
        guard characteristic.uuid == MeshConstants.characteristicUUID else { return }
        if error != nil || !characteristic.isNotifying {
            let id = peripheral.identifier
            log.warning("mesh link \(id, privacy: .public): notify subscription failed/dropped — tearing down link")
            centralLinks.removeValue(forKey: id)
            centralCharacteristics.removeValue(forKey: id)
            pendingWrites.removeValue(forKey: id)
            central?.cancelPeripheralConnection(peripheral)
            emitStatusIfChanged()
        }
    }

    /// M1: flush the per-peer backpressure queue when the write channel drains.
    func peripheralIsReady(toSendWriteWithoutResponse peripheral: CBPeripheral) {
        let id = peripheral.identifier
        guard var backlog = pendingWrites[id], !backlog.isEmpty else { return }
        guard let characteristic = centralCharacteristics[id] else {
            pendingWrites.removeValue(forKey: id)
            return
        }
        while !backlog.isEmpty && peripheral.canSendWriteWithoutResponse {
            peripheral.writeValue(backlog.removeFirst(), for: characteristic, type: .withoutResponse)
        }
        if backlog.isEmpty {
            pendingWrites.removeValue(forKey: id)
        } else {
            pendingWrites[id] = backlog
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        guard error == nil, characteristic.uuid == MeshConstants.characteristicUUID,
              let data = characteristic.value, !data.isEmpty else { return }
        handleIngress(data, fromLink: peripheral.identifier)
    }
}

// MARK: - CBPeripheralManagerDelegate (peripheral role, our GATT server)

extension MeshService: CBPeripheralManagerDelegate {
    func peripheralManagerDidUpdateState(_ peripheral: CBPeripheralManager) {
        if peripheral.state == .poweredOn {
            startAdvertisingIfPossible()
        } else {
            subscribers.removeAll()
            pendingNotifies.removeAll()
            serviceAdded = false
            emitStatusIfChanged()
        }
    }

    /// State restoration re-arm: CoreBluetooth restores our advertised service;
    /// advertising itself is re-armed in didUpdateState.
    func peripheralManager(_ peripheral: CBPeripheralManager, willRestoreState dict: [String: Any]) {
        let services = (dict[CBPeripheralManagerRestoredStateServicesKey] as? [CBMutableService]) ?? []
        if let service = services.first(where: { $0.uuid == MeshConstants.serviceUUID }),
           let characteristic = service.characteristics?
               .compactMap({ $0 as? CBMutableCharacteristic })
               .first(where: { $0.uuid == MeshConstants.characteristicUUID }) {
            meshCharacteristic = characteristic
            serviceAdded = true
        }
    }

    func peripheralManager(_ peripheral: CBPeripheralManager,
                           central: CBCentral,
                           didSubscribeTo characteristic: CBCharacteristic) {
        guard characteristic.uuid == MeshConstants.characteristicUUID else { return }
        subscribers[central.identifier] = central
        emitStatusIfChanged()
    }

    func peripheralManager(_ peripheral: CBPeripheralManager,
                           central: CBCentral,
                           didUnsubscribeFrom characteristic: CBCharacteristic) {
        subscribers.removeValue(forKey: central.identifier)
        emitStatusIfChanged()
    }

    func peripheralManager(_ peripheral: CBPeripheralManager, didReceiveWrite requests: [CBATTRequest]) {
        var responded = false
        for request in requests {
            if request.characteristic.uuid == MeshConstants.characteristicUUID,
               let data = request.value, !data.isEmpty {
                handleIngress(data, fromLink: request.central.identifier)
            }
            // A single respond covers the whole transaction (per Apple docs);
            // write-without-response never reaches respond(to:).
            if !responded {
                peripheral.respond(to: request, withResult: .success)
                responded = true
            }
        }
    }

    func peripheralManager(_ peripheral: CBPeripheralManager, didReceiveRead request: CBATTRequest) {
        // Read is exposed for probing/debugging only; there is no "current value".
        guard request.offset == 0 else {
            peripheral.respond(to: request, withResult: .invalidOffset)
            return
        }
        request.value = Data()
        peripheral.respond(to: request, withResult: .success)
    }

    func peripheralManagerIsReady(toUpdateSubscribers peripheral: CBPeripheralManager) {
        guard let characteristic = meshCharacteristic else {
            pendingNotifies.removeAll()
            return
        }
        while !pendingNotifies.isEmpty {
            let next = pendingNotifies[0]
            let targets = next.centralIDs
                .compactMap { subscribers[$0] }
                .filter { $0.maximumUpdateValueLength >= next.data.count }
            if targets.isEmpty {
                pendingNotifies.removeFirst()
                continue
            }
            if peripheral.updateValue(next.data, for: characteristic, onSubscribedCentrals: targets) {
                pendingNotifies.removeFirst()
            } else {
                break // queue full again; wait for the next readiness callback
            }
        }
    }
}
