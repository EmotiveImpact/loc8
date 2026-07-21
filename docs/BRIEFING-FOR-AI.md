# Loc8 — briefing for an AI assistant

*Paste this whole file into a new ChatGPT (or any AI) conversation before asking
for research. It exists because assistants briefed only by conversation reliably
misunderstand what Loc8 is, and then produce well-sourced research that answers
the wrong question. Last updated 2026-07-21.*

---

## 0. Read this first

**Loc8 is not a venue broadcast system.** It is a peer-to-peer friend-finder
where ordinary phones relay for each other. If you find yourself designing a
network where fixed hardware talks *to* a crowd, you have misunderstood the
product. The crowd talks to *itself*; hardware only helps.

The single most common failure mode when advising us is to solve a bandwidth or
broadcast-coverage problem. We do not have one. Our entire position update is
**25 bytes**, sent sparsely. Read §4 before proposing any higher-capacity
transport.

---

## 1. What Loc8 is

An offline friend-finder for places where the mobile network collapses:
festivals, arenas, nightclubs, stadiums, cruise ships. You open the app, see
your crew as blips on a radar, walk toward them with a compass, and it says
"found" when you're close. **No signal, no wifi, no account, no server.**

There is a second, professional product line built on the same core: **Loc8
Guard** for security staff (SOS, dispatch, muster) and **Loc8 Command** for the
control room. Same radio, same protocol, same engine — different door.

Revenue model: consumer app free/cheap; venues pay for the professional tier and
the hardware.

## 2. The one thing that makes it different

**The crowd is the network.**

Every phone running Loc8 relays for every other phone running Loc8 — including
complete strangers who never met, never paired, never agreed to anything. Your
ping hops through people you don't know, and theirs hop through you.

This works because BLE *advertising* is connectionless broadcast: any device in
range hears any transmission, with no pairing, no connection, no negotiation.
That property is the whole product. It is why:

- **Density is an asset, not a problem.** More people = more relays = better
  coverage. Every competitor's system degrades in crowds; ours improves.
- **Zero infrastructure is required.** Two people in an empty field with the app
  installed have a working network. Nothing to install, nothing to pay for.
- **It cannot be replaced by a pairwise transport.** Anything requiring both
  devices to consent to a link (Wi-Fi Aware, Nearby Connections, GATT
  connections, classic Bluetooth pairing) cannot relay through strangers. See
  §10.

## 3. The products

| Product | Who | What | Status |
|---|---|---|---|
| **Loc8** (consumer) | festival-goers | Radar → Compass → Proximity → found. Crews joined by code/QR. No account. | ✅ built |
| **Loc8 Guard** | venue security staff | Team map, hold-to-fire SOS, dispatch + status replies, duress code, lone-worker timer, muster | ✅ built |
| **Loc8 Command** | control room | Incident timelines, muster board, coverage heatmap, audit log, nearest-responder dispatch. Runs on any laptop on the venue LAN — **needs no Bluetooth of its own** | ✅ built |
| **Partner SDK** | other companies' apps | The finder, embedded in someone else's app | 🔴 unwritten |

All four share **one engine** (`@loc8/engine`) that is never forked. A capability
built for one door is inherited by all four.

## 4. The protocol — and why bandwidth is not our problem

**Everything travels as a 25-byte frame.** Same format on every link in the
system: phone-to-phone, phone-to-anchor, across the LoRa trunk, into the Gateway,
out to the control room.

| Bytes | Field |
|---|---|
| 0 | type (u8) |
| 1–4 | senderId (u32) |
| 5–8 | targetId (u32) |
| 9–12 | latitude (i32, ×1e7) |
| 13–16 | longitude (i32, ×1e7) |
| 17–18 | heading + floor packed (u16 — heading needs 9 bits, spare 7 carry a signed floor) |
| 19 | battery (u8) |
| 20–23 | timestamp (u32 epoch) |
| 24 | accuracy (u8) |

Text messages overlay bytes 9–24 as 11-byte fragments, reassembled
out-of-order-tolerant, ≤160 bytes total.

**Relay rules:** TTL 7 (clamps to 5 in dense crowds); dedup means no device ever
forwards the same frame twice. That combination is what makes a crowd into a
network without it flooding itself into uselessness.

**Audience separation:** consumer quick-replies use codes 1–7; ops statuses use
20–23. Deliberately disjoint, so a festival-goer's "on my way" can never decode
as a guard's "en route" on a shared mesh.

### Why this matters for any advice you give us

A 12-person crew updating every 5 seconds is roughly **96 bytes per second**.
That is nothing. BLE advertising handles it trivially.

**Do not propose Wi-Fi Aware, Nearby Connections, venue Wi-Fi, or any
higher-capacity transport to solve a throughput problem.** We do not have a
throughput problem. Those transports would cost us the stranger-relay property
that is the entire product (see §10), in exchange for bandwidth we don't need.

