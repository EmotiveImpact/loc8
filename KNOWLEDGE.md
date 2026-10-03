# Loc8 — recovery and knowledge entry point

**Prepared: 25 September 2026. Scope: Loc8 research, product continuity and cross-conversation handoffs.**

This is the entry point for the recovery package, not a replacement for the existing product specification or R&D department. Read this file before historical briefs. Follow the linked current contracts before implementing anything.

## 1. What survived, and what did not become a repository backup

The repository already contains the worktree R&D department in `docs/research/rnd/`, including its catalogue, retained-source assessment, licence/reuse ledger, experiments, results and decisions. Its README identifies the historical worktree branch `claude/recursing-montalcini-d59018` and a retained library of 48 upstream repositories. It also explicitly says that `repos/` and `tmp/` are ignored. The tracked research therefore survived; a commit of the application did not back up those ignored clone directories.

This establishes a preservation gap, not the cause of any deletion on the owner's computer. That computer's disk, Git reflogs and worktree directories were not inspected in this recovery. Do not claim that a worktree was deleted, that every clone was recovered, or that the whole conversation archive was exported.

The companion conversation ZIP contains eight exact recovered Library files, a combined reading copy, these new documents, a source inventory, and verification tooling. Its inventory distinguishes original bytes from new synthesis. The two recovered standalone Command HTML previews are historical demonstration artifacts, not the missing full local React/Pixi/Tauri source repository. The older and newer handovers have different evidence limits; do not combine their test counts.

## 2. Pinned implementation and delivery state

