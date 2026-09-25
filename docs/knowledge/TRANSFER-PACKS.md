# Loc8 — build and cross-conversation transfer packs

Date: 25 September 2026. Source repo: `EmotiveImpact/loc8`. Main inspected at `f6b09a492c362f1c73b775d67721da1cc345fe91`; separate BLE hardening branch at `3421390a19643ac6f621d8b9faafa7d7b4fcae62`, draft PR #1, unmerged when checked.

These packs are additive. The receiving conversation must inspect its actual current repository and preserve work already in progress. No package below authorises a new product architecture, automatic merge, live data sharing or silent replacement of the shared engine. The reference code is a synthetic invariant demonstrator, not production integration.

## Pack A — Consumer, Guard and shared engine: observation freshness

### Problem and proposed slice

A delayed packet can arrive now while describing an old observation. Reconnect, replay, cached import and foreground resume must not make that old position appear live. Implement one projection over the existing location records, with application-specific wording, rather than a second position store.

Inspect `crewStore`, Guard and Command selectors, engine packet timestamps, native receive events, the bridge, local persistence and existing floor/source fields. Record field units and trust rules before editing. Preserve the 25-byte wire format and native relay ownership in this slice.

The proposed view must distinguish missing, withheld, clock-uncertain, recent, ageing and stale. Keep observation source, observation time, receive time, accuracy/uncertainty, permission basis and expiry separate. A trusted gateway clock or measured elapsed-time basis may support age; do not assume a sender's wall clock is trusted merely because its timestamp parses. The existing generous offline-clock policy must be reconciled explicitly, not silently tightened.

### Behavioural examples

A location observed five minutes ago and received this second remains five minutes old when its clock basis is trustworthy. An unknown or implausibly future source clock becomes clock-uncertain, not fresh. A revoked subject is withheld rather than left on the map as a stale identifiable point. A transport reconnect changes connection state, not observation time. A late lower-quality observation must not overwrite a newer observation just because it arrived last; compare identity/sequence under the host's existing policy, not timestamp alone.

### Implementation and acceptance

First map all data paths and write fake-clock fixtures. Add a shared pure projection in the existing engine/domain seam; integrate Consumer radar/crew, Guard team view and Command map/roster. Keep identity, floor and incident history intact. Add tests for delayed arrival, reconnect without a sample, out-of-order input, duplicate replay, clock rollback, future/unknown clock, missing position, invalid coordinates, revocation and consent expiry. Assert that receipt time never substitutes for observation time.

Freshness thresholds are explicit product configuration, not a claimed radio SLA. Test boundary values and app wording. Run exact repository-toolchain checks and the affected app integrations before promotion. The standalone reference tests in this package are not a substitute.

### Paste into the engine/Consumer/Guard conversation

> Continue the existing Loc8 build, do not restart it. Read KNOWLEDGE.md and Pack A of docs/knowledge/TRANSFER-PACKS.md on archive/loc8-knowledge-2026-09-25, then inspect your current branch. Preserve PR #1 as separate until its status and checks are verified. Implement the smallest shared observation-freshness projection using existing records and selectors, integrate the affected views, and prove delayed or replayed data cannot become live on arrival/reconnect. Preserve native relay policy, wire compatibility, privacy and floor/building contracts. Commit the code, tests and honest receipt; verify the remote commit and write back the next step.

## Pack B — Command and Vision: delivery evidence and no-drop integration

### Problem and proposed slice

A dispatch entry currently must not be treated as proof of radio transmission or response. Preserve the existing store and transport but give command outcomes accurately scoped evidence. Do not use the standalone UI simulator as the operational state machine.

For each command retain immutable command/message identity, originating incident identity, actual transport recipient/team identity, operator identity and intent. Keep facts such as queued, locally submitted, relay received, destination received, human acknowledged and completed as separately attributable evidence. A relay receipt does not establish destination receipt. A control-room acknowledgement does not establish a field acknowledgement. A retry, selected-incident change or late response must not change correlation.

