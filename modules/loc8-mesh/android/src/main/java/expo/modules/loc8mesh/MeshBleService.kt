// MeshBleService.kt
// Loc8Mesh
//
// Dual-role Android BLE GATT mesh for Loc8 (spike brief §2/§3) — the platform
// twin of modules/loc8-mesh/ios/MeshService.swift. Clean-room: written from
// the whitepaper, our own Unlicense-derived Swift, and official Android docs
// only — never bitchat-android (GPL).
//
// Roles run concurrently:
//   - BluetoothLeScanner (filtered on the LOC8-MESH service UUID) discovers
//     peers; we connect as GATT client (max 6 links), ingress via
//     characteristic notifications, egress via write-without-response
//     (fallback to with-response when negotiated MTU < 259).
//   - BluetoothLeAdvertiser advertises the service UUID only (a 128-bit UUID
//     eats 18 of the 31 legacy adv bytes — no name, no tx power);
//     BluetoothGattServer hosts the characteristic + CCCD, ingress via
//     writes, egress via notifications to subscribed centrals.
//   - Degraded scan-only mode when the chipset can't advertise
//     (getBluetoothLeAdvertiser() == null or ADVERTISE_FAILED_FEATURE_UNSUPPORTED,
//     spike brief risk 6): we still discover/connect/relay as a client.
//
// Threading: every BLE callback arrives on a binder thread; all shared state
// is confined to a single HandlerThread ("Loc8MeshBle") — callbacks marshal
// in via handler.post. The only cross-thread reads are @Volatile refs used
// for sendResponse (which must answer promptly on the binder thread).
//
// Simplifications vs bitchat, called out per the spike brief:
//   - Continuous scanning (no duty cycling) — revisit for battery before v2.
//   - Full fanout on egress/relay (no ~log2(degree) subset) — fine at spike scale.
//   - No central/peripheral role tie-breaking: two phones may hold two links
//     to each other (one per role). Dedup makes this harmless.

package expo.modules.loc8mesh

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCallback
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.BluetoothStatusCodes
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.bluetooth.le.BluetoothLeScanner
import android.bluetooth.le.ScanCallback
import android.bluetooth.le.ScanFilter
import android.bluetooth.le.ScanResult
import android.bluetooth.le.ScanSettings
import android.content.Context
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.ParcelUuid
import android.util.Log

// Permissions are checked by Loc8MeshModule.start() before any BLE call; the
// module rejects with the missing-permission list instead of requesting.
@SuppressLint("MissingPermission")
class MeshBleService private constructor() {

    companion object {
        val shared = MeshBleService()
        private const val TAG = "Loc8Mesh"
    }

    /** (25-byte payload, relayVia) — invoked on the mesh handler thread. */
    @Volatile
    var onPacket: ((ByteArray, String?) -> Unit)? = null

    /** (nearbyCount, connected) — invoked on the mesh handler thread. */
    @Volatile
    var onStatus: ((Int, Boolean) -> Unit)? = null

    @Volatile
    private var handler: Handler? = null
    private var handlerThread: HandlerThread? = null

    private var appContext: Context? = null
    private var bluetoothManager: BluetoothManager? = null
    private var adapter: BluetoothAdapter? = null
    private var scanner: BluetoothLeScanner? = null
    private var advertiser: BluetoothLeAdvertiser? = null

    // Read from binder threads in sendResponse paths — hence @Volatile.
    @Volatile
    private var gattServer: BluetoothGattServer? = null
    private var meshCharacteristic: BluetoothGattCharacteristic? = null

    private var running = false
    private var scanning = false
    private var advertising = false
    private var scanOnlyMode = false

    // Central role (keyed by peer MAC address = our link ID).
    private val pendingGatts = HashMap<String, BluetoothGatt>()
    private val centralLinks = HashMap<String, BluetoothGatt>()
    private val centralCharacteristics = HashMap<String, BluetoothGattCharacteristic>()
    private val linkMtus = HashMap<String, Int>()
    private var lastConnectAttemptMs = 0L

    // Peripheral role: centrals subscribed to our characteristic via CCCD.
    private val subscribers = HashMap<String, BluetoothDevice>()