| Item | Verified state at recovery |
|---|---|
| Repository | Private `EmotiveImpact/loc8`. |
| Main baseline | `f6b09a492c362f1c73b775d67721da1cc345fe91`. |
| Existing BLE work | `rnd/ble-hardening-2026-09-25` at `3421390a19643ac6f621d8b9faafa7d7b4fcae62`. |
| Existing review | [Draft PR #1](https://github.com/EmotiveImpact/loc8/pull/1), open and unmerged when checked. |
| This preservation change | Based on main; documentation and isolated reference tests only. Does not merge PR #1, change the production radio, or deploy an application. |
| Full device/source recovery | Not established. No full local clone, ignored upstream source library, physical phones, native installers or complete raw chat export was recovered in this session. |

The earlier hardening receipt records 80/80 scoped checks, 25,000 seeded wire mutations and 14 legacy encoding fixtures. Its new suite produced 42 passing and 38 failing checks on its baseline; these are not 38 distinct vulnerabilities. Those results belong to that earlier increment and were not rerun by this archive task. Its environment used Node 22.16 and TypeScript 5.8.3 rather than the repository's requested TypeScript ~6.0.3. Full dependency-resolved repository, app and native validation remain separate.

Source: [pinned hardening programme](https://github.com/EmotiveImpact/loc8/blob/3421390a19643ac6f621d8b9faafa7d7b4fcae62/docs/research/rnd/BLE-RND-2026-09-25.md) and [implementation receipt](https://github.com/EmotiveImpact/loc8/blob/3421390a19643ac6f621d8b9faafa7d7b4fcae62/docs/research/rnd/results/2026-09-25-mesh-hardening.md).

## 3. The decisions that must not get lost again

**Product:** public Loc8 remains an offline phone-to-phone friend-finder, with no mandatory account, server, Internet or installed venue hardware for its core flow. Guard and Command retain the shared engine. Optional infrastructure improves the lower layer; it must not quietly become a consumer prerequisite.

**Transport correction:** the inspected native iPhone implementation already uses advertising for discovery and GATT links for mesh data. Its 25-byte logical packet is not the entire native radio frame; the inspected egress frame is 47 bytes and the central-link limit is six. Native code owns forwarding, deduplication and hop policy. Do not restore an advertisement-only implementation claim from the July handover or add a competing JavaScript relay scheduler.

**Delivery truth:** a queued task, local API submission, relay receipt, destination receipt, human acknowledgement and completed action are different facts. A log entry or toast proves none of the later stages. An open connection does not make an old position current.

**Research is not product proof:** more phones can improve path availability and increase contention. Neither seven hops nor a nominal 100-metre range establishes venue coverage. Bluetooth SIG Mesh address capacity, dedicated-node measurements and industrial positioning datasets are not ordinary-phone Loc8 capacity results.

**Hardware boundaries:** Gateway is the logical site brain; Anchor is a radio-extension role with bounded transient state. Phones do not gain LoRa by installing software. Do not silently add multi-Gateway orchestration. Preserve the existing Loc8OS daemon names: `meshd`, `relayd`, `sited`, `syncd`, `provisiond`, `supervisord`.

**Existing building work:** retain the shared semantic venue package, routing profiles, Command Map Builder, Guard projections, Gateway package-distribution simulator, sensor replay and plan-registration work. Historical software checks are not physical building/floor truth. Do not restart this work as a new architecture.

**Command:** the no-drop feature manifest, application map, product blueprint and visual-finish contract govern redesign. Preserve incident management, dispatch, duress meaning, muster, roster/assignments, assisted search, privacy/audit, commissioning/buildings, coverage, desktop/tablet and the glasses/Vision boundary. A prettier demo does not replace these capabilities.

**Commercial sequence:** the repository records a connected-first operational lane; revenue is not universally gated on proving the phone mesh. Keep connected-pilot readiness, resilience proof and mapping/floor differentiation as parallel lanes. Do not make unproved offline claims in the connected pilot.

**Privacy and safety:** no all-attendee tracking view, no newly persistent public identity, no identifiable crowd traces in source control, no invented cryptography, no claim that awareness tools replace emergency services, trained staff, PA, radios or statutory procedures.

Sources: [knowledge base](docs/README.md), [R&D department](docs/research/rnd/README.md), [owner status](docs/OWNER-PRODUCT-STATUS.md), [Command manifest](docs/product/COMMAND-FEATURE-MANIFEST.md), and the pinned September programme above.

## 4. One map to the existing body of work

| Need | Start with these tracked files |
|---|---|
| Current product and unfinished gates | `docs/OWNER-PRODUCT-STATUS.md`, `docs/MASTER-CHECKLIST.md`, latest entries in `docs/CODEX-CLAUDE-HANDOFF.md`. |
| Principal R&D continuity | `docs/research/rnd/PRINCIPAL-AUDIT-2026-07-22.md`, `decision-log.md`, `research-questions.md`, `research-program.md`. |
| All 48 upstream candidates | `docs/research/rnd/repository-snapshot.tsv`, `retained-repository-source-audit.tsv`, `RETAINED-REPOSITORY-ASSESSMENT-2026-07-22.md`, `catalogue.md`. |
| Mesh and interrupted delivery | `docs/research/rnd/mesh-and-resilience.md`, `experiments.md`, `results/`, and the September hardening programme. |
| Floor and building intelligence | `docs/research/rnd/floor-detection.md`, `building-mapping.md`, `innovation-opportunities.md`. |
| Command and Vision | `docs/product/COMMAND-PRODUCT-BLUEPRINT.md`, `COMMAND-FEATURE-MANIFEST.md`, `COMMAND-APPLICATION-MAP.md`, `VISION-COMMAND-HANDOFF.md`, `docs/design/COMMAND-VISUAL-FINISH.md`, `apps/command/BUILD-PROMPT.md`. |
| Appliance and radio hardware | `docs/hardware/loc8-gateway.md`, `CATALOGUE.md`, `anchor-deployment.md`, `docs/software/loc8os.md`, `mesh-network-design.md`. |
| Business and commercial research | `docs/BUSINESS.md`, `docs/strategy/`, `docs/research/market-expansion-report.md`, `gtm-execution-report.md`. These are historical research records; recheck prices, laws and market claims before use. |
| Reuse in another conversation | [Transfer packs](docs/knowledge/TRANSFER-PACKS.md). |
| New source triage | [Research ledger](docs/knowledge/RESEARCH-LEDGER.md). |
| Preventing another local-only handoff | [Preservation protocol](docs/knowledge/PRESERVATION.md). |

The archive preserves historical errors as evidence of how the work evolved; it does not reactivate them. In particular, the old arena report's fixed-backbone advice and the July handover's advertisement-only implementation claims do not override the current boundaries above.

## 5. What to build from the findings

The [transfer packs](docs/knowledge/TRANSFER-PACKS.md) develop three concrete ideas: an observation-freshness projection, an evidence-based delivery record, and a coverage-aware building model. The first two have a small dependency-free reference model in `tools/knowledge-reference/`, outside the application. It demonstrates invariants using synthetic input; it does not integrate live stores, authenticate wire messages, change packet formats or provide measured radio results.

Run its isolated checks with:

```sh
node --test tools/knowledge-reference/contracts.test.mjs
```

For production, implement the next narrow change in existing stores/selectors and interfaces, not by importing an independent demo database. Preserve experiment IDs and acceptance gates. Specifically, retain `MESH-01 E01`: A and C isolated from direct reception, B relays, at least 95% of 200 small control packets within ten seconds, no duplicate application delivery, both directions, and B-absent controls. This is an unpassed acceptance criterion, not a result of this archive.

## 6. Continuation prompt

> Continue Loc8 using the recovery branch `archive/loc8-knowledge-2026-09-25`. Read `KNOWLEDGE.md`, `docs/knowledge/PRESERVATION.md` and the relevant section of `docs/knowledge/TRANSFER-PACKS.md`. Inspect the current destination branch and its applicable AGENTS.md before editing. Preserve all existing architecture, product boundaries, no-drop capabilities and unfinished work. Treat PR #1 as unmerged unless GitHub now proves otherwise. Reconcile this handoff with current code; do not reset the project or infer production readiness from synthetic tests. Implement the smallest useful next slice, run its applicable checks, and write the result and limitations back to tracked documents. Report the remote branch, exact commit and changed files only after reading them back from GitHub. Do not leave the only copy in a worktree, ignored directory, transient download or chat summary.
