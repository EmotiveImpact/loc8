# Loc8 Command - No-Drop Feature Manifest

**Status:** Canonical product/design inventory  
**Updated:** 2026-07-23  
**Rule:** A redesign may reorganise or progressively disclose a feature, but it
must not silently remove it.

This manifest reconciles:

- the existing production-oriented Command application in `apps/command/`;
- the Principal R&D/Product thread and its completed building phases;
- the Command digital-twin prototype;
- the current visual redesign work;
- the planned desktop, tablet and Vision product family.

The visual design is not the feature specification. This file is.

## 1. Existing Command operational features

### Operations overview

- Live site and shift summary.
- Incident and operational feed.
- Tactical map based on actual projected coordinates.
- On-duty roster and current staff state.
- Venue coverage status.
- Call-muster action.
- Drill-down into active incidents.
- Offline/mesh connection state.

### Incident management

- Incident queue and selected incident.
- SOS, medical, welfare/lone-worker and operational incident kinds.
- Live elapsed time.
- Incident location and selected building object.
- Responders and their states.
- Nearest-responder distance.
- Acknowledge.
- Escalate.
- Dispatch and dispatch instructions.
- Update/reassign responders.
- Guard quick-reply states decoded through the shared engine.
- Inbound status toast.
- Team text attached to the active incident.
- Resolve/close.
- Field stand-down reconciliation.
- Incident timeline.
- Man-down/lone-worker watchdog for live data.

### Muster and evacuation

- Call muster.
- Live accounted/outstanding totals.
- Individual staff check-in.
- Assembly point.
- Staff state grid.
- Map of assembly and outstanding staff.
- Stand down muster.
- End muster.
- Audit entries for muster actions.

### Roster and shift

- On-duty roster.
- Staff role, current operational state and zone.
- Time/state freshness.
- Zone coverage by roster.
- Assignment and reassignment workflow.
- Shift identity and team grouping.
- Welfare and communications state.

Assignment/reassignment is implemented in the unified Command application:
the operator can select an on-duty member and target zone, the shared store
updates the assignment, coverage is recomputed and an audit entry is written.

### Coverage and crowd safety

- Venue coverage percentage.
- Good/thin/gap coverage states.
- Coverage gaps.
- Privacy-safe anonymous crowd density.
- Zone-level coverage/density.
- Guards contributing to operational coverage.
- Mesh/Gateway/anchor health.
- Freshness and last-relay information.
- Degraded asset and blind-spot inspection.
- Coverage scan/survey workflow.
- Coverage privacy explanation.

### Assisted person search and audit

- Search only consent-carrying subjects.
- Required operator identity.
- Required search reason.
- On-duty staff, SOS initiator, opt-in medical and family/crew consent bases.
- Zero-match attempts still logged.
- Last known position and freshness.
- Contact attempts and result.
- Nearest team members with distances/ETAs.
- Dispatch, contact and start-search actions.
- Event log.
- Audit-log view.
- Audit export.
- No unbounded attendee "god mode."

The current browser audit is bounded and not a production archive. Durable,
tamper-evident Gateway/service audit remains required.

### Live transport behaviour

- Simulated Guard return-leg status using the real shared wire codec.
- Optional live bridge mode.
- Incoming quick replies.
- Team text.
- SOS creation/update.
- One active SOS per raiser.
- Live watchdog only when live transport is active.
- Strict separation between scripted and live data.
- Offline/degraded connection indication.

The existing demo bridge is not a production security boundary. Authentication,
TLS, site/role isolation, revocation, durability and payload security remain
production gates.

## 2. Existing Commissioning and building features

### Semantic venue package

- Stable building, level, space, zone, portal and connector identities.
- Human floor labels and elevations.
- Rooms, corridors and operational zones.
- Stairs, lifts, ramps and escalators.
- Entrances, final exits and assembly points.
- Accessibility metadata.
- Points of interest such as AED/medical, Command centre, Gateway and anchors.
- Immutable published versions and draft lineage.
- Validation.
- Guard and Command projections from the same package.
- Legacy packet-floor adapter at the transport boundary.

### Command Map Builder

- Commissioning workspace inside Command.
- Four-level synthetic demonstration venue.
- Floor selection.
- Create/edit/rename spaces without changing stable identity.
- Edit room/zone geometry.
- Place and classify connectors and important locations.
- Route preview.
- Standard, step-free, evacuation and responder route profiles.
- Temporary connector/route closures.
- Validation errors and warnings.
- Browser-local draft/demo persistence.
- Fork a new draft from an immutable local demo.

### Plan registration

- Strict plan-import data contract.
- Source-plan preview.
- Control-point pairing.
- Source-pixel to building-metre similarity transform.
- Scale/rotation/translation evaluation.
- Residual and target-bound gates.
- Registered preview.
- Safe draft apply.
- Registration receipt and provenance.
- Map Builder handoff.

Normal PDF/PNG/JPEG and later CAD/BIM ingestion, customer-file storage and
competent survey/review remain future product work.

### Gateway venue-package simulation

- Package identity/version validation.
- Update lineage.
- Install, load, reconcile and remove.
- Fail-closed provider seams for hashing, signing, time and atomic storage.
- Explicitly browser-local, simulation-only presentation.

Durable appliance storage, real signing, certificates, radio transfer,
power-loss recovery and target-hardware proof remain future work.

### Phone floor sensing and replay

