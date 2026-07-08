# Product Architecture — one engine, four doors

## Vision

Loc8 finds people when the network is dead — via an offline Bluetooth mesh (phone-to-phone, plus optional LoRa anchors).

Everything is built on **one mesh engine**: the `LocationTransport` interface and wire protocol already implemented. The "versions" are not separate products — they are different **front doors** for different people, all standing on that same engine.

## The four doors

| Door | Who it's for | Distribution |
|------|--------------|--------------|
| **Loc8** (consumer app) | The public finding their own crew | Free, App Store, standalone |
| **SDK / white-label** | Guests inside a partner's existing app | Embedded (B2B) |
| **Loc8 Guard** | Deployed field staff | Team app |
| **Loc8 Command** | Control-room supervisors | Web / tablet dashboard |

### 1. Loc8 — consumer app
The public finding their own crew. Free, on the App Store, standalone. This is the front door most people meet first.

### 2. SDK / white-label
Embed the finder **inside a partner's existing app** — a cruise-line app, a theme-park app. This is the key B2B unlock: guests won't download a second app. They want "Family Finder" living in the app they already have.

### 3. Loc8 Guard
The field-staff phone app: guards, stewards, medics, warehouse workers, cruise crew. "Guard" is just the label — it's the **same app for any deployed team member**, renamed per vertical (e.g. "Loc8 Worker" for industrial). Core features: team map, one-tap SOS, dispatch, lone-worker check-in, muster.

### 4. Loc8 Command
The control-room web/tablet dashboard for supervisors: everyone live on a venue map, incident feed, status tiles, roster, muster, coverage heatmap, audit log.

## The rule

> **version = WHO you are · setting = WHICH mix of doors is switched on · engine = always the same mesh.**

A single setting uses multiple doors because it contains different kinds of people. The engine never changes — only which doors are open, and how they're branded.

## Settings → doors matrix

| Setting | Loc8 | SDK | Guard | Command |
|---------|:----:|:---:|:-----:|:-------:|
| Festival | ✓ | | ✓ | ✓ |
| Nightclub / bar | | | ✓ | ✓ |
| Cruise ship | | ✓ | ✓ | ✓ |
| Theme park | | ✓ | ✓ | ✓ |
| Stadium / arena | ✓ | | ✓ | ✓ |
| Mall / hospital | | | ✓ | ✓ |
| Construction / warehouse / ports | | | ✓ (as "Worker") | ✓ |
| University | ✓ | | ✓ | ✓ |
| Ski resort | ✓ | | ✓ | ✓ |

## Feature modules (not separate apps)

Vertical differences are **swappable modules on the shared engine**, not forks of the codebase:

- **Muster / headcount** — cruise, industrial
- **Man-down / SOS** — industrial, security
- **Lost-child mode** — parks
- **Ski-patrol** — ski
- **Crowd heatmap** — all

One core, swappable feature packs, swappable branding.

## Shared-engine capabilities (every door inherits these)

These live in the **engine** (`packages/engine`: codec, transport, mesh service, comms, haptics) — NOT in any one app. Build once, every door gets them:

- **Presence & positioning** — the mesh, TTL relay, freshness/ghost states, radar plotting.
- **Communication (offline, over the mesh):**
  - **Quick replies** — tap-to-send canned responses (a `quickReply` packet). Consumer: "On my way / Come to me". Guard: reskins to **status responses** — "En route / On scene / Need backup / Clear".
  - **Free-text** — short notes fragmented across 25-byte packets + reassembled (`text` packet + `TextReassembler`). Consumer: crew chat. Guard/Command: **team comms / dispatch**.
- **Haptics** — the semantic vocabulary (`haptics.*`). Consumer: proximity heartbeat, found-burst. Guard: **SOS / dispatch alert** patterns (an SOS should be un-missable in a pocket).

The apps differ only in **surface** (screens, branding, which modules) — the comms and haptic *plumbing* is identical, because it's the same engine.

## Monorepo layout (the four doors, one engine)

```
packages/engine   ← shared: core (codec/geo/plusCodes/trust/fragments), transport, services (mesh/haptics), state, types
apps/loc8         ← Consumer app
apps/guard        ← Guard field app        (built on @loc8/engine)
apps/command      ← Command console        (built on @loc8/engine)
```

Rule: app-specific code lives in its `apps/*` folder; anything two doors could share moves down into `packages/engine`. Never fork the engine per app.

## Consumer app navigation

Bottom nav: **Radar · Activity · [Rally — raised centre] · Crew · Me**

- The **raised centre button is always "the one critical action."** For consumers it's **Rally** ("everyone meet here"). In the Guard app the same slot becomes **SOS**.
- **Activity** is the home for pings, rally alerts, found-moments, and notification history.

## Visual mockups (in repo)

- `docs/design/architecture-map.html` — the map of this whole architecture
- `docs/design/gallery-consumer.html`
- `docs/design/gallery-guard.html`
- `docs/design/gallery-command.html`
- `docs/design/rally.html`

## Honest note

The consumer app and the mesh must be **proven first** — v1 (SimulatedTransport) → v2 (real mesh). The SDK, Guard, and Command are the **enterprise expansion** that reuses the same engine. They are the growth story, not the starting line. Nothing ships to enterprise until the engine is real and trusted in the field.
