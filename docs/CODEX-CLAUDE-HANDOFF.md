# Loc8 research review - Codex to Claude Code handoff

**Created:** 2026-07-21
**Working branch:** `claude/recursing-montalcini-d59018`
**Working tree:** `/Users/augustusedem/Loc8/.claude/worktrees/recursing-montalcini-d59018`
**Purpose:** preserve the full context of Codex's repository/research review so Claude Code can continue without repeating discovery work or reviving claims that later research refuted.

## Read this first

The newer worktree contains the real research corpus. The checked-out root
`main` worktree is materially older and contradictory. Work from this branch.

Evidence precedence:

1. Current code and reproducible test output.
2. Round 2: `docs/research/gtm-execution-report.md`.
3. `docs/BUSINESS.md`, which incorporates Round 2.
4. Round 1: `docs/research/market-expansion-report.md`, except where Round 2 refutes it.
5. `docs/research/arena-dossier-assessment.md`, not the unbriefed dossier by itself.
6. `docs/research/gateway-battery-synthesis.md` and the normative Gateway section derived from it.
7. Older strategy documents and interactive market models only as historical context.

Never silently merge contradictory sources. Preserve the correction trail.

## User request and operating instructions

The user asked Codex to read everything, explain what the research says, and
record all work in a README-style file that Claude Code can use. The user then
explicitly instructed both agents to work in the newer worktree.

Repository instruction: before writing Expo code, read the exact Expo SDK 57
documentation at <https://docs.expo.dev/versions/v57.0.0/>. Codex changed no
Expo code in this review.

## What Codex did

### Repository and branch discovery

- Inventoried the root workspace, documentation, apps, shared engine, native
  BLE modules, hardware notes, specs, tests, and design artefacts.
- Read the root `AGENTS.md` and confirmed the same instruction in the newer
  worktree.
- Inspected Git status, branches, worktrees and recent history.
- Discovered that the research is on
  `claude/recursing-montalcini-d59018`, roughly 30 research/documentation
  commits beyond the older `main` snapshot.
- Compared `main` with the newer worktree. The newer branch adds or materially
  revises 39 files and about 21,000 lines, including market, GTM, patent,
  battery, arena, hardware, system, software, data-strategy and field-test
  material.
- Preserved the user's pre-existing modification to `.claude/launch.json`; it
  was not opened, edited or reverted.

### Documents and implementation inspected

Codex read or systematically inspected:

- Root/docs navigation: `README.md`, `CHANGELOG.md`, `docs/README.md`,
  `docs/BRIEFING-FOR-AI.md`, `docs/GLOSSARY.md`, `docs/MASTER-CHECKLIST.md`.
- Product/business: `docs/BUSINESS.md`, all Markdown under `docs/strategy/`,
  the JavaScript assumptions in both interactive market models, and the
  coverage model.
- Research: `docs/research/README.md`, both market rounds, the arena dossier
  assessment, the 29-page dossier PDF, the patent report/brief, the battery
  synthesis, and the correction/raw archive structure.
- System/build: `docs/SYSTEM.md`, `docs/software/loc8os.md`,
  `docs/software/mesh-network-design.md`, `docs/testing/field-test-protocol.md`,
  `docs/hardware/CATALOGUE.md`, `docs/hardware/build-guide.md`,
  `docs/hardware/anchor-deployment.md`, `docs/hardware/loc8-gateway.md`,
  `docs/compliance.md`, `docs/strategy/data-strategy.md`.
- Product specs/plans: all specs in `docs/superpowers/specs/`, the full task
  structure and implementation details of the 2,945-line v1 plan, EAS notes,
  Guard/Command/bridge READMEs.
- Design: the design-system and haptics docs plus the visible content and
  assumptions in the consumer, Guard, Command, architecture, Rally, anchor,
  background, reference and prototype HTML files.
- Code seams used to verify claims: packet types/codec, TrustLayer,
  MeshService, BLE and bridged transports, native frame constants/relay code,
  Guard SOS/ops inbox/team state, Command privacy/coverage/live bridge/audit
  store, and `tools/mesh-bridge`.
- Searched the entire current code/docs surface for encryption, authentication,
  certificates, stubs, mocks, TODOs and deferred work.

### PDF review

- Followed the PDF review workflow.
- Confirmed the arena dossier is 29 A4 pages, unencrypted, created with
  ReportLab.
- Extracted its text with `pdftotext -layout`.
- Rendered and visually inspected pages 1, 8, 16 and 29. Layout is clean and
  legible; no clipping or broken glyphs were seen on sampled pages.
- The dossier itself is not the decision source. It was created without a
  correct Loc8 product brief. Use `arena-dossier-assessment.md` for adopt,
  adapt and reject decisions.
- Temporary rendered files were created under `tmp/pdfs/` and removed after
  visual inspection; no generated PDF artefacts were left in the worktree.

### Verification run in this newer worktree

Commands/results:

```text
npm test -- --runInBand
27/27 suites passed
274/274 tests passed
```

```text
npx tsc --noEmit -p tsconfig.json                  PASS
npx tsc --noEmit -p apps/guard/tsconfig.json       PASS
npm --prefix apps/command run typecheck            PASS
```

Jest prints one warning after success: it does not exit after one second,
indicating at least one asynchronous open handle. Run with
`--detectOpenHandles` when test-harness cleanup is next in scope.

Codex also ran the same checks in the older root worktree before the newer
worktree was discovered; results were the same. The newer-worktree results
above are the authoritative ones.

## What the research is actually saying

### 1. The product has a real core, but maturity must be stated precisely

Built and strongly exercised in software:

- Consumer app UX and offline crew creation.
- Guard app: team map, hold-to-fire SOS, dispatch/status replies, lone-worker
  flow, muster and floor semantics.
- Command app: operations, incident view, muster, coverage, assisted search,
  audit events and live bridge mode.
- Shared engine: 25-byte codec, location/proximity math, fragmented text,
  status/ops grammar, TrustLayer, simulated/BLE/bridged transports.
- Native iOS and Android BLE implementations exist.
- Two physical iPhones reportedly exchanged real BLE frames in a founder-run
  test around 2026-07-09.

Not yet proven:

- A relay through a third physical phone, which is the first actual mesh proof.
- Mixed iPhone/Android field operation.
- Background/locked-screen matrix.
- Measured crowd/body/wall range, latency, packet success and shift battery.
- Real BLE-to-Command field path. The live bridge was verified in software
  with simulated transport.

Use the sentence: **two-phone BLE exchange passed; multi-hop mesh, Android,
background and measured field performance remain open.**

### 2. The immediate strategic recommendation is connected-first, mesh in parallel

The research's strongest strategic correction is to stop gating all revenue on
the radio experiment. Guard and Command are transport-agnostic, so an initial
connected deployment can ride venue networking. The mesh remains the moat and
resilience upgrade, not a cancelled idea.

However, the phrase in `BUSINESS.md` that this needs "nothing new" is too
strong. Current code does not yet constitute a production, invoice-ready
connected service:

- `BridgedTransport` explicitly uses a **plain WebSocket**.
- `tools/mesh-bridge` listens on `ws://0.0.0.0:8787` with **no authentication,
  authorisation, tenant separation, TLS, rate limiting or durable state**.
- Anyone reaching the socket can inject a valid 25-byte frame.
- Command's audit log is browser `localStorage`, capped at 2,000 entries. It is
  not hash-chained and old entries are dropped, not archived.
- The operator identity is a demo/static identity, not SSO or a verified login.
- There is no production backend, deployment/runbook, DPA/retention
  implementation or tenant/account system.

Therefore the honest recommendation is:

> Begin selling/pilot conversations now, but put a short connected-production
> hardening sprint between the current demo and a paid operational deployment:
> WSS/TLS, authentication and site isolation, durable server-side audit,
> operator identity, deployment/backup/monitoring, data-protection paperwork,
> and an explicit non-emergency-system boundary.

