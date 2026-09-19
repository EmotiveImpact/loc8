# Loc8 Command - Product Blueprint

**Status:** Product direction approved; visual system and production architecture still to be completed  
**Updated:** 2026-07-23  
**Owner:** Loc8  
**Purpose:** The canonical product plan for the Command family

The complete no-drop inventory is
[`COMMAND-FEATURE-MANIFEST.md`](COMMAND-FEATURE-MANIFEST.md). This blueprint
defines the product direction; the manifest defines the capabilities a redesign
must preserve.

---

## 1. Product decision

Loc8 Command is its own application family. It is not a large screen inside
the Guard app and it is not the glasses interface stretched onto a desktop.
All Loc8 products share one operational platform, but each surface is designed
for a different job.

| Product | Primary user | Primary environment | Recommended delivery |
|---|---|---|---|
| **Loc8 Command** | Control-room operator, supervisor, security manager | Desktop control room or operations office | React web application |
| **Loc8 Command Desktop** | Dedicated control-room workstation | Installed Windows/macOS application | Same React application packaged with Tauri |
| **Loc8 Command Field** | Mobile incident commander, venue manager | iPad and rugged tablets | Touch-first React Native/Expo application |
| **Loc8 Guard** | Guard, steward, responder | Phone in the field | Existing React Native/Expo application |
| **Loc8 Vision** | Hands-busy guard or commander | Supported smart glasses | Device-specific companion client |
| **Loc8 HQ** | Portfolio or regional management | Browser, off-site | Later web application using the same platform |

Command Web remains the primary implementation. Desktop is a secure installed
container around that product. Command Field is a related application with a
touch-first interface, not a compressed desktop page.

## 2. Product promise

Command gives an authorised operations team one live, honest view of:

- where people and teams are;
- what incidents are active and who is responding;
- which areas have degraded positioning or communications;
- whether everyone is accounted for during a muster;
- what infrastructure is live, degraded or offline;
- what happened, in what order, and who made each decision.

It must remain useful when internet connectivity is poor or absent. The
interface must expose confidence, freshness and degraded state rather than
pretending uncertain data is exact.

## 3. The application model

Command should be organised around operational modes, not a collection of
unrelated dashboard pages.

### Persistent product modes

1. **Live Site** - the complete operating picture.
2. **Investigation** - a focused person, incident or location investigation.
3. **Person Search** - last-known position, search sectors and responder plan.
4. **Search & Rescue** - multi-team, multi-floor or wide-area coordinated search.

These are modes because they change the whole working context: map emphasis,
right-side inspector, timeline, available commands and alert priority. They are
not cosmetic filters.

### Operational workspaces

- **Incidents** - queue, priority, ownership, responders and incident history.
- **Team** - on-shift roster, states, assignments, welfare and communications.
- **Coverage** - gateways, anchors, mesh health, confidence and blind spots.
- **Muster** - muster points, accounted/unconfirmed people and escalation.
- **Assets** - gateways, anchors, cameras, access systems and commissioning.
- **Commissioning** - plan registration, semantic venue model, routing and site
  package publication.

Workspaces preserve the selected site and timeline. Opening one should not
discard the operator's context.

## 4. Core desktop layout

The desktop product uses a stable command-console frame:

1. **Top mode bar** - site identity, four operating modes, essential health and
   clock.
2. **Left workspace rail** - Live Site, Incidents, Team, Coverage, Muster,
   Assets and Commissioning.
3. **Spatial canvas** - dominant 2D/3D site representation.
4. **Mission summary** - current site/mode metrics and highest-priority event.
5. **Context inspector** - detailed incident, person, team, sector or asset.
6. **Activity timeline** - ordered live history with playback and audit context.
7. **Command dock** - natural-language and structured operational actions.

The site remains visible while inspectors and workspaces change. Operators
should not have to repeatedly rebuild their mental map.

## 5. 2D and 3D digital twin

2D and 3D are two views of one semantic venue model, not two separate datasets.

### 2D mode

Best for:

- rapid scanning and dispatch;
- drawing search areas and closures;
- route comparison;
- printed-plan familiarity;
- lower-powered devices;
- poor connectivity or reduced-detail operation.

### 3D mode

Best for:

- understanding floors, height and vertical routes;
- locating people in complex buildings;
- seeing coverage or search state across levels;
- incident briefings and supervisor orientation;
- exploded-floor and cutaway views.

### Required view controls

- 2D bird's-eye;
- 3D orbit;
- exploded floors;
- selected-floor isolation;
- selected incident/person focus;
- reset to operational north;
- layer visibility;
- honest confidence and freshness overlays.

### Site model sources

The renderer must accept interchangeable site sources:

1. Loc8 semantic geometry produced in Map Builder.
2. Registered customer floor plans.
3. BIM/IFC or CAD-derived geometry after conversion.
4. Photogrammetry or scanned models where authorised.
5. External 3D Tiles providers for outdoor context, subject to licensing,
   privacy, offline and cost review.

Google, Cesium, Mapbox or another provider may supply geographic context. They
do not replace Loc8's operational venue model. People, rooms, doors, routes,
zones, anchors and incident state must use stable Loc8 identities.

## 6. Platform architecture