    // Mesh logic.
    private val dedup = MeshDeduplicator()
    private val pendingRelays = HashMap<String, Runnable>()

    /** senderID of our own frames (derived from the last broadcast payload). */
    private var mySenderID: ByteArray? = null
    private var lastReportedLinkCount = -1

    // MARK: - Public API (thread-safe; hops onto the mesh handler thread)

    /** Idempotent: repeated calls while running are no-ops. */
    fun start(context: Context) {
        val app = context.applicationContext
        ensureHandler().post {
            if (running) return@post
            running = true
            appContext = app

            val manager = app.getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
            bluetoothManager = manager
            adapter = manager?.adapter
            val localAdapter = adapter
            if (localAdapter == null || !localAdapter.isEnabled) {
                Log.w(TAG, "Bluetooth adapter unavailable or disabled — mesh idle until restart")
                emitStatusIfChanged(force = true)
                return@post
            }

            openGattServerIfPossible(app)
            startScanningIfPossible()
            startAdvertisingIfPossible()
            emitStatusIfChanged(force = true)
        }
    }

    /** Idempotent: tears down all links, scanning and advertising. */
    fun stop() {
        ensureHandler().post {
            if (!running) return@post
            running = false

            val h = handler
            for (r in pendingRelays.values) h?.removeCallbacks(r)
            pendingRelays.clear()

            if (scanning) {
                runCatching { scanner?.stopScan(scanCallback) }
                scanning = false
            }
            if (advertising) {
                runCatching { advertiser?.stopAdvertising(advertiseCallback) }
                advertising = false
            }

            for (gatt in pendingGatts.values) {
                runCatching { gatt.disconnect() }
                runCatching { gatt.close() }
            }
            for (gatt in centralLinks.values) {
                runCatching { gatt.disconnect() }
                runCatching { gatt.close() }
            }
            pendingGatts.clear()
            centralLinks.clear()
            centralCharacteristics.clear()
            linkMtus.clear()

            subscribers.clear()
            runCatching { gattServer?.close() }
            gattServer = null
            meshCharacteristic = null

            scanner = null
            advertiser = null
            adapter = null
            bluetoothManager = null
            appContext = null
            scanOnlyMode = false
            mySenderID = null

            dedup.reset()
            emitStatusIfChanged(force = true)
        }
    }

    /**
     * Originate a frame: TTL=7, FRESH header timestamp (dedup keys on it —
     * rally-pin re-broadcasts must not be swallowed), full fanout.
     * `payload` must be exactly 25 bytes (validated by the module layer).
     */
    fun broadcast(payload: ByteArray) {
        ensureHandler().post {
            if (!running) return@post

            // senderID(8) = "LOC8" ‖ uint32 senderId (BE). The uint32 comes from
            // payload bytes 1..4 — packetCodec.ts layout is type(1) THEN senderId(4).
            val senderID = ByteArray(MeshConstants.SENDER_ID_SIZE)
            System.arraycopy(MeshConstants.SENDER_ID_PREFIX, 0, senderID, 0, 4)
            System.arraycopy(payload, 1, senderID, 4, 4)
            mySenderID = senderID

            val frame = MeshFrame(
                ttl = MeshConstants.ORIGIN_TTL,
                timestampMs = System.currentTimeMillis(),
                senderID = senderID,
                payload = payload
            )
            // Record our own frame so loopback arrivals (peer relaying back to
            // us, or our dual-role twin link) are dropped as duplicates.
            dedup.markProcessed(MeshDeduplicator.key(frame))
            sendFrame(MeshFrameCodec.encode(frame), excludedLinkId = null)
        }
    }

    // MARK: - Handler

    @Synchronized
    private fun ensureHandler(): Handler {
        handler?.let { return it }
        val thread = HandlerThread("Loc8MeshBle").also { it.start() }
        handlerThread = thread
        return Handler(thread.looper).also { handler = it }
    }

    // MARK: - Egress (mesh handler thread only)

