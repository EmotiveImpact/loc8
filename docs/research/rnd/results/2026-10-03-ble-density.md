# Result and handoff: bounded BLE density forwarding

**Date:** 3 October 2026, Europe/London. **Question/experiment:** R3 / SEC-01
E06, `loc8.directed-gatt-relay.v1`; separate R4 synthetic-contact model and
RADIO-01 E07 gateway plan. **Decision:** HOLD the candidate; retain the
experimental code and adverse results. No production promotion or main merge.

## Outcome and next production decision

The bounded Trickle-style candidate improves delivery in some ideal-link loss
and sole-bridge cases, but fails the registered dense send-cost gate. All 100
cohorts with mean canonical degree >=6 use more than twice current directed
attempts; none saves 20% against jitter-only. Keep native defaults unchanged.
The next narrow experiment should protect uncovered outgoing GATT branches
without retrying the entire fanout three times. Receiving a duplicate on one
link does not prove another link's downstream group received the message.

This is a measured negative result, not a release. It establishes neither radio
capacity nor range, energy, large-area viability, native background operation,
production courier safety or secure emergency delivery.

## Baseline, concurrent work and exact change

Inspected clean local/main remote `f6b09a492c362f1c73b775d67721da1cc345fe91`,
branches, recent commits, open PRs #1/#3/#4 and issue #2 before changing code.
R0 `3421390a19643ac6f621d8b9faafa7d7b4fcae62` descends main; R1
`f80e9366411945b050058f4df5466269e1f6b98d` descends R0 and had successful
GitHub CI when inspected. The new isolated worktree
`/Users/augustusedem/Loc8-rnd-ble-2026-10-03`, branch
`rnd/ble-density-2026-10-03`, starts at R1; the draft PR targets
`rnd/position-freshness-2026-09-25`. Preserve the existing stacked integration
order and reconcile/retest after parent promotion. Archive PR #3 remains separate.

The Claude worktree at `1bf217e` has a modified `.claude/launch.json`; the
worktree at `4f725df` has an untracked launch file. Both are untouched. Main
stays at its original head. The ChatGPT mirror's `sources/` was not edited.
The [September programme](../BLE-RND-2026-09-25.md), source/freshness receipts,
July mesh research, principal audit, handoff and experiment gates were reviewed.
The exact Expo SDK 57 docs required by AGENTS.md were read before edits.

Changes:

- `packages/engine/src/experimental/relayPolicy.ts`: detached, independently
  written scheduling policy. Models current degree jitter + first-duplicate
  cancellation; jitter-only ablation; finite Trickle-style retries with a
  degree-derived unique-link redundancy threshold. Bounds seen/pending state,
  active lifetime, intervals and transmissions. Uses injected monotonic time
  and randomness, rejects clock regressions, skips missed intervals and freezes
  once-decremented TTL. No platform timer or persistent storage.
- `tools/mesh-rnd/relay-policy.node.cjs`: 18 safety/semantic checks including
  all 256 inbound TTL values, native jitter endpoints, duplicate storms,
  interval reset, admission pressure, replay scope, self echoes, lifecycle,
  expiry and failed random-source admission.
- `relay-simulation.cjs`, `relay-simulation.node.cjs`, `benchmark-relay.cjs`:
  actual TypeScript policy exercised by deterministic discrete events on
  directed GATT graphs; 29 checks; paired seeds; compressed full trials,
  CSV, JSON and exact source/artifact hashes.
- `analyze-relay.cjs`, `verify-relay-evidence.cjs`: exploratory gate analysis,
  hash verification and optional full deterministic benchmark repeat.
- Research intake, source receipts, registered protocol, this handoff,
  README/handoff pointers and additive CI coverage.

The 25-byte `packetCodec.ts`, all native Swift/Kotlin mesh files, engine exports,
production transports/clients, package manifests and lockfile are unchanged
from R1. New policy is neither exported nor wired into the app. Native retains
sole ownership of real forwarding. No third-party runtime dependencies added.

## Sources found, repositories inspected and reuse

