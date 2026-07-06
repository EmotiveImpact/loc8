# Loc8

Find your crew at a festival when the data's dead — a live Bluetooth-mesh radar
that works with zero signal.

**v1 = simulated prototype.** The full experience (Radar → Compass → Proximity → 🎉,
pings, rally pins, sessions, privacy modes, Plus-Code sharing) runs against a
deterministic `SimulatedTransport`. v2 swaps in a real BLE mesh behind the same
`LocationTransport` interface — no UI changes.

- Spec: `docs/superpowers/specs/2026-07-06-loc8-design.md`
- Plan: `docs/superpowers/plans/2026-07-06-loc8-v1-prototype.md`
- HTML design prototype: `prototype/loc8-prototype.html`

## Run

```bash
npm install
npx expo start        # Expo Go or a dev client
npx jest              # test suite
```

## Demo

Use the 🛠 FAB (dev builds) to run scripted scenarios: friend goes dark,
friend approaches you (ends in the found-each-other celebration), low-battery
beacon mode.
