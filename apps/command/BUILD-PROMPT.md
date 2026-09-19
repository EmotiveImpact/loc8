# Loc8 Command - Supreme Complete Application Build Prompt

Use this prompt when continuing implementation in this thread or handing the
Command build to another engineering agent.

---

Build the complete Loc8 Command application in `apps/command/`.

The primary visual and interaction target is:

- `/Users/augustusedem/.codex/attachments/18901053-21f7-450b-8038-0c928369f9b2/image-1.png`

The existing working 2D/3D interaction baseline is:

- `prototypes/command-digital-twin/`

The production-oriented operational logic and workflows are:

- `apps/command/src/store/commandStore.ts`
- `apps/command/src/dashboards/`
- `apps/command/src/domain/`
- `apps/command/src/services/liveBridge.ts`

The no-drop product contract is:

- `docs/product/COMMAND-FEATURE-MANIFEST.md`
- `docs/product/COMMAND-APPLICATION-MAP.md`
- `docs/product/COMMAND-PRODUCT-BLUEPRINT.md`
- `docs/design/COMMAND-VISUAL-FINISH.md`

## Product outcome

Create one coherent Command application for a security control room, incident
commander or venue operations manager. Do not produce another standalone mockup
or replace the product with a collection of dashboard cards.

The dominant surface must be the live spatial operating picture. Operators must
be able to understand the site, select an incident/person/team/sector/asset,
inspect its detail, act on it, and review what happened without losing their
site context.

## Current implementation state

Continue from the integrated application now present in the worktree; do not
rebuild the old shell or reintroduce a full-screen legacy-app overlay.

- `apps/command/src/App.tsx` owns the real shared Command store, live/simulated
  transport runtime and scene data adapter.
- `prototypes/command-digital-twin/src/App.jsx` remains the approved earlier
  HTML/React interaction and visual foundation. It now receives the real
  Command state/actions and owns the persistent modes, site canvas, contextual
  inspectors, activity timeline and Command dock.
- `apps/command/src/OperationalWorkspace.tsx` renders all eight operational
  workspaces inside the same Command frame.
- `apps/command/src/dashboards/AssetsInfrastructure.tsx` supplies the missing
  infrastructure inventory, degraded-asset diagnosis, coverage scan and Map
  Builder handoff.
- roster reassignment, muster check-in, Search & Rescue team reassignment and
  mark-sector-clear are real audited store mutations.
- 2D and 3D use the same staff, incident, team, selection, layer and floor
  state.
- the current Product Design QA evidence is in
  `apps/command/design-qa.md`; keep it current after visual changes.

The main remaining engineering refinement is bundle code-splitting. Do not
mistake that performance follow-up for permission to simplify, remove or split
the product.

## Required application frame

- Solid matte-black desktop application.
- Loc8 Command identity and active site.
- Four persistent mission modes:
  - Live Site
  - Investigation
  - Person Search
  - Search & Rescue
- Workspace rail:
  - Live Site
  - Incidents
  - Team and Shift
  - Coverage
  - Muster
  - Assets
  - Assisted Search and Audit
  - Commissioning
- Dominant 2D/3D site canvas.
- Context inspector.
- Multi-lane activity timeline.
- Natural-language Command dock.
- Always-visible live/degraded health, incident count, operator and freshness.

## Spatial controls

- 2D bird's-eye.
- 3D orbit.
- Exploded floors.
- Focused floor/object.
- Floors ALL, L3, L2, L1 and G.
- People, routes, coverage, cameras, search and muster layers.
- Clickable people, incidents, teams, floors, sectors and infrastructure.
- Preserve selection, layers and time position when changing views.
- Use one semantic scene contract for 2D and 3D.
- Label synthetic venue geometry honestly until real customer geometry is
  loaded.

## Operational workflows that must work

- Live site summary and incident feed.
- Incident queue and incident command.
- Acknowledge, escalate, dispatch, reassign, message and resolve.
- Guard quick replies and team text.
- Muster call, check-in, outstanding list, assembly point and stand-down.
- Team roster, role, state, zone, freshness, welfare and assignment.
- Coverage, anonymous density, mesh/Gateway/anchor health and degraded assets.
- Consent/reason-gated assisted person search.
- Contact attempts, last-known position, nearest responders and audit export.
- Search sectors, sector progress, team/K9 allocation, live radio, reassign and
  mark area clear.
- Assets, cameras, doors, gateways and anchors.
- Map Builder, plan registration, routing, package simulation and sensor replay.
- Scripted and live transport must remain visibly distinct.

## Visual direction

- Match the supplied reference's proportions and hierarchy.
- Keep the site canvas at roughly 65-75% of the main working area.
- Use contextual panes and restrained dividers, not a grid of equal cards.
- Use near-black surfaces with subtle tonal separation.
- Use the existing Loc8 semantic palette:
  - mint `#46E0A0` for healthy/available;
  - amber `#FFB43A` for caution/degraded;
  - red `#FF4053` for urgent incidents;
  - blue `#7AA2FF` for information, history and selection.
- Keep colour sparse and operational.
- Use Unbounded for key display headings, Sora for UI copy and Space Mono for
  telemetry.
- Use Phosphor icons consistently.
- Keep geometry neutral; use semantic colour for overlays and state.
- No decorative cyberpunk effects, glass-card dashboard treatment or generic
  admin-template styling.

## Implementation rules

- Build in the real `apps/command` product.
- Preserve the earlier HTML/React digital-twin prototype as a reference and
  interaction source.
- Keep one application frame. Never mount `LegacyCommandApp` or any other old
  shell as an overlay, modal application or second navigation system.
- Reuse the existing store, domain actions, privacy model, live bridge and
  commissioning code.
- Every operational mutation must remain permission-aware and auditable.
- Never introduce an unbounded attendee location view.
- Clearly expose source, confidence, freshness and degraded state.
- Keep keyboard and accessible-name support.
- Main navigation, mode controls, view controls, layers, primary actions,
  timeline and Command dock must work.
- Do not silently remove a feature because it is absent from the hero screen.
- Keep Command Web as the source application; package it for desktop later
  without forking the product.

## Verification

- Build `@loc8/command`.
- Run all Command domain/store tests.
- Open the actual app at a `1440 x 1024` viewport.
- Test all four mission modes.
- Test 2D, 3D, exploded and focus.
- Test floor and layer controls.
- Test the timeline and Command dock.
- Open every operational workspace from the spatial console.
- Exercise the primary action in each workspace.
- Check browser console errors.
- Compare the Live Site implementation beside the supplied visual target.
- Keep `apps/command/design-qa.md` current and do not hand off unless it says
  `final result: passed`.

The final result must feel like one complete operational application, not the
old Command app hidden behind a new mockup.
