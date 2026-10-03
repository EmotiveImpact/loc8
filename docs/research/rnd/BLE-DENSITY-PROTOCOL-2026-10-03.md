# R3 density experiment protocol, version 1

Registered before the benchmark run on 3 October 2026. Extends **SEC-01 E06 /
R3**, with **MESH-01 E01** and **RADIO-01 E07** kept as independent physical gates.
Synthetic results alone cannot promote a native forwarding default.

## Baseline and preservation

Main `f6b09a492c362f1c73b775d67721da1cc345fe91` was clean. Existing Claude
worktrees and draft PRs #1, #3 and #4 were inspected and preserved. R0
`3421390a19643ac6f621d8b9faafa7d7b4fcae62` is an ancestor of R1
`f80e9366411945b050058f4df5466269e1f6b98d`; R1 had successful GitHub checks
[36195109445](https://github.com/EmotiveImpact/loc8/actions/runs/36195109445)
and 36195105689 when inspected. New branch `rnd/ble-density-2026-10-03`
starts at R1, and its draft PR targets the existing R1 branch. Do not merge main.

Read the September [BLE programme](BLE-RND-2026-09-25.md), its [source-location
receipt](results/2026-09-25-source-location.md), July [mesh research](mesh-and-resilience.md),
principal audit addendum, handoff and [experiment gates](experiments.md).
AGENTS.md requires the exact [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/);
it was read before code changes. Synced ChatGPT `sources/` remain read-only.

## Hypothesis and decision thresholds

Bounded repeated forwarding might improve delivery under loss and prevent
first-duplicate cancellation from stranding a sole bridge. Duplicate evidence
may reduce redundant retries in dense graphs. GATT neighbours do not necessarily
share broadcast coverage, so suppression might also cut essential paths.

**Candidate for a subsequent shadow/native experiment**, not product promotion:
each loss/topology/hop cohort must have TTL-eligible delivery no more than one
percentage point below current, target success no more than one point below
current, p95 delivered latency within the existing ten-second MESH-01 window,
and at least 20% fewer directed attempts than jitter-only in dense cohorts.
Report cost relative to current even if delivery improves. A candidate that
uses more than twice current attempts in any dense cohort is held for tuning.
No averaging away a bridge failure or unreachable target.

Stop on unbounded state, renewed TTL/lifetime within retained state, duplicate
application delivery while the identity remains in the seen cache,
non-deterministic reruns or modified wire fixtures. A failed hypothesis is a
useful result; retain adverse cohorts. Ten paired seeds are exploratory, not
enough to establish a narrow confidence bound or SLA.

## Policies and controls

All policies preserve native origin TTL 7, medium-degree cap 6, dense-degree cap
5, decrement once, split horizon and full directed fanout. Retries reuse the
same once-decremented TTL, origin and timestamp.

1. **current:** native degree jitter and cancel-on-any-duplicate; already a
   k=1-like suppression heuristic.
2. **jitter:** same jitter without cancellation; a counterfactual ablation.
3. **trickle:** independent finite per-frame Trickle-style hypothesis, with
   transmit point in the second half of each interval. Starts at 80 ms, doubles
   to a 640 ms ceiling, at most seven intervals, three actual transmissions and
   4,550 ms active state. Suppressed intervals still consume the interval budget.
   Degree <=2 disables suppression. Otherwise k=max(2,ceil(log2(degree+1))),
   counting distinct local ingress links per interval with a saturated set.

This k is a **Loc8 hypothesis**, not the adaptive-k paper's previous-counter
formula, RFC conformance claim or OEPB binding. Timings are simulation knobs;
measure native GATT connection/queue latency before choosing phone timings.

Detached `packages/engine/src/experimental/relayPolicy.ts` is not re-exported
or imported by production code. Native remains the sole runtime relay owner.
The policy stores identities and scheduling metadata only; payloads are never
rewritten. Seen cache <=1,000; pending <=128; first-receipt expiration and FIFO
eviction. Expiration or eviction permits the same key to be admitted again;
neither this cache nor the native cache provides permanent replay protection.
Native trims its seen cache to 750 at overflow; the experimental
FIFO cache is a bounded modelling deviation. Experimental eviction also
cancels that frame's pending work, whereas native
pending timers are separate from cache overflow.
Restart requires explicit reset; monotonic clock regression rejects work.
Missed intervals do not cause per-frame
catch-up bursts; one drain can still return up to 128 distinct frame forwards.

## Matrix and measurements

5 node counts (10,25,50,100,250), 3 requested shortest path depths (1,3,7),
4 directed loss probabilities (0,0.1,0.3,0.5), 3 topologies (line, layered crowd,
sole bridge), 3 policies, 10 paired seeds: **5,400 runs**. Run all cases;
classify shortest-path and native-TTL reachability independently. A physically
connected target beyond the retained degree clamp is a TTL exclusion, not
random loss. Publish per-run data and cohort aggregates including exclusions.

Measure directed GATT attempts, successful link deliveries, unique application
deliveries, target success, total/TTL-eligible coverage, duplicate/suppression
counts and delivered latency p50/p95. Deterministic topology, keyed loss and
node-local scheduler seeds allow paired comparisons without one policy consuming
another policy's random sequence. Do not call send counts RF airtime or energy.

The model is an ideal static link graph, one message per run. It omits BLE MAC
collisions, link-layer retransmissions, advertising discovery, establishment,
MTU, queues/backpressure, concurrent origin traffic, dual-role duplicate links,
OS suspension and battery. iOS sums central/subscriber degree; Android unions
addresses. The canonical-peer model is not either platform's full scheduler.

## R4 and RADIO-01 boundaries

Add only a separate in-memory synthetic contact schedule if practical. Source
birth/lifetime is simulation metadata outside immutable payloads; age cannot be
renewed at a relay or confused with hop TTL. No plaintext production outbox,
new on-air fields or claim of remote authenticated source age. Fragments have
no timestamp in their 25-byte region. Legacy native timestamp/dedup is unsigned.

Gateway bridging remains a bench plan: optional dedicated BLE/long-range nodes,
validated existing raw 47-byte frames tunneled in a bounded external envelope,
age/hop/loop/duty-cycle bounds and outage controls. Consumers retain BLE with
no long-range dependency. Signing, authorisation and retention must precede
operational or persistent personal-location use.

## Reproduction and evidence

Use `npm ci`, then the scoped Node runners, complete `npm test -- --runInBand`,
`npx tsc --noEmit`, `npm run lint`. Add deterministic simulator/benchmark
commands to the result receipt. Preserve source hashes, seed/options, raw test
logs and benchmark JSON/CSV. Report actual Node, TypeScript, Expo and OS versions,
elapsed time and limitations. No radios/phones are implied by host tests.
