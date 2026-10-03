# Loc8 BLE: research to development

**Date:** 25 September 2026  
**Inspected baseline:** `f6b09a492c362f1c73b775d67721da1cc345fe91`  
**Scope:** public Loc8, Loc8 Guard, Loc8 Command and their shared engine.  
**Status:** first software-hardening increment implemented; physical radio hypotheses remain unproven.

This extends [mesh and resilience](mesh-and-resilience.md) and the existing
[experiment backlog](experiments.md). It does not replace their question IDs,
acceptance gates, security-review requirements or the building/floor programme.
The [implementation receipt](results/2026-09-25-mesh-hardening.md) distinguishes
changes actually made from work still proposed.

## 1. Product boundaries we retain

Public Loc8 remains a phone-to-phone friend-finder with no required account,
server, Internet connection or installed venue hardware. Guard and Command use
one shared `@loc8/engine`, not incompatible forks. Optional venue infrastructure
must improve operation without making the public app dependent on it.

The Gateway remains the site brain; an Anchor is a separate radio-extension
role. Multiple Gateway orchestration is not silently introduced by this work.
Command is not required to have its own Bluetooth radio. The existing degradation
principle remains: losing an upper layer must not deliberately disable the
lower phone layer. That is a design requirement, not newly established field evidence.

Loc8 supplements venue procedures. It is not a replacement for emergency
services, radios, public-address systems or trained staff. An alert queued or
submitted to a native API is not an alert received, acknowledged by a responder,
or acted upon.

## 2. What the repository actually says

| Finding at the pinned baseline | Evidence | Consequence |
|---|---|---|
| One shared engine serves the three apps. | `packages/engine/src/index.ts` | Fix common reliability once; keep app-specific presentation separate. |
| The application packet is 25 bytes. | `core/packetCodec.ts` | Preserve this format in the first increment. |
| The native iPhone implementation is a dual-role GATT mesh with advertising for discovery, six outbound central links and 47-byte native egress frames. | `modules/loc8-mesh/ios/MeshService.swift`, opening comments and implementation | A 25-byte logical packet is not the complete radio transaction. Do not describe current Loc8 as advertisement-only. |
| Native code already owns deduplication, hop budgets and relaying. | `transport/BleMeshTransport.ts`; native mesh sources | Do not create a second JavaScript relay scheduler that competes with it. |
| Native iPhone code currently uses full fanout and periodic scan restarts. | `MeshService.swift` | Controlled fanout is an experiment, not a missing framework requiring a rewrite. |
| Existing R&D already covers background behaviour, controlled fanout, security envelopes and courier delivery. | `mesh-and-resilience.md`; `experiments.md` | Extend the accepted programme rather than reset it. |
| Root README and the July AI briefing contain historical statements inconsistent with current code. | `README.md`; `docs/BRIEFING-FOR-AI.md` | Prefer pinned implementation evidence for what runs; preserve product intent separately. |

**Correction to previous conversational briefs:** GATT is not a newly proposed
replacement transport here; it is already part of the native implementation.
Nor does this work establish that every new user improves delivery, that
100 metres times seven hops gives a service guarantee, or that fixed Gateways
should replace the public phone mesh. The statement that GATT cannot support
application-level stranger relaying is not adopted as an engineering rule.

The earlier weekly briefs are research leads, not a verified requirements
baseline. A conference programme is not a performance result. A standards
roadmap is not a shipped phone API. Numerical claims and named 2026 papers not
independently checked below remain **unverified in this increment**.

## 3. Evidence ledger and decisions

The evidence below supports experiments, not Loc8 performance promises.

