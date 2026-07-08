# Loc8 Command

The control-room console for Loc8 Ops — the fourth "door" on the shared
`@loc8/engine`. Supervisors watch team status, drive incidents, run muster, and
monitor coverage, **all over the offline mesh** and **without a god-mode map**.

> One engine, four doors. Command is app-specific *surface* only — every byte of
> comms, every packet type, and the design tokens come from `@loc8/engine`.

## Surface choice — a web app (Vite + React + TypeScript)

Command is **control-room / large-screen / data-forward**, so it is a plain web
app rather than an Expo/React-Native target:

- **Why web:** dense tables, multi-panel dashboards, and a mouse-driven ops
  surface are what a control room actually uses (`docs/strategy/*` call Command a
  "web / tablet dashboard"). React on the web is the natural fit.
- **Why it still reuses the engine:** the engine's core is pure, RN-free
  TypeScript. Command imports **only** those modules — types, the 25-byte wire
  codec, text fragmentation, quick replies, geo math, and the design tokens —
  via subpath imports (`@loc8/engine/core/*`, `@loc8/engine/ui/theme`). It
  **never** imports the barrel `@loc8/engine`, which pulls in `react-native`
  through the mesh service. See [`src/engine.ts`](src/engine.ts) — the single,
  documented seam into the shared engine.

Because Command speaks the **same wire format** as Guard, dispatch orders and
status responses flow both ways with no translation layer (see
[`src/domain/dispatch.ts`](src/domain/dispatch.ts) and its tests).

## Dashboards

| Dashboard | State | Notes |
|---|---|---|
| **Operations overview** | full | tiles, live feed, tactical map, roster, call-muster |
| **Incident detail** | full | SOS banner + live elapsed, timeline, dispatch paths, responders, acknowledge / escalate / dispatch |
| **Muster / evacuation** | full | live headcount, staff grid (tap to check in), assembly + outstanding map |
| **Roster & shift** | table + coverage live; assign/reassign **stubbed** | |
| **Coverage heatmap** | full (privacy showcase) | anonymised density blobs + legend + shield note |
| **Assisted search & audit** | full | the enforced, logged alternative to a god-mode map |

## Privacy model (enforced, not just promised)

Per `docs/strategy/identity-privacy-login.md`:

- **No browsable map of individuals.** There is deliberately no data structure
  holding attendee identities/locations. The crowd exists ONLY as anonymous
  per-zone counts (`ZoneDensity`). See [`src/domain/types.ts`](src/domain/types.ts).
- **Consent by construction.** An individual is representable only with a
  `ConsentBasis` (on-duty staff / SOS / opt-in medical / family crew). There is
  no `silent`/`god_mode` member — non-consensual reveal is unrepresentable.
- **Assisted search is narrow, reason-gated and audited.**
  [`src/domain/privacy.ts`](src/domain/privacy.ts) refuses to run without an
  operator id and a reason, searches only the consent-carrying pool, and emits
  an audit entry for **every** attempt (even zero-match ones).
- **Everything is logged.** Dispatch, acknowledge, escalate, muster and search
  all append to an append-only audit trail, visible in the console.

## Develop / build

```bash
npm run dev      # vite dev server (port 5182)
npm run build    # tsc --noEmit && vite build → dist/
npm run typecheck
```

Tests live under `src/domain/__tests__` and run from the repo root with the
shared jest config: `npx jest apps/command`.
