# Loc8 Design System

Loc8 is an offline festival friend-finder: find your crew when the signal's gone.
The product runs on **one engine, four doors** — a single mesh/locate engine surfaced
through a **Consumer** app, a **Guard** app, and a **Command** dashboard.

This folder holds the design targets — browser-openable HTML mockups. They are the
source of truth for look, motion, and layout. The React Native app (Expo SDK 57)
ports from these screen-by-screen.

---

## Design direction

Loc8 runs **two tonal registers on one design system**. Same type, same iconography,
same component grammar — two moods for two audiences.

### Consumer — "Signal in the dark"

A luminous night. Emotional, premium — relief + energy.

- **Background** — plum-black aurora with film grain overlay.
- **Surfaces** — glass cards (translucent, blurred, hairline stroke).
- **SUNSET gradient (rose → coral → amber) = YOU.** Your beacon, your active nav, your identity.
- **Electric MINT `#5ef2c8` = signal / your crew.** The "found" color.
- **Periwinkle `#7aa2ff` = secondary crew** (other people, softer signal).
- **GOLD `#ffce4d` = Rally** — the "everyone meet here" moment.

### Ops (Guard / Command) — tactical

Mission-control. Darker, denser, data-forward.

- **Background** — near-black `#06070d`.
- **Type** — monospace for all data (times, coords, IDs, counts).
- **GREEN `#46e0a0` = on-duty / OK.**
- **AMBER `#ffb43a` = caution / lone-worker.**
- **RED `#ff4053` = SOS / active incident.**
- **BLUE `#7aa2ff` = you / info.**

---

## Type

Loaded via Google Fonts.

| Face | Role |
| --- | --- |
| **Unbounded** | Display — logo, big numbers, screen titles |
| **Sora** | UI / body — labels, buttons, running text |
| **Space Mono** | Data — times, coords, counts (**ops registers only**) |

---

## Iconography

- **Lucide-style line icons** — inline SVG, stroke-based, round caps, no fill.
- **No emoji inside app UI.** (Emoji only ever appear as celebration content, e.g. the 🎉 payoff moment as art — never as functional iconography.)
- The RN app uses **`lucide-react-native`** so shipped icons match the mockups 1:1.

---

## Components

- **Phone frame** — the standard device shell every consumer/guard screen is composed inside (rounded corners, status bar, safe-area gutters).
- **Glass cards** — translucent blurred surfaces with a hairline stroke; the primary consumer container.
- **The radar** — the consumer hero. Concentric distance **rings** + a **conic sweep** animation, a **you-beacon** at center (sunset gradient), and **avatar blips** for crew placed by bearing/distance.
- **Bottom nav** — glass bar, **sunset-active** state on the current tab.
- **Status / mesh badges** — small pills showing mesh connectivity and session/on-duty state.
- **Haptics** — the touch vocabulary (taps, pings, rallies, the proximity heartbeat, the found celebration) and its accessibility toggle. See [`haptics.md`](haptics.md).

---

## Navigation decision

**Consumer bottom nav (5 slots):**

```
Radar · Activity · [ Rally ] · Crew · Me
                     ▲ raised centre
```

The **raised centre slot = the one critical action.** For Consumer that's **Rally**
("where should everyone go?"). For **Guard**, the same raised-centre slot is **SOS**.

**Activity** = the feed / history tab: pings, rally alerts, found-moments, and
notifications in one timeline.

### Radar = act · Crew tab = manage (shipped 2026-07-08)

Two different jobs, two surfaces — don't merge them:

- **Radar (home) = act on people.** A **crew roster pull-up** lives on the radar (peek bar above the tab bar → slides up to the roster with **Ping** / **Find** per person). You act where you're already looking. The sheet **floats *under* the tab bar** — the frosted nav stays visible and tappable (Find My pattern), and only the radar dims behind it. A sheet that *covers* the nav is the wrong pattern for a dip-in/dip-out panel.
- **Crew tab = manage the crew.** Crew code + QR + join/scan + broadcast sessions + leave. Low-frequency setup, not in-the-moment action.

Rule of thumb: *"find/ping my people" → radar; "set up my crew" → Crew tab.*

---

## Mockup index

All files are in `docs/design/` unless noted. Market-model files live in `docs/strategy/`.

| File | What it shows |
| --- | --- |
| `ui-upgrade-v1.html` | **"Signal in the dark"** — the 4 hero screens: Onboarding, Radar (the hero), Compass (follow), Found (the payoff). The visual north star. |
| `ui-upgrade-nav.html` | **Early** bottom-nav proposal (3-tab). **Superseded** by the shipped **5-slot** nav — see "Navigation decision" above. |
| `rally.html` | **"Where should everyone go?"** — Rally nav options (Option A · 4th tab vs Option B · raised button) plus the Rally screen active + empty states. |
| `gallery-consumer.html` | **Consumer app gallery — 16 screens:** Splash, Sign in, Create profile, Location priming, Radar home, Follow compass, Look around, Found, Crew tab, Add friend, Privacy · Me, Ping received, Rally pin, Start session, Empty state, **Activity**. |
| `gallery-guard.html` | **Guard gallery — 7 screens:** Team map, SOS active, Dispatch → navigate, Lone-worker check-in, Incident log, Muster, Shift / clock-in. |
| `gallery-command.html` | **Command control-room gallery — 5 dashboards:** Operations overview, Incident detail, Muster / evacuation board, Roster & shift management, Coverage heatmap. |
| `loc8-ops.html` | **"When the radio isn't enough"** — the Ops (security product) intro mockup; sells the tactical register. |
| `architecture-map.html` | **"One engine, four doors"** — the product-architecture map: one mesh engine → Consumer / Guard / Command surfaces. |
| `anchor-hop.html` | **"Your phone speaks Bluetooth. The anchors speak LoRa."** — animated BLE → LoRa → BLE packet-crossing-the-field explainer. |
| `../strategy/coverage-maps.html` | **Coverage — Victoria Park / All Points East** — 3 coverage options: Just the app, Relay grid, Trunk + last-hop (the case for anchors). |
| `../strategy/market-model.html` | **Interactive market model** — live, adjustable revenue/adoption model. |
| `../strategy/market-model-simple.html` | **"The money, in plain English"** — the plain-language version of the market model. |
| `loc8os-gallery.html` | **Loc8OS in the products** — animated status-lens states, bench `loc8 status` consoles (normal + mid-power-cut), journald at mains loss, Command claim/health cards, HQ tiles. Spec: `../software/loc8os.md`. |
| `loc8os-ui.html` | **Loc8OS's own faces** — serial boot sequence, local service portal (unauthenticated health + org-key maintenance), recovery mode. Spec: `../software/loc8os.md` §7a. |
| `references/ref-lunor.html` · `ref-taskplus.html` · `ref-kravio.html` | Pixel-replication studies of three reference UIs (the "less AI-web, more app" exercise). |
| `references/command-v2-concept.html` | The Command v2 shading/depth concept synthesized from the three references. |
| `../brochure/loc8-ops-brief.html` | **The Operations Master Brief** — the four-audience matte-black document; custom SVG diagrams; every claim graded. |

---

## Porting note

These mockups are **design targets**, not shipped screens. The RN app (Expo SDK 57)
already uses **`lucide-react-native`** and ships the **mesh badge** and **crew panel**.
Port the upgraded look **screen-by-screen** — the instant simulator loop renders each
change live, so you can diff a ported screen against its mockup as you go.

> **Expo has changed.** Read the exact versioned docs at
> <https://docs.expo.dev/versions/v57.0.0/> before writing any code.
