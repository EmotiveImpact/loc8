# Hardware build guide — parts, assembly, and what to buy when

*Everything needed to build a Loc8 Anchor and a Loc8 Gateway, in order, with
real part numbers and prices. Drafted 2026-07-21.*

> ## ⚠️ READ THIS BEFORE SPENDING ANYTHING
>
> **Nothing in this guide is on the critical path to revenue.** The market
> research's single largest finding is that Guard + Command sell over a venue's
> wifi today, with no hardware at all (`../BUSINESS.md`). Hardware comes after
> a paying customer, not before.
>
> **The only spend justified today is Stage 1 — the £230 bench spike**, and
> only because it de-risks a decision (which radio module) that is expensive to
> get wrong later.
>
> **Do not design a custom PCB** until a six-node pilot has proved the product
> experience. Hardware miniaturisation before that point optimises the wrong
> architecture.

---

## The decision that comes before all the others

**Build the Anchor around a pre-certified radio module — decide this first.**

Under FCC 47 CFR §15.212 (and the equivalent EU/UKCA route), a product using a
**modular-approved** radio inherits that module's certification grant. Use a
bare chip instead and you own the entire radio certification yourself.

For a company renting ~£65 boxes, the research called this *"the difference
between a viable hardware line and one whose certification cost exceeds its
first two years of hardware revenue."*

Candidate modules — verify current pricing and stock before ordering:

| Module | Radio | Why |
|---|---|---|
| **Fanstel BT840F / BT840X** | nRF52840 + FEM | Pre-certified FCC/CE/UKCA, integrated front-end, external antenna option |
| **Raytac MDBT50Q-1MV2** | nRF52840 | Widely used, well documented, certified, cheap |
| **Ebyte E73-2G4M08S1C** | nRF52840 | Low cost, certified, good availability |
| **Seeed Wio-SX1262** or **Ebyte E22-900M** | LoRa (868/915) | For the trunk — pick 868 MHz for UK/EU, 915 MHz for US |

**Do not** bolt an external amplifier or high-gain antenna onto a certified
module — it voids the certification basis and changes your EIRP (`../compliance.md`).

---

## Stage 1 — the bench spike (£230, do this one)

**Purpose:** prove the relay works between fixed nodes and measure real receive
range, before designing anything.

### Parts

| Item | Qty | Unit | Total | Notes |
|---|---|---|---|---|
| Nordic **nRF21540-DK** development kit | 3 | ~£76 | **£228** | Contains nRF52840 + nRF21540 front end + antennas. Farnell 3798632 (~£63.64 ex VAT) |
| Micro-USB **data** cable | 3 | ~£5 | £15 | Not supplied with the kit; must be data-capable, not charge-only |
| 5V USB supply | 3 | ~£8 | £24 | Any reputable phone charger |
| **Total** | | | **~£267** | |

Buy three, not two — two boards prove a link; **three prove a relay**, which is
the thing in question.

### Bench procedure

1. **Flash the stock beacon sample first.** Nordic nRF Connect SDK in VS Code →
   new application → copy sample → `zephyr/samples/bluetooth/ibeacon` → board
   target `nrf21540dk/nrf52840` → build → flash. Confirm all three enumerate and
   advertise before writing any Loc8 code.
   ```
   west build -b nrf21540dk/nrf52840 zephyr/samples/bluetooth/ibeacon
   west flash
   ```
2. **Set gain conservatively.** `CONFIG_MPSL_FEM_NRF21540_TX_GAIN_DB=10` — start
   at the documented default, not maximum. Remember EIRP = TX power **+ antenna
   gain**, and the UK ceiling is 20 dBm.
3. **Measure receive range with a phone**, which is the direction that matters
   (`anchor-deployment.md`): board on a pole at 3 m, phone in a pocket, walk
   away, record where reception fails. Do it in open ground *and* through a
   crowd of people if you can borrow some.
4. **Prove the two-hop relay**: node A and node C out of range of each other,
   node B between them. A's frame must reach C.
5. **Record everything** on the measurement sheet in
   `../testing/field-test-protocol.md`.

### The go/no-go

Proceed to Stage 2 only if the relay works and receive range at pocket height
is ≥20 m in open ground. If it isn't, the anchor thesis needs rethinking before
any money goes into enclosures.

---

## Stage 2 — a field-usable Anchor (~£65–90 each, only after a signed pilot)

### Parts per unit

| Item | Approx | Notes |
|---|---|---|
| Pre-certified nRF52840 module (see table above) | £6–10 | The certification decision |
| nRF21540 front-end (if not integrated) | £3–5 | Bought for the **receive** gain, not transmit |
| LoRa module — 868 MHz UK/EU | £5–8 | Only on anchors doing trunk duty |
| Tuned external antenna, 2.4 GHz | £4–8 | Modest gain — high gain breaks your EIRP budget |
| LoRa antenna, 868 MHz | £3–5 | Trunk anchors only |
| **IP66 enclosure**, plastic (never metal) | £8–15 | Plastic is mandatory — metal blocks the antenna |
| PoE splitter *or* PD chip | £6–20 | RobotShop industrial splitter ~£22 inc VAT |
| Nylon standoffs, cable gland, fixings | £4–8 | Gland must match cable diameter |
| Mounting plate + safety bond | £8–15 | Venue rigging practice applies |
| **Per unit** | **~£47–94** | Call it **£65–75** at modest volume |