An implementation needs an asynchronous submission result, explicit rejection/timeout, idempotent retry identity, verified receipt origin/scope, receipt deduplication, and a view of what remains unknown. This archive does not define new wire packet types or provide authentication. Without a reviewed inbound receipt path, show delivery unknown rather than synthesising acknowledgement.

### Preserve the actual application

Read COMMAND-FEATURE-MANIFEST, COMMAND-APPLICATION-MAP, COMMAND-PRODUCT-BLUEPRINT, COMMAND-VISUAL-FINISH, VISION-COMMAND-HANDOFF and apps/command/BUILD-PROMPT. Retain commissioning/building tools as well as incidents, roster, assignment, muster, assisted search, audit, duress, escalation and response workflows. A redesigned default view can progressively disclose features, not remove them.

Numeric engine IDs, displayed callsigns and destination tags are different. Keep resolution reasons in the real command/audit contract. Do not acknowledge covert duress to a field device merely because the operator clicked a local acknowledgement. Do not close outstanding muster entries based on position alone. Preserve authorised reveal/audit rules and log unsuccessful searches as required by the host.

Treat the recovered DOM/SVG and React/Pixi HTML previews as separate historical demos. Their illustrated map is not a surveyed floor plan; the local save is not a secure operational ledger. Use the host's versions of React, TypeScript and the shared engine. Do not merge unrelated Git histories or downgrade the monorepo to a preview's vendored runtime.

### Media is separate

Camera/glasses imagery needs its own authorised transport. It does not travel through the 25-byte mesh channel. Preserve the glasses panel and independent HUD, while showing source type, last-frame age, paused/stalled/disconnected/ended/denied status. Do not leave LIVE on a frozen still or fabricate face identity, bearing or distance.

### Acceptance and paste-in prompt

Test offline queue/rejected send, duplicate click, wrong message/incident/recipient receipt, relay-only receipt, late receipt, timeout followed by late acknowledgement, lost connection, revoked visibility, command correlation across selection changes, and real reason retention. Test missing/stale map data and media stalls separately. Compare all existing features against the no-drop manifest before switching the main screen.

> Continue the current Command/Vision build without discarding any existing work. Import Pack B from docs/knowledge/TRANSFER-PACKS.md in EmotiveImpact/loc8, recovery branch archive/loc8-knowledge-2026-09-25. Read the current no-drop product contracts and actual store/bridge first. Add truthful asynchronous command evidence and a host-backed view adapter; preserve incident correlation, privacy, duress, resolution reasons, muster and all building/commissioning features. Keep demo state and media separate from live operation. Publish a tested incremental change and a remote-verified receipt, not another standalone replacement app.

## Pack C — Mapping, Gateway and Loc8OS: coverage-aware building model

### Developed concept

Keep four layers distinct: physical geometry, semantic building topology, observation confidence, and communications reachability. Connect them through versioned identifiers, not by drawing everything onto an uncalibrated image. The useful product is not merely a digital twin that looks right; it is a model that can explain what is known, where the evidence came from and where communication or location confidence is missing.

Reuse the existing building package, control-point registration, routing profiles, Command Map Builder, Guard projection and Gateway distribution contracts. Proposed additions should reference building/package version, floor ID, space/connector ID, observation source/age/confidence and measured coverage-cohort identity. A coverage survey result must retain device, OS/state, direction, placement, code build and measurement time. Staff coverage, anonymous crowd density and radio coverage remain different overlays.

### Floor inference

Preserve the anchor + assist + topology approach: explicit absolute anchors; relative barometer/IMU transition evidence; ambient reference where available; calibrated categorical radio evidence; building connector constraints; a probability distribution, hysteresis and manual confirmation. Learn actual connector height distributions instead of assuming every storey is 3.5 metres. An impossible or unobserved transition should reduce confidence or request confirmation, not snap to a plausible-looking floor. Evaluate unseen points/floors/devices/venues separately from the calibration set.