If we ever build photo sharing, voice notes or rich offline maps, revisit this.
Not before.

## 5. The hardware

Exactly two devices, and they are not variants of each other.

| Device | Role | Per site | Cost | Status |
|---|---|---|---|---|
| **Loc8 Gateway** | **The brain.** Site database, hash-chained audit log, relay to Command, HQ sync, PKI — and the best mesh node in the building. Pi-class, wall-mounted, Loc8OS. | **exactly one** | $93–113 (standard tier) | 🟡 fully specced, none built |
| **Loc8 Anchor** | **The ears.** Stateless radio translator on a pole: BLE re-broadcast, or BLE⟷LoRa. No database, no state. If one dies, coverage shrinks and nothing is lost. | 0 to dozens | ~£60–75 (revised up from £30–40 once a front-end module is included) | 🟡 Phase 3 |

Facts that resolve recurring confusions:

- **Phones only ever speak BLE.** A phone cannot hear LoRa — different frequency
  (2.4 GHz vs 868 MHz) *and* different modulation. Anchors and the Gateway
  translate. Phones never know LoRa exists.
- **The Gateway is not a big Anchor.** It's the brain. The Anchor is
  deliberately dumb — statelessness is what makes it cheap, solar-viable and
  disposable.
- **Command needs no Bluetooth.** The Gateway is its radio.

## 6. Coverage: three layers, each covering what the one below cannot

The failure case is never the crowd. It's **empty ground between crowds** — no
amount of phone-to-phone hopping crosses a car park with nobody standing in it.

| Where | What carries it | Limit |
|---|---|---|
| Inside a crowd | Phone-to-phone hops | needs people |
| Across a zone | Anchor's elevated BLE | ~15–40 m in a dense crowd (see §9) |
| Empty ground | LoRa trunk, 868 MHz | ~1% duty cycle — positions and alerts, not chat |

## 7. The degradation ladder — the core design promise

```
phones ──▶ Gateway ──▶ Command ──▶ HQ
```

Read **right to left** for the failure story:

- HQ goes dark → site completely unaffected
- LAN dies → mesh and recording continue; you lose the console
- Gateway dies → phones still find each other

**Every layer's death returns you to a working system.** The leftmost layer is
the only mandatory one. Any proposal that makes phones depend on infrastructure
breaks this and should be rejected on those grounds alone.

## 8. Honest status — what is actually real

Be blunt with us about this; do not assume more is built than is.

**✅ Built and tested** — 274 tests across 27 suites. The engine (214 tests),
consumer app, Guard, Command, the ops-message grammar, and a bridged transport
that works in software.

**🟡 Specified but unbuilt** — Gateway hardware (all tiers), its power and
battery design, Loc8OS and its six daemons, the service portal, Anchors, the
cloud backend and HQ dashboard.

**🔴 Open, and one of them is existential:**

1. **The real Bluetooth mesh has never run between two physical phones.** The
   native module is 2,525 lines of written, never-executed Swift and Kotlin.
   Everything above assumes that radio works as designed. This is the gate.
2. **Payload encryption does not exist.** Zero lines. Every frame is plaintext
   on air today.
3. Multi-gateway venues, disaster recovery, fleet health — unspecified.

**Patents:** we researched this properly. All three candidate inventions failed
on prior art (Meshtastic, NIST SP 800-53, ETSI TETRA standards from 1997). We
are not pursuing patents. This means **no confidentiality constraint on
technical discussion** — you may reason about our design openly.

## 9. Radio reality — numbers to use

Two directions, and they are **not** symmetrical. This trips up almost everyone.

- **Anchor → phone (downlink):** anchor is mains-powered, elevated, external
  antenna, transmitting at the legal ceiling of 20 dBm EIRP (UK: Ofcom IR 2030).
- **Phone → anchor (uplink):** phone transmits at ~0–4 dBm, tiny internal
  antenna, in a pocket, against a body. Bodies are mostly water, which strongly
  absorbs 2.4 GHz.

| Link | Packed crowd | Open ground | Clear line of sight |
|---|---|---|---|
| Anchor → phone | ~50 m | ~150–200 m | up to ~1 km |
| **Phone → anchor** | **~25–30 m** | ~80–100 m | ~300–500 m |
| Anchor ↔ anchor (BLE) | — | ~300–500 m | 1–2 km |
| Anchor ↔ anchor (LoRa) | — | 1–3 km | 5–15 km |

**Plan spacing on the uplink number.** A friend-finder must *hear* phones. Space
anchors on the downlink figure and you build a network where users receive
perfectly and remain invisible — a failure that looks like success.

Vendor "100 m" claims are open-air, line-of-sight, downlink. Never quote them
for crowd conditions.