The [intake index](../intake/2026-10-03-ble/README.md) maps each technique to
Loc8. Its [forwarding/periodic report](../intake/2026-10-03-ble/forwarding-and-periodic.md)
and [routing/courier/gateway report](../intake/2026-10-03-ble/routing-couriers-and-gateways.md)
contain original papers, standards, technical reports, access limits, dates,
maintenance status and exact implementations. Two machine receipts pin
**11 repositories / 12 snapshots / 59 inspected files**. Upstream suites and
firmware were not executed; selected-file licence screening is not complete
distribution/dependency clearance.

| Original material / implementation | Finding and disposition |
|---|---|
| RFC6206 / RFC7731; NSDI2004 Trickle; 2015 adaptive-k and queue-interference papers | Independently implement finite scheduling principles. The Loc8 degree threshold is its own hypothesis, not the adaptive-k formula or RFC conformance. |
| OEPB / BLE -01, 30 September 2026 | Real individual experimental IETF drafts. Reported simulation percentages verified against text. Named repository returns 404; code/licence unavailable; no independent implementation or BLE hardware validation. No copying or adoption of its wire format. |
| DPCS June 2026 paper + author demo; Zephyr | Apache-2.0 candidates for a separate periodic-advertising firmware bench. Demo needs AD validation and stale-data expiry; full paper access was restricted. No phone power/range claim. |
| Nordic OpenMesh | Historical Trickle reference with processor-restricted terms; source stays outside phone clients. |
| May 2026 MPR paper + MSH19/MPR_Selection | MIT graph baseline. Fresh two-hop topology/control plane is missing in current Loc8, so runtime source routing stays held. |
| BitChat iOS | Unlicense candidate routing/courier components, architecturally gated by identities/envelopes/providers. No new source imported. Android GPL screen remains historical, not newly refreshed. |
| MeshCore / LoRaMesher | MIT dedicated gateway candidates. MeshCore opaque datagrams are concrete; current LoRaMesher main differs from the paper-linked reliable-payload legacy tag. Exact historical experimental commit not established. |
| Original BMSim | No verified code licence; a fork's MIT statement does not establish upstream rights. Public source informed model understanding; no transplant. |
| THE ONE / Meshtastic / Reticulum | GPL and separate map terms, GPL, and custom restrictions respectively. Ideas / isolated benchmark references, no product import. |
| RFC9171, Spray and Wait; April 2026 BLE-LoRa preprint | Lifetime/copy-budget/hierarchy ideas. Preprint LoRa is explicitly not activated; analytical backbone estimates are not gateway proof. |

**Reuse receipt:** no upstream implementation was copied, vendored, linked,
executed or imported by this slice. All new Loc8 code is independently written.
Public source remains useful for understanding techniques even when copying
rights are absent. MIT/Apache/Unlicense candidates can enter later scoped work
under their applicable notices and verified file/dependency terms. Paper access
alone is not a software grant. No RFC code components or complete papers copied.

## Registered method and benchmark results

[Protocol v1](../BLE-DENSITY-PROTOCOL-2026-10-03.md) was recorded before the
benchmark. Matrix: 10/25/50/100/250 nodes, target shortest hops 1/3/7,
directed loss 0/10/30/50%, line/layered-crowd/sole-bridge graphs, three policies,
ten paired seeds: **5,400 runs, 540 policy aggregate rows, 180 graph cohorts**.
Full source graphs are connected; ideal native-TTL eligibility is classified
independently, including 40 cohorts whose chosen target is completely
TTL-ineligible. Degree clamp is preserved; do not count those as packet loss.

No delivery or target-success regression versus current exceeds the registered
one-point allowance across the 180 cohorts. The cost criterion fails as above.
Worst pooled **delivered** p95 is 3,066.371 ms; target-delivered p95 is
3,174.149 ms. No horizon-dropped events; maximum 18,300 processed events/run.
Missing deliveries are excluded from latency quantiles and remain visible in
success metrics. Ten seeds do not establish a narrow confidence interval.

Representative means across ten seeds (delivery is among TTL-eligible peers;
attempts are directed simulated GATT sends, not RF airtime):

