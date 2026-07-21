# Loc8 — Business Model & Market Sizing

*Directional, assumption-explicit estimates — the shape of the opportunity, not a researched forecast. All £ are order-of-magnitude. Two-engine model: consumer self-serve (B2C) + org deals (B2B). Neither depends on the other; they reinforce.*

---

## The two engines

**Engine A — Consumer self-serve** (no org required, works anywhere)
- **Free core:** find your crew offline. Never paywalled (network effect — if your friends don't have it, it's broken).
- **Crew Pass:** £1.99, host-pays — one organiser buys, up to ~8 crew ride free for the event. Solves ad-hoc events with no festival deal, without breaking the network.
- **Loc8 Plus:** £2.99/mo single-player premium (history, unlimited crew, offline maps, SOS, background priority).
- Comp: **Life360** — free find-my-family + paid tiers, ~80M users, ~$300M+ revenue. Loc8's wedge = the offline mesh Life360 structurally can't do.

**Engine B — Org deals** (the big cheques)
Three revenue legs: (1) anchor deploy/rental, (2) per-head software fee collected by the org **at point of sale** (ticket/fare/pass — never in-app), (3) ops/safety module (staff-finder, lost-person, muster). Core stays free to end users.

---

## Per-vertical numbers

Pricing logic: events = per-event kit + per-head + ops; permanent venues = install + annual SaaS + per-head. "User-pass viable?" = can you charge end-users, collected by the org.

> ## ⚠️ CORRECTION — 2026-07-21: this table's festival counts are wrong by ~4×
>
> The two festival rows assume **10,500 festivals ≥5k attendees globally**
> (2,500 at ≥20k + 8,000 at 5–20k). **JamBase counts 2,840 music festivals
> worldwide of *all* sizes** — so the ≥20k figure alone is implausible by
> roughly an order of magnitude. Approximately **£144M of the £460M "reachable
> TAM" below rests on this error**, and the £1.18B consolidated figure inherits
> it.
>
> Further corrections from `../research/market-expansion-report.md` (210-agent
> verified study, 80 claims refuted or corrected):
> - **UK festivals are down 26–34% from peak**, not growing. The displaceable
>   UK radio-hire budget is ~**£0.8M nationally** — not a market that supports
>   the priority this table gives it.
> - **Halo Solutions already holds Glastonbury and ExCeL**; the festival lane
>   is occupied at the top.
> - The recommended beachhead is **UK agricultural and county shows**, not
>   festivals: ~7M attendees across ~400 show days, festival-grade density on
>   greenfield sites, poor rural cellular, lost children as the dominant
>   incident type, a Show Secretary with personal signing authority, and **no
>   vendor found serving the sector**. ⚠️ *That last clause was itself refuted
>   on 2026-07-21 by `../research/gtm-execution-report.md`: Alpha Omega
>   Securities and ONYX already work the sector. It is the right beachhead, but
>   contested — and its purpose is reference cases, not revenue (~£160–240k/yr
>   at site-licence level).*
> - The cruise-first priority is not supported: SOLAS muster is a regulated
>   *process* already served by incumbent systems, and ATEX/marine
>   certification is a multi-year gate.
>
> **This table is retained as the original strategic reasoning, not as current
> guidance.** Treat every figure below as superseded by the research report
> until re-derived bottom-up. Nothing here has been deleted.

| Vertical | Who pays | User-pass? | Blended price | Global TAM/yr | 5-yr SOM (ARR) |
|---|---|---|---|---|---|
| **Festivals** (≥20k) | organiser | ✅ via ticket | ~£32k/event × 2,500 | ~£80M | ~£6.4M |
| Festivals (mid 5–20k) | organiser | ✅ | ~£8k × 8,000 | ~£64M | ~£1.3M |
| **Cruise lines** 🚢 | cruise line | ✅✅ (fare) | ~£80k/ship × 300 | ~£24M | ~£6.0M |
| **Theme parks** 🎢 | park | ✅ (park app) | ~£150k × 120 major | ~£30M | ~£4.8M |
| **Ski resorts** ⛷ | resort | ✅ (lift pass) | ~£40k × 500 major | ~£32M | ~£4.0M |
| **Stadiums/arenas** 🏟 | venue/team | ⚠️ weak | ~£30k × 800 major | ~£48M | ~£4.2M |
| **Industrial / lone-worker** 🦺 | employer | ❌ per-seat | £144/seat/yr, ~5M seats | ~£720M | ~£3.6M |
| **Govt / mass gatherings** 🕌 | state | ❌ (safety mandate) | £1–10M/contract | ~£50M | ~£3.0M (lumpy) |
| **Conferences / expos** 👔 | organiser | ⚠️ | ~£3k × 10,000 | ~£30M | ~£1.5M |
| **Defence** 🎖 | procurement (partner) | ❌ | — | optionality | — |
| **Consumer (Engine A)** | individual / host | ✅ (direct) | ~£15/yr × 4% of users | ~£100M | ~£6.0M (@10M users) |

