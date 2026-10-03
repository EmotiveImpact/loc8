# Loc8 research and implementation map

The master programme is [LOC8_MASTER_PLAN.md](LOC8_MASTER_PLAN.md), with
[machine-readable dependencies](docs/programme/roadmap.json). This checkout
contains the research already reconciled into PR #5; continue it rather than
starting a second relay implementation.

| Read | Purpose |
|---|---|
| [2 October brief](docs/research/rnd/briefs/2026-10-02-offline-ble-mesh.md) | OEPB/OEPB-BLE drafts, hardware performance controls, Bluetooth IP Link and what Loc8 should test |
| [Source intake](docs/research/rnd/intake/2026-10-03-ble/README.md) | Pinned code/repository inspections, provenance, licence and reuse decisions |
| [Branch protocol](docs/research/rnd/BLE-BRANCH-PROTOCOL-2026-10-03.md) | Registered v2 hypothesis, unchanged TTL/wire and model gates |
| [Branch results](docs/research/rnd/results/2026-10-03-branch-relay.md) | Model tradeoff, native implementation and exact evidence boundaries |
| [Reattachment fix](docs/research/rnd/results/2026-10-03-relay-reattachment.md) | Active same-mode configuration and stop/listener ownership |
| [Queue continuation](docs/research/rnd/results/2026-10-03-ios-egress.md) | CI-verified bounded iOS egress/expiry, integrated from exact `e18b999` |
| [Original retry result](docs/research/rnd/results/2026-10-03-ble-density.md) | Retained adverse result; Trickle/retry remains HOLD |
| [Mesh and resilience](docs/research/rnd/mesh-and-resilience.md) | Shared architecture, phone coverage, retention and security boundaries |
| [Experiments](docs/research/rnd/experiments.md) | Existing experiment IDs and physical promotion gates |
| [Build commands](BUILD.md) / [field procedure](FIELD-TEST.md) | Turn the candidate into labelled native apps and collect physical evidence |
| [Archive knowledge](https://github.com/EmotiveImpact/loc8/blob/archive/loc8-knowledge-2026-09-25/KNOWLEDGE.md) | PR #3's recovered originals, transfer packs and current-build pointers |

`branch` preserves an uncovered outgoing path after hearing an identical frame
on another link. Its savings were measured against jitter, while it sends more
than `current` in many model cohorts. Keep that tradeoff visible. Native timers,
GATT/advertising, 25-byte payload, 47-byte framing and production default remain
owned by the existing implementation.

Store-carry-forward, structured routing, dedicated periodic-advertising hardware
and optional long-range Gateway/Anchor experiments retain their own research
and gates. They are not dependencies to install wholesale or reasons to change
the public product's infrastructure independence. Physical phone delivery,
queue capacity, background operation and battery remain separate proof layers.

PRs #1/#3/#4, tracker #2 and archive pointers remain preserved. Synced ChatGPT
project `sources/` are reference material and are not edited by this build.