**What actually buys range, in order of value:** (1) mounting height — free, and
worth more than any component, because it lifts the antenna above the bodies;
(2) receive-side gain, since the uplink is the binding constraint and nobody
regulates how well you *listen*; (3) transmit power — legally capped, so there's
little headroom, and antenna gain counts against the same 20 dBm EIRP budget.

## 10. Common misunderstandings — please read before answering

These have all happened. Each produced confident, well-sourced, wrong advice.

| Misunderstanding | Reality |
|---|---|
| "Design a system that broadcasts to the crowd" | We are **peer-location**, not broadcast. Data flows *from* phones, many-to-many. Venue→crowd broadcast is a different product. |
| "Phones should be endpoints; fixed nodes should relay" | Phones relaying **is** the product. That's true for venue deployments as an *addition*, but Loc8 must work at a bare field with zero infrastructure on day one. Phone mesh is the floor; anchors are an amplifier. |
| "Use Wi-Fi Aware / Nearby Connections for the data" | **Cannot relay through strangers.** Those are pairwise links between consenting devices. Also: Wi-Fi Aware on iOS is iOS 26+ and iPhone 12+, Nearby Connections is Android-only. We'd have to build the BLE path anyway. And we don't need the bandwidth (§4). |
| "Bluetooth Mesh can carry 32,767 users" | 32,767 is the **unicast address space** of the SIG Bluetooth Mesh standard, not a crowd capacity. Also, phones cannot natively join a SIG mesh — they must be provisioned and hold a GATT Proxy connection. Our mesh is our own protocol, not SIG Bluetooth Mesh. |
| "BLE caps at ~20 connections, so this can't scale" | True but irrelevant. We **never connect**. Broadcast advertising has unlimited listeners. The 20-connection limit only applies to designs we don't use. |
| "Bluetooth reaches 100 m" | Open-air, line-of-sight, downlink only. In a dense crowd, plan 15–40 m, and half that for the uplink. |
| "Use Coded PHY for long range" | iPhones can't receive it — Apple removed support in iOS 14. Useless for reaching users. |
| "Just use a more powerful transmitter" | Illegal above 20 dBm EIRP in the UK, and it wouldn't fix the uplink anyway. |
| "The Gateway is a big Anchor" | No. Gateway = brain (one per site, holds the database). Anchor = dumb ears (many, stateless). |
| "Loc8 is an emergency communication system" | **Never describe it as one.** It supplements, never replaces, emergency services, steward instructions, PA systems or venue incident procedures. This is a legal and safety boundary. |

## 11. Fixed constraints — do not design around these

- **BLE advertising broadcast is non-negotiable** as the base transport. It is
  what enables stranger relay.
- **25-byte frames.** Anything larger doesn't fit a legacy advertisement.
- **Must work with zero infrastructure.** Any design requiring installed
  hardware to function at all is rejected.
- **No accounts, no servers required** for the consumer product.
- **UK first**, so Ofcom IR 2030 (20 dBm EIRP at 2.4 GHz), EN 300 328, Radio
  Equipment Regulations 2017, and Bluetooth SIG qualification apply.
- **iOS background restrictions are a known, unsolved risk** — iOS throttles
  background BLE scanning and advertising, coalesces discoveries, and may
  suspend the app. Do not assume backgrounded phones relay reliably. Mitigation
  under consideration is a screen-on relay mode.

## 12. What genuinely useful research looks like for us

Good:
- Measurement protocols and acceptance criteria for field tests
- Real-world BLE propagation data in crowds — especially **uplink**
- iOS/Android background radio behaviour, with citations to platform docs
- Component sourcing, prices, availability, lead times
- UK/EU compliance paths and what they cost in time and money
- Prior art and competitor teardowns
- Antenna, enclosure and mounting practice
- Anything that reduces the risk on the two-phone field test

Not useful:
- Higher-bandwidth transports (see §4)
- Venue-broadcast architectures (see §10)
- Anything assuming infrastructure is mandatory
- Vendor range claims repeated without conditions attached
- Advice that treats phones as passive receivers

**Always state your assumptions and cite sources.** We will check them. If you
are uncertain, say so — a flagged uncertainty is far more valuable to us than a
confident guess, because we make hardware decisions from this.

## 13. Our vocabulary

| Term | Meaning |
|---|---|
| **Frame / packet** | One 25-byte Loc8 message |
| **Crew** | A group of consumer users who joined by code or QR |
| **Gateway** | The one brain box per venue |
| **Anchor** | A dumb pole-mounted radio translator |
| **Trunk** | The LoRa link between anchors and the Gateway |
| **Command** | The control-room application |
| **Muster** | Roll-call: everyone confirms safe, the board names who hasn't |
| **The gate** | The two-phone field test — the unproven thing everything depends on |
| **Degradation ladder** | The design promise that each layer's failure falls back to a working system |

---

*If anything here contradicts what you were told in conversation, this file
wins. If anything here seems wrong or out of date, say so explicitly rather than
quietly working around it.*
