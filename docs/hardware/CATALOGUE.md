# Hardware catalogue — every device, what's inside, what it costs, how it updates

*The complete list. Drafted 2026-07-21. Model numbers marked **CANDIDATE** are
not yet chosen — the module decision (see `build-guide.md`) must be made before
any PCB work. Nothing here has been built: status marks are honest.*

---

## Everything at a glance

| # | Device | Whose hardware | Per site | Cost to us | Firmware we write | Status |
|---|---|---|---|---|---|---|
| 1 | Consumer / Guard phone | **Theirs** | thousands | £0 | App ✅ + native BLE module | 🟡 2-iPhone exchange proven |
| 2 | Command computer | **Venue's** | 1–2 | £0 | Web app ✅ | ✅ built |
| 3 | **Anchor — Plain** | ours | 0–dozens | ~£65 | Anchor firmware | 🔴 not built |
| 4 | **Anchor — Trunk** (+LoRa) | ours | 2–8 | ~£75 | Same + LoRa stack | 🔴 not built |
| 5 | **Anchor — Body-worn** | ours | 10–40 | ~£60 | Same firmware | 🔴 not built |
| 6 | **Gateway — Tier A** (demo) | ours | 1 | ~£32 | Loc8OS | 🟡 specced |
| 7 | **Gateway — Tier B** (standard) | ours | 1 | ~£85 | Loc8OS | 🟡 specced |
| 8 | **Gateway — Tier C** (rugged) | ours | 1 | ~£170 | Loc8OS | 🟡 specced |
| 9 | **Gateway — Vehicle** | ours | 1 | ~£200 | Loc8OS + power mgmt | 🔴 concept |
| 10 | Dev kits (internal tool) | ours | — | £76 ea | — | buy 3 |

---

# 1–2. The devices we don't make

**Phones (Consumer + Guard).** Any modern iPhone or Android. Users and venues
own them. We supply software only. This is why Loc8 can exist as a bootstrapped
company — your network hardware is bought by your users.

**Command computer.** Any laptop or desktop on the venue's network. **Needs no
Bluetooth** — the Gateway is its radio. Runs in a browser.

---

# The Anchor family

All three share **one circuit board and one firmware**. They differ in what's
fitted and what they're bolted to. That is deliberate: one design to certify,
one firmware to maintain.

## 3. Anchor — Plain

**Looks like:** a paperback-sized matte plastic box, IP66-rated, with a short
external antenna. Pole or truss mounted, 3–5 m up, above head height. No lights
visible to the public; a single status LED behind a diffuser for technicians.

**Inside:**

| Part | Candidate model | Purpose |
|---|---|---|
| Radio module | **CANDIDATE:** Fanstel BT840X · Raytac MDBT50Q-1MV2 · Ebyte E73-2G4M08S1C | nRF52840 — the Bluetooth brain. Must be a **pre-certified module** |
| Front-end amplifier | Nordic **nRF21540** (or integrated in the module) | +13 dB receive gain — this is the *listening* upgrade, ~4× area covered |
| Antenna | 2.4 GHz external, modest gain | High gain would break the 20 dBm EIRP budget |
| Power | PoE splitter, **CANDIDATE:** RobotShop industrial 48 V→5 V · or on-board PD chip | One cable = power + backhaul |
| Enclosure | IP66 ABS/polycarbonate, **never metal** | Metal blocks the antenna |
| Mounting | Plate + safety bond | Venue rigging practice applies |

**Cost:** ~£47–94, call it **£65** at modest volume.
**Does:** listens for phones (25–30 m in a crowd), repeats what it hears.
**If it dies:** coverage shrinks. Nothing is lost — it holds no state.

## 4. Anchor — Trunk (BLE + LoRa)

Identical to the Plain anchor **plus two parts**:

| Part | Candidate model | Purpose |
|---|---|---|
| LoRa module | **CANDIDATE:** Ebyte E22-900M · Seeed Wio-SX1262 (Semtech SX1262) | 868 MHz UK/EU · 915 MHz US. The long jump |
| LoRa antenna | 868 MHz whip | Separate from the Bluetooth antenna |

