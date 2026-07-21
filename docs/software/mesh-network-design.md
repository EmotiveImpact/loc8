# Mesh network design — escalation, lifetimes, and topology

*How a message actually gets from one phone to another across a large site, and
the decisions that must be made before anchor firmware is written. Drafted
2026-07-21 from the escalation discussion. **Status: PROPOSED.** Nothing here is
implemented. Several items are open decisions marked 🔴 — they are cheap now and
expensive once anchors are in the field.*

---

## 1. The problem this solves

**7 hops × 5–20 m per hop = 35–140 m.** That is the real reach of the phone mesh
in a crowd `[ESTIMATE — the field test measures it]`.

| Scenario | Distance | Phones alone |
|---|---|---|
| "Lost my mates in this crowd" | 10–80 m | ✅ Works — and this is most real use |
| "They went to the bar" | 50–150 m | ⚠️ Marginal, density-dependent |
| "I'm at the campsite, they're at main stage" | 500 m+ | ❌ Does not work |

The phone mesh is a **local** product. Site-wide reach requires the anchor tier.
This document is how the two tiers combine.

## 2. The tiered model

```
  TIER 1 — the crowd          TIER 2 — anchors           TIER 3 — the trunk
  ─────────────────────       ──────────────────         ──────────────────
  phone → phone → phone       anchor hears the           LoRa, 1–3 km in
  5–20 m per hop              local bubble               ONE hop
  up to 7 hops                25–30 m direct             ~1% duty cycle
  ~100 m total                + whatever the             positions & alerts
  free, no hardware           crowd relays to it         only, never chat
```

A cross-site message: **you → crowd (~100 m) → anchor → LoRa (km) → anchor →
crowd (~100 m) → your friend.** The phone never knows LoRa exists — it cannot
hear it (different frequency *and* modulation). Anchors translate.

## 3. The escalation ladder

**Spend the cheapest resource first.** LoRa airtime is the scarce one (~1% duty
cycle in the UK); local airtime is nearly free.

| Step | Reach | Cost | Trigger |
|---|---|---|---|
| 1. Local whisper | ~20 m, 2 hops | negligible | always first |
| 2. Full local flood | ~100 m, 7 hops | some airtime | no answer after ~2 s |
| 3. Anchor tier → LoRa | site-wide | **scarce** | no answer after ~10 s |
| 4. Last known position | whatever is cached | free | nothing worked |

This is **expanding ring search** — standard practice in mesh routing since the
1990s (AODV and relatives). Most searches terminate at step 1 or 2, because
people you have lost are usually nearby.

Timings are `[PROPOSED]` and should be tuned against field-test measurements.

## 4. 🔴 DECISION: the anchor escalates, not the phone

**Recommendation: the anchor decides.**

A phone cannot reach LoRa, so escalation must be triggered by something that
can. Two candidate designs:

| Design | Assessment |
|---|---|
| Phone flags "escalate me" | ❌ Phones are battery-limited, cannot see whether anyone answered elsewhere, and cannot know the site's remaining LoRa airtime budget |
| **Anchor observes and escalates** | ✅ It hears everything locally, it is mains-powered, and it is the only thing that knows how much duty cycle is left this hour |

**Principle: phones shout, anchors think.**

This also gives rate-limiting and prioritisation for free — an anchor can refuse
to escalate a hundred friend-finder pings while always escalating an SOS.

## 5. 🔴 DECISION: message lifetime needs two budgets

Today a message carries one budget: **hops**. That is sufficient for a live
flood and insufficient for anything carried (§6).

**Recommendation: two budgets on every frame.**

| Budget | Unit | Purpose |
|---|---|---|
| `hops` | count (7, clamped by degree) | bounds the live flood |
| `ttl` | seconds | bounds usefulness and enables carrying |

A position is useful for perhaps 5 minutes; an SOS for much longer. Without a
time budget, carried messages either die instantly or never die at all.

## 6. 🔴 DECISION: should messages ride in people's pockets?

**The single largest robustness gain available, and it costs no hardware.**

Today, dedup means a phone that has seen a message never re-broadcasts it. But
**people walk.** If a phone re-broadcasts a cached message after moving to a new
location, positions propagate across a site carried by human beings.

This is **delay-tolerant networking** — the technique behind deep-space and
disaster-response networks. It suits friend-finding well because slightly stale
is fine: a position from 90 seconds ago still points the right way. A festival
crowd is constantly stirring, so you already have thousands of couriers.

