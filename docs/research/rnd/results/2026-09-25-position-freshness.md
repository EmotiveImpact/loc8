# R1a receipt: position-report provenance and honest age display

Date: 25 September 2026. Programme: `BLE-RND-2026-09-25.md`, R1.
Application baseline: `3421390a19643ac6f621d8b9faafa7d7b4fcae62` (draft PR #1).
Review branch: `rnd/position-freshness-2026-09-25`.
First branch-only CI commit: `75f1c81895db946b169788200f6f8111df1db60d`.
Status: implemented and locally checked, not merged, deployed or physically validated.

## What this increment delivers

One pure projection in `@loc8/engine/core/positionFreshness` serves the existing
Consumer/Guard crew records and Command staff records. It does not create a new
tracking database, fork the engine, change a radio packet or require infrastructure.

A position report now has distinct sender-reported time and first local receipt
metadata. Local elapsed time uses a process-specific monotonic clock domain. A
clock reset or unavailable clock retires that domain; reloading cannot make old
receipts fresh. Missing or unverified clock provenance is explicitly uncertain,
not zero seconds old. Established report age preserves initial age at receipt
plus elapsed time. The display thresholds are 30 seconds recent, 90 seconds
ageing, and the existing 240-second ghost threshold. These are UI policies,
not measured latency, accuracy or availability guarantees.

The crew store rejects equal/older report timestamps before updating a position
or its receipt, validates direct-ingress coordinates and IDs, and copies the
accepted packet. Status replies, names, messages, session changes and reconnect
counts do not refresh position provenance. This preserves the existing monotonic
sender-time approach, not a new authenticated replay protocol.

Command's live-bridge position path validates/order-checks a report before
calling the existing zone/status store action, then attaches its local receipt
to that same staff record. The intermediate update has no new trusted provenance.
The second write checks the resulting coordinate and report timestamp before
binding a receipt. Existing `lastPingSec` remains a legacy mixed contact/report
field: the position projection never uses it as position age. Late callbacks
from disconnected or replaced bridge instances are ignored.

## Actual product integrations

- Consumer radar and crew sheet show explicit age uncertainty and last-reported
  information. Crew membership is no longer labelled as online status.
- Consumer compass labels historical/unknown targets as last reported. Unknown
  or stale reports cannot trigger automatic found/near-arrival claims or
  proximity heartbeat. A person can explicitly select “I’ve found them”; this
  is a local human confirmation, not a radio receipt. Confirmation is tied to
  the selected friend, not inherited by a different route ID. Missing/withheld
  positions cannot be shared through this screen, and sharing no longer calls
  a report an exact current spot.
- Guard TeamMap dims and labels uncertain positions. Floor counts mean recent
  peer reports plus the local user, not a headcount. Last-known floors remain
  selectable and caution/incident indications are not removed simply because
  a position is ageing. “No recent positions” does not mean “no people”.
- Command OperationsOverview uses muted, labelled unknown/ageing points, and
  RosterShift has a position-report-age column separate from last contact/report.
  These are the existing operational workspaces, not replacement mock-ups.
- The simulator supplies explicit out-of-band local callback context through
  `LocationTransport` and `meshService`, preserving source versus delivery time
  for delayed demo packets. Demo freshness remains labelled Demo. BLE and remote
  bridge packets do not become simulation/trusted data from fields in a payload.

## A material limitation found in the existing producer

`meshService.myPacket` currently stamps `nowSec()` on cached `myLocation` and
uses a fixed accuracy field. This is publication/report time, **not a preserved
GPS observation timestamp**. Therefore this increment deliberately leaves live
source clocks unverified. It does not claim to know a real fix's true age merely
because a plausible packet arrived. The `verified` clock basis is a future
provider seam exercised in synthetic tests; no live provider sets it here.

Changing the sole legacy timestamp to sensor time without reviewing heartbeat,
deduplication and stationary-device behaviour could make other features fail.
That wire-semantic change is not bundled into this increment. R1 is not fully
promoted until preserved sensor sample time/accuracy, source-clock treatment,
local-fix freshness and corresponding native cohorts are designed and tested.
Automatic live “found” is intentionally withheld while age is unverified; explicit
human confirmation remains available. Freshness alone is not position accuracy.

## Verification actually performed

Local Node 22.16.0 and available TypeScript 5.8.3. The repository requests
TypeScript ~6.0.3 and Expo SDK 57; no dependency versions or lockfiles changed.
Fetched baseline text files were reconstructed and checked using their Git blob
SHA-1 hashes before editing. This environment contains a source subset, not a
complete checkout. See `2026-09-25-position-freshness-manifest.json`.

- 100/100 new focused checks passed.
- 80/80 previous hardening checks passed again, including 25,000 seeded wire
  mutations and 14 byte-for-byte legacy encoder fixtures.
- The new suite checks the actual core projection, actual crew store, actual
  Command bridge and its position adapter. Zustand/platform/storage boundaries
  and the Command store's existing action implementation are mocked where stated.
- Simulator and mesh-service checks execute their actual source; simulator
  geometry/random generation is mocked. No simulated distances are RF evidence.
- Component branch/prop checks execute Consumer, Guard and Command component
  functions with a minimal mocked element/hook evaluator. They are **not** React
  reconciliation tests, accessibility audits, screenshot QA or native/browser
  renders. Source TS/JSX syntax and the new pure core's strict TypeScript check
  also pass. This is not whole-monorepo semantic type-checking.
- Tests cover delayed/duplicate/reordered input, source/local-clock anomalies,
  metadata binding, visibility gates, stale callbacks, live-vs-demo separation,
  caution preservation, and automatic versus explicit-human reunion behaviour.

The first GitHub Actions run, 36167128884, failed before any job steps were
reported; no logs were retrievable. The cause was not established. It is not a
reported failing application test, and there is no successful full CI result
from this attempt. The committed branch-scoped workflow installs the exact
repository dependencies and runs the scoped suites, existing Jest suite,
TypeScript and lint when a runner is available. Later run status belongs in the
PR, not an assumed green check here.

Not performed: exact dependency install, full Jest/Expo suite, full monorepo
TypeScript/lint, native builds, browser/native visual QA, physical phone tests,
Gateway firmware tests, range/battery measurement or independent security review.

## Deliberate boundaries

No native Swift/Kotlin changes, TTL/fanout changes, new advertising payload,
transport replacement, ACK protocol, crypto claim, mandatory Gateway or cloud
service. Source clock trust is not identity authentication. Visibility/expiry
fields are projection inputs, not a completed authorisation/revocation workflow.
This increment does not silently delete incident histories or suppress alerts.

The 24-hour offline trust window and future-clock recovery problem are unchanged.
The new Command ordering guard applies to the live-bridge position path; other
internal callers of the existing Command store action are not newly authenticated
or universally reworked. Other Command dashboards, coverage calculations,
nearest-responder selection, navigation/local GPS quality, and all remaining
age-consuming views still require a systematic migration/review. Do not claim
whole-product freshness/coverage certification from these selected integrations.

## Reproduce and review

```sh
npm ci
node --test tools/mesh-rnd/verify.node.cjs
node --test tools/mesh-rnd/freshness.node.cjs
npm test -- --runInBand
npx tsc --noEmit
npm run lint
```

Review this as a stacked increment after PR #1. Preserve archive PR #3 and the
central [knowledge archive](https://github.com/EmotiveImpact/loc8/blob/archive/loc8-knowledge-2026-09-25/KNOWLEDGE.md).
Neither archive documents nor reference models were substituted for app code.
Do not merge or deploy before full-toolchain and native/UI review gates pass.

Next: preregister source-sample timestamp and accuracy semantics without breaking
heartbeats; cover remaining freshness consumers and automatic responder ranking;
then run the existing MESH-01 and background/battery physical gates. A transport
submission, destination receipt and human response remain separate R2 work.