### Gateway and outage boundary

Gateway remains one logical site brain; Anchor remains a bounded radio extension. Keep meshd/relayd/sited/syncd/provisiond/supervisord and existing package-provider contracts. Loss of WAN must not disable local operation; loss of Gateway must not intentionally disable phone-to-phone finding. This is an acceptance requirement, not field proof.

A bounded outbox must distinguish replaceable position snapshots from durable incident/audit intent. Collapsing superseded position updates may be useful; silently collapsing incident history is not. Define authenticated message identity, expiration, storage budgets, fairness, acknowledgement scope, crash recovery and reconciliation before enabling persistent couriers. Keep real signing/key storage and durable target storage behind their existing review gates.

### Concrete next demonstrator

Use one existing synthetic building fixture, one delayed position feed, one incident assignment and a simulated gateway link. Display geometry/version, position age/confidence, command evidence and radio-link state separately. Interrupt and resume the link; replay old data; change map/package version; revoke a subject; remove an Anchor; restart the local process. Show uncertainty and recovery without pretending this proves RF reach or a safe physical route.

Acceptance: no coordinates move meaning when maps change; no fresh label on old samples; no invalid floor transitions hidden; no loss/duplication of incident intent on reconnect; no public location display without authority; route profile/accessibility rules retained. Communications reachability must not override physical safety constraints or be presented as certified evacuation advice. Physical MESH/FLOOR/MAP/RADIO gates remain required.

> Continue the existing mapping/Gateway/Loc8OS work. Read Pack C and the current Principal audit, building contracts and daemon specifications before changing code. Extend one existing fixture and adapter to expose map version, observation confidence/freshness and communications state independently. Preserve routing profiles, package registration, one logical Gateway and the phone-layer degradation boundary. Treat outage tests as synthetic until measured on hardware. Record the actual test evidence and publish an additive change; do not replace the architecture or label a simulation field-proven.

## Pack D — Black State / noir and other projects: transfer principles, not live data

This is an optional scoped transfer proposal. It has not modified another repository or posted into another conversation. The Black State archive must be read in its own destination session before adoption.

The reusable concepts are evidence-labelled observations, bounded offline queues, truthful acknowledgement, versioned geometry, held-out evaluation, consent-scoped views and remote-verified research receipts. Keep non-cooperative sensing separate from cooperative Loc8 identity. Observation is not identity, a track is not a threat, receipt is not human acknowledgement, and connectivity is not freshness. Shared implementation patterns do not permit shared customer location data.

For an authorised, non-weaponised site-awareness demonstration, combine simulated sensor observations and consenting cooperative locations through an explicit event adapter. Disconnect the WAN and verify local evidence remains correctly attributed and reconciles without duplicate incidents. Preserve Loc8 Guard/Command, separate Black State Operator/handset decisions and existing product names. Do not turn this into automatic identification, targeting or autonomous force.

Deliverable: a destination-specific adoption note listing the exact contracts reused, destination files, incompatible assumptions, permission boundaries, tests and rejected ideas. Review source licences before copying code. Do not paste the whole Loc8 engine or all research clones into another product.

> In the Black State/noir conversation, read your actual repo and current product boundaries first, then use Pack D from Loc8's recovery archive as a research input. Extract observation freshness, evidence-scoped receipts, bounded outage handling and provenance into your existing non-weaponised site-awareness contracts. Keep cooperative identity, sensors, products and customer data separate. Reconcile rather than replace your current architecture, test the smallest useful adapter and write an adoption/rejection receipt with source revision and remote commit.

## Publication contract for every receiving conversation

Before calling a transfer integrated, record the destination repo/branch, inspected baseline, accepted and rejected findings, changed files, tests run/not run, remaining field/security gates, remote commit and next bounded task. The source archive and copyable prompt provide context; they are not proof that another session has read, built, merged or deployed anything.
