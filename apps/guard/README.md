# Loc8 Guard (`apps/guard`)

The **field team** door of Loc8 — a tactical, offline-first app for security /
event staff, built entirely on the shared **`@loc8/engine`** (mesh, comms,
haptics, crew store, geo). It never forks the engine; ops-specific behaviour is
added *additively* to the engine or lives here in the app.

## Screens

| Screen | Route | Engine reuse |
| --- | --- | --- |
| **Shift / clock-in** | `app/clockin.tsx` | crewStore profile; gate before the tabs |
| **Team map** (home) | `app/(tabs)/index.tsx` | live positions via `geoMath` bearing/distance; rally pin = incident marker |
| **SOS active** | `app/sos.tsx` | `meshService.dropRally()` broadcasts your position; `haptics.sos()` |
| **Dispatch → navigate** | `app/dispatch.tsx` | `geoMath` arrow + distance; **status responses** via `sendQuickReply()` |
| **Incident log** | `app/(tabs)/incidents.tsx` | logs + `sendCrewMessage()` team alert |
| **Muster / evacuation** | `app/(tabs)/muster.tsx` | `sendCrewMessage()` broadcast; live safe count |
| **Lone-worker check-in** | `app/lone.tsx` | timed prompt; silence auto-escalates to SOS |

Bottom nav (5 slots): **Map · Incidents · [ SOS ] · Muster · Shift** — the
raised centre slot is **SOS** (the Guard analogue of the consumer's Rally).

## Additive engine changes (shared, not forked)

- `STATUS_REPLIES` (`En route / On scene / Need backup / Clear`) — ops-reskinned
  quick-reply codes (20–23), resolved by the same `quickReplyLabel()`.
- `haptics.sos()` — an un-missable, long, multi-cluster burst; `haptics.dispatch()`
  — a firm triple knock for incoming dispatch.

## Run

```bash
# from apps/guard (monorepo deps are hoisted to the repo root)
npx expo start          # sim transport (design loop) by default
EXPO_PUBLIC_TRANSPORT=ble npx expo run:ios   # real BLE mesh
npx expo export -p ios  # verify it bundles
```
