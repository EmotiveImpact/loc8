# Current build entry point

Updated 3 October 2026. This pointer connects the preserved archive to ongoing
development; it does not merge the application or replace `KNOWLEDGE.md`.

## Where to continue

The current relay/research continuation is **draft PR #5**, branch
`rnd/ble-density-2026-10-03`, stacked on PR #4 and therefore also containing
PR #1/R0. Read:

1. [LOC8_MASTER_PLAN.md](https://github.com/EmotiveImpact/loc8/blob/rnd/ble-density-2026-10-03/LOC8_MASTER_PLAN.md)
2. [2 October BLE research brief](https://github.com/EmotiveImpact/loc8/blob/rnd/ble-density-2026-10-03/docs/research/rnd/briefs/2026-10-02-offline-ble-mesh.md)
3. [PR #5 branch-relay handoff](https://github.com/EmotiveImpact/loc8/blob/rnd/ble-density-2026-10-03/docs/research/rnd/results/2026-10-03-branch-relay.md)
4. [3 October BLE source intake](https://github.com/EmotiveImpact/loc8/blob/rnd/ble-density-2026-10-03/docs/research/rnd/intake/2026-10-03-ble/README.md)
5. [Machine-readable roadmap](https://github.com/EmotiveImpact/loc8/blob/rnd/ble-density-2026-10-03/docs/programme/roadmap.json)

The substantive native relay implementation recorded in PR #5 is
`cee77cd7f63ffb4c1dc083919dd40f97a405f481`. The later programme update
`d796e843f390fcf2ff38ae1b61d760811856a91b` records the OEPB/OEPB-BLE
research delta and the explicit R3 relay workstream. Inspect the live PR head
before assuming either SHA is the newest branch revision.

## What changed

The public/Guard location improvements from PR #4 remain: original local GPS
sample timestamp and accuracy are retained while the legacy 25-byte wire keeps
publication-time heartbeat semantics. Remote true GPS observation age remains
unverified on v1.

PR #5 adds a **research-only native relay candidate**:

- production/default mode remains `current`;
- opt-in mode `branch` keeps the existing jittered relay opportunity but
  suppresses only witnessed return branches instead of cancelling the whole
  scheduled fanout;
- the broader bounded Trickle/retry candidate remains HOLD;
- 25-byte application payload and existing native frame remain unchanged.

The 30 September 2026 OEPB and OEPB BLE-binding drafts are now recorded as
research inputs, together with Silicon Labs Mesh 1.1 performance controls and
Bluetooth SIG IP Link monitoring. They support density-aware redundancy,
small-payload discipline and transport abstraction, but are not treated as
smartphone field proof or IETF endorsement.

## PR integration map

- #3: preservation and research archive, based on main.
- #1: shared input/reassembly/lifecycle hardening, based on main.
- #4: freshness and original-source retention, stacked on #1.
- #5: opt-in branch-preserving relay experiment, stacked on #4.
- #2: delivery issue tracker, not another PR.

Do not flatten these review boundaries until their gates are reconciled. The
target remains one coherent main branch after review, not four permanent
application forks. No merge or deployment is implied by this archive pointer.

## Current promotion boundary

PR #5 contains extensive software/model/native-host evidence, but **no physical
phone/RF/battery/background proof**. The next relay decision still requires the
frozen MESH-01 A–B–C control plus duplicate/branch, density, asymmetric-loss,
churn/load, locked/background and battery cohorts on supported phone builds.

The repo programme explicitly keeps public Loc8 infrastructure-independent.
Gateways and Anchors may improve venue reliability but remain separate product
and evidence lanes.

## Preservation gaps

The two recovered historical Command HTML originals remain intact in the
companion backup but are not newly uploaded byte-for-byte to this repository.
Full standalone Command history/source, ignored clone directories and the raw
conversation archive remain unrecovered. Do not label tracked snapshots as those
missing originals.

Repository metadata previously reported public visibility; this pointer does not
change repository visibility. Do not assume confidential customer/location or
security material is private without checking the current repository setting.

## Next product lanes

Relay: physical comparison of `current` versus opt-in `branch` before any
default change.

Command: truthful asynchronous submission and immutable
command/incident/recipient correlation.

Location: R1c end-to-end source-time/capability design and remaining freshness
consumers.

Parallel evidence lanes: reviewed security/storage providers, building/floor
commissioning, Gateway/Anchor durability and physical MESH/FLOOR/RADIO tests.
