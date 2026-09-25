# R1b receipt: source-sample retention, heartbeat compatibility and unified programme

**Date:** 25 September 2026.  
**Application parent:** `c141dd6ef351205b6d33fa5aace8222032718f8b`.  
**Destination:** existing `rnd/position-freshness-2026-09-25`, draft PR #4.  
**Status:** implemented and locally verified for review. No merge or deployment.

## Actual implementation

1. The existing crew store now retains one copied original source sample:
   provider timestamp in milliseconds, full measured accuracy or null, first
   receipt time, device/demo source, provider mock indication and elapsed-clock
   domain. It is not a second position database or a persistent trail.
2. Both Consumer and Guard location hooks pass the complete provider sample
   through a shared dependency-injected watcher. A stopped watcher cannot write
   late results; a late-resolving subscription is removed. Real-mode failure
   clears location instead of substituting Golden Gate Park demo coordinates.
   Only an explicitly available direct simulator can seed a demo fallback.
3. The publication timestamp, 25-byte codec, native framing, TTL/dedup and 5s/60s
   heartbeat schedules are unchanged. The source sample does not become newly
   observed just because it was published again.
4. Ordinary publisher and Guard SOS now use source accuracy rounded upwards to
   the existing byte range, not a constant 10m. Full accuracy is retained locally.
   The 255 ceiling remains ambiguous for unknown versus saturated accuracy; it
   is not a new sentinel or a bound on current error.
5. Geo-free quick replies remain possible without GPS. Text already did. Normal
   coordinate publication still requires coordinates. SOS/duress protocol and
   incident/muster behaviour are not rewritten or suppressed.
6. The existing BLE diagnostic HUD shows local source state, sample age and full
   accuracy independently of radio attempts. Source clocks, future input,
   duplicate samples, demo/mock input and late callbacks have explicit handling.
7. `LOC8_MASTER_PLAN.md` and `docs/programme/roadmap.json` consolidate PR order,
   meaning, research disposition, next deliverables, dependencies and promotion
   gates. The roadmap is documentation with structural tests, not another runtime.

## Source-to-consumer trace

| Boundary | What is retained / used |
|---|---|
| Expo provider | Original `LocationObject.timestamp` in epoch milliseconds, `coords.accuracy` in metres or null, coordinates and optional mock indicator. |
| Both `useMyLocation` hooks | Shared watcher calls `setMyLocationSample`, with unchanged foreground watch options; simulator origin remains a separate branch. |
| Existing `crewStore` | One local source sample alongside current coordinate; existing peer records stay separate. Coordinate-only setter clears provenance. |
| `sourceLocationView` / BLE HUD | Source delay plus local elapsed time; discontinuity becomes unknown, not a new fix. |
| `meshService.myPacket` | Publication time remains wire report time; source accuracy goes through the existing byte. Geo-free status no longer requires GPS. |
| Guard SOS | Existing type 7/rally/text sequence retained; measured accuracy supplied when available. |
| Codec / native relay / trust | Existing encoding and monotonic report-time acceptance unchanged. Native radio logic is not edited. |
| Consumer / Guard / Command remote freshness | R1a remains conservative: a newly received report is not proof of a new GPS observation. No source timestamp is magically transmitted. |

## Verification performed in this increment

**Final combined run: 247 passed, zero failed.** This comprises 80 existing R0
checks, 100 existing R1a checks, 62 new source-sample checks and five programme
structure checks. The first 242 are scoped software regressions; the last five
validate IDs, references, a dependency DAG and preserved programme constraints.

The source suite includes a five-minute stationary fixture with 61 distinct
reports through the actual codec and TrustLayer. Every report remains 25 bytes
and is accepted with advancing publication time while one original GPS sample
retains its observation timestamp. A counter-example demonstrates why using
that sample timestamp as the sole report timestamp would drop later heartbeats.

Other source tests cover five-minute delayed callbacks, missing/null/saturated
accuracy, invalid/future samples, provider-mocked/demo data, receipt ownership,
clock rollback/reset/suspend mismatch, repeated/older callbacks, same-coordinate
new fixes, 60-second beacon cadence, no-GPS quick replies/text, session/privacy
suppression, permission/setup failures, cancelled setup, late subscriptions,
actual Consumer/Guard hook glue, SOS delegation and diagnostic component props.

