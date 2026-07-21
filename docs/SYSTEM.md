# Loc8 — The Complete System

*One document. Every piece of hardware, every piece of software, how each
talks to each, and what state it's in. If you're confused about how anything
fits, start here; detail lives in the linked docs. Status marks: ✅ built ·
🟡 specified, unbuilt · 🔴 open. Updated 2026-07-20.*

---

## 1. The whole stack in one picture

```
  PEOPLE          RADIO            SITE INFRASTRUCTURE            OFF-SITE
─────────────────────────────────────────────────────────────────────────────
 consumer 📱 ─┐
 consumer 📱 ─┤                      ┌──────────────┐
 guard 📱 ────┼── BLE mesh ────────▶│ LOC8 GATEWAY  │── any uplink ──▶ HQ
 guard 📱 ────┤   (25-byte frames,   │  (Loc8OS)     │  (Ethernet/    portfolio
              │    7-hop relay,      │  site DB      │   wifi/LTE,    dashboard
              │    every phone       │  audit chain  │   store-and-
              │    relays)           │  relay        │   forward)
              │                      └──────┬───────┘
              │                             │ venue LAN (mTLS WebSocket)
 [ANCHOR] ◀───┘                             ▼
  BLE⟷LoRa translator on a pole      LOC8 COMMAND
  spans the empty seams (km)         (control-room computer —
  trunk head-end = the Gateway        needs no Bluetooth)
```

Read it left to right: **phones make the network, the Gateway makes it
infrastructure, Command makes it operable, HQ makes it visible.** Remove any
right-hand piece and everything to its left keeps working — that degradation
order is the core design promise.

## 2. All the hardware

| Device | What it is | Runs | Per site | Status |
|---|---|---|---|---|
| **Consumer phone** | Any modern iPhone/Android with BLE | Loc8 app | crowds | app ✅ · BLE module 🔴 never run on hardware |
| **Guard phone** | Same phones, staff-carried | Loc8 Guard | one per staff | app ✅ · same BLE caveat |
| **Loc8 Gateway** | Wall-mounted Pi-class box, ~120×90×35 mm. Tier A demo $~40 · **Tier B standard $93–113** · Tier C ruggedized $180–240 (adds LFP battery, eMMC, dual radios, tamper). Add-ons any tier: LTE dongle, LoRa concentrator | **Loc8OS** | **one** (the brain) | 🟡 fully specced, zero built |
| **Loc8 Anchor** | nRF52840-class stateless **listening post** (BLE re-broadcast / BLE⟷LoRa; nRF21540 front-end for +13 dB RX gain — the uplink is the binding constraint, and receive is the only side money improves), **~£60–75** (revised 2026-07-21 from £30–40; the better ears cover ~4× the area so per-venue cost is flat or lower), battery/solar/PoE, pole-mounted **above head height**. Spacing planned on uplink: ~25–30 m in crowd. Full rules: `hardware/anchor-deployment.md` | tiny firmware (not Loc8OS) | 0–dozens (the ears) | 🟡 Phase 3, gated on field test; £230 3-board bench spike may run early |
| **Command computer** | Any laptop/desktop on the venue LAN. **No Bluetooth needed** — the Gateway is its radio | Loc8 Command (browser now; Tauri desktop 🟡 for claim flow) | 1–2 | app ✅ |
| **HQ** | Anything with a browser | cloud dashboard | — | 🔴 no backend exists |

Key hardware facts that answer recurring confusions:
- **Phones cannot hear LoRa** (different frequency *and* modulation). Anchors
  and the Gateway's LoRa module translate; phones only ever speak BLE.
- **The Gateway is not a big anchor** — it's the brain (database, audit, PKI,
  sync). The anchor is deliberately dumb so losing one loses nothing.
- **Battery:** Tier C standard, Tier B option. It keeps the mesh + site record
  alive through a power cut; it does **not** keep the control room up (the PoE
  switch dies too). Full power spec: `hardware/loc8-gateway.md` §9.

## 3. All the software

| Piece | What it does | Where it runs | Status |
|---|---|---|---|
| **`@loc8/engine`** | The one shared core, never forked: 25-byte packet codec, mesh service (relay/dedup/TTL), transports (simulated · BLE · bridged), ops-message grammar, stores | inside every app below | ✅ 214 tests / 20 suites |
| **Loc8 (consumer)** | Radar → Compass → Proximity → found; crews by code/QR, no account, no server | consumer phones | ✅ |
| **Loc8 Guard** | Team map, hold-to-fire SOS, dispatch + status replies (codes 20–23), duress (9), lone-worker, muster | guard phones | ✅ 8 tests |
| **Loc8 Command** | Operations, incident timelines, muster board, coverage heatmap, audit log, dispatch | control-room computer | ✅ 52 tests / 6 suites |
| **Partner SDK** | The finder embedded in someone else's app | partner apps | 🔴 unwritten (4th door) |
| **`modules/loc8-mesh`** | The native BLE radio code (2,525 lines Swift + Kotlin) | phones | 🔴 never compiled/run on hardware — **the gate** |
| **`tools/mesh-bridge`** | Dev-era relay; grows into `loc8-relayd` | laptop (fallback mode) | ✅ |
| **Loc8OS** | The Gateway appliance image: 6 daemons (`meshd`·`relayd`·`sited`·`syncd`·`provisiond`·`supervisord`), read-only root, A/B signed updates, service portal, power contract | the Gateway | 🟡 specced (`software/loc8os.md`) · interactive sim: `design/loc8os-simulator.html` |
| **Anchor firmware** | Dumb BLE⟷LoRa translation, nothing else | anchors | 🔴 Phase 3 |
| **Cloud spine + HQ dashboard** | Per-site tiles, event backfill, fleet health | cloud | 🔴 specced only |
| **Payload encryption (AEAD) + rotating pseudonyms** | Per-shift keys, applied in the engine so every door inherits it. Scope grew 2026-07-21: `senderId` is today a **stable plaintext identifier** — a £20 BLE sniffer can follow one person all night — so gate ④ = encrypt **and** rotate IDs. Hard prerequisite for any public pilot ("no stable attendee identifier observable in plaintext" is a pilot acceptance gate) | everywhere | 🔴 **zero lines — frames are plaintext today** |

