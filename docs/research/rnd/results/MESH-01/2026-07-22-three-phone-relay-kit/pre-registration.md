# MESH-01 preregistration — physical three-phone relay

**Frozen:** 2026-07-22, at Loc8 commit `9afbf85`, before the MESH-01 field-kit
prototype, diagnostic adapter or physical measurement

**Question:** `MESH-01`, with later evidence for `MESH-02`, `MESH-04`,
`MESH-05`, `MESH-07` and `X-01`

**Experiment:** `E01`, protocol `mesh-01.e01.v1`

**Decision unlocked:** whether the current foreground phone BLE implementation
has a reproducible one-relay capability worth continuing as `GO`, only a bounded
or platform-specific capability (`LIMITED`), or no useful relay capability under
the tested baseline (`NO-GO`)

## Research question

Can physical phone A deliver a unique Loc8 frame to physical phone C only when
physical phone B is running as the intermediate BLE relay, with the same frame
identity visible in B's ingress/forward evidence, a decremented TTL at C, no
direct A↔C link/delivery in bracketed isolation controls, and no duplicate
application delivery?

Two-phone exchange does not answer this question. A simulator, unit test,
console screenshot, `relayVia` label or three mutually connected phones does not
answer it either. The evidence must distinguish an actual A→B→C path from direct
A→C reception.

## Pre-registered hypotheses

1. The foreground iOS implementation can relay over one physical intermediate
   phone when A and C are radio-isolated but each can communicate with B.
2. Current counter-only diagnostics are insufficient to prove the path. A
   bounded structured event stream with stable frame IDs, TTL, local monotonic
   time, action and non-identifying link handle is required.
3. At the current uncrowded one-frame-per-second rate, at least 95% of 200 frames
   per direction will arrive within 10 seconds and no frame will be delivered to
   the application more than once.
4. Direct A↔C isolation will be reproducible both before and after the relay
   blocks. If isolation disappears after the relay run, the relay result is
   confounded rather than passed.
5. Mixed-platform and background operation will remain separate cohort
   decisions. An iOS foreground pass cannot be generalised to Android, locked,
   background, crowd, wall, battery or venue behaviour.

## Evidence inspected before freezing

### Current Loc8 source

- iOS `Loc8MeshModule`, `MeshService`, frame codec, deduplicator, relay
  controller and constants;
- Android `Loc8MeshModule`, foreground service, `MeshBleService`, frame codec,
  deduplicator, relay controller, permissions and manifest;
- the TypeScript native-module bridge, `BleMeshTransport`, debug store/HUD,
  packet codec, trust layer and mesh service;
- existing unit tests and the older two-phone field protocol; and
- the prior SEC-01/SEC-05 protocol, framing and security boundaries.

The current wire is a 47-byte unencrypted research frame: version, message type,
TTL, wall-clock timestamp, flags, payload length, eight-byte origin handle and
25-byte Loc8 payload. Origin TTL is 7. Relays decrement TTL after a degree clamp,
apply jitter, deduplicate and use split horizon. The implementation reports only
aggregate peers/sent/received/dropped to the HUD and a coarse `relayVia="mesh"`;
it does not yet preserve the path evidence required below.

### SDK 57 implementation constraint

Before changing the module, the team read the Expo SDK 57 reference and current
Expo Modules event API. SDK 57 targets React Native 0.86, Android 7+/API 36 and
iOS 16.4+, and a native-module change requires a rebuilt development build.
The module API registers native event names with `Events(...)`, sends map/dictionary
payloads with `sendEvent`, and TypeScript subscribes through the native module's
`addListener`. These docs constrain the adapter; they do not prove BLE behaviour.

References:

- <https://docs.expo.dev/versions/v57.0.0/>
- <https://docs.expo.dev/versions/v57.0.0/sdk/expo/>
- <https://docs.expo.dev/modules/module-api/>
- <https://docs.expo.dev/develop/development-builds/introduction/>

## Scope

### Included in kit preparation