R0 includes its existing 25,000 seeded packet mutations and 14 golden encoder
fixtures. They are not 25,000 new native-radio tests. Existing 80/100 suites were
also run before editing and passed. An initial new test used exact floating-point
millisecond equality and was corrected to a sub-microsecond tolerance; the
implementation was not changed to conceal an age-boundary failure.

Environment: Node 22.16.0; available TypeScript 5.8.3. The repository requests
TypeScript ~6.0.3 and Expo SDK 57. No package or lockfile was changed. A verified
source subset was reconstructed from the previous published pack and current
GitHub source reads. Baseline blob hashes were checked. This is **not a full
checkout or full dependency installation**.

Strict semantic TypeScript checks cover the new pure helpers and shared watcher
with actual pure dependencies. Other checks execute actual source with declared
React Native, Expo, storage, Zustand, bridge or UI boundaries mocked as stated
in the runner. Hook/component checks are not real React reconciliation, browser
layout, accessibility or native-device rendering. The actual OS/location provider
and complete Command store integration are not exercised by this source suite.

Raw final TAP output is preserved losslessly in three ordered gzip parts under
`evidence/2026-09-25-source-location/`. Restore and verify their exact contents
with `node tools/mesh-rnd/read-source-evidence.cjs`. The uncompressed original
is also in the accompanying backup. Its SHA-256 is in
`2026-09-25-source-location-manifest.json`. The committed test runner reproduces
the checks; the evidence reader only restores the recorded output. Historical test evidence remains alongside older
receipts and is not relabelled as current full-CI success.

## CI is a separate unresolved gate

Run 36172826984 on the parent commit failed with no runner/steps reported. Its
logs were unavailable; check metadata reported annotations but the connector
rejected the annotation endpoint. The cause is still not established. No billing,
quota or application-test diagnosis is asserted. New-commit run results belong
in the PR publication comment; this receipt does not predict them.

The workflow now requires the new source and programme suites as well as the
previous suites. Existing full Jest/Expo, root TypeScript and lint remain gates.
No exact-dependency test pass, full application/native build, native/browser QA,
physical relay, battery/range result or security review was performed here.

## Boundaries that remain deliberately open

- The unchanged v1 wire does not carry original sample time separately from
  publication time. True remote observation age remains unverified. R1c needs
  explicit version/capability/correlation design, not hidden bits in old fields.
- A provider timestamp and mock flag are provenance, not authenticated identity
  or proof of real physical position. No encryption/key-management change.
- Stationary reports can still carry a cached last-known coordinate. Its local
  source age is known; remote v1 users must not infer it is current. No new GPS
  polling or background location permission is introduced to hide this limit.
- Own-fix navigation, all remaining freshness consumers and responder/coverage
  ranking are not universally migrated by this patch.
- No-fix SOS retains the old zero-coordinate ambiguity. The patch does not claim
  that 0,0 is a missing-location marker or silently disable the alert.
- Two recovered historical HTML previews were re-obtained and hash-verified but
  their exact bytes are not newly stored in GitHub. They are included intact in
  the consolidated backup. A failed attempt to attach their recorded Git blob
  IDs confirmed those IDs could not be reused from this repository.
- Original ignored upstream clones, full standalone Command source/history and
  the complete raw chat archive have not been recovered. The source catalogue
  and original handovers are not substitutes for those missing original bytes.

## Reproduce

```sh
npm ci
node --test tools/mesh-rnd/verify.node.cjs tools/mesh-rnd/freshness.node.cjs \
  tools/mesh-rnd/source-location.node.cjs tools/mesh-rnd/programme.node.cjs
npm test -- --runInBand
npx tsc --noEmit
npm run lint
```

The local run used `NODE_PATH` to access the preinstalled TypeScript compiler;
that is not a recommendation to replace the repository dependency version.
Review the source changes against the parent, not against a reconstructed
partial checkout as if it were the entire repository. Roll back this increment
as one unit if necessary; no changes to on-air packet layout require migration.

Next narrow runtime slice: truthful asynchronous Command submission and immutable
command/incident/recipient correlation (R2), with R1c wire/source-time design and
exact-toolchain verification tracked independently. The unified master plan
preserves the separate security, building, Gateway and physical radio lanes.
