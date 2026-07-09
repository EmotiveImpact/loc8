# Monorepo + Ops Apps — Build Blueprint

Goal: turn Loc8 into a **monorepo of four doors on one shared engine**, then build **Guard** and **Command** alongside the existing **Consumer** app — reusing the mesh, comms (quick replies + free-text), and haptics we already shipped. Never fork the engine.

## Target structure
```
packages/engine     shared, app-agnostic: src/core (packetCodec, geoMath, plusCodes, trustLayer, textFragments, types),
                    src/transport (LocationTransport + SimulatedTransport + BleMeshTransport), src/services (meshService, haptics,
                    notifications), src/state (crewStore) — plus any UI PRIMITIVES that are truly shared (theme tokens).
apps/loc8           the Consumer app (Radar/Compass/Crew/Activity/Rally/Me).
apps/guard          Guard field app.
apps/command        Command console.
modules/loc8-mesh   the native BLE module (shared native, referenced by apps that use real mesh).
```
Tooling: **npm workspaces** (`"workspaces": ["apps/*", "packages/*"]`). Expo monorepo config per https://docs.expo.dev/guides/monorepos/ (metro `watchFolders` + `nodeModulesPaths`, `disableHierarchicalLookup`). Each app imports the engine as `@loc8/engine`.

## Sequencing (STRICT — foundation is a hard prerequisite)
1. **Foundation** (one task, must merge first): create the workspace, extract the engine into `packages/engine`, repoint the Consumer app's imports to `@loc8/engine`, wire Expo monorepo metro config. **Verify the Consumer app is unchanged in behaviour: `tsc` clean, `jest` all green (119), `EXPO_PUBLIC_TRANSPORT=ble npx expo export -p ios` bundles.** Do NOT change any consumer feature. Prefer keeping the consumer runnable throughout.
2. **Guard** and **Command** (parallel, each its own worktree/session) build only AFTER foundation is merged, on top of `@loc8/engine`.

## Engine boundary rules
- Pure logic + mesh + comms + haptics + store → `packages/engine`. If two doors could use it, it belongs here.
- Screens, navigation, branding, app-only widgets → the app's `apps/*` folder.
- The native `modules/loc8-mesh` stays shared; apps that need real BLE reference it.

## Guard app (`apps/guard`) — scope
Design ref: `docs/design/gallery-guard.html` (Team map, SOS active, Dispatch→navigate, Lone-worker check-in, Incident log, Muster, Shift/clock-in). Tactical register (near-black, mono data, green/amber/red) per `docs/design/README.md`.
Reuse from engine: mesh presence, **quick replies reskinned as status responses** ("En route / On scene / Need backup / Clear"), **free-text as team comms/dispatch**, **haptics as SOS/dispatch alerts** (SOS must be un-missable). Raised-centre nav slot = **SOS** (not Rally).

## Command console (`apps/command`) — scope
Design ref: `docs/design/gallery-command.html` (Operations overview, Incident detail, Muster/evacuation board, Roster & shift, Coverage heatmap). Control-room, data-forward. Likely a different surface (web-friendly / large-screen). Reuse engine types + comms; dispatch messages + status flow both ways with Guard. Respect the privacy model (anonymous crowd heatmap, no god-mode — see `identity-privacy-login.md`).

## Status (2026-07-09)
- **Foundation** merged; **Command** (apps/command, Vite/React web) and **Guard**
  (apps/guard, Expo RN) both built on `@loc8/engine`.
- Engine gained (additive): `core/guardStatus` (shared Guard↔Command status
  vocabulary + covert `DURESS_CODE`), `sos` packet type (code 7), and
  `transport/BridgedTransport` (mesh ↔ WebSocket gateway/console modes).
- **Live path works end-to-end in software**: Guard gateway
  (`EXPO_PUBLIC_BRIDGE_URL`) → `tools/mesh-bridge` relay → Command `?bridge=1`
  LIVE mode. Verified: real frames drove positions, an SOS, silent duress, a
  status reply and fragmented team text onto the console. Field test on phones
  is plug-and-play — see `tools/mesh-bridge/README.md` for the wifi-off demo.
- Ops mechanisms shipped: man-down watchdog (auto-raise + auto-dispatch,
  live-mode only) and silent duress (ordinary-looking quickReply frame).

## Non-negotiables (carry into every session)
- Offline-first; mutual-consent only; **one engine, never fork the core**.
- Every session verifies `tsc` (non-test) clean + `jest` green + an `expo export` bundle before handing back.
- This blueprint + `docs/strategy/product-architecture.md` (§Shared-engine capabilities, §Monorepo layout) are the source of truth.
