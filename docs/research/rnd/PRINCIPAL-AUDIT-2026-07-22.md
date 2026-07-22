# Principal R&D consolidation audit — 2026-07-22

This is the Codex-to-Claude continuity record for the temporary-sprint review.
It records what was actually inspected, reproduced, corrected, retained and
held. A green unit test is evidence for its narrow fixture only; it is not a
field, security, capacity or pilot-readiness claim.

## Current continuation addendum — read before the historical body

The temporary-worktree consolidation below remains valid history, but its
dependency truth, 36-project count, autonomous queue and statement that local
`main` is synchronized were superseded by later Principal work on the same
canonical branch. Use the latest section of
[`../../CODEX-CLAUDE-HANDOFF.md`](../../CODEX-CLAUDE-HANDOFF.md), the current
question board and decisions `RDD-014` through `RDD-019` for continuation.

Later verified checkpoints:

- `FLOOR-01`: preregistration `8cff81a`, artifact `fc2f536`, principal
  correction `51bbbb7`; PROMOTE pure corpus/recorder/evaluator contract, REPEAT
  native/physical, HOLD collection and accuracy claims.
- `MAP-01`: preregistration `37e9eb1`, artifact `d023690`, principal correction
  `74eb9b3`; PROMOTE pure semantic/route graph contract, REPEAT a permissioned
  real building and product adapters, HOLD route/safety/deployment claims.
- `SEC-05`: preregistration `5ac8e76`, result `9afbf85`; 88/88 tests and 67
  parser adversaries pass, but zero of ten providers clear every gate. PROMOTE
  contracts only; REPEAT SEC-05 E07; HOLD all cryptography/security claims.
- `MESH-01`: preregistration `29938c4`/`88b7182`, kit `5815608`, repair
  `9f394b8`, result `65763e8`; evaluator 100/100 and protocol 5/5 pass, pure
  recorder harnesses pass and the actual Android module packages. The decision
  remains `HOLD-PHYSICAL`: zero physical relay attempts exist.
- Dependency/tooling truth at `9f394b8`: lint zero, `npm audit` zero, Expo Doctor
  20/20, product Jest 28/28 suites and 279/279 tests, all TypeScript checks and
  isolated prebuild/autolinking pass. Xcode 16.2 still cannot close the SDK 57
  iOS app build; no full Android app/phone evidence exists.
- Retained-source truth at `5ea7b89`: 48/48 repositories have pinned source
  blobs, licences, code-versus-idea classifications and next gates. Forty-six
  retained branch tips matched GitHub; Meshtastic/Tink C++ advanced and remain
  pinned for reproducibility. Broad discovery remains held.
- Final shared-record regression: product lint, 28/28 Jest suites and 279/279
  tests, all three TypeScript configurations, Expo Doctor 20/20, Expo dependency
  check and zero-vulnerability audit pass; six pure R&D suites pass 376/376 and
  the connected relay core passes 24/24. All 48 source blobs and 174 local
  documentation links revalidate exactly.

The user's `.claude/launch.json` remains modified, untouched and unstaged. No
remote push has been authorised. Root `main` also contains an unrelated untracked
`.codex-audit/`, which is preserved and excluded. Local-main integration must be
re-verified and performed only after the latest shared records and final
regression pass.

## Status and canonical location

- **Canonical R&D worktree:**
  `/Users/augustusedem/Loc8/.claude/worktrees/recursing-montalcini-d59018`
- **Canonical branch:** `claude/recursing-montalcini-d59018`
- **Review base:** `6bc1f44ebbc2886c14c2e92901f6f36f4bf5c5be`
- **Preserved protocol commit:** `aaed1a6` (`research(rnd): audit protocol v2 boundary spike`)
- **Preserved connected-boundary commit:** `338612a` (`research(rnd): harden connected relay boundary`)
- **Consolidated shared-record commit:** `dc04bd7` (`docs(rnd): consolidate audited sprint results`)
- **Local-main integration:** completed by fast-forward; no remote push was performed.
- **User-owned edit preserved:** `.claude/launch.json` remains modified and was
  never staged or changed by Codex.
- **Product source changed:** only the new, non-runnable
  `services/loc8-relayd` boundary. No app, engine, native BLE, Command, Guard or
  `tools/mesh-bridge` behaviour was integrated or enabled.

Final full-workspace verification, shared-record commit, local-main integration,
temporary-worktree removal and task archival all completed successfully. The
canonical branch and local `main` are synchronized after this ledger update.

## Why the temporary worktrees existed

