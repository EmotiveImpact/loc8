# Gate ① — the two-phone field test protocol

*The written protocol for the most important partially-proven thing in Loc8.
**Status 2026-07-21:** Phase 0 was informally passed on iOS — the founder ran
two physical iPhones exchanging real frames over BLE (~2026-07-09). That proves
the radios and the codec on hardware. It does not yet prove the **mesh**:
relay through a third phone (Phase 2), background behaviour (Phase 4), Android,
and measured ranges (Phase 1) remain open — two phones can prove radios; only
three can prove relaying. This document turns the remaining gate from a vibe
into a procedure. Adapted 2026-07-21 from the arena dossier's test plan
(§15–16), rewritten phones-first. Evidence before promises.*

**Prerequisites:** Xcode 26 or an EAS build; 2–3 physical iPhones + at least one
physical Android; `EXPO_PUBLIC_TRANSPORT=ble`. Nothing else. Cost: £0.

---

## Phase 0 — bench (kitchen table)

Two phones, both foregrounded, one metre apart.

1. **Does it run at all?** Native module compiles, loads, requests permissions,
   starts advertising and scanning without crashing. (This alone has never
   happened on hardware.)
2. **Frame integrity:** a 25-byte position frame sent by A decodes identically
   on B — every field: id, lat/lon, heading+floor packing, battery, timestamp,
   accuracy.
3. **Sustained soak:** 30 minutes exchanging pings. Record: crashes, thermal
   warnings, battery drain per hour, memory growth.
4. **Both directions, both platforms:** iPhone→iPhone, iPhone→Android,
   Android→iPhone.

**Kill criteria:** module won't load, frames corrupt, or either OS kills the
app within the soak. Fix before leaving the kitchen.

## Phase 1 — open ground (a park)

Two phones, foregrounded, handheld at chest height, line of sight.

At **10 / 25 / 50 / 75 / 100 / 125 m**, record for 60 s at each distance:

- Time to first detection
- Packets received per minute (sent rate is known)
- RSSI median and spread
- Effect of body blocking: tester turns their back to the far phone
- Effect of pocketing: phone in front jeans pocket, repeat the 60 s

Repeat the far distances with the receiving phone **locked** and
**backgrounded**. This is the first honest look at the iOS background problem.

## Phase 2 — the relay (3+ phones)

The product claim is that frames **hop**. Prove it:

1. A and C placed out of direct range of each other (use Phase 1 data to pick
   the distance). B stands between them.
2. A's ping must reach C **through B**. Verify TTL decremented, dedup honoured
   (B forwards once, never loops).
3. Walk-test: B strolls around the midpoint — does the link degrade gracefully
   or flap?
4. If a 4th phone is available: two-hop chain A→B→C→D.

**This phase is the product.** Phases 0–1 prove radios; this proves the mesh.

## Phase 3 — realistic conditions

Same measurements, hostile environment:

- A busy high street or market (bodies, interference)
- Indoors through one and two walls
- Phones in pockets on moving people
- A pub or venue evening if accessible — dense bodies + competing 2.4 GHz

Expect dramatic degradation from Phase 1 numbers. The point is to *measure* it,
not to like it.

## Phase 4 — the background matrix

The known unsolved risk (iOS throttles background BLE). Fill this table per
platform — each cell: does it advertise? scan? relay? at what packet rate vs
foreground?

| State | iOS adv | iOS scan | iOS relay | Android adv | Android scan | Android relay |
|---|---|---|---|---|---|---|
| Foreground, screen on | | | | | | |
| Backgrounded, screen on | | | | | | |
| Screen locked | | | | | | |
| App killed by OS | | | | | | |

This table decides whether **screen-on relay** must be a product feature (the
strategy assumption) or background relay is partially viable. It cannot be
filled from documentation — Apple's docs describe throttling qualitatively;
the rates must be measured.

## The measurement sheet (record for every run)

| Field | Record |
|---|---|
| Date / place / weather | |
| Phone models + OS versions, both ends | |
| App state (foreground / background / locked) | |
| Distance, heights, orientation, pocket vs hand | |
| Environment (open / bodies / walls / competing RF) | |
| Time to first detection | |
| Packets per minute (received vs sent) | |
| RSSI median | |
| Battery % drain per hour | |
| Anomalies (crashes, thermal, OS kills, weirdness) | |

No run without a filled sheet. An unrecorded test is a rumour.

## Go / no-go gates

**GO** (proceed to bench spike, anchor programme, venue conversations):
- Phase 0 clean on both platforms
- Phase 1: reliable exchange at ≥25 m open ground, foregrounded
- Phase 2: a frame demonstrably relays through a middle phone with TTL/dedup
  correct
- Phase 4 matrix filled — whatever it says

**NO-GO** (stop; the architecture pivots toward anchors-as-backbone):
- The module cannot run sustained on hardware, or
- Relay fails even foregrounded at close range, or
- Background behaviour is so hostile that even screen-on relay is unworkable

A NO-GO is not the death of Loc8 — it converts the anchor layer from amplifier
to backbone and makes the fixed-hardware kit the product. Knowing which company
we are is the entire point of spending an afternoon in a park.

## After the test

Per the standing rule (`docs/research/README.md`): the filled measurement
sheets get committed into `docs/research/field-test-<date>/` the same day,
raw, before any interpretation is written. The CHANGELOG "current state" line
gets updated to say what was actually proven — it has been wrong about this
once already and is not allowed to be wrong twice.