```text
                         optional cloud / HQ
                                |
                         store and forward
                                |
Guard phones <-> mesh <-> Loc8 Gateway <-> venue LAN/WebSocket
                                          |
              +---------------------------+------------------------+
              |                           |                        |
        Command Web                Command Desktop          Command Field
              |                           |                        |
              +---------------- shared operational APIs ----------+
                                          |
                                     Loc8 Vision
```

### Shared packages

- operational TypeScript types;
- venue package and stable IDs;
- API/WebSocket client;
- incident and muster state machines;
- authorisation policy;
- audit event grammar;
- design tokens;
- command vocabulary;
- 2D/3D scene data contract.

### Platform-specific UI

- Desktop: dense mouse/keyboard control, multiple simultaneous panels.
- Tablet: touch targets, gestures, fewer concurrent panels, field workflow.
- Guard: one-handed action and responder state.
- Vision: glanceable, voice-driven and safety-limited.

Shared logic does not mean identical layouts.

## 7. Command Web and Desktop

### Web

- Primary product and fastest deployment path.
- Runs on approved venue browsers.
- Supports managed deployment and rapid updates.
- Can provide an installable PWA as an interim option.

### Installed desktop

Tauri is the preferred packaging candidate, to be validated before commitment.
It can reuse the React application while adding:

- a dedicated application icon and window;
- kiosk/full-screen control-room mode;
- controlled update channel;
- secure local configuration and credentials;
- operating-system notifications;
- local service discovery and Gateway connection;
- file import/export for authorised plans and audit records;
- stronger device-management options.

Electron remains a fallback if required integrations or vendor support make it
materially safer. The container must not fork the product logic.

## 8. Command Field for iPad/tablet

Command Field should be a dedicated React Native/Expo application using the
same operational platform.

### Primary scenarios

- incident commander leaves the control room without losing the live picture;
- draw or reassign search sectors by touch;
- dispatch and reassign responders;
- run a mobile muster;
- inspect site coverage and assets while walking the venue;
- receive critical alerts and acknowledge ownership;
- hand an active view to Command or Vision;
- operate from cached site data when the uplink is interrupted.

### Tablet principles

- landscape-first, portrait-capable for narrower workflows;
- 44-48 px minimum touch targets;
- map-first with one contextual sheet at a time;
- stylus support for zones and annotations where useful;
- offline cache and visible sync/freshness state;
- no desktop hover dependencies;
- no tiny permanent telemetry merely copied from desktop.

### Implementation note

Before tablet implementation, use the exact Expo SDK 57 documentation required
by the repository. Reuse shared TypeScript packages, but design native
components for touch. A WebView may prove the 3D scene during an early spike;
it should not silently become the long-term architecture without performance,
offline, accessibility and device tests.

## 9. Security and operating constraints

- Role-based access for operator, supervisor, commander, commissioner and
  portfolio manager.
- No unbounded "god mode"; every person lookup must have an authorised basis.
- All operational actions create audit events.
- High-risk actions require confirmation or an explicit hold gesture.
- Location confidence and age must be visible.
- Degraded Gateway, anchor, floor or network state must be first-class.
- Site plans and customer geometry require controlled import, storage and
  retention.
- Command must degrade honestly when Gateway, LAN, internet or external map
  context becomes unavailable.

## 10. Delivery plan

### Phase A - approve the visual master

- Produce three image-quality desktop directions from the selected references.
- Select one visual master.
- Define tokens, materials, typography, iconography, density and motion.
- Rebuild one Live Site screen to reference fidelity before expanding.

### Phase B - Command Web foundation

- Turn the prototype modes/workspaces into the real Command information
  architecture.
- Bind to existing operational and venue packages.
- Complete keyboard navigation, responsive behaviour and accessibility.
- Establish realistic incident, team, coverage, muster and asset fixtures.

### Phase C - production digital twin

- Formalise the scene data contract.
- Add 2D/3D parity, level isolation, cutaways and layer performance budgets.
- Add real venue import paths.
- Test on representative integrated and discrete GPUs.

### Phase D - desktop packaging

- Run a Tauri proof of concept.
- Validate Gateway discovery, credential storage, updates, notifications and
  managed-device deployment.
- Preserve browser compatibility.

### Phase E - Command Field

- Produce tablet-specific visual concepts.
- Build the React Native/Expo shell and shared data client.
- Validate tablet 3D strategy on supported iPads and rugged Android tablets.
- Add offline cache, touch search-sector editing and push alerts.

### Phase F - Vision integration

- Consume the Vision product contract.
- Share incidents, people, navigation, alerts and handoff state.
- Keep the glasses UI glanceable; Command remains the high-information surface.

## 11. Acceptance gates

Command is not production-ready until:

- one visual master is approved and coded with measured fidelity;
- every primary workspace supports its main task;
- site state remains consistent across 2D and 3D;
- live updates and reconnect behaviour are tested;
- offline/degraded state is explicit;
- accessibility and keyboard operation pass;
- role and audit behaviour are reviewed;
- desktop packaging is security-reviewed;
- tablet performance is measured on physical devices;
- real-site plans and operational data are tested under authority.

## 12. Current prototype status

The prototype at `prototypes/command-digital-twin/` currently demonstrates:

- all four modes in a persistent top bar;
- 2D, 3D, exploded and focus views;
- live site, investigation, person-search and search-and-rescue scenarios;
- incident, team, coverage, muster and asset workspaces;
- a timeline and command dock;
- synthetic interactive site geometry.

It is a strong information-architecture and interaction prototype. It is not
yet the approved visual master or production application.