This aligns with Round 1's own Year 1 prerequisites, which list a server
backend, TLS, DPA, retention policy, lawful basis and Cyber Essentials.

### 3. Encryption and identity are the largest current product-truth gap

The current 25-byte frame is plaintext. Native mesh comments explicitly call
frames unsigned broadcasts. `TrustLayer` supplies freshness/monotonic replay
rules, not encryption or authentication. A shared crew code hashes to a routing
tag; it is not a secret or a cryptographic membership proof.

Consequences:

- BLE listeners can read staff/consumer coordinates, stable sender IDs,
  message types and text fragments.
- Senders can be spoofed and frames injected.
- Stable IDs enable tracking.
- The current bridge has the same plaintext/injection issue over IP.

The newer branch correctly removes consumer encryption claims from onboarding
and records payload AEAD plus rotating pseudonyms as Gate 4. Do not re-add any
"end-to-end encrypted" claim until implemented and tested.

For connected pilots, TLS is necessary but not by itself sufficient: the relay
also needs client/server authentication, authorisation and site/shift keying.

### 4. The market is a good bootstrap business, not a defensible unicorn story

Round 2's sober conclusion:

- Plausible long-run outcome: roughly **£2-5M annual revenue**, around 86% gross
  margin if execution resembles strong SaaS operators, and a possible
  **£8-45M exit** at 4-9x ARR.
- This is attractive as a profitable founder-owned company.
- It is not currently supported as venture-scale.
- The older £40M ARR / ~£1.18B TAM story should not drive decisions.

The original model is internally inconsistent even before external correction:

- Theme parks: 120 x £150k = £18M, not the £30M stated in the old table.
- Ski: 500 x £40k = £20M, not £32M.
- Stadiums: 800 x £30k = £24M, not £48M.
- The interactive full model computes about **£1.28B TAM and £49.41M SOM** at
  its base settings, while its UI says approximately £40M.
- It separately adds a £240M security line that the corrected consolidated TAM
  says must not be included.

Round 1 then found the festival denominator was wrong by about 4x/order of
magnitude in the large-festival split: the old model assumed 10,500 global
festivals at 5k+ while JamBase listed 2,840 festivals of all sizes worldwide.

Corrected standing figures in the newer branch: approximately **£1.13B
consolidated TAM / £410M reachable**, treated as directional, not forecast.
The revenue plan itself is much smaller and bottom-up.

### 5. The beachhead remains UK agricultural/county shows, but it is contested

Round 1 found about 7M annual attendees over roughly 400 show days and called
the sector unserved. Round 2 refuted the "unserved" claim:

- ASAO already lists Alpha Omega, ONYX, Kingsford and Arley in Health & Safety,
  plus Iventis under software.
- Alpha Omega already markets drone support for missing-person search.
- ONYX has agricultural-show control-room experience.
- Round 1 inspected only the server-rendered first 9 of 49 supplier entries.

The sector remains attractive because decision-makers are reachable, sites are
greenfield/rural, and it can produce reference cases. It is not the whole
business. Round 2 estimates showgrounds/site licences plus shows and outdoor
attractions produce only roughly £330-430k ARR; the path to £2-5M runs through
the wider Martyn's Law enhanced-tier estate and contractor/framework sales.

Important timing claim in the research: the 2026 show window has 86 shows from
1 August and closes 26 September. Revalidate against today's live calendar
before acting, but treat seasonality as real.

### 6. Four sales claims were decisively refuted

Never use:

1. "SAG guidance forbids naming a missing child over radio." Darlington's
   guidance mandates a dedicated radio channel; the prohibition concerned PA
   broadcast.
2. "No competitor names who is missing." Telaeris does, with photo ID;
   friendlyway markets a live missing-person list and offline-first operation.
3. "No vendor serves agricultural shows." False; see the incumbent list above.
4. "Halo's price is live on G-Cloud." The listing was withdrawn. Use Halo's
   current cost page if live verification still supports it.

The narrower differentiator that survived Round 2 is:

> Named staff accountability with no pre-installed access-control hardware and
> no pre-enrolled badge population, integrated with event-control workflows.

Even that should be buyer-demo verified before making an exclusivity claim.

### 7. Pricing architecture improved materially, but exact prices remain hypotheses

The research correctly killed the £1,490/event hardware-anchored price. Survey,
install, derig, travel and show support create a true cost-to-serve around
£3,000-4,800 in the worked example.

The durable pricing decisions are:

- Price the service and labour, not the boxes.
- Platform subscription per site/venue scale, never per guard seat.
- Meter hardware/add-ons separately.
- Quote survey/install/training/support as explicit services.
- Rent hardware so updates, swaps and recurring revenue remain under Loc8's
  control.
- Never disable SOS/muster for non-payment; stop cloud/support, then recall kit.

The numbers (£299/month Club, £2,950 + £950 setup for a connected show offer,
from £3,500/event, £8-12k showground licence, stadium from ~£18k) are
illustrative hypotheses. Validate through live quotes and buyer conversations.

### 8. The strongest moat is not the radio or patents

The patent research adversarially destroyed all three proposed candidates:

- Candidate A, disjoint consumer/ops code ranges: anticipated/obvious over
  Meshtastic/Bluetooth namespace practice.
- Candidate B, protected audit write during load shedding: novelty residue but
  obvious over NIST audit-preservation controls plus prior systems.
- Candidate C, layered fail-safe degradation: anticipated by TETRA direct mode
  and older Motorola art.

No drafting spend is supported on A/B/C as framed. Consider defensive
publication. B may be better kept as a trade secret. The report identifies but
does not search two adjacent technical ideas: hash-chain continuity across a
power-loss boundary and state handoff during tier failure.

FTO is not cleared. Important unscreened/amber work includes Motorola
continuations, Intel/Apple relay claims, Noodle hash-chain claims, Bosch power
claims, 23 unread goTenna records, Nokia continuations, Bridgefy (not searched
at all), legal status and litigation/opposition searches.

The more credible moats are:

- Long-lived evidentiary/retention record and workflow lock-in.
- Installed fleet plus venue/contractor relationships.
- Certification/accreditation and measured field evidence.
- A properly consented, anonymised cross-venue benchmarking dataset.
- Brand earned from real reference incidents, not claims.

### 9. The data strategy can raise the ceiling, but the legal/technical controls are not optional

Five rungs: venue debriefs, anonymised benchmarking, anomaly detection,
carefully framed prediction, and insurance/evidentiary verification.

Good discipline already captured:

- Never sell raw or venue-identifiable data.
- Consumer frames are relayed, never stored.
- Staff monitoring needs a DPIA and lawful basis.
- Benchmarking/insurance use needs explicit contract language and real
  anonymisation, including small-cell suppression/k-anonymity.

Do not call the current Command state a dataset or a flight recorder. Durable
Gateway storage, signed chain heads, retention, backup, restore and governance
are specified but unbuilt.

### 10. Arena/anchor research changed the hardware economics, not the architecture

The unbriefed dossier's structural recommendation was rejected because it made
phones endpoints and fixed infrastructure the backbone. Loc8 requires a bare
field mode, so phones remain the floor unless the field test produces a NO-GO.

Adopted corrections:

- Anchors are **ears, not mouths**.
- Plan spacing on phone-to-anchor uplink, about 25-30m in crowd as an estimate.
- Receive-side gain and mounting height matter more than transmit power.
- Anchor estimate moved from roughly £30-40 to **£60-75**.
- Rotating pseudonyms joined the encryption gate.
- Placement, acceptance and compliance rules are now explicit.

Rejected as core architecture: SIG Bluetooth Mesh for phones, Wi-Fi Aware/
Nearby as the primary data plane, Auracast, passive-phone assumptions and any
100m crowd-planning range. Wi-Fi Aware/Nearby may be a future rich-data
accelerator, not a replacement for stranger relay.

