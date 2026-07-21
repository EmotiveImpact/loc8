# Data strategy — the five rungs

*What the Gateway accumulates, what we may legitimately do with it, and why it
is the answer to the market report's honest £2–5M ceiling. Drafted 2026-07-21.
Rungs 1 and 3 are covered by ordinary product T&Cs; rungs 2, 4 and 5 need a
specific contract clause and a DPIA — see "The clause you need" below, and get
it into customer #1's contract, because retrofitting it across signed contracts
later is miserable.*

---

## What we actually hold

After one season a single Gateway holds, tamper-evident and timestamped:

- Every SOS: who fired it, where, when, who was dispatched, how long to on-scene, how long to clear
- Every muster: who confirmed safe, how fast, **who was missing and for how long**
- Staff movement and coverage history across the site
- Zone occupancy over time (where anchors are fitted)
- Mesh/network health — where coverage genuinely existed versus where it was assumed

One venue's worth is a debrief. **Fifty venues' worth is a dataset nobody in
this industry has ever possessed.**

## Rung 1 — Sell the venue its own data back

**Now. Zero legal risk. Covered by ordinary T&Cs.**

The auto-generated **post-event debrief pack**: incident heatmap by zone and
hour, response times against that night's staffing, muster performance trend
across events, coverage gaps where guards never patrolled but incidents
clustered.

Security managers write these by hand today, from memory and radio logs.
Generated automatically it justifies the subscription on its own — and it is
exactly what the named accountable person under Martyn's Law wants to put in
front of their board.

## Rung 2 — Benchmarks (the renewal engine and the moat)

**Needs the contract clause. Needs anonymisation done properly.**

Aggregate across venues and we can state what nobody has ever been able to
state: *"Your venue musters in 8:40. The median 2,000-capacity venue does
6:10."* Median time-to-dispatch by venue type. Incident rates by hour, by event
genre, by weather.

This is a **data network effect**: every new venue makes the product more
valuable to every existing venue. The patent research concluded we have no
patent moat — this is the moat we can actually build.

It also produces the annual **"State of Venue Response" report**: the industry
document that gets us cited, invited, and awarded. Award-winning positioning
does not come from a prettier product; it comes from being the company that
owns the numbers.

## Rung 3 — Live operational intelligence

**After roughly one season of data. Covered by ordinary "improve the product" T&Cs.**

Not prediction — **anomaly detection against the venue's own baseline**: this
zone is denser than any Saturday on record; response times are degrading
tonight; three guards have drifted out of a coverage area.

Surfaced as nudges to the Command operator, who remains the decision-maker.
Buildable, defensible, honest.

## Rung 4 — Prediction

**Later. Carefully. Needs the clause.**

With several seasons: leading-indicator models combining density buildup,
incident history and event type into elevated-risk warnings.

**Never oversell this.** "Predicts crowd crushes" is a claim that ends the
company the first time it is wrong — and it will be wrong. The honest framing
that still sells: *"your operators see risk building minutes earlier."*

## Rung 5 — Insurance and the evidentiary record

**The largest, and the one that changes the company's ceiling.**

Venues carry public liability insurance priced on almost no data. We hold
**verified response-time records**. This is the telematics play — the black box
did exactly this to car insurance: demonstrably fast venues earn better
premiums, and Loc8 becomes the **verification layer** insurers trust.

We never sell the data. We sell **certification of it**.

Add the coroner's-inquest reality — a tamper-evident record is what gets
subpoenaed after a bad night — and the Gateway becomes the **flight recorder of
live events**. That is a category, not a product.

## Adjacent: research partnership

Crowd-dynamics researchers would value anonymised real-world density and
movement data at scale highly. Academic partnership → published papers →
credibility that feeds rung 2. Low cost, high reputational return.

---

## The two red lines

1. **Never sell raw or venue-identifiable data.** One leak of "Venue X's
   incident count" ends every customer relationship simultaneously. Aggregates
   must be genuinely anonymous — k-anonymity thresholds, suppression of small
   cells — not merely pseudonymised.
2. **The consumer promise is absolute.** Consumer frames are relayed, never
   stored. We record the *staff operation*, never the crowd. That asymmetry is
   a selling point and a safeguard — guard it, and say it out loud in every
   deck.

## The clause you need

Product T&Cs saying "we may use data to improve our products and software"
cover rungs 1 and 3. They do **not** clearly cover benchmarking or insurance
products. Get this into customer #1's contract:

> Anonymised, aggregated data may be used for industry benchmarking, research
> and product development.

Standard SaaS language, costs nothing to include now.

**Also required before rung 2 ships:** a DPIA, and a privacy lawyer's sign-off.
UK GDPR treats staff location as personal data, and the ICO has specific
guidance on monitoring workers. Get it right early — this is cheap now and
expensive after fifty venues are live.

## Why this reframes the ceiling

The market report's honest verdict — a £2–5M/yr profitable business — was
scoped to a venue-safety SaaS selling subscriptions.

A company that owns the industry's only response-time dataset, publishes its
annual benchmark report, and acts as the insurance verification layer is a
different company with different economics. **Data is how the ceiling gets
raised — not by finding more venues, but by making each venue worth more.**
