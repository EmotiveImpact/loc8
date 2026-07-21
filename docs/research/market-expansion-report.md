# Loc8 — Market and Strategy Report

**Date:** 21 July 2026
**Basis:** 24 verified research lines, adversarially fact-checked. Every figure marked `[HARD DATA]`, `[DERIVED]`, or `[UNVERIFIED]`.
**Audience:** the founder. Bootstrapping, solo, no capital, UK-first.
**Tone:** ruthless, as requested. False optimism costs real money.

---

## Reader's warning

This document contains numbers that were **refuted** during verification and are recorded here only so they are never used again. Anything marked `[REFUTED]` must not appear in a deck, a pitch, or a business plan. Several of them are currently circulating in Loc8's own strategy documents.

Three facts about the product constrain every recommendation below and are stated once here rather than repeated:

1. **The multi-phone relay is not proven.** Two iPhones exchanging BLE on a bench is proven. Multi-hop relay, backgrounded, across mixed iOS and Android, at crowd density, with screens off, is not.
2. **There is no payload encryption.** None.
3. **Gateway and Anchors are specified but unbuilt.**

Any advice that assumes otherwise is worthless.

---

# 1. EXECUTIVE SUMMARY — the ten things that matter

### 1. You are gating a sellable product behind an unproven radio. This is the single largest cost you are currently paying.

Loc8 Guard and Loc8 Command are **built and working**. Named muster roll-call, SOS dispatch, incident logging and a tamper-evident audit record are **transport-agnostic**. They do not need the mesh. They do not need Anchors. They do not need a Gateway, CE marking, radio certification, or payload-encryption-over-BLE.

The Home Office's own enhanced-tier register is overwhelmingly *connected* estate — 268 stadiums and arenas, 2,859 sports facilities, 1,561 visitor attractions, 180 universities `[HARD DATA]`. On those sites there is working wifi and cellular. Guard and Command over TLS could be invoiced this quarter. Over TLS, encryption is solved by default — which removes the single hardest objection in every buyer conversation in this corpus.

**The mesh then becomes the upsell, not the precondition:** *"and it keeps working when your network saturates at headline time."* That is a demonstrable differentiator layered onto a product already installed. Halo Solutions' radio is Push-over-Cellular and fails in exactly those conditions `[HARD DATA]`.

Ship connected. Prove the mesh. Sell resilience.

### 2. The one capability nobody else sells is naming who is missing.

Halo, 24/7 Software, Raven Controls, WeTrack, Everbridge, Crowd Connected — every incumbent researched does incident *logging*, attendee *analytics*, or mass *notification*. None answers *"who is unaccounted for, by name, right now?"* Radio cannot do it. CCTV cannot do it. A clipboard does it slowly and produces no defensible record.

This is the product. The mesh is the mechanism.

### 3. Martyn's Law creates a deadline and a named accountable person — not a mandate to buy anything.

Royal Assent 3 April 2025; expected in force **spring 2027**, date not yet legally fixed; SIA is the regulator; penalties up to the greater of **£18m or 5% of global revenue** for enhanced tier `[HARD DATA]`. Two commencement instruments exist (SI 2026/320, SI 2026/622) and **neither commences the substantive duties** `[HARD DATA]`.

But: ProtectUK states organisations *"do not need to spend money on consultants to be compliant"* and that neither the Home Office nor the SIA endorses third-party compliance products `[HARD DATA]`. And s.5(3) frames the four procedures as ones *"to be followed by individuals working on the premises"* — **staff, not attendees** `[HARD DATA]`.

**Never say "compliance."** Say *evacuation accountability*, *named muster*, and *evidence*. Sell the deadline and the personal accountability. A briefed safety officer will catch a compliance claim and you will lose credibility for everything around it.

### 4. Your own business model file is wrong by roughly an order of magnitude and needs correcting today.

`docs/strategy/business-model.md` assumes 2,500 global festivals ≥20k plus 8,000 at 5–20k = 10,500 `[HARD DATA — it is the file's own text]`. JamBase's database contains **2,840 festivals worldwide across 90 countries, of all sizes** `[HARD DATA]`. For 2,500 to be ≥20k would require 88% of the entire global all-sizes database to be ≥20k. Festival size distributions are power-law; this is not credible.

Roughly **£144m of the stated £460m "reachable TAM" rests on this count** `[DERIVED]`. Fix it before anyone who can check it reads it.

### 5. Festivals are the obvious beachhead and are not the right one.

The UK festival sector fell from an estimated 800–900 at its 2018/19 peak to **592 in 2025** — a **26–34%** decline, not the 34% commonly quoted (that is the worst end of a range) `[HARD DATA / corrected]`. 78 events fell in 2024 `[HARD DATA]`. The entire UK festival **radio-hire line** — the budget Loc8 would displace — is roughly **£0.8m/year** `[DERIVED]`. Full penetration of every qualifying festival is roughly **£270k/year** `[DERIVED]`.

Halo already holds Glastonbury, Notting Hill Carnival, ExCeL and the NEC `[HARD DATA]`. You would be selling additive cost into a contracting sector against an entrenched incumbent.

### 6. The uncontested market that two independent research lines surfaced unprompted: UK agricultural and county shows.

~7 million UK attendees a year across ~400 show days `[HARD DATA — ASAO]`. **~17,500 attendees per show day** `[DERIVED]`. Greenfield sites, genuinely poor rural cellular, dense crowds, and **lost children as the dominant incident type** — which is precisely the named-muster capability. A Show Secretary signs personally. No PQQ, no group IT review, no procurement committee. **No vendor was found serving this sector at all.**

This is the only market in the corpus where crowd-as-network, zero-infrastructure, *and* the anchor-to-anchor LoRa link are **all three** simultaneously advantageous rather than neutral or inverted.

### 7. Sell to security contractors, not to events.

One signature covers dozens of sites, with a repeat operating budget. CSC in the US covers 200 stadiums and 50 convention centres on a single relationship `[HARD DATA]`. Selling event-by-event means re-arguing price every season into a shrinking market.

The trap, flagged clearly: contractors bill labour on thin margins and resist headcount-reducing technology. **Sell it as a tender-winning differentiator, never as a cost saver.**

### 8. The realistic ceiling is £2–5m, and the evidence for that is brutal.

Halo Solutions — ex-police founder, King's Award, ExCeL and Glastonbury references, the exact brand position Loc8 wants — had **£1 in the bank** at 31 December 2024, 12 staff, £1,045,684 of accumulated losses, and had raised £1,060,460 in ten years `[HARD DATA — Companies House 09330491]`. Crowd Connected has filed small-company exempt accounts for **twelve consecutive years** and made ~£407k profit in 2024 `[HARD DATA — 08417106]`.

Neither failed on product. They are constrained by the budget they sell into — the same budget Loc8 targets.

The UK ceiling in this space is Peoplesafe: **£18.0m turnover, 86.4% gross margin, 30.1% operating margin** `[HARD DATA — Skyguard Ltd 04107459, FY ending 31 March 2025]`. That took twenty years, PE backing, all-sector reach, and a manned BS 8484 alarm receiving centre.

A profitable £2–5m UK business at those margins, acquired at 4–9× ARR, is a **genuinely good founder outcome**. It is not venture scale. Do not finance or plan it as though it were.

### 9. Most of the corpus is closed to you, permanently, for reasons no amount of effort fixes.