1. A strict `loc8.mesh-field-evidence.v1` JSONL schema and validator.
2. A deterministic evaluator that joins frame IDs across A/B/C, calculates
   delivery, latency, duplicates, TTL, direct-control leakage and relay proof,
   and returns `GO`, `LIMITED`, `NO-GO`, `CONFOUNDED` or `INCOMPLETE` without
   silently discarding invalid events.
3. Synthetic pass/fail/confounded fixtures used only to validate the evaluator.
4. Bounded diagnostic instrumentation for origin, ingress, duplicate,
   relay-scheduled, relay-cancelled, relay-forwarded, application-delivery,
   link-state and drop-reason events.
5. An operator runbook, hardware/build manifest, topology diagram, clock-sync
   procedure, privacy checklist, raw-bundle hashing and exact export/evaluation
   commands.
6. Native compile/type/unit/regression checks possible without devices.

### Included in physical MESH-01

- three permissioned physical phones in a static uncrowded baseline;
- foreground, screen-on operation only;
- iOS/iOS/iOS first, followed by separately labelled available mixed-platform
  cohorts rather than pooled results;
- near controls, A↔C isolation controls, A→B→C and C→B→A blocks;
- two independently started 100-frame relay blocks per direction, for 200 per
  direction total; and
- bracketed direct-isolation controls before and after relay measurement.

### Excluded

- encryption, authentication, authorisation or privacy claims;
- background, locked, terminated, low-power or long-shift operation;
- crowd, body, pocket, wall, multi-floor or competing-radio claims;
- two relays, moving relays, store-and-forward or congestion capacity;
- Android support inferred from iOS or vice versa;
- range, battery, venue coverage, safety or pilot-readiness claims; and
- MeshCore, LoRaMesher, Gateway or custom-hardware selection.

Those are later preregistered cohorts under `MESH-02`–`MESH-05` and `RADIO-01`.

## Hardware, build and data prerequisites

The physical run must not start until the raw manifest records:

- three device labels A/B/C; model, OS build, BLE capability and battery state;
- Loc8 Git commit, app semantic/build version, Expo/React Native version and
  native build identifier on each phone;
- transport/wire/diagnostic schema versions and identical service UUIDs;
- assigned synthetic sender IDs and device roles;
- Bluetooth, location and foreground-service permission state;
- site authority, operator names or pseudonymous IDs, start/end time and an
  explicit statement that no uninvolved-person data is intentionally captured;
- measured A-B, B-C and A-C placement, height/orientation and physical barriers;
- local monotonic/wall-clock sync observations and uncertainty;
- the encrypted/access-controlled raw bundle location, retention owner and
  planned deletion date; and
- SHA-256 for every exported raw file before interpretation.

Use synthetic packet payloads only. Do not record GPS positions, names, crew
messages, MAC addresses, advertising identifiers or raw persistent platform link
identifiers. Diagnostic link handles must be run-scoped hashes.

## Frozen event contract

Every JSONL line contains:

```text
schema                 "loc8.mesh-field-evidence.v1"
runId                  8–64 lowercase ASCII [a-z0-9-]
cohortId               declared manifest cohort
blockId                declared near/isolation/relay block
deviceRole             A | B | C
eventIndex             strictly increasing uint32 per device export
monotonicNs            non-negative decimal string, monotonic per boot/export
wallTimeMs             safe non-negative integer; correlation only
action                 declared event enum
frameId                64 lowercase hex when frame-related
sequence               0..99 for originated field frames, otherwise null
originRole             A | C when known, otherwise null
ttlBefore              0..7 or null
ttlAfter               0..7 or null
linkHandle             16 lowercase hex or null; run-scoped and non-reversible
reason                 bounded declared reason or null
payloadBytes           25 for a decoded Loc8 payload, otherwise null
wireBytes              47 for this raw-frame cohort, otherwise null
```

Allowed actions are:

```text
diagnostics-started, link-up, link-down, origin,
ingress, duplicate-drop, stale-drop, future-drop, malformed-drop,
relay-scheduled, relay-cancelled, relay-forwarded,
application-delivery, egress-skipped, diagnostics-stopped
```

The diagnostic buffer must be bounded and report overflow as a fatal evidence
condition. It may observe the research path but must not change relay timing,
dedup keys, TTL, payload or provider behaviour. A native event callback alone is
not the durable record; the operator must export and hash each device's bounded
snapshot immediately after each block.

## Physical method

### 0. Preflight and near controls

1. Build/install the same labelled native development build on A/B/C; disable IP
   bridge and simulation; put all apps foreground/screen-on.
2. Set roles and synthetic IDs, start fresh diagnostics, and verify zero prior
   events/frames.
3. Place A-B, B-C and A-C near in turn. Send 10 frames per direction for each
   pair. Each pair must deliver 10/10, the frame IDs must join, and exported
   diagnostics must have no overflow/invalid lines.
4. Verify stop/start clears live links and creates a new block boundary without
   reusing a frame ID.

### 1. Establish A↔C isolation

With B's mesh stopped and its Bluetooth disabled, place A and C in the fixed
test positions. Confirm for at least 60 seconds that neither has an A↔C link.
Send 50 sequenced frames A→C and 50 C→A at one frame/second. Require zero
application deliveries and zero direct link-up events. Export/hash both devices.

The chosen isolation mechanism may be distance, shielded rooms/barriers or an
RF-controlled layout, but the exact geometry and method must be recorded. A
software recipient filter, ignoring received frames, arbitrary RSSI threshold or
post-hoc log deletion does not prove radio isolation.

### 2. Relay blocks

Keep A and C fixed. Place/enable B so A-B and B-C are live while A-C remains
absent.

Run these independently, resetting diagnostics between blocks but not changing
geometry:

1. `relay-a-c-1`: A originates sequences 0–99 at one/second.
2. stop/start the three mesh instances and re-establish only A-B/B-C links.
3. `relay-c-a-1`: C originates sequences 0–99 at one/second.
4. repeat as `relay-a-c-2` and `relay-c-a-2` with new frame IDs.

Each destination remains listening for 15 seconds after the final origin so the
10-second delivery gate can be evaluated without truncating late evidence.

For every delivered frame, evidence must join:

```text
origin on source at TTL 7
  -> ingress on B at TTL 7
  -> relay-forwarded on B with TTL after <= 6
  -> ingress/application-delivery on destination at that decremented TTL
```

B may cancel a scheduled relay after a duplicate only when another eligible
forwarder is documented. In this three-phone isolated chain, such cancellations
are an adverse observation and cannot be counted as B proof.

### 3. Post-isolation control

Stop/disable B again without moving A/C. Repeat the 50+50 direct-isolation
control. Any A↔C link or delivery makes the relay blocks `CONFOUNDED`; do not
delete the surprising evidence or move the threshold.

### 4. Reproduction and raw freeze

Export all device/block JSONL files and the manifest. Run the offline validator
and evaluator twice in separate commands. Hash the raw directory before writing
the interpretation. Counts, joins, decision and result fingerprint must match;
only evaluator elapsed time may differ.

## Frozen calculations

For each direction and combined only after reporting block/cohort values:

- attempted = distinct declared origin sequences;
- delivered = attempted frame IDs with exactly one destination
  `application-delivery` within 10 seconds;
- delivery ratio = delivered / attempted;
- latency = destination monotonic time adjusted by the frozen clock-sync offset
  minus source origin monotonic time; report p50, p95, p99 and max;
- application duplicates = destination deliveries beyond the first per frame;
- relay-proved = delivered frames with the exact source→B→destination event
  chain and correct TTL decrement;
- relay-proof ratio = relay-proved / delivered;
- unexpected direct deliveries = destination deliveries in isolation blocks;
- relay forwards per frame = B `relay-forwarded` count; and
- invalid/drop/overflow counts by exact reason.

