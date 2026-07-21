# Loc8 — Knowledge Base

**Find your people when the network is dead.** An offline Bluetooth-mesh locator (phone-to-phone, with optional LoRa anchors) — that grows from a consumer festival app into a security/ops platform and a hardware-backed venue system.

This folder is the **dev-ready knowledge base**: everything decided so far, so anyone can pick up any arena and expand. Start here.

---

# 📖 READING ORDER — start here, ~45 minutes

*Added 2026-07-21. The knowledge base grew fast; this is the path through it.
Everything below this box is reference material — consult it when a decision
arrives, don't read it end to end.*

### If a word doesn't make sense
**[GLOSSARY.md](GLOSSARY.md)** — every term in this repo in plain English:
BLE, TLS, uplink vs downlink, capture effect, EIRP, dev boards, body-worn
anchor, Martyn's Law tiers, TAM, the lot. If a term in any Loc8 document isn't
in there, that's a bug — add it.

### If you read only one thing
**[BUSINESS.md](BUSINESS.md) → the "THE PLAN, IN PLAIN ENGLISH" box at the top.**
Four steps, the order of operations, and what the market research actually
concluded. Five minutes.

### The 45-minute path

| # | Read | Why | Time |
|---|---|---|---|
| 1 | [BUSINESS.md](BUSINESS.md) — the PLAN box | What we do and in what order | 5 min |
| 2 | [SYSTEM.md](SYSTEM.md) §1–4 | What the thing actually is | 10 min |
| 3 | [market-expansion-report.md](research/market-expansion-report.md) — Exec summary + §3 (the tier tables) + §4 (money on the table) | Where the market is, where it isn't, and what we're leaving on the table | 20 min |
| 4 | [data-strategy.md](strategy/data-strategy.md) | The five rungs — how the ceiling gets raised | 10 min |

### Consult when the decision arrives — not before

| When you're about to… | Read |
|---|---|
| Run the field test | [testing/field-test-protocol.md](testing/field-test-protocol.md) |
| Buy or place Anchors | [hardware/anchor-deployment.md](hardware/anchor-deployment.md) + [hardware/build-guide.md](hardware/build-guide.md) |
| Know what hardware exists, what's in it, how it updates | [hardware/CATALOGUE.md](hardware/CATALOGUE.md) |
| Write anchor firmware — **read first, it has 5 open decisions** | [software/mesh-network-design.md](software/mesh-network-design.md) |
| Build hardware | [hardware/loc8-gateway.md](hardware/loc8-gateway.md), [software/loc8os.md](software/loc8os.md) |
| Talk to a venue about compliance | [compliance.md](compliance.md) |
| Discuss defence, or a drone/vehicle idea | market report §6 — both answered, mostly "no", with the physics |
| Ask ChatGPT for research | Paste [BRIEFING-FOR-AI.md](BRIEFING-FOR-AI.md) first — it exists because un-briefed AI research has twice answered the wrong question |
| Quote a price | [BUSINESS.md](BUSINESS.md) pricing architecture (note the £1,490 lesson) |

### ⚠️ Superseded — do not plan from these
- [strategy/business-model.md](strategy/business-model.md) — festival counts wrong by ~4×; correction banner at the top of the file. Retained as original reasoning, not guidance.
- The "Roadmap (phases)" section below — written before the connected-first decision. **We no longer gate revenue on the field test.** See BUSINESS.md.

---

## Where things stand (2026-07-20)

> **274 tests green · 27 suites** (engine 214/20 · Command 52/6 · Guard 8/1) · tsc clean.

- **Guard + Command — BUILT.** Guard (Expo SDK 57): team map, hold-to-fire SOS, dispatch + status replies, lone-worker, muster. Command (Vite/React 19): operations, incident detail, muster board, coverage heatmap, durable audit. Two-way ops grammar (`core/opsMessages.ts`) closes the Guard↔Command loop; live bridge verified in software (simulated transport bridged — **not yet real BLE**).
- **Gateway appliance — SPECIFIED, unbuilt.** [hardware/loc8-gateway.md](hardware/loc8-gateway.md): BOM tiers, §9 power & battery (LFP, adversarially verified). Software: [software/loc8os.md](software/loc8os.md).
- **Master brief — SHIPPED.** [brochure/loc8-ops-brief.html](brochure/loc8-ops-brief.html) — one document for investors/CEO/technicians/staff, every claim graded verified/specified/open.
- **Still open:** the 2–3 phone field test (the make-or-break gate — the repo record on it is contradictory, see the brief §01), payload encryption (zero lines), operator SSO, cloud spine, SDK door.

---

## Where things stood (2026-07-08 · v0.4.0)

> Full commit-by-commit log: [`CHANGELOG.md`](../CHANGELOG.md) (repo root). **82 tests green · tsc clean · bundles clean.**