| Cohort | Policy | Eligible delivery | Target successes | Mean attempts | Delivered p95 ms |
|---|---|---:|---:|---:|---:|
| Crowd, 250 nodes, 3 hops, 30% loss | current | 98.956% | 9/10 | 1,479.7 | 384 |
| Same | jitter-only | 100% | 10/10 | 7,731.6 | 277 |
| Same | Trickle-style | 100% | 10/10 | 19,070.3 | 109.249 |
| Sole bridge, 250 nodes, 3 hops, zero loss | current | 54.819% | 1/10 | 602.6 | 465 |
| Same | jitter-only | 100% | 10/10 | 7,614.6 | 463 |
| Same | Trickle-style | 100% | 10/10 | 14,243.8 | 204.444 |
| Line, 25 nodes, 7 hops, 30% loss | current / jitter-only | 25.714% | 1/10 | 2.7 | 140 |
| Same | Trickle-style | 58.571% | 5/10 | 11.8 | 1,027.502 |

Adverse observations: current cancellation can strand an essential outgoing
branch even with zero loss. At the same sole-bridge cohort, 30% loss increases
current coverage to 63.896% and target success to 3/10 because erased duplicates
can prevent cancellation. This non-monotonicity is a suppression failure mode,
not evidence about collisions. In crowd/250/7-hop/zero-loss, all policies miss
the target due to native TTL limits; even candidate eligible delivery of 100%
means only 75.100% of all other nodes. No simple metres-times-hops claim follows.

Two final full runs took **11.928 s and 12.111 s**. Their JSON, CSV, raw-trial
gzip and source manifest were byte-identical. The benchmark receipt hashes 12
source objects; the overarching verification manifest covers additional
tools, native-baseline files, upstream receipts, protocol and test logs.

## Separate lifetime/contact slice and gateway plan

The RAM-only contact model carries one synthetic 25-byte frame with trusted
source-born/lifetime metadata outside its payload. Contact at 900 ms succeeds;
contact at source expiry 1,000 ms fails, including after a duplicate at 999 ms.
Holding consumes age; copies inherit the same expiry. TTL is independent and
outgoing relay TTL is frozen at first forwarding contact, so a later degree
change cannot upgrade it. This first-contact choice differs from R3's immediate
admission snapshot and is explicit synthetic behaviour.

No persistent storage, live courier, authenticated remote clock, global copy
budget, multi-message eviction policy, position coalescing or incident-specific
acknowledgements were added. These remain R4 work, not implied by this fixture.

