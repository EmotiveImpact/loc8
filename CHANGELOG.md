# Loc8 — Changelog

All notable work, mapped against the plans and specs it was built from. Newest first.

**Plans/specs this tracks against:**
- Spec: [`docs/superpowers/specs/2026-07-06-loc8-design.md`](docs/superpowers/specs/2026-07-06-loc8-design.md)
- Plan: [`docs/superpowers/plans/2026-07-06-loc8-v1-prototype.md`](docs/superpowers/plans/2026-07-06-loc8-v1-prototype.md) (Tasks 1–18)
- Spec: [`docs/superpowers/specs/2026-07-07-v2-mesh-spike-brief.md`](docs/superpowers/specs/2026-07-07-v2-mesh-spike-brief.md)

**Current state:** Expo SDK 57 · RN 0.86 · React 19 · app version `1.0.0` · **82 jest tests green (8 suites)** · `tsc --noEmit` clean · `npx expo export -p ios` bundles clean. Runs in the iOS simulator in **sim mode** (simulated transport); real BLE mesh (v2) runs only on hardware via `EXPO_PUBLIC_TRANSPORT=ble`.

Legend: ✅ done & verified · 🟡 built, needs hardware/user to finish · ⏳ deferred/not started

---

## [0.4.0] — 2026-07-08 · UX upgrade + offline real crews

The "Signal in the dark" design ported into the app, plus real (backend-free) crews and the identity/profile layer.

### Design system & navigation
- ✅ "Signal in the dark" theme — plum-black `#08070d`, sunset gradient = YOU, mint = signal, gold = Rally; fonts Unbounded / Sora / Space Mono (`src/ui/theme.ts`) — `b6448df`
- ✅ 5-slot bottom nav `Radar · Activity · [raised gold Rally] · Crew · Me` (`src/ui/TabBar.tsx`) — `b6448df`
- ✅ New **Activity** feed screen + **Me** profile screen; nav restructured Stack→Tabs — `b6448df`, `833775a`
- ✅ Glass surfaces (expo-blur) + typography across every screen — `8a4cf73`
- ✅ Background: flat dark (aurora prototyped then removed per feedback; `AuroraBackground.tsx` is the single re-tune point) — `833775a`, `8a4cf73`

### Radar
- ✅ Rotating **radar sweep** (mint wedge) — `0af2295`
- ✅ Sunset **pulsing beacon** + gradient friend blips — `833775a`
- ✅ **Structural fix:** rings, sweep, beacon & blips now share one `size×size` square origin (beacon was drifting below the rings on non-square layouts) — `5daba20`
- ✅ **Crew roster pull-up** — peek bar → Ping/Find sheet; floats under the tab bar so nav stays visible/tappable (Find My pattern) — `c8e8e26`, `0f66dcf`

### Offline real crews (no backend, no login)
- ✅ Crew = shared code (e.g. `FIRE-42`), FNV-1a hashed to a uint32 tag carried in each position packet's `targetId` — `0af2295`
- ✅ **Private mesh filtering** — only same-crew packets are accepted (gated on `autoAddPeers` so sim always shows the demo crew) — `0af2295`, `214efbc`
- ✅ Create / join via **code + QR** (`react-native-qrcode-svg`) + **camera scan** (`expo-camera`) + `loc8://crew/<code>` deep link — `0af2295`
- ✅ Onboarding "create or join your crew" step (skippable); crew persisted across relaunch — `0af2295`
- ✅ Crew tab is **management-only** (code/QR/sessions); roster moved to the radar — `c8e8e26`

