# Loc8 — the business model on one page

*What we sell, to whom, at what shape of price, and the selling points the
decks are built from. Drafted 2026-07-21. Prices marked "illustrative" need
market validation — the structure is the decision, the numbers are placeholders.*

---

## What the company makes

Three finished apps and two small boxes. The phones — which we don't make,
buy, or maintain — do most of the physical work.

| Product | Cost to us | Status |
|---|---|---|
| Loc8 (consumer app) | £0/unit | ✅ built |
| Loc8 Guard (staff app) | £0/unit | ✅ built |
| Loc8 Command (control-room software) | £0/unit | ✅ built |
| Loc8 Gateway (the venue's brain box) | ~£75–90 (Tier B) | 🟡 specced |
| Loc8 Anchor (listening posts) | ~£60–75 | 🟡 Phase 3 |

## Who pays

**Consumers don't** (free or near-free app). They are the network — every
install makes the product better for everyone, including our paying customers —
and the marketing.

**Venues pay a subscription** for the professional tier: Guard + Command + the
hardware kit + support.

## The kits

| Kit | Contents | Hardware bill to us | Illustrative price |
|---|---|---|---|
| **Club** | Gateway + Guard + Command | ~£90 | ~£150–250/month |
| **Festival** | Club kit + 6–12 anchors + LoRa trunk | ~£500–900 | per-event pricing |
| **Stadium** | Festival kit scaled, 12–24 anchors, RF survey | ~£1,000–2,000 | annual contract |

Hardware pays for itself in weeks; the margin is the service.

## Rent, don't sell — decided 2026-07-21

The venue never owns our boxes. Kit is included in the subscription; we own,
update and swap it.

1. **Recurring revenue** beats one-time sales.
2. **Control:** we push security updates to hardware we own. A sold box rots
   in the field with our name on it.
3. **Venues prefer it** — the card-terminal model they already accept. They
   want a working service, not radio equipment to own.
4. **Swap-not-repair:** anchors are stateless by design; replacement is
   unscrew, screw, done.
5. Note: renting is still "placing on the market" — it does **not** dodge
   compliance obligations (`compliance.md`).

## The selling points (deck source of truth)

1. **The play-by-play record.** Every incident reconstructed: SOS 23:41:07,
   dispatched 23:41:31, on scene 23:43:02, clear 23:51:18 — timestamped,
   responder-named, assembled automatically, while radios were down and wifi
   was dead. Tamper-evident (hash-chained), and engineered to survive a
   mid-incident power cut. **Timely hook:** the Terrorism (Protection of
   Premises) Act 2025 ("Martyn's Law") puts statutory security-preparedness
   duties on UK venues — a box that *proves* procedures ran is what a venue
   shows a regulator.
2. **The muster board names who's missing.** Not "12 of 14" — *which two*, by
   name, with last-known zone.
3. **Density is an asset.** Every other system degrades in a crowd; ours
   improves, because every phone is a relay.
4. **Runs with the internet unplugged.** Guard talks radio; Command talks to
   the Gateway over the venue's own LAN; the only internet login in the whole
   system is the optional multi-venue HQ dashboard.
5. **Fails safe, layer by layer.** Internet dies → nothing happens. LAN dies →
   mesh and recording continue. Gateway dies → phones still find each other.
6. **Measured coverage, not advertised range.** We commit to acceptance
   criteria (≥95% zone detection within 5 s, measured on site) instead of a
   number off a vendor box. Nobody else in this market talks this way.
7. **Fewer, smarter boxes.** Anchors are built to *listen* (+13 dB receive
   gain); each covers ~4× the area, so fewer poles, less rigging, less to fail.
8. **Privacy by architecture.** No accounts. The Gateway records consented
   staff operations only — consumer traffic is relayed, never stored.

## The claims discipline (also deck source of truth)

- **Never** describe Loc8 as an emergency communications system. It
  supplements — never replaces — emergency services, steward instructions, PA
  systems and venue incident procedures. This sentence appears wherever the
  record is sold.
- **Never** quote "100 m" or any open-field range for crowd conditions.
- **Never** promise coverage a walk-test hasn't measured.
- The status story stays honest: the mesh field test is the current gate, and
  technical buyers are told so. (It reads as rigour, and it is.)
- Keep out of decks entirely: 32,767 anything, Wi-Fi Aware, patent history,
  dev-kit prices.

## The near-term plan (unchanged by all of the above)

1. **Finish the field test** — £0 (`testing/field-test-protocol.md`). The
   two-iPhone exchange already passed (founder-run, July 2026); what remains
   is the part that proves the *mesh*: relay through a third phone, background
   behaviour, Android, measured ranges. Everything still gates on that.
2. **Bench spike** — 3× Nordic dev kits, £230, proves the anchor thesis on a
   table.
3. **Encryption + rotating IDs** — prerequisite for any public pilot.
4. First venue pilot with written acceptance criteria → then Loc8OS build-out
   and the rental fleet.
