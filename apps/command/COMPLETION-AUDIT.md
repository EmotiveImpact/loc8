# Loc8 Command — Completion Audit

**Completed surface:** integrated Command web application  
**Primary visual target:** `/Users/augustusedem/.codex/attachments/18901053-21f7-450b-8038-0c928369f9b2/image-1.png`  
**No-drop source:** `docs/product/COMMAND-FEATURE-MANIFEST.md`  
**Build brief:** `apps/command/BUILD-PROMPT.md`

## One application frame

- The earlier HTML/React digital twin is the primary spatial Command frame.
- `apps/command/src/App.tsx` owns the shared Zustand state and passes it into
  the venue, mission modes, timeline, command dock and operational workspaces.
- `apps/command/src/OperationalWorkspace.tsx` renders all detailed workspaces
  inside that frame.
- The retired `LegacyCommandApp` shell is not imported or mounted at runtime.
  There is one navigation system, one state source and one activity timeline.

## Spatial operating picture

- Live Three.js site model with 2D, 3D, exploded and focus modes.
- All-floor plus L3, L2, L1 and ground-level scope controls.
- People, routes, coverage, camera, search and muster layers.
- Staff, incidents, teams and selected objects derive from shared Command
  state in every spatial mode.
- Selected incident and selected person remain consistent between the scene,
  inspector, activity timeline and detailed workspace.

## Mission modes

- Live Site: site health, active event, responder status and mesh coverage.
- Investigation: selected-person trace, contact attempts and response actions.
- Person Search: last-known position, trail, nearest team and search start.
- Search & Rescue: sector progress, Alpha/Bravo/K9 assignments, command radio,
  reassignment and area-clear actions.

## Operational workspaces

- Live Site: operational summary and health metrics.
- Incidents: queue, detail, map, timeline, responders and mesh actions.
- Team: roster, shift state, live location, zone assignment and check-in.
- Coverage: anonymised density, freshness, confidence and privacy boundary.
- Muster: live headcount, missing/no-signal state, check-in and stand-down.
- Assets: gateways, anchors, cameras and doors with health and scan diagnosis.
- Search & Audit: reason-gated assisted search and immutable operator trail.
- Commissioning: plan registration, Map Builder, venue package and replay
  simulation.

## Live operational mutations

- Incident acknowledge, escalation, resolution and mesh dispatch.
- Incident responder assignment updates responder list, staff status,
  incident timeline, dispatch frames and audit log.
- Zone reassignment recomputes coverage and records the operator action.
- Muster call, safe check-in and stand-down.
- Search-team reassignment and sector-clear actions update radio, progress,
  timeline and audit state.
- Assisted search refuses a request without a reason and records allowed
  subject disclosure.
- Inbound Guard status, silent duress, man-down watchdog and operational
  grammar events reconcile incident and person state.

## Verification evidence

- Production build: `npm run build --workspace @loc8/command` — passed.
- Domain/store suites: 8 suites, 63 tests — passed.
- `git diff --check` — passed.
- Browser console after final reload and responder assignment — no errors.
- Desktop visual QA at 1440 × 1024 — passed.
- Tablet-width QA at 1024 × 768 — passed.
- All four mission modes and all eight operational workspaces opened in the
  live browser.
- Final visual comparison and screenshots are in
  `output/command-complete/`.

## Deliberately separate future delivery work

The application is complete as the integrated Command web product. Native
desktop packaging, production identity/SSO, live customer backends and
deployment infrastructure remain delivery programmes rather than missing UI
features. The same React application is structured to be wrapped for desktop
and used responsively on tablets without creating another Command product.

**Result: passed**
