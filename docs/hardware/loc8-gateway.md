# Loc8 Gateway — the venue appliance

*The physical spine of Loc8 Ops. A small wall-mounted box that speaks the BLE
mesh natively on one side and the network on the other, holds the site's
database, and uplinks to the cloud when any internet exists. It replaces the
"operator's laptop as hotspot + server + database + security perimeter"
arrangement with real infrastructure.*

**One sentence:** plug it into power-over-Ethernet, and the venue has a
control-room backbone that works with zero internet, survives power cuts, and
shows up on HQ's dashboard the moment it finds a pipe out.

---

## 1. Why a box

| Laptop-as-infrastructure (today) | Gateway appliance |
|---|---|
| One machine is app + server + DB + router + perimeter | Each job in its right place |
| Dies when the laptop sleeps/moves/crashes | Screwed to a wall, on PoE, battery-backed |
| Anyone on the network can reach the relay | Device certs + authenticated relay |
| State lost on reload | SQLite on the box; consoles are stateless viewers |
| No off-site story | Store-and-forward sync to HQ |
| Feels like a demo | Feels like infrastructure |

The laptop/hotspot chain **remains as a fallback mode** — a selling point
("the control room can run off a laptop in a car park"), no longer the design.
Likewise every guard phone remains a *spare* gateway: the control room is the
one thing at a venue that cannot be cut off.

## 2. Build tiers & BOM (approximate street prices — re-quote at order time)

### Tier A — Demo ($~40)
Pi Zero 2 W · 32GB microSD · USB PSU · printed case. Wi-Fi only. Lives in the
sales bag; powers a tabletop pilot.

### Tier B — Standard install ($95–120) — the pilot workhorse

| Part | Role | ~Cost |
|---|---|---|
| Raspberry Pi 4 (2GB) or CM4 on carrier | Compute; BLE 5 + Wi-Fi onboard | $35–45 |
| PoE+ HAT | Power + network down ONE Ethernet cable | $20 |
| Industrial microSD 32GB (or CM4 eMMC) | OS + site database | $10 |
| External BLE antenna (u.FL → SMA) | Real mesh range vs PCB trace | $8 |
| Wall/DIN-mount enclosure | The "infrastructure" part | $15–25 |
| Status LED ring / 0.9" OLED | "◈ MESH · 14 NODES · SYNCED" at a glance | $5 |

### Tier C — Ruggedized ($180–240)
CM4/CM5 with soldered eMMC (no SD to corrupt) · metal wide-temp enclosure ·
**UPS battery HAT (~$25)** — the gateway rides out a venue power cut, which is
exactly when it matters · dual BLE radios (concurrent scan + advertise) ·
tamper switch.

### Add-on modules (any tier)
- **LTE dongle + SIM (~$25 + data):** the box brings its own internet. A venue
  with no wifi and jammed cell still appears live on HQ's dashboard.
- **LoRa concentrator (~$40–80):** the same chassis becomes the long-range
  anchor from `docs/strategy/coverage-maps.html`. One hardware line, growing
  radios.

**Economics:** ~$100 BOM at Tier B → sell at $299–399 or bundle free with
per-guard SaaS. Competitors' site infrastructure (RTLS, lone-worker hardware)
runs to thousands.

## 3. Physical spec (Tier B reference)

- **Dimensions:** ~120 × 90 × 35 mm (a thick paperback / small Wi-Fi AP);
  antenna stub adds ~50 mm. Weight ~250 g. Tier C: ~150 × 110 × 40 mm, ~450 g.
- **Mounting:** keyhole wall plate + DIN clip; ceiling-tile bracket optional.
- **Ports:** 1× RJ45 (PoE in), 1× USB-C (service/alt power), 1× SMA antenna,
  1× USB-A (LTE dongle / offline update stick). No display, no buttons except
  a recessed factory-reset pin.
- **Industrial design language:** matte near-black body, chamfered edges, the
  Loc8 wordmark debossed, a single ◈ status lens. Light grammar matches the
  apps: **green breathing** = mesh live & synced · **amber pulse** = mesh live,
  uplink down (store-and-forward) · **red** = fault · **white chase** =
  unclaimed/pairing. Reads as kin to a UniFi AP crossed with an industrial
  controller — infrastructure, not gadget.

## 4. Software — an appliance image, not a new OS

We do **not** write an operating system. We ship a locked-down **appliance
image**: minimal Linux (Raspberry Pi OS Lite now; Yocto/buildroot when volumes
justify it) with our services baked in, flashed at "manufacture" (an afternoon
per batch at pilot scale: flash, boot-test, label). Branding it "Loc8 OS" is
marketing truth — to the customer the box has one purpose and no visible Linux.

**The services (systemd units):**

