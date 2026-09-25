# Loc8

## Position-report freshness increment: 25 September 2026

The next shared-engine increment is integrated into Consumer radar/crew/compass,
Guard TeamMap and Command operations/roster. It separates report time from local
receipt, labels unverified age, preserves delayed demo provenance and prevents
stale reports from automatically claiming a reunion. Main is not changed by
this review branch.

Read the [R1a implementation and limits](docs/research/rnd/results/2026-09-25-position-freshness.md).
The legacy sender currently publishes cached coordinates with publication time;
true GPS-sample freshness and live clock verification remain explicit follow-up
gates, not claims made by this patch.

```sh
node --test tools/mesh-rnd/freshness.node.cjs
```

## Current R&D handover: 25 September 2026

Loc8, Loc8 Guard and Loc8 Command share `@loc8/engine`. The native iPhone
implementation already uses BLE advertising for discovery and GATT links for
mesh data; the 25-byte application packet is not the entire native radio frame.
Some older prototype notes and the July AI briefing describe earlier intent.

Start with [BLE research to development](docs/research/rnd/BLE-RND-2026-09-25.md)
and the [implementation receipt](docs/research/rnd/results/2026-09-25-mesh-hardening.md).
The first increment hardens shared ingress, fragment assembly and BLE lifecycle
handling. It does not establish physical mesh performance or production readiness.

Run the additional focused checks after installing repository dependencies:

```bash
node --test tools/mesh-rnd/verify.node.cjs
```

## Original prototype introduction (historical)

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
