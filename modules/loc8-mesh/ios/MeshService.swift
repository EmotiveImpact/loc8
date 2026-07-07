//
// MeshService.swift
// Loc8Mesh
//
// Dual-role CoreBluetooth GATT mesh for Loc8 (spike brief §2/§3).
// Heavily simplified adaptation of bitchat's BLEService.swift (The Unlicense —
// public domain): no announce/noise/fragments/sync/signing, single message
// type (0x30), fixed 256-byte frames.
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
//   - Continuous scanning (no duty cycling) — acceptable for the spike;
//     revisit for battery before v2 ships.
//   - Full fanout on egress/relay (no ~log2(degree) message-ID-seeded subset)
//     — fine at spike scale (handfuls of phones), required change for
//     festival-density meshes.
//   - No central/peripheral role tie-breaking: two phones may hold two links
//     to each other (one per role). Dedup makes this harmless.
//

import CoreBluetooth
import Foundation

final class MeshService: NSObject {
    static let shared = MeshService()

    /// (25-byte payload, relayVia) — invoked on the main queue.
    var onPacket: ((Data, String?) -> Void)?
    /// (nearbyCount, connected) — invoked on the main queue.
    var onStatus: ((Int, Bool) -> Void)?

    private let queue = DispatchQueue(label: "me.loc8.mesh.ble", qos: .userInitiated)

    private var central: CBCentralManager?
    private var peripheralManager: CBPeripheralManager?
    private var running = false

    // Central role: peripherals we retain while connecting / connected.
    private var pendingPeripherals: [UUID: CBPeripheral] = [:]
    private var centralLinks: [UUID: CBPeripheral] = [:]
    private var centralCharacteristics: [UUID: CBCharacteristic] = [:]
    private var lastConnectAttempt = Date.distantPast

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
        }
    }

    /// Idempotent: tears down all links, scanning and advertising.
    func stop() {
        queue.async { [self] in
            guard running else { return }
            running = false

            for item in pendingRelays.values { item.cancel() }
            pendingRelays.removeAll()

            if central?.isScanning == true { central?.stopScan() }
            for peripheral in centralLinks.values { central?.cancelPeripheralConnection(peripheral) }
            for peripheral in pendingPeripherals.values { central?.cancelPeripheralConnection(peripheral) }
            centralLinks.removeAll()
            centralCharacteristics.removeAll()
            pendingPeripherals.removeAll()

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
        for (id, peripheral) in centralLinks {
            if id == excluded { continue }
            guard let characteristic = centralCharacteristics[id] else { continue }
            // Prefer write-without-response; fall back to write-with-response
            // when the negotiated MTU can't carry the 256-byte frame.
            if peripheral.maximumWriteValueLength(for: .withoutResponse) >= data.count {
                peripheral.writeValue(data, for: characteristic, type: .withoutResponse)
            } else if characteristic.properties.contains(.write) {
                peripheral.writeValue(data, for: characteristic, type: .withResponse)
            }
        }

        // Peripheral role: notify subscribed centrals.
        guard let characteristic = meshCharacteristic, !subscribers.isEmpty else { return }
        let targets = subscribers.values.filter { $0.identifier != excluded }
        guard !targets.isEmpty else { return }
        let ok = peripheralManager?.updateValue(data, for: characteristic, onSubscribedCentrals: targets) ?? false
        if !ok {
            // Update queue full — retry when CoreBluetooth signals readiness.
            pendingNotifies.append((data: data, centralIDs: targets.map { $0.identifier }))
        }
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
        let id = peripheral.identifier
        guard centralLinks[id] == nil, pendingPeripherals[id] == nil else { return }
        guard centralLinks.count < MeshConstants.maxCentralLinks else { return }

        // RSSI gate: -90 dBm, relaxed to -95 when we have no links at all.
        // 127 is CoreBluetooth's "unavailable" sentinel.
        let rssi = RSSI.intValue
        guard rssi != 127 else { return }
        let gate = linkCount() == 0 ? MeshConstants.rssiGateIsolated : MeshConstants.rssiGate
        guard rssi >= gate else { return }

        // 0.5 s connect rate-limit.
        let now = Date()
        guard now.timeIntervalSince(lastConnectAttempt) >= MeshConstants.connectRateLimitSeconds else { return }
        lastConnectAttempt = now

        peripheral.delegate = self
        pendingPeripherals[id] = peripheral
        central.connect(peripheral, options: nil)
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        peripheral.delegate = self
        peripheral.discoverServices([MeshConstants.serviceUUID])
    }

    func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        pendingPeripherals.removeValue(forKey: peripheral.identifier)
    }

    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        let id = peripheral.identifier
        pendingPeripherals.removeValue(forKey: id)
        centralLinks.removeValue(forKey: id)
        centralCharacteristics.removeValue(forKey: id)
        emitStatusIfChanged()
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
        centralLinks[id] = peripheral
        centralCharacteristics[id] = characteristic
        peripheral.setNotifyValue(true, for: characteristic)
        emitStatusIfChanged()
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
            let targets = next.centralIDs.compactMap { subscribers[$0] }
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