### 11. The field test is still the technical gate

Use `docs/testing/field-test-protocol.md`. The decisive phases are:

- Phase 0: sustained two-platform bench operation and frame integrity.
- Phase 1: measured range/body/pocket/background.
- Phase 2: a verified third-phone relay with TTL/dedup.
- Phase 3: bodies, walls and competing 2.4GHz.
- Phase 4: foreground/background/locked/killed matrix.
- Phase 5: hop distance, N-hop flood time, carried-message viability and
  duplicate-suppression effectiveness.

Commit raw measurement sheets the same day. An unrecorded test is a rumour.

### 12. Gateway/Loc8OS research is thoughtful but almost entirely specified, not built

Architecture: one Gateway brain per pilot site, many stateless Anchors as ears,
Command on an ordinary LAN computer, optional HQ sync.

Strong decisions:

- Read-only root, one writable partition, WAL mandatory.
- Critical DBs `synchronous=FULL`, track DB `NORMAL`.
- Signed A/B updates, no update on battery.
- Export signed chain head plus entry count because a hash chain cannot detect
  tail truncation by itself.
- LFP battery, coulomb counting, explicit energy reserve and measured shutdown.
- Keep critical recording/mesh alive while shedding housekeeping.

Battery correction:

- Tier C 4 x LFP 26650 gives an estimated ~5.2h at 5W; measure before quoting.
- A battery-backed Gateway on dead PoE loses its Ethernet console because the
  PoE switch also dies. It preserves mesh and record, not necessarily control
  room visibility.
- Put the PoE switch on UPS or provide a direct/tether fallback.
- No suitable off-the-shelf Tier C UPS board exists; carrier integration is an
  NRE item.
- Battery-specific compliance is estimated at £4-9k on top of a £15-39k base
  product-compliance programme.

Open architecture gaps already captured: RTC, multi-Gateway ownership and
dedup, box-swap/DR, fleet health, battery service interval and stale EAS docs.

## Highest-priority next actions

Recommended order, based on code plus research rather than the more optimistic
headline copy:

1. **Reconcile product truth in all customer-facing material.** One status line
   for the two-iPhone pass and the remaining field gate. Keep encryption claims
   removed. Replace overbroad competitor and SAG claims.
2. **Define a connected-pilot readiness checklist.** At minimum: WSS/TLS,
   mutual/client auth, site isolation, operator identities, server-side durable
   audit, retention/export/backup, monitoring, deployment runbook, DPA/DPIA,
   Cyber Essentials plan and non-emergency disclaimer.
3. **Run the recorded multi-phone field protocol.** Third-phone relay first,
   then Android/background/range/battery.
4. **Do customer discovery now in parallel.** Validate buyer, budget line,
   willingness to pilot, wifi reality, procurement path and actual incumbent
   workflow. Do not wait for the mesh to start conversations.
5. **Do not build Gateway/Anchors yet** except the £230 bench spike after field
   evidence or a signed pilot/revenue justifies it.
6. **Commission focused FTO work before US/product scale**, especially
   Bridgefy, goTenna unread records, Motorola continuations and legal status.
7. **Investigate Jest open handles** when engineering cleanup is in scope.

## Useful exact status language

For technical buyers:

> Guard, Command and the shared protocol are built and covered by 274 automated
> tests. Two physical iPhones have exchanged real BLE frames. Multi-hop relay,
> mixed iOS/Android operation, locked-screen behaviour and crowd-range figures
> are not yet claimed; they have a written field protocol and acceptance gate.

For commercial conversations:

> We are starting with connected venue pilots because the accountability
> workflow does not depend on a particular radio. The BLE mesh is the resilience
> upgrade being measured in parallel, not a promise hidden inside the pilot.

For privacy/security:

> The current prototype does not encrypt BLE payloads and must not be used as a
> public mesh pilot until AEAD, authenticated membership and rotating identifiers
> are implemented. A connected pilot additionally needs authenticated TLS and
> durable server-side controls; plain WebSocket demo mode is not production.

## R&D department extension — 2026-07-22

The user subsequently asked for an exhaustive active/historical GitHub search,
local research clones, code/idea reuse, the likely “Meshaholics” ecosystem,
multi-storey floor detection, whole-building mapping and product/hardware/business
innovation. Codex created the canonical package at
[`docs/research/rnd/README.md`](research/rnd/README.md).

That package contains:

- 36 shallow filtered clones at exact pinned commits under ignored
  `docs/research/rnd/repos/`;
- a licence-aware catalogue distinguishing adopt/adapt/learn/benchmark/reject;
- a public-domain BitChat-v2 mesh upgrade assessment;
- MeshCore/LoRaMesher/Meshtastic/Reticulum and BLE lifecycle findings;
- a fused “anchor + assist + topology” floor-estimation architecture;
- a whole-building semantic/operational graph and commissioning workflow;
- a coverage-aware operational-digital-twin product thesis; and
- 14 experiments with measurable pass/fail and stop conditions.

Important immediate conclusions:

1. Current public-domain BitChat iOS/v2 is the most direct code source for a
   versioned Loc8 mesh upgrade. Current BitChat Android is GPL-3.0 and must not
   be copied into a proprietary client.
2. Floor detection should fuse signed landing anchors, a venue pressure
   reference, phone barometer/IMU, calibrated radio evidence and connector
   topology in an HMM/Viterbi estimator with confidence/manual correction.
3. The commissioning walk should learn actual per-connector storey heights and
   RF shadows rather than assume one universal 3.5 m floor.
4. The strongest product edge is a coverage-aware operational digital twin:
   physical space/egress plus live communications reachability and incident
   state.
5. No relevant project literally named “Meshaholics” was found. The probable
   intended ecosystem is MeshCore/Meshtastic; `awesome-meshcore` was retained as
   the live ecosystem radar.

Read the R&D README first; it records every search/inspection/action and the
exact next tasks. The clone library is research material, not vendored product
code. Any adopted files need a bounded reviewed commit, tests, provenance and a
third-party notices entry.

### Autonomous R&D direction added — 2026-07-22

The user asked what R&D should do next and requested a full autonomous research
direction. The operating programme is now in:

- [`research/rnd/research-program.md`](research/rnd/research-program.md) — three
  parallel lanes, ten workstreams, portfolio allocation, autonomy boundaries and
  30/60/90-day exit decisions;
- [`research/rnd/research-questions.md`](research/rnd/research-questions.md) —
  the complete P0/P1/P2 evidence-driven question register;
- [`research/rnd/decision-log.md`](research/rnd/decision-log.md) — eight initial
  portfolio decisions and the append-only decision format; and
- [`research/rnd/results/README.md`](research/rnd/results/README.md) plus the
  result template — how future evidence remains reproducible.

The active NOW queue is deliberately limited to three decisions:

1. `MESH-01`: physical third-phone relay;
2. `CONN-01`: minimum safe connected pilot architecture; and
3. `FLOOR-01`: floor-transition corpus/logger schema.

Prepare the semantic building graph and device/background matrix next. Hold
MeshCore-vs-LoRaMesher hardware trials, advanced SLAM, RTT/AoA/UWB, custom
Gateway carrier and ML until their written gates pass. Broad repository discovery
is also held; refresh it quarterly instead of allowing it to displace field proof.

Claude Code may progress documentation, schemas, simulations, tests and offline
prototypes autonomously. Before implementing the Expo floor logger it must read
the exact Expo SDK 57 docs. Purchases, customer/supplier contact, operational
deployment, identifiable location-data collection and unresolved-licence code
adoption require owner approval.

### First autonomous execution result — CONN-01

Codex then executed the full investigate→prototype→measure→decide loop for the
connected relay. Read:

- [`research/rnd/results/CONN-01/2026-07-22-secure-relay-prototype/README.md`](research/rnd/results/CONN-01/2026-07-22-secure-relay-prototype/README.md)
- [`research/rnd/results/CONN-01/2026-07-22-secure-relay-prototype/promotion-brief.md`](research/rnd/results/CONN-01/2026-07-22-secure-relay-prototype/promotion-brief.md)
- [`research/rnd/prototypes/secure-relay/README.md`](research/rnd/prototypes/secure-relay/README.md)

The isolated prototype passed 14/14 adversarial tests, leaked 0/1,000 cross-site
frames, and passed 10,000-operation auth/relay performance gates. Decision:
PROMOTE connection-authentication/site/role/rate/audit interfaces and tests;
REPEAT with production identity, durable state, real TLS/reconnect and external
review. Do not ship the HMAC research signer or reinterpret it as mesh payload
security. Product source and the existing demo relay were not changed.

A final secure-defaults review added parser-level 25-byte rejection, disabled
WebSocket compression, bounded slow-receiver queues, rejected invalid capability
time ordering and documented additional P0 product requirements. A subprotocol
capability is still a bearer credential: keep it short-lived, one-use and
memory-only, redact `Sec-WebSocket-Protocol`, and never echo the auth protocol.
Production Command must remove/strictly allowlist the current arbitrary
`?bridge=` endpoint. Origin is defence in depth, and TLS terminated by a proxy
must use an explicitly trusted proxy boundary rather than arbitrary forwarded
headers. See the promotion brief for the complete requirements.

The run also discovered dependency drift: the prototype resolves root `ws`
7.5.11 while the mesh-bridge workspace requests/reports 8.x. Product promotion
must pin/reconcile the runtime and keep compatibility tests.

A live `npm audit --omit=dev` then reported 12 advisories (1 high, 11 moderate,
0 critical). The high path is `brace-expansion` 1.1.15 under Jest coverage
tooling; `uuid` 7.0.3 is present through Expo/Xcode configuration. Neither `ws`
version was reported. Codex did not apply the offered force fix because it
includes an Expo 46.0.21 downgrade and this repository mandates Expo 57. See
`RDD-011`: product must find targeted Expo-57-compatible remediations and rerun
diagnostics, native builds and all tests before an operational pilot.

It also found that Git-ignored research clones were entering Jest and root
TypeScript discovery. Codex added `docs/research/rnd/repos/` exclusions to root
`package.json` and `tsconfig.json`. Final verification: Jest discovered exactly
27 Loc8 test files, 274/274 tests passed (using `--forceExit` because the known
open handle remains), and root/Guard/Command TypeScript all passed.

## Files changed by Codex

- Added this file: `docs/CODEX-CLAUDE-HANDOFF.md`.
- Added `docs/research/rnd/` documentation, provenance and ignored research
  clones, including the isolated relay prototype, tests, benchmark, evidence and
  product promotion brief.
- Updated root `package.json` and `tsconfig.json` to exclude the ignored research
  source library from product Jest/module discovery and TypeScript compilation.
- No application, engine, native or existing demo-relay source was changed.
- The pre-existing `.claude/launch.json` modification remains untouched.

## Suggested instruction to Claude Code

Use this file as the continuity source for the Codex review. Before making a
decision, read the directly cited current source and preserve the research
precedence rules. If new evidence contradicts this handoff, update this file
with the evidence and date instead of silently replacing the conclusion.

## Principal temporary-sprint consolidation — 2026-07-22

The authoritative continuity record is now
[`research/rnd/PRINCIPAL-AUDIT-2026-07-22.md`](research/rnd/PRINCIPAL-AUDIT-2026-07-22.md).
Read it before continuing R&D or product-boundary work.

Three temporary Codex worktrees were an unnecessary default for research-only
specialists. They were about 10 MiB each and shared Git objects; the apparent
gigabytes came from older ignored research clones and installed dependencies,
not three new copies. The correct default is one canonical R&D worktree with
read-only/non-overlapping specialist tasks and one principal integrator.

The empty floor task produced no files and was archived/removed. The other two
outputs were treated as untrusted candidates, read completely, corrected and
preserved as canonical commits:

- `aaed1a6` — audited protocol-v2 boundary, 11/11 standalone tests;
- `338612a` — hardened non-runnable `services/loc8-relayd` boundary, 24/24 tests.

Protocol review corrected same-epoch migration allowlist conflict, invalid
restored state, provider exception handling, topology rollback/conflict and a
claimed-but-missing failed-next-hop gate. It also found that BitChat's pinned
whitepaper is behind its source: the public-domain tree implements and tests
one-time prekey courier sealing. That is now a bake-off candidate, not an
automatic crypto approval. `RDD-012` promotes bounded candidate contracts only;
cryptography, native/physical evidence and operational v2 remain HOLD/REPEAT.

Connected review found seven gaps despite the earlier green 21-case suite:
concurrent admission limits, shape-only frame acceptance, unlimited session age,
wall-time queue aging, unknown-header retention, non-canonical/weak audit
metadata and unsafe subprotocol capability text. The corrected suite is 24/24,
with zero delivery in 1,000 fake cross-site frames and five 10,000-route local
p95 repeats at 0.0018–0.0025 ms. These are fake-port regression results, not
network or venue capacity. `RDD-013` promotes the boundary/tests only; real
identity, stores, TLS/proxy, recovery, integration and pilot readiness remain
REPEAT/HOLD.

Dependency truth was reproduced, not fixed: the main checkout selects Node
22.12.0 below Expo 57's documented 22.13.x minimum; canonical R&D selects
22.22.3; installed Expo is 57.0.2 versus current 57.0.7; tool `ws` is 8.21.0,
transitive `ws` is 7.5.11 and current registry is 8.21.1; audit remains 1 high/
11 moderate. No install, force fix, Expo downgrade or lockfile mutation was made.

The completed checkpoints below supersede that earlier queue. Current autonomous
work starts at `SEC-05`, then `MESH-01` physical kit/preflight and targeted
retained-repository assessment. Run the physical relay immediately when a real
three-phone radio-isolated setup exists; simulation cannot close it.

This section supersedes the earlier statement that no product source was added:
the new `services/loc8-relayd` source boundary now exists, but it is deliberately
not runnable or integrated. The existing apps, engine, native BLE, Command,
Guard and demo relay remain unchanged. The user's `.claude/launch.json` edit
remains untouched.

## FLOOR-01 corpus-contract checkpoint — 2026-07-22

This is the authoritative continuation checkpoint after the principal audit.
The canonical branch is `claude/recursing-montalcini-d59018`; the user's existing
`.claude/launch.json` modification was again left untouched.

### What was inspected

- Re-read the durable Principal R&D goal, principal audit, this handoff,
  programme, question register, decisions, floor-detection/mapping syntheses,
  experiment plan and current floor source/tests.
- Read pinned implementation source at exact commits for Bermuda
  `cd46d17e8469`, Navigine `67e11c4d398a`, blelocpp `72b4bd3b32af`,
  NavCogAndroid `87f6ed2b353e`, BaroFloorHeight `4158e69b1b3d` and Anyplace
  `722955182375`; recorded licences and copied no source.
- Read the relevant full sections of the Microsoft barometer study, B-Loc, the
  2021 accelerometer/barometer/Wi-Fi Viterbi study and MagneFi rather than
  relying on abstracts or project READMEs.
- Read the exact Expo SDK 57 Barometer, DeviceMotion and Magnetometer API pages.
  They define hPa, optional iOS relative altitude, seconds sensor timestamps,
  availability/permission/listener/interval behaviour and the DeviceMotion
  deg/s→rad/s adapter conversion. No Expo/app source was changed.

### What changed

- Frozen the FLOOR-01 protocol before implementation in
  [`research/rnd/results/FLOOR-01/2026-07-22-corpus-contract/pre-registration.md`](research/rnd/results/FLOOR-01/2026-07-22-corpus-contract/pre-registration.md),
  commit `8cff81a`.
