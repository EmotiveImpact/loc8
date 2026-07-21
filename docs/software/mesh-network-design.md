# Mesh network design — escalation, lifetimes, and topology

*How a message actually gets from one phone to another across a large site, and
the decisions that must be made before anchor firmware is written. Drafted
2026-07-21 from the escalation discussion. **Status: all five decisions SETTLED
2026-07-21 (see the summary at the end); none are implemented yet.** None
required a wire-format change — the existing frame already carried what they
needed.*

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

## 4. ✅ DECIDED: the phone reports, the anchor decides

*Revised 2026-07-21. The first version of this decision said the anchor should
**notice** that nobody answered. That was wrong; the reasoning below replaces
it, and the flaw is recorded because it is instructive.*

**The reply comes back to the phone.** The phone therefore *knows* whether it
succeeded. The anchor can only infer it by listening — and may miss a reply that
returned along a path it was not on. **The phone has strictly better information
about failure than the anchor does.** An anchor left to guess would escalate
queries that had already succeeded, wasting the scarcest resource on site.

> **The phone reports the failure. The anchor decides whether to spend the
> airtime.**

Each side contributes only what it can actually see:

| Contribution | Who |
|---|---|
| "I asked 10 s ago and got nothing" | **Phone** — only it knows |
| "I have duty cycle left this hour" | **Anchor** — only it knows |
| "This is an SOS, not the hundredth ping this minute" | **Anchor** |

The escalation request is one small frame, sent only after a local failure the
phone has actually observed. The anchor remains the rate limiter and the
priority arbiter — it simply stops guessing about success.

### The wider principle — not "dumb phones"

An earlier draft framed this as *phones shout, anchors think*. That is too
crude: phones already run real adaptive logic (degree-based TTL clamping,
jittered relay timing — §11). The accurate principle is:

> **Each node decides what it can see, and nothing else.**

| Decision | Belongs to |
|---|---|
| How many neighbours do I have? | Phone |
| Am I moving or stationary? | Phone |
| Is my battery nearly flat? | Phone |
| Did my query get an answer? | **Phone** |
| Is there LoRa airtime left? | Anchor |
| What priority does this traffic deserve site-wide? | Anchor |

### Phone-side intelligence worth adding

- **Answer on behalf of others.** If a phone heard Sam's position 30 s ago and a
  nearby phone asks for Sam, it can answer *immediately* — no need to reach Sam
  at all. Fewer hops, faster, and it works when Sam's phone is backgrounded or
  flat. This is decision 6's mechanism in a second form: phones as a distributed
  cache of recent knowledge, not merely repeaters. **Same privacy gate — needs
  encryption and rotating IDs first.**
- **Battery-aware relaying.** Below a threshold, stop carrying other people's
  traffic. Necessary, or users uninstall.
- **Adaptive send rate.** Position every ~30 s when stationary, ~5 s when
  moving. Large airtime saving for no cost.

### The phone never *seeks* an anchor

Worth stating explicitly, because the mental model matters: **there is no
discovery step.** BLE advertising is broadcast — a phone does not address
anything, it simply transmits, and whatever is in range hears it. The anchor is
already listening, always. The full flow:

1. Phone broadcasts a query. It floods the local crowd (~100 m).
2. **Any anchor inside that radius hears it automatically** — no seeking, no
   handshake, no connection.
3. Phone waits. If a reply arrives, done: nothing else happens and no airtime
   is spent.
4. **No reply within the step-3 window → the phone broadcasts an escalation
   request.** It does not address an anchor; it shouts, exactly as before.
5. Any anchor that hears it decides whether to grant it (duty cycle, priority,
   rate limits) and, if so, puts the query on the trunk.
6. Far anchors re-broadcast locally; the reply floods back the same way.

The phone never establishes a relationship with anything. It shouts twice — the
query, then "that didn't work" — and everything else happens around it.

### How the phone knows escalation is even possible

Anchors already beacon their presence, so a phone can tell from that alone
whether site-wide search exists here — **no new message type, no extra
traffic**:

| Phone hears an anchor beacon | UI |
|---|---|
| **Yes** | "Searching nearby…" → "Searching site-wide…" → result |
| **No** | "Searching nearby…" → last known position (§9) |

The phone therefore never claims to search site-wide at a venue with no anchors
installed. An explicit "escalating" ack from the anchor would make this exact
rather than inferred — worth adding, but polish; the inference is honest.

### Two edge cases, both solved by existing mechanisms

- **Several anchors hear the same escalation request** and all act on it,
  wasting scarce LoRa airtime. Fix: the **same jitter + dedup the phones already
  use**. First anchor to put it on the trunk is heard by the others, which then
  stay quiet. Reused pattern, no new invention.
- **A phone escalates while out of anchor range**, so nothing happens. Not a
  failure: the phone falls back to last-known-position (§9), which is what it
  would have shown anyway. Costs one small frame.

