# Loc8 v2 Mesh Spike Brief — Real BLE Transport
2026-07-07 · Synthesized from three deep-dives (bitchat protocol @ v1.5.4, Expo native module path, Bridgefy fallback). All claims verified against July 2026 sources cited inline.

---

## 1. Spike goal & success criteria

**Prove or disprove:** two physical phones (1 iPhone + 1 Android) exchange Loc8's 25-byte position packets (`src/core/packetCodec.ts`) over BLE using a bitchat-style GATT mesh, including **at least one relay hop** (3rd phone), behind the existing `LocationTransport` interface (`src/transport/LocationTransport.ts`) with **zero UI changes**.

**Non-negotiable facts shaping the design** (verified in bitchat v1.5.4 source + Apple docs):
- The 25-byte packet **cannot ride a BLE advertisement** — legacy adv payload is 31 bytes and a 128-bit service UUID eats 18. Advertisements carry the service UUID only; packets move over a GATT characteristic (write-without-response inbound, notify outbound).
- A **backgrounded iPhone's advertisement lands in Apple's proprietary "overflow area"** — discoverable only by iOS centrals explicitly scanning for that UUID, **invisible to Android scanners**. Established GATT links survive backgrounding. This confirms Loc8's Screen-On Relay design; the spike must measure it, not hide it.

**Success = all of:**
1. iPhone ↔ Android, both foregrounded, exchange decoded 25-byte packets end-to-end (Radar shows the peer) — delivery ≥ 90% of packets within 10 s at ~20 m line-of-sight over a 5-minute session.
2. Relay hop: phones A and C out of direct BLE range, B in the middle relays; ≥ 70% of A's packets reach C.
3. Time-to-first-packet after both apps open < 15 s.
4. Honest background matrix (fill in during field test):

| Scenario | Expected (from research) | Measured |
|---|---|---|
| iOS FG ↔ Android FG | Works (baseline) | |
| iOS FG ↔ iOS FG | Works | |
| Android FG ↔ Android FG | Works | |
| iOS **BG** → Android (no prior link) | **FAILS discovery** (overflow area) | |
| iOS **BG** → Android (link established while FG) | Link survives; delivery continues, throttled | |
| iOS BG → iOS FG (scanning for our UUID) | Works (overflow-area scan) | |
| Android BG (FGS running) → any | Works (connectedDevice FGS, no timeout) | |
| iOS BG ↔ iOS BG | Degraded; ~10 s execution per BLE wake, coalesced discoveries | |
| Battery drain, 1 h FG session | Target < 8%/h | |

---

## 2. Architecture

**Local Expo native module `loc8-mesh`** + a thin TS transport wrapper. Native side owns framing, dedup, TTL and relay (so the mesh keeps relaying when the JS engine is asleep); JS sees only clean 25-byte payloads.

```
src/transport/BleMeshTransport.ts   implements LocationTransport (start/stop/broadcast/onPacket/onMeshStatus/clearListeners)
        │  encodePacket() → Uint8Array(25)          decodePacket(Uint8Array) ← existing trustLayer dedupe/replay path unchanged
        ▼
modules/loc8-mesh/                  scaffold: npx create-expo-module@latest --local  (name: loc8-mesh)
 ├─ expo-module.config.json         {"platforms":["apple","android"],"apple":{"modules":["Loc8MeshModule"]},"android":{"modules":["expo.modules.loc8mesh.Loc8MeshModule"]}}
 ├─ src/index.ts                    requireNativeModule<Loc8MeshModule>('Loc8Mesh'); Events("onPacket","onMeshStatus")
 ├─ ios/Loc8MeshModule.swift        ADAPTED from bitchat's Unlicense code (BinaryProtocol.swift, BitchatPacket.swift,
 │                                  MessagePadding.swift, RelayController.swift, MessageDeduplicator.swift — public domain, copy freely)
 │                                  CBCentralManager (scan) + CBPeripheralManager (advertise + GATT server) concurrently;
 │                                  restore IDs: me.loc8.ble.central / me.loc8.ble.peripheral + willRestoreState
 └─ android/…/Loc8MeshModule.kt     REIMPLEMENTED from WHITEPAPER.md v2.0 + the Unlicense Swift as reference.
                                    NEVER open bitchat-android (GPL-3.0). Wire formats aren't copyrightable and a
                                    public-domain reference exists, so this is license-clean without clean-room ceremony.
                                    BluetoothLeAdvertiser + BluetoothLeScanner + openGattServer() coexist; guard
                                    isMultipleAdvertisementSupported() → scan-only degraded mode surfaced via onMeshStatus.
```

