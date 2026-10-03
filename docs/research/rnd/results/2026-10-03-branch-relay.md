# Result and handoff: branch-preserving forwarding, v2

**Date:** 3 October 2026, Europe/London. **Experiment:** R3 / SEC-01 E06,
`loc8.directed-gatt-branch.v2`. **Model decision:** REPEAT_NATIVE_SHADOW_ONLY.
The [v1 retry candidate](2026-10-03-ble-density.md) remains **HOLD** under its
original gate. The [new protocol](../BLE-BRANCH-PROTOCOL-2026-10-03.md) was
registered before the v2 benchmark; it evaluates a different one-send candidate
against reliable jitter and explicitly discloses costs relative to current.

## Outcome

Across **5,400 runs**, all **1,800 individual branch/jitter comparisons** have
exactly equal first application delivery sets and arrival times. Branch never
uses more directed attempts than jitter. All **100 descriptive dense cohorts**
save attempts: mean reductions range **11.701%–47.725%**. Of their 1,000 paired
trials, 999 save strictly; one ties. Per-trial dense saving fractions are
0% minimum, 32.723% median, 47.035% p95 and 47.905% maximum. Raw trials preserve
the tie and all failures/exclusions; these are exploratory software results,
not a confidence interval, radio-energy result or supported phone state.

The same-frame duplicate sole-bridge regression is repaired. A duplicate
excludes the ingress branch that demonstrably sent this frame, while the
original timer still forwards to other live links. This differs from current's
cancel-whole-relay behavior and from v1's whole-fanout repeated transmissions.

Reliability has a cost relative to cheap cancellations: branch uses more than
current in **120 of 180 cohorts**, and more than twice current in **75**.
The old v1 send-cost gate is not relabelled as a pass. V2 preserves jitter's
coverage with less redundant return traffic; it does not repair every erased
source or relay transmission and makes no minimum-delivery or range promise.

## Exact detached implementation

- `packages/engine/src/experimental/branchRelayPolicy.ts`: independently written
  policy importing Loc8's existing jitter and TTL helpers. One original
  first-receipt timer; first-receipt degree clamp/decrement; frozen outgoing TTL;
  matching duplicates add ingress exclusions without moving/cancelling the
  timer. At send, filter the actual live-link list and retain caller order.
  No retry, topology oracle, source re-origination or persistent storage.
- Full copied canonical raw **47-byte** frame witness; compare all **46 immutable
  bytes** except TTL. A supplied-key conflict with unequal bytes is recorded
  and cannot add exclusions or replace admitted data. The model also uses full
  immutable-frame SHA256 keys. Witnesses are not peer/source authentication.
- Seen <=1,000, pending <=128, exclusions <=64 per pending frame by default.
  Seen expiry remains 300 seconds from first receipt; pending expires after
  4,550 ms. Exclusion overflow favours an additional send. Clock regression
  rejects work; reset clears state. `forgetLink` clears only that link's witness
  after an incarnation change without changing the timer. Cache expiry/eviction
  can admit the same frame again and are not permanent replay protection.
- `tools/mesh-rnd/branch-simulation.cjs`: actual TypeScript policy executed on
  static directed GATT events. Reuses Loc8-owned v1 topology, loss, percentile
  and baseline helpers. `branch-benchmark.cjs`, `branch-verify.cjs` and three
  Node test runners publish/recheck source, historical evidence and artifact
  hashes. No third-party implementation or dependency added.

The **25-byte payload**, existing **47-byte native framing**, v1 model and v1
evidence remain unchanged by this modelling increment. The policy is not
exported by the engine or automatically started. A subsequent opt-in native
continuation has its own integration receipt and proof class; it cannot turn
this simulation into a physical phone result or change the registered gate.

## Registered comparison and evidence

Same v1 matrix and seeds: 10/25/50/100/250 nodes; requested target shortest
hops 1/3/7; independent directed erasure 0/10/30/50%; line, layered crowd and
sole bridge; ten seeds; current/jitter/branch. **540 aggregate policy rows,
180 graph cohorts, 1,800 per-trial pairs.** All **3,600 current/jitter baseline
rows** exactly match the frozen v1 trials. Full graph/TTL eligibility remains
independent of observed success; TTL-ineligible targets are retained.

No exact-arrival mismatch, send regression, baseline mismatch or horizon drop
occurred. The gate passes for a **later native shadow experiment only**.
One message, one source attempt and static canonical identities are deliberate
constraints; every raw trial records them. Two deterministic runs produce the
same benchmark hashes; the verifier repeats source/hash checks and the full
matrix without touching historical v1 evidence. The first full run took
**12.020 seconds** on Node 22.22.3 / TypeScript 6.0.3; this is host cost.

Representative ten-seed means; delivery is among TTL-eligible peers, attempts
are simulated directed sends, and latency includes only delivered peers:

| Cohort | Policy | Eligible delivery | Target success | Mean attempts | Delivered p95 ms |
|---|---|---:|---:|---:|---:|
| Crowd, 250 nodes, 3 hops, 30% loss | current | 98.956% | 9/10 | 1,479.7 | 384 |
| Same | jitter | 100% | 10/10 | 7,731.6 | 277 |
| Same | branch | 100% | 10/10 | 5,219.7 | 277 |
| Sole bridge, 250 nodes, 3 hops, zero loss | current | 54.819% | 1/10 | 602.6 | 465 |
| Same | jitter | 100% | 10/10 | 7,614.6 | 463 |
| Same | branch | 100% | 10/10 | 3,989.2 | 463 |
| Sole bridge, 250 nodes, 3 hops, 30% loss | current | 63.896% | 3/10 | 882.4 | 566 |
| Same | jitter | 84.659% | 7/10 | 5,517.6 | 584 |
| Same | branch | 84.659% | 7/10 | 3,785.3 | 584 |
| Line, 25 nodes, 7 hops, 30% loss | current / jitter / branch | 25.714% | 1/10 | 2.7 | 140 |

Branch saves 32.489% against jitter in the crowded 250/3/30% cohort,
47.611% in the zero-loss bridge cohort, and 31.396% in the 30%-loss bridge
cohort. The sparse line shows the retained one-shot loss limitation, not a
successful multi-hop phone result. Missing receivers are excluded from latency
quantiles and remain visible in success and TTL metrics.

The [evidence directory](evidence/2026-10-03-branch-relay/) contains
`branch-matrix.json`, `branch-matrix.csv`, full `branch-trials.json.gz`,
`branch-gates.json` and `branch-manifest.json`. The model receipt pins **17
source objects**, **two historical v1 objects** and **four benchmark artifacts**.
Host Node version is recorded separately from deterministic source/artifact
equality so equivalent CI runtimes can compare the model's output.

## Tests, limits and next decision

**35/35 new Node checks passed**: semantic TypeScript, all wire TTL values,
jitter/deadline/TTL freeze, raw-frame conflict, input/output ownership, duplicate
storm and ingress bounds, cache/admission pressure, expiration/replay scope,
clock regression, reset, link forgetting, multi-hop/sparse/asymmetric topology,
bridge repair, first-hop loss controls, unchanged v1 calibration and artifact
determinism. Full monorepo/native/integration checks belong to their separately
recorded continuation, not these 35 detached-model checks.

The exact-arrival argument applies only within the frozen static model. The
excluded link already sent the frame and thus already received it; omitting a
return cannot change its first delivery. Jitter does not change its timer on
duplicates, so removed returns do not affect its future first sends. Real
queues, concurrent messages, GATT role aliases, reconnect generations,
retention eviction, correlated losses, hostile identities and OS scheduling
need independent tests. `forgetLink` has a unit contract; the matrix does not
simulate churn. Native ingress age/parser guards remain transport concerns.

No RF/energy saving, crowd capacity, large-area coverage, native phone run,
battery, locked-background state or security certification is established.
Unsigned identical frames can still be replayed/forged. A full byte witness
prevents an unrelated supplied-key conflict from mutating the pending frame;
it does not authenticate a sender or clear historical truncated-key replay risk.

Reproduce the detached evidence:

```sh
npm ci
node --test tools/mesh-rnd/branch-policy.node.cjs tools/mesh-rnd/branch-simulation.node.cjs tools/mesh-rnd/branch-benchmark.node.cjs
node tools/mesh-rnd/branch-verify.cjs
node tools/mesh-rnd/branch-verify.cjs --rerun
node tools/mesh-rnd/branch-benchmark.cjs --out /tmp/loc8-branch-new-run
```

Next production decision: retain current default and 25-byte format. Repeat
branch behavior behind an explicit native research opt-in with token ownership,
live-link/churn/expiry proof, queue/load fault injection and unchanged MESH-01
three-phone controls. Keep source-loss retry, authenticated courier retention,
periodic-advertising hardware and optional long-range gateways as separate
experiments. Review the exact final combined tree before any merge or release.

## Native continuation and activation