- Added the strict JSON Schema, dependency-free recorder/validator/evaluator,
  JSONL codec, deterministic fixture, 40-case test suite, two-run benchmark and
  exact future SDK 57 adapter mapping under
  [`research/rnd/prototypes/floor-corpus/`](research/rnd/prototypes/floor-corpus/README.md).
- Added the full result, data contract, privacy/retention boundary, captured
  measurements and 11-file SHA-256 evidence manifest under
  [`research/rnd/results/FLOOR-01/2026-07-22-corpus-contract/`](research/rnd/results/FLOOR-01/2026-07-22-corpus-contract/README.md).
- Artifact commit: `fc2f536` (`research(floor): validate FLOOR-01 corpus
  contract`). The artifact is independent Loc8 work; no retained-repository file
  was adopted.

### What was measured and what passed/failed

- The first prototype execution passed 24/25. Its only failure was a wrong test
  expectation: the two offsets over the fixture interval calculate to 1.363636,
  not 1.485149 ms/min. The evaluator was correct; the assertion was corrected.
- Principal audit expanded the suite and closed initial contract gaps: app build,
  access logging, strict manifest/event/payload/vector fields, connector landing
  topology, all-stream native timestamps/units, malformed-manifest fail-closed
  behaviour, session/sync bracketing and recorder start atomicity.
- Captured result: 40/40 tests, zero failures; canonical 129 events, two syncs,
  20 ms maximum uncertainty, 1.363636 ms/min drift, three truth segments, one
  transition, one same-floor control, 0 μs gap, 0 μs overlap and zero missing
  pressure/motion observations.
- Captured replay: 50,008 events; two valid evaluations at 119.912 and 108.169
  ms versus the 5,000 ms ceiling; identical summary SHA-256
  `3fe4c2f44520d3811c69f1888cda1063c6ad4cf12a187e5826d6805faeb4d7b1`.
- All 11 evidence-manifest hashes matched, all JSON parsed, all new local links
  resolved and `git diff --check` passed before artifact commit.
- Integration regression passed after the artifact commit: 65/65 combined
  floor/protocol-v2/secure-relay prototype tests, 24/24 `loc8-relayd` core tests,
  exactly 27 Loc8 Jest suites with 274/274 tests, and root/Guard/Command
  TypeScript checks. Jest still requires the previously known `--forceExit`.
  An initial discovery shell assertion failed only because `npm test
  -- --listTests` added npm wrapper lines; direct `npx jest --listTests` proved
  the expected count of 27 before the full green run.

### Decisions and limits

- `RDD-014` **PROMOTE:** `loc8.floor-corpus.v1`, the platform-neutral recorder/
  validator/evaluator seam, JSONL replay, fixtures and regression gates.
- **REPEAT:** SDK 57/native adapter and at least one supported iOS and Android
  physical instrumentation run.
- **HOLD:** identifiable/physical field collection until owner/site/participant
  authority and encrypted, access-logged, restore/deletion-tested storage exist.
- **STOP:** raw pressure as absolute floor; consecutive integers/display labels
  as identity; any attempt to turn this synthetic contract result into floor-
  accuracy, device, building, background, battery, safety or pilot evidence.
- The existing manual floor anchor remains authoritative. No estimator or product
  app was changed.

### Historical next state after FLOOR-01 (completed below)

1. `MAP-01` was next at this checkpoint and is completed in the following
   section using the frozen identity seam and preregistered gates.
2. Run `SEC-05`: reviewed-library/logical-frame/credential/prekey
   vector bake-off, including the corrected BitChat source finding; crypto
   implementation remains HOLD.
3. Prepare, but do not falsely close, the FLOOR-01 native/physical repeat.
4. Run `MESH-01` immediately when three suitable phones and an isolated A↔C test
   topology exist. Simulation cannot close it.

If this task compacts or Claude Code resumes it, start from artifact commit
`fc2f536`, this section, `RDD-014` and the FLOOR-01 result. Do not redo FLOOR-01's
pure contract work unless new evidence contradicts it; do not mark the physical
repeat complete without the preregistered real evidence.

## MAP-01 semantic-graph checkpoint — 2026-07-22

This section supersedes the MAP-01 next-step text immediately above. The
canonical branch remains `claude/recursing-montalcini-d59018`; the user's
existing `.claude/launch.json` modification remains untouched and unstaged.

### What was inspected

- Re-read the Principal R&D objective, this handoff, mapping synthesis,
  programme/questions/decisions and FLOOR-01 identity contract.
- Inspected Command's actual zone/coverage/dispatch/simulation types, Guard's
  floor/team/map/store state and the engine operations-message/floor-wire seam.
  Current product truth is a split model: 2D Command zones have no building or
  level, Guard uses independent hard-coded integer floors/zones, operations
  messages carry mutable labels and responder ranking is straight-line 2D.
- Inspected Anyplace `722955182375` model/controller/Dijkstra source and MIT
  licence directly. It proves the value of building/floor/POI/connection objects
  but derives floor IDs from building plus floor number, uses weak undirected
  weighting and lacks the target direction/accessibility/closure/exit policy.
- Reconfirmed retained multi-floor S-Graphs `35dd3561730a` (GPL-3.0) and HOV-SG
  `d6e65a53c8be` (MIT file/badge but README commercial-contact restriction) as
  learn-only sources. No upstream code was copied.
- Read current OSM Simple Indoor/level/pedestrian-routing guidance and OGC
  IndoorGML 2.0 concepts. OSM vocabulary is interoperability input, not copied
  OSM data; IndoorGML alignment is conceptual and no conformance is claimed.

### What changed

- Froze 12 conjunctive acceptance gates before implementation in commit
  `37e9eb1` (`research(map): preregister MAP-01 semantic graph`).
- Added independent, dependency-free `loc8.building-graph.v1` under
  [`research/rnd/prototypes/building-graph/`](research/rnd/prototypes/building-graph/README.md):
  strict schema/validator, semantic objects plus directed route graph, immutable
  closure overlays, four route profiles, egress audit, deterministic hashes,
  product projections and explicit signed-floor-wire adapter.
- Preserved the exact FLOOR-01 building/map/level/east-stair/landing ID seam and
  extended it with 12 spaces, five zones, five connectors, seven portals, two
  final exits, one assembly point, 39 route nodes and 45 edges.
- Added full decision/data-contract/measurements and 10-file verified SHA-256
  manifest under
  [`research/rnd/results/MAP-01/2026-07-22-semantic-graph/`](research/rnd/results/MAP-01/2026-07-22-semantic-graph/README.md).
- Artifact commit: `d023690` (`research(map): validate MAP-01 semantic graph`).
  No app, engine, packet, native, Expo or retained-repository source changed.

### What was measured and what passed/failed

- Final focused suite: 123/123 tests. All 71 named malformed/referential/
  topology/accessibility/routing/wire mutations were rejected with expected
  issue codes; zero unexpected accepts.
- Synthetic publication audit: 8/8 general and 7/7 step-free-required spaces
  reached eligible final exits. Lift/ramp closures rerouted or failed closed;
  evacuation excluded lifts/escalators; direction and unknown accessibility were
  enforced.
- Scale graph: 1,002 nodes/1,001 edges; 10,000 requests per run (all four
  profiles, 770 closure overlays), 9,718 `ok`, 282 deliberate `no-route`, zero
  invalid, 3,499,328 returned traversals. Four measured runs took 3,706.137,
  3,676.832, 3,684.560 and 3,679.830 ms against 5,000 ms; result SHA-256 was
  identical: `6d832d23700431b26c3b1d9971abbb62950447a73a6b628aa6e339484239a5ea`.
- Adversarial work found and fixed three defects rather than weakening gates:
  wrong canonical array ID precedence, a malformed-landing validator throw and
  a mutable compiled-source/stale-fingerprint seam.
