# Loc8

## Experimental BLE density intake: 3 October 2026

Start with the [native branch-forwarding handoff](docs/research/rnd/results/2026-10-03-branch-relay.md)
and [source-backed intake](docs/research/rnd/intake/2026-10-03-ble/README.md).
The experimental branch includes an opt-in native repair: one existing jittered
send preserves outgoing branches and skips only links that supplied the exact
same frame. Set `EXPO_PUBLIC_MESH_RELAY_MODE=branch` in a rebuilt native development
client; native status reports the actual mode. The default remains `current`.
The 25-byte payload and native frame format remain unchanged.

The [original Trickle retry result](docs/research/rnd/results/2026-10-03-ble-density.md)
remains HOLD: it failed its registered dense send-cost gate. New branch-forwarding
evidence is separate. No upstream implementation code was imported. Native
compilation and deterministic simulation are distinct from physical phone evidence;
gateway/periodic-advertising hardware plans remain untested. Main is not merged.

```sh
node --test tools/mesh-rnd/branch-*.node.cjs tools/mesh-rnd/native-relay-api.node.cjs
node tools/mesh-rnd/verify-branch-integration.cjs --rerun
```

Start with [the unified system map and build programme](LOC8_MASTER_PLAN.md).
The next GPS-source increment extends PR #4; it does not merge or deploy it.
Read its [source-provenance decision](docs/research/rnd/decisions/2026-09-25-source-location-v1.md)
and [implementation receipt](docs/research/rnd/results/2026-09-25-source-location.md).

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