### Identity / profile
- ✅ Editable display **name + accent colour** from the Me tab — `5daba20`
- ✅ **Local avatar photo** (`expo-image-picker`) — local-only (can't ride the 25-byte mesh packet) — `5daba20`
- ✅ Real **Settings** screen — notifications toggle, distance units, mesh/network info, about — `5daba20`
- ✅ "Privacy" row → "how your location is shared" explainer — `5daba20`

### Strategy & product docs (folded in earlier this phase)
- ✅ Product architecture ("one engine, four doors"), business model, security vertical, identity/privacy/login, mapping/terrain, anchors/hardware (`docs/strategy/`) — `eb46c1f`, `0a68998`, `4fb0ce0`
- ✅ Market models (interactive + plain-English) + coverage maps — `421cc1f`, `2fdd8d0`, `eb46c1f`
- ✅ Design mockup galleries: consumer (16 screens), Guard, Command, Ops, architecture map, anchor-hop (`docs/design/`) — `5b974ff`, `743bf24`, `d85cdc1`, `9593d44`, `7c01c0f`, `b99ddae`

---

## [0.3.0] — 2026-07-07 · v2 real-BLE mesh spike (`2026-07-07-v2-mesh-spike-brief.md`)

Same `LocationTransport` interface, real Bluetooth underneath. Toggle: `EXPO_PUBLIC_TRANSPORT=ble|sim`.

- ✅ Spike brief authored (bitchat protocol, Expo-module path, Bridgefy fallback) — `fd66727`
- ✅ Local Expo module `modules/loc8-mesh/` scaffold + `BleMeshTransport` + transport factory — `c49f1f6`
- ✅ **iOS** native mesh — Swift, ported from bitchat's public-domain code (bitchat v1 framing, dedup, TTL-7 relay, dual-role CoreBluetooth) — `95d5355`
- ✅ **Android** native mesh — Kotlin, clean-room from whitepaper (GATT dual-role, foreground service) — `5a688cc`
- ✅ Mesh review fixes — MTU-safe egress, rescan/reconnect, BLE permission request + un-latch, backpressure, subscriber-MTU gating — `9205ee4`
- ✅ BLE field-test **debug HUD** (sent/recv/peers/last-error) — `f2aa167`
- ✅ Real app ids `com.emotiveimpact.loc8`, run:ios/android scripts, app.json BLE/permission dedupe — `162d242`, `0820e8a`
- 🟡 **On-device field test** (spike §4 matrix, §5 go/no-go gates) — needs Xcode 26 or an EAS build + **2–3 physical phones**. Not yet run.

---

## [0.2.0] — 2026-07-06 · v1 hardening (post-plan bug-fix pass)

6-reviewer adversarial audit → 18 confirmed defects → 11 fixes, all applied + tested.

- ✅ Compass arrow was 90° off (glyph points east → `rotation − 90`) — `b502db5`
- ✅ Incoming-ping path was unreachable → `simulateIncomingPing` + dev scenarios — `ebffd53`
- ✅ Mesh service lifecycle (idempotent start / real stop / clearListeners) + AppState-gated open mode — `baa9073`
- ✅ Core hardening — reject future-dated packets, NaN-guard heading, heading modulo — `62341c3`
- ✅ Shareable rally pin + resilient location watch — `4d37a2d`
- ✅ Simulated crew re-anchors to real GPS origin on first fix (+ test) — `7f2272f`, `78777c0`
- ✅ Battery-monitor guard for platforms without the native module — `81a1fa8`
- ✅ Real app name + iOS/Android permission declarations — `cd6649f`

---

## [0.1.0] — 2026-07-06 · v1 prototype (Plan Tasks 1–18, all ✅)

TDD, one commit per task, simulated transport (no hardware). Every task verified with failing-tests-first → implement → green.

| Task | What | Commit |
|---|---|---|
| 1 | Scaffold Expo app + jest tooling | `07c8367` |
| 2 | Core types + haversine distance/bearing | `7548b46` |
| 3 | geoMath — movePoint, heading smoothing, piecewise radar scaling, north-up plot | `e9bf848` |
| 4 | Plus Codes (offline encoder, official OLC vectors) | `808c367` |
| 5 | PacketCodec — 25-byte binary format + validation | `f1fde62` |
| 6 | TrustLayer — replay rejection + last-write-wins | `65d718d` |
| 7 | Seeded RNG + deterministic SimulatedTransport (walk, relay lag, ping replies) | `d90d5a5` |
| 8 | crewStore (zustand) — crew state, session lifecycle, pins, freshness | `719c6d0` |
| 9 | meshService — transport→trust→store wiring, own-position broadcast, battery guardrails | `f2f4d0c` |
| 10 | Theme + app bootstrap (root layout, singleton wiring, onboarding redirect) | `fe0628f` |
| 11 | Onboarding — profile + location-permission priming + denied recovery | `a972220` |
| 12 | Radar — rings, live blips, freshness/ghost states, mesh badge, session CTA | `90ce69b` |
| 13 | Crew sheet (find/ping) + Crew screen (session lifecycle, mocked QR/link) | `ecf89e6` |
| 14 | Compass — smoothed heading arrow, warmth feedback, stale note | `7b0410e` |
| 15 | Proximity mode + found-each-other celebration (accuracy-adaptive) | `913539d` |
| 16 | Rally pin + privacy modal (go-dark) + Plus-Code share sheet + dev scenario menu | `dee7b56` |
| 17 | Ping round-trip — tappable banners + notification deep-links | `cb82012` |
| 18 | Battery guardrail, session-expired UX, README, v1 checklist | `8b5ebea` |

Core UX delivered: **north-up Radar → Compass → Proximity → found 🎉**, rally pins (latest-wins), Ping (reaches invisible-mode friends), 3-mode privacy + auto-expiring sessions, offline Plus Codes.

---

## Pending — open against the plans/goals

- 🟡 **v2 mesh field test** on real phones (spike §4/§5) — the one thing code can't finish; needs an EAS/dev build on 2–3 devices.
- ⏳ **Cloud accounts** — Supabase login (Apple/Google), `@handles`, persistent cross-event friend graph, crew-visible avatars. Deliberately deferred; user chose offline-first. (Design in `docs/strategy/identity-privacy-login.md`.)
- ⏳ **Distance-units formatting** applied app-wide (pref is stored in Settings; radar/blip formatting not yet switched).
- ⏳ **Loc8 Ops** (Guard app + Command console) — designed (`docs/design/`), not built.
- ⏳ **LoRa anchors** hardware — documented (`docs/strategy/anchors-hardware.md`), not started.