    /**
     * Send a wire frame to every connected link, minus the split-horizon
     * exclusion (both the central-role write set AND the server-side notify
     * set — the writing central must not be notified back). Full fanout.
     */
    private fun sendFrame(data: ByteArray, excludedLinkId: String?) {
        // Central role: write to each connected peer's characteristic.
        for ((address, gatt) in centralLinks) {
            if (address == excludedLinkId) continue
            val characteristic = centralCharacteristics[address] ?: continue
            // Prefer write-without-response; fall back to with-response when the
            // negotiated MTU can't carry the 256-byte frame in one ATT write.
            val mtu = linkMtus[address] ?: 23
            val writeType = if (mtu >= data.size + 3) {
                BluetoothGattCharacteristic.WRITE_TYPE_NO_RESPONSE
            } else {
                BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT
            }
            val ok = runCatching {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    gatt.writeCharacteristic(characteristic, data, writeType) == BluetoothStatusCodes.SUCCESS
                } else {
                    legacyWrite(gatt, characteristic, data, writeType)
                }
            }.getOrDefault(false)
            if (!ok) Log.w(TAG, "writeCharacteristic failed for $address")
        }

        // Peripheral role: notify subscribed centrals.
        val server = gattServer ?: return
        val characteristic = meshCharacteristic ?: return
        for ((address, device) in subscribers) {
            if (address == excludedLinkId) continue
            runCatching {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    server.notifyCharacteristicChanged(device, characteristic, false, data)
                } else {
                    legacyNotify(server, device, characteristic, data)
                }
            }.onFailure { Log.w(TAG, "notifyCharacteristicChanged failed for $address", it) }
        }
    }

    // Pre-Tiramisu (API < 33) BLE write/notify/subscribe paths, isolated so the
    // deprecation suppression stays scoped.
    @Suppress("DEPRECATION")
    private fun legacyWrite(
        gatt: BluetoothGatt,
        characteristic: BluetoothGattCharacteristic,
        data: ByteArray,
        writeType: Int
    ): Boolean {
        characteristic.writeType = writeType
        characteristic.value = data
        return gatt.writeCharacteristic(characteristic)
    }

    @Suppress("DEPRECATION")
    private fun legacyNotify(
        server: BluetoothGattServer,
        device: BluetoothDevice,
        characteristic: BluetoothGattCharacteristic,
        data: ByteArray
    ) {
        characteristic.value = data
        server.notifyCharacteristicChanged(device, characteristic, false)
    }

    @Suppress("DEPRECATION")
    private fun legacySubscribe(gatt: BluetoothGatt, cccd: BluetoothGattDescriptor) {
        cccd.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
        gatt.writeDescriptor(cccd)
    }

    // MARK: - Ingress (mesh handler thread only)

    private fun handleIngress(data: ByteArray, linkId: String) {
        if (!running) return
        val frame = MeshFrameCodec.decode(data) ?: return

        // Freshness guards (brief §3): reject future clock skew > 120 s and
        // broadcasts older than 900 s. (> 2^63 wire timestamps decode negative
        // and are dropped by the age guard.)
        val nowMs = System.currentTimeMillis()
        if (frame.timestampMs > nowMs + MeshConstants.MAX_FUTURE_SKEW_MS) return
        if (frame.timestampMs + MeshConstants.MAX_AGE_MS < nowMs) return

        val senderIsSelf = mySenderID?.contentEquals(frame.senderID) == true
        val key = MeshDeduplicator.key(frame)

        // A duplicate arrival cancels our pending scheduled relay for the same
        // frame — someone else already flooded it.
        pendingRelays.remove(key)?.let { pending ->
            handler?.removeCallbacks(pending)
            return
        }
        if (dedup.isDuplicate(key) || senderIsSelf) return

        // relayVia: arrival TTL == originate TTL (7) means a direct neighbor.
        // A lower TTL means at least one relay hop — without announce packets
        // we can't name the last hop (the frame's senderID is the ORIGINATOR),
        // so we honestly report "mesh".
        val relayVia = if (frame.ttl == MeshConstants.ORIGIN_TTL) null else "mesh"
        onPacket?.invoke(frame.payload, relayVia)

        // Relay decision (TTL clamp + decrement + jitter), split horizon.
        val decision = MeshRelayController.decide(
            ttl = frame.ttl,
            senderIsSelf = senderIsSelf,
            degree = linkCount()
        )
        if (!decision.shouldRelay) return

        frame.ttl = decision.newTTL // relays rewrite ONLY the ttl
        val relayData = MeshFrameCodec.encode(frame)
        val relayRunnable = Runnable {
            pendingRelays.remove(key)
            if (running) sendFrame(relayData, excludedLinkId = linkId)
        }
        pendingRelays[key] = relayRunnable
        handler?.postDelayed(relayRunnable, decision.delayMs.toLong())
    }

    // MARK: - Status

    private fun linkCount(): Int = centralLinks.size + subscribers.size

    private fun emitStatusIfChanged(force: Boolean = false) {
        val count = linkCount()
        if (!force && count == lastReportedLinkCount) return
        lastReportedLinkCount = count
        onStatus?.invoke(count, count > 0)
    }

    // MARK: - Scanning (central role)

    private fun startScanningIfPossible() {
        if (!running || scanning) return
        val sc = adapter?.bluetoothLeScanner ?: run {
            Log.w(TAG, "BluetoothLeScanner unavailable")
            return
        }
        scanner = sc
        val filter = ScanFilter.Builder()
            .setServiceUuid(ParcelUuid(MeshConstants.SERVICE_UUID))
            .build()
        val settings = ScanSettings.Builder()
            .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY) // continuous — spike only
            .build()
        runCatching { sc.startScan(listOf(filter), settings, scanCallback) }
            .onSuccess { scanning = true }
            .onFailure { Log.w(TAG, "startScan failed", it) }
    }

    private val scanCallback = object : ScanCallback() {
        override fun onScanResult(callbackType: Int, result: ScanResult) {
            val device = result.device ?: return
            val rssi = result.rssi
            handler?.post { handleScanResult(device, rssi) }
        }

        override fun onScanFailed(errorCode: Int) {
            Log.w(TAG, "BLE scan failed: $errorCode")
        }
    }

    private fun handleScanResult(device: BluetoothDevice, rssi: Int) {
        if (!running) return
        val address = device.address ?: return
        if (centralLinks.containsKey(address) || pendingGatts.containsKey(address)) return
        if (centralLinks.size >= MeshConstants.MAX_CENTRAL_LINKS) return

        // RSSI gate: -90 dBm, relaxed to -95 when we have no links at all.
        val gate = if (linkCount() == 0) MeshConstants.RSSI_GATE_ISOLATED else MeshConstants.RSSI_GATE
        if (rssi < gate) return

        // 0.5 s connect rate-limit.
        val now = System.currentTimeMillis()
        if (now - lastConnectAttemptMs < MeshConstants.CONNECT_RATE_LIMIT_MS) return
        lastConnectAttemptMs = now

        val context = appContext ?: return
        val gatt = runCatching {
            device.connectGatt(context, false, gattClientCallback, BluetoothDevice.TRANSPORT_LE)
        }.getOrNull() ?: return
        pendingGatts[address] = gatt
    }

    // MARK: - GATT client (central role, talking to remote GATT servers)

    private val gattClientCallback = object : BluetoothGattCallback() {
        override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
            handler?.post {
                val address = gatt.device.address
                if (status != BluetoothGatt.GATT_SUCCESS) {
                    // Covers GATT_ERROR (133) and friends in any state — never
                    // leak the gatt in pendingGatts.
                    dropClientLink(address, gatt)
                } else if (newState == BluetoothProfile.STATE_CONNECTED) {
                    // Ask for 259 (256-byte frame + 3-byte ATT header); services are
                    // discovered from onMtuChanged. If the request can't even be
                    // issued, discover right away and fall back to with-response.
                    if (!runCatching { gatt.requestMtu(MeshConstants.DESIRED_MTU) }.getOrDefault(false)) {
                        runCatching { gatt.discoverServices() }
                    }
                } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                    dropClientLink(address, gatt)
                }
            }
        }

        override fun onMtuChanged(gatt: BluetoothGatt, mtu: Int, status: Int) {
            handler?.post {
                linkMtus[gatt.device.address] = if (status == BluetoothGatt.GATT_SUCCESS) mtu else 23
                runCatching { gatt.discoverServices() }
            }
        }

        override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
            handler?.post { handleServicesDiscovered(gatt, status) }
        }

        // Pre-33 devices deliver notifications here; on 33+ the framework calls
        // BOTH callbacks — bail so ingress isn't processed twice (a double
        // arrival would cancel our own just-scheduled relay).
        @Deprecated("Deprecated in Java")
        override fun onCharacteristicChanged(gatt: BluetoothGatt, characteristic: BluetoothGattCharacteristic) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) return
            if (characteristic.uuid != MeshConstants.CHARACTERISTIC_UUID) return
            @Suppress("DEPRECATION")
            val value = characteristic.value ?: return
            if (value.isEmpty()) return
            val data = value.copyOf()
            val linkId = gatt.device.address
            handler?.post { handleIngress(data, linkId) }
        }

        override fun onCharacteristicChanged(
            gatt: BluetoothGatt,
            characteristic: BluetoothGattCharacteristic,
            value: ByteArray
        ) {
            if (characteristic.uuid != MeshConstants.CHARACTERISTIC_UUID || value.isEmpty()) return
            val data = value.copyOf()
            val linkId = gatt.device.address
            handler?.post { handleIngress(data, linkId) }
        }
    }

    private fun handleServicesDiscovered(gatt: BluetoothGatt, status: Int) {
        val address = gatt.device.address
        if (status != BluetoothGatt.GATT_SUCCESS) {
            dropClientLink(address, gatt)
            return
        }
        val characteristic = gatt.getService(MeshConstants.SERVICE_UUID)
            ?.getCharacteristic(MeshConstants.CHARACTERISTIC_UUID)
        if (characteristic == null) {
            dropClientLink(address, gatt)
            return
        }

        pendingGatts.remove(address)
        centralLinks[address] = gatt
        centralCharacteristics[address] = characteristic

        // Subscribe: local notification routing + remote CCCD write.
        runCatching { gatt.setCharacteristicNotification(characteristic, true) }
        val cccd = characteristic.getDescriptor(MeshConstants.CCCD_UUID)
        if (cccd != null) {
            runCatching {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    gatt.writeDescriptor(cccd, BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE)
                } else {
                    legacySubscribe(gatt, cccd)
                }
            }.onFailure { Log.w(TAG, "CCCD write failed for $address", it) }
        }
        emitStatusIfChanged()
    }

    private fun dropClientLink(address: String, gatt: BluetoothGatt) {
        pendingGatts.remove(address)
        centralLinks.remove(address)
        centralCharacteristics.remove(address)
        linkMtus.remove(address)
        runCatching { gatt.close() }
        emitStatusIfChanged()
    }

    // MARK: - GATT server + advertising (peripheral role)

    private fun openGattServerIfPossible(context: Context) {
        val manager = bluetoothManager ?: return
        val server = runCatching { manager.openGattServer(context, gattServerCallback) }.getOrNull()
        if (server == null) {
            Log.w(TAG, "openGattServer failed")
            return
        }
        val characteristic = BluetoothGattCharacteristic(
            MeshConstants.CHARACTERISTIC_UUID,
            BluetoothGattCharacteristic.PROPERTY_READ or
                BluetoothGattCharacteristic.PROPERTY_WRITE or
                BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE or
                BluetoothGattCharacteristic.PROPERTY_NOTIFY,
            BluetoothGattCharacteristic.PERMISSION_READ or BluetoothGattCharacteristic.PERMISSION_WRITE
        )
        characteristic.addDescriptor(
            BluetoothGattDescriptor(
                MeshConstants.CCCD_UUID,
                BluetoothGattDescriptor.PERMISSION_READ or BluetoothGattDescriptor.PERMISSION_WRITE
            )
        )
        val service = BluetoothGattService(MeshConstants.SERVICE_UUID, BluetoothGattService.SERVICE_TYPE_PRIMARY)
        service.addCharacteristic(characteristic)
        runCatching { server.addService(service) }
        meshCharacteristic = characteristic
        gattServer = server
    }

    private fun startAdvertisingIfPossible() {
        if (!running || advertising || scanOnlyMode) return
        val adv = adapter?.bluetoothLeAdvertiser
        if (adv == null) {
            // Budget chipsets return null here (spike brief risk 6).
            enterScanOnlyMode("getBluetoothLeAdvertiser() == null")
            return
        }
        advertiser = adv
        val settings = AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
            .setConnectable(true)
            .setTimeout(0)
            .build()
        // Service UUID only: the 128-bit UUID uses 18 of 31 legacy adv bytes,
        // so device name / tx power must stay out (matches iOS advertisement).
        val data = AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .setIncludeTxPowerLevel(false)
            .addServiceUuid(ParcelUuid(MeshConstants.SERVICE_UUID))
            .build()
        runCatching { adv.startAdvertising(settings, data, advertiseCallback) }
            .onFailure { Log.w(TAG, "startAdvertising threw", it) }
    }

    private val advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
            handler?.post {
                if (!running) return@post
                advertising = true
                Log.i(TAG, "Advertising LOC8-MESH service")
            }
        }

        override fun onStartFailure(errorCode: Int) {
            handler?.post {
                if (!running) return@post
                advertising = false
                if (errorCode == ADVERTISE_FAILED_FEATURE_UNSUPPORTED) {
                    enterScanOnlyMode("ADVERTISE_FAILED_FEATURE_UNSUPPORTED")
                } else {
                    Log.w(TAG, "Advertising failed: $errorCode")
                }
            }
        }
    }

    /**
     * Degraded mode (brief risk 6): this chipset can't advertise, so peers
     * can't discover us — but we still scan, connect and relay as a client.
     * onMeshStatus keeps reporting real link counts; the mode is logged.
     */
    private fun enterScanOnlyMode(reason: String) {
        if (scanOnlyMode) return
        scanOnlyMode = true
        Log.w(TAG, "Scan-only degraded mode: $reason — undiscoverable, client links only")
        emitStatusIfChanged(force = true)
    }

    private val gattServerCallback = object : BluetoothGattServerCallback() {
        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
            if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                val address = device.address ?: return
                handler?.post {
                    if (subscribers.remove(address) != null) emitStatusIfChanged()
                }
            }
        }

        override fun onCharacteristicWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            characteristic: BluetoothGattCharacteristic,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray?
        ) {
            // Respond promptly on the binder thread; process on the mesh thread.
            if (responseNeeded) {
                gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, null)
            }
            if (preparedWrite) return // long writes never occur at frame size 256 ≤ MTU
            if (characteristic.uuid != MeshConstants.CHARACTERISTIC_UUID) return
            if (value == null || value.isEmpty()) return
            val data = value.copyOf()
            val linkId = device.address ?: return
            handler?.post { handleIngress(data, linkId) }
        }

        override fun onDescriptorWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            descriptor: BluetoothGattDescriptor,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray?
        ) {
            if (responseNeeded) {
                gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value)
            }
            if (descriptor.uuid != MeshConstants.CCCD_UUID) return
            val address = device.address ?: return
            val enable = value != null && value.size >= 2 &&
                value[0] == BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE[0] &&
                value[1] == BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE[1]
            handler?.post {
                if (!running) return@post
                if (enable) subscribers[address] = device else subscribers.remove(address)
                emitStatusIfChanged()
            }
        }

        override fun onCharacteristicReadRequest(
            device: BluetoothDevice,
            requestId: Int,
            offset: Int,
            characteristic: BluetoothGattCharacteristic
        ) {
            // Read is exposed for probing/debugging only; there is no "current value".
            gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, ByteArray(0))
        }

        override fun onDescriptorReadRequest(
            device: BluetoothDevice,
            requestId: Int,
            offset: Int,
            descriptor: BluetoothGattDescriptor
        ) {
            // Best-effort CCCD read: report "notifications off"; state is owned
            // on the mesh thread and this must answer promptly.
            val value = if (descriptor.uuid == MeshConstants.CCCD_UUID) {
                BluetoothGattDescriptor.DISABLE_NOTIFICATION_VALUE
            } else {
                ByteArray(0)
            }
            gattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, value)
        }
    }
}
