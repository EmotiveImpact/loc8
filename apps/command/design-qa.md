# Loc8 Command - Design QA

**Source visual truth:** `/Users/augustusedem/.codex/attachments/18901053-21f7-450b-8038-0c928369f9b2/image-1.png`  
**Implementation:** `http://127.0.0.1:4173/`  
**Implementation screenshot:** `/Users/augustusedem/Loc8/output/command-complete/supreme-live-site.png`  
**Integrated workspace screenshot:** `/Users/augustusedem/Loc8/output/command-complete/integrated-incident-workspace.png`  
**Tablet-width screenshot:** `/Users/augustusedem/Loc8/output/command-complete/integrated-tablet-web.png`  
**Combined comparison:** `/Users/augustusedem/Loc8/output/command-complete/supreme-reference-vs-implementation.png`  
**Viewport:** 1440 × 1024 CSS px  
**Source pixels:** 1440 × 1024  
**Implementation pixels:** 1440 × 1024  
**Density normalization:** none required; source and implementation are 1:1  
**State:** Live Site · 3D · all floors · selected SOS inspector open

## Full-view comparison evidence

The same eight-part composition is visible in the combined comparison:
operational rail, site summary, dominant real-time 3D venue, floating
view/layer/floor controls, incident inspector, multi-lane activity timeline,
command dock and always-visible site health.

The site geometry, panel proportions, matte-black surface treatment, density,
dividers and semantic mint/amber/red/blue overlays track the source closely.
Two differences are intentional product requirements:

- all four mission modes stay visible across the top instead of hiding inside a
  demonstration picker;
- the operational rail is wider so eight retained workspaces have readable
  labels rather than unexplained icons.

The content now reflects the real Command store (`The Chapelgate Rooms`,
11 on-duty staff, the live SOS subject and computed 83% coverage) rather than
copying the source mock's illustrative Arena Campus numbers. The change is
semantic, not a layout or style regression.

## Focused-region evidence

Focused comparison and browser inspection covered:

- top mission navigation and health telemetry;
- 2D, 3D, exploded and focus controls;
- floor and layer controls;
- Live Site summary and selected-SOS inspector;
- real responder states and incident timeline;
- shared activity timeline and command dock;
- the incident queue plus selected incident command workspace;
- roster reassignment controls;
- anonymised coverage workspace;
- active muster and check-in board;
- asset inventory, degraded-asset diagnosis and live scan;
- reason-gated assisted search and audit;
- Search & Rescue sectors, team assignment and radio;
- integrated Commissioning and Map Builder.

The visual target contains no raster hero asset to reproduce. Its primary
visual object is the interactive venue model; the implementation uses the live
Three.js renderer from the earlier HTML/React prototype. Product icons use the
Phosphor family.

## Required fidelity surfaces

- **Fonts and typography:** Unbounded/Sora/Space Mono preserve the display,
  interface and telemetry hierarchy. Long live values truncate or wrap inside
  their intended regions without overlapping controls.
- **Spacing and layout rhythm:** The source's dense control-room rhythm,
  hairline dividers, narrow rails and large uninterrupted scene are retained.
  Operational workspaces use the same frame rather than mounting a second app.
- **Colours and visual tokens:** Near-black surfaces and restrained
  `#46E0A0`, `#FFB43A`, `#FF4053` and `#7AA2FF` state colours match the source.
  Geometry stays neutral and colour carries operational meaning.
- **Image and asset fidelity:** The 3D site is rendered live, remains sharp at
  the target viewport and is shared by 2D/3D modes. No placeholder image
  replaces it.
- **Copy and content:** Stable interface copy follows the supplied source and
  the no-drop Command manifest. Dynamic site, incident, person, responder and
  coverage content correctly comes from the application store.
- **Icons:** Visible controls use a consistent thin-stroke Phosphor set with
  semantic active colour and accessible button names.
- **Responsiveness:** 1440 × 1024 and 1024 × 768 were inspected. At tablet
  width the mode bar, rail, scene, inspector, timeline and command dock remain
  reachable; integrated workspace tabs wrap into two touchable rows.

## Interaction verification

- All four mission modes opened: Live Site, Investigation, Person Search and
  Search & Rescue.
- 2D, 3D, exploded, focus, floor selection and layer toggles changed visible
  state while preserving the selected object.
- All eight operational workspaces opened inside the shared Command frame.
- The left rail navigated full workspaces while a workspace was already open.
- The incident queue changed the selected incident.
- Incident responder assignment, dispatch, acknowledge/escalate/resolve
  controls are wired to the audited store. Assigning Guard 01 updated the
  responder roster, staff state, incident timeline, mesh dispatch log and
  audit log in one action.
- Command-dock `call muster` activated muster and opened the headcount board.
- Roster reassignment changed the member's zone, recomputed coverage and wrote
  an audit event.
- Assisted search required a reason, returned the consented subject and wrote
  an `ASSISTED_SEARCH` event.
- Search & Rescue reassigned Bravo to C5, marked a sector clear, updated radio
  and timeline state and wrote audit events.
- Asset coverage scan returned the degraded south-perimeter diagnosis.
- Commissioning, plan registration, venue-package simulation and sensor replay
  remain reachable in the integrated Commissioning workspace.
- Browser console errors checked after reload: none.

## Comparison history

### Iteration 1

**Finding:** P1 - the real Command entry point showed a separate dashboard shell
instead of the selected spatial operating picture.

**Fix:** Promoted the earlier HTML/React digital twin to the primary Command
experience.

**Post-fix evidence:** `output/command-complete/live-site.png`.

### Iteration 2

**Finding:** P1 - the spatial shell opened the older Command application as a
full-screen overlay, making the product feel like two applications.

**Fix:** Removed the overlay from the runtime path. The eight operational
workspaces now render inside the spatial frame, while modes, rail, timeline and
command dock remain shared.

**Post-fix evidence:** `output/command-complete/integrated-incident-workspace.png`.

### Iteration 3

**Finding:** P2 - summary numbers, incident detail, scene markers and
Search & Rescue mutations were still isolated prototype state.

**Fix:** Bound the spatial console to the real Command store, projected staff
and incidents into the 2D/3D scene, added audited roster/search mutations and
made timeline/radio/inspector state derive from the same source.

**Post-fix evidence:** `output/command-complete/supreme-live-site.png` plus the
browser interaction checks above.

### Iteration 4

**Finding:** P2 - the tablet-width frame became dense and integrated workspace
navigation risked clipping.

**Fix:** Kept the reference layout, reduced nonessential health labels at
tablet width and wrapped the eight workspace tabs into two usable rows.

**Post-fix evidence:** `output/command-complete/integrated-tablet-web.png`.

## Findings

No actionable P0, P1 or P2 visual or core-interaction differences remain for
the selected Live Site target and the integrated operational workflow.

## Follow-up polish

- P3: code-split the 3D renderer and dense Commissioning tools to reduce the
  initial JavaScript bundle.
- P3: replace the upstream one-time Three.js clock deprecation warning when
  React Three Fiber/Drei exposes the supported Timer path.

**final result: passed**
