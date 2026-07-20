# Gateway battery & power — full research synthesis

*Verbatim output of the 132-agent adversarial research workflow, 2026-07-20.
Preserved here because it is the source for `docs/hardware/loc8-gateway.md` §9.
Workflow stats: 132 agents · 1875 tool calls · 6.97M tokens.
Of 124 first-pass claims, 123 were corrected by adversarial review before landing in the spec.*

---

# Gateway battery backup — recommendation

## 1. Direct answer

**Partly, and not as currently specified.**

Yes, the box can carry its own cells and ride out a mains cut. No, it does not "charge like a phone," and no, the current spec does not deliver this at the tier anyone will actually buy.

Current spec status: the UPS battery HAT (~$25) appears **only in Tier C** ($180–240). Tier B — the doc's own "pilot workhorse" — has PoE and no battery. Yet §1's comparison table advertises the Gateway generically as "on PoE, battery-backed," and the one-line pitch at the top of the doc says it "survives power cuts." **Those two statements are false for the tier we will ship most of.** They will be falsified in front of a customer. Fix the copy or fix the BOM; do not ship both as written.

Two other defects in the same table, since parts get ordered from it: Tier B's line items sum to **$93–113**, not the stated $95–120. And "$25 UPS HAT" is board-only on every candidate part — cells are not included.

## 2. "Charges like a phone" is the wrong mental model

A phone is a **cycling** device: charge to 100%, discharge to ~20%, repeat daily, ~500 cycles over its life. A wall-mounted gateway is a **float** device: it sits at or near full charge, permanently, for years, in a warm enclosure, and discharges perhaps 10–30 times in its entire service life.

The failure mode is therefore **calendar aging, not cycle life**. Cycle-life spec sheets are close to noise here — we will consume under ~100 cycles in ten years, which is inside even a mediocre Li-ion cell's rating. What kills the pack is sitting at high state-of-charge at elevated temperature. Reference data for cobalt-blend Li-ion: ~80% capacity retained after one year at 25 °C/100% charge, ~65% at 40 °C/100% charge. A sealed box above a ceiling tile runs 15–25 °C above room ambient.

**Correct behaviour: charge, then stop. Do not hold a continuous float.**

- Charge to ~3.45–3.50 V/cell (LFP), terminate, and let the pack rest.
- Re-top from coulomb count at ~70–80% SoC — **not** from open-circuit voltage. LFP's plateau spans ~3.29–3.33 V across roughly 20–80% SoC, so millivolt-level sense error maps to tens of percent of charge. An OCV-triggered recharge threshold is unusable on this chemistry.
- If a maintenance voltage is unavoidable, hold **3.30–3.35 V/cell**, not 3.65 V (that is the charge-termination voltage) and not 3.45 V.
- Specify charger hysteresis explicitly. A charger that re-tops every time the cell relaxes a few millivolts accumulates thousands of invisible micro-cycles.
- Mandatory BMS charge lockout **below 0 °C and above ~45 °C**. The enclosure is uncontrolled at both ends.

Also: do not reuse a lead-acid/AGM charge profile. Its periodic equalisation stage (14.4–15.5 V on a 4S bus = 3.60–3.875 V/cell) sits at or above LFP termination, and its negative temperature compensation raises voltage when cold — the opposite of what LFP needs.

## 3. Recommended configuration

**Chemistry: LiFePO4.** Justified on calendar-life-at-float and thermal-runaway severity, **not** on cycle life (irrelevant here) and not on runaway onset alone (LFP ~256 °C vs NMC ~198 °C measured start-of-runaway — a real margin, not a categorical difference). The decisive argument is that in nail-penetration and low-SoC thermal abuse testing, LFP cells did not enter runaway at all, and LFP decomposition releases far less heat and gas with no cathode oxygen release. For a box screwed to a wall in an occupied venue, that is the argument that matters.

Accept the density penalty honestly: small-format LFP is ~110–130 Wh/kg and ~250–300 Wh/L against ~240 Wh/kg and ~685 Wh/L for an NMC 18650 — roughly 2× by mass, 2.5× by volume.