Mining (30 CFR §23.7 — a consumer phone can never be permissible), oil and gas (ATEX Zone 1/2 bans uncertified handsets), defence front-line (FIPS validation averages ~19 months *before* development, and Project CAIN was already awarded in March 2026), prisons (prisoners carry no phones, so there is no relay population), lone worker (a lone worker has no peers — the mesh's core mechanism structurally fails at the use case with the biggest budget), cruise (Starlink fleetwide since 2024; 2.4 GHz reaches only one deck through steel).

Declining these **out loud, on stated physics**, is a credibility asset with technical buyers. It is the same discipline as never quoting vendor "100m Bluetooth."

### 10. The highest-value action available costs approximately £0.

Twenty phones, a field, a stopwatch, and the discipline to publish what you find. Nobody in Europe has published measured cellular-failure or mesh-performance data at real festival density — the research looked specifically and found nothing `[HARD DATA — absence confirmed]`. Owning that measurement is worth more than any TAM slide, and it is the only test that determines whether anything else in this document matters.

---

# 2. THE NUMBERS

## 2.1 United Kingdom — festivals

| Figure | Value | Source | Confidence |
|---|---|---|---|
| UK music festivals, 2025 | **592** (360 greenfield, 232 single/multi-venue) | AIF Festival Forecast 2025 | `[HARD DATA]` — trade body, no published methodology |
| By AIF capacity band | Major 80,000+: **4** · Large 50–79,999: **7** · Medium 20–49,999: **33** · Small 1,000–19,999: **334** · Micro <1,000: **214** | AIF via Standout Magazine | `[HARD DATA]` — sums exactly to 592 |
| Mapped to attendance bands | 50k+: **11** · 20–50k: **33** · <20k: **548** | Derived from AIF bands | `[DERIVED]` — note these are **licensed capacity, not attendance** |
| Split of <20k band | ~438 under 5k / ~110 at 5–20k | Extrapolated from greenfield sub-sample | `[DERIVED]` — weakest number in the UK set |
| Plausible paying market (5,000+ cap) | **~154** | Derived | `[DERIVED]` |
| Decline from 2018/19 peak | 800–900 → 592 = **26–34%** | AIF | `[HARD DATA / corrected]` — the peak is an unsourced AIF estimate; 34% alone is cherry-picked |
| Events lost | 36 (2023) · **78 (2024)** · 39 to late June 2025 · 249 total since 2019 | AIF via Music Week / IQ | `[HARD DATA]` |
| Attrition trend | 39 by June 2025 = **half** the 2024 rate | AIF | `[HARD DATA]` — contraction is decelerating, not accelerating |

**The correct denominator for Loc8 is 360 greenfield, not 592.** Venue-based city festivals have normal cellular coverage and are not addressable by an offline mesh.

**Do not use:** the widely-circulated "Live Nation controls 25.26% of UK 5,000+ cap festivals." That is from a Music Business Worldwide article dated **27 August 2018** and its dataset is seven years stale and inconsistent with AIF's 2025 capacity figures `[REFUTED — must be corrected wherever it appears]`.

## 2.2 United Kingdom — Martyn's Law addressable counts

The single best bottom-up denominator in this entire corpus, because a government body counted it.

| Tier / sector | Count | Confidence |
|---|---|---|
| **Total premises in scope** | **178,891** | `[HARD DATA]` |
| Standard tier (200–799 capacity) | 154,623 (range 123,900–177,000) | `[HARD DATA]` |
| **Enhanced tier (800+)** | **24,268** (range 17,800–31,100) | `[HARD DATA]` |
| — Festivals | **975** (100% enhanced) | `[HARD DATA]` |
| — Zoos and theme parks | **386** (100% enhanced) | `[HARD DATA]` |
| — Racecourses | **61** (100% enhanced) | `[HARD DATA]` |
| — Stadiums and arenas | 268 (100% enhanced) | `[HARD DATA]` |
| — Sports facilities | 2,859 enhanced (of 29,979) | `[HARD DATA]` |
| — Visitor attractions | 1,561 enhanced (of 13,538) | `[HARD DATA]` |
| — Universities | 180 enhanced (of 271) | `[HARD DATA]` |
| — Retail and hospitality | 15,997 enhanced (of 776,405) | `[HARD DATA]` |
| — Education | 24,689 standard / **0 enhanced** (statutorily capped) | `[HARD DATA]` |
| — Places of worship | 33,323 standard / **0 enhanced** (statutorily capped) | `[HARD DATA]` |

**Loc8's genuinely addressable enhanced-tier count:**

- **Outdoor / greenfield (best fit): 1,422 sites** — festivals 975 + zoos/theme parks 386 + racecourses 61 `[DERIVED]`
- Indoor large-footprint (weaker fit): 4,868 — stadiums 268 + sports facilities 2,859 + visitor attractions 1,561 + universities 180 `[DERIVED]`

### The compliance-budget reality — read this before pricing

| Figure | Value | Confidence |
|---|---|---|
| Total 10-yr compliance cost, enhanced tier | £52,093 PV per premises ≈ **£5,209/year** | `[HARD DATA]` |
| Total 10-yr compliance cost, standard tier | £3,313 PV per premises ≈ **£331/year** | `[HARD DATA]` |
| Standard tier by firm size | micro £1,097 · small £2,560 · medium £3,327 · large £8,299 (10-yr) | `[HARD DATA]` |
| **UK-wide year-1 spend on Loc8-adjacent categories** | panic buttons £4.9m + walkie talkies £2.0m + comms plans £0.4m = **£7.3m** | `[HARD DATA — IA Table 9]` |
| For contrast, same table | security guards **£120.5m** · HVM barriers **£108.2m** · control rooms £19.8m · CCTV £2.4m | `[HARD DATA]` |
| Panic buttons: new implementation rate | **15% of enhanced-tier premises** — the highest of 13 modelled interventions | `[HARD DATA]` |
| Existing provision | CCTV already at 90% of premises; but **83% do NOT complete a CT risk assessment** | `[HARD DATA]` |

**Three critical qualifiers the headline numbers hide:**

1. The per-premises figures are **imputed opportunity cost of staff time**, not cash budget. The IA computes them from wage rates × hours and states the cost is *"the value of lost productive time."* No standard-tier line item is a purchasable product `[HARD DATA]`.
2. The money that *is* cash goes to guards and concrete, not to comms software.
3. The Home Office IA itself states *"No centralised data on the capacity of premises could be found."* Capacities were **modelled** from Ordnance Survey floorspace × fire-safety crowd densities and *"could not be tested against real capacity numbers at scale."* A ±20% capacity sensitivity swings total scope from 141,693 to 208,142 `[HARD DATA]`.

**Pricing consequence:** £1,490/site/year is **28.6% of an enhanced-tier premises' entire modelled annual compliance budget** for one supplier `[DERIVED]`. Winnable at a stadium. Not winnable at a mid-size venue. Standard tier at £331/year is commercially worthless for a hardware-rental model — do not chase the 154,623.

### Revenue arithmetic, honestly

| Scenario | Sites | Price | 100% | 5% | 20% |
|---|---|---|---|---|---|
| Outdoor enhanced tier | 1,422 | £1,490 | £2.12m | £106k | £424k |
| Indoor enhanced tier | 4,868 | £1,490 | £7.25m | £363k | £1.45m |
| All enhanced tier | 24,268 | £1,000 | £24.3m | £1.21m | £4.86m |
| UK festivals only | ~154 | ~£1,750 | ~£270k | ~£14k | ~£55k |

All `[DERIVED]`. 20% penetration of a regulated category by an unproven pre-revenue vendor would be an exceptional commercial outcome, not a base case.

## 2.3 United Kingdom — adjacent counts

| Figure | Value | Confidence |
|---|---|---|
| ASAO member organisations | **CONTESTED: "60+ member societies" vs "over 250 member organisations"** — both cite asao.co.uk | `[UNVERIFIED — resolve before use]` |
| ASAO show days per year | ~400 | `[HARD DATA]` |
| Agricultural/county show attendees | **~7 million/year** (~10% of UK population); ASAO members reach 6.5m | `[HARD DATA]` |
| **Derived attendees per show day** | **~17,500** | `[DERIVED]` |
| UK care homes | 16,444 (or 16,566 — the source's own headline and components disagree by 122) | `[UNVERIFIED]` |
| UK schools (England) | 24,479 (2024–25) | `[HARD DATA]` |
| UK HE providers | 304 (2024–25) | `[HARD DATA]` |
| UK prisons (all three jurisdictions) | 141 (E&W 121, Scotland 17, NI 3) | `[DERIVED from World Prison Brief]` |
| HMPPS band 3–5 prison officers | 21,984 FTE | `[HARD DATA]` |
| MOD Guard Service | 2,000+ staff, 100+ sites | `[HARD DATA]` |
| Active UKCS offshore installations | 221 | `[HARD DATA — NSTA open data]` |
| UK major ports | 40 | `[UNVERIFIED — trade body self-report]` |
| UK theme/amusement parks | ~30 | `[UNVERIFIED — crowd-edited list]` |
| Mountain rescue teams (England & Wales) | 48 teams, 3,968 calls in 2025, **£0 government funding** | `[HARD DATA]` |
| UK worker fatalities, all industries | 126 (2025/26 provisional) | `[HARD DATA — HSE]` |

## 2.4 Europe

| Country | Festivals | Notes | Confidence |
|---|---|---|---|
| Germany | **~1,800** | Identified sampling frame of 1,764 rounded. Sector income €551m vs expenditure €522m; ~15% profitable, ~30% loss-making; **average festival income €306,111** | `[HARD DATA / qualified]` |
| France | **1,356 paid** (2024, −5%) | 8.6m spectators (−5%); €313m ticket revenue | `[HARD DATA — CNM]` |
| Netherlands | **1,225** (2024, −2%) | Total festival visits −5%; EDM −9% count, −13.5% audience | `[HARD DATA — Respons]` |
| Spain, Belgium, Poland, Italy, Austria, Switzerland, Portugal, Czechia, all Nordics | **NOT FOUND** | No national counts exist | `[NOT FOUND]` |
| **Hard-counted EU total** | **4,381** (3 countries) | | `[DERIVED]` |

**European ownership concentration** `[HARD DATA — Live DMA/Reset!, Feb 2026]`: Live Nation 78 · Superstruct 63 · CTS Eventim 51 · AEG 10 = **202 mapped festivals** behind four procurement functions. Superstruct: 80+ festivals, 10 countries, ~7m attendees, ~€120m EBITDA (2023), acquired by KKR at ~€1.3bn `[HARD DATA]`. DEAG: €370m revenue 2024, 30+ festivals — the realistic first enterprise target `[HARD DATA]`.

### The decisive European finding

**There is no EU Martyn's Law.** The Home Office's own comparative research (IA Annex 1, Table A.1) assessed five European countries and found: Denmark *"No comparable legislation"* · Finland *"No comparable legislation"* · Germany *"No comparable legislation"* · Spain *"No legislation as broad as Martyn's Law"* · France — closest is the non-statutory Vigipirate plan. The IA concludes **"Martyn's Law is considered a first of its kind"** `[HARD DATA]`.

This cuts **against** European expansion, not for it. It means there is no legislated compliance demand outside the UK, and the IA explicitly records *"no envisaged plans in the near future for progressing similar provisions."*

The nearest analogues are: Germany §43 MVStättVO (Sicherheitskonzept mandatory above **5,000 visitor places**, with an ARGEBAU revision drafted February 2025 — the first comprehensive overhaul in two decades) `[HARD DATA]` and the Dutch **veiligheidsplan**, which requires a *communicatieplan* by name and is triggered at 2,000+ visitors in Amsterdam (each of 342 municipalities sets its own threshold) `[HARD DATA]`.

**Refuted French figures — never use these:** "two-thirds of French festivals ended 2024 in deficit, average deficit −€115,675, worsening +73% year-on-year." The CNM/DEPS report states **48% of 452 budget-question respondents** were in deficit (27% surplus, 25% break-even), publishes **no euro deficit figure at all**, and contains **no year-on-year comparison** — it is explicitly the first wave of the barometer `[REFUTED]`.

**Also refuted:** the CNM 5%-of-charges security line is not addressable. The report defines it as *"prestations de sécurité (pompiers, croix rouge…)"* — **firefighters and Red Cross**, statutory emergency and medical cover `[REFUTED as a pricing anchor]`.

## 2.5 United States

| Figure | Value | Confidence |
|---|---|---|
| US music festivals, 2024 | **1,168** (2023: 1,120 · 2019: 1,140) | `[HARD DATA — JamBase]` |
| Worldwide festivals, all sizes, 90 countries | **2,840** | `[HARD DATA — JamBase]` |
| US festivals by size band | **NOT FOUND** — no published breakdown exists anywhere | `[NOT FOUND]` |
| US festivals 50k+/day | ~20–30 | `[DERIVED — bottom-up naming exercise]` |
| US festivals 20–50k/day | ~50–120 | `[UNVERIFIED — this is a guess and is labelled as such] `|
| US hospitals | 6,100 registered; 907,216 staffed beds | `[HARD DATA — AHA]` |
| US certified nursing facilities | 14,742 (2025) | `[HARD DATA — KFF]` |
| US public schools | 98,577; private 30,492 | `[HARD DATA — NCES]` |
| US regular public school districts | **13,318** (2022–23) — *not* 13,035, and no 2023–24 figure is published | `[HARD DATA / corrected]` |
| US degree-granting postsecondary | 3,896 (2022–23); all Title IV incl. non-degree: 5,916 (2020–21) | `[HARD DATA / corrected]` |
| US commercial casinos | 493 locations | `[UNVERIFIED]` |
| US tribal gaming | 532 audited operations, 243 tribes, **$43.9bn GGR FY2024** | `[HARD DATA — NIGC]` |
| US bars and nightclubs | 69,948 (IBISWorld 2026) vs **42,456 QCEW employer establishments** (BLS 2025) | `[CONTESTED — 64% apart, different universes]` |
| US underground coal mines | 130 active (MSHA, July 2026) vs **177 producing** (EIA, 2024) | `[CONTESTED — different status filters]` |
| Astroworld litigation accrued by Live Nation | **$280m in 2024**; ~2,400 injury cases still pending | `[HARD DATA]` |
| Astroworld insurance vs claims | $26m coverage vs ~$3bn claims | `[UNVERIFIED — claims estimate is plaintiff-side]` |

**The decisive US finding: there is no US Martyn's Law and there is not going to be one soon.** Four and a half years after Astroworld: no federal or state statute mandates crowd-density management, crowd-safety technology, or event security assessment `[HARD DATA — ABA Entertainment & Sports Lawyer, Winter 2024]`. Texas produced recommendations. The federal bill (H.R.2887) concerns drones and airspace only, and has not passed. The grand jury declined to indict anyone.

The only binding US requirement is **NFPA 101: one trained crowd manager per 250 occupants** — a headcount requirement, enforced by the local fire marshal `[HARD DATA]`.

**Refuted:** "~1,700 US festivals scheduled for 2025" (Music Festival Wizard). That figure is a **global** count of the site's own database — the identical number appears on its USA, UK and Europe pages for the same year `[REFUTED]`.

## 2.6 Pricing benchmarks — what buyers actually pay

| Product | Price | Confidence |
|---|---|---|
| **Crowd Connected** attendee tracking | **£8/delegate + £4,500 activation** (500 delegates = £9,000; 4,000 = £40,500) | `[HARD DATA]` — the only public price in the category and the closest true comparable |
| **The Site Book** (UK construction) | £199/month Business; **£675/site/month + £5,000 setup** (Site Control) | `[HARD DATA]` |
| **AttendIQ** (UK construction, includes Emergency Muster) | **£4.50–£7.00/worker/month**, setup from £1,000, **free to 250 workers** | `[HARD DATA]` |
| **Vatix** lone worker device (BS 8484 + ARC) | £9.70–£14.20/device/month (website); £8.65–£16.40 (G-Cloud 14) | `[HARD DATA]` |
| **Vatix** lone worker app (no ARC) | £2.50–£3.50/user/month (website); £4.60–£10.70 (G-Cloud 14) | `[HARD DATA]` |
| **Zello Work** | Core US$8/user/month · **Plus US$15/user/month** (panic button + location tier) | `[HARD DATA]` |
| **CENTEGIX** (US K-12, real contracts) | Pinellas $3.8m/5yr = **~$5,000/school/yr** ($8.11/student); Barrow **~$12,338/school/yr** ($13.88/student); benchmark ~$8,000/school/yr | `[HARD DATA — public board contracts]` |
| **Pozyx** UWB RTLS kit | **US$4,970** (4 anchors + 6 tags + server + 1 yr) → ~$828/tracked asset | `[HARD DATA]` |
| **Pinpoint** P2 duress badge (UK prisons/health) | **£77.00** each | `[HARD DATA]` |
| **Valcom** UK school lockdown kit | **£194.00** one-off | `[HARD DATA]` |
| **Meshtastic-compatible LoRa nodes** | **$45–$75** finished | `[HARD DATA]` |
| UK two-way radio hire | £8–£20/radio/week; Amherst tiers by **duration**, not per week: 30+ units £8 (≤1wk) / £12 (1–2wk) / £18 (2–3wk) / **£22 (1 month+)** | `[HARD DATA / corrected]` |
| UK event stewarding | £18–£35/guard/hour (2026); ratios 1:250 low-risk to 1:75 stadium standing | `[UNVERIFIED — vendor blogs]` |
| **Halo, Raven Controls, WeTrack, 24/7 Software, Track24, Quuppa, Ubisense, Zebra, Kontakt.io, ZoneSafe, ELOKON** | **ALL quote-only. Zero public prices.** | `[NOT FOUND — 11 vendors]` |

### The two price anchors that matter

**Anchor UP to Crowd Connected** (£8/delegate + £4,500 activation), not DOWN to radio hire. A 300-handset week is ~£2,850 `[DERIVED]` and the entire UK festival handset market is ~£0.8m/year `[DERIVED]` — you cannot build a company on displacing it.

**Anchor AGAINST stewarding labour.** A 50,000-capacity three-day festival spends **~£216,000 on stewards** `[DERIVED]` — roughly **75× its radio hire**. £1,500 is 0.7% of that line.

## 2.7 Numbers we could not source — honesty about gaps

These are genuine `[NOT FOUND]`, not oversights. Several are decision-blocking.

**Highest priority — these change the answer:**

1. **Observed comms/safety spend per UK event.** No trade body, regulator or audited source publishes it. The £3,000-per-event comms envelope is derived from published radio hire list prices, not observed spend. *Fix: three or four calls with event production managers.*
2. **Per-show budget for any agricultural or county show.** No P&L, no comms spend, no security line. This is the single most important missing number for the recommended beachhead. *Fix: four calls to Show Secretaries.*
3. **Any actual contract value for UK event-safety software.** Not one. Contracts Finder keyword filters did not apply through the fetch tool. *Fix: request quotes from Halo and Crowd Connected as a prospective buyer.*
4. **ASAO membership count** — 60+ or 250+? Both cited to asao.co.uk. *Fix: one phone call.*
5. **The Purple Guide** — the document event safety officers actually work from — is paywalled and unread. It would tell you exactly what language to use. *Fix: buy it.*

**Also missing:**

- Halo Solutions and Crowd Connected turnover (both used the s.444(1) exemption and filed no P&L) — bounded, not known.
- Silvus acquisition price (undisclosed); goTenna revenue, funding, exit price (all undisclosed).
- BS 8484 certification cost and timeline (no published figures from BSI, NSI or SSAIB).
- CE/RED, UKCA and ISED Canada certification costs, and **all certification timelines in every jurisdiction**. One FCC datapoint only: ~$9,000–12,000 per intentional radiator, single lab `[UNVERIFIED — one vendor list price]`.
- LoRa per-message airtime — meaning the EU 1% duty cycle (36 seconds/hour/sub-band) cannot be converted into messages-per-hour. **Engineering-blocking for the Anchor.**
- Measured 2.4 GHz noise floor at a real festival; measured cellular failure rate at crowd density. **Nobody has published these anywhere in Europe.**
- Whether any UK venue currently buys mesh or offline comms — no evidence either way.
- Total UK outdoor event count. The Power of Events research states explicitly that **nobody has ever counted**. The "7,000+ major outdoor events" figure circulating on LinkedIn has no traceable primary source `[REFUTED — do not use]`.

**Contested figures to date-stamp whenever used:** AIF "festivals lost since 2019" is quoted as both 211 and 249 in the same year. Market value £3.3bn (Mintel 2023, concerts *and* festivals) vs £3.8bn (IBISWorld 2026, "Festivals") measure different scopes and **must never be shown as a trend**.

**Definitional trap:** UK Music's 23.5m "music tourists" (2024) covers all live music including arena and stadium concerts, and counts people who *travelled* for music. It is not festival headcount.

---

# 3. THE FULL USE-CASE MAP

## Scoring rubric

| Dimension | 1 | 3 | 5 |
|---|---|---|---|
| **Pain urgency** | Nobody has been cited for lacking it | Real but tolerated | Named incident type, felt weekly |
| **Compliance forcing function** | None | Guidance / advisory | Statutory duty with a deadline and a named person |
| **Budget existence** | No line item exists | Contested discretionary line | Ring-fenced, non-discretionary |
| **Sales cycle** | 18m+ enterprise/tender | 3–9 months | Weeks, one signature |
| **Loc8 fit** | Core mechanism inverts | Works but not differentiated | Density + zero-infra + LoRa all advantageous |
| **Reachable solo, no capital** | Requires certification/clearance/capital | Requires channel partner | Direct, today |

## Tier A — Pursue

| Market | Pain | Forcing | Budget | Cycle | Fit | Reachable | **Total** |
|---|---|---|---|---|---|---|---|
| **UK agricultural & county shows** | 5 | 2 | 3 | 5 | **5** | **5** | **25** |
| **UK greenfield festivals 5–50k** | 4 | 3 | 2 | 3 | 5 | 4 | **21** |
| **Security contractors (channel)** | 3 | 3 | 4 | 3 | 4 | 4 | **21** |
| **Enhanced-tier outdoor attractions** (racecourses 61, zoos/parks 386, large visitor attractions) | 3 | 4 | 3 | 3 | 4 | 3 | **20** |

**Agricultural shows — why it wins.** Lost children are the dominant incident type and radio cannot solve them; the Safety Advisory Group reviews the lost-child plan; sites are greenfield with poor rural cellular; density is festival-grade at ~17,500/show day `[DERIVED]`; the buyer is a Show Secretary who signs personally; the sector is not collapsing the way festivals are; and **no vendor was found serving it**. *Caveat, stated plainly: no per-show budget figure exists in the corpus. This is a proof-and-reference engine, not a revenue plan.*

**Festivals — why second, not first.** Best technical fit of any market examined — 360 greenfield sites, cell networks that collapse at exactly peak demand, crowd density that makes 5–20m relay work *better*. But: contracting 26–34% from peak; the displaceable radio budget is ~£0.8m nationally; radio is a **licence condition**, so Loc8 is purely additive; three-stakeholder sale (Head of Security specifies, Production Manager procures, Festival Director signs) plus a SAG with veto and no budget; and Halo already holds the flagship references.

**Security contractors — the leverage play.** One signature, many sites, repeat budget. Sell as tender-winning differentiation, never as a headcount reducer — guarding firms bill labour on thin margins and are structurally hostile to anything that reduces steward-hours.

**Enhanced-tier outdoor attractions.** Year-round operation converts per-event revenue into annual subscription. 1,422 sites at 100% enhanced tier `[HARD DATA]`. Guest-experience budget can fund the consumer app while the safety budget funds Guard — the only segment where the dual product is a genuine structural advantage.

## Tier B — Later, conditionally

| Market | Score | The condition |
|---|---|---|
| **UK indoor enhanced-tier venues** (4,868) | 15 | Encryption shipped + reference deployments. Note: Green Guide **requires a licensed frequency**, and BLE is unlicensed 2.4 GHz — Loc8 can structurally never be the certified *primary* comms system at a designated ground. Supplementary layer only `[HARD DATA]` |
| **Construction / large industrial** | 14 | Physics: 7 hops × 5–20m = **35–140m** end-to-end, against sites 200–500m across with ~50m mean worker spacing `[DERIVED]`. Chain does not close without Anchors. Prelims (5–15% of contract) are **priced at tender 6–24 months out** — a mid-project sale comes out of contractor margin |
| **Germany, via Sicherheitskonzept consultants** | 13 | Encryption is a hard gate (a German DPO will not clear unencrypted location data). Sell to the ~dozens of consultants who author §43 documents, not to venues. Works-council co-determination (BetrVG §87(1) no.6) adds months for anything tracking staff |
| **Netherlands, via veiligheidsplan** | 12 | The mandatory *communicatieplan* is a genuine door — in each of 342 municipalities |
| **MOD Guard Service / defence estate** | 12 | This is **not a defence product**. It is Loc8 Guard sold to a government facilities customer. Cyber Essentials is the only prep needed, and it is cheap and helps every other UK public-sector sale |
| **Military training exercises** | 12 | Uncontested electromagnetic environment, so the emissions objection evaporates. Unit training budget, fast local decision, small cheque. Opportunistic only |

## Tier C — Do not pursue (and why)

| Market | Killer | Kind |
|---|---|---|
| **Underground mining** | 30 CFR §23.7 requires battery cells in an explosion-proof, locked or sealed compartment. **A consumer smartphone can never qualify.** MSHA's own spec mandates readers at ≤2,000ft intervals with 24h standby — i.e. the infrastructure Loc8 exists to avoid. UK Mines Regs 2014 reg 16 requires only a *written record* | Permanent, physics + law |
| **Offshore oil & gas** | ATEX/IECEx bans uncertified handsets in Zone 1/2. A muster/POB system is almost certainly a **SECE** under SCR 2015 (which expressly includes *"computer programmes"*), requiring an independent competent verifier. 221 UKCS installations, ~105 POB each — sparse, steel, no crowd | Permanent |
| **Front-line defence / tactical** | **Project CAIN was awarded to Persistent Systems in March 2026.** Incumbents ship dual-layer FIPS/NIAP/CSfC crypto + anti-jam libraries at no extra cost. FIPS 140-3 validation averages **~19 months** before Loc8 is merely *eligible* to bid. And continuous unencrypted 2.4 GHz broadcast is the inverse of emissions-control doctrine — see §6 | Permanent for a bootstrapper |
| **Prisons / detention** | Prisoners do not carry phones — **that is the security model**. A staff-only mesh is 20–40 officers across concrete and steel: no crowd to relay through. Duress needs deterministic cell-level answers; Pinpoint hardwires deliberately and Actall markets explicitly *against* RF triangulation. Two independent vendors, two continents, same conclusion | Permanent, physics |
| **Lone worker** | **A lone worker has no peers.** The mesh's core mechanism fails at precisely the use case with the biggest budget. The cheque buys escalation to police via a BS 8484 ARC with a police URN — a people-and-process asset Loc8 does not have | Permanent, definitional |
| **Cruise / maritime** | Carnival, RCG and MSC 100% Starlink fleetwide since 2024. Princess ships carry ~7,000 readers and sensors each; MSC Meraviglia has 3,050 beacons and a **paid** family locator. 2.4 GHz suffers ~20–25 dB per steel bulkhead and **reaches only one deck** — and muster is the vertical problem. Four buyers globally | Permanent, physics + incumbency |
| **US regulated sports grounds / stadiums** | Permanent infrastructure, full wifi and cellular, established radio, statutory SGSA regime, tiny site count. Loc8's entire advantage is absent. SAFETY Act works *against* you: deploying a non-approved product into a designated venue arguably erodes the venue's own liability protection | Permanent |
| **Theme parks** | Alton Towers: ~12,500 guests/day across 910 acres = **~17m mean spacing** vs ~4m at a festival — ~17× sparser by area `[DERIVED]`. Code Adam is a zero-capex process with a near-100% success rate. The "11 children a day go missing at Disney World" statistic is a **content-farm fabrication** with no primary source `[REFUTED]` | Permanent, density |
| **Warehouse / logistics** | Struck-by-moving-vehicle does not reach 10% of non-fatal injuries in Transport & Storage; the *entire* UK addressable death toll is **~3.5/year** `[DERIVED]`. Volume injuries are slips (32%) and manual handling (21%) — Loc8 addresses neither. Collision avoidance needs sub-second, sub-metre; Loc8 is seconds and 5–20m. Do not sell as collision avoidance under any framing — the liability is existential | Fit + liability |
| **Ski / mountain** | The people who most need finding are **by definition away from the crowd**. Skiers move 30–60 km/h. RECCO is passive, battery-free, sewn into jackets, penetrates 20m of packed snow, used by 700+ rescue groups since 1983. Never claim the avalanche-burial case. UK mountain rescue: 48 charities, £0 government funding | Permanent, inverted density |
| **Transport hubs** | **Excluded from Martyn's Law by Schedule 2** `[HARD DATA]`. TfL has wifi at *all* Tube stations and mobile signal at 50% of below-ground stations. TETRA Direct Mode Operation already does infrastructure-free multi-hop relay — Loc8's headline differentiator is a documented standard feature of the incumbent | Permanent |
| **Healthcare campus** | Cal/OSHA §3342 requires alerting to the *location* of a threat — room-level. Incumbents (CenTrak, Securitas Healthcare) build on **infrared precisely because IR is blocked by walls**, making a badge read proof of room. Loc8's radio propagates through walls **by design**. Assaults cluster at night in lone-working situations — no crowd to relay through | Permanent, inverted physics |
| **US K-12 / Alyssa's Law** | The mandate specifies a **wearable staff panic button wired directly into the 911 PSAP** delivering room-level location. Loc8 has no internet path by design, no room resolution, no encryption. Meanwhile 44 states have cellphone bans or policies (22 + DC bell-to-bell) — the market is **systematically removing the devices the mesh depends on** | Permanent |
| **UK schools** | Price anchor is a **£194 one-off siren**. No categorical safety funding exists. Selling a subscription at 40× the reference price with no forcing function | Commercial |
| **Nightclubs / bars** | German music clubs average **250 capacity**; jazz clubs 140. In one 250-person room you can see across it. Multi-hop relay has no job. 26% of British towns that had a nightclub in 2020 now have none | Permanent, scale |
| **Hajj / Kumbh / mass religious** | The 2024 Hajj toll (1,301) and 2025 Kumbh missing (1,500) were concentrated in **unregistered or unenrolled people** whom a roster-based muster would never have named. Sovereign procurement, incumbent state platforms (Nusuk: 51m users), unreachable for a pre-revenue UK company | Permanent |
| **Disaster / humanitarian** | Loc8's density assumption **inverts**: disaster response is a small number of responders spread thinly. Starlink direct-to-cell connected 27,000+ phones after Helene and Milton and restores *real* connectivity. goTenna already holds 350+ agencies with purpose-built radios | Permanent, inverted density |
| **Film / TV production** | Sets run on **voice** push-to-talk. Crew phones are often confiscated for leak control. TPN/MPA content-security assessment gates the studio tier. Ceiling: ~£616k/year for 100% of every qualifying UK production `[DERIVED]` | Fit |
| **Retail / corporate campus** | Saturated wifi and cellular — the zero-infrastructure advantage is worth nothing. A £5/user/month BS 8484 app that escalates to a 24/7 ARC **beats Loc8 on the merits** for a retail SOS use case | Fit |

---

# 4. WHERE THE MONEY IS BEING LEFT ON THE TABLE

Prioritised. All achievable without capital.

### 1. Ship Guard and Command over TLS, now. Do not wait for the mesh.

The apps exist. Named muster, SOS dispatch, incident log and tamper-evident record are transport-agnostic. On any connected site they need **no Anchors, no Gateway, no LoRa, no BLE encryption, no CE marking, no radio certification**. Encryption over TLS is solved by default, which removes the hardest objection in every buyer conversation.

**Value: an invoiceable product this quarter instead of next year.** This is the largest single item in this document.

### 2. Sell to security contractors, not to events.

One signature covers dozens of sites with a repeat operating budget. **Value: 10–30× the sites per unit of founder time.**

### 3. Agricultural and county shows — ~7m attendees, zero vendors found.

Cheapest sale in the corpus. No procurement, no PQQ, no security review, no incumbent. **Value: the reference case studies that open every subsequent door, at fuel cost.**

### 4. Publish the measurement nobody has.

Measured cellular failure and mesh performance at real festival density does not exist in public sources anywhere in Europe — the research looked specifically. **Value: an asset no competitor and no market-research firm owns, produced at an event you are already attending.**

### 5. Reframe the Anchor from "listener" to "elevated LoRa backhaul."

The physics finding in §6 is that elevating BLE destroys the capture effect that makes the whole system work. But it does **not** apply to anchor-to-anchor LoRa, where there are tens of nodes and line-of-sight is the entire game. A LoRa relay on a 9m mast makes the 1–3km figure far easier to hit. **Value: a real, cheap, buildable win — and it is the one genuine insight from the mobile-form-factors research.**

### 6. Build the body-worn steward Anchor before you build the pole-mounted one.

Loc8 Guard already puts an app on every steward. Stewards are distributed exactly where the crowd is — that is what stewarding *is* — and they move toward incidents by definition. A 200–300g shoulder-worn anchor at ~1.5m on 40 stewards gives 40 mobile elevated anchors: zero deployment cost, no CAA, no mast, no ground penetration, powered by a USB-C powerbank. Critically it sits at head height — high enough to clear the worst body attenuation, low enough to preserve the near-far capture ratio. **Value: strictly better than any airborne option, at a fraction of the cost, prototypable from parts you already have.**

### 7. Take marketing money for the consumer app — but never let it become the account.

A telecom, beverage or bank brand funding "find your friends" is a sponsorship sale to VP Partnerships, out of a larger and faster-moving budget than safety. Nobody audits an activation's encryption. **Value: real cash for a product that will never generate subscription revenue.** The trap: marketing money renews on engagement metrics Loc8 will never win, and evaporates the first bad year.

### 8. Correct `business-model.md` before an investor does.

~£144m of a stated £460m reachable TAM rests on a festival count no source supports. **Value: credibility, which is the whole distribution strategy in a small, gossipy profession.**

### 9. Get Cyber Essentials.

A few hundred pounds. Unlocks NHS DSPT conversations, DIO/MOD Guard Service estate work, and every UK public-sector and enterprise tender. **Value: disproportionate to cost.**

### 10. Design the Anchor around a pre-certified BLE+LoRa module. Decide this before any PCB work.

47 CFR §15.212 modular approval lets the end product inherit the module's grant `[HARD DATA]`. For a company renting ~£65 poles, this is the difference between a viable hardware line and one whose certification cost exceeds its first two years of hardware revenue. **Value: potentially the entire hardware business.**

---

# 5. COMPETITIVE LANDSCAPE

## 5.1 The direct incumbents

| Company | Position | Financials | Threat |
|---|---|---|---|
| **Halo Solutions** (UK) | Event safety incident management. Ex-police founder, Manchester Arena origin story, King's Award. Glastonbury, Notting Hill Carnival, ExCeL, NEC, several football clubs. Reported 2,500+ events, 88,000 incidents in 2023 | **£1 cash** at 31 Dec 2024. 12 staff. £1,045,684 accumulated deficit. £1,060,460 raised in ten years. ~£660k/yr loss rate `[HARD DATA — CH 09330491]` | **High on positioning, low on capital.** Already occupies Loc8 Command's exact "operational memory / black box" position, with a better origin story |
| **Crowd Connected** (UK) | BLE/wifi attendee location at festivals. Coachella, Roskilde, Creamfields, Lowlands, Sziget, Outside Lands | Net assets £696,136; **~£407k profit in 2024**; small-company exempt accounts for 12 consecutive years `[HARD DATA — CH 08417106]` | **Moderate.** Different job (organiser analytics, not staff muster) but the same technology at the same venues, and the only public price in the category |
| **Bridgefy** | Offline BLE mesh **SDK**. Explicitly markets to *"concert and music festival apps"* and *"sports stadium apps"* | No prices published. Pricing page still contains unreplaced **Lorem ipsum**. Press wall stops in 2022 | **Highest immediate threat, and a stalled company.** A festival with an existing app can license the SDK instead of buying Loc8. Your answer is muster and the audit log, which an SDK does not provide |
| **Meshtastic** (open source) | LoRa mesh firmware | 7,949 GitHub stars, 2,554 forks, commit pushed the day this research ran. Finished nodes **$45–$75** | **Structural, on hardware margin only.** Never sell Anchors as hardware — rent them with an SLA and a control-room app attached |
| **24/7 Software** | US stadium incident management, described as the industry standard | Quote-only | Low in UK |
| **Everbridge** | Enterprise critical event management / mass notification | US$449m revenue (2023); acquired by Thoma Bravo for **US$1.8bn** (~4.0× revenue) | Different tier. **Integration partner, not competitor** |
| **Peoplesafe** (UK) | Lone worker, BS 8484 ARC, 375,000 employees protected | **£18.0m turnover, 86.4% GM, 30.1% operating margin** `[HARD DATA — CH 04107459]`. Group £22.5m, 53% adj. EBITDA, PE-owned | The UK ceiling case. Also the pricing anchor: **~£48/user/year derived** — and that *includes* a manned alarm centre Loc8 lacks |
| **Blackline Safety** | Connected worker safety, gas detection | CAD$150.5m revenue FY2025; ARR CAD$93.0m; acquired by Francisco Partners at up to **CAD$850m = 8.88× trailing ARR on cash** | The mandated-compliance case. ~CAD$564/worker/year — but that is legally required equipment. **Do not model Loc8 on this** |
| **CENTEGIX** | US K-12 wearable panic badges, 15,000+ sites | Private-equity backed (Charlesbank, Aug 2025) | Not in UK. Note the cautionary detail: Charlotte-Mecklenburg **terminated a $1.7m contract** because badges and beacons stopped working — RF reliability inside buildings at scale |

**Named in the brief but not real competitors:** Vuemont (parked domain / a London lettings company / US HOAs), YellowScan (drone LiDAR survey hardware), "D5" (no match found). **Three of six vendors in the working competitive map do not exist in this market** `[HARD DATA]`.

## 5.2 The graveyard — who died and why

The single most important pattern in this corpus:

| Company | Fate | Cause |
|---|---|---|
| **FireChat** | Dead. Apps unupdated since 2018; website returns errors | Reached genuine scale in genuine emergencies — ~40,000 downloads in Iraq (2014), 131,000 uses in Catalonia in one day (2015) — and still could not survive. **Demand spikes, no revenue model** |
| **goTenna** | Left consumer market **March 2017**. Raised $24m (equity + debt) 2019. Survived on SBIR contracts ($15m AFWERX 2024). **Acquired by Forterra, 9 Oct 2025, terms undisclosed** — 13 years to an unremarkable exit | Consumer mesh could not sustain a business. Note: undisclosed terms after 13 years is a soft landing, not a win |
| **Beartooth** | Survived only by abandoning consumers and repricing into tactical/ATAK: **$1,249/radio, $25,000 for a 10-operator kit** | Consumer price point failed |
| **Somewear Labs** | Same pivot: outdoor satellite → SOCOM drone command-and-control | Same |
| **Bridgefy** | Gave up owning users; now licenses an SDK behind a pricing page containing Lorem ipsum | Same |
| **Sonnet** | Site serves an empty body (200 OK, no content). Status unconfirmed | — |

**Five of five survivors pivoted to defence or government. The one pure consumer play died.**

The mechanism is identical every time and applies to Loc8's free app without modification: **mesh utility requires density; density requires free; free produces no revenue.**

And the contrast case is decisive: **Silvus** — which went straight at defence MANET and never had a consumer product — was acquired by Motorola in a deal so large that Motorola issued **US$1.5bn of term loans** to fund it `[HARD DATA]`. Same underlying technology. Wildly different outcomes. The difference is focus and customer.

Loc8 currently plans to run a free consumer app, Guard, **and** Command simultaneously, on an unproven radio, with no encryption. That is three go-to-market motions on one unfinished stack. **The dataset punishes companies that ran two at once.**

## 5.3 Exit comparables

| Deal | Multiple | Confidence |
|---|---|---|
| Everbridge → Thoma Bravo, US$1.8bn | **~4.0× revenue** | `[DERIVED]` |
| Blackline → Francisco Partners, CAD$804m cash | **8.88× trailing ARR** (9.39× including a contingent value right that requires ~60% ARR growth by Oct 2027) | `[DERIVED]` |
| Blackline, same deal | 5.34× FY2025 revenue | `[DERIVED]` |
| Life360, public | EV/Revenue 8.07× at US$4.42bn market cap | `[HARD DATA]` |
| goTenna → Forterra | Undisclosed | `[NOT FOUND]` |
| Silvus → Motorola | Undisclosed | `[NOT FOUND]` |

**Likely acquirer:** Motorola Solutions made four acquisitions in 2025 totalling **US$4.9bn net of cash** `[HARD DATA]`, has a Software & Services segment at US$4,429m growing 13%, and already owns Rave Mobile Safety and Silvus. Peoplesafe's PE owner and security services groups are the other plausible routes.

---

# 6. THE FRONTIER

## 6.1 Defence and tactical — close the line

**Real:** the market exists and is well funded. Persistent Systems' MPU5 carries dual-layer FIPS/NIAP/CSfC-approved encryption plus a DoD-assessed anti-jam library (Wave Relay IRD), **supplied at no additional cost**, and has demonstrated 38 hops over 50km subterranean `[HARD DATA]`. Silvus StreamCaster spans 300MHz–6GHz at up to 20W (80W effective with beamforming), 4×4 MIMO, AES256 with FIPS 140-3 Level 2, scaling to 550+ nodes `[HARD DATA]`.

**Fantasy for Loc8, for four independent reasons:**

1. **The door is already shut.** UK MOD **Project CAIN** — dismounted tactical mesh, the requirement shaped most like Loc8 — was awarded to Persistent Systems, delivered via Steatite. An **initial US$10.8m order** was announced 30 October 2025; the MOD selection was announced 10 March 2026 as a *"multi-million dollar contract"* with no figure disclosed `[HARD DATA]`. The winning structure was mature US technology plus a UK distributor.

2. **The certification gate is longer than your runway.** FIPS 140-3 validation averages **~19 months**, with a CMVP queue reported at 12–18 months — before any development work `[HARD DATA]`. Loc8 has no encryption at all today. And adding strong crypto pulls the product into ECCN 5A002/5D002 export control, creating obligations that do not exist today.

3. **The physics runs the wrong way, and this is the fundamental point.** Loc8's thesis is that density of emitters is a feature. In a contested electromagnetic environment that thesis **inverts perfectly**: density of unencrypted emitters is a targeting dream. BLE has been demonstrated connecting at **2.3km** with the right front end `[UNVERIFIED — vendor field demo]`, while Loc8's mesh only functions at 5–20m per hop. Every phone transmits continuously, audibly for kilometres, to achieve twenty metres of useful reach.

   Meanwhile both sides in Ukraine are physically spooling **fibre-optic cable up to 100km** onto FPV drones specifically to stop emitting `[HARD DATA — multiple sources]`. Loc8 would be pitching maximum emission into a market that has concluded emission is lethal. A mobile phone's RF emissions were publicly blamed for enabling a mass-casualty strike (Makiivka, January 2023) `[HARD DATA — Russian MoD statement, toll contested 63/89 vs Ukrainian claim ~400]`.

4. **Structural mismatch.** A hardware-rental, per-site-subscription business with UK-first, self-funded economics cannot absorb procurement cycles the National Audit Office describes as systemically delayed.

**The two things worth keeping:**

- **Military training exercises.** Uncontested electromagnetic environment, so the emissions objection evaporates entirely. No classified data, so no crypto certification, no export licence, no vetting. Small cheques from unit training budgets with fast local decisions. And the use case is exactly what Loc8 already built — dispersed people, no infrastructure, and a muster that **names** who is missing at endex rather than counting heads.
- **DASA**, at £100,000–£350,000 per Rapid Impact bid `[HARD DATA]`. Non-dilutive money that could fund the encryption work Loc8 needs for its commercial products regardless. **But it is a grant, not a customer.** It proves nothing about willingness to pay and creates no subscription revenue.

**Export control, if encryption ships.** Category 5 Part 2 / ECCN 5A002. Relief exists: License Exception ENC gives immediate authorisation after self-classification; the **mass-market Note 3** route reclassifies a consumer app to 5A992 and strips EI/NS controls; the UK OGEL for information security items is free to register for `[HARD DATA]`. **The trap is only a trap if discovered late** — it constrains key-management architecture, which is cheap to change now and expensive after the Gateway exists.

## 6.2 Mobile form factors — the link-budget reality

### Drone-mounted BLE anchor: **kill it.** And note *why*, because the obvious objections are all wrong.

**Weight is a non-issue.** ~60–100g total (nRF52840 module 1–2g, PCB+regulator ~10g, patch antenna 10–20g, enclosure 30–50g, 1000mAh LiPo ~20g) `[DERIVED]`.

**Range is a non-issue.** The uplink from a phone on the ground to a node at 100m **closes with +11.8 dB margin** `[DERIVED]`, because the path to the sky is unobstructed:

| Term | Value |
|---|---|
| Phone TX EIRP | +4 dBm `[ESTIMATE]` |
| Body/pocket loss upward | −12 dB `[ESTIMATE]` |
| FSPL at 100m, 2.44GHz | −80.2 dB `[physics]` |
| Down-facing patch antenna | +6 dBi `[ESTIMATE]` |
| Feed loss | −1 dB |
| RX sensitivity (nRF52840-class) | −95 dBm `[ESTIMATE]` |
| **Margin** | **+11.8 dB** |

**It dies on collision physics.** Lifting a BLE receiver to 100m does two things simultaneously, both fatal:

1. **Footprint multiplies ~13.9×** — 39,270 m² vs 2,827 m² for a ground anchor `[DERIVED]`.
2. **The near-far ratio flattens from 28.1 dB to 3.5 dB**, destroying the **capture effect** — the only reason ground-level BLE works in a dense crowd. BLE co-channel capture needs roughly 8–11 dB `[ESTIMATE from Core Spec C/I requirements]`.

At ground level one transmitter always dominates and gets decoded. At altitude every phone arrives within 3.5 dB of every other and they annihilate each other:

| Devices in footprint | Packet success | Each device heard once per |
|---|---|---|
| 5,000 | 3.8% | 27 seconds |
| 10,000 | 0.14% | **12 minutes** |
| ~19,700 (realistic large festival) | 2.4×10⁻⁶ | effectively never |

All `[DERIVED]` — unslotted-ALOHA success = e^(−2G), packet structure per Bluetooth Core Spec.

**This is geometric, not an implementation flaw.** No antenna, no firmware, no protocol change fixes it. **Higher is strictly, monotonically worse.**

**And it is not merely useless — it is harmful.** The airborne node also *transmits* across all 39,270 m², colliding with the ground-level phone-to-phone mesh across the whole site. Adding a drone would **measurably degrade the product that already works.**

**The generalisable lesson, worth internalising as a design principle:** Loc8's mesh works *because* radio range is short and the crowd is lossy. Density and attenuation are not obstacles the product overcomes — they are the mechanism that makes it function. **Every instinct to "improve" Loc8 by making a node hear further is an instinct to break it.** Be suspicious of anyone, including yourself, who proposes more range.

The drone concept survives **only** where the crowd is sparse — dispersed search-and-rescue over empty ground. Different product, different buyer, 18-month cycle. Do not let it into the roadmap.

### Where altitude genuinely helps: elevate the backhaul, never the listener.

The collision argument concerns BLE with thousands of contending transmitters. It does **not** apply to anchor-to-anchor **LoRa** backhaul, where there are tens of nodes on a low-duty-cycle protocol and line-of-sight is the entire game. Get a LoRa relay to 9m and the 1–3km anchor-to-anchor figure becomes far easier to hit. Cheap, buildable, real.

### Tethered drone vs mast: the mast wins decisively.

| | Elistair Khronos | Clark Masts ST |
|---|---|---|
| Height | **60m** (not the 100m people assume) | 9m |
| Payload | — | **30kg** (~30× more than a sub-1kg Anchor needs) |
| System weight | 32kg | — |
| Aviation regulator | Yes | **No** |
| Remote pilot on site | Yes | No |
| Weather abort | Yes | No |
| Failure mode | Falls into a crowd | Stops working |
| Price | Quote-only | Quote-only |

`[HARD DATA]` for specs; `[NOT FOUND]` for both prices. Clark Masts range extends to Series 90 at 50m/300kg. The tethered drone's only real advantage is needing no ground penetration — which matters on unprepared disaster ground, not at a festival with a site plan.

**Note the market signal:** Elistair, Rajant and Clark Masts all publish zero prices and route to a sales email. This is a quote-only, sales-engaged, long-cycle category.

### Vehicle-mounted Gateway: genuinely viable, but sell it on height, not mobility.

The advantage is that a roof mount puts the antenna at ~1.8–2.5m on an excellent metal ground plane, clearing the body-attenuation layer. Security and event operations already have vehicles on site with 12V and roof racks, so deployment cost is near zero.

Three engineering requirements that will otherwise bite, in order of severity:

1. **Engine-off drain.** 25W on a 60Ah/720Wh battery = 29h to flat but only **~14h to the safe 50% state-of-charge limit** `[DERIVED]`. Mandatory low-voltage disconnect at ~11.8V, or better an isolated ~100Wh LiFePO4 pack charged only when the alternator runs. *Get this wrong and you strand a customer's security van at 3am, which ends the relationship permanently.*
2. **Thermal.** Sealed box, no airflow, ~30W solar gain on a 0.03m² dark top face at peak irradiance plus ~25W internal; a Pi throttles at ~80–85°C `[DERIVED]`. Finned aluminium with a thermal pad to the case wall. *A sealed ABS box throttles on the first sunny day of the first festival — precisely when the customer is watching.*
3. **12V is not 12V.** 9–36V wide input with ISO 7637-2 transient suppression, not a cigarette-lighter adapter.

### Robots (Spot, Ghost): not serious. `[ENGINEERING JUDGEMENT — pricing NOT FOUND]`

~90 minute runtime, dedicated operator, multiples of a mast in cost, and it places a very expensive asset in a crowd of intoxicated people. Anything a quadruped could do here, a steward with a 300g shoulder anchor does better, cheaper, for a whole shift.

### Priority order for form factors

**Body-worn steward anchor > vehicle Gateway (sold on height) > elevated LoRa backhaul on a cheap mast >>> [large gap] >>> tethered drone (unprepared ground only) >>> free-flying drone and aerostat (never, for crowds).**

---

# 7. THE BEACHHEAD RECOMMENDATION

## The market: UK agricultural and county shows

### Why

**It is the only market in the corpus where all three of Loc8's differentiators are simultaneously advantageous.** Crowd-as-network (~17,500 attendees per show day `[DERIVED]`, festival-grade density). Zero infrastructure (greenfield sites, genuinely poor rural cellular). Anchor-to-anchor LoRa at 1–3km (open ground is exactly where it earns its keep, unlike a compact built-up park or a steel-framed building).

**The pain is named, specific, and radio cannot solve it.** Lost children are the dominant incident type. That maps precisely onto "muster roll-call that NAMES who is missing" — the one capability no incumbent in the entire corpus sells.

**It is uncontested.** Halo and Crowd Connected are at Coachella, Roskilde, Creamfields, ExCeL, Glastonbury. **No vendor was found at an agricultural show.** You are not displacing an incumbent with a decade of references and a King's Award.

**The buyer is one phone call.** A Show Secretary or Chief Executive of a show society, frequently prompted by the local Safety Advisory Group which reviews the event plan and can effectively require a lost-child provision. No procurement, no PQQ, no CHAS/Constructionline gate, no group IT security review. Compare a Live Nation deal: 12–18 month group procurement, effectively closed to a pre-revenue supplier.

**The sector is not collapsing.** Festivals are down 26–34% from peak. Shows are not.

**Recurrence is structural.** Show societies run the same event every year with the same committee. Renewal is calendared, not re-argued from zero the way a promoter's production budget is.

**Two independent research lines surfaced this market unprompted.** That is the signal.

### The honest caveats

No source in the corpus gives a per-show budget, a show-society P&L, or a comms spend figure. That is a genuine `[NOT FOUND]` and it is the **single most important number to acquire**. ASAO's membership figure is contested (60+ vs 250+) and "400 show days" counts days, not shows. Shows are poorer than festivals, which are themselves poor.

**Do not build a financial plan on this. Build a proof and reference engine on it.**

### Pricing

- **£750–£1,500** for a single-day county show
- **£3,000–£5,000** for a multi-day Royal Highland / Great Yorkshire scale event

`[DERIVED]` — anchored to Crowd Connected's £4,500 activation and AttendIQ's £4.50–£7.00/worker/month, discounted for a poorer buyer.

At 250 societies and a £2,000 blended price, saturation is ~£500k/year; a realistic 10–15% over three years is **£50–75k** `[DERIVED]`. That is not a business. It is *runway plus reference logos plus a proven mesh* — precisely what a beachhead is supposed to deliver.

## The first 100 days, at near-zero cost

1. **Build payload encryption.** Not a roadmap item — a precondition for every subsequent step, and a SAG will ask about it in the first meeting on a product handling named children.
2. **Prove the multi-phone relay matrix** — iOS + Android, backgrounded, 20+ handsets, screens off. Everything else is conditional on this.
3. **Run one show for free.** One mid-sized county show, founder on site, Guard on the stewards, muster demonstrated at close. Cost: fuel. Output: the case study that opens every other door in the sector.
4. **Do not build the Gateway or Anchors yet.** Phone-only Guard plus muster is sellable at show scale. Hardware is capital you do not have.
5. **Get the missing number.** Four calls to Show Secretaries asking what they currently spend on radios, stewards and lost-child provision. That single action closes the largest gap in this entire corpus.

## The sequence after it

**Pin 2 — UK greenfield festivals, 5–20k (~110 events `[DERIVED]`).** Same buyer psychology, same greenfield physics, adjacent trade body (AIF, ~150 members). The show reference is the credential. Add the Martyn's Law framing here — festivals are 975 sites and **100% enhanced tier**.

**Pin 3 — the security contractor channel.** Showsec, G4S Events and equivalents. One signature reaches dozens of sites. This is where per-site subscription revenue actually starts.

**Pin 4 — enhanced-tier outdoor attractions.** Racecourses (61), zoos and theme parks (386), plus the large-footprint slice of 1,561 visitor attractions. Year-round operation converts per-event revenue into annual subscription. ~2,000 sites × £1,490 = £3m at saturation; 5% = £150k recurring `[DERIVED]`.

**Pin 5 — UK industrial / lone-worker-adjacent.** Peoplesafe demonstrates £18.0m turnover at 86.4% gross margin on ~£48/user/year `[HARD DATA + DERIVED]` — the only proven near-nine-figure economics in the UK corpus. It requires an accredited ARC you do not have. **Note the shortcut precedent: Blackline holds BS 8484 for *device only*, white-labelling the ARC** `[HARD DATA]`. That converts a multi-year infrastructure build into a commercial agreement. This is why it is pin 5, not pin 1.

---

# 8. THE PRODUCT LADDER

| Rung | Product | Price | Revenue role |
|---|---|---|---|
| **0** | **Free consumer app** | £0 | **Not a revenue line.** Life360 earned ~US$4.70/MAU/year and needed ~48.6m MAU to reach US$228m `[DERIVED]`. Loc8 will never have that density. Jobs: mesh density at Guard sites, a two-minute demo that makes a safety officer believe, and a sponsorable activation. Costed as marketing, forever |
| **1** | **Loc8 Guard**, per-event, connected | **£1,200–£3,000/event** | 100–300 stewards, SOS, dispatch, named muster. Anchor against **stewarding labour** (~£216k for a 50k/3-day festival), not radio hire. £1,500 = 0.7% of that line |
| **2** | **Loc8 Command**, per-site annual | **£900–£3,000/site/year** | Control-room incident log, muster board, tamper-evident record. £900–£1,500 standard; £3,000–£5,000 stadium/arena with multi-seat Command. **Constraint:** £1,490 is 28.6% of an enhanced-tier site's entire modelled annual compliance envelope `[DERIVED]` |
| **3** | **Multi-site framework**, via contractor or venue group | **£15,000–£60,000/year** | 20–50 sites at £750–£1,200 each. One signature, one procurement, one security review. **This is where it becomes a business** |
| **4** | **Hardware-attached**, greenfield only | **+£3,000–£8,000/event** or **+£4,000–£10,000/site/year** | Gateway + Anchors, **rented**. Only where infrastructure genuinely does not exist: greenfield festivals, agricultural shows, racecourses, large outdoor attractions, construction. Rental keeps it in opex, below capital-approval thresholds |
| **5** | **Defence / tactical** | **£0** | **Do not build it.** See §6.1 |

### Rungs deliberately absent

Cruise, mining, oil and gas, prisons, lone worker, US K-12, healthcare — each closed for a structural reason set out in §3, none of which is fixable by product work.

### The pricing rule

Blackline's ~CAD$564/worker/year is **legally required equipment**. Loc8 Guard is software on a phone the buyer already owns. The honest comparables are **Peoplesafe at ~£48/user/year** (which *includes* a manned ARC) and **Zello Work at US$8–15/user/month list**. Any model assuming Blackline-like ARPU is wrong by roughly 5×.

**The money comes from the site subscription and hardware rental. Leave per-seat pricing alone.**

---

# 9. MOAT AND EXISTENTIAL RISKS

## 9.1 Start from the truth: there is no technical moat.

Three patent applications failed on prior art. Multi-hop BLE relay is solved, published and open-source. Meshtastic's firmware repo has 7,949 stars and 2,554 forks with a commit landing the day this research ran `[HARD DATA]`. Bridgefy licenses an SDK naming festivals and stadiums as target use cases `[HARD DATA]`. **Assume the code is copyable in a quarter.**

That is survivable. Peoplesafe turns over £18.0m at 86.4% gross margin with no patents and no unique technology. Its moat is accreditation, a police URN, and twenty years of local-authority relationships.

## 9.2 The network-effect myth must die first.

Take a 30,000-capacity greenfield festival on ~400,000 m² (~100 acres):

| App adoption | Participating phones | Mean spacing | Chain closes? |
|---|---|---|---|
| 5% | 1,500 | ~16m | Barely (5–20m hop range) |
| 1% | 300 | ~37m | **No** |

`[DERIVED]`. **You need roughly 5% of a specific field on a specific weekend, cold, with no marketing budget, or the product does not function.**

And that density **does not accumulate**. A Life360 Circle is persistent. Loc8's "network" is 1,500 strangers in a field who uninstall on Monday. Next weekend: different field, different 30,000 people, back to zero. There are 44 UK festivals at 20,000+ capacity `[HARD DATA]`. **Winning all 44 does not make the 45th easier, because the users are not shared.**

**Conclusion: the free consumer app is a per-event bootstrap cost, not a moat.** Any deck claiming network effects claims something the geometry does not support.

## 9.3 What is actually defensible, ranked

**1. The evidentiary record, as records-retention lock-in (strongest).** The moat is not the muster feature — it is what happens after eighteen months of it. A venue whose SAG submission, insurer file and post-incident evidence chain all live in Loc8's audit log does not migrate, because migrating a legal record is a governance decision, not a procurement one. *This is the same mechanism that keeps venues on Halo despite Halo having £1 in the bank.* **Action: make retention and export the product. Sign multi-year retention terms. Make the log the thing the coroner reads.**

**2. Certification — but note the direction.** BS 8484, SAFETY Act, ATEX/IECEx and FIPS are all barriers *against* Loc8. The one worth chasing on a bootstrap budget is **Cyber Essentials** — cheap, and it unlocks NHS DSPT, DIO estate work, and every UK public-sector tender. BS 8484 is a different order of cost `[NOT FOUND — get a quote from NSI or SSAIB]` and requires an ARC you should not build.

**3. Installed hardware and venue relationships.** Rented Gateways and Anchors on poles create physical switching cost — someone has to climb them. This is also the answer to Meshtastic: commodity nodes at $45–75 undercut a £65 anchor *as hardware*, but nobody rents a hobbyist LoRa node with an SLA and a control-room app attached.

**4. Brand.** Worth nothing today. Worth something after the first named incident where Loc8 identified a missing steward and the safety officer says so publicly. UK event safety is a small, gossipy profession — reputation is the cheapest asset available to a bootstrapper and the slowest to build.

**5. Data.** Essentially zero, deliberately. The architecture keeps data off servers, which is a genuine GDPR sales advantage and a genuine moat disadvantage. **You cannot have both. Choose the GDPR story** — it is worth more against a venue DPO than an unusable proximity dataset is worth to anyone.

## 9.4 Existential risks, in descending probability

### 1. The mesh does not work. *(Highest probability, by a wide margin.)*

Multi-hop relay, backgrounded, across mixed iOS and Android at crowd density with screens off, is unproven. iOS pushes background advertising into the overflow area with a different encoding; Android's BLE stack fragments across OEMs. If the relay does not close at 5% adoption with backgrounded phones, there is no product and nothing else in this document matters.

**This is the only failure mode that is fully testable this month for approximately £0. Do it before anything else.**

### 2. Apple tightens background BLE. *(Low probability, existential.)*

Apple owns the substrate. A background-execution policy change in any iOS release could end the product overnight, with no appeal and no notice. Unhedgeable except by (a) not being iOS-only and (b) the Anchor hardware, which keeps working when phones stop relaying. **This is a genuine strategic argument for building Anchors sooner — they are the insurance policy, not the upsell.**

### 3. Apple or Google ship this natively. *(Lower risk than it feels — assess the architecture, not the branding.)*

**Find My is not an offline mesh.** A finder device detects a beacon and relays the sighting **via the internet** to Apple's servers. It is crowdsourced backhaul, not crowd-as-network. It cannot function at a festival with a saturated cell network — which is precisely Loc8's condition of use. AirTag inherits the same dependency.

**UWB is peer-to-peer, short-range, does not multi-hop**, and Apple's own spec notes availability varies by region `[HARD DATA]`. It cannot relay a message across a field and there is no architectural path by which it could. Where it genuinely *helps* is Loc8's weakest link — the Compass → Proximity → 🎉 endgame, where BLE RSSI is mushy inside the last 10m. Treat it as progressive enhancement, never a dependency. *Unverified and worth checking: whether Nearby Interaction runs in background or requires both devices in the same foreground app — the same iOS constraint that already threatens the BLE relay.*

**Apple's plausible move is narrower and still damaging:** better native precise-finding UX that makes the *consumer* app look redundant. That would hurt the free-app density bootstrap and leave Guard and Command untouched — another argument for treating the consumer app as marketing rather than product.

### 4. Bridgefy gets bolted into an existing festival app. *(Moderate.)*

The most immediate competitive threat, and it is not goTenna. A festival already running an app can license the SDK instead of buying Loc8. Countervailing: Bridgefy's pricing page still contains Lorem ipsum and its press wall stops in 2022. **The defence is not the radio; it is muster and the audit log, which an SDK does not provide.**

### 5. A funded competitor. *(Low — the evidence says nobody wants to fund this.)*

Halo: £1.06m raised over ten years, £1 cash. Crowd Connected: twelve consecutive years of small-company filings. goTenna: abandoned consumers in 2017, exited on undisclosed terms after thirteen years. **Capital flows to defence MANET and to mandated industrial compliance — not to UK event safety.**

---

# 10. POSITIONING

## What Loc8 must stop saying

- **"Offline mesh networking app."** Describes the mechanism, not the outcome. Puts you in a category (mesh comms) whose entire cohort died or fled to defence.
- **"Martyn's Law compliance."** ProtectUK explicitly disclaims third-party compliance products, and s.5 duties fall on staff procedures, not attendee apps. A briefed buyer will puncture it.
- **"Real-time location system" / "indoor positioning."** The moment a buyer builds a comparison matrix against Quuppa (sub-metre) or Ubisense (centimetre 3D), Loc8 loses on every row.
- **"Find your friends at a festival."** Reads as guest experience — a discretionary marketing line, and the first thing cut.
- **Any range claim borrowed from a vendor.** Bridgefy advertises 100m per hop; Beartooth advertises 30 miles. Loc8's honest 5–20m-in-a-crowd figure is the credible one, and honesty about it is a differentiator with a safety buyer who has been misled by radio vendors before.

## The category to define

> ### Crowd-Resilient Accountability
>
> **Knowing who is missing, by name, when everything else has failed.**

Three words, each doing work:

- **Crowd-resilient** — the system gets *stronger* as the crowd gets denser, which is the exact moment every other system degrades. This is a genuinely novel property and nobody else can claim it.
- **Accountability** — not communication. Radio does communication. Accountability is the named, evidenced, defensible answer to *"who is unaccounted for?"* — the question asked at every inquest and in every insurer's file.
- **When everything else has failed** — the honest and specific claim. Not "better comms." *The layer beneath the comms, that survives the comms.*

## Positioning statement

> **For** heads of safety at outdoor events and large venues
> **who** cannot answer *"who is missing?"* when the cell network saturates,
> **Loc8** is crowd-resilient accountability infrastructure
> **that** names the unaccounted-for and produces a tamper-evident record of it,
> **unlike** radio, which broadcasts to everyone and accounts for no one,
> **and unlike** incident-management software, which logs what you tell it and stops working when the network does.

## The three sentences that win the room

1. *"Radio tells you something is wrong. Loc8 tells you **who** is missing."*
2. *"Every other system on your site fails when the network fails. Ours gets **better** as the crowd gets denser — because the crowd **is** the network."*
3. *"After the incident, you will be asked to prove you accounted for everyone. This is that proof."*

## Why this is award-winning rather than niche

The awards and the category-defining language come from the **inversion**: every safety system ever built degrades under load, and load is exactly when it is needed. Loc8 is the first that improves. That is a genuinely new engineering property, it is demonstrable in ninety seconds, and it is the honest description of what the product does.

It is also the frame that makes the **muster record** — not the radio — the thing being sold. That is the only defensible asset in the business.

## What to say about the free consumer app

*"The consumer app is how the network exists. It is not the product."* Say it plainly and internally. It stops the marketing budget from becoming the account.

---

# 11. THE 3-YEAR SEQUENCE

## Year 1 (months 0–12): connected software, UK, no hardware

**Capability required:** a server backend, TLS, a data processing agreement, a retention policy, a documented lawful basis for naming people in a muster record (legitimate interests or a legal obligation around crowd safety), and **Cyber Essentials**. Nothing else. No mesh, no Anchors, no CE marking, no radio certification.

**Markets, in order:** agricultural and county shows (cheapest sale, no procurement, SAG-driven need) → independent festivals via AIF's ~150 members → 2–3 security contractors.

**Timing is seasonal and non-negotiable:** festival and show budgets are set **October–February** for summer. Miss that window and you wait a year.

**In parallel, at £0:** prove the multi-phone relay in a field. Publish it.

**Realistic:** 10–20 events plus 5–10 shows. **£20,000–£60,000.**

## Year 2 (months 12–24): prove the mesh, then charge for resilience

**Capability required:** multi-phone relay on a mixed iOS/Android fleet with screens off, and **payload encryption**. These are engineering, not capital.

Once proven, *"your muster still works when the cell network saturates"* becomes a demonstrable differentiator layered onto a product already in the building. Halo's radio is Push-over-Cellular and fails in exactly those conditions.

**Add:** drill and exercise tooling ahead of the expected spring 2027 Martyn's Law commencement. Sell the **drill and the evidence**, never "compliance."

**Also in year 2:** the body-worn steward anchor. Zero deployment cost, no CAA, no mast, prototypable from parts you have.

**Target:** 30–60 sites. **£60,000–£150,000.**

## Year 3 (months 24–36): hardware, frameworks, first real contracts

**Capability required:** Gateway and Anchors built around a **pre-certified BLE+LoRa module** (47 CFR §15.212 modular approval — decide this before any PCB work).

**Certification path, cheapest first:**
- **CE self-declaration** under the Radio Equipment Regulations 2017 where harmonised standards are applied in full — no Notified Body fee `[HARD DATA]`.
- **CE is recognised in Great Britain indefinitely** under SI 2024/696, so UKCA is **not a second spend** — anyone modelling UK and EU as two separate campaigns is wrong by roughly half `[HARD DATA]`.
- Sole known FCC datapoint: ~$9,000–12,000 per intentional radiator, one lab `[UNVERIFIED]`.

**The hardware fork to plan for:** EU 868MHz is **duty-cycle** governed (ETSI EN 300 220-2: 1% = **36 seconds transmit per hour per sub-band** `[DERIVED]`); US 915MHz is **dwell-time** governed (47 CFR 15.247: 0.4s per channel within 20s `[HARD DATA]`). Different frequency, different antenna, different front end, different MAC fairness behaviour. **Two SKUs, two test campaigns, two firmware behaviours.** For a product whose selling proposition is naming who is missing during a muster, model the 36-second ceiling *before* the Anchor is designed.

**Markets:** greenfield rental → multi-site contractor frameworks → enhanced-tier venue estates.

**£150,000–£400,000.**

## The trajectory, and the honest ceiling

| Year | Revenue `[DERIVED]` | Gate |
|---|---|---|
| 1 | £20k–£60k | Connected software only. Encryption + relay proof in parallel |
| 2 | £60k–£150k | Mesh proven, encryption shipped |
| 3 | £150k–£400k | Hardware certified via pre-certified module |
| 5+ | £2m–£5m | Contractor frameworks + enhanced-tier estates at Peoplesafe-like margins |

**Exit:** plausibly Motorola Solutions (four acquisitions in 2025, US$4.9bn), Peoplesafe's PE owner, or a security services group, at **4–9× ARR** based on Everbridge (4.0× revenue) and Blackline (8.88× ARR).

**That is a genuinely good founder outcome. It is not venture scale. Do not finance or plan it as though it were.**

---

# 12. WHAT WOULD CHANGE THIS ANALYSIS

Ranked by how much damage each does if wrong.

### 1. The multi-phone relay does not work at crowd density with backgrounded phones.

**Invalidates: everything.** Not the beachhead, not the pricing — everything. The connected-software strategy in §1 survives, but the entire differentiation argument collapses and Loc8 becomes an undifferentiated competitor to a company with £1 in the bank.

**Test: this month, £0.** Twenty phones, a field, a stopwatch.

### 2. iOS background BLE advertising is materially degraded or unreliable in practice.

The known risk (per project memory, the Screen-On Relay mitigation) is that iOS pushes background advertising into the overflow area. If the practical outcome is that a pocketed iPhone cannot reliably relay, the crowd-as-network premise fails on the majority platform at UK festivals. **Same test as #1 — measure it, don't assume it.**

### 3. Agricultural shows have no budget at all.

The corpus contains **zero** budget data for this sector. If a Show Secretary's answer to "what do you spend on radios and stewards?" is a few hundred pounds, the beachhead is a marketing exercise, not a market — and pin 2 (festivals) becomes pin 1 by default.

**Test: four phone calls.**

### 4. Halo, Raven or Crowd Connected already ship a named muster.

The entire differentiation argument rests on the finding that none of them does. That finding comes from reviewing product pages, not from exhaustive testing. If any incumbent already ships it, Loc8's only unique capability evaporates and the position reduces to "cheaper, unproven, unencrypted."

**Test: request a demo as a prospective buyer.**

### 5. Martyn's Law slips again, or its guidance explicitly rules out third-party technology.

Spring 2027 is a Home Office *expectation*, not a legally fixed date, and commencement has already been staged into preparatory instruments. If it slips to 2028 the year-2 timing argument weakens materially. **Also unread:** the 15 April 2026 statutory guidance itself — whether it names staff-alerting, mustering or roll-call is genuinely **unverified**, and it materially affects whether Loc8 can be positioned near compliance at all.

**Test: read the guidance. It is free.**

### 6. Security contractors are structurally hostile rather than merely sceptical.

The channel strategy assumes contractors will buy a tender-winning differentiator. If they instead see any tool that reduces steward-hours as an attack on their revenue model, the highest-leverage route in the plan closes and you are back to selling event by event.

**Test: two conversations.**

### 7. Payload encryption takes longer than expected, or the architecture resists it.

Encryption gates: enhanced-tier procurement (s.6(3)(d) covers *security of information*), every EU conversation, every public-sector conversation, and the RED cybersecurity requirements plus the Cyber Resilience Act (reporting obligations from **11 September 2026** — under two months away; main obligations 11 December 2027). If encryption is a six-month problem rather than a six-week one, the year-2 plan slips wholesale.

### 8. The £2–5m ceiling is wrong in either direction.

It rests on three UK companies' filed accounts. If the sector is genuinely larger than Halo's and Crowd Connected's filings suggest — for example if most of the money flows through security contractors' own P&Ls rather than through software vendors — the ceiling could be higher. If Peoplesafe's £18m proves unreachable without an ARC, it is lower.

### 9. Apple ships native offline mesh, or materially better precise-finding.

Assessed in §9.4 as lower risk than it feels — Find My depends on the internet and UWB cannot multi-hop. But an Apple architectural change is unhedgeable and would be announced with no notice.

### 10. Assumptions embedded in the physics that were not independently confirmed.

The drone rejection, the density arithmetic and the capture-effect argument rest on: phone TX EIRP (+4 dBm), body loss (−12 dB), RX sensitivity (−95 dBm), BLE capture threshold (~11 dB), and body attenuation (0.3 dB/m) — **all estimates, none vendor-confirmed** `[UNVERIFIED]`. The drone conclusion is robust (airborne C/I is 3.5 dB, so it fails even at a 6 dB threshold), but the ground-level density conclusions are more sensitive. Also **not found:** the measured 2.4 GHz noise floor at a real festival, where a ~12 dB rise would erase the entire uplink margin.

**Test: the same field test as #1, instrumented.**

---

## Closing

The technology fits the greenfield outdoor event field better than it will fit almost anywhere else, and that is worth something real. The capability — naming who is missing — is genuinely unserved. The regulatory deadline is genuine, even though the mandate is not.

But the revenue this specific market can produce is small enough that it should be treated as a **proving ground and reference-customer engine**, with the larger commercial case made through contractor frameworks and enhanced-tier estates rather than through festivals themselves.

**The single most valuable next step is not more desk research.** It is twenty phones in a field, four phone calls to Show Secretaries, and three conversations with event production managers to replace a derived £3,000 comms envelope with observed spend. Those three actions — total cost, fuel — determine whether anything in this document is right.
