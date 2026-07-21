# Anchor deployment rules

*How to place Loc8 Anchors so a venue actually works. Distilled 2026-07-21 from
two independent research passes (ours + the arena dossier, see
`../research/arena-dossier-assessment.md`) that converged on the same physics.
These are planning allowances, not measured Loc8 results — the field test and a
site survey replace them before any contractual coverage commitment.*

---

## The one rule that outranks everything

**Plan spacing on the UPLINK — how far the anchor can *hear* a phone — never on
how far phones can hear the anchor.**

The two directions are not symmetrical. The anchor transmits at the legal
ceiling (20 dBm EIRP) from a good antenna in clear air; a phone transmits at
~0–4 dBm from a pocket, through a body. Bodies are mostly water and absorb
2.4 GHz. Result:

| Link | Packed crowd | Open ground | Clear line of sight |
|---|---|---|---|
| Anchor → phone (downlink) | ~50 m | ~150–200 m | up to ~1 km |
| **Phone → anchor (uplink)** | **~25–30 m** | ~80–100 m | ~300–500 m |
| Anchor ↔ anchor (BLE) | — | ~300–500 m | 1–2 km |
| Anchor ↔ anchor (LoRa) | — | 1–3 km | 5–15 km |

Space anchors on the 50 m downlink number and you build the worst failure mode
this product has: every phone shows "connected", and nobody can be found —
a failure that looks like success until someone needs finding. A friend-finder
must *hear* phones. **Design cell radius: 25–30 m in crowd. Node spacing:
40–60 m with 20–30% overlap.**

Vendor "100 m" range claims are open-air, line-of-sight, downlink, to a good
receiver. Never quote or plan with them for crowd conditions.

## Placement rules

1. **Mount above head height, always.** Elevation removes 15–20 dB of body
   shadowing — worth more than any component in the box. A £35 anchor on a
   4 m pole beats a £75 anchor at waist height. Target 3–5 m, antenna clear.
2. **Plastic enclosures only.** Metal boxes block or detune the antenna. Keep
   the antenna end 30–50 mm clear of screws, cables and the mounting truss.
   Never strap the enclosure flat against steel truss — stand it off.
3. **20–30% overlap between measured usable cells**, so one node failing does
   not open an immediate hole. Anchors are stateless by design; the redundancy
   is the overlap, not the box.
4. **Keep clear of large video walls, dense metal truss clusters, and
   high-power 2.4 GHz access points.** All three either shadow or congest the
   band.
5. **Bends are boundaries.** A concourse corner, a stairwell, a fire-door
   lobby — treat each as a separate zone with its own coverage. Radio does not
   go around concrete corners at useful strength.
6. **Dedicated nodes for backstage, welfare, and service areas.** Do not expect
   the bowl/arena network to penetrate back-of-house walls.
7. **Rigging is the venue's licensed riggers' job.** Tamper-resistant mounts,
   safety bonds, and venue sign-off. We supply the box and the placement plan,
   not the ladder work.

## Power

| Option | When |
|---|---|
| **PoE** (one cable: power + backhaul) | Anywhere structured cabling exists. Preferred — also gives wired backhaul, taking management traffic off 2.4 GHz. |
| **Battery** | Weekend events. Size for event duration + 50% margin; swap-test before doors. |
| **Solar + battery** | Multi-week festival builds, perimeter and car-park nodes. |

## Per-venue counts (planning starting points)

| Venue | Anchors | Where |
|---|---|---|
| Nightclub / small hall | **0** | The Gateway alone bridges the holes. Zero is a valid count — the product works with none. |
| Indoor arena | 4–8 | Bowl perimeter, floor edge, concourses |
| Festival site | 6–12 | Arena↔campsite seam, gates, welfare, car parks, perimeter |
| Stadium | 12–24 | Stand sectors, concourse rings, entrances — professional RF survey first |

## Acceptance criteria (what "deployed" means)

Adopted as our standard; measured on representative iOS **and** Android
handsets, under realistic occupancy, before sign-off:

- **Coverage:** ≥95% of mapped public points detect the correct zone within 5 s.
- **Overlap:** every critical route sees ≥2 viable nodes.
- **Resilience:** loss of any single anchor isolates no welfare area, exit, or
  principal public zone.
- **Privacy:** no stable attendee identifier observable in plaintext over the
  air (requires gate ④ — encryption + rotating pseudonyms — before any public
  pilot).
- **Operations:** a trained operator can identify, isolate and replace a failed
  node.

Do not accept a deployment because one phone received one packet at the
boundary. Do not promise coverage in a contract that a walk-test has not
measured. **We sell measured coverage, not advertised range** — that discipline
is a selling point, not a burden.

## Why the box costs ~£65, not ~£35

The 2026-07-21 cost revision buys, in order of importance: the **nRF21540
front-end (+13 dB receive gain — roughly doubles uplink radius, so ~4× area per
anchor, so *fewer* anchors per venue and a flat-or-lower per-site bill)**; a
properly tuned external antenna and RF-grade PCB (without which the front-end
gain is thrown away); and an IP66 enclosure that survives a festival season
outdoors. Transmit power is *not* on that list — it is capped by law (Ofcom
IR 2030, 20 dBm EIRP, antenna gain counts against the same budget) and more of
it wouldn't fix the uplink anyway. See `../compliance.md` for the regulatory
side, including the no-amplifier trap.
