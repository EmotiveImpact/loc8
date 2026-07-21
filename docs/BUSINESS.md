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

## Pricing architecture (revised 2026-07-21 — the £1,490 lesson)

**Rule one: price the service and the labour, not the boxes.** The first
illustrative festival price (£1,490/event) was anchored on ~£700 of hardware
and would have *lost* £2–3k per event once survey, install (2 techs × 2 days),
derig, show-day support and travel were counted (~£3,000–4,800 true cost to
serve). The boxes are the cheapest part of the service.

Three layers — this is the add/subtract system:

**1. Platform (recurring, per site).** Gateway + Command + Guard + the record
+ updates + swap-on-failure. Tier is defined by **venue scale**, not staff:

| Tier | Sized for | Illustrative price |
|---|---|---|
| **Club** | venues to ~2,000 cap | **£299/month** — deliberately cheap: the land-and-expand door (one guard-night costs a venue ~£150) |
| **Festival** | sites to ~20,000 | **from £3,500/event** (£2,500 small one-dayers → £8k+ multi-zone); survey ~£750 one-time first year |
| **Stadium** | beyond; annual calendars | **annual from ~£18k**, quoted after RF survey |

**2. Add-ons (metered):** anchors per-unit (monthly or per-event, placement
included) · LoRa trunk · LTE failover · insurer/licensing report pack
(the record is included; the lawyer-ready export is billable) · HQ dashboard
free at 2+ sites (it drives multi-site).

**3. Services (one-time / day-rate, at cost +50–100%):** survey, install,
derig, training, show-day on-site tech. Never silently bundled into the
platform fee — that was the £1,490 mistake.

Platform revenue is near-pure margin once a site is claimed (hardware
amortises in ~2 months at Club pricing). **Founding-venue pricing:** the first
3–5 customers get explicit, labelled discounts in exchange for case studies —
so early prices never anchor the market. North-star metric: **claimed sites**.

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

## Accounts, subscription & staffing (decided 2026-07-21)

**Account structure:** Organisation → Sites → Kit. One org (the paying
customer) owns one or more sites; each site has exactly one Gateway plus its
anchors and carries a plan. Multi-site orgs get the HQ dashboard automatically.

**Every login in the system:**

| Screen | Who | How | Lives on |
|---|---|---|---|
| Gateway service portal | installer / manager | installer PIN printed on chassis, router-style | venue LAN only (`loc8-gateway.local`) |
| loc8.com account | the person who pays | normal web login | internet |
| Command | operators | laptop certificate + operator PIN (audit names *who*) | venue LAN |
| Guard | security staff | scan the shift QR at clock-on — no password | the mesh |

**Claiming (how a box binds to a paying account):** every Gateway/Anchor ships
pre-provisioned with a claim code (QR + printed). Venue manager logs into
loc8.com → Add device → scans code → device binds to the org, certificates
exchange, heartbeats begin. Same pattern as Starlink/Sonos/Nest. One claim ties
the whole venue kit to one account; Command pairing and Guard shift-QRs chain
off the claimed Gateway.

**Non-payment (dunning) policy — safety products don't brick:**
- Day 0–30: grace. Everything works; nags in email + account banner.
- Day 30+: cloud stops (HQ, sync, support). **The site keeps working** — it is
  designed to run with no internet, and we neither can nor should kill a
  safety system mid-event.
- Day 60+: kit recall (the rental model doing its job).
- **Never** disable SOS/muster over an invoice. Say this to venues out loud —
  it's a trust point.

**Staff policy (refined 2026-07-21): never per-seat; tier by venue scale.**
The promise, kept in every tier: *"No per-seat charges — ever. No guard is
ever locked out of a shift."* Reasons: (1) radio hire charges ~£25–50 per
handset per event — "every steward's phone is the radio" attacks that cost
structure directly; (2) per-seat pricing on safety creates the perverse
incentive to under-cover — never build pricing where the customer saves money
by being less safe; (3) Martyn's Law pushes venues toward *more* coverage —
don't tax what regulation demands.

How value is still captured: **the tier is sized by venue capacity** (Club
~2,000 / Festival ~20,000 / Stadium beyond) — staff count follows venue size
naturally, so capacity does the pricing work without metering a safety seat.
Enforcement is **soft**: the Gateway signs every shift token so usage is
countable; an account consistently operating like the tier above is moved up
at renewal ("true-up"), never locked out mid-shift. The hard cap capability
stays in the drawer for abuse only. Positioning note: "no per-seat charges" is
the pricing weapon; the *selling points* remain the record, the muster board,
and measured coverage.

**Mockup of all three money-side screens:**
`design/loc8-account-portal.html` (pricing page, venue dashboard with claim
flow, and the Gateway's router-style portal — URL bar shows which world each
lives in).

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