**Consolidated TAM ≈ £1.18B/yr** (dominated by industrial). Excluding the giant/hard industrial market, **reachable TAM ≈ £460M/yr.**

**5-yr SOM (mature, multi-vertical execution): ~£40M ARR.** Realistic focused path (2–3 verticals + consumer): **~£15–25M ARR.**

---

## The strategic pattern: consolidated operators

B2B here is **not** thousands of cold calls — these markets are owned by a handful of operators. Land ~10 logos → dozens of venues each:
- **Vail Resorts** 40+ mountains; **Alterra/Ikon** 50+.
- **Carnival, Royal Caribbean, MSC, NCL** ≈ 80% of cruise berths.
- **Disney, Universal, Merlin, Six Flags** dominate parks.
- **ASM Global / Oak View Group** manage *hundreds* of stadiums/arenas.

**Priority order (no-signal pain × budget × regulatory pull × reachability): cruise → theme parks → industrial → ski → festivals(wedge) → stadiums → govt.** Cruise leads because the pain is undeniable (no signal at sea), budgets are huge, and there's a *regulatory* reason to buy (SOLAS muster headcounts), not just nice-to-have.

---

## Phased build (illustrative)

| | Yr 1 | Yr 3 | Yr 5 |
|---|---|---|---|
| Consumer (Engine A) | £0.3M | £2M | £6M |
| Festivals | £0.3M | £3M | £7M |
| Cruise + parks + ski + stadiums | — | £6M | £19M |
| Industrial + govt + expo | — | £2M | £8M |
| **Total ARR** | **~£0.6M** | **~£13M** | **~£40M** |

---

## Product architecture — one platform, three surfaces (NOT many apps)

Do **not** build a separate consumer app per vertical — that's fragmentation and maintenance hell. Build **one platform** (the mesh + protocol + identity we already have behind `LocationTransport`) delivered through **three surfaces**:

1. **Consumer app** ("Loc8", B2C) — festivals, friends, everyday. App Store. Engine A.
2. **Partner SDK / white-label** — embed find-your-crew *inside the customer's existing app*. **This is the key B2B unlock:** cruise lines, parks, resorts, stadiums ALL already have apps and will never make guests download a second one. They want "Family Finder" *in their app*. Productising the mesh as an embeddable SDK is the scalable B2B motion.
3. **Enterprise / ops console** — a different surface for industrial/security/ops: admin dashboard, man-down/SOS alerts, muster reports, staff-finder, crowd heatmaps. Web + rugged-device app.

**Vertical features are modules on the shared platform, not separate apps:** muster/headcount (cruise, industrial), man-down (industrial), lost-child mode (parks), ski-patrol (ski), crowd-heatmap (all). One engine, swappable feature packs + branding.

This is exactly why the `LocationTransport` abstraction and clean wire protocol matter — the reusable core powers the consumer app, the SDK, and the console without a rewrite.

---

## Identity architecture (design now, build when consumer scales)

- **Mutual consent only** — you can locate someone *only* if you've both agreed (crew). Never locate a stranger by username = non-negotiable (stalking/legal risk).
- **Two layers:** online handle/account + friend-request (with signal) exchanges keys; offline the mesh matches cached keys of opted-in crew. "@sarah" resolves to a key, never a mesh-wide search.
- **Foundation decision:** persistent accounts + handles + friend graph are needed for Engine A stickiness. The mesh `senderId` is forward-compatible with an account→key mapping *if planned now*. Spike uses ephemeral ids + pairing; architect the account layer now to avoid a painful migration later.

---

## Honest caveats
- Numbers are directional estimates, not a survey or forecast.
- £40M ARR in 5y assumes funding + a team across multiple verticals; a focused 2–3 vertical path (~£15–25M) is more realistic for a lean start.
- The backgrounded-iPhone limitation and the "need signal to buy a pass / pair a crew beforehand" constraints apply everywhere.
- Consumer conversion is low (assume 3–5% to paid); the org deals are where the near-term money is, the consumer engine is the flywheel that de-risks them.
