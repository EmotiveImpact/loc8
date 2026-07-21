# UK compliance — what we must satisfy before renting hardware to venues

*One page so this stops living only in a PDF in a Downloads folder. Scope: our
hardware (Gateway, Anchor). Our phone apps change nothing about a phone's own
certification — phones are already compliant devices; software riding their
radios inherits that. Compliance is a workstream for the boxes we build.
Drafted 2026-07-21. This is an engineering summary, not legal advice; a
product-compliance consultant reviews before anything ships to a paying venue.*

---

## The four obligations

| Obligation | What it is | Bite |
|---|---|---|
| **Ofcom IR 2030** | UK spectrum rules. 2400–2483.5 MHz wideband data: **max 100 mW / 20 dBm EIRP** with the mitigation requirements of EN 300 328. | EIRP counts transmitter power **plus antenna gain**. A +20 dBm radio into a +3 dBi antenna is 23 dBm and illegal. Our anchors run the front-end at ~+17 dBm into a modest antenna to stay inside the budget. |
| **EN 300 328** | The harmonised standard behind that limit: adaptivity, duty cycle, spectral behaviour. | Lab-tested, not self-declared by vibes. |
| **Radio Equipment Regulations 2017** | To place radio hardware on the GB market: essential requirements (safety, EMC, spectrum efficiency), a technical file, a Declaration of Conformity, marking, traceability, corrective-action duties. | Applies to **renting**, not just selling — placing on the market includes making available for use. Our rent-don't-sell model does not dodge this. |
| **Bluetooth SIG qualification** | Shipping a branded product that uses Bluetooth technology requires SIG membership and product qualification. | Fees + process. Using pre-qualified modules (nRF52840 modules with existing QDIDs) shrinks it substantially — a reason to prefer modules over bare chips at production. |

## The traps, named

1. **The no-amplifier trap.** Bolting an external amplifier or high-gain
   antenna onto a certified module **voids the module's certification basis**
   — it changes EIRP, spurious emissions, and conformity. This is the single
   most tempting mistake for a small company chasing range. We never do it
   without a qualified RF/compliance review. (It also wouldn't help: range is
   uplink-limited, and the law caps the downlink anyway — see
   `hardware/anchor-deployment.md`.)
2. **Prototype freedom is not product approval.** Nordic dev kits on a bench,
   at default powers, for our own evaluation: fine. The moment a box is
   installed at a paying venue, it is a product on the market and the full
   stack above applies.
3. **The money is not the hardware.** Certification, EMC pre-scans, tooling,
   documentation and liability insurance can exceed the per-unit hardware cost
   by orders of magnitude. A £65 anchor may sit inside a £10–20k one-off
   compliance programme. Budget the programme, amortise it across the fleet.

## Sequence (start early — it's slow, not hard)

1. **Classification** — intended use, markets (GB first), bands, applicable
   standards. A one-day paper exercise; do at bench-spike time.
2. **Design controls** — pre-qualified radio modules, antenna specified with
   its gain in the EIRP budget, power limits in firmware config
   (`CONFIG_MPSL_FEM_NRF21540_TX_GAIN_DB`), safety design.
3. **Pre-compliance scan** — an accredited lab day *before* the formal
   attempt; catches emissions/immunity surprises cheaply.
4. **Formal assessment** — EN 300 328 + EMC + safety reports into the
   technical file; Declaration of Conformity; marking.
5. **SIG qualification** — membership, qualified-component listing.
6. **Production control** — factory test, change control, traceability.

Steps 1–2 cost pennies and shape the design; they happen **now-ish**. Steps
3–6 gate the first paying venue, not the first experiment.

## What does NOT need any of this

- The consumer / Guard / Command **apps** (software on already-certified
  phones and laptops)
- **Bench and field experiments** with dev kits at default configurations
- The **field test** (`testing/field-test-protocol.md`) — two phones in a park
  is two consumer devices doing what they're certified to do
