# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

Durable design decision (2026-07-23): the prototype is the approved interaction
and information-architecture baseline, but not the approved visual master. The
next visual pass must pursue a solid matte control-room finish grounded in the
strongest reference images. Create/select one image-quality Live Site master,
then measure and implement it before polishing every workspace. Keep the
original Loc8 operational palette; reserve mint/amber/red/blue for semantic
state and keep 3D site geometry neutral.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.