Three Codex tasks were initially created with separate Git worktrees. That was
the wrong default for research-only specialist conversations: it duplicated
checkout views without giving each task a distinct, integrated objective. The
correct operating model is one canonical R&D worktree with multiple read-only or
non-overlapping specialist tasks, and one principal writer/integrator. A separate
worktree is justified only for genuinely concurrent overlapping code changes or
a destructive experiment.

Measured facts:

- each new Codex checkout was about 10 MiB, not 1 GiB;
- the large storage was older ignored/generated material in the Claude R&D
  worktree: the retained research clone library and `node_modules`;
- all temporary Codex worktrees referenced the same Git object store and began
  at `6bc1f44`;
- the floor task was clean and produced no files, so it was archived and removed
  before consolidation;
- the protocol and connected tasks contained distinct uncommitted candidate
  outputs plus conflicting edits to shared R&D records.

The reviewed unique outputs were preserved in the canonical commits listed
above. The two temporary worktrees were then force-removed and their tasks
archived. Their uncommitted shared-record variants were intentionally discarded
because the principal audit had already reconciled the valid facts into
`dc04bd7`; those discarded variants were not treated as independent evidence.

## Audit procedure actually performed

1. Inventoried branch, HEAD and dirty state for main, the canonical Claude R&D
   worktree and all three Codex worktrees.
2. Preserved the user-owned `.claude/launch.json` modification.
3. Read every candidate protocol source, test, benchmark and result file, plus
   every candidate connected-relay source, test, benchmark and result file.
4. Compared protocol assertions against current Loc8 TypeScript, Swift and
   Kotlin codec, trust, fragmentation, relay, dedup and bridge source.
5. Verified pinned commits, remotes and root licences for BitChat, Columba,
   Weshnet, MeshCore, Meshtastic firmware and Reticulum.
6. Inspected BitChat's pinned source and tests for Noise, prekeys, topology,
   source routing, fanout, fragmentation, outbox, courier and reconciliation
   claims rather than relying only on its whitepaper.
7. Applied the repository security-review rules: fail-closed dependencies,
   bounded inputs/state/queues, strict proxy trust, exact origins/endpoints,
   memory-only short-lived bearer handling, allowlisted logs and dependency
   pinning.
8. Read the exact Expo SDK 57 reference. It states React Native 0.86, React
   19.2.3 and minimum Node 22.13.x.
9. Reproduced installed dependency state, `npm audit --omit=dev`,
   `expo install --check`, registry versions and both `ws` dependency paths.
10. Reran corrected standalone tests, benchmarks, JSON parsing, evidence hashes
    and whitespace checks before preserving the two candidate commits.
11. Cherry-picked only the reviewed non-overlapping directories. Competing
    sprint edits to the handoff, question register and decision log were not
    copied; this principal pass reconciles them once with unique IDs.
12. Added `services/loc8-relayd/` to root Jest discovery/module exclusions. Its
    `.mjs` Node tests use their explicit `npm --prefix services/loc8-relayd test`
    runner and must not silently change the 27-file Expo/Jest product suite.

## Protocol-v2 result retained

Read these together:

- [`prototypes/protocol-v2-boundary/README.md`](prototypes/protocol-v2-boundary/README.md)
- [`results/SEC-01/2026-07-22-protocol-v2-boundary/README.md`](results/SEC-01/2026-07-22-protocol-v2-boundary/README.md)
- [`results/SEC-01/2026-07-22-protocol-v2-boundary/protocol-v2-adr.md`](results/SEC-01/2026-07-22-protocol-v2-boundary/protocol-v2-adr.md)
- [`results/SEC-01/2026-07-22-protocol-v2-boundary/threat-identity.md`](results/SEC-01/2026-07-22-protocol-v2-boundary/threat-identity.md)
- [`results/SEC-01/2026-07-22-protocol-v2-boundary/field-classification.md`](results/SEC-01/2026-07-22-protocol-v2-boundary/field-classification.md)

Reproduced evidence:

- 11/11 dependency-free Node tests pass;
- exact v1 type range and current native/application field claims match source;
- deterministic 32-node ring-plus-chords cohorts reproduce 97.40625–100% normal
  traffic delivery and 57.38–83.38% attempted-send reduction at target degrees
  8/16/31 versus the simulator's full-fanout baseline;
- the result explicitly has no radio loss, mobility, OS suspension, native BLE,
  battery, device or building evidence.

Defects found and corrected during principal review:

- same-epoch migration policy could alter the dual-mode legacy allowlist;
- restored migration state did not validate legacy-type contents;
- reviewed-provider exceptions escaped instead of failing closed;
- verified topology accepted older and same-time conflicting observations;
- the pre-registered failed-next-hop case had no implementation or assertion;
- result files overclaimed independently proven preregistration timing; and
- runtime records did not distinguish the sprint-reported Node 22.12.0 from the
  principal rerun on Node 22.22.3.

Important upstream correction: BitChat's pinned whitepaper describes static-key
courier Noise X as lacking forward secrecy and calls prekeys future work, while
the same pinned public-domain source implements signed/gossiped one-time prekey
bundles, prekey-targeted Noise X, consumption/grace/deletion logic and related
tests. This makes the prekey design a high-value bake-off candidate. It does not
make the upstream composition independently reviewed or safe to copy blindly.

Decision: promote the bounded prototype interfaces and candidate invariants into
the engineering specification; repeat native, lossy and physical work; hold all
cryptographic implementation, courier/outbox/gossip product work, v2 operational
enablement and security claims.

## Connected-product boundary retained

Read these together:

- [`../../../services/loc8-relayd/README.md`](../../../services/loc8-relayd/README.md)
- [`results/CONN-01/2026-07-22-product-boundary-repeat/README.md`](results/CONN-01/2026-07-22-product-boundary-repeat/README.md)
- [`results/CONN-01/2026-07-22-product-boundary-repeat/production-contracts.md`](results/CONN-01/2026-07-22-product-boundary-repeat/production-contracts.md)
- [`results/CONN-01/2026-07-22-product-boundary-repeat/measurements.json`](results/CONN-01/2026-07-22-product-boundary-repeat/measurements.json)

The relative service link above resolves from `docs/research/rnd/` to the
repository's `services/loc8-relayd` directory.

Reproduced evidence after correction:

- 24/24 dependency-free tests pass across six suites, up from the candidate's
  initially green 21-case suite;
- 0/1,000 valid test frames crossed the two fake site boundaries;
- 10,000/10,000 in-process routes delivered in each local benchmark;
- five immediate timing repeats produced p95 0.0018–0.0025 ms;
- those timings use fake ports and sockets and are not network, concurrent-load,
  venue, TLS, database or capacity evidence.

Defects found and corrected despite the earlier 21/21 result:

- concurrent asynchronous admissions could cross configured connection limits;
- any shape-only object with `byteLength: 25` could pass as a frame;
- an admitted session could outlive its capability indefinitely;
- slow-consumer age used wall time rather than monotonic time;
- the header logger retained unknown headers despite the stated allowlist rule;
- audit hashing depended on object property order and accepted weak metadata;
- audit bundle verification accepted malformed hash metadata; and
- the client did not reject capability text unsafe for WebSocket subprotocols.

The core still deliberately has no signer, token format, production verifier,
database, TLS listener, proxy adapter, WebSocket dependency, certificate
lifecycle, deployment image or runnable daemon. It has not been wired to
Command, Guard or the demo relay.

Decision: promote the dependency-injected boundary, finite controls and tests;
repeat with reviewed identity, durable stores, a pinned real adapter/TLS/proxy
and recovery drills; hold every pilot/readiness claim.

## Dependency and runtime truth

- Exact Expo 57 docs: minimum Node 22.13.x.
- Main checkout currently selects Node 22.12.0 and is below that minimum.
- Canonical R&D worktree selects Node 22.22.3 and satisfies it.
- Installed Expo baseline is 57.0.2; current registry and SDK-aware check expect
  Expo 57.0.7 plus matching SDK-57 package patches.
- Tool-local `ws` is 8.21.0; transitive React Native/Metro `ws` is 7.5.11;
  current registry `ws` is 8.21.1.
- `npm audit --omit=dev` reproduces 12 findings: 1 high, 11 moderate, 0 critical.
  The high finding is `test-exclude -> brace-expansion <1.1.16`; moderate paths
  include Expo configuration and `xcode -> uuid <11.1.1`.
- The audit's suggested Expo 46.0.21 force path is incompatible with the required
  Expo 57 line and was not applied.
- No install, force fix, Expo downgrade or lockfile mutation was performed in
  this consolidation.

Decision: dependency readiness remains HOLD. Product development must pin one
supported Node environment, apply SDK-57-aware patch updates on an isolated
review branch, inspect the lock/native-project diff, rerun diagnostics/builds,
and explicitly close or accept every residual advisory.

## What was deliberately not retained