**Adds ~£8–13.** Same box, same firmware — one extra part fitted.

**Does:** everything the Plain anchor does, **plus** translates messages onto
LoRa and throws them **1–3 km** to other trunk anchors. Phones never know LoRa
exists — they cannot hear it (different frequency *and* different modulation).

**Where they go:** the seams — arena edge, campsite, car park, main gate.
Typically **2–8 per site**, with Plain anchors filling between.

> ⚠️ **UK duty cycle: ~1%.** LoRa is a thin pipe. Positions and alerts, never
> chat. Don't route everything over it.

> ⚠️ **Unresolved design decision:** when a message crosses LoRa and is
> re-broadcast, does its hop count reset or continue? Recommendation is that
> the LoRa link is a *backbone, not a hop* — anchors re-broadcast with a fresh
> budget, with dedup on the LoRa side to prevent loops. **Decide before writing
> anchor firmware.**

## 5. Anchor — Body-worn

**Looks like:** a soft pouch on a steward's shoulder strap or high-vis, roughly
cigarette-packet sized, 200–300 g including a USB-C powerbank.

**Inside:** the same board as the Plain anchor, minus PoE, plus a battery
connector. No LoRa.

**Cost:** ~£60 including a powerbank.

**Why it's good** — this was the strongest form-factor finding in the research:

- Stewards are already distributed exactly where the crowd is; that's what
  stewarding *is*
- They move toward incidents by definition, so coverage follows the trouble
- Shoulder height (~1.5 m) clears the worst body-blocking, but stays low enough
  to preserve the *capture effect* that makes the mesh work
- **No poles, no rigging, no ground penetration, no aviation licence.** Clip on
  at shift start
- 40 stewards = 40 mobile elevated anchors at near-zero deployment cost

**Rated better than any mast or drone option.** Build one from the bench-spike
parts.

---

# The Gateway family

**Exactly one per site.** It is the brain, not a big anchor: it holds the site
database, the tamper-evident audit chain, the PKI, and feeds Command.

**Looks like:** ~120 × 90 × 35 mm, matte near-black, chamfered edges,
wall-mounted in a comms cupboard or control room. Deliberately reads as
professional infrastructure — kin to a UniFi access point.

## 6–8. The three tiers

| | **Tier A — Demo** | **Tier B — Standard** | **Tier C — Ruggedised** |
|---|---|---|---|
| **Compute** | Raspberry Pi 4 Model B, 2 GB | Pi 4 Model B, 2 GB | **Compute Module 4** + carrier |
| **Storage** | Consumer microSD | **Industrial pSLC microSD** | **Soldered eMMC** — no card to corrupt |
| **Power** | USB-C PSU | **Pi PoE+ HAT** | PoE+ **plus LFP battery + PMIC** |
| **Radios** | On-board BLE | On-board BLE | **Dual BLE** + LoRa concentrator option |
| **Enclosure** | Plastic, indoor | IP54 + wall bracket | **IP66**, tamper switch |
| **Add-ons** | — | LTE dongle · LoRa | LTE · LoRa · external antennas |
| **Cost** | **~£32** | **~£75–90** | **~£145–195** |
| **Use** | Sales demo, bench | **The pilot config** | Festival, marine, industrial |

**Two non-obvious requirements that will bite:**

1. **Storage is a durability line item.** `synchronous=FULL` issues a
   cache-flush a *consumer* microSD may simply ignore — the durability
   guarantee buys nothing on the wrong card. Industrial pSLC or eMMC, always.
2. **`journal_mode=WAL` is mandatory**, not tuning. The audit-write guarantee
   only holds in WAL mode. See `loc8-gateway.md` §9.

## 9. Gateway — Vehicle variant

**Sell it on height, not mobility.** A roof mount puts the antenna at ~2 m on an
excellent metal ground plane, clearing the body-attenuation layer. Security and
event teams already have vehicles on site with 12 V and roof bars.

Tier C internals plus three requirements, in order of how badly they bite:

1. **Engine-off drain.** 25 W on a 60 Ah battery = ~14 h to the safe 50%
   state-of-charge limit. Fit a low-voltage disconnect at ~11.8 V, or better an
   isolated ~100 Wh LiFePO4 pack charged only when the alternator runs.
   *Strand a customer's security van at 3am and the relationship is over.*
2. **Thermal.** Sealed box + solar gain + ~25 W internal; a Pi throttles at
   ~80–85 °C. Finned aluminium with a thermal pad to the case wall.
3. **12 V is not 12 V.** 9–36 V wide input with ISO 7637-2 transient
   suppression. Not a cigarette-lighter adapter.

---

# 10. Dev kits — internal tools, never sold

**Nordic nRF21540-DK**, ~£76 each (Farnell 3798632, ~£63.64 ex VAT). Contains
the same nRF52840 + nRF21540 an anchor would use, on a bare board with
debugger and antennas.

**Buy three, ~£230.** Two boards prove a *link*; **three prove a relay** — and
the relay is the entire question. This is R&D equipment, like a chef buying
test ingredients. Never confuse £76 with what an anchor costs to make; the
chips inside are a few pounds.

---

# Firmware and updates

## Anchor firmware — 🔴 not written

**What it does:** listen, dedup, decrement hop count, re-broadcast. On trunk
anchors, translate BLE↔LoRa. Publish a health heartbeat. Nothing else — the
anchor is deliberately stateless, which is what makes it cheap and disposable.

**How it gets updated:**

| Method | When | How |
|---|---|---|
| **Over-the-air via Gateway** | Normal | Gateway pushes a signed image to anchors over BLE. Primary path. |
| **Technician phone** | Anchor out of Gateway range | Same signed image, from a phone at the pole |
| **USB / serial** | Factory and bench | Direct flash |

**The mechanism: Nordic Secure DFU, dual-bank.** The new image is written to
the *second* bank while the running one keeps working; the signature is
verified; only then does it swap. **If anything fails, it boots the old image.**
An anchor cannot be bricked by a bad update or a mid-update power loss.

Signed with our key — an anchor must refuse an unsigned image, or anyone with a
Bluetooth radio owns your fleet.

## Gateway firmware — Loc8OS — 🟡 specced, not built

**A/B slots, signed images, automatic rollback.** Full spec:
`../software/loc8os.md` §6.

The update writes the *idle* slot, verifies the signature, flips the boot
metadata, reboots. **The first boot must confirm health within a deadline or a
watchdog flips it straight back.** Two complete copies of the system exist at
all times.

Three rules that matter:

- **Never update on battery.** Hard interlock on the mains-present GPIO. The
  danger isn't the slot write (A/B absorbs a corrupt idle slot) — it's the
  metadata commit and the unconfirmed first boot, where the rollback itself
  needs charge for a second reboot.
- **USB-stick path for offline sites.** Same signed image, same verification,
  from the USB-A port. Some venues will never give you internet.
- **No shell access in production.** Serial header on the board for factory and
  bench only. The appliance contract: no visible Linux.

## Phone apps

Ordinary App Store / Play Store updates. The native BLE module ships inside the
app — no separate firmware.

---

# What is actually proven

Be blunt with anyone who asks:

| | Status |
|---|---|
| Two iPhones exchanging real frames over BLE | ✅ **Proven** — founder-run, July 2026 |
| Relay through a third phone | 🔴 Untested — *this is the gate* |
| Background / locked-screen behaviour | 🔴 Untested |
| Android on hardware | 🔴 Untested |
| Measured ranges in a real crowd | 🔴 Unmeasured |
| Anchor — any variant | 🔴 Never built |
| LoRa trunk | 🔴 Never built |
| Gateway — any tier | 🔴 Never built |
| Loc8OS | 🔴 Not written |
| Payload encryption | 🔴 Zero lines |

**The design is coherent and the physics works. Almost none of it exists yet.**
The order of spend is unchanged: £0 field test → £230 bench spike → signed
pilot → hardware.
