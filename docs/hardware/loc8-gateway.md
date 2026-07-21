# Loc8 Gateway — the venue appliance

*The physical spine of Loc8 Ops. A small wall-mounted box that speaks the BLE
mesh natively on one side and the network on the other, holds the site's
database, and uplinks to the cloud when any internet exists. It replaces the
"operator's laptop as hotspot + server + database + security perimeter"
arrangement with real infrastructure.*

**One sentence:** plug it into power-over-Ethernet, and the venue has a
control-room backbone that works with zero internet, rides out power cuts when
specified with the battery option, and shows up on HQ's dashboard the moment it
finds a pipe out.

> **Power-cut scope — read §9 before repeating this claim to a customer.**
> Battery backup is standard at Tier C and a priced option on Tier B. It keeps
> the mesh and the site record alive; it does **not** keep the control room up,
> because the same outage takes down the PoE switch.

---

## 1. Why a box

| Laptop-as-infrastructure (today) | Gateway appliance |
|---|---|
| One machine is app + server + DB + router + perimeter | Each job in its right place |
| Dies when the laptop sleeps/moves/crashes | Screwed to a wall, on PoE, battery-backed at Tier C |
| Anyone on the network can reach the relay | Device certs + authenticated relay |
| State lost on reload | SQLite on the box; consoles are stateless viewers |
| No off-site story | Store-and-forward sync to HQ |
| Feels like a demo | Feels like infrastructure |

The laptop/hotspot chain **remains as a fallback mode** — a selling point
("the control room can run off a laptop in a car park"), no longer the design.
Likewise every guard phone remains a *spare* gateway: the control room is the
one thing at a venue that cannot be cut off.

## 2. Build tiers & BOM (approximate street prices — re-quote at order time)

### Tier A — Demo ($~40)
Pi Zero 2 W · 32GB microSD · USB PSU · printed case. Wi-Fi only. Lives in the
sales bag; powers a tabletop pilot.

### Tier B — Standard install ($93–113) — the pilot workhorse

*Battery backup is a priced option here, not standard — see §9.3. Adding it
takes this tier to ~$125–160 and breaks the "~$100 BOM → sell at $299–399"
economics below, so it is sold as "Tier B + backup".*

| Part | Role | ~Cost |
|---|---|---|
| Raspberry Pi 4 (2GB) or CM4 on carrier | Compute; BLE 5 + Wi-Fi onboard | $35–45 |
| PoE+ HAT | Power + network down ONE Ethernet cable | $20 |
| Industrial microSD 32GB (or CM4 eMMC) | OS + site database | $10 |
| External BLE antenna (u.FL → SMA) | Real mesh range vs PCB trace | $8 |
| Wall/DIN-mount enclosure | The "infrastructure" part | $15–25 |
| Status LED ring / 0.9" OLED | "◈ MESH · 14 NODES · SYNCED" at a glance | $5 |

### Tier C — Ruggedized ($180–240)
CM4/CM5 with soldered eMMC (no SD to corrupt) · metal wide-temp enclosure ·
**integrated LFP battery + charger (~$50, see §9)** — the gateway rides out a
venue power cut, which is exactly when it matters · dual BLE radios (concurrent
scan + advertise) · tamper switch.

*Corrected 2026-07-20: this line previously read "UPS battery HAT (~$25)". That
figure was board-only on every candidate part — cells are not included — and no
off-the-shelf HAT meets the requirement anyway. See §9.*

### Add-on modules (any tier)
- **LTE dongle + SIM (~$25 + data):** the box brings its own internet. A venue
  with no wifi and jammed cell still appears live on HQ's dashboard.
- **LoRa concentrator (~$40–80):** makes this Gateway the **head-end of the
  LoRa trunk** — every anchor's long-range traffic funnels into the box that
  already holds the site database.

### The hardware family — one brain, many ears

To prevent drift between this doc and `../strategy/anchors-hardware.md`:

| Product | Class | Runs | Per site | Job |
|---|---|---|---|---|
| **Loc8 Gateway** (this doc) | Pi-class | **Loc8OS** | **one** | Site brain: DB, audit, relay, sync, PKI, best mesh node. Tiers A/B/C are build qualities of *this* product. |
| **Loc8 Anchor** (strategy doc, Phase 3) | ESP32-class, ~£30–40 | tiny firmware, **not** Loc8OS | 0–dozens | Dumb radio translator (BLE re-broadcast / BLE⟷LoRa). Stateless: if one dies, coverage shrinks and nothing is lost. Battery/solar, pole-mounted. |

