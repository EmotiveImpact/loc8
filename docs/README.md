# Loc8 — Knowledge Base

**Find your people when the network is dead.** An offline Bluetooth-mesh locator (phone-to-phone, with optional LoRa anchors) — that grows from a consumer festival app into a security/ops platform and a hardware-backed venue system.

This folder is the **dev-ready knowledge base**: everything decided so far, so anyone can pick up any arena and expand. Start here.

---

## Where things stand (July 2026)
- **v1 (consumer prototype) — BUILT & green.** Expo SDK 57 app, simulated transport (fake crew), full UX: Radar → Compass → Proximity → 🎉, pings, rally pins, sessions, privacy modes, Plus-Code sharing. Lucide icons, real per-device identity. Runs in the iOS simulator with an instant edit→reload loop. ~70 tests green.
- **v2 (real BLE mesh) — spike built, pending on-device test.** Native `loc8-mesh` module (iOS Swift + Android Kotlin), bitchat-style wire protocol, behind the same `LocationTransport` interface (flip `EXPO_PUBLIC_TRANSPORT=ble`). Needs an EAS build on 2 physical phones to validate.
- **Strategy & design — extensively mapped** (this folder + `design/` mockups). Enterprise (security/ops), verticals, anchors, identity, maps all specced but not yet built.

---

## The roadmap (phases)
1. **Prove the phones** — v1 simulated ✓ → v2 real Bluetooth mesh on 2–3 phones (the make-or-break test). Fallback: Bridgefy.
2. **Consumer product** — accounts/login (Supabase), persistent crews, Crew Pass + Plus subscription, the UI upgrade.
3. **Enterprise** — Loc8 Guard (field app) + Loc8 Command (control room), sold to security/guarding firms & venues.
4. **Anchors (hardware)** — BLE↔LoRa boxes for venue-wide coverage + indoor positioning. Only after the phone protocol is locked.
5. **Verticals at scale** — cruise, theme parks, ski, stadiums, industrial — same engine, feature modules + SDK.

---

## Index

### 📐 Product & strategy (`docs/strategy/`)
| Doc | What it covers |
|---|---|
| [product-architecture.md](strategy/product-architecture.md) | **One engine, four doors** (Loc8 / SDK / Guard / Command). version = who you are · setting = which doors · engine = same mesh. Settings→doors matrix. Start here for "how does it all fit." |
| [business-model.md](strategy/business-model.md) | Two engines (consumer self-serve + org deals), Crew-Pass/host-pays, Life360 comp, per-vertical TAM/SOM, phased revenue. |
| [security-vertical.md](strategy/security-vertical.md) | Loc8 Ops — the security/response wedge (possibly the strongest). The gap, buyer model (guarding firm vs venue), use cases, competitors, pricing. |
| [identity-privacy-login.md](strategy/identity-privacy-login.md) | Accounts + @handles + friend graph, mutual-consent rule, two-layer (online handle→keys / offline cache), login (Apple/Google/Supabase, online-once/offline-after), **"what can the business see" consent ladder** (never god-mode; no central location store). |
| [mapping-terrain.md](strategy/mapping-terrain.md) | Offline maps: consumer = radar (no map); ops = geo-referenced site plan + zones cached; indoor = anchors/RTLS. Tech (MapLibre/OSM/GeoJSON). |
| [anchors-hardware.md](strategy/anchors-hardware.md) | Phase-3 hardware recipe: LoRa vs BLE, phones = BLE-only, anchor = BLE↔LoRa bridge, Meshtastic, BOM (~£30 boards), firmware plan, duty-cycle/legal, indoor positioning. |
| [market-model-simple.html](strategy/market-model-simple.html) · [market-model.html](strategy/market-model.html) | Interactive market models (plain-English + full). Drag sliders → live TAM/SOM. |
| [coverage-maps.html](strategy/coverage-maps.html) | 3 coverage options (phones only / +BLE anchors / +LoRa backbone) on a real festival footprint. |

### 🎨 Design (`docs/design/`)
| File | What it shows |
|---|---|
| [design/README.md](design/README.md) | The design system (consumer "Signal in the dark" + tactical ops), type, icons, nav decision, and a full mockup index. **Read this to navigate the mockups.** |
| architecture-map.html | The one-engine-four-doors map. |
| ui-upgrade-v1.html · ui-upgrade-nav.html · rally.html | Consumer visual upgrade + bottom-nav + Rally. |
| gallery-consumer.html (15) · gallery-guard.html (7) · gallery-command.html (5) | Full screen galleries across all three products. |
| loc8-ops.html · anchor-hop.html | Ops intro; animated BLE→LoRa→BLE hop. |

### 🛠 Build specs & plans (`docs/superpowers/`)
| Doc | What it covers |
|---|---|
| specs/2026-07-06-loc8-design.md | The v1 product spec (Radar/Compass/etc., architecture, decisions). |
| plans/2026-07-06-loc8-v1-prototype.md | The v1 implementation plan (task-by-task). |
| specs/2026-07-07-v2-mesh-spike-brief.md | The v2 real-mesh spike brief (bitchat protocol, Expo native module, Bridgefy fallback, test matrix, go/no-go). |

---

## Where dev picks up, per arena
- **Ship the mesh** → build/verify EAS on 2 phones (`preview` profile = BLE). See the v2 spike brief.
- **Consumer product** → login/accounts (`identity-privacy-login.md`, Supabase) + the UI upgrade (`design/README.md`).
- **Security (Guard + Command)** → new apps on the same engine; `security-vertical.md` + `gallery-guard.html` / `gallery-command.html`.
- **Anchors** → `anchors-hardware.md` (Phase 3; only after the phone protocol is locked).
- **Maps** → `mapping-terrain.md` (radar first; geo-referenced site plans for ops).

---

## The non-negotiables (carry these into every arena)
- **Offline-first.** It must work with zero signal. Login/pairing/pass-purchase happen *online beforehand*; use is offline.
- **Mutual consent only.** Never locate a stranger. No silent god-mode. Architect so central surveillance *can't* be built — that's the moat and the liability shield.
- **One engine.** Everything reuses the `LocationTransport` + wire protocol. Don't fork the core per vertical — add feature modules + surfaces.
