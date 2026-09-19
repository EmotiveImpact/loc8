# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Loc8 Glasses Viewer decisions

- This prototype is the authoritative browser-based headset simulator for Loc8 Guard and Loc8 Command.
- Preserve the established Loc8 palette: near-black `#06070d`, mint `#46e0a0`, amber `#ffb43a`, incident red `#ff4053`, and information blue `#7aa2ff`.
- The actual glasses viewport is optical and transparent: keep the middle of moving views clear, use black translucent edge surfaces, and expand information only in stationary Command modes.
- Support sixteen named states: connect, calibration, calm patrol, incoming alert, expanded incident, responder dispatch, search and rescue, floating 3D site, isolated 3D floor, 2D bird's-eye, coverage and anchors, person search, evacuation and muster, multi-incident, voice interaction, and degraded/offline.
- Use `@loc8/engine` pure modules for the venue model and bridge protocol. Do not duplicate the Guard/Command wire format.
- The browser viewer must work fully with deterministic simulated data and optionally accept a `ws://` bridge URL for live 25-byte Loc8 mesh frames.
- Guard remains the field computer. The future Android glasses renderer is a companion presentation layer over the same operational protocol.
- Use generated clean scene plates from `public/assets/scenes/`; never bake HUD text into those backgrounds.
