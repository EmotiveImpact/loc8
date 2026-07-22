# Loc8 — Master Checklist

*The come-back-to-this document. Every open item across the whole system, in
dependency order, with where it's specced. If something isn't on this list or
in a linked doc, it hasn't been thought about — add it here when you think of
it. Updated 2026-07-22.*

**How to read status:** ✅ done · 🟡 specced, unbuilt · 🔴 open / unstarted ·
⚠️ newly identified gap, not yet specced anywhere.

---

## The five gates (in order — each gates the next)

| # | Gate | Status | Where |
|---|---|---|---|
| 1 | **Field proof** — real BLE mesh on 2–3 physical phones: range, relay through body/wall, hops, latency, battery over a shift, iOS background | 🔴 **THE gate.** Repo record is contradictory (CHANGELOG says both "proven" and "not yet run") | `superpowers/specs/2026-07-07-v2-mesh-spike-brief.md` · brief §01 |
| 2 | **Reconcile the record** — one honest status line across CHANGELOG / docs/README / eas-builds | 🔴 | brief §01 |
| 3 | **`loc8-meshd`** — Linux BLE port on a bench Pi vs two phones | 🟡 specced | `software/loc8os.md` §2 |
| 4 | **Payload encryption** — AEAD, per-shift keys, in the engine so all doors inherit | 🔴 zero lines | `hardware/loc8-gateway.md` §6 Layer 2 |
| 5 | **One paying pilot** — one venue/firm, measured SOS response + muster completeness | 🔴 | `strategy/security-vertical.md` |

## Product doors

| Door | Status | Notes |
|---|---|---|
| Consumer app | ✅ built | Offline crews via code/QR; cloud accounts deferred by choice |
| Loc8 Guard | ✅ built | Foreground-only lone-worker timer ⚠️ (no background monitoring) |
| Loc8 Command | ✅ built | Browser app today; desktop (Tauri) wrap 🟡 for gateway claim flow |
| Partner SDK | 🔴 unwritten | The fourth door — deferred by choice |

## Building, mapping and floor foundation

| Item | Status | Notes |
|---|---|---|
| Shared semantic venue package + validation | ✅ built/tested | Stable levels/spaces/zones/connectors/portals/routes; synthetic evidence only |
| Command Commissioning / Map Builder | ✅ built/tested | Editable browser draft/local demo; not site truth |
| Guard projections + legacy floor boundary | ✅ built/tested | Same venue package; no automatic physical floor result |
| Gateway distribution contract + simulator | ✅ contract/simulator | Durable target store, reviewed signing and hardware repeat remain 🔴 |
| Expo 57 phone sensor adapter + replay | ✅ software seam | Native permission/background/rate/accuracy cohorts remain 🔴 |
| Plan import + control-point registration | ✅ software seam | Strict pixel→metre fit/receipt; real plan, physical points and second operator remain 🔴 |
| Coverage-aware operational digital twin | 🟡 foundation built | Fuse verified radio/floor/person confidence only after physical experiments |

## Gateway / Loc8OS

| Item | Status | Where |
|---|---|---|
| Hardware BOM tiers A/B/C | 🟡 specced | `hardware/loc8-gateway.md` §2 |
| Power & battery (LFP, shed, shutdown ladder) | 🟡 specced, adversarially verified | §9 — **bench list §9.7 must run before ordering volume** |
| Tier C carrier (charger + fuel gauge NRE) | 🔴 no off-the-shelf board fits | §9.4 |
| Loc8OS image (6 daemons, A/B, portal) | 🟡 specced | `software/loc8os.md` · simulator: `design/loc8os-simulator.html` |
| Compliance (UN 38.3, 62368-1, EU 2023/1542, EPR) | 🔴 ~£4–9k battery increment on ~£15–39k base | §9.6 — pilot units ship legally pre-cert (SP 310) |
| Cloud spine + HQ portfolio dashboard | 🟡 specced only | `hardware/loc8-gateway.md` §7 |
| Operator SSO / login on Command | 🔴 | `strategy/identity-privacy-login.md` |

## ⚠️ Newly identified gaps (nowhere in the specs yet — captured here so they aren't lost)

1. **No real-time clock.** The Pi 4/CM4 has no battery-backed RTC. An offline
   site that power-cycles boots with a wrong clock → wrong timestamps on the
   audit chain until an uplink appears. Fix is a ~$2 RTC on the Tier C carrier
   + NTP-from-Command fallback for Tier B. *Cheap; matters enormously for a
   legal-record product.*
2. **Multi-gateway sites.** A stadium needs >1 box. Which one owns `site.db`?
   How do two gateways dedup/hand off? Entirely unspecced — fine for pilots
   (one box), must be answered before any large-venue sale.
3. **Box-swap / DR procedure.** A gateway dies mid-contract: how does the spare
   inherit the site DB, identity, and enrolled certs? Related: scheduled backup
   of `/var/lib/loc8` off-box (syncd covers events, not a restorable image).
4. **Fleet health monitoring.** Who notices a dead gateway whose uplink was
   already down? HQ needs an expected-heartbeat model, not just last-synced.
5. **Battery service interval.** LFP at float should last years, but §9.7 item
   5 (summer temperature log) sets the real interval — and EU 2023/1542 Art. 11
   (from Feb 2027) likely forces a user-replaceable pack design anyway.
6. **eas-builds.md is partially stale** — flagged in-file 2026-07-20; reconcile
   with `eas.json` when next touched (part of gate 2).
7. ~~**Gateway vs Anchor ambiguity**~~ — RESOLVED 2026-07-20: one family, two
   products. Gateway = Pi-class brain running Loc8OS, one per site; Anchor =
   ESP32-class stateless radio translator (~£30–40), many per site, Phase 3.
   Recorded in `hardware/loc8-gateway.md` §2 "The hardware family". Anchor
   firmware itself remains 🔴 unbuilt (correctly — gated on the field test).

## Standing corrections (do not re-introduce these)

- Never claim "survives power cuts" unscoped — battery is Tier C standard /
  Tier B option, and the PoE switch dies in the same outage (no console).
- Tier B BOM is **$93–113**, not $95–120. "UPS HAT ~$25" was board-only.
- The consumer app makes **no encryption claim** (removed 2026-07-20 — there is
  no encryption). Do not re-add until AEAD ships.
- Demo data uses invented venue names only.
- TAM: corrected ≈£1.13B consolidated / ≈£410M reachable; the £240M security
  line is *not* part of that table. ~350k UK operatives is unsourced.
- Competitive claim is "network-independent live location", not "live location"
  — MOTOTRBO ships GPS; guard-tour platforms have live GPS.
- Audit log in Command is bounded at 2000, dropped not archived (Gateway's
  `sited` is the fix).

## The architecture in one paragraph (so nobody has to re-derive it)

One engine (`@loc8/engine`), never forked. Phones (Guard + consumer) speak the
25-byte BLE mesh directly to each other. **Each venue gets one Gateway box
running Loc8OS** — the always-on, best-antenna mesh node that also holds the
site database. **Loc8 Command runs on a normal computer** and connects to the
Gateway over the venue LAN (mTLS WebSocket to `loc8-relayd`) — the computer
never needs Bluetooth. The Gateway syncs to HQ's portfolio dashboard over any
uplink (Ethernet/Wi-Fi/LTE), store-and-forward when there is none. Fallback
with no Gateway: any guard phone bridges the mesh to a laptop console — both
paths stay tested.
