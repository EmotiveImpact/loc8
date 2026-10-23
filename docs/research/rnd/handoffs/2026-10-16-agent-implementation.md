# Loc8 coding agent handoff: R4 BLE link health and evidence
**Date:** 16 October 2026
**Authority:** scoped proposed work based on research brief ../briefs/2026-10-16-offline-ble-mesh.md.
**Base:** this handoff branch descends from draft PR #5 at 09932ccb49a2deb67db924ee54c622b7a6302b3f.
**Objective:** bring the newest defensible BLE findings into working diagnostics, deterministic tests and a physical test plan. This is *not* permission to rewrite or ship Loc8.

## Instruction to coding agent (start here)

You are working in the private EmotiveImpact/loc8 repository. Read AGENTS.md (if present at your checkout), LOC8_MASTER_PLAN.md, RESEARCH.md, FIELD-TEST.md, BUILD.md, the 16 October research brief, and the PR #5 changed code/docs before making changes. Read the exact Expo SDK 57 documentation before editing Expo application code. Inspect the current branch and pending PR stack and preserve uncommitted changes; never reset or overwrite someone's work.

Create a **new implementation branch from this 16 October research-handoff branch**, not from main. Open a **draft**, stacked pull request with a short description of code changed, source citations, reproducible checks and evidence gaps. Do not merge, deploy or publish app builds.

### Deliverables, in sequence

1. **Baseline and preservation receipt.**
   - Record HEAD SHA, PR ancestry and existing builds/test contracts. Identify the concrete Android, iOS, shared-engine and field-harness telemetry seams and what is already observable.
   - Preserve original MESH-01 matrices/evaluator/source provenance. Do not edit frozen run IDs, thresholds, schemas or model-receipt hashes.
   - Summarise actual existing diagnostics and missing metrics before implementation. If an equivalent feature already exists, extend it rather than building a duplicate.

2. **Native BLE connection-health instrumentation (highest-priority code).**
   - Add an explicitly development/internal gated, bounded and disabled-by-default event/counter facility at the *existing* native BLE seams.
   - Prefer monotonic elapsed timestamps and stable per-run pseudonymous peer references; avoid exposing raw MAC addresses, stable IDs, exact locations or chat contents.
   - Where platform APIs permit, record role (central/peripheral), scan/advertise lifecycle, connection attempts/results, current/max active GATT peers, disconnect/reconnect, transmit queue admission/overflow/expiry, per-send outcome and event loss/overflow.
   - Explicitly distinguish a logical neighbour from an **active GATT connection** and a locally queued frame from destination receipt.
   - Do not assert that app-level events prove controller scheduling collisions. If radio-level timing is inaccessible, store it as "not observed".
   - Keep release builds, UI consumers and production-default relay behaviour identical to baseline unless required to protect test privacy. Keep runtime memory and export size bounded; honour generation/teardown ownership.

3. **Reliability and regression tests.**
   - Add deterministic tests for queued work after disconnect, stale callbacks, connect/disconnect loops, queue exhaustion, reconnection, delayed expiry, duplicate/non-witness branch events, malformed input and restart.
   - Confirm the counters cannot alter forwarding, timer ordering, GATT connection state, packet bytes or TTL.
   - Test both current and branch separately. Preserve the branch performance trade-off; never make branch the default.
   - Where a physical or platform test cannot be executed, add runnable instructions/fixtures and label it PENDING.

4. **Physical protocol extension, not fabricated measurements.**
   - Keep FIELD-TEST.md's original frozen MESH-01 gate exactly as written.
   - Add a *separately identified* preregistered R4 connection-contention/cohort protocol (2, 3, 4 measured simultaneous GATT connections; 2–3 hour sessions; Android/iOS roles; screen states; repeat matched current/branch runs) and machine-readable blank evidence template.
   - Add actual density cohorts only where devices are available; no invented 5/10/25/50 results. Record duration, topology, OS versions, permissions, battery, counts, latency, loss, drift symptoms and trace gaps.
   - Keep device raw logs and personally sensitive RF traces out of the public Git tree; put only redacted, hash-identified receipts in repo.

5. **Limited Loc8OS research continuation.**
   - Add a short design note separating peer capability discovery, directional reachability and transport-adaptor identity (phone BLE/optional Gateway) from actual delivery/acknowledgement.
   - Review SAND and DNS-SD Data Block as *drafts*, not mandated dependencies. Record overhead and testability. No consumer protocol, 25-byte payload, TTL, advertising/GATT architecture or security-promise change in this sprint.
   - For contemplated Zephyr firmware, audit affected API/configuration/version *only if that stack is selected*. CVE-2026-19935/36/37 are not proof of a current Loc8 defect.

6. **Verification and closeout.**
   - Run existing repository CI/scoped tests, native host checks, TypeScript, lint and appropriate build checks. Keep exact command, exit status, environment limitations and commit SHA.
   - Open draft PR on the new implementation branch; update relevant research/roadmap/evidence index with links to the actual tests and any results. Label every physical outcome PENDING until real evidence exists.
   - End with a concise comparison of baseline versus added observability, known limitations, risks, and the first real device experiment the owner must run.

### Hard constraints and stop conditions

- NEVER change default "current" relay to "branch" in normal builds, and do not rewrite current/branch relay implementations simply to chase better numbers.
- NEVER change v1 wire payload 25 bytes, existing native framing 47 bytes, TTL semantics, frozen MESH-01 evaluator or offline, no-required-server consumer boundary.
- NEVER claim simulation proves RF range/energy, native compilation proves phone behaviour, or relay receipt proves destination delivery.
- NEVER expand telemetry into persistent identifiers or covert/background surveillance; diagnostic collection must be opt-in, permissioned and appropriately scoped.
- NEVER bulk-import experimental upstream repositories, unreviewed Zephyr code or research-draft implementations.
- NEVER merge, release, deploy or publish without explicit approval.
- If CI or mobile hardware is unavailable, record precisely what passed, what could not run, and how to resume.

### Success definition

A reviewer can reproduce new native diagnostics and lifecycle tests from code, understand their limits, and execute an unchanged MESH-01 plus a separately preregistered long-running contention cohort. **No field-test performance claim until devices have genuinely been tested.**

### References

- 16 October research brief: ../briefs/2026-10-16-offline-ble-mesh.md
- BUILD.md; FIELD-TEST.md; LOC8_MASTER_PLAN.md; RESEARCH.md
- Existing PR #5: https://github.com/EmotiveImpact/loc8/pull/5