| ID | Source and evidence level | Supported conclusion | Development decision |
|---|---|---|---|
| E1 | Valenzuela-Perez et al., *A Study on Packet Error Rate in Bluetooth Mesh Networks With Relay Redundancy*, IEEE IoT Journal, 2025, DOI `10.1109/JIOT.2025.3556119`. Publisher record and author manuscript/abstract checked. | Additional relays can worsen reliability in some Bluetooth SIG Mesh topologies. The paper is not a test of Loc8's GATT implementation or locked phones. | Compare controlled fanout against the current native baseline, including sparse bridge-node failures. No default relay thinning yet. |
| E2 | Apple's archived *Core Bluetooth Background Processing for iOS Apps*. Official but historical platform guidance. | Background discovery, advertising and process lifetime have constraints. | Keep the existing physical background matrix. Do not infer current Live Activity or screen-off behaviour from this archive. |
| E3 | Android Developers, *Communicate in the background*, checked 25 September 2026. Official platform guidance. | Process lifetime and background execution constrain BLE work; connection availability cannot be assumed after process death. | Add lifecycle fault injection now; measure actual device/OS states before supported-state claims. |
| E4 | IETF RFC 9171, Bundle Protocol Version 7, January 2022. Standards reference, not a Loc8 implementation. | Message lifetime and age are distinct from forwarding hop limits. | Give local fragment assembly an elapsed-time budget now. Design authenticated courier freshness separately; do not insert Bundle Protocol wholesale into 25-byte frames. |
| E5 | Silicon Labs Bluetooth Mesh 1.1 network-performance documentation. Vendor test methodology, dedicated hardware. | Payload, topology and traffic configuration belong in a reproducible performance evaluation. | Reuse measurement discipline, not advertised node counts or latency as phone-network guarantees. |
| E6 | Exact Expo SDK 57 documentation requested by `AGENTS.md`. | Repository-specific framework baseline must be respected. | No Expo, React Native or package-version upgrade in this patch. |

Primary links:

- E1: https://ieeexplore.ieee.org/document/10945757/ ; author manuscript: https://www.researchgate.net/publication/390362449_A_Study_on_Packet_Error_Rate_in_Bluetooth_Mesh_Networks_With_Relay_Redundancy
- E2: https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/CoreBluetoothBackgroundProcessingForIOSApps/PerformingTasksWhileYourAppIsInTheBackground.html
- E3: https://developer.android.com/develop/connectivity/bluetooth/ble/background
- E4: https://www.rfc-editor.org/rfc/rfc9171.html
- E5: https://docs.silabs.com/btmesh/latest/btmesh-11-network-performance/
- E6: https://docs.expo.dev/versions/v57.0.0/

Privacy and hostile-input handling remain engineering requirements without
relying on unverified re-identification percentages or a particular SDK CVE.
This patch does not audit or implement cryptographic identity, payload
confidentiality, authentication, key rotation or a secure Command bridge.

## 4. First implementation increment

### Packet ingress

Reject declared fragment lengths above 11 instead of silently truncating them.
Reject impossible fragment counts and sequence indices. Reject out-of-range
coordinates, headings and battery values in their applicable packet types.
Keep consumer and operational reply codes, signed floor packing and all valid
legacy packet encodings unchanged.

The checks occur at JavaScript decode/reassembly boundaries. They do **not**
prove that the native pre-decode forwarding path rejects every hostile frame.
Native framing/parser fuzzing is a separate work item.

### Bounded message assembly

Validate direct transport input as well as decoded radio input. Partition
partials by packet type, sender, target and message ID. Bound each message to
160 bytes and each profile to 48 bytes, retaining the existing default capacity
of 32 partials per reassembler. Copy incoming bytes. Reject contradictory
fragments and malformed complete UTF-8 instead of silently constructing mixed
messages or reaching an unsafe fallback decoder.

Expire incomplete assemblies after a configurable **60 seconds from first local
receipt**, with an injected elapsed clock for tests. This is an initial software
budget, not a measured delivery SLA or sender timestamp limit. Repeated copies
do not refresh it. Clock rollback clears partial state. Cleanup is lazy on
`add()` or explicit through `pruneExpired()`; no hidden timer or persistent
storage is added. Idle state remains bounded by capacity. A future native
cohort may justify changing the timeout, through an explicit result and tests.

This does not turn old position packets into current positions. Position
freshness and the existing generous offline-clock trust policy are unchanged.
The legacy 16-bit message ID still cannot distinguish all same-ID/same-count
reuses, nor provide authentication. Completed-message replay policy remains in
`meshService`; buffer isolation is not a complete cross-session replay solution.

### BLE transport lifecycle

Tag each start/stop generation. Ignore events and asynchronous start failures
from old generations so a late rejection cannot disconnect a healthy restart.
Make `clearListeners()` follow its contract: clear application callbacks while
native subscriptions remain owned by the running lifecycle. Report broadcast
failures in existing diagnostics. The `sent` counter remains attempts, not
physical transmissions or delivery receipts.

No native Swift/Kotlin radio tuning, packet type changes, feature flags for
experimental routing, new SDKs, server dependencies, UI redesign or deployment
are included.

## 5. Product-facing development sequence

