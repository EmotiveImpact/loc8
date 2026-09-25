# Loc8: one system, one development programme

**Prepared 25 September 2026. Current implementation work stays in PR #4. No merge or deployment is authorised by this document.**

Read this first for sequence and meaning. Read `KNOWLEDGE.md` on the separate
knowledge archive branch for recovered originals, history and transfer packs.
They are complementary: this is the build map; that is the preserved evidence.
The machine-readable companion is `docs/programme/roadmap.json`.

## 1. What the three PRs actually are

| Review | Contents when inspected | Base | Integration decision |
|---|---|---|---|
| #3 | Knowledge entry point, preservation rules, research provenance, transfer packs, original Markdown handovers and isolated reference tests; 18 files at `6ddbf437`. | main | Review and integrate the archive first, keeping unresolved original-byte gaps explicit. Not a competing app. |
| #1 | Shared packet validation, bounded assembly, BLE restart/lifecycle repairs, 80-check harness, wire fixtures and R&D programme; 9 files at `3421390a`. | main | Integrate after exact-toolchain regression and review. It is the runtime foundation for #4. |
| #4 | Position-report provenance and selected Consumer/Guard/Command integrations, now extended with original local GPS sample retention. | #1 branch | Continue here. Once #1 is in main, retarget/reconcile #4 onto main and rerun combined gates. Do not merge #4 blindly into #1 and hide its review boundary. |

**#2 is the delivery tracker, not another PR.** PR numbers and issue numbers
share a sequence. These reviews exist to separate archive work from runtime
risk and to make the second runtime slice depend explicitly on the first.
All three were open drafts when inspected. Mechanically mergeable does not
mean tested, approved or production-ready. No fourth PR is needed for this work.

The target is one coherent main branch containing the approved archive and
reviewed runtime changes, not permanently parallel products. Retain dependent
branches until retargeting is complete. Prefer preserving ancestry for the
stacked runtime changes; a squash/rebase requires explicit reconciliation of
#4's base and diff. Then perform one combined full-tree test and release review.

## 2. The map of meaning

The emerging system is a **coverage-aware operational venue model**, built on
an infrastructure-independent public phone product. It is a proposal already
present in `docs/research/rnd/innovation-opportunities.md`, not a new claim that
Loc8 has achieved a novel digital twin or field-proven coverage.

| Concept | Meaning that must survive every layer |
|---|---|
| Identity and permission | Who may see or act, for this crew/site/shift. A sender ID or consent label is not proof of authorisation. |
| Source observation | What a device measured, when it measured it, when we received it, its reported accuracy and origin. |
| Position/floor estimate | What we infer from observations. Age, confidence and the underlying evidence remain visible. |
| Versioned place | The building, level, room and connector in the reviewed map/package version. |
| Communications reachability | What paths were observed to work under named radio, device, direction and phone-state conditions. |
| Intent | What an authorised person requested, tied immutably to its incident and destination. |
| Delivery evidence | Local submission, relay receipt, destination receipt and human acknowledgement are separate facts. |
| Human outcome | Someone acknowledged, attended or completed an action. A packet does not establish these outcomes. |
| Provenance and promotion | Source, revision, method, raw trace hash, cohort, limitations and the decision that permits adoption. |

These relations belong in existing records and interfaces, not a second live
tracking database. Geometry is not radio coverage. Contact time is not fix time.
A warm-looking dot is not a trustworthy position. A dispatched message is not
a field acknowledgement. A mapped route is not certified evacuation advice.

This distinction gives each product a concrete job: public Loc8 helps people
find their crew without false confidence; Guard carries field observations and
intent; Command explains what is known, uncertain, requested and actually
acknowledged; Gateway and Anchors extend operation without becoming mandatory
for public phone-to-phone finding.

## 3. What the retained research already gives us