- The empty floor-sprint checkout: no files or evidence existed.
- Either sprint's edits to shared handoff/question/decision files: they used the
  same `RDD-012` number, stale test counts and conflicting environment wording.
- Any claim that passing local pure-code tests proves cryptographic security,
  physical mesh delivery, relay capacity, floor accuracy or pilot readiness.
- Any upstream GPL, AGPL, MPL or custom-licensed source copied into product.
- Any BitChat cryptographic file copied merely because it is public domain.
- Any integration with the plaintext `tools/mesh-bridge` or arbitrary production
  `?bridge=` endpoint.

## Useful collection and next research questions

The full 36-project, pinned, licence-aware assessment remains in
[`catalogue.md`](catalogue.md). Broad cloning is now held; the collection is
large enough to drive experiments.

Highest-value direct candidates:

- BitChat public-domain protocol components, now including its prekey candidate;
- Bermuda receiver calibration, RSSI history, staleness and floor/zone
  hysteresis;
- Navigine and blelocpp filtering/particle-floor evidence;
- Anyplace building/floor/POI/connector schemas;
- PALMS commissioning/relocalisation;
- hdl_graph_slam floor-plane constraints;
- MeshCore/LoRaMesher and RadioLib for a later gated hardware bake-off; and
- Weshnet replicated-event-log concepts.

Current autonomous queue:

1. `FLOOR-01`: freeze the privacy-aware sensor/event/ground-truth schema and
   replayable corpus manifest before implementing the Expo logger.
2. `MAP-01`: freeze stable building/floor/connector/zone IDs and a minimum
   semantic graph aligned with that corpus.
3. `SEC-05`: compare reviewed cryptographic libraries and logical-frame/
   credential/prekey vectors; do not implement local primitives.
4. `MESH-01`: run the physical three-phone relay gate immediately when suitable
   devices/layout exist; simulation cannot close it.
5. Connected product development: implement real identity, durable replay/
   revocation/policy/audit stores and pinned TLS adapter only as a separate
   product repeat with recovery and external review.

Still unproven: three-phone relay, mixed-platform/background behaviour,
shift-length battery, lossy/dense fanout, native protocol-v2 interoperability,
floor accuracy, multi-building generalisation, automatic building capture, real
identity and revocation, durable audit/restore, real TLS/proxy operation, mobile
builds after dependency remediation and an operational customer exercise.

## Instructions for Claude Code

1. Start with this file, then `README.md`, `research-questions.md` and
   `decision-log.md`.
2. Work in the canonical R&D worktree above. Do not create another clone library
   or repeat broad discovery unless the quarterly watch gate fires.
3. Read the exact Expo SDK 57 docs before any Expo code.
4. Treat `repos/` as read-only research source. File-level adoption requires
   provenance, licence notice, dependency review and tests.
5. Preserve PROMOTE/REPEAT/HOLD distinctions. Never upgrade synthetic or fake-
   port evidence into a field or readiness claim.
6. Append evidence and superseding decisions; do not silently rewrite adverse
   results.
7. Do not touch the user's `.claude/launch.json` change.

## Consolidated verification

The following passed from the canonical R&D worktree on Node 22.22.3 after the
shared-record reconciliation:

- root Jest discovery: exactly 27 Loc8 product test files, no research clones and
  no relayd Node-suite files;
- root product Jest: 27/27 suites, 274/274 tests; the known open handle still
  requires `--forceExit` and remains an explicitly unresolved test-harness issue;
- root, Guard and Command TypeScript checks;
- original secure-relay research suite: 14/14;
- corrected protocol-v2 suite: 11/11;
- corrected relayd suite: 24/24 across six suites;
- all three research benchmarks and their declared gates;
- JSON parsing for package/result manifests and measurements;
- evidence SHA-256 values against both result manifests;
- `git diff --check`; and
- 60 relative Markdown links across 26 R&D/handoff Markdown files, with zero
  missing targets.

This verification still does not include native iOS/Android builds, physical
phones, real TLS/network/database adapters, customer data or a building corpus.

## Completion checklist

- [x] Candidate inventory and exact diff preservation
- [x] Protocol source/licence/code/test/benchmark audit
- [x] Connected source/security/dependency/test/benchmark audit
- [x] Corrected commits cherry-picked into canonical R&D branch
- [x] Shared R&D records reconciled and committed as `dc04bd7`
- [x] Full Loc8 regression, TypeScript, standalone R&D tests and link/integrity checks
- [x] Canonical branch integrated into local `main` by fast-forward
- [x] Temporary protocol/connected worktrees removed and tasks archived