- Expo 57 barometer, motion and magnetometer adapter.
- Explicit permission start.
- Capability and issue reporting.
- Normalised observations and monotonic timestamps.
- Deterministic synthetic floor journey.
- JSON replay validation.
- Play, pause, seek, step, speed and reset.
- Ground-truth versus estimated-floor display.
- Clear synthetic/replay/unverified labelling.

Real-building accuracy, background behaviour, calibrated anchors, pressure
reference and multi-device cohorts remain future physical evidence.

## 3. New Command digital-twin capabilities to retain

### Persistent modes

- Live Site.
- Investigation.
- Person Search.
- Search & Rescue.

Modes change the complete working context: spatial emphasis, inspector,
timeline, available actions and alert priority. They do not replace the
operational workspaces listed elsewhere.

### 2D/3D spatial operating picture

- 2D bird's-eye.
- 3D orbit.
- Exploded floors.
- Selected-floor isolation.
- Incident/person focus.
- Operational north/reset.
- Floor scope.
- Layer controls.
- Rooms, routes, doors, exits and search areas.
- People/team markers.
- Coverage and mesh overlays.
- Cameras where authorised.
- Muster points.
- Search sectors.
- Last-known trail with timestamp nodes.
- Confidence, source and freshness.
- Scale and compass.
- Neutral site geometry with semantic colour overlays.

### Search operations

- Missing-person profile and last-known position.
- Contact-attempt history.
- Search-sector definition.
- Sector progress.
- Team allocation.
- Canine/K9 unit where relevant.
- Reassign team.
- Mark area clear.
- Recommended/unsearched areas.
- Live radio/command transcript.
- Search command vocabulary.

### Activity timeline

- Separate lanes for people, teams, incidents, infrastructure and system state.
- Timestamp scale.
- Multiple event nodes per lane.
- State transitions and handoffs.
- Current-time cursor.
- Direction/continuation state such as en route, responding, unavailable,
  degraded or resolved.
- Playback/pause and historical inspection.
- Audit context.

### Command dock

- Natural-language query/action field.
- Scenario-aware suggestions.
- Structured result and confirmation.
- Voice/dictation future compatibility.
- Every operational mutation must still pass role, confirmation and audit
  policy; language input must not bypass controls.

## 4. Workspaces in the unified product

| Workspace | Existing capabilities retained | Digital-twin enhancement |
|---|---|---|
| Live Site | operations summary, feed, roster, incident drill-down, muster | whole-site 2D/3D picture and event timeline |
| Incidents | queue, acknowledge, escalate, dispatch, resolve | spatial incident focus, routes, responder movement |
| Team | roster, shift, status, coverage | live position/freshness, assignment and welfare |
| Coverage | density, gaps, privacy | Gateway/anchor/mesh layers and coverage-aware routing |
| Muster | call, check-in, outstanding map, stand-down | 2D/3D assembly and route context |
| Assets | existing Gateway/venue-package information | Gateway, anchors, cameras, doors and commissioning health |
| Assisted Search | consent/reason/audit/search | last-known trail, sectors, teams and live radio |
| Commissioning | Map Builder, routes, Gateway simulation, replay, plan registration | production site model feeding normal operations |
| Audit | local event log and export | durable cross-mode operational history later |

## 5. Product-family requirements

### Command Web

- Primary implementation and complete capability surface.

### Command Desktop

- Same React product packaged after a Tauri proof.
- Dedicated window/full-screen mode.
- Gateway discovery.
- Secure local configuration.
- Notifications.
- Controlled update channel.
- Managed-device deployment.
- Authorised plan/audit file handling.

### Command Field tablet

- Touch-first React Native/Expo application.
- Map-first incident command.
- Search-sector drawing/editing.
- Dispatch/reassignment.
- Mobile muster.
- Coverage/asset inspection.
- Offline venue cache.
- Push alerts.
- Handoff to Command, Guard and Vision.

### Guard and Vision

- Same identities, incidents, routes, search sectors, actions and audit events.
- Guard keeps the detailed one-handed field workflow.
- Vision remains glanceable, voice-led and safety-limited.
- Neither surface replaces Command's high-information coordination role.

## 6. Production capabilities still required

- Real organisations, sites, users, roles and permissions.
- Secure connected service.
- TLS/authentication/site and role isolation.
- Device enrolment, revocation and loss handling.
- Durable tamper-evident audit.
- Backup, restore and monitoring.
- Gateway fleet health.
- Multi-Gateway ownership/handoff.
- Box-swap/disaster recovery.
- Real-time clock strategy for offline sites.
- Normal customer plan ingestion.
- Venue version review, approval, comparison and rollback.
- Commissioning reports.
- Coverage-aware routing.
- Production 2D/3D renderer and scene data contract.
- Real floor-estimation fusion.
- Physical three-phone mesh evidence.
- Real Gateway/anchor/LoRa experiments.
- Accessibility, keyboard and operator usability validation.
- Independent security, cryptography, privacy and safety review.

## 7. Design and implementation rule

Before a visual direction is approved or coded:

1. Check every visible workflow against this manifest.
2. Decide where each feature lives: persistent frame, mode, workspace,
   inspector, drawer, modal or secondary screen.
3. Mark features not shown in the selected hero screen as intentionally
   off-screen, not deleted.
4. Maintain a feature-to-surface matrix during implementation.
5. Test that the original Command workflows still exist after the new shell is
   introduced.

The next Command design must be a new shell around the complete product, not a
replacement demo containing only the features visible in one generated image.