| Daemon | Job |
|---|---|
| `loc8-meshd` | **The Linux port of the BLE mesh** (BlueZ/D-Bus): scans, advertises, relays, dedups — speaking the exact 25-byte frames the phones speak. *This is the critical-path engineering project; the codec/protocol are already shared + tested, so it is a port, not a redesign.* |
| `loc8-relayd` | The relay (grown from `tools/mesh-bridge`): authenticated WebSocket fan-out to consoles + gateway phones; still a dumb pipe for (encrypted) frames. |
| `loc8-sited` | Site state + SQLite persistence: incidents, roster, muster, the hash-chained audit log. Consoles become stateless viewers of this. |
| `loc8-syncd` | Store-and-forward cloud sync over any uplink (Ethernet/Wi-Fi/LTE); backfills after outages. |
| `loc8-provisiond` | First-boot identity, mDNS advertisement (`_loc8._tcp`), claiming, cert issuance for enrolling devices. |
| watchdog + A/B updater | Self-healing; **signed** OTA images with rollback; USB-stick updates for offline sites. |

## 5. Plug-and-play — the whole lifecycle

1. **Plug in** PoE. Boots ≤ 30 s. Status lens breathes white: *unclaimed*.
2. **Claim.** Loc8 Command (desktop app) on the same network discovers
   "Loc8 Gateway · unclaimed" via mDNS. Operator clicks Claim → names the site
   → the box mints its device identity; further claims require the org key.
   (Same adopt flow users know from UniFi/Sonos — zero manuals.)
3. **Enroll staff.** Clock-in stays the consent moment: Command shows a QR;
   the guard scans once. Under the hood that issues a device certificate and
   the per-shift key — the QR is the friendly face of real PKI.
4. **Operate.** Phones mesh over BLE as they already do; the gateway is just
   the strongest node — always on, wall-powered, big antenna. Consoles attach
   over the LAN (mTLS). Everything that matters lands in the box's SQLite.
5. **Sync.** Any uplink → HQ's portfolio dashboard shows the site live;
   no uplink → amber pulse, store-and-forward, backfill later.
6. **Update.** Signed image over the air, A/B slots, automatic rollback.

**Nothing to configure on phones** beyond normal enrollment: the mesh is the
same protocol they already speak; the gateway is simply another (excellent)
peer.

## 6. Security architecture

- **Layer 0 — network:** the box's Wi-Fi (when used) is WPA2/3; wired installs
  ride venue VLANs.
- **Layer 1 — relay auth:** consoles + gateway phones present certs (mTLS);
  strangers on the LAN reach a socket that rejects them.
- **Layer 2 — payload encryption (the real one):** frames are encrypted with
  the per-shift key **before touching any transport** (AEAD, key via HKDF from
  enrollment). LAN sniffers, the relay itself, and stranger phones relaying
  BLE hops all carry ciphertext. Implemented **in the engine**, so every door
  inherits it — and consumer crews later get the E2E promise from
  `identity-privacy-login.md` for free.
  - *Frame-size note:* AEAD adds ~16 B tag + nonce; ops mode moves to a ~41 B
    encrypted frame (BLE MTU has headroom; consumer framing already pads to
    256 B). Versioned additively in the codec.
- **Layer 3 — people:** operator login on Command (SSO per the identity doc,
  local operator accounts first) so audit entries name humans; audit log
  hash-chained → tamper-evident, exportable as the after-action record.
- **Privacy invariants unchanged:** the box stores the same consented ops data
  the console holds today — staff on shift, incidents, anonymous crowd counts,
  the audit trail. No attendee identity store exists to protect or breach.

## 7. Off-site visibility (the manager question)

The gateway is the sync point because it already owns the site database.
`loc8-syncd` pushes an event stream (incidents, muster progress, headcounts,
audit) to the cloud spine whenever a pipe exists. HQ sees a **portfolio
dashboard**: one tile per site, drill-in to the live feed, "last synced 00:40".

- **Read-mostly by default:** off-site is a viewer; the local control room
  commands. Remote dispatch is a later, explicit role grant.
- **Graceful degradation:** uplink loss is invisible on site; the cloud shows
  staleness honestly and backfills on reconnect.
- **The LTE-dongle pitch:** a venue with *no working infrastructure at all*
  still appears live at HQ, while the local mesh never depends on that link.

## 8. Engineering plan (order of attack)

1. **`loc8-meshd` — the Linux BLE mesh port.** Critical path; everything else
   is assembled from parts we have. Spike on a bench Pi against two phones.
2. **Consolidate relay + persistence + mDNS** into the site daemons (mostly
   moving existing code onto the box).
3. **Command desktop app** (Tauri wrap of the existing React build) with
   gateway discovery + claim flow.
4. **Enrollment PKI + payload encryption** in the engine (ops frame v2).
5. **`loc8-syncd` + the HQ portfolio dashboard** (first real cloud component;
   Supabase-class backend is sufficient).
6. **LoRa module + anchor mode** (the coverage-maps roadmap).

*Fallback modes preserved throughout:* no gateway → any guard phone bridges to
a laptop console exactly as today; both paths stay tested.