Same 25-byte protocol everywhere; consumer crews and Guard staff share the
same mesh through the same hardware (crew codes / team tags separate them on
the wire, as today). Deployment patterns: guarded venue = Gateway only ·
festival = Gateway (+LoRa +LTE) in production + anchors on the empty seams ·
cruise/industrial = Tier C + anchors in the steel. Anchors stay **Phase 3**:
build them only after the field test locks the phone protocol.

**Economics:** ~$100 BOM at Tier B → sell at $299–399 or bundle free with
per-guard SaaS. Competitors' site infrastructure (RTLS, lone-worker hardware)
runs to thousands.

## 3. Physical spec (Tier B reference)

- **Dimensions:** ~120 × 90 × 35 mm (a thick paperback / small Wi-Fi AP);
  antenna stub adds ~50 mm. Weight ~250 g. Tier C: ~150 × 110 × 40 mm, ~450 g.
- **Mounting:** keyhole wall plate + DIN clip; ceiling-tile bracket optional.
- **Ports:** 1× RJ45 (PoE in), 1× USB-C (service/alt power), 1× SMA antenna,
  1× USB-A (LTE dongle / offline update stick). No display, no buttons except
  a recessed factory-reset pin.
- **Industrial design language:** matte near-black body, chamfered edges, the
  Loc8 wordmark debossed, a single ◈ status lens. Light grammar matches the
  apps: **green breathing** = mesh live & synced · **amber pulse** = mesh live,
  uplink down (store-and-forward) · **red** = fault · **white chase** =
  unclaimed/pairing. Reads as kin to a UniFi AP crossed with an industrial
  controller — infrastructure, not gadget.

## 4. Software — an appliance image, not a new OS

We do **not** write an operating system. We ship a locked-down **appliance
image**: minimal Linux (Raspberry Pi OS Lite now; Yocto/buildroot when volumes
justify it) with our services baked in, flashed at "manufacture" (an afternoon
per batch at pilot scale: flash, boot-test, label). Branding it "Loc8 OS" is
marketing truth — to the customer the box has one purpose and no visible Linux.

**Full software spec: [`../software/loc8os.md`](../software/loc8os.md)** —
service stack, device states, power-state contract, storage layout, A/B
updates, provisioning lifecycle, and bench console examples. The table below is
the summary.

**The services (systemd units):**

| Daemon | Job |
|---|---|
| `loc8-meshd` | **The Linux port of the BLE mesh** (BlueZ/D-Bus): scans, advertises, relays, dedups — speaking the exact 25-byte frames the phones speak. *This is the critical-path engineering project; the codec/protocol are already shared + tested, so it is a port, not a redesign.* |
| `loc8-relayd` | The relay (grown from `tools/mesh-bridge`): authenticated WebSocket fan-out to consoles + gateway phones; still a dumb pipe for (encrypted) frames. |
| `loc8-sited` | Site state + SQLite persistence: incidents, roster, muster, the hash-chained audit log. Consoles become stateless viewers of this. |
| `loc8-syncd` | Store-and-forward cloud sync over any uplink (Ethernet/Wi-Fi/LTE); backfills after outages. |
| `loc8-provisiond` | First-boot identity, mDNS advertisement (`_loc8._tcp`), claiming, cert issuance for enrolling devices. |
| watchdog + A/B updater | Self-healing; **signed** OTA images with rollback; USB-stick updates for offline sites. |

## 5. Plug-and-play — the whole lifecycle

1. **Plug in** PoE. Boots ≤ 30 s. Status lens breathes white: *unclaimed*.
2. **Claim.** Loc8 Command (desktop app) on the same network discovers
   "Loc8 Gateway · unclaimed" via mDNS. Operator clicks Claim → names the site
   → the box mints its device identity; further claims require the org key.
   (Same adopt flow users know from UniFi/Sonos — zero manuals.)
3. **Enroll staff.** Clock-in stays the consent moment: Command shows a QR;
   the guard scans once. Under the hood that issues a device certificate and
   the per-shift key — the QR is the friendly face of real PKI.