*Note: the "anchor escalates on a response it did not hear" failure mode
disappears entirely under the revised design — the anchor no longer infers
success or failure, it is told.*

## 5. ✅ DECIDED: two budgets — hops and time (free, no format change)

Today a message carries one budget: **hops**. That is sufficient for a live
flood and insufficient for anything carried (§6).

**Two budgets on every frame. This is a POLICY, not a format change** — the header already carries an 8-byte `timestamp` stamped at originate (it is part of the dedup key), so time expiry is simply `drop if now - timestamp > maxAge`. Defaults: position 5 min · quick reply 5 min · text 10 min · rally 1 h · SOS 30 min.

| Budget | Unit | Purpose |
|---|---|---|
| `hops` | count (7, clamped by degree) | bounds the live flood |
| `ttl` | seconds | bounds usefulness and enables carrying |

A position is useful for perhaps 5 minutes; an SOS for much longer. Without a
time budget, carried messages either die instantly or never die at all.

## 6. ✅ DECIDED: carried messages — build the hook, ship it off

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

**Decided: build the hook, ship it off.** `flags` bit 0 = "may be carried" —
one bit of a byte that is already reserved and currently `0x00`, so **no format
change**. Emit `0` on everything until encryption and rotating IDs land, then
flip it on and the capability appears with no wire change and no fleet upgrade.

If real hop distances come back at 25 m, the local mesh reaches 175 m and this
matters less — which is another reason to build the hook and wait rather than
implement now.

## 7. ✅ DECIDED: LoRa resets the hop count — backbone, not hop

When a message crosses the trunk and is re-broadcast on the far side, does it
continue with its remaining hops, or start fresh?

- **Continue:** cross-site messages arrive nearly exhausted and travel only a
  hop or two on the far side. Cheap, but cripples the feature it exists for.
- **Reset** — treat LoRa as a **backbone, not a hop**. The far
  side gets a full local flood.

**Reset requires dedup on the trunk side** so a message cannot loop between two
anchors forever. Each anchor keeps a seen-set of message IDs crossing LoRa, same
as phones do locally.

Loop prevention keys on `(senderID, timestampMs)` — already the dedup key, so anchors reuse the phones' logic rather than inventing new.

## 8. ✅ DECIDED: anchors form a mesh, not a star

If every trunk anchor talks only to the Gateway, the Gateway becomes a single
point of failure for the entire trunk — which contradicts the degradation
ladder.

**Anchors relay for each other over LoRa.** Same radio, same
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

## ✅ DECIDED — 2026-07-21

All five settled. **None require a wire-format change** — an earlier draft of
this document claimed decisions 5 and 6 did. That was wrong, and the reason is
worth knowing: the existing mesh frame already carries what they need.

```
version(1) | type(1) | ttl(1) | timestamp(8) | flags(1) | payloadLength(2)
           | senderID(8) | payload(25)
```

`timestamp` is already stamped at every originate (it is part of the dedup key),
and `flags` is reserved and currently `0x00`. Whoever designed this frame left
room.

| # | Decision | Cost |
|---|---|---|
| **4** | **The phone reports the failure; the anchor decides whether to spend the airtime.** *(Revised — the original "anchor notices nobody answered" was wrong: the reply comes back to the PHONE, so the phone knows definitively while the anchor can only guess and may miss a reply routed around it.)* Each side contributes only what it can see. The anchor remains rate limiter and priority arbiter. | firmware only |
| **5** | **Two budgets — hops and time.** Implemented as a **policy, not a format change**: drop if `now − timestamp > maxAge`. Defaults by type: position 5 min · quick reply 5 min · text 10 min · rally 1 h · **SOS 30 min**. | **free** |
| **6** | **Carried messages: build the hook, ship it off.** `flags` bit 0 = "may be carried". Emit `0` on everything until encryption and rotating IDs land, then flip it on — capability appears with no format change and no fleet upgrade. **Never enable before encryption**: a stranger's phone carrying an identifiable plaintext position is a privacy incident, not a feature. | **free** (1 bit) |
| **7** | **LoRa resets the hop count — backbone, not hop.** The far side gets a full local flood. Loop prevention by trunk-side dedup on `(senderID, timestampMs)` — already the dedup key, so anchors reuse the phones' logic. | firmware only |
| **8** | **Anchors mesh, not star.** Same radio, zero extra cost, pure topology. A Gateway-centred trunk would make the Gateway a single point of failure for the whole site, contradicting the degradation ladder. | **free** |

**Why all five were decidable before the field test:** each is either free or
cheaper now than retrofitted, and none can be wrong in a way that costs money if
the field test surprises us. Decisions that *do* depend on measurements —
escalation timeouts, whether carrying is needed at all, anchor spacing — stay
open until §10 is answered.
