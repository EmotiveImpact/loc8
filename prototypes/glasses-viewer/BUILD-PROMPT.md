# Loc8 Glasses Viewer — autonomous build prompt

Build and verify the complete Loc8 smart-glasses beta as a locally runnable browser simulator.

## Outcome

Create a realistic, interactive viewer that lets product testers experience the Guard and Command glasses software before physical hardware is selected. It must reuse Loc8's existing operational concepts and shared engine boundary rather than inventing a disconnected demo.

## Required product states

Implement all sixteen states:

1. Connect glasses and start shift
2. Display alignment, brightness, and calibration
3. Calm walking HUD
4. Incoming incident alert
5. Expanded incident workspace
6. Full responder-dispatch view
7. Search-and-rescue operational view
8. Floating 3D venue overview
9. Individual floor isolated in 3D
10. 2D bird's-eye venue/floor view
11. Coverage and anchor layer
12. Person-search trail and predicted area
13. Evacuation and muster overview
14. Multi-incident Command view
15. Voice listening, confirmation, and misunderstood-command states
16. Degraded/offline and reconnection mode

## Interaction requirements

- Scenario navigation and previous/next controls
- Guard/Command role switch
- Immersive full-view mode
- Working primary and supporting actions with visible feedback
- Deterministic incident simulation
- Voice state simulation: idle, listening, understood, confirming, failed
- Connectivity simulation: live, degraded, offline, reconnecting
- 2D/3D and floor switching that preserves the active incident/person
- Interactive 3D venue generated from the shared synthetic venue package
- Optional live bridge connection using Loc8's `BridgedTransport`
- Activity log showing simulated or live packets

## Visual requirements

- Match the approved Loc8 HUD concepts.
- Use the original Loc8 colors and type character.
- Keep moving views glanceable and stationary views information-rich.
- Use real-world clean scene plates behind app-owned HUD elements.
- Avoid dashboard card grids, nested cards, sci-fi neon, and opaque full-screen interfaces.
- Use Phosphor icons; do not use emoji or handcrafted SVG icon substitutes.

## Architecture

- Browser viewer: React + Vite
- 3D site: React Three Fiber / Three.js
- Product state: Zustand
- Shared venue and wire protocol: `@loc8/engine`
- Scene plates: `public/assets/scenes`
- Future hardware renderer: native Android Projected Activity / Glimmer companion consuming the same Loc8 operational protocol

## Verification gates

- Unit tests prove all sixteen scenarios exist and have valid roles, scenes, density, actions, and voice commands.
- Production build succeeds.
- Sites packaging tests succeed.
- Browser verification covers scenario navigation, actions, role switching, connection states, 2D/3D, and console errors.
- `design-qa.md` compares the implementation to the approved visual references and ends with `final result: passed`.
