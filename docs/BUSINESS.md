# Loc8 — the business model on one page

*What we sell, to whom, at what shape of price, and the selling points the
decks are built from. Drafted 2026-07-21. Prices marked "illustrative" need
market validation — the structure is the decision, the numbers are placeholders.*

---

# ⭐ THE PLAN, IN PLAIN ENGLISH — read this first

**We have a real business and we can start selling in weeks, not after the
field test.** If you read nothing else in this repo, read this box.

### The order of operations

| When | Do this | Needs |
|---|---|---|
| **Now → ~6 weeks** | **Sell Guard + Command to a venue that has wifi.** Messages ride the venue's own network via the bridged transport — already built, already proven in software. | Nothing new. No mesh. No Gateway. No Anchors. No BLE encryption. No CE marking. |
| **In parallel, £0** | The 20-phone field test (`testing/field-test-protocol.md`). | An afternoon and some phones. |
| **After the test** | Sell the mesh as an **upgrade to customers we already have**: *"when the wifi dies at 1am, your muster board keeps working."* | The proven mesh. |
| **Then** | Gateway hardware → Anchors → county-show beachhead → data products (`data-strategy.md`). | Revenue funding it. |

### Why connected-first is a gift, not a retreat

- **The Bluetooth mesh is NOT cancelled and NOT dead.** It is unproven, which
  is different. It remains the moat and the reason the consumer app works at a
  greenfield festival where there is no wifi at all.
- Our security product is **the messages, not the radio**. An SOS is 25 bytes;
  a muster reply is a name and "safe". The muster board, dispatch and audit log
  do not care what carried the bytes — the engine's transport layer is
  swappable by design.
- Venues in Martyn's Law's enhanced tier **already have wifi**. Their walls are
  why they need us; their wifi is how we reach them today.
- Over TLS, **encryption is solved by default** — the plaintext-BLE problem
  stops blocking revenue and becomes part of the mesh workstream.
- "When the wifi dies, we keep working" is the best sales line the mesh will
  ever have — but we can only say it to a customer we already have.

### What the market research actually concluded (do not misread this)

- ✅ **We can sell today.** Guard + Command are transport-agnostic and built.
- ✅ **Nobody else names who is missing.** Not Halo, not 24/7 Software, not
  Raven, not WeTrack. Radio structurally cannot. That capability *is* the
  product; the mesh is one mechanism for delivering it.
- ✅ **An unserved beachhead exists** — UK agricultural and county shows,
  ~7m attendees over ~400 show days, no vendor found serving the sector.
- ⚠️ **The old TAM was fiction**, not the market shrinking: `business-model.md`
  assumed 10,500 festivals ≥5k globally; there are 2,840 worldwide of all
  sizes. Festivals were never the market that document described.
- ⚠️ **Realistic ceiling: a £2–5M/yr profitable company at ~86% gross margin,
  exiting at 4–9× ARR.** THIS IS A GOOD OUTCOME — an £8–45M exit on a
  self-funded company. It is *not* venture scale. If the plan was to raise VC
  on a unicorn story, that story does not survive the evidence. If the plan is
  to build a profitable company we own, that is exactly what is in front of us.
- 🔴 **Front-line military is closed** (physics, procurement, certification —
  see report §6.1). Training exercises and DASA grants survive.

**Source:** `research/market-expansion-report.md` — 210 agents, 30 research
lines, 80 claims refuted or corrected by adversarial verification.

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

## The near-term plan (revised 2026-07-21 — connected-first)

**Revenue and proof now run in PARALLEL. Selling is no longer gated on the
field test.** See the plain-English box at the top of this document.

1. **Sell now — Guard + Command over venue wifi.** Bridged transport, already
   built and proven in software. No mesh, no hardware, no encryption blocker,
   no CE marking. Target: a wifi'd venue in the Martyn's Law enhanced tier, or
   a county show with a Show Secretary who can sign personally.
2. **In parallel, £0 — the field test** (`testing/field-test-protocol.md`).
   The two-iPhone exchange already passed (founder-run, July 2026); what
   remains proves the *mesh*: relay through a third phone, background
   behaviour, Android, measured ranges. Publishing those numbers would make us
   the only company in Europe with real crowd-density mesh data.
3. **Bench spike** — 3× Nordic dev kits, £230, proves the anchor thesis on a
   table. Only after there is revenue or a signed pilot.
4. **Encryption + rotating IDs** — prerequisite for the *mesh* pilot, not for
   the wifi sale (TLS covers connected deployments).
5. **Then** Gateway build-out, Anchors, the county-show beachhead, and the data
   products (`data-strategy.md`).