| Workstream | Public Loc8 | Guard | Command / Loc8OS | Promotion gate |
|---|---|---|---|---|
| R0: shared hardening | Safer friend/profile/message reception; restart recovery. | Same shared protections for staff traffic. | Same engine where imported; no UI claims. | Scoped automated checks now; full repo and native builds before merging. |
| R1: observed freshness | Distinguish recent, ageing, unavailable and clock-uncertain positions. | Show age of staff positions without erasing incident history. | Display observation source, age and confidence separately; unknown is not healthy. | Fake-clock/replay tests plus integration tests proving old input never becomes labelled live merely because it arrived now. |
| R2: delivery evidence | Avoid false sent/received promises for pings. | Separate queued, locally submitted, transport-confirmed and responder-acknowledged states. | Persist accurately scoped receipts; never infer responder action from a relay acknowledgement. | Inject loss, timeout, duplicate and out-of-order receipts; prevent false delivery transitions. |
| R3: density and fanout | Compare coverage and battery without sacrificing sole-bridge phones. | Keep incident traffic protected by bounded fairness, not unlimited priority flooding. | Expose queue age and drops; retain native policy ownership. | `SEC-01 E06` controlled-fanout spike and `MESH-01 E01` baseline repeat. Promote only a measured improvement. |
| R4: interrupted delivery | Consider expiring/collapsing superseded position updates. | Bound retained incident/control traffic and retries. | Gateway/Anchor roles and outage recovery remain separate. | Versioned authenticated message identity, privacy review, explicit retention and scope before persistent courier storage. |
| R5: privacy and firmware | No new public persistent identifiers. | Site/shift authorisation and reviewed identity. | Fuzz native parsers; reviewed signing/storage providers; no fake cryptography. | Existing security gates and independent review before production security claims. |

**Next implementation priority after R0:** a shared observation-freshness contract
and its actual Consumer/Guard/Command integrations. First inspect existing
`crewStore`, Guard/Command selectors and any existing time/source fields; do not
create a parallel position model. Receipt-state work follows after its wire and
security semantics are specified. No new release date is implied.

## 6. Physical research programme

**Preserve `MESH-01 E01` unchanged:** three phones, A and C isolated from direct
reception, B relaying between them. At least 95% of 200 small control packets
within 10 seconds, no duplicate application delivery and evidence of the relay
in both directions. Include B-absent controls. This is a baseline test criterion,
not an existing product result. Retain the original experiment protocol and
record any deviations rather than silently relaxing it.

**Extend `MESH-02/MESH-03 E02`:** report each phone model, OS, build, foreground,
background, locked, low-power and restart condition independently. Include
permission denial/recovery and 8 to 12 hour shift-battery cohorts. Do not average
unsupported locked-phone states into a successful aggregate.

**Extend `SEC-01 E06` controlled fanout:** compare the current full-fanout policy
against feature-flagged bounded selection on identical topology/traffic seeds.
Start with sparse line, clustered crowd, bottleneck bridge, mobility, asymmetric
links, queue pressure and incident bursts. Measure unique valid deliveries,
p50/p95 latency, drops by reason, duplicate ratio, queue age, memory and battery.
Software send counts are not measured airtime. Use packet captures or suitable
radio instrumentation where airtime claims are made. Include all originators,
profile announcements, fragments, retries and native framing in offered load.

Do not select a relay fraction from a paper alone. Before enabling a new default,
preregister the tolerated delivery/latency change and desired transmission/energy
improvement, preserve sole bridges in adversarial topologies, and repeat physical
cohorts. Keep existing TTL behaviour as the baseline unless a separate versioned
experiment explicitly changes it.

**Extend `RADIO-01 E07`:** measure phone-to-Anchor uplink separately from
Anchor-to-phone downlink. Record height, placement, orientation, body/pocket
conditions, walls, range and legal radio configuration. Test Anchor loss and
Gateway/LAN loss independently. Hardware-assisted results cannot be presented
as infrastructure-free coverage results.

Every result includes the existing experiment/version, frozen gate, code/build
and equipment versions, consent/site authority, raw-data location and hash,
cohort distributions, failures, deviations and adopt/adapt/repeat/stop decision.
Do not put identifiable crowd captures or location traces into the source repo.

## 7. What remains unproved

No three-phone relay result, crowd capacity, range guarantee, battery result,
locked-phone support matrix, manufactured Gateway, security certification or
validated location accuracy is produced by this software increment. A passing
hostile-input test corpus is not a security audit. Research becomes a default
only after a reproducible result and explicit promotion decision.