**Module API** (Uint8Array ↔ Data/ByteArray convertibles are built into the Expo Modules API — packetCodec output crosses the bridge natively):
- `AsyncFunction start()` / `stop()` — idempotent (mirror SimulatedTransport lifecycle, commit baa9073)
- `AsyncFunction broadcast(packet: Uint8Array)` — native wraps in bitchat framing, writes to all links + notifies subscribed centrals
- `sendEvent("onPacket", { data: Uint8Array(25), relayVia?: string })` — post-dedup/TTL-guard ingress only
- `sendEvent("onMeshStatus", { nearbyCount, connected })` — distinct GATT peer links

**Config (no config plugin needed):**
- app.json `ios.infoPlist`: add `"UIBackgroundModes": ["bluetooth-central", "bluetooth-peripheral"]` (NSBluetoothAlwaysUsageDescription already present)
- app.json `android.permissions`: add `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_CONNECTED_DEVICE` (BLUETOOTH_SCAN/ADVERTISE/CONNECT already present; do **not** add `neverForLocation` — we hold ACCESS_FINE_LOCATION and may use RSSI proximity)
- `modules/loc8-mesh/android/src/main/AndroidManifest.xml`: `<service android:name=".Loc8MeshService" android:exported="false" android:foregroundServiceType="connectedDevice"/>` — Gradle manifest-merger folds it in. connectedDevice has **no** Android 15/16 FGS timeout; start it while foregrounded (session start).
- Transport factory: `EXPO_PUBLIC_TRANSPORT=ble|sim` where SimulatedTransport is constructed today.

---

## 3. Wire protocol decision

