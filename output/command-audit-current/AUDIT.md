# Loc8 Command — Current Product Audit

Date: 2026-07-23  
Viewport: 1280 × 720  
Scope: Live Site, incident response, team operations, coverage and
Search & Rescue.

## Verdict

Loc8 Command is a strong spatial concept prototype, but it is not yet a
finished integrated command application. The 3D Live Site and Search & Rescue
views establish the right product language. The detailed operational
workspaces still behave and look like an older dashboard mounted inside that
language.

The main problem is structural integration, not colour.

## Evidence

### 1. Live Site — promising, but over-compressed

Evidence: `01-live-site.png`

- The spatial hierarchy, matte-black palette and semantic status colours are
  the strongest part of the product.
- The 3D model is visually atmospheric but too abstract for fast operational
  reading: rooms, floors, routes, incidents and devices need stronger labels.
- The top status labels disappear at this width, leaving ambiguous coloured
  shapes.
- The left summary, 3D controls, right inspector, timeline and command bar all
  compete for attention.
- The fixed 168px timeline plus 55px command bar uses roughly one-third of the
  available working height.

Health: promising, not finished.

### 2. Incident workspace — structurally disconnected

Evidence: `02-incident-workspace.png`

- Opening an incident removes the spatial context instead of preserving the
  selected location and response picture.
- The app displays three navigation layers at once: mission modes, the left
  rail and a repeated eight-item workspace tab bar.
- A second `Loc8 Command` header appears inside the workspace, creating a
  nested-application feeling.
- The persistent global timeline compresses the incident content so the
  responder controls and most of the incident detail fall below the visible
  area.
- The incident clock, global timeline clock and fixed header clock do not use
  one consistent time model.

Health: functional, but requires redesign.

### 3. Team workspace — useful data, poor shell integration

Evidence: `03-team-workspace.png`

- The roster is useful and visually clean in isolation.
- `Live Site` remains selected in the top mode bar while `Team` is selected in
  two other navigation systems, so the current location is ambiguous.
- The persistent incident timeline is not the most relevant team context and
  hides most of the roster.
- The workspace does not directly expose `locate on map`, `show route`,
  `open incident` or `start welfare check`, so the roster and spatial product
  remain loosely connected.

Health: useful module, weakly integrated.

### 4. Coverage workspace — good concept, wrong context priority

Evidence: `04-coverage-workspace.png`

- The anonymised heatmap and gap language are aligned with the product vision.
- The active-incident timeline still dominates the screen even though the
  operator is assessing coverage.
- Coverage gaps do not visibly bridge into the responsible gateway, anchor,
  camera or commissioning action.
- `83% venue coverage`, `83% mesh` and `all systems operational` are presented
  in ways that can be read as contradictory or semantically interchangeable.

Health: good feature concept, incomplete operational loop.

### 5. Search & Rescue — the clearest north star

Evidence: `05-search-and-rescue.png`

- This is the most coherent screen because the map, sector state, teams, radio,
  timeline and actions all describe the same mission.
- It proves that the core layout can work when every panel is contextual.
- The site still needs room/floor/sector labels and clearer spatial geometry.
- Bottom actions are clipped at the 720px viewport, and very small telemetry
  type limits legibility.

Health: strongest current direction.

## Highest-impact work

1. Establish one information architecture.
   - Keep the left rail as primary product navigation.
   - Treat Live Site, Investigation, Person Search and Search & Rescue as
     spatial views inside the relevant operation, not a second global
     navigation system.
   - Remove the repeated horizontal workspace tab bar.

2. Make the timeline contextual and collapsible.
   - Keep a compact global activity strip by default.
   - Expand incident, person or SAR timelines only when that context needs
     them.
   - Do not reserve 223px of height across every workspace.

3. Preserve spatial context through operational workflows.
   - Incident selection should focus the site and open a response inspector.
   - A full incident record should be a deliberate deeper step, with the
     selected site state preserved on return.
   - Team, coverage, assets, muster and SAR records need direct locate/focus
     actions into the same map.

4. Recompose the old dashboards as native Command workspaces.
   - Remove nested branding and duplicate page chrome.
   - Reuse one title bar, inspector pattern, metric scale, action hierarchy and
     density system.
   - Do not merely restyle the existing dashboard containers.

5. Use one operational truth model.
   - One current time source.
   - Clear separation between venue coverage, mesh health and gateway health.
   - One incident count definition.
   - System health must acknowledge degraded infrastructure.

6. Finish 2D/3D as an operational map.
   - Real venue geometry or registered floor plans.
   - Legible floors, rooms, doors, exits, anchors, cameras and search sectors.
   - Shared selection, filters, layers and camera state across 2D and 3D.

7. Fix responsive and accessibility fundamentals.
   - Remove the hard 1180px minimum width and 760px minimum height.
   - Replace 6–9px interface text with a readable operational type scale.
   - Keep targets at least tablet-touch friendly.
   - Add visible keyboard focus and do not rely on colour alone for state.

## Recommended sequence

Do not add more features yet.

1. Shell and information architecture.
2. Contextual timeline and command bar.
3. Spatial-to-workspace transitions.
4. Native incident, team and coverage workspace redesigns.
5. Real 2D/3D venue model and layers.
6. Tablet reflow, keyboard and accessibility verification.
7. Only then broaden product scope.

## Evidence limits

This audit used current-run screenshots, DOM structure and the visible layout
implementation. It did not include a screen-reader pass, full keyboard-only
test, production data validation or field testing with security operators.