- **v1 (consumer prototype) — BUILT & green.** Expo SDK 57 app, simulated transport, full UX: Radar → Compass → Proximity → 🎉, pings, rally pins, sessions, privacy modes, Plus-Code sharing.
- **UX upgrade — DONE.** "Signal in the dark" theme + fonts, 5-slot nav (Radar · Activity · [Rally] · Crew · Me), rotating radar sweep, glass surfaces, flat-dark background. Editable profile (name/accent/**local** avatar) + real Settings screen. Crew roster pull-up on the radar; Crew tab = management.
- **Offline real crews — DONE (no backend, no login).** Crews via **shared code + QR + scan + `loc8://crew/<code>` deep link**; private mesh filtering (only your crew shows); persisted. This is the **offline-first** path — cloud accounts are **deferred** (see [identity-privacy-login.md](strategy/identity-privacy-login.md) → "Status 2026-07-08").
- **v2 (real BLE mesh) — spike built, pending on-device test.** Native `loc8-mesh` module (iOS Swift + Android Kotlin), bitchat-style wire protocol, behind the same `LocationTransport` interface (flip `EXPO_PUBLIC_TRANSPORT=ble`). Needs an EAS build on 2 physical phones to validate. **("Version" here = the transport, not a feature set — all the UX above ships in both.)**
- **Strategy & design — extensively mapped** (this folder + `design/` mockups). Enterprise (security/ops), verticals, anchors, identity, maps all specced but not yet built.

---

## The roadmap (phases)
1. **Prove the phones** — v1 simulated ✓ → v2 real Bluetooth mesh on 2–3 phones (the make-or-break test). Fallback: Bridgefy. *(Unblocked: offline code/QR crews ✓ + UI upgrade ✓ shipped, so a real 2-phone test needs only the EAS build.)*
2. **Consumer product** — UI upgrade ✓, **offline-first crews ✓ (shipped)**; **then** cloud accounts/login (Supabase), persistent cross-event crews, Crew Pass + Plus subscription. *(Offline-first came first by choice; cloud is the deferred next step.)*
3. **Enterprise** — Loc8 Guard (field app) + Loc8 Command (control room), sold to security/guarding firms & venues.
4. **Anchors (hardware)** — BLE↔LoRa boxes for venue-wide coverage + indoor positioning. Only after the phone protocol is locked.
5. **Verticals at scale** — cruise, theme parks, ski, stadiums, industrial — same engine, feature modules + SDK.

---

## Index

### 🗺 [SYSTEM.md](SYSTEM.md) — the complete system on one page
Every device, every piece of software, the protocol, five message walkthroughs, deployment recipes per venue, the security table, and the confusion-killer FAQ. **Read this first if you're lost.**

### ✅ [MASTER-CHECKLIST.md](MASTER-CHECKLIST.md) — start here when returning
Every open item across the whole system in dependency order: the five gates, door status, gateway/OS items, newly identified gaps (RTC, multi-gateway, box-swap DR, fleet health), and the standing corrections that must not be re-introduced.

### 📄 The brochure (`docs/brochure/`)
| Doc | What it covers |
|---|---|
| [brochure/loc8-ops-brief.html](brochure/loc8-ops-brief.html) | **The Operations Master Brief** — one matte-black document for four audiences (investor / CEO / technician / staff), routed by a margin rail. Colour is load-bearing: green = verified in this repo, amber = specified, red = open. Custom SVG diagrams (mesh relay, 25-byte byte-map from the real codec offsets, Gateway topology). The single best "explain everything" artifact. |

### 📦 Hardware (`docs/hardware/`)
| Doc | What it covers |
|---|---|
| [hardware/loc8-gateway.md](hardware/loc8-gateway.md) | **The Gateway appliance** — why a box, BOM tiers A/B/C, physical spec, daemons summary, plug-and-play lifecycle, security layers, off-site sync, engineering order. **§9 Power & battery** is normative: LFP float behaviour, runtime arithmetic, the PoE-switch limit, load-shedding + shutdown contract, compliance increment, bench-measurement list. |

### 💽 Software (`docs/software/`)
| Doc | What it covers |
|---|---|
| [software/loc8os.md](software/loc8os.md) | **Loc8OS — the appliance image.** Base-system decisions, the six-daemon stack (`meshd`/`relayd`/`sited`/`syncd`/`provisiond`/`supervisord`), device states → status lens, power contract, storage layout, A/B signed updates, §7a local service portal + recovery mode, provisioning lifecycle, build order. |

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
| [loc8os-gallery.html](design/loc8os-gallery.html) | **Loc8OS reflected in the products:** animated status-lens states, bench `loc8 status` consoles (normal vs mid-power-cut), journald at mains loss, Command claim/health cards, HQ portfolio tiles. |
| [loc8os-ui.html](design/loc8os-ui.html) | **Loc8OS's own three faces:** the serial boot sequence, the local service portal (health + org-key maintenance), recovery mode. |
| references/ (ref-lunor · ref-taskplus · ref-kravio · command-v2-concept) | Pixel-replication studies of reference UIs + the Command v2 shading concept derived from them. |

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