**Adopt bitchat v1 framing verbatim, on our OWN service UUID** (private mesh — cleanest, no dependence on bitchat's unguaranteed unknown-type relay). Keep full bitchat wire compatibility so piggybacking public bitchat meshes stays a one-constant stretch test.

**UUIDs (Loc8 private mesh, same in DEBUG and Release):**
- Service: `4C4F4338-4D45-5348-B1E5-4C4F43384D01`  ("LOC8-MESH")
- Characteristic: `4C4F4338-4D45-5348-B1E5-4C4F43384D02` — properties `[notify, write, writeWithoutResponse, read]`; Android adds CCCD `00002902-0000-1000-8000-00805f9b34fb`
- (Stretch/piggyback only: bitchat mainnet `F47B5E2D-4A9E-4C5A-9B3F-8E1D2C3A4B5C`; its testnet `…4B5A` is iOS-DEBUG-only — never mix.)

**Frame (bitchat v1, big-endian):** `version(1)=0x01 | type(1)=0x30 | ttl(1) | timestamp(8, UInt64 ms since epoch) | flags(1)=0x00 | payloadLength(2)=25 | senderID(8) | payload(25 bytes = our packet, unchanged)`
- Type **0x30** = Loc8 location packet (clear of bitchat's 0x01–0x28 range).
- Flags 0x00: no recipient (= broadcast), **unsigned**, uncompressed (zlib threshold is 100 B — never triggers). Our targetId lives inside the 25-byte payload; the mesh stays dumb-broadcast like SimulatedTransport.
- senderID(8) = `0x4C4F4338` ("LOC8") ‖ uint32 senderId (BE) — marks our traffic and keys dedup per sender.
- Raw frame = 14 + 8 + 25 = **47 bytes**, PKCS#7-padded to **256** on the wire (bitchat MessagePadding block sizes 256/512/1024/2048 — keep it for bitchat-compat; single GATT write, no fragmentation ever at this size; negotiated MTU up to 512).
- **Header timestamp is stamped fresh (now, ms) at every originate — including every re-broadcast of a rally pin** — because dedup keys on it. Loc8's in-payload `timestampSec` is untouched.

**Relay/flood (port of RelayController.swift):** originate TTL = **7**. Drop if `ttl<=1`, self-sent, or addressed to self. Broadcast TTL clamp by local degree: ≥6 links → min(ttl,5); ≤2 → full ttl; else min(ttl,6); then decrement. Jitter before rebroadcast: 10–40 ms (degree ≤2), 60–150 ms (3–5), 80–180 ms (6–9), 100–220 ms (10+). Split horizon (never relay to ingress link); ~log2(degree) message-ID-seeded fanout.

**Dedup & guards (port of MessageDeduplicator + BLEIngressPacketGuard):** LRU **1000 entries / 300 s**, key = `senderHex-timestampMs-type-first4BytesOfSHA256(payload)`; duplicate arrival cancels a pending scheduled relay. Ingress rejects timestamp skew > **±120 s** and broadcasts older than **900 s** — devices with drifted clocks silently vanish; surface a clock-skew warning in MeshStatus if feasible.

Announce (0x01)/Noise/fragments/sync: **not implemented in the spike.** nearbyCount = live GATT link count. RSSI gates from bitchat: −90 dBm discovery default (−95/−100 when isolated), max 6 central-role links, 0.5 s connect rate-limit.

---

## 4. Build & test plan

**iOS (local, Xcode 16.2 + CocoaPods — sufficient for SDK 57):**
```bash
npx create-expo-module@latest --local          # name: loc8-mesh
npx expo prebuild --clean                      # after every app.json change — stale config ships silently otherwise
npx expo run:ios                               # simulator = COMPILE VERIFICATION ONLY (CoreBluetooth links but CBCentralManager → .unsupported at runtime)
npx expo run:ios --device                      # functional testing: physical iPhone(s)
```
**Android (no local SDK — EAS cloud):**
```bash
npm i -g eas-cli && eas login && eas build:configure
# eas.json development profile: "developmentClient": true, "distribution": "internal", "android": {"buildType": "apk"}
npx expo install expo-dev-client
eas build --platform android --profile development   # local modules/ dir uploads with the repo; compiles in cloud, no extra config
```
Sideload the APK from the build page. Google Play requires targetSdk 36 (April 2026) — Android 16 FGS job-quota rules apply from day one (connectedDevice unaffected). Expo Go is dead for this module; all dev on dev-client builds.

**On-device test script (2 phones minimum, 3 for the relay hop):**
1. **Smoke (2 phones, FG↔FG):** iPhone + Android, both app-open on Radar, ~5 m apart. Verify each sees the other within 15 s; walk to ~20 m; log delivery % over 5 min (add a debug packet counter behind `EXPO_PUBLIC_TRANSPORT=ble`).
2. **Relay hop (3 phones):** A and C at opposite ends beyond BLE range (~60–80 m outdoors or separate floors), B midway. Confirm C decodes A's packets with `relayVia` = B; kill B's app and confirm A↔C loss.
3. **Background matrix:** run every row of the §1 table; for iOS-BG rows, establish the link foregrounded first, then background and measure continued delivery for 5 min; then force-quit and measure rediscovery.
4. **Rally re-broadcast:** drop a rally pin, confirm re-broadcasts arrive (header-timestamp bump prevents dedup swallowing them).
5. **Battery:** 1 h foreground session, both platforms, screen on, note %/h.
6. **Stretch:** flip service UUID const to bitchat mainnet near a phone running public bitchat; observe whether type 0x30 gets relayed (expected yes on iOS v1.5.4 — unguaranteed behavior, informational only).

---

## 5. Go / no-go gates

**GO (adopt bitchat-path for v2)** if within a **5-working-day timebox**: gates 1–3 of §1 pass, AND iOS-BG-with-established-link keeps delivering, AND no unfixable Expo-module/BLE blocker surfaced.

**NO-GO → pivot to Bridgefy** if any of: no cross-platform packet exchange by end of day 3; relay hop unachievable by day 5; dual-role BLE proves unstable on target devices (connect-loop, GATT server crashes) with no clear fix.

**Hedge (do on day 1 regardless):** email `contact@bridgefy.me`, subject "Pricing" (per-MAU, contact-sales only, one-time-event pricing exists — festival-relevant; community reports slow replies, issue #80). Licensing turnaround, not code, is the pivot's critical path. Register at `developer.bridgefy.me` for a free **Sandbox** API key now.

**Bridgefy pivot steps (3–5 working days to a two-phone build):**
1. `npx expo install bridgefy-react-native` (1.2.4, TurboModule; pins iOS pod BridgefySDK ~>1.3.6, Android me.bridgefy:android-sdk:1.2.7 from private `https://maven.bridgefy.me`).
2. `src/transport/BridgefyTransport.ts` (~150–200 lines): `initialize(apiKey, verbose, HYBRID)` + `start(userId?, HIGH_DENSITY_NETWORK)` → start(); `sendBroadcast()` → broadcast(); `onReceiveData` → onPacket; `onConnectedPeers` → onMeshStatus. **The JS bridge is string-only UTF-8 (verified in native source) — base64-encode encodePacket() output (25 B → 36 chars) or packets corrupt.** `relayVia` = undefined (hop identity not exposed).
3. `plugins/withBridgefyAndroid.ts` (~80 lines, templates in wrapper issue #43): BridgefyService (`foregroundServiceType="dataSync"`) + FGS permissions + `com.bridgefy.sdk.API_KEY` meta-data; `expo-build-properties` with `android.extraMavenRepos: ["https://maven.bridgefy.me"]` + desugaring. No official Expo plugin exists.
4. app.json: add `NSBluetoothPeripheralUsageDescription` + `UIBackgroundModes: ["bluetooth-central"]`.
5. Onboarding copy: each phone needs internet **once** to activate the license (40-day offline window after; SDK self-disables at day 40 offline).

---

## 6. Risks & mitigations (merged, deduped)

| # | Risk | Mitigation |
|---|---|---|
| 1 | **GPL-3 contamination** — reading bitchat-android while writing our Kotlin | Hard rule: whitepaper + Unlicense Swift only. Delete cached android files at `/private/tmp/claude-501/…/scratchpad/bitchat/` before implementation starts. |
| 2 | **iOS overflow-area asymmetry** — backgrounded iPhones invisible to Android; structural, Bridgefy hits the same wall | Screen-On Relay UX (already Loc8's plan); establish links foregrounded; measure honestly in the §1 matrix. Re-verify per iOS major (behavior documented only in an archived Apple guide, confirmed unchanged July 2026). |
| 3 | **iOS background execution ≈ 10 s per BLE wake**, coalesced discoveries, slowed intervals | Single-write 47→256 B packets complete well inside a wake; state restoration (restore IDs + willRestoreState) re-arms scan/advertise. |
| 4 | **Timestamp/dedup discipline** — reused header timestamp = dropped as duplicate for 5 min; >±120 s clock skew = silent mesh exile | Fresh ms header timestamp on every originate/re-broadcast (spec'd in §3); surface skew in MeshStatus. |
| 5 | **Native-module complexity dominates schedule** — dual-role BLE + restoration is beyond react-native-ble-plx; this is the spike's core unknown | Hard 5-day timebox with day-3 cross-platform checkpoint (§5); port, don't invent (Unlicense reference exists). |
| 6 | **Budget Android chipsets can't advertise** (`getBluetoothLeAdvertiser()` null / ADVERTISE_FAILED_FEATURE_UNSUPPORTED) | Scan-only degraded mode; surface via onMeshStatus. |
| 7 | **EAS iteration latency** (no local Android SDK) | Batch Kotlin changes; get a compile-green Android build in cloud on day 1; do protocol debugging iPhone↔iPhone locally first. |
| 8 | **Stale native config** — `run:ios` auto-prebuilds only when `ios/` is absent | Always `npx expo prebuild --clean` after app.json/module-config changes; keep `/ios`,`/android` gitignored (CNG). |
| 9 | **bitchat ships weekly; unknown-type relay + wire details could drift** | We run our own UUID — zero runtime dependence on bitchat peers. Pin protocol semantics to v1.5.4/whitepaper v2.0 in code comments; piggyback is stretch-only. |
| 10 | **Bridgefy pivot gated on licensing + single-vendor fragility** (contact-sales pricing, slow email; maven.bridgefy.me down twice Mar 2026; open Android FGS-timeout crash #77; RN 0.86 > tested 0.83.6) | Email day 1 (§5); Sandbox key for testing; if committing, mirror the AAR and A/B HIGH_DENSITY_NETWORK vs REALTIME profiles; budget a compile-fix day. |
| 11 | **First-launch online activation (Bridgefy only)** — 40-day offline window | Onboarding copy: open the app once at the gate before signal dies. |

**Key sources:** bitchat v1.5.4 (Unlicense) `BLEService.swift` / `BinaryProtocol.swift` / `RelayController.swift` / `MessageDeduplicator.swift` / `WHITEPAPER.md` v2.0 — github.com/permissionlesstech/bitchat · bitchat-android v1.7.4 (GPL-3.0, UUID/manifest reference only) · Apple Core Bluetooth background guide (overflow area, state restoration) — developer.apple.com/library/archive/…/PerformingTasksWhileYourAppIsInTheBackground.html · Expo Modules API + local modules — docs.expo.dev/modules/get-started/ · Android BLE permissions & FGS types — developer.android.com/develop/connectivity/bluetooth/bt-permissions, …/services/fg-service-types · bridgefy-react-native 1.2.4 — github.com/bridgefy/bridgefy-react-native (issues #42/#43/#77/#80) · Bridgefy pricing — bridgefy.notion.site/Bridgefy-SDK-Pricing-22cf443f5ef680039882cd88cedac706
