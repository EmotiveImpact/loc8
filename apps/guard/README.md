# Loc8 Guard

The field-staff door on `@loc8/engine` — an Expo / React Native app for guards,
stewards and medics. Same mesh, same wire format, same haptics as the consumer
app; a different surface for people on shift.

## What it reuses from the engine (everything that matters)

- **Presence**: `meshService` + `crewStore` — position broadcast, freshness/ghost
  states, teammate names over `profile` fragments.
- **Team map**: plotted with `calculateRadarPoint` — the same north-up,
  log-compressed radar math as the consumer radar.
- **Comms**: incident broadcasts + lone-worker escalations ride
  `sendCrewMessage` (fragmented free-text); inbound free-text is Guard's
  **dispatch inbox**. Status replies use the shared `GUARD_STATUS` quickReply
  vocabulary (En route / On scene / Need backup / Clear) — the Guard ↔ Command
  wire contract.
- **SOS**: a first-class `sos` packet (type 7, additive) carrying the raiser's
  position — un-missable by design, `haptics.rallyReceived()` strength.
- **Transports**: `SimulatedTransport` for the design loop,
  `EXPO_PUBLIC_TRANSPORT=ble` for the real mesh via `modules/loc8-mesh`.

## Screens (per docs/design/gallery-guard.html)

Shift / clock-in → tabs **Map · Log · [SOS raised centre] · Team**, plus
event-driven takeovers: **SOS active**, **Dispatch → navigate** (opens when an
order arrives over the mesh), **Lone-worker check-in** (scheduled prompt,
auto-escalates with last known position on silence), **Muster** ("I'M SAFE"
reports to the control room).

Consent model: clocking in IS the consent basis (`identity-privacy-login.md`) —
staff broadcast on shift, and `End shift` stops the session.

## Run

```bash
cd apps/guard
npx expo start            # simulated transport
EXPO_PUBLIC_TRANSPORT=ble npx expo start   # real BLE mesh
npx expo export -p ios    # bundle check
```

Pure logic (lone-worker machine) is tested from the repo root: `npx jest apps/guard`.
