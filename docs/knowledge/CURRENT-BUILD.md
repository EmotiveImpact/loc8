# Current build entry point

Prepared 25 September 2026. This pointer connects the preserved archive to
ongoing development; it does not merge the application or replace KNOWLEDGE.md.

## Where to continue

Read [LOC8_MASTER_PLAN.md at the R1b implementation](https://github.com/EmotiveImpact/loc8/blob/ff059279e77b20ae863281328e2253c2c0516816/LOC8_MASTER_PLAN.md), then the
[source-location implementation receipt](https://github.com/EmotiveImpact/loc8/blob/ff059279e77b20ae863281328e2253c2c0516816/docs/research/rnd/results/2026-09-25-source-location.md).
The source-linked dependency and meaning map is
[docs/programme/roadmap.json](https://github.com/EmotiveImpact/loc8/blob/ff059279e77b20ae863281328e2253c2c0516816/docs/programme/roadmap.json).

These are in existing PR #4, branch `rnd/position-freshness-2026-09-25`.
Implementation commit: `ff059279e77b20ae863281328e2253c2c0516816`.
Later commits on that branch add CI diagnostics; inspect its live head rather
than assuming the implementation commit is always the latest branch revision.

Public Loc8 and Guard now retain the original local GPS sample timestamp and
full reported accuracy. The legacy 25-byte wire still uses publication time,
so stationary heartbeats remain compatible and remote true sample age remains
unverified. No radio-policy, mandatory-infrastructure or protocol replacement.

247 local checks passed: 242 scoped software checks plus five programme checks.
The same checks passed again from a complete tracked-source snapshot whose Git
tree exactly matches the implementation commit. This does not establish a full
dependency-resolved app/native or physical-radio pass.

## PR integration map

- #3: preservation and research archive, based on main.
- #1: shared input/reassembly/lifecycle hardening, based on main.
- #4: freshness and original-source retention, currently stacked on #1.
- #2: delivery issue tracker, not another PR.

Review and integrate #3, validate/integrate #1, then retarget/reconcile #4 onto
main and verify the combined tree before release. No merge or deployment was
performed. Preserve dependencies and branch history until retargeting is complete.

## New evidence and remaining gaps

GitHub Actions artifact 10888849187 from run 36193682024 yielded a complete
640-file tracked-source snapshot. The artifact names synthetic PR merge commit
`0646574ebfbe7ad38a705aa725b1f1669c144eb4`; reconstructing its complete Git tree
produces `4789615a31b3882b2061e176164cba5ef18f18df`, exactly the R1b application
commit's tree. It is not Git history or a backup of ignored upstream clones.

The two recovered historical Command HTML originals remain intact in the
companion backup but are not newly uploaded byte-for-byte to this repository.
Full standalone Command history/source, ignored clone directories and the raw
conversation archive remain unrecovered. Do not label the tracked snapshot as
those missing originals.

Repository metadata now reports public visibility. This task did not change
that setting. Do not assume this repository is private when adding recovered
customer, location, security or other confidential material.

## Next work

Continue truthful asynchronous command submission and immutable incident/recipient
correlation in the existing Command store/bridge. Keep R1c remote source-time
semantics, complete-toolchain verification, security/provider review, building
commissioning and physical phone tests as separately evidenced gates. Consult
PR #4 for current CI results: the historical no-runner failure is not necessarily
the latest state. Do not claim green CI without reading the actual latest run.