**If adopted, these constraints are not optional:**

| Constraint | Rule |
|---|---|
| **Time-bounded** | Only carry while the `ttl` budget survives (§5) |
| **Movement-triggered** | Re-broadcast only after moving a meaningful distance — not on a timer |
| **Once per location** | Never re-broadcast the same message twice in the same place |
| **Privacy** | Carried frames must be encrypted and pseudonymous *first*. Today's plaintext, static-ID frames make this **unsafe to ship** — a stranger's phone would carry an identifiable position. Gate ④ is a hard prerequisite. |
| **Battery** | Carrying costs transmit power. Cap it, and honour low-battery state. |

**Recommendation: design for it, gate it behind encryption, and default it off
until the field test shows whether it is needed.** If real hop distances come
back at 25 m, the local mesh reaches 175 m and this matters less.

## 7. 🔴 DECISION: does the hop count reset across LoRa?

When a message crosses the trunk and is re-broadcast on the far side, does it
continue with its remaining hops, or start fresh?

- **Continue:** cross-site messages arrive nearly exhausted and travel only a
  hop or two on the far side. Cheap, but cripples the feature it exists for.
- **Reset** *(recommended)*: treat LoRa as a **backbone, not a hop**. The far
  side gets a full local flood.

**Reset requires dedup on the trunk side** so a message cannot loop between two
anchors forever. Each anchor keeps a seen-set of message IDs crossing LoRa, same
as phones do locally.

**This must be decided before anchor firmware is written.**

## 8. 🔴 DECISION: anchors form a mesh, not a star

If every trunk anchor talks only to the Gateway, the Gateway becomes a single
point of failure for the entire trunk — which contradicts the degradation
ladder.

**Recommendation: anchors relay for each other over LoRa.** Same radio, same
cost, purely a topology decision. A dead anchor is routed around automatically.

This also extends reach: two 1–3 km LoRa hops cover a site no single link could.

## 9. Graceful degradation — never say "not found"

When every tier fails, do **not** show an error. Show the last known position
with its age and decaying confidence:

> **Sam** · 340 m north-east · **4 minutes ago**

This is genuinely useful — it still points the right way — and it prevents the
product feeling broken in exactly the moment it is most needed. It is also the
honest failure mode: we are telling the user precisely what we know and when we
knew it.

## 10. What the field test must measure to validate any of this

Every number above is an estimate. `../testing/field-test-protocol.md` should
capture, specifically for this design:

1. **Real hop distance** in a crowd — the number that determines whether the
   local tier is 35 m or 175 m, and therefore how much of this design is needed
2. **Time for a flood to traverse N hops** — sets the step-2 escalation timeout
3. **Whether a moving phone's re-broadcast reaches new peers** — validates §6
4. **Duplicate suppression effectiveness** — how many phones actually relay a
   given frame under the jitter scheme already implemented

## 11. What is already implemented (verified in code, 2026-07-21)

Not everything here is new. The existing native module is better than expected:

- **TTL 7 at origin**, capped on receive so a hostile peer cannot mint a
  long-lived flood (`MeshConstants.originTTL`, `MeshRelayController.decide`)
- **Degree-based clamping** — dense (≥6 links) clamps to 5, thin chains (≤2)
  keep the full budget, otherwise 6. Adaptive already.
- **Jittered rebroadcast delay** — 10–40 ms when sparse (relay fast, nobody else
  will), 100–220 ms when dense (let duplicate suppression win). This is the
  mechanism that stops fifty phones repeating the same frame.

The gap is everything above tier 1: escalation, the anchor tier, lifetimes, and
carrying.

---

## Summary of open decisions

| # | Decision | Recommendation | Blocks |
|---|---|---|---|
| 4 | Who escalates to LoRa | The anchor | anchor firmware |
| 5 | One budget or two | Two — hops *and* seconds | frame format ⚠️ |
| 6 | Carried messages | Design for, gate behind encryption, default off | frame format ⚠️ |
| 7 | Hop count across LoRa | Reset — backbone, not hop | anchor firmware |
| 8 | Anchor topology | Mesh, not star | anchor firmware |

⚠️ **Decisions 5 and 6 touch the 25-byte frame format**, which is the one thing
shared by every device and every app. Changing it later means changing
everything at once. These two are the most expensive to defer.