| Research family | Existing evidence and code to reuse | Next useful application, not a restart |
|---|---|---|
| Mesh reliability | Native BLE/GATT modules; `mesh-and-resilience.md`; BitChat/Columba comparisons; bounded protocol-v2 prototype. | Three-phone and background proof, then measured controlled fanout. Native code retains relay ownership. |
| Source and delivery truth | R0, R1a and archive transfer/reference contracts. | Finish source provenance, then immutable command correlation and truthful delivery states. |
| Connected operations/security | `services/loc8-relayd`, CONN-01 and SEC-05 contracts/results. | Real reviewed identity, TLS, authorisation, signing and storage providers. These are not already deployed services. |
| Floor inference | `floor-detection.md`, corpus/recorder/evaluator, sensor replay and existing relative floor tracker. | Absolute anchor + relative motion/pressure + topology, uncertainty and manual confirmation; evaluate unseen buildings/devices. |
| Mapping and commissioning | Shared venue package, route profiles, Map Builder, plan registration and distribution simulation. | Actual authorised plan/survey evidence, second-operator repeat and calibrated site rollout. |
| Gateway, Anchors and radio extension | Existing hardware/Loc8OS contracts and MeshCore/LoRaMesher/RadioLib assessments. | Durable on-target storage, reviewed signing, recovery and separately measured phone uplink. Do not invent extra Gateway roles. |
| Command/Vision design | No-drop feature manifest and separate historical previews. | Preserve incidents, duress, dispatch, muster, roster, audit/search, commissioning and glasses while integrating real host-backed state. |
| Optional meaning layer | Newly recovered `10_SOFTWARE_MAP.md`, preserved byte-for-byte in `docs/programme/inputs/`, Sankofa Library v1, distinct from the older Loc8 archive. | A research-only domain-intent/template benchmark. No Rust migration, new model dependency or protocol replacement follows from that document. |

The source catalogue has **48 historical pinned repository candidates**, not
48 dependencies to install and not proof that the ignored clone directories
were backed up. The retained source/licence assessment determines whether each
candidate is code, an idea, a benchmark, restricted or held. Revalidate the
actual revision/licence before copying. Do not turn old aggregate accuracy,
range, relay-count or simulator numbers into Loc8 product claims.

The Principal audit already records promotion of some pure contracts while
holding physical/security work. In particular, SEC-05 reported no provider
clearing every gate, and MESH-01 remained a physical hold. Historical test
counts are valuable provenance, not fresh verification of today's branch.

## 4. Build order and parallel lanes

| Stage | Deliverable | What unlocks the next stage |
|---|---|---|
| Now: P0 / R0 / R1a | Preserve evidence and establish shared input/lifecycle/freshness behaviour. | Review the archive and run complete dependency-resolved regression. |
| This increment: R1b | Preserve original GPS sample time and accuracy locally, repair watcher cleanup/fallback, retain stationary report heartbeats. | Tests plus exact Expo/native integration review; remote sample time is still not carried by v1. |
| Next runtime slice: R2 | Add truthful asynchronous command submission and immutable incident/recipient correlation to the existing store/bridge. | Failure/timeout/duplicate/wrong-recipient tests. Without an authenticated inbound receipt, show delivery unknown. |
| Parallel R1c | Design end-to-end source-sample metadata and local/remote clock uncertainty without silently reusing v1 fields. Migrate remaining views and ranking. | Mixed-version and stale-input tests, source correlation and explicit protocol review before enabling new semantics. |
| Parallel SEC / CONN | Advance existing connected/security contracts to real reviewed providers and an authorised connected pilot. | Identity/site isolation, revocation, durable audit and outage recovery. BLE proof is separate, not a false prerequisite for all commercial progress. |
| Parallel MAP / EDGE / MESH | Commission one real site, validate floor transitions and phone cohorts, implement durable Gateway storage and test Anchors. | Permissioned real evidence with frozen MESH/FLOOR/MAP/RADIO criteria. |
| Then TWIN / DTN / VISION | Join the validated place/confidence/reachability model, bounded interrupted delivery and separate media evidence. | Proven inputs and explicitly scoped permissions/security; no bulk import of prototypes. |
| Research-only MEANING | Compare canonical intent/template packs with the existing ops grammar. | Demonstrated semantic correctness and size benefit, including ambiguity/rejection, before adoption. |