**Cells: 4× LFP 26650, 3000 mAh, 1S4P.** Note that LFP **18650** cells are a trap — merchant parts are 1100–1500 mAh (~3.5–4.8 Wh), and "1800 mAh 18650 LFP" listings are not credible against LFP's energy density. 26650 is the honest small-format LFP part.

**Arithmetic (Tier C, dual BLE radios, no LTE):**

```
Gross pack     4 × 3.0 Ah × 3.2 V             = 38.4 Wh
Usable derate  × 0.78  (3.0 V cutoff, aging,
                        cold, BMS quiescent)  = 30.0 Wh
Boost 3.2→5 V  × 0.86                         = 25.8 Wh delivered at 5 V

Load (measure this — see §8):
  Tier B, Pi 4, shed          ~3.0 W → 8.6 h
  Tier C, CM4, dual BLE       ~5.0 W → 5.2 h
  Tier C + LTE transmitting   ~6.5 W → 4.0 h
```

**Design figure: 5 hours at Tier C, unshed.** Not "rides out a power cut" open-endedly. Cost-down option: 2× 26650 = 19.2 Wh gross → ~12.9 Wh delivered → ~2.6 h at 5 W. That is a clean-shutdown-plus-short-outage budget, not an event-length one.

**UPS board approach — this is the honest gap.** There is no off-the-shelf UPS HAT that gives us LFP, ~38 Wh, CM4/CM5 carrier compatibility, and host-readable state of charge:

- **Sequent Multichemistry Watchdog HAT** ($65) supports LiFePO4 and adds a hardware watchdog, but is 40-pin Pi header, requires both 18650 sockets populated, exposes only a raw voltage read (no fuel gauge — useless on LFP's flat curve), and has a fixed 2.8 V discharge floor.
- **LiFePO4wered/Pi+** ($51, Tindie) is architecturally right — 4 µA standby, clean I²C, smooth transfer — but ships one 1500 mAh cell (4.8 Wh, ~15–25 min on a Pi 4) and is capped at 2 A continuous. Too small.
- **Geekworm / Waveshare UPS HATs** are all Li-ion/LiPo and mostly 40-pin Pi parts; the Waveshare pogo-pin boards additionally have vendor-documented intermittent-contact behaviour ("scratch off the oxide layer of the pin header") that I would not specify for a wall-mounted appliance.
- **PiJuice is dead.** Pi Supply Ltd was dissolved 15 July 2025; Nebra Ltd is in liquidation; storefronts return HTTP 402. DigiKey still shows PIS-0212 as "Active" with zero stock — stale metadata, do not trust it.

**Therefore: integrate the charger and power path onto the Tier C CM4/CM5 carrier.** A TI BQ25798-class NVDC charger with input-current DPM (IINDPM/VINDPM) plus a real coulomb-counting fuel gauge (BQ27441 / MAX17048 class). DPM matters: it throttles charge current automatically so the compute load always wins over recharge, instead of hard-coding a conservative fixed charge rate. Budget the carrier respin as NRE, not a BOM line.

Board-level requirement, non-negotiable: **the UPS must report to the OS.** Pack voltage, signed current, and coulomb-counted SoC over I²C, plus a mains-present GPIO. A pass-through UPS with only LEDs makes the entire shutdown design in §5 impossible.

## 4. The PoE-switch problem — and what battery-backing actually buys

This is the most important thing in this document and it is currently unaddressed in the spec.

**Tier B and Tier C both take power *and* network from the same PoE cable.** In a venue mains failure the PoE switch dies. A battery-backed gateway therefore keeps its SoC alive but loses its Ethernet link — and with it every mTLS console session (§5 step 4, §6 Layer 1). A mains-powered control-room desktop is dark anyway.

So battery-backing the gateway *alone* delivers:

- ✅ BLE mesh relay continues (the gateway is still the best-placed, highest-gain node)
- ✅ SQLite site database keeps recording — incidents, muster confirmations, the hash-chained audit log
- ✅ LTE uplink survives if the dongle is fitted (it runs off the gateway's own 5 V rail), so HQ gets a positive "site on battery" event instead of inferring an outage from silence
- ❌ **No console.** Command cannot attach over a dead LAN.

That last line is the honest limit. **Battery-backing the gateway alone is worth doing — the local record and the mesh are the point — but it does not deliver a working control room.**

Three consequences for the spec:

1. **State the scope explicitly in customer-facing copy.** "Keeps the mesh and the site record alive through a power cut; consoles reconnect when the network returns." Not "control-room backbone that survives power cuts."
2. **Add a documented console path.** Two options, in order of cost: (a) **USB-C gadget mode** — a tethered laptop reaches `loc8-sited` directly and recovers the full console including stored site state, at zero BOM cost. This requires redesignating the USB-C port as **data-only** (Pi 4/CM4 OTG only works when USB-C is not powering the board — move alt-power to the GPIO header) and confirming D+/D− are routed on the carrier. On CM4 specifically, enabling device mode **disables the USB-A host port**, i.e. the LTE dongle — that trade must be documented or a PCIe USB host added. (b) Gateway soft-AP: cheaper operationally, but adds an RF attack surface behind a Layer 2 payload-encryption story that is currently unbuilt. Ship gadget mode first.
3. **Put "PoE switch on a UPS" on the site-survey sheet** as an install condition. It is the venue's purchase, it protects their cameras and access control too, and it is the only thing that keeps the LAN and consoles up. Sell it; do not depend on it.

Note also: the existing **guard-phone bridge** fallback (§8) does not rescue this case. It is a WebSocket over IP and cannot cross a dead LAN — it needs a laptop hotspot stood up first — and it carries live mesh frames only, not the Gateway's stored site state.

## 5. Load-shedding on battery, and the shutdown sequence

Justify shedding on **graceful degradation and card wear**, not as a runtime multiplier. On Pi/CM-class hardware, shedding buys roughly **1.2–1.4×**, not 2× — the static floor (SoC leakage, LPDDR4 self-refresh, PMIC and boost quiescent) dominates, and a Pi 4's entire idle-to-full-load span is only 2.37×. On a CM4 it is 1.46×.

**On mains loss (immediately):**
- Enter BATTERY state; latch it.
- **Checkpoint now, not later** — SQLite `PRAGMA wal_checkpoint(TRUNCATE)` + fsync. Costs seconds and negligible energy, and is the only placement that gives a recovery point independent of the shutdown succeeding.
- Emit one high-priority `SITE ON BATTERY` event over LTE if fitted.
- **Block OTA and USB-stick updates via hard interlock**, gated on the mains-present GPIO. The risk is not a corrupt inactive slot (A/B absorbs that) — it is the slot-switch metadata commit and the first unconfirmed boot, where automatic rollback itself needs charge to complete a second reboot.
- Shed `loc8-provisiond`'s **gateway-claiming path only**. Keep cert issuance and per-shift key issuance running — a guard clocking on during a blackout with no key cannot join the mesh and is invisible for the entire outage.
- Collapse position-frame persistence to a last-known-position table plus a coarse 30–60 s appended track. This is a **write-amplification** measure (~70 mW, ~2% of budget), not a power measure. Do not discard the track entirely — it is often the contractual proof-of-presence deliverable, and a power cut is a high-incident window.
- `loc8-syncd`: batch to bursts no more frequent than 1 per 15 min, retaining a low-rate heartbeat so HQ can distinguish "quiet" from "dead."
- Suspend all DB housekeeping (VACUUM, log rotation, index rebuilds) — chiefly because VACUUM holds a write lock that blocks incident and audit writes.
- Status lens: **amber**, slow breath, rate increasing as reserve drains. Do not use red — red is already "fault" in §3, and red/amber is the classic colour-vision-deficiency confusion pair, so encode the state in the **waveform**, not the hue. Do not dim: the lens draws ~2 mW, 0.04% of budget.

**Never shed:** mesh receive/relay, critical-class persistence (SOS, duress, muster, incident), the status lens, the shutdown supervisor.

**Shutdown triggers — specify in volts and coulombs, not SoC percent.** LFP's flat plateau makes percentage the least trustworthy quantity in the system, and 40% of an 8 Wh pack differs 3× from 40% of a 25 Wh pack.

| Stage | Trigger | Action |
|---|---|---|
| Warning | ~25% of usable reserve, coulomb-counted | Broadcast on mesh; raise breath rate; report a runtime **range**, not a point estimate |
| Shutdown begin | ~15% reserve | Stop accepting new writes; final WAL checkpoint; fsync; remount read-only |
| Complete by | ~10% reserve | Halt |

Pick **one** warning trigger, not two. Pairing "25%" with "~15 min estimated" is inconsistent by 1.5× — as an OR, the time arm fires at ~17%, leaving under two minutes before shutdown begins and collapsing the warning stage.

**Budget the shutdown in seconds, measured, then convert to a voltage/coulomb trigger.** Do not derive it from a 5-percentage-point band in the region the spec itself calls untrustworthy.

**Reserve an explicit energy floor for the supervisor.** Without it, tier-1 loads run the pack to hard cutoff and the hash-chained audit log is lost to a dirty unmount — the exact failure the battery exists to prevent. The hardware watchdog must be extended or disarmed on entering orderly shutdown, or undervoltage produces reset loops and repeated dirty mounts.

**Boot hold-off after a depletion shutdown:** require mains-present stable 60–120 s before boot. Two constraints: charging must be autonomous PMIC hardware that runs with the SoC powered off (otherwise you deadlock — won't boot until charged, won't charge until booted), and provide a physical long-press force-boot override that boots degraded/read-only. This device backs muster during evacuation; it must never be unavailable during the incident it exists to record.

**Structural mitigations matter more than thresholds.** Read-only root via overlayfs, one persistent writable partition (`/var/lib/loc8`) plus tmpfs for `/run`, `/tmp`, `/var/log`, machine-id, DHCP leases and SSH host keys, and split the database: audit/incident/muster at `synchronous=FULL`, position at `synchronous=NORMAL`. This is ~$0 of BOM and removes most of the corruption exposure. Note that the split buys tunable durability, **not** corruption isolation — both files share one FTL. And a hash chain does not self-report loss: tail truncation is its known undetectable failure mode, so periodically export the signed chain head and entry count off-box so a missing tail is detectable by comparison.

Finally, correct one common item: **do not put "drop the Ethernet PHY" on the shed list unconditionally.** On a PoE install the switch is already dead, so the PHY has auto-entered energy-detect and the marginal saving is tens of mW; if the switch *is* on a UPS, dropping the PHY severs the console and sync path precisely when you most want to report the outage.

## 6. Cost delta and tier placement

| Line | Tier B (proposed option) | Tier C (standard) |
|---|---|---|
| LFP cells | 2× 26650 ≈ $12–16 | 4× 26650 ≈ $24–32 |
| Charger/power path | Sequent HAT $65, or carrier-integrated | Carrier-integrated (NRE) |
| Fuel gauge | included above | included above |
| **Added BOM** | **~$30–45** | **~$35–50** |
| Runtime at load | ~2.6 h @ 5 W | ~5.2 h @ 5 W |

Plus one-time NRE for the Tier C carrier respin (schematic, layout, at least one spin, EMC retest inside the metal enclosure) and the compliance work in §7.

**Placement recommendation:**

- **Tier C: battery standard.** Already the case; increase the line from ~$25 to ~$50 and specify LFP + fuel gauge + carrier-integrated charger. Tier C's stated $180–240 absorbs this.
- **Tier B: battery as a priced option, not standard.** Adding it to Tier B's base takes the BOM from $93–113 to ~$125–160, which breaks the "~$100 BOM → sell at $299–399" economics in §2. Sell it as "Tier B + backup."
- **Correct the §1 table and the one-line pitch now**, regardless. Change "on PoE, battery-backed" to "on PoE; battery-backed at Tier C or from a UPS-backed switch," and change "survives power cuts" to "rides out power cuts when specified with the UPS option."

There is a real argument that **every** tier should carry a small supercapacitor hold-up (~60 J, ~10–15 s at load, ~$8–15 in parts) purely for clean-shutdown-on-power-loss — Tiers A and B run from microSD and are the tiers actually exposed to filesystem corruption, while Tier C's soldered eMMC is already the most resilient. But the read-only-root + WAL work above is cheaper and removes more of that risk, so **do that first** and treat hold-up capacitance as a second-order addition, not a headline BOM change. Note also that supercaps do not remove maintenance — EDLC life halves per +10 °C and they fade silently, so any hold-up design needs voltage derating and a periodic self-test that measures actual hold-up energy.

## 7. Compliance consequences — stated proportionately

Adding a lithium cell is a real but bounded increment. It is **not** the dominant compliance cost; the radio is.

**Genuinely mandatory, and new:**

- **UN 38.3** transport testing. Not optional, applies to all modes (not just air). Buy cells that already hold a UN 38.3 test summary and IEC 62133-2 certification from the cell manufacturer — you generally *cannot* commission cell-level testing on someone else's cell, since it requires construction data they withhold. **The assembled pack still needs its own UN 38.3 (T.1–T.5) and pack-level IEC 62133-2 evaluation.** Budget ~£1,500–5,000 per pack configuration, 3–6 weeks. Note also the Special Provision 310 / 49 CFR 173.185(e) exception: annual runs of ≤100 cells/batteries and prototypes for testing are excepted from the testing requirement, so pilot units can ship legally before certification completes.
- **IEC 62368-1 Annex M.** Ed. 4 (2023) expanded M.4 to cover **non-portable** equipment, so a permanently-installed wall unit is now in scope where it previously was not. Coin cells >3 Ω are exempt. Confirm subclause numbering against the edition in force — the EU harmonised standard is still EN IEC 62368-1:2020+A11:2020, with Ed. 4 not expected mandatory until ~2026–27.
- **Regulation (EU) 2023/1542.** The battery is itself a CE-marked product with its own Annex VIII technical file. CE marking obligations have applied since 18 Aug 2024. The CE mark goes **on the battery** — or, if not possible, on the packaging *and* accompanying documents. Never on the host device. The DoC must be a **single** consolidated declaration covering RED and the Battery Regulation together, not a separate one. Conformity assessment is Module A (self-declaration); no notified body for a pack this size. **Art. 11 removability/replaceability applies from 18 February 2027** — a design constraint, not a test-lab one. Derogations exist (Art. 11(2)/(3)) but relying on one requires documented justification, and the data-integrity derogation will likely fail for a device with non-volatile memory. **Assume user-replaceable unless and until a derogation is documented**, and budget the Art. 11(7) five-year spares obligation running from the last unit of the model shipped.
- **EPR registration:** WEEE + battery EPR, per member state, recurring. Real recurring cost, often underbudgeted.

**Explicitly not triggered:** NFPA 855 / IFC §1207 energy-storage fire code (applicability floor is 1 kWh; a 38 Wh pack is ~26× below it), UL 9540/9540A, UL 1973, IEC 62619. Anyone budgeting an ESS compliance programme for this has misread the scale.

**UK fire/building regulation:** no regulation names lithium cells or prohibits them in occupied venues, and Approved Document B is silent. But the RRO 2005 requires the venue's responsible person to review their fire risk assessment on any significant change, and installing a permanent cell is one. **Practical consequence: ship a one-page fire-safety statement** (chemistry, Wh rating, UN 38.3 test summary reference, IEC 62133-2 certificate number, protection-circuit description, enclosure fire-rating basis, operating temperature limits, end-of-life removal instructions). This is not merely commercial good practice — it substantially discharges duties you already owe under HSWA 1974 s.6(1)(c) and GPSR reg. 7(1). Caveat: naming specific certificates on a shipped document locks the BOM to that exact cell, so gate second-sourcing behind a document update.

**Insurer sensitivity:** rising and real (QBE recorded 1,760 UK lithium-ion fires in 2025, up 147% in three years, 23% in commercial premises), but the published insurer guidance corpus addresses EV charging, BESS and bulk storage — not small installed devices. Treat this as a plausible near-term procurement gate to hold evidence against, **not** a confirmed requirement.

**Proportionate budget:** battery-specific compliance work is roughly **£4,000–9,000** and **6–10 weeks** on top of the base first-product programme (which is realistically £15,000–39,000 with a pre-certified radio module, dominated by safety/EN 62368-1 and RED cybersecurity assessment under EN 18031, not by the battery). LFP buys **zero** regulatory relief over NMC — it is a lithium-ion chemistry and every standard applies identically. Choose it for float life and runaway severity, and say so.

## 8. Open questions — bench measurement, not more research

These cannot be resolved by reading. Nothing in §3's arithmetic is trustworthy until item 1 is done.

1. **Actual gateway power draw at the 5 V rail**, measured with an INA260 (not an INA219 — its external shunt sized for fine resolution inserts ~100 mV of drop at 1 A and manufactures the sag you are measuring). Log at 10–100 Hz for a full hour under the real production workload: real BlueZ scan/advertise parameters, real SQLite write rate, real client count, in a genuinely dense RF environment. Measure separately: Tier B idle, Tier B under mesh load, Tier C dual-radio, Tier C + LTE transmitting. **Every runtime figure above is an estimate against this number.**

2. **Transient droop under LTE transmit.** Separate instrument required — an INA2xx tops out around 1–1.8 kHz, so Nyquist hides anything shorter than ~2 ms and a sampled reading will alias straight past the true minimum. Use a scope in peak-detect with a current probe, tens of kHz minimum, probing at the DUT connector (100–300 mΩ of cable and connector resistance alone gives 100–300 mV at 1 A). Size bulk capacitance from the measured burst current and duration, and confirm the rail holds above the SoC's brownout trip.

3. **BLE increment.** No controlled Pi-4 measurement of continuous scan+advertise exists in the published literature that I could find. The commonly cited 13 mA figure is an nRF51822 number and does not apply — the Pi 4 uses a CYW43455 combo part with materially higher BT RX current. **Reserve +0.6 W and measure it.** This is the weakest number in the budget. Note the baseline convention matters: measure against a Pi idling with Bluetooth enabled-but-idle, not against `dtoverlay=disable-bt`.

4. **Measured LFP discharge curve** at the chosen pack and load, at 0 °C, 25 °C and 45 °C, to fixed the voltage/coulomb shutdown triggers in §5. Do not use SoC percentages until this exists.

5. **In-enclosure cell temperature over a full summer**, logged at 5-minute intervals with a 1%-tolerance NTC or PT1000 Class A bonded to a cell can and electrically isolated from it (cans sit at a terminal potential; a grounded-junction thermocouple creates a galvanic path into the logger). Type-K Class 2 at ±2.2 °C implies ±15% error in predicted degradation rate — unusable for an argument premised on 10 °C mattering. **The output that matters is the Arrhenius rate-weighted effective temperature, not the 95th percentile** — on a representative plant-room profile P95 overstates the degradation rate by ~1.9× while the simple mean is only ~1.14× low.

6. **Boost-converter efficiency at the actual operating point**, including at the shed operating point (which is *lower* than unshed, and therefore erodes the shed benefit).

7. **Mechanical:** does the chosen charger/power-path arrangement physically coexist with the PoE+ HAT? Both contend for the same header and stack height. Confirm before ordering anything.

8. **Verify the USB-C OTG path** on the exact Tier C module (Pi 4 yes via dwc2; CM4 requires the carrier to route OTG; Pi 5 USB-C is reported power-only). The §4 console fallback depends on it.

**Prices in this document are July 2026 snapshots and must be re-quoted at order time.** Geekworm runs continuous sale pricing; Waveshare and Pi Supply pages were partly unreachable during research; the Pi 4 2GB has moved to ~$45 on DRAM pricing, which already puts §2's "$35–45" at its ceiling.