## 4. The protocol — the thing everything shares

- **One 25-byte frame** carries everything: who, where, floor (packed inside
  heading's spare bits), battery, time, accuracy. 8 types: position, pings,
  rally, quick-reply, text (11-byte fragments, ≤160 B), profile, SOS.
- **Relay rules:** TTL 7 (clamps to 5 in dense crowds), dedup never forwards
  twice. This is what makes a crowd a network and stops it flooding itself.
- **Audience separation on a shared mesh:** consumer crews = crew codes;
  ops = team tags; consumer quick-replies use codes 1–7, ops statuses 20–23 —
  deliberately disjoint so a festival-goer's "on my way" can never decode as a
  guard's "en route".
- **Ops grammar** (`core/opsMessages.ts`): DISPATCH / MUSTER / MUSTER SAFE /
  SOS / LONE OVERDUE — human-readable *and* machine-parseable, so Guard and
  Command can never drift apart.

## 5. How a message actually travels (five walkthroughs)

1. **Consumer ping in a club (with a Gateway):** your phone broadcasts;
   nearby phones relay; the Gateway — high, always-on, big antenna — relays
   too, bridging the main-room↔terrace hole no phone-chain covers at 3am.
   It stores nothing about consumer frames; it's just the best neighbour.
2. **SOS at a festival:** guard's phone fires SOS → hops through the crowd →
   nearest anchor's BLE → LoRa trunk across the empty car park → Gateway
   (trunk head-end) → persisted `WAL`+`synchronous=FULL` in `site.db` → LAN → every
   Command console + nearest-responder dispatch → status replies ride back
   the same path.
3. **Muster:** Command broadcasts MUSTER → every Guard screen flips → each
   "safe" confirmation hops back → the board fills in and **names who's
   missing**. Works identically with zero internet.
4. **Power cut:** Gateway latches ON-BATTERY, checkpoints the DB, sheds
   housekeeping (never the mesh or SOS/muster writes), tells HQ over LTE.
   Phones never notice. Consoles drop with the LAN — the honest limit.
5. **Owner on a beach:** Gateway syncs events over any pipe → HQ tile shows
   the site live, or "last synced 06:40" honestly, backfilling on reconnect.

## 6. Deployment recipes

| Venue | Recipe |
|---|---|
| Nightclub / warehouse | 1× Gateway Tier B on the wall. No anchors. (The pilot config.) |
| Festival | 1× Gateway Tier C (+LoRa +LTE) in production office · anchors on the empty seams (arena↔campsite, car parks) · guards on Guard, crowd on consumer/SDK — same mesh |
| Stadium | Gateway + anchors; **multi-gateway is an open design gap** (checklist #2) |
| Cruise / industrial | Tier C + anchors in the steel dead-spaces |
| No Gateway at all (fallback) | Any guard phone bridges mesh→laptop console. Weaker, always works, stays tested |

## 7. Security & privacy, one table

| Layer | Mechanism | Status |
|---|---|---|
| No honeypot | Locations live on devices; no central location store *exists* | ✅ architectural, true today |
| Consent | `ConsentBasis` union has no god-mode member; crowd = anonymous per-zone counts only; assisted-search reason-gated + audited | ✅ (asserted at ingest — PKI closes it 🟡) |
| Relay auth | mTLS device certs to reach the Gateway socket | 🟡 |
| Payload encryption | AEAD, per-shift keys, in the engine | 🔴 **the biggest gap — plaintext today** |
| Operator identity | Login on Command; hash-chained audit; chain head exported off-box | 🔴 SSO open · chain ✅ in spec |

## 8. Where everything stands, and what's next

**Built & verified:** engine + all three apps (274 tests / 27 suites green),
ops grammar, bridged transport (software-verified), the docs/design system.
**Specced, unbuilt:** Gateway hardware, Loc8OS, anchors, cloud spine.
**Open:** the five gates, in order — ① two-phone field test (**everything
hangs on this**) → ② reconcile the contradictory repo record → ③ `loc8-meshd`
bench spike → ④ payload encryption → ⑤ one paying pilot.

Full tracking, including the newly identified gaps (RTC, multi-gateway,
box-swap DR, fleet heartbeat): **[MASTER-CHECKLIST.md](MASTER-CHECKLIST.md)**.

## 9. Confusions this document exists to kill

- *"Does the OS have a screen?"* No — lens on the box, portal in a browser
  (`loc8-gw.local`), Command for operations, serial at the bench only.
- *"Can a phone hear LoRa?"* Never. Translators (anchor/Gateway) re-speak it
  as BLE.
- *"Is the anchor a small Gateway?"* No — brain vs ears. One is a database
  with radios; the other is radios with nothing to lose.
- *"Does the Gateway surveil the crowd?"* It relays consumer frames like any
  phone would and records none of them. The site DB holds consented ops data
  only.
- *"Does it charge like a phone?"* No — LFP float device: charge, rest,
  re-top by coulomb count (`hardware/loc8-gateway.md` §9.1).
- *"Same hardware for clubs and festivals?"* Same two products, different
  quantities and add-on modules (§6).