- Regressions: 188/188 combined R&D tests, 24/24 relay service tests, exactly 27
  product suites with 274/274 tests, and root/Guard/Command TypeScript checks.
  Jest's pre-existing open handle remains; `--forceExit` supplied the clean
  authoritative process exit.
- All JSON parsed, local documentation links resolved, all 10 evidence hashes
  matched and `git diff --check` passed before the artifact commit.

### Decisions and limits

- `RDD-015` **PROMOTE:** the pure schema/validator, physical-semantic plus route-
  graph separation, deterministic profile router, publication egress audit,
  product projection seam and explicit semantic-ID↔wire-code adapter.
- **REPEAT:** one permissioned real plan/building (MAP-04), second-operator
  commissioning (MAP-10), product adapters and specialist accessibility/fire/
  venue route review.
- **HOLD:** real site-sensitive map storage/deployment and every regulatory,
  safety, accessibility, commissioning, route-accuracy or pilot claim.
- **STOP:** display/integer identity, straight-line 2D cross-floor route truth,
  geometry-as-connectivity, unknown-as-accessible, automatic lift/escalator
  evacuation use, zero/default costs and synthetic-building claims.
- This is synthetic pure-contract evidence. It does not prove a real map,
  survey, route, building, positioning system, compliance state or safe incident
  instruction.

### What happens next

1. Execute `SEC-05`: reviewed cryptographic-library/logical-frame/credential/
   prekey bake-off with public vectors. Do not promote custom cryptography.
2. Complete the `MESH-01` physical kit/preflight and run it when three suitable
   phones and a radio-isolated A↔C layout exist; simulation cannot close it.
3. Continue targeted retained-repository adoption assessment, prioritising
   components that directly inform SEC-05/MESH-01 and the promoted MAP seam.
4. Product development may adopt MAP-01's pure contract in a separate reviewed
   increment. Real-building work remains a separately preregistered repeat.
5. Prepare, but do not falsely close, the FLOOR-01 native/physical repeat.

If this task compacts or Claude Code resumes it, start from artifact commit
`d023690`, `RDD-015`, the MAP-01 result and this section. Do not rerun the pure
MAP cycle unless new evidence contradicts it, and do not infer real-building or
safety truth from the synthetic fixtures.

## Principal R&D integration checkpoint — 2026-07-22 (latest)

This section supersedes every earlier “what happens next,” dependency count and
36-repository statement in this file. The earlier sections remain evidence
history; start continuation here.

### Canonical state

- Worktree:
  `/Users/augustusedem/Loc8/.claude/worktrees/recursing-montalcini-d59018`
- Branch: `claude/recursing-montalcini-d59018`
- Latest completed source-audit commit before this shared-record update:
  `5ea7b8910b3da40b6f4e9b839993f136edb015d2`
- Local `main` was still `74eb9b354c0a60953e0e1435d629f3de4360ab8d`
  when this section was written. Fast-forward it only after the final shared
  records and regression pass.
- `origin/main` was not changed. No push, deployment, purchase, external contact
  or physical data collection was performed.
- The separate `claude/vibrant-yalow-620cd6` worktree/branch was observed and
  deliberately left untouched; it is not part of this R&D integration.
- The user's `.claude/launch.json` remains modified, untouched and unstaged.
- Root `main` has an unrelated untracked `.codex-audit/`; it remains untouched
  and outside every R&D commit.
- macOS reported about 4.3 GiB available while the APFS data volume still showed
  100% allocation. Avoid broad clones/cache-heavy rebuilds until space is safer.

### What was inspected

- Re-read the durable Principal goal, historical audit, full programme/question/
  decision records, all FLOOR/MAP/SEC/MESH result/prototype evidence and current
  product/native seams relevant to the gates.
- Read the exact Expo SDK 57 reference before app/native/tooling changes, as
  required by `AGENTS.md`.
- Inspected the MESH TypeScript field route/protocol, iOS/Android native module,
  frame/dedup/relay services, diagnostic recorders, schemas, evaluator, clock
  derivation, manifest generator, runbook and tests.
- Reconciled all 48 ignored retained repositories (36 original plus 12 SEC-05
  sources), their `HEAD`, date, branch, origin, licences and actual source
  objects. Read filters, floor/particle/transition logic, graph construction,
  packet/routing/BLE/GATT/queue/replication paths and provider/vector seams.
- Compared every retained branch tip with GitHub via `git ls-remote`: 46 matched;
  Meshtastic `develop` advanced to `1804fd188626` and Tink C++ `main` to
  `a50ffe32402d`. Old evidence remains pinned rather than silently refreshed.

### What changed

#### SEC-05

- Preregistration: `5ac8e76`; result: `9afbf85`.
- Built a strict, dependency-free, deliberately non-cryptographic provider/
  logical-frame/credential/prekey contract experiment and native repeat plan.
- No upstream security source was copied into Loc8 and no key generation,
  encryption, decryption, signing or verification was implemented.

#### MESH-01

- Preregistration: `29938c4`; amendment: `88b7182`; field kit: `5815608`;
  dependency/native repair: `9f394b8`; result: `65763e8`.
- Added strict `loc8.mesh-field-evidence.v1` manifest/JSONL contracts,
  deterministic path/TTL/isolation/duplicate evaluator, conservative pairwise
  clock-bound derivation, fail-closed physical-manifest generator and complete
  runbook.
- Added a development-only exact 14-block/660-attempt BLE field route with
  synthetic zero-coordinate attempts, role enforcement and guarded exports.
- Added bounded 20,000-event iOS/Android diagnostics with run-scoped link handles
  and stable SHA-256 over the full immutable logical frame (excluding mutable
  TTL). Raw payloads, positions, names, MACs and persistent platform IDs are not
  exported.
- Corrected pairwise clock uncertainty, one-direction classification, frame
  identity, stale timer, lifecycle, resend/export and native Kotlin return-type
  defects without moving physical thresholds.

#### Tooling/native gate

- Installed/configured SDK-57-compatible ESLint and fixed the initial 14 errors
  plus 77 warnings.
- Remediated dependency advisories without the incompatible Expo downgrade. The
  only override is `xcode@3.0.1`'s used `uuid.v4()` path to `uuid` 11.1.1; that
  call was smoke-tested.
- Installed Homebrew OpenJDK 17 and Android API 36/build tools/NDK. Added the
  Kotlin 2.1.20/API 36 Android semantic/source harness. The official compiler
  archive matched JetBrains' separately published SHA-256
  `a118197b0de55ffab2bc8d5cd03a5e39033cfb53383d6931bc761dec0784891a`.
- Corrected the stale runbook claim that no Java runtime exists. Xcode remains
  16.2 and cannot close the SDK 57 iOS native app build gate.

#### Retained source portfolio

- Commit `5ea7b89` adds the
  [48-repository source assessment](research/rnd/RETAINED-REPOSITORY-ASSESSMENT-2026-07-22.md),
  [machine-readable source audit](research/rnd/retained-repository-source-audit.tsv)
  and corrected [snapshot](research/rnd/repository-snapshot.tsv).
- Every row distinguishes reusable code from reusable ideas, records licence,
  pinned source blob, decision and next gate. All 48 blob IDs were re-resolved
  locally with zero mismatches.
- The strongest bounded adoption candidates are Bermuda, selected Navigine/
  blelocpp/Anyplace components, non-cryptographic BitChat seams,
  MeshCore/LoRaMesher experiments, conditional RadioLib, PALMS,
  hdl_graph_slam, public vectors and isolated MeshCore lab tools.
- Direct custom crypto and wholesale repositories remain stopped. GPL/AGPL/MPL/
  custom/conflicting/unlicensed/non-commercial sources retain their explicit
  obligations and learn-only/benchmark boundaries.

### What was measured

- SEC-05: 88/88 tests; 67/67 named parser adversaries rejected; six exact
  credential variants; ten provider candidates; zero clearing all ten gates;
  two 50,000-operation runs at 487.096/485.770 ms with identical deterministic
  output.