No calendar estimates are imposed on evidence that has not been collected.
The dependency graph in `roadmap.json` distinguishes the immediate software
sequence from hardware/provider and field-test lanes.

The first practical integrated scenario should reuse the existing synthetic
venue and actual stores: a known staff report ages; an operator assigns a
correlated task; the link fails; the view keeps last-known position distinct
from connection state; submission remains unknown/rejected rather than falsely
delivered; reconnect/replay does not freshen the old point or duplicate intent.
That is a software demonstration until repeated with real equipment and providers.

## 5. What is implemented in R1b, and what is not

Both location hooks retain provider `timestamp` in milliseconds and the full
reported accuracy. The existing crew store owns the sample and its first local
receipt. A separate projection ages it without stamping a new observation on
publish. Same-coordinate new samples are accepted; duplicate and older sample
callbacks do not renew it. Demo/provider-mocked samples remain identified.

The existing wire timestamp remains report publication time. Reusing it as GPS
sample time would collapse repeated stationary reports under the existing
monotonic trust rule. The existing accuracy byte now uses rounded-up measured
accuracy, capped at 255; full precision remains local. Unknown accuracy also
uses the existing ceiling, so legacy peers cannot distinguish unknown from
saturated accuracy. It is not a new sentinel or a claim that error is <=255m.

There is no end-to-end sample timestamp on the unchanged legacy wire. Remote
source age therefore remains unverified. No new packet, hidden metadata in
heading/floor fields, or assumed clock synchronisation is introduced. The exact
source/report/receipt distinction is a requirement for R1c, not solved by a label.

Unavailable GPS no longer causes a real transport to publish the demo origin.
Geo-free quick replies and text remain usable without a fix. The existing SOS
alert path remains; its no-fix zero-coordinate ambiguity is an explicit older
wire limitation, not a problem this patch claims to solve. Own-fix navigation
quality and remaining Command ranking/coverage consumers still require review.

## 6. Preservation and handoffs

Keep substantive source, decisions, fixtures, test evidence and a receipt in
tracked paths. Every delivery states exact remote branch/commit, what ran, what
did not, what merged and what deployed. A worktree is an editing location, not
a backup. An ignored clone, `node_modules` or a downloadable ZIP is not a
verified GitHub upload.

The four historical Markdown originals are on archive PR #3. The two large
Command HTML previews were recovered again and their exact hashes verified,
but this increment has not uploaded their bytes to GitHub. Their original
bytes are included in the accompanying consolidated backup. The entire separate
Command source/history, original ignored clones and full raw chat archive remain
unrecovered. Do not recreate those histories and call them recovered originals.

Cross-conversation handoff: open the relevant existing archive transfer pack,
then this master plan and the newest implementation receipt. State which
contracts to adopt and which to reject, inspect the destination's current code,
and publish a tested destination-specific change. Transfer methods and designs,
not Loc8 customer locations, identities, raw traces or automatic authority.
Black State/noir remains a separate product and repository; nothing here was
pushed there or posted into another conversation.

## 7. Verification and integration rules

CI run 36172826984 failed with no assigned runner/steps and no retrievable log.
The cause is unestablished; unavailable check annotations must not become a
made-up billing diagnosis. Keep the CI blocker separate from local test results.
The local compiler is TypeScript 5.8.3, while the repo requests ~6.0.3.

Before merging runtime work: install the exact lockfile, run all scoped and
existing suites, applicable TypeScript/lint, Consumer/Guard/Command builds and
native/UI checks. Then run the combined tree with the archive included. Keep
physical three-phone, locked/mixed-OS, battery, range and independent security
gates explicit. Do not manufacture green status from mocked boundaries.

Primary source for the GPS boundary: [Expo SDK 57 Location](https://docs.expo.dev/versions/v57.0.0/sdk/location/).
Repository sources, exact revisions and scope are recorded in `docs/programme/roadmap.json`.