4. **Operate.** Phones mesh over BLE as they already do; the gateway is just
   the strongest node — always on, wall-powered, big antenna. Consoles attach
   over the LAN (mTLS). Everything that matters lands in the box's SQLite.
5. **Sync.** Any uplink → HQ's portfolio dashboard shows the site live;
   no uplink → amber pulse, store-and-forward, backfill later.
6. **Update.** Signed image over the air, A/B slots, automatic rollback.

**Nothing to configure on phones** beyond normal enrollment: the mesh is the
same protocol they already speak; the gateway is simply another (excellent)
peer.

## 6. Security architecture

- **Layer 0 — network:** the box's Wi-Fi (when used) is WPA2/3; wired installs
  ride venue VLANs.
- **Layer 1 — relay auth:** consoles + gateway phones present certs (mTLS);
  strangers on the LAN reach a socket that rejects them.
- **Layer 2 — payload encryption (the real one):** frames are encrypted with
  the per-shift key **before touching any transport** (AEAD, key via HKDF from
  enrollment). LAN sniffers, the relay itself, and stranger phones relaying
  BLE hops all carry ciphertext. Implemented **in the engine**, so every door
  inherits it — and consumer crews later get the E2E promise from
  `identity-privacy-login.md` for free.
  - *Frame-size note:* AEAD adds ~16 B tag + nonce; ops mode moves to a ~41 B
    encrypted frame (BLE MTU has headroom; consumer framing already pads to
    256 B). Versioned additively in the codec.
- **Layer 3 — people:** operator login on Command (SSO per the identity doc,
  local operator accounts first) so audit entries name humans; audit log
  hash-chained → tamper-evident, exportable as the after-action record.
- **Privacy invariants unchanged:** the box stores the same consented ops data
  the console holds today — staff on shift, incidents, anonymous crowd counts,
  the audit trail. No attendee identity store exists to protect or breach.

## 7. Off-site visibility (the manager question)

The gateway is the sync point because it already owns the site database.
`loc8-syncd` pushes an event stream (incidents, muster progress, headcounts,
audit) to the cloud spine whenever a pipe exists. HQ sees a **portfolio
dashboard**: one tile per site, drill-in to the live feed, "last synced 00:40".

- **Read-mostly by default:** off-site is a viewer; the local control room
  commands. Remote dispatch is a later, explicit role grant.
- **Graceful degradation:** uplink loss is invisible on site; the cloud shows
  staleness honestly and backfills on reconnect.
- **The LTE-dongle pitch:** a venue with *no working infrastructure at all*
  still appears live at HQ, while the local mesh never depends on that link.

## 8. Engineering plan (order of attack)

1. **`loc8-meshd` — the Linux BLE mesh port.** Critical path; everything else
   is assembled from parts we have. Spike on a bench Pi against two phones.
2. **Consolidate relay + persistence + mDNS** into the site daemons (mostly
   moving existing code onto the box).
3. **Command desktop app** (Tauri wrap of the existing React build) with
   gateway discovery + claim flow.
4. **Enrollment PKI + payload encryption** in the engine (ops frame v2).
5. **`loc8-syncd` + the HQ portfolio dashboard** (first real cloud component;
   Supabase-class backend is sufficient).
6. **LoRa module + anchor mode** (the coverage-maps roadmap).

*Fallback modes preserved throughout:* no gateway → any guard phone bridges to
a laptop console exactly as today; both paths stay tested.

## 9. Power & battery backup

*Researched and adversarially verified 2026-07-20. Prices are a July 2026
snapshot — re-quote at order time. **Every runtime figure below is an estimate
against an unmeasured load**; see "Bench first" at the end.*

### 9.1 It is a float device, not a phone

The instinctive model — "it charges like a phone, then runs off battery" — gets
the user experience right and the charging behaviour wrong. A phone *cycles*:
full to ~20% daily, ~500 cycles in its life. This box *floats*: it sits at
charge for years and deep-discharges maybe 10–30 times ever.

So the failure mode is **calendar aging, not cycle life**. Cycle-life spec
sheets are close to noise here — we will not consume 100 cycles in a decade.
What kills a pack is sitting at high state-of-charge while warm. Reference data
for cobalt-blend Li-ion: **~80% capacity retained after one year at 25 °C and
100% charge; ~65% at 40 °C.** A sealed box above a ceiling tile runs 15–25 °C
above room ambient.