- MESH evaluator: 100/100 tests plus 5/5 TypeScript field-protocol tests.
- MESH deterministic benchmark: two runs of 25 × 2,444 = 61,100 event
  evaluations at 334.859/240.196 ms; identical result fingerprint
  `b445abe6269e49fa9887d7aa100d94e78c7fb6ad62ce8879867e85424d55fdfe`
  and deterministic hash
  `5304e3ef65f5e80e1e5a7eec71b65f4080b979a0d80839da0cae14677822d4a3`.
- The synthetic MESH fixture produces 200/200 per direction, full B path proof,
  zero duplicates and p95 90 ms only as evaluator arithmetic. The top-level
  decision is hard-held at `HOLD-PHYSICAL`; these are not radio results.
- Pure iOS recorder harness: PASS for privacy, synthetic-only origin, sequence,
  canonical/TTL-stable identity, lifecycle and bound.
- Android Kotlin/API 36 source/recorder harness: PASS. An actual isolated
  generated Expo/Gradle project then passed `:loc8-mesh:compileDebugKotlin` and
  `:loc8-mesh:assembleDebug`, producing a 94,067-byte AAR with SHA-256
  `a580b4e8dabcccbabc88829fd72ef5d0a8c0711cc84a740db2ae4e8c9bc36b4f`.
  The ephemeral AAR/build log was not retained after storage cleanup; repeat a
  full app build before device execution.
- Tooling regression at `9f394b8`: lint zero; `npm audit` zero; Expo Doctor
  20/20; Expo install/config and isolated iOS/Android prebuild/autolinking pass;
  root Jest 28/28 suites and 279/279 tests; root/Guard/Command TypeScript pass.

### What passed, failed or remains unavailable

Passed:

- FLOOR-01, MAP-01, SEC-05 and MESH kit pure acceptance gates within their
  documented evidence classes;
- Android module source and real Gradle packaging gate;
- dependency, lint, Expo diagnostic, product test/type and source-provenance
  gates described above.

Failed/corrected during the work rather than hidden:

- initial MESH pair-clock and one-direction logic;
- weak diagnostic identity and export/resend/lifecycle edge cases;
- absent lint gate and all 91 surfaced findings;
- prior 12 dependency advisories;
- two storage-constrained Android build attempts before bounded cleanup and the
  successful module build; and
- stale records claiming 36 repositories, no Java and an unresolved audit hold.

Unavailable—not failed and never simulated:

- three-phone physical relay/isolation;
- iOS SDK 57 native app build on Xcode 16.2;
- complete Android APK/AAB, install, permission flow and BLE phone run;
- background/locked/mixed-platform/range/crowd/battery evidence;
- physical multi-floor corpus/floor accuracy;
- permissioned real-building MAP repeat and second operator;
- native HPKE cross-platform/lifecycle evidence and specialist review;
- real connected identity/store/TLS/proxy/recovery and operational pilot;
- representative MeshCore/LoRaMesher hardware bake-off.

### Decisions

- `RDD-016`: PROMOTE security contracts only; REPEAT native `SEC-05 E07`; HOLD
  provider, algorithm, cryptography and security claims; STOP custom crypto/
  fail-open lifecycle.
- `RDD-017`: PROMOTE MESH evidence kit only; REPEAT native/physical cohorts;
  HOLD relay and phone-mesh architecture; STOP synthetic/counter/software-
  isolation proof and unsupported claims.
- `RDD-018`: PROMOTE dependency/tooling repair and close the old audit hold;
  HOLD complete native/operational readiness.
- `RDD-019`: PROMOTE the 48-repository adoption ledger; HOLD broad discovery;
  STOP wholesale imports and licence-as-suitability reasoning.

### Final shared-record regression

After the programme, experiment namespace and handoff were reconciled, the
canonical worktree passed:

- product lint; 28/28 Jest suites and 279/279 tests; root, Guard and Command
  TypeScript;
- Expo Doctor 20/20, Expo dependency compatibility and `npm audit` with zero
  vulnerabilities;
- all six pure FLOOR/CONN/SEC/MAP/MESH prototype suites, 376/376 tests total;
- the connected product-boundary relay core, 24/24 tests;
- all seven SEC-05 retained-vector provenance objects;
- all 48 retained `HEAD` values and 48/48 recorded inspected-path Git blobs,
  with exact equality between the 48-row audit and snapshot sets;
- 174 relative links across 81 Markdown files, with zero missing targets; and
- `git diff --check`.

The cache-heavy Android module build was not repeated because it already passed
at `9f394b8` and only shared documentation changed afterward. This does not alter
the hold on a complete app build, install, BLE phone run or physical result.

### Current autonomous order

1. Physical `MESH-01 E01` preempts everything when three authorised phones, true
   A↔C isolation, approved evidence storage and a supported build exist.
2. Locally, prepare the FLOOR-01 exact SDK 57 sensor adapter with synthetic
   injection/replay tests; do not collect physical data without authority.
3. Product development repeats CONN-01 with reviewed real identity, durable
   stores, pinned TLS/proxy and recovery drills.
4. Prefreeze/implement the isolated Android half of `SEC-05 E07`; hold full
   selection on iOS/Xcode/phones/specialist evidence.
5. MAP-04/MAP-10 preempt when a permissioned real plan/building and second
   operator exist.
6. Run `RADIO-01 E07` only on identical representative hardware or signed pilot
   need.
7. Refresh/copy upstream source only for a named experiment and record file-level
   notices/provenance.

### Resume recipe

Read, in order:

1. this latest section;
2. `research/rnd/decision-log.md` entries `RDD-014` through `RDD-019`;
3. the FLOOR/MAP/SEC/MESH result READMEs;
4. `research/rnd/RETAINED-REPOSITORY-ASSESSMENT-2026-07-22.md` and its TSV;
5. the current research-program queue and question board.

Do not redo completed pure cycles unless new evidence contradicts them. Do not
infer physical, security, building, safety or pilot truth from synthetic/native-
source/module evidence. Preserve `.claude/launch.json`, use the canonical
worktree, and leave GitHub/remotes unchanged unless the owner explicitly asks.

### Local-main integration receipt — 2026-07-22

This receipt supersedes the pending-main wording in the canonical-state bullets
above. After the final regression, provenance and documentation-link gates:

- shared-record commit `5dd6978` (`docs(rnd): reconcile principal research
  state`) was created from an explicit 11-file documentation list;
- local `main` fast-forwarded cleanly from `74eb9b3` through `5dd6978`, and then
  through this documentation-only receipt so local `main` and
  `claude/recursing-montalcini-d59018` share the final integrated commit;
- `origin/main` was not changed and no push was attempted;
- root `.codex-audit/` remains untracked and untouched;
- the canonical worktree's user-owned `.claude/launch.json` remains modified,
  untouched and unstaged; and
- `claude/vibrant-yalow-620cd6` remains separate and untouched.

The cache-heavy Android build was not repeated between `5dd6978` and this
receipt because the only intervening change is this Markdown ledger. All product,
research, provenance and link gates recorded above therefore remain the final
verification evidence for the integrated payload.

## 2026-07-22 product increment — shared building engine and Command commissioning

This is the current continuation point for Codex or Claude Code. It supersedes
the older statement above that `MAP-01` had not changed product code.

### Owner intent and evidence boundary

The owner asked the autonomous Principal Product/R&D Lead to turn validated
building/floor/mesh/service/security research into working Loc8 product, starting
with the shared building engine and Command Commissioning/Map Builder. No push,
deployment, purchase, customer contact, physical data collection or external
claim was authorised. Synthetic/replay evidence must never be described as
physical proof.

Before product implementation, Codex read the exact Expo SDK 57 documentation
required by `AGENTS.md`, audited the canonical worktree and froze Phase 1 gates
in `docs/product/PHASE-01-BUILDING-FOUNDATION.md`. The user's existing
`.claude/launch.json` modification remained untouched and unstaged.