### Assembly

1. **Bench-test the board before it goes anywhere near the enclosure.** Confirm
   flashing, advertising and relay on a non-conductive surface.
2. **Choose the antenna path deliberately.** Use the module's certified antenna
   option. If you attach an external antenna, its gain counts toward your 20 dBm
   EIRP and you must re-check compliance.
3. **Mount on nylon standoffs.** No board contact with conductive surfaces.
   Keep the antenna end **30–50 mm clear** of screws, cable bundles, metal
   fixings and the mounting plate.
4. **Cable gland for the power/PoE entry**, sized to the cable. This is the
   ingress path that fails first in rain.
5. **Label every node**: node ID, zone, MAC/device ID, firmware version, power
   requirement, engineering contact. You will thank yourself at 2am.
6. **Re-measure receive performance after closing the enclosure.** A large drop
   means the antenna is detuned or shielded by the box — fix it now, not at a
   venue.
7. **Mount above head height** (3–5 m). This is worth more than any component in
   the box: it removes 15–20 dB of body shadowing.

### Also worth prototyping — the body-worn Anchor

The research's item #6: a **200–300 g shoulder-worn anchor on a steward**,
powered by a USB-C powerbank, gives you a mobile elevated anchor at head height
with zero deployment cost, no mast, no CAA, no ground penetration — and
stewards are distributed exactly where the crowd is. Same electronics, softer
enclosure, no PoE. Strictly better than any airborne option, and buildable from
Stage 1 parts.

---

## Stage 3 — the Gateway (~£75–195, after Loc8OS exists)

Full spec, BOM tiers and power design: **[loc8-gateway.md](loc8-gateway.md)**.
Appliance software: **[../software/loc8os.md](../software/loc8os.md)**.

| Tier | Contents | Approx |
|---|---|---|
| **A — demo** | Pi 4 2GB, microSD, USB PSU, plastic case | ~£32 |
| **B — standard** | Pi 4 2GB, **industrial pSLC microSD**, PoE+ HAT, IP54 case, wall bracket | **~£75–90** |
| **C — ruggedised** | CM4 + eMMC, LFP battery + PMIC, dual BLE, tamper switch, IP66, optional LoRa concentrator + LTE | ~£145–195 |

**Two non-obvious requirements that will bite:**

- **Storage is a durability line item, not a nicety.** `synchronous=FULL` issues
  a cache-flush that a *consumer* microSD may simply ignore — meaning the
  durability guarantee buys nothing on the wrong card. Industrial pSLC or eMMC,
  always. See `loc8-gateway.md` §9 and the WAL callout.
- **`journal_mode=WAL` is mandatory**, not a tuning choice. The audit-write
  guarantee only holds in WAL mode.

### Vehicle-mounted Gateway variant

Genuinely viable — sell it on **height**, not mobility (a roof mount puts the
antenna at ~2 m on an excellent metal ground plane). Three requirements, in
order of how badly they bite:

1. **Engine-off drain.** 25 W on a 60 Ah battery is ~14 h to the safe 50%
   state-of-charge limit. Fit a low-voltage disconnect at ~11.8 V, or better an
   isolated ~100 Wh LiFePO4 pack charged only when the alternator runs. *Strand
   a customer's security van at 3am and the relationship is over.*
2. **Thermal.** Sealed box + solar gain + ~25 W internal; a Pi throttles at
   ~80–85 °C. Finned aluminium with a thermal pad to the case wall. *A sealed
   ABS box throttles on the first sunny day of the first festival.*
3. **12 V is not 12 V.** 9–36 V wide input with ISO 7637-2 transient
   suppression. Not a cigarette-lighter adapter.

---

## What NOT to build — settled by research, don't revisit

| Idea | Verdict |
|---|---|
| **Drone-mounted anchor** | **Dead on collision physics.** Altitude multiplies the footprint ~13.9× and flattens the near-far ratio from 28.1 dB to 3.5 dB, destroying the *capture effect* that makes BLE work in a crowd. At 10,000 devices in footprint: 0.14% packet success — each phone heard once per 12 minutes. Geometric, unfixable, and the airborne node's own transmissions degrade the working ground mesh. Full analysis: market report §6.2. |
| **Tethered drone** | A 9 m mast beats it on every axis: 30 kg payload, no aviation regulator, no pilot, no weather abort, and when it fails it stops working rather than falling into a crowd. |
| **Robot/quadruped mounted** | ~90 min runtime, dedicated operator, costs multiples of a mast, and puts a very expensive asset in a crowd of drunk people. A steward with a 300 g shoulder anchor does it better all shift. |
| **Any external amplifier for more range** | Illegal above 20 dBm EIRP, voids module certification, and doesn't fix the uplink — which is the binding constraint. |

**The design principle worth internalising:** Loc8's mesh works *because* radio
range is short and crowds are lossy. Density and attenuation are not obstacles
the product overcomes — they are the mechanism that makes it function. **Every
instinct to "improve" Loc8 by making a node hear further is an instinct to
break it.** Be suspicious of anyone, including yourself, who proposes more
range.

---

## Order of spend, one line

**£0 (sell over wifi) → £230 (bench spike) → signed pilot → £65×N anchors →
Gateway → custom PCB.** Never skip a step leftward.