The [gateway plan](../intake/2026-10-03-ble/routing-couriers-and-gateways.md#concrete-dedicated-gateway-experiment-plan)
specifies BLE clusters → gateway hosts → serial long-range companions →
repeaters → second cluster. Start with MeshCore's bounded opaque datagrams,
then compare LoRaMesher on comparable hardware. Tunnel canonical raw 47-byte
native frames so sender/timestamp/TTL are preserved; do not re-originate.
Bound the outer scope, identity, age, gateway hop budget, loop/dedup, queues and
authentication; use synthetic packets until phone identity/security gates pass.
Test uplink/downlink, bearer/Anchor/Gateway outages and BLE-only controls.
Consumers do not require the long-range bearer. No firmware/radio was built,
flashed, deployed or physically tested here.

## Toolchain, checks and limitations

Exact lockfile install succeeded: Node 22.22.3, npm 10.9.8, TypeScript 6.0.3,
Expo 57.0.8, Jest 29.7.0; macOS 14.5 (23F79), arm64. CI uses Node 22.18.0.
Dependency lock SHA256 remains
`f2c24b1f4b2977846110b333d6fcad2a6413aa84fbd79c1710f25de6670de395`.

- Final scoped checks: **294/294** (247 inherited + 18 policy + 29 simulator).
- Existing Jest: **36/36 suites, 484/484 tests**.
- Root TypeScript, lint, whitespace check: PASS.
- Supplementary Expo Doctor 1.20.4: **19/21**, fails Hermes V1 regression
  guidance and 28 package-version mismatches in the unchanged baseline.
- `npm audit`: **15 affected dependency entries**, 11 high/4 moderate,
  zero critical. These are package entries, not 15 distinct confirmed exploits.
  The lockfile is unchanged; no automatic upgrade/downgrade was applied.

Raw logs are losslessly compressed alongside the result with hashes. A blank
TypeScript log represents an exit-0 invocation, recorded by the manifest.
Existing Jest has Expo notification mock warnings; all tests passed. This is
host software evidence, not app reconciliation, native compilation, BLE capture,
radio, device, provider, security-certification or battery evidence. No affected
production/native code was changed; native builds and physical gates were not run.
GitHub independently passed installation, all 294 scoped checks and hash
verification, all 484 Jest checks, root TypeScript and lint for application
commit `f4436b54ceb1e0efb9762ad7c721c3b826c4fcc6` in both
[push run 37080868420](https://github.com/EmotiveImpact/loc8/actions/runs/37080868420)
and [PR run 37080933888](https://github.com/EmotiveImpact/loc8/actions/runs/37080933888).
The [CI receipt](2026-10-03-ble-density-ci.json) and compressed CI log record that
application snapshot; the follow-up receipt commit changes documentation and
generated-diff attributes only. Inspect the draft PR's actual head before
promotion. Dependency warnings remain promotion blockers.

The simulator has ideal static directed links, canonical peers, independent
erasures and one source attempt/message. It omits MAC/queues/link retries,
discovery, MTU, iOS role double-counting, churn, correlated losses, multiple
originators and background scheduling. An initial source-to-neighbour loss
cannot be recovered by relay retries; a separate source-repeat regression
proves that limitation. No capacity/energy/RF claim follows from attempt counts.
Seen expiry/eviction permits replay admission; unsigned native duplicates can
be forged. Unique-link counts are not authenticated unique-peer topology.

## Reproduce, verify and continue

```sh
npm ci
node --test tools/mesh-rnd/verify.node.cjs tools/mesh-rnd/freshness.node.cjs tools/mesh-rnd/source-location.node.cjs tools/mesh-rnd/programme.node.cjs tools/mesh-rnd/relay-policy.node.cjs tools/mesh-rnd/relay-simulation.node.cjs
npm test -- --runInBand
npx tsc --noEmit
npm run lint
node tools/mesh-rnd/verify-relay-evidence.cjs
node tools/mesh-rnd/verify-relay-evidence.cjs --rerun
node tools/mesh-rnd/analyze-relay.cjs
node tools/mesh-rnd/benchmark-relay.cjs --out /tmp/loc8-relay-new-run
```

Hash-only verification checks a recorded run; `--rerun` repeats the 5,400-run
model and compares artifact hashes, not Jest/native/radio tests. All durable
data are in [the evidence directory](evidence/2026-10-03-ble-density/) with
`relay-manifest.json`, `verification-manifest.json`, full trial gzip, aggregate
JSON/CSV, gate JSON, raw logs and repository inspection receipt. All packets,
graphs and contacts are synthetic; no private locations or customer captures.

Next work in order:

1. Separate sparse retry benefit from dense suppression cost; test per-link
   forwarding and branch-safe first-send semantics. Keep wire and default held.
2. Add realistic offered load, bounded queues, asymmetric/churn/dual-role links,
   burst/correlated loss and measured GATT latency before interpreting density.
3. Later add independent MPR graph/oracle comparator with stale topology;
   keep oracle knowledge out of consumer assumptions.
4. Run unchanged MESH-01 E01 (200 packets, >=95% within 10 seconds, isolated
   A-B-C plus B-absent controls), then locked/background/mixed-OS/battery cohorts.
5. Resolve baseline dependency warnings in separate reviewed work. Reconcile
   parent PRs and verify exact final combined tree before any merge.
6. Run separate DPCS power/discovery/staleness bench and optional gateway
   RADIO-01 plan. Authenticated age/scope/retention precedes live courier storage.

Recommended production decision: **keep current default and 25-byte format;
continue R3 tuning with the retained adverse result.** Review source/CI evidence
and external gates before authorising a native experiment. Nothing merged or
deployed by this branch.
