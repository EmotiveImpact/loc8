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