Do not calculate cross-device latency when sync uncertainty exceeds 100 ms. In
that case delivery/path metrics remain usable, latency fails its evidence gate
and the cohort is `INCOMPLETE` rather than receiving invented precision.

## Pre-registered gates

### Kit gates (can pass without hardware)

1. **Strict contract:** every canonical manifest/event validates; every named
   malformed, unknown, out-of-order, overflow and privacy-prohibited case fails.
2. **Evaluator truth:** deterministic GO, LIMITED, NO-GO, CONFOUNDED and
   INCOMPLETE fixtures classify exactly, with no simulation presented as field
   evidence.
3. **Path joining:** the evaluator requires source origin, B ingress/forward,
   destination ingress/delivery, same frame ID and valid TTL decrement; a
   `relayVia` string alone never passes.
4. **Metrics:** exact attempted/delivered/duplicate/relay ratios and latency
   quantiles reproduce on at least 200 synthetic sequences per direction.
5. **Bounded diagnostics:** buffer/event fields are bounded, overflow is visible,
   link handles are run-scoped, and no raw packet/user/radio identifier is
   exported.
6. **Operational completeness:** the runbook, build/hardware/privacy manifest,
   block checklist, export/hash and two-command evaluation steps are executable
   without undocumented judgement.

Passing kit gates means only **PROMOTE the field kit / HOLD the mesh decision**.

### Physical GO gate

For each separately labelled supported platform cohort:

- near control: 10/10 per tested pair/direction;
- pre- and post-isolation: 0/50 direct deliveries per direction, no direct A-C
  link, with identical fixed geometry;
- relay: at least 190/200 unique frames delivered per direction within 10 s;
- relay proof: 100% of counted deliveries have the full joined B-forward/TTL
  chain;
- application duplicates: 0;
- B forwards per delivered frame: exactly 1;
- invalid, corrupt or diagnostics-overflow events: 0; and
- two evaluator commands produce identical counts/decision/fingerprint.

### LIMITED

Use `LIMITED` only when path proof and isolation are valid but a declared cohort
misses the 95%/10-second threshold, is one-directional, or only a narrower
device/OS cohort passes. Report every cohort independently; do not average a
failed direction/platform into a pass.

### NO-GO

Use `NO-GO` for the tested foreground baseline when any of the following is
reproducible after one preregistered repeat with a fresh build/run ID:

- B never forwards or destination never receives over the isolated chain;
- dedup/relay logic produces duplicate application delivery or forwarding loops;
- frame corruption or uncontrolled connection churn makes the result unusable;
- a required supported platform cannot sustain the near control; or
- diagnostics materially change behaviour or cannot provide path evidence.

`NO-GO` pivots phone BLE from claimed backbone/moat toward opportunistic edge
transport and advances anchors/Gateway/LoRa evaluation. It does not stop the
whole Loc8 product.

### CONFOUNDED / INCOMPLETE

- `CONFOUNDED`: A/C direct isolation did not hold, geometry changed, device/build
  identity is ambiguous or the evidence cannot distinguish the path.
- `INCOMPLETE`: missing/corrupt/overflowed files, inadequate clock evidence for
  required latency, fewer than the frozen attempts or an interrupted block.

Neither state may be relabelled GO/LIMITED/NO-GO. Repair the setup and repeat.

## STOP rules and claim boundary

- Stop immediately on battery swelling/overheating, unsafe placement, venue or
  participant objection, uncontrolled public-data capture or device damage.
- Do not run the experiment in an emergency or use it for operational safety.
- Do not claim encryption: the current BLE research frame is plaintext.
- Do not claim mesh coverage, range, reliability, background support, battery
  life, venue performance or pilot readiness from this baseline.
- Never turn synthetic fixtures or native/unit tests into physical evidence.
- Do not change thresholds, discard failed blocks or pool cohorts after seeing
  results.

If three suitable phones and a genuinely isolated layout are unavailable, the
physical decision remains **BLOCKED on physical evidence** while the complete
kit can still be promoted and committed.