**Correct behaviour: charge, terminate, rest — do not hold a continuous float.**

- Charge to ~3.45–3.50 V/cell (LFP), terminate, let the pack relax.
- Re-top from **coulomb count** at ~70–80% SoC, *not* from open-circuit
  voltage. LFP's plateau spans ~3.29–3.33 V across roughly 20–80% SoC, so
  millivolt sense error maps to tens of percent of charge. Voltage-triggered
  recharge is unusable on this chemistry.
- If a maintenance voltage is unavoidable, hold **3.30–3.35 V/cell** — not
  3.65 V (that is charge termination), not 3.45 V.
- Specify charger hysteresis explicitly, or the charger re-tops on every
  millivolt of relaxation and accumulates thousands of invisible micro-cycles.
- Mandatory BMS charge lockout **below 0 °C and above ~45 °C**.
- Do **not** reuse a lead-acid/AGM profile. Its equalisation stage sits at or
  above LFP termination, and its negative temperature compensation raises
  voltage when cold — precisely backwards for LFP.

### 9.2 Chemistry: LiFePO4

Chosen on **calendar-life-at-float and thermal-runaway severity**, explicitly
*not* on cycle life (irrelevant here). Runaway onset alone is a real but not
categorical margin (LFP ~256 °C vs NMC ~198 °C); the decisive evidence is that
in nail-penetration and low-SoC abuse testing LFP cells did not enter runaway at
all, and LFP decomposition releases far less heat and gas with no cathode oxygen
release. For a box screwed to a wall in an occupied venue, that is the argument.

Density penalty, stated honestly: small-format LFP is ~110–130 Wh/kg and
~250–300 Wh/L, against ~240 Wh/kg and ~685 Wh/L for an NMC 18650 — roughly 2×
by mass, 2.5× by volume.

**LFP 18650 is a trap.** Merchant parts are 1100–1500 mAh (~3.5–4.8 Wh);
"1800 mAh LFP 18650" listings are not credible against the chemistry's energy
density. **26650 is the honest small-format LFP part.**

LFP buys **zero** regulatory relief over NMC — it is a lithium-ion chemistry and
every standard in §9.6 applies identically.

### 9.3 Pack and runtime

**4× LFP 26650, 3000 mAh, 1S4P** (Tier C). Arithmetic, with assumptions stated:

```
Gross pack      4 × 3.0 Ah × 3.2 V                       = 38.4 Wh
Usable derate   × 0.78  (3.0 V cutoff, aging, cold, BMS)  = 30.0 Wh
Boost 3.2→5 V   × 0.86                                    = 25.8 Wh at 5 V

  Tier B, Pi 4, load shed        ~3.0 W  →  8.6 h
  Tier C, CM4, dual BLE          ~5.0 W  →  5.2 h
  Tier C + LTE transmitting      ~6.5 W  →  4.0 h
```

**Design figure: 5 hours at Tier C**, not open-ended "rides out a power cut".
Cost-down 2× 26650 = 19.2 Wh gross → ~12.9 Wh delivered → **~2.6 h at 5 W**,
which is a clean-shutdown-plus-short-outage budget, not an event-length one.

### 9.4 There is no off-the-shelf board that fits

Surveyed and rejected — this is the honest gap in the plan:

| Part | Verdict |
|---|---|
| Geekworm X1200/X1201/X1202/X1203/X1205/X1206 | **Pi 5 only** — pogo pins mate to power pads the Pi 4 does not have |
| Geekworm X728 ($44) | Pi 4 compatible; one documented latent failure mode on the current revision needing mitigation |
| Sixfab Power Management HAT v2 | **RETIRED** by the vendor — "supply problems with power components" |
| PiJuice (PIS-0212) | **END OF LIFE. Do not order.** Pi Supply Ltd dissolved 15 Jul 2025; Nebra Ltd in liquidation. DigiKey still lists it "Active" with zero stock — stale metadata |
| Waveshare UPS HAT (E) ($32.99) | 4× 21700 **in series** (4S1P, ~14.8 V) — not our topology; pogo-pin contact reliability is a wall-mount liability |
| Sequent Multichemistry Watchdog HAT ($65) | Supports LFP + hardware watchdog, but 40-pin only, raw voltage read with **no fuel gauge** (useless on LFP's flat curve), fixed 2.8 V floor |
| LiFePO4wered/Pi+ ($51) | Architecturally right — 4 µA standby, clean I²C, smooth transfer — but ships one 1500 mAh cell (~15–25 min) and caps at 2 A |

**Therefore: integrate charger and power path onto the Tier C CM4/CM5 carrier.**
A TI BQ25798-class NVDC charger with input-current DPM (IINDPM/VINDPM) plus a
real coulomb-counting fuel gauge (BQ27441 / MAX17048 class). DPM matters — it
throttles charge current so the compute load always wins over recharge, rather
than hard-coding a conservative fixed rate. Budget the carrier respin as **NRE,
not a BOM line**.

**Non-negotiable board requirement:** the UPS must report to the OS — pack
voltage, signed current, coulomb-counted SoC over I²C, plus a mains-present
GPIO. A pass-through UPS with only LEDs makes §9.5 impossible to implement.

### 9.5 On battery: load shedding and shutdown

Shedding buys roughly **1.2–1.4×**, not 2× — the static floor (SoC leakage,
LPDDR4 self-refresh, PMIC and boost quiescent) dominates. Justify it on graceful
degradation and card wear, not as a runtime multiplier.

**On mains loss, immediately:**
- Latch BATTERY state.
- **Checkpoint now, not later** — `PRAGMA wal_checkpoint(TRUNCATE)` + fsync.
  Costs seconds and negligible energy, and is the only placement giving a
  recovery point independent of the shutdown succeeding.
- Emit one high-priority `SITE ON BATTERY` event over LTE if fitted.
- **Hard-interlock OTA and USB updates** on the mains-present GPIO. The risk is
  not a corrupt inactive slot (A/B absorbs that) — it is the slot-switch commit
  and first unconfirmed boot, where rollback itself needs charge for a second
  reboot.
- Shed `loc8-provisiond`'s **claiming path only**. Keep cert and per-shift key
  issuance running: a guard clocking on mid-blackout with no key cannot join the
  mesh and is invisible for the whole outage.
- Collapse position persistence to last-known-position plus a coarse 30–60 s
  track. This is **write-amplification** control (~70 mW, ~2% of budget), not a
  power measure — do not discard the track, it is often the contractual
  proof-of-presence deliverable and a power cut is a high-incident window.
- `loc8-syncd`: batch to ≤1 burst/15 min, retaining a low-rate heartbeat so HQ
  can tell "quiet" from "dead".
- Suspend VACUUM and log rotation — chiefly because VACUUM holds a write lock
  that blocks incident and audit writes.
- Status lens **amber**, slow breath, rate rising as reserve drains. Encode
  state in the **waveform, not the hue** — red already means fault, and red/amber
  is the classic colour-vision-deficiency confusion pair. Do not dim it; the lens
  is ~2 mW, 0.04% of budget.

**Never shed:** mesh receive/relay · critical persistence (SOS, duress, muster,
incident) · the status lens · the shutdown supervisor.

**Triggers in volts and coulombs, never SoC percent** — LFP's flat plateau makes
percentage the least trustworthy quantity in the system.

| Stage | Trigger | Action |
|---|---|---|
| Warning | ~25% usable reserve, coulomb-counted | Broadcast on mesh; raise breath rate; report a runtime **range** |
| Shutdown begin | ~15% reserve | Stop new writes; final WAL checkpoint; fsync; remount read-only |
| Complete by | ~10% reserve | Halt |

Pick **one** warning trigger. Pairing "25%" with "~15 min remaining" is
inconsistent by 1.5× — as an OR the time arm fires at ~17%, leaving under two
minutes before shutdown begins and collapsing the warning stage.

**Reserve an explicit energy floor for the supervisor**, or tier-1 loads run the
pack to hard cutoff and the hash-chained audit log is lost to a dirty unmount —
the exact failure the battery exists to prevent. The hardware watchdog must be
extended or disarmed on entering orderly shutdown, or undervoltage produces
reset loops and repeated dirty mounts.

**Boot hold-off after depletion:** require mains stable 60–120 s before boot.
Two constraints — charging must be autonomous PMIC hardware that runs with the
SoC powered off (otherwise you deadlock: won't boot until charged, won't charge
until booted), and there must be a physical long-press force-boot override that
comes up degraded/read-only. This device backs muster during an evacuation; it
must never be unavailable during the incident it exists to record.

**Structural mitigations matter more than thresholds**, and cost ~$0: read-only
root via overlayfs; one writable partition (`/var/lib/loc8`) plus tmpfs for
`/run`, `/tmp`, `/var/log`, machine-id, DHCP leases, SSH host keys; and split the
DB — audit/incident/muster at `journal_mode=WAL` + `synchronous=FULL`, position
at `journal_mode=WAL` + `synchronous=NORMAL`. Note the split buys tunable
durability, **not** corruption isolation (both files share one FTL). And a hash
chain does not self-report loss — tail truncation is its known undetectable
failure mode, so periodically export the signed chain head and entry count
off-box.

> **WAL is load-bearing, not incidental — do not change the journal mode.**
> The durability guarantee this device is sold on holds *only* in WAL mode.
> Per SQLite's own documentation: "FULL is atomic, consistent, isolated, and
> durable (ACID) in WAL mode", but "**FULL is not necessarily durable across a
> power loss in rollback mode**, so if durability is desired, it is best to set
> the synchronous mode to EXTRA." Switching to a rollback journal therefore
> silently voids the audit-write guarantee while leaving the `synchronous=FULL`
> pragma looking untouched — the failure is invisible until a real power cut
> costs a real incident record. If the journal mode ever must change, raise
> `synchronous` to `EXTRA` in the same commit. (`EXTRA` is pointless *within*
> WAL — SQLite: "EXTRA is no different from FULL in WAL mode.")
>
> The position DB is deliberately weaker: "A transaction committed in WAL mode
> with synchronous=NORMAL might roll back following a power loss." That is the
> correct trade — live positions are worthless seconds later — but it means the
> position DB is explicitly **not** a record, and nothing evidentiary may be
> written only there. Source: <https://www.sqlite.org/pragma.html#pragma_synchronous>
>
> Two caveats that outrank the pragma. (1) `synchronous=FULL` issues a
> cache-flush the storage device may simply ignore — on a consumer microSD the
> pragma buys nothing, which is why the industrial pSLC part is a durability
> line item, not a nicety. (2) Durability is per committed transaction; it does
> not protect an in-flight write, which is what the shutdown reserve and the
> checkpoint-at-mains-loss exist for.

Do **not** unconditionally shed the Ethernet PHY: on PoE the switch is already
dead so the PHY has auto-entered energy-detect (saving is tens of mW), and if the
switch *is* on a UPS, dropping it severs console and sync exactly when you most
want to report the outage.

### 9.6 Compliance increment

Real but bounded. **The battery is not the dominant compliance cost — the radio
is.**

- **UN 38.3** transport testing, all modes. Buy cells that already hold a UN 38.3
  summary and IEC 62133-2 cert (you generally cannot commission cell-level
  testing on someone else's cell — it needs construction data they withhold).
  **The assembled pack still needs its own UN 38.3 (T.1–T.5) and pack-level
  62133-2.** ~£1,500–5,000 per pack config, 3–6 weeks. Special Provision 310 /
  49 CFR 173.185(e) excepts ≤100 cells/yr and prototypes, so **pilot units can
  ship legally before certification completes.**
- **IEC 62368-1 Annex M.** Ed. 4 (2023) expanded M.4 to **non-portable**
  equipment, so a permanently-installed wall unit is now in scope where it was
  not. EU harmonised standard is still EN IEC 62368-1:2020+A11:2020; Ed. 4 not
  expected mandatory until ~2026–27.
- **Regulation (EU) 2023/1542.** The battery is itself a CE-marked product with
  its own Annex VIII technical file; obligations live since 18 Aug 2024. CE mark
  goes **on the battery** (or packaging *and* docs) — never on the host. Issue a
  **single consolidated DoC** covering RED and the Battery Regulation. Module A
  self-declaration; no notified body at this size. **Art. 11
  removability/replaceability applies from 18 Feb 2027** — a design constraint.
  Derogations exist but the data-integrity one will likely fail for a device with
  non-volatile memory, so **assume user-replaceable** and budget the Art. 11(7)
  five-year spares obligation from last-unit-shipped.
- **EPR:** WEEE + battery EPR per member state, recurring. Routinely
  underbudgeted.
- **Not triggered:** NFPA 855 / IFC §1207 (applicability floor 1 kWh; a 38 Wh
  pack is ~26× below), UL 9540/9540A, UL 1973, IEC 62619. Anyone budgeting an
  ESS programme here has misread the scale by an order of magnitude.
- **UK fire/building regs:** nothing names lithium cells and Approved Document B
  is silent, but RRO 2005 requires the venue's responsible person to review their
  fire risk assessment on significant change. **Ship a one-page fire-safety
  statement** (chemistry, Wh, UN 38.3 ref, 62133-2 cert no., protection circuit,
  enclosure basis, temp limits, end-of-life removal). This substantially
  discharges duties already owed under HSWA 1974 s.6(1)(c) and GPSR reg. 7(1).
  Caveat: naming certificates locks the BOM to that cell — gate second-sourcing
  behind a document update.
- Insurer sensitivity is rising and real (QBE: 1,760 UK Li-ion fires in 2025, up
  147% in three years, 23% commercial premises), but published guidance addresses
  EV, BESS and bulk storage — not small installed devices. Treat as a plausible
  near-term procurement gate to hold evidence against, not a confirmed
  requirement.

**Proportionate budget:** ~£4,000–9,000 and 6–10 weeks *on top of* the base
first-product programme (realistically £15,000–39,000 with a pre-certified radio
module, dominated by EN 62368-1 safety and RED cybersecurity under EN 18031).

### 9.7 Bench first — nothing above is trustworthy until these are measured

1. **Actual draw at the 5 V rail.** INA260, **not** INA219 (its external shunt
   sized for fine resolution inserts ~100 mV at 1 A and manufactures the sag you
   are measuring). Log 10–100 Hz for an hour under the real workload — real
   BlueZ scan/advertise parameters, real SQLite write rate, real client count, in
   a genuinely dense RF environment. Separately: Tier B idle, Tier B under mesh
   load, Tier C dual-radio, Tier C + LTE TX. **Every runtime figure in §9.3 is an
   estimate against this number.**
2. **Transient droop under LTE transmit.** Different instrument — INA2xx tops out
   ~1–1.8 kHz, so Nyquist hides anything under ~2 ms and a sampled reading
   aliases past the true minimum. Scope in peak-detect with a current probe, tens
   of kHz, probed at the DUT connector (100–300 mΩ of cable and connector alone
   gives 100–300 mV at 1 A).
3. **BLE increment.** No controlled Pi-4 measurement of continuous
   scan+advertise exists in published literature. The commonly cited 13 mA is an
   nRF51822 figure and does not transfer — the Pi 4 uses a CYW43455 combo part
   with materially higher BT RX current. **Reserve +0.6 W and measure.** Weakest
   number in the budget. Baseline against a Pi idling with BT enabled-but-idle,
   not `dtoverlay=disable-bt`.
4. **Measured LFP discharge curve** at the chosen pack and load, at 0/25/45 °C,
   to fix the §9.5 triggers. Do not use SoC percentages until this exists.
5. **In-enclosure cell temperature over a full summer**, 5-min intervals, 1% NTC
   or PT1000 Class A bonded to a cell can and **electrically isolated** (cans sit
   at terminal potential; a grounded-junction thermocouple creates a galvanic
   path into the logger). Type-K Class 2 at ±2.2 °C implies ±15% error in
   predicted degradation — unusable for an argument premised on 10 °C mattering.
   The output that matters is the **Arrhenius rate-weighted effective
   temperature**, not the 95th percentile (on a representative plant-room profile
   P95 overstates the rate ~1.9×, while the simple mean is only ~1.14% low).
6. **Boost efficiency at the actual operating point**, including the shed point
   (which is *lower*, and therefore erodes the shed benefit).
7. **Mechanical:** does the charger/power-path arrangement physically coexist
   with the PoE+ HAT? Both contend for the same header and stack height. Confirm
   before ordering anything.
8. **Verify the USB-C OTG path** on the exact Tier C module — Pi 4 yes via dwc2;
   CM4 requires the carrier to route OTG; Pi 5 USB-C is reported power-only.
