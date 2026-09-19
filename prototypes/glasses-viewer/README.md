# Loc8 Glasses Viewer

An interactive desktop beta of the Guard and Command smart-glasses experience. It covers all 16 agreed product states, uses the shared Loc8 venue and mesh protocol, and provides both deterministic simulation and a live WebSocket bridge boundary.

## Run locally

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/`.

## Verify

```bash
npm test
npm run test:sites
npm run build
```

The shared bridge transport itself is covered by the repository test:

```bash
npx jest packages/engine/src/transport/__tests__/bridgedTransport.test.ts --runInBand
```

## What is real in this beta

- Sixteen interactive Guard and Command states.
- One shared operational model and event vocabulary.
- Venue geometry compiled from `@loc8/engine`.
- 3D site, isolated-floor, and 2D bird's-eye modes.
- Actual Loc8 25-byte mesh protocol through `BridgedTransport`.
- Live bridge URL, dispatch frame generation, reconnect behaviour, and offline local-mesh presentation.
- Voice, role filters, floor and layer controls, scenario actions, event logging, keyboard navigation, and immersive viewing.

## Hardware boundary

This viewer is the hardware-independent product beta. A later Android glasses shell should host the optical surface and connect to the Guard phone using the same Loc8 protocol. The shell should stay separate from Guard until a target glasses model and its display SDK are selected; that avoids making the production phone app depend on an experimental vendor SDK.

## Key files

- `BUILD-PROMPT.md` — complete product and implementation brief.
- `src/data/scenarios.js` — the 16-state product model.
- `src/model/operationalState.js` — shared engine, venue, protocol, and bridge boundary.
- `src/components/Hud.jsx` — Guard and Command HUD states.
- `src/components/VenueScene.jsx` — shared 2D/3D venue renderer.
- `design-qa.md` — visual and functional QA result.