### What was implemented

- `packages/engine/src/building/`: strict production types and validation;
  immutable compile; canonical JSON; draft/local-demo/successor lifecycle;
  deterministic walking, step-free and evacuation routing with closures;
  Guard/Command projections; explicit legacy floor codec; and a coherent
  four-level synthetic venue.
- Command now has a real `Commissioning` destination. The operator can switch
  floors, select data-rendered plan objects, edit name/kind, move geometry, add
  rooms/zones, see validation, calculate route/closure outcomes, create an
  unsigned browser-local demo, reload it and fork a successor draft. A visible
  evidence boundary and publication record prevent localStorage being mistaken
  for Gateway/site truth.
- Guard derives its visible floor and zone projection from the same venue
  package. The old signed floor integer is produced only at the explicit legacy
  codec boundary.
- Command publication policy and Guard projection tests were added alongside
  44 engine tests, including 34 named invalid venue mutations.

### What was verified

- Root Jest: 31/31 suites, 326/326 tests.
- New focused surface: 47/47 tests.
- Root, engine and Guard TypeScript: PASS.
- Command production build: PASS (71 transformed modules).
- Lint: PASS. Expo Doctor: 20/20. `npm audit`: zero vulnerabilities.
- Codex in-app browser: add/edit/move room, type edit, validation, 50-second
  three-level step-free egress route, ramp closure/no-route, local publication,
  reload persistence, successor draft and reset all passed.
- Final desktop 1440×1000 and tablet 1024×768 console logs: zero warnings/errors.
  Desktop/tablet/mobile document widths matched their viewports.
- Design QA corrected stacked tablet navigation, label collisions, mobile top
  bar wrapping and inspector placement. Root `design-qa.md` is `passed`.

### Product decision and exact next order

`RDD-020`: PROMOTE the building foundation and browser-local commissioning
slice; REPEAT with a second operator/permissioned real plan; HOLD Gateway,
physical building/floor, safety/accessibility/compliance/pilot truth; STOP any
localStorage/label/synthetic/screenshot shortcut.

Continue in this order:

1. freeze and build a local fake Gateway package authority/distribution and
   reconciliation contract—no network deployment;
2. build the exact Expo 57 phone sensor adapter plus synthetic/recorded replay
   surface—no physical data collection;
3. extend Commissioning with plan import/control-point registration and prepare
   the second-operator real-plan repeat; and
4. preserve the existing physical MESH/FLOOR/MAP/security holds until their
   external dependencies genuinely exist.

Canonical evidence:

- `docs/product/PHASE-01-BUILDING-FOUNDATION-RESULT.md`
- `design-qa.md`
- `docs/product/evidence/`
- `docs/OWNER-PRODUCT-STATUS.md`
- `docs/research/rnd/decision-log.md` (`RDD-020`)

### Phase 1 local-main integration receipt

- Product commit `3821bec` (`product(map): ship commissioning foundation`) was
  created from the explicit 32-file product/evidence set after the final gates.
- Local `main` fast-forwarded cleanly from `07a4dbb` to `3821bec`.
- This documentation-only receipt is committed after the product payload and
  local `main` is then fast-forwarded once more; no product code changes occur
  between the measured product commit and the receipt.
- `origin/main` remains unchanged and no push/deployment was attempted.
- Root `.codex-audit/` remains untracked and untouched.
- The canonical worktree's user-owned `.claude/launch.json` remains modified,
  untouched and unstaged.
- `claude/vibrant-yalow-620cd6` remains separate and untouched at `4f725df`.

## 2026-07-22 product increment — Gateway venue-package distribution

This is the newest continuation point. It supersedes the Phase 1 next action
that described a “fake Gateway authority.” No fake signing provider or Gateway
authority was created. Instead, the increment cleanly separates a production
provider/store contract from an explicitly simulation-only browser replica.

### What was implemented

- `packages/engine/src/building/distribution.ts` defines and validates
  `loc8.venue-distribution.v1`; canonical package/signature payloads; injected
  digest, signature, clock and atomic-store ports; fail-closed installation;
  idempotency; direct-lineage updates; immutable receipts; and typed replica
  reconciliation.
- The same module defines a separate
  `loc8.gateway-venue-simulation.v1` format. It only accepts unsigned
  browser-local `local-demo` packages, deep-clones/freezes them, records byte
  size and reloads with strict validation.
- `apps/command/src/domain/gatewaySimulation.ts` is the thin localStorage
  adapter. It fails closed on corrupt/unavailable storage and verifies a write
  by re-reading/parsing it.
- Command Commissioning now has `Map builder` and `Gateway simulation` views.
  The latter shows phone/Command/Gateway ownership, separate install state,
  reconciliation, projected levels/places/zones and the actual production
  promotion gates. It never claims signing, deployment or authority.

### What was verified

- Focused distribution + Command adapter: 47/47 tests.
- Full regression: 33/33 suites, 373/373 tests.
- Root, engine, Guard and Command TypeScript: PASS.
- Command production build: PASS (73 transformed modules).
- Expo lint: PASS. Expo Doctor: 20/20. `npm audit`: zero vulnerabilities.
- Browser: draft block, local-demo install, offline reload, in-sync result,
  successor `COMMAND AHEAD`, reset, independent removal and reinstall passed.
- 1440×1000, 900×900 and 390×844 widths matched their viewports. Final browser
  logs had no warning/error; root `design-qa.md` has no open P0/P1/P2.

The existing Jest Expo Go remote-push warning remains non-failing and unrelated.
No algorithm/provider, cryptographic operation, durable Gateway store/process,
hardware, transfer or physical building evidence was introduced.

### Decision and continuation order

`RDD-021`: PROMOTE the contract/reconciliation/simulation tool; REPEAT a
reviewed cryptographic provider and durable target-Gateway store/process; HOLD
signed publication, radio/LAN/BLE transfer, Gateway authority and operational
claims; STOP fake signing and localStorage-as-authority.

Continue in this order:

1. preregister and implement the exact Expo SDK 57 phone sensor adapter plus
   deterministic synthetic/recorded journey replay—no physical data yet;
2. separately preregister a durable Gateway runtime/store restart/concurrency/
   power-loss repeat and a reviewed signing-provider vector/review lane;
3. extend Commissioning with permissioned plan import and control-point
   registration; and
4. execute physical FLOOR/MAP/MESH repeats only after the owner supplies the
   authorised phones/building/plan/participants and approves collection.

Canonical evidence:

- `docs/product/PHASE-02-GATEWAY-VENUE-DISTRIBUTION.md`
- `docs/product/PHASE-02-GATEWAY-VENUE-DISTRIBUTION-RESULT.md`
- `design-qa.md`
- `docs/product/evidence/phase-02-*`
- `docs/OWNER-PRODUCT-STATUS.md`
- `docs/research/rnd/decision-log.md` (`RDD-021`)

The canonical worktree's `.claude/launch.json` remains user-owned, modified,
untouched and unstaged. No push, deployment, purchase, external contact or
physical data collection occurred.

### Phase 2 local-main integration receipt

- Preregistration commit `8a4407c` (`product(gateway): preregister venue
  distribution`) froze the evidence and failure gates before implementation.
- Product commit `9347415` (`product(gateway): add offline venue distribution`)
  was created from the explicit 17-file implementation/evidence set after all
  final gates passed.
- Local `main` fast-forwarded cleanly from `c2b13ca` through `9347415`.
- This documentation-only receipt is committed after that product payload and
  local `main` is fast-forwarded once more; no code changes occur between the
  measured product commit and the receipt.
- `origin/main` remains unchanged and no push/deployment was attempted.
- Root `.codex-audit/`, the canonical worktree's user-owned
  `.claude/launch.json`, and `claude/vibrant-yalow-620cd6` remain untouched.