This continuation implements the candidate in both actual native services,
available in a rebuilt development client. Default policy remains `current`.
Draft [PR #5](https://github.com/EmotiveImpact/loc8/pull/5) targets R1
`rnd/position-freshness-2026-09-25` (`f80e936`, including R0). Main remains
`f6b09a4`; PRs #1/#3/#4 and the other Claude worktrees are preserved. No merge,
release or physical data collection occurred.

- iOS `MeshService.swift` / new `MeshPendingRelays.swift`, and Android
  `MeshBleService.kt`: one existing jitter, frozen TTL, 128 pending frames and
  64 ingress witnesses; both central writes and subscriber notifications obey
  send-time exclusions. Matching sender/timestamp/payload establish witnesses;
  version/type/flags/length are fixed by the unchanged native decoder.
- Timer tokens protect replacements/reset. Connection and subscription churn
  invalidate old witnesses and fail open for the replacement connection.
  Pending branch callbacks expire after 4.55 seconds without duplicate renewal.
  iOS uses sleep-inclusive `mach_continuous_time`; Android `elapsedRealtime`.
- Adapter cycling preserves application dedup; explicit stop resets it. Full
  native frame comparison protects **pending witnesses**, not the deduplicator
  after forwarding. Its four-byte payload hash, 300-second retention/eviction,
  unsigned identity and replay limitations remain. The TS model stores full
  witnesses throughout seen retention, which is a disclosed difference.
- The default's TTL/jitter/cancel-on-duplicate policy remains for comparison.
  Shared iOS timer ownership/radio-off cleanup and truthful zero-target
  diagnostics also improve its lifecycle; all default behavior is not unchanged.
- Both Expo module bridges and the typed API expose stopped-only
  `configureRelayMode` / actual `getRelayMode`; status reports selection.
  Android bounds requeue attempts around a dying handler. `BleMeshTransport`
  configures an explicit environment selection before starting; stop during
  configuration prevents delayed start. Older binaries report a rebuild error.
- The field page reports actual mode. Frozen MESH-01 event/schema/evaluator
  remain unchanged: fully witnessed egress uses `egress-skipped/duplicate`,
  cancelled scheduled work `relay-cancelled/scheduled-relay-cancelled`. Capacity
  drops use OS logs rather than an invalid/null or falsely classified event.
  iOS expired callbacks have no extra field event. Capture OS logs separately;
  JSONL cannot quantify capacity drops or equivalent per-link costs on both OSs.

No retries or queue amplification were added. Existing iOS notify backlog and
Android no-response write scheduling/backpressure need separate load tests.
Capacity can reject relay work while first local delivery succeeds.

Apply `tools/mesh-rnd/branch-field.env.example` to every phone in a rebuilt
native development client:

```sh
EXPO_PUBLIC_TRANSPORT=ble EXPO_PUBLIC_MESH_FIELD_KIT=1 EXPO_PUBLIC_MESH_RELAY_MODE=branch npx expo start --dev-client
```

That starts a server, not a native rebuild/install. Follow the repository's
supported native-build instructions first. Use `current` for the control and
distinct run IDs per mode; record build commit, actual selection, devices and
clocks externally. The frozen JSONL schema does not identify policy selection.

## Combined verification and limitations

| Check | Result / boundary |
|---|---|
| Scoped R0/R1/R3/API/model | 335/335 pass |
| Monorepo Jest | 36 suites, 488/488 pass |
| Frozen field-kit contract | 100/100 pass; synthetic fixtures |
| Root TypeScript / lint / whitespace | Pass |
| Actual iOS native host execution | 20/20 pass; actual stopped service API, real short-hash collision, churn, bounds, continuous-clock expiry and wire compatibility; BLE never started |
| Actual iOS service/helper SDK typecheck | Pass: arm64 iOS 15.1 Simulator target, iOS 18.2 SDK, Swift 5 mode; no CoreBluetooth stubs |
| Android state/mode host checks | 155 assertions + 10 static integration contract groups pass; Handler/radio not executed |
| Complete Android service source compile | Pass: real API 36, Kotlin 2.1.20, Java 17; Expo module bridge excluded |
| Isolated Android Expo prebuild | Pass; module compilation attempted separately |
| Android Gradle module compile/package | UNVERIFIED: stopped our daemon below 2 GiB free reserve; no module success observed |
| Full iOS Expo app/pod build | UNVERIFIED: installed Xcode 16.2 remains below the repository's SDK 57 build gate |
| Phones / RF / battery / background | Zero attempts; unverified |

The successful initial `npm ci` install is reused with unchanged lockfile and
dependencies. No dependency was added/upgraded. Runtime: Node 22.22.3, npm
10.9.8, TypeScript 6.0.3, Expo 57.0.8, Jest 29.7.0, macOS 14.5 arm64. Earlier
Doctor 19/21 (Hermes/version alignment) and audit 15 affected entries (11 high,
4 moderate) remain in the v1 receipt, not repaired/relabelled here.

Android's offline attempt lacked a plugin; the online attempt progressed through
toolchain/configuration and plugin compilation. Gradle installed missing NDK
27.1.12297006 and Build Tools 35.0.0. These SDK/cache files remain; no user files
or other worktree were deleted. At stop, 1,843,352 KiB remained. This is a storage
boundary, not a diagnosed Loc8 compile failure. The final source snapshot is
recorded separately from that interrupted build; successful service checks
cover final source. Handler races and active iOS configuration rejection are
implemented/compiled but have not been exercised on phones.

[Integration manifest](evidence/2026-10-03-branch-relay/integration-manifest.json)
pins current native/API/check sources and compressed raw check/build logs.
Hash verification is not a fresh check execution. `--rerun` repeats both
models, not native builds or radio. Historical v1 sources are checked against
exact `f4436b5` Git objects via `verify-density-history.cjs`: 44 source objects,
15 artifacts and the unchanged 12-source model. The original working-tree v1
verifier remains historical and rejects changed native sources correctly.

```sh
node tools/mesh-rnd/verify-branch-integration.cjs --rerun
node tools/mesh-rnd/native-relay/run-ios-branch-tests.cjs --typecheck-ios
```

For Android, set `JAVA_HOME` to Java 17, `ANDROID_JAR` to API 36, `KOTLINC_BIN`
to Kotlin 2.1.20 and `KOTLIN_STDLIB_JAR` to its matching library; run
`sh tools/mesh-rnd/verify-android-branch.sh`. The receipt retains exact local
paths/cache launcher. Host compilation does not prove an Expo app build.

## Sources, reuse and follow-up decisions

[Primary-source intake](../intake/2026-10-03-ble/README.md) records 11 repos,
12 snapshots, 59 inspected files, maintenance/provenance/licence evidence and
exact Git objects. New policies, model and native bookkeeping were authored for
Loc8; no candidate upstream implementation or new dependency was imported.
Loc8-owned codec, jitter, TTL, topology and test helpers were reused. Existing
BitChat-derived native components retain their previously recorded attribution.

| Development / inspected repositories | Licence / fit / next experiment |
|---|---|
| RFC 6206/7731, original Trickle, adaptive-k and queue-interference papers; OEPB + BLE-binding -01 | Independently implemented algorithm ideas. Named OEPB repo did not resolve; author reproducible code unavailable. No-MAC simulated claims are not radio proof. V1 retries HOLD; next load/queue/correlated-loss tests for the one-shot native candidate. |
| DPCS author demo, Zephyr periodic TX/RX + BabbleSim, Nordic OpenMesh | Selected DPCS/Zephyr Apache-2.0; OpenMesh Nordic-hardware restriction. Reproduce on pinned dedicated boards/SDK and measure current/timing; phone background support not established. |
| MPR selection MATLAB | MIT graph reference, not a ready GATT scheduler. Loc8 lacks authenticated two-hop topology. Own directed-graph/rare-bridge selection experiment before runtime routing. |
| BitChat iOS, THE ONE, BMSimulator, Reticulum, Meshtastic | Inspected iOS pin Unlicense; THE ONE/Meshtastic GPL-3.0; BMSimulator licence absent; Reticulum custom terms. None imported. Existing synthetic courier keeps trusted source lifetime separate from hop TTL; real courier needs authentication, inherited age and bounded durable storage. |
| MeshCore, LoRaMesher, BLE/LoRa preprint | MIT repo pins; current TDMA LoRaMesher differs from reliable-payload paper's older branch. CC BY 4.0 preprint did not activate LoRa experimentally. Reproduce hardware gateway separately: canonical 47-byte frames inside bounded authenticated outer envelope, preserving origin/age/hop accounting; consumers retain BLE independence. |

Terms apply to inspected pins/files, not every dependency/future revision.
Missing/contradictory terms were recorded, not converted into an assumed grant.
Maintenance and reproducibility details are in the two intake source receipts.

Recommended production decision: advance to a controlled native comparison,
retain current default until supported app builds and physical evidence exist.
Execute unchanged MESH-01 controls, then duplicate/branch, churn and load cases
with queue/send instrumentation. Require equivalent delivery, bounded queues
and measured energy/background behavior before selecting a default. Keep the
25-byte format; evidence here does not justify changing it. Sparse/source retry,
periodic hardware, authenticated courier and optional gateways remain separate.

## GitHub delivery receipt

Substantive implementation commit: `1a4cdac2f8871ab9b49f618a06a2949b65d61247`,
pushed to `rnd/ble-density-2026-10-03`. Both exact-commit GitHub jobs passed:
[push verification](https://github.com/EmotiveImpact/loc8/actions/runs/37085325145)
and [PR verification](https://github.com/EmotiveImpact/loc8/actions/runs/37085327986).
Their [metadata and compressed raw logs](evidence/2026-10-03-branch-relay/branch-ci.json)
are retained alongside the integration receipt (71 current source objects,
23 artifacts including CI). CI freshly executes 335 scoped, 100 field-contract
and 488 Jest checks plus types/lint/hash verification; native compiler checks
remain the separate local receipts. This follow-up receipt adds evidence only;
the implementation/source hashes and registered model results are unchanged.
PR #5 stays draft, base R1, and main remains unmerged.
