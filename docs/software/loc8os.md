# Loc8OS — the Gateway appliance image

*The software that makes the box a product. Not an operating system we wrote —
a locked-down appliance image: minimal Linux with the Loc8 services baked in,
flashed at manufacture, updated as one signed unit. To the customer the box has
one purpose and no visible Linux; "Loc8OS" is the truthful marketing name for
that.*

**Status: specified, unbuilt.** Everything here is the build plan. The one
component that is genuinely new engineering is `loc8-meshd` (the Linux BLE mesh
port); everything else is assembled from parts that already exist in this repo
or from stock Linux plumbing. Related: hardware in `../hardware/loc8-gateway.md`
(power & battery behaviour is §9 there and is normative for the power states
below).

---

## 1. Base system

| Decision | Choice | Why |
|---|---|---|
| Base distro | Raspberry Pi OS Lite (64-bit), pinned release | Boring, documented, BlueZ current. Yocto/buildroot later when volumes justify owning the build system |
| Init | systemd | Unit dependencies, watchdogs, journald — all used below |
| Filesystem | Read-only root via overlayfs | The single biggest corruption defence, ~$0. See §5 |
| Bluetooth | BlueZ via D-Bus | The `loc8-meshd` substrate |
| Database | SQLite, **`journal_mode=WAL` (mandatory)** | One file per concern, no server to babysit. WAL is not a tuning choice: `synchronous=FULL` is only ACID-durable *in WAL mode* — in rollback-journal mode the same pragma is "not necessarily durable across a power loss". Changing the journal mode silently voids the audit guarantee. See `loc8-gateway.md` §9 |
| Updates | A/B image slots, signed | See §6 |
| Shell access | None in production. Serial header on the board for factory/bench | The appliance contract: no visible Linux |

## 2. The service stack

Everything Loc8 is five daemons plus a supervisor. Each is a systemd unit with
`Restart=always`, a watchdog timer, and an explicit dependency order:

```
                        ┌─────────────────────────────┐
        BLE mesh ◀──────│  loc8-meshd                 │  the radio face
     (25-byte frames)   │  BlueZ scan/advertise/relay │
                        └──────────┬──────────────────┘
                                   │ frames (unix socket)
                        ┌──────────▼──────────────────┐
   consoles + gateway ◀─│  loc8-relayd                │  the network face
   phones (WebSocket,   │  authenticated fan-out      │
   mTLS)                └──────────┬──────────────────┘
                                   │ events
                        ┌──────────▼──────────────────┐
                        │  loc8-sited                 │  the memory
                        │  SQLite: incidents, roster, │
                        │  muster, audit (hash chain) │
                        └──────────┬──────────────────┘
                                   │ event stream
                        ┌──────────▼──────────────────┐
             HQ cloud ◀─│  loc8-syncd                 │  the ambassador
      (store & forward) │  batches, backfills         │
                        └─────────────────────────────┘

                        ┌─────────────────────────────┐
                        │  loc8-provisiond            │  the doorman
                        │  identity, mDNS, claiming,  │
                        │  cert + shift-key issuance  │
                        └─────────────────────────────┘
                        ┌─────────────────────────────┐
                        │  loc8-supervisord           │  the adult
                        │  power states, watchdogs,   │
                        │  status lens, safe shutdown │
                        └─────────────────────────────┘
```

| Unit | Job | Origin |
|---|---|---|
| `loc8-meshd` | Linux port of the BLE mesh: scan, advertise, relay, dedup, TTL — the exact 25-byte frames the phones speak | **New engineering. The critical path.** Codec + protocol already shared and tested in `@loc8/engine`, so it is a port, not a redesign |
| `loc8-relayd` | Authenticated WebSocket fan-out to consoles and gateway phones; a dumb pipe for frames | Grown from `tools/mesh-bridge` (exists) |
| `loc8-sited` | Site state + persistence: incidents, roster, muster, hash-chained audit log. Consoles become stateless viewers | Logic exists in Command's store; moves server-side |
| `loc8-syncd` | Store-and-forward cloud sync over any uplink; backfills after outages | New, thin |
| `loc8-provisiond` | First-boot identity, mDNS `_loc8._tcp` advertisement, claim flow, device-cert + per-shift-key issuance | New |
| `loc8-supervisord` | Power-state machine (§4), hardware watchdog feeding, status lens, orderly shutdown | New, small |

Dependency order: `provisiond` → `meshd` + `relayd` → `sited` → `syncd`, with
`supervisord` independent and first. `sited` is the only writer to the
databases; everything else talks to it.

## 3. Device states (the lens is the UI)

The box has no screen. Its entire local UI is one status lens; the light
grammar is shared with the apps and printed on the quick-start card.

| State | Lens | Meaning |
|---|---|---|
| `UNCLAIMED` | white chase | Fresh from factory; advertising `Loc8 Gateway · unclaimed` on mDNS |
| `CLAIMED-IDLE` | green slow breath | Claimed, mesh up, no shift running |
| `LIVE` | green breath | Shift running: mesh live, consoles attached, synced |
| `LIVE-NOSYNC` | amber pulse | Mesh live, uplink down; store-and-forward active |
| `ON-BATTERY` | amber breath, rate rises as reserve drains | Mains lost; load-shed per §4. State in the **waveform**, not the hue — red/amber is the classic colour-vision confusion pair |
| `FAULT` | red | A service failed and did not recover; details in Command |
| `UPDATING` | white pulse | A/B slot write in progress. Never on battery (§4) |

## 4. Power states — normative summary

Full rationale and thresholds live in `../hardware/loc8-gateway.md` §9.5. The
software contract:

**On mains loss (immediately):** latch `ON-BATTERY`; checkpoint SQLite *now*
(`PRAGMA wal_checkpoint(TRUNCATE)` + fsync); emit one `SITE ON BATTERY` event
over LTE if fitted; hard-interlock updates on the mains-present GPIO; shed the
gateway-*claiming* path but keep cert/shift-key issuance alive (a guard clocking
on mid-blackout must still be able to join); collapse position persistence to
last-known + coarse 30–60 s track; batch sync to ≤1 burst/15 min with a
heartbeat; suspend VACUUM and log rotation.

**Never shed:** mesh receive/relay · SOS/duress/muster/incident persistence ·
the status lens · the supervisor.

**Shutdown:** triggers in volts and coulombs, never SoC percent. Warning at
~25% usable reserve → stop new writes at ~15%, final checkpoint, fsync, remount
read-only → halt by ~10%. An explicit energy floor is reserved for the
supervisor so the audit log can never be lost to a dirty unmount. Watchdog is
disarmed on entering orderly shutdown. After a depletion shutdown: boot only
after mains stable 60–120 s, with a physical long-press force-boot that comes up
degraded/read-only — this box backs muster during an evacuation and must never
be unavailable during the incident it exists to record.

## 5. Storage layout

```
┌────────────────────────────────────────────────────┐
│  /boot/firmware        A/B boot metadata           │
│  /  (slot A)  ─ ro     appliance image, overlayfs  │
│  /  (slot B)  ─ ro     previous / next image       │
│  /var/lib/loc8 ─ rw    THE one writable partition  │
│    ├─ site.db          incidents · roster · muster │
│    │                     (WAL, synchronous=FULL)   │
│    ├─ track.db         position history            │
│    │                     (WAL, synchronous=NORMAL) │
│    ├─ audit.db         hash-chained operator log   │
│    │                     (WAL, synchronous=FULL)   │
│    ├─ identity/        device key, certs, org key  │
│    └─ spool/           syncd store-and-forward     │
│  tmpfs                 /run /tmp /var/log          │
└────────────────────────────────────────────────────┘
```

- Root is read-only; machine-id, DHCP leases and SSH host keys live on the
  writable partition or tmpfs.
- The DB split buys *tunable durability* (critical data at `FULL`, bulk
  position at `NORMAL`), **not** corruption isolation — both share one flash
  controller.
- The audit hash chain cannot self-report tail truncation, so `syncd`
  periodically exports the signed chain head + entry count off-box; a missing
  tail becomes detectable by comparison.

## 6. Updates

- **A/B slots, signed images, automatic rollback.** An update writes the idle
  slot, verifies the signature, flips boot metadata, reboots; the first boot
  must confirm health within a deadline or the watchdog flips back.
- **Never on battery** — hard interlock on the mains GPIO. The exposure is not
  the slot write (A/B absorbs a corrupt idle slot); it is the slot-switch
  metadata commit and the unconfirmed first boot, where rollback itself needs
  charge for a second reboot.
- **USB-stick path** for offline sites: same signed image, same verification,
  from the USB-A port.
- Fleet staging later: HQ pushes to one site, then rings.

## 7. Provisioning — the whole life of a box

1. **Factory.** Flash the image, boot-test, label. An afternoon per batch at
   pilot scale. First boot generates the device keypair; the public half is
   recorded against the serial.
2. **Unclaimed.** On site power-up it advertises `_loc8._tcp` with
   `claimed=false`. Lens: white chase.
3. **Claim.** Command (desktop) on the same LAN shows "Loc8 Gateway ·
   unclaimed". Operator clicks Claim → names the site → the box mints its site
   identity and stores the org public key. Every later claim requires the org
   key. (The UniFi/Sonos adopt flow — zero manuals.)
4. **Enroll.** Clock-in stays the consent moment: Command shows a QR, the guard
   scans once; under the hood `provisiond` issues a device certificate and the
   per-shift key. The QR is the friendly face of real PKI.
5. **Operate / sync / update** per §3–§6.
6. **Decommission.** Factory-reset pin (recessed) wipes `/var/lib/loc8`
   including identity, returns to `UNCLAIMED`. The wipe is logged to the cloud
   spine on the way out if any uplink exists.

## 7a. The local service portal

The one place Loc8OS shows its own face. `loc8-provisiond` serves a read-mostly
status page on the LAN (`https://loc8-gw.local`, self-signed until claimed,
then the device cert). It is a **diagnostics surface, not a control panel** —
operations stay in Command; the portal exists so an installer with a phone and
no Loc8 software can prove the box healthy.

- **Unauthenticated:** state, image version, mesh node count, uplink state,
  battery. Nothing operational — no staff, no incidents, no map. Read-only.
- **Org-key authenticated:** network config, log bundle download, signed-image
  upload (the USB path's twin), factory reset. Every action lands in the audit
  chain.
- Visual language matches the apps: the ops palette, mono data, the ◈ lens
  mirrored live at the top of the page.

**Recovery mode** (held factory-reset pin at boot, or repeated boot failure
after A/B rollback exhausts): the portal serves a minimal amber page — slot
states, last panic, signed-image upload, wipe. Nothing else runs; the mesh is
down and says so. Lens: white/amber alternating.

## 8. What it looks like

The box is headless, so "what it looks like" is four surfaces: the lens (§3),
the Command claim/health cards, the service console at the bench, and the HQ
tile. Bench examples — illustrative output, the tools do not exist yet:

**`loc8 status` (factory/bench serial console):**

```
LOC8 GATEWAY · GW-7C2A91 · Tier C
image      loc8os 0.4.2 (slot A, confirmed) · slot B: 0.4.1
state      LIVE                         lens: green breath
power      mains · battery 97% (38.4 Wh nominal, LFP, temp 31°C)
mesh       14 nodes · 312 frames/min · dedup 41% · ttl clamp off
relay      3 clients (2 console, 1 gateway-phone) · mTLS ok
site.db    2.1 MB · wal 40 KB · last checkpoint 18 s ago
audit      1,204 entries · chain head exported 12 min ago
sync       HQ reachable · last push 00:00:41 ago · spool empty
uptime     19 days 04:12 · watchdog fed · cpu 11% · 44°C
```

**The same box, twenty minutes into a power cut:**

```
LOC8 GATEWAY · GW-7C2A91 · Tier C
state      ON-BATTERY (00:21:14) · lens: amber breath (slow)
power      battery 71% · 18.9 Wh usable · est 3.4–4.1 h at 4.7 W
           shed: claiming, vacuum, log-rotate · sync batched 15 min
mesh       14 nodes · relay NORMAL · sos/muster persistence FULL
relay      0 clients (LAN down — PoE switch offline)
sync       LTE up · "SITE ON BATTERY" delivered 00:21:02 ago
next       warning broadcast at 25% reserve (coulomb-counted)
```

**journald, the moment mains dropped:**

```
supervisord: mains lost → ON-BATTERY latched
sited:       wal_checkpoint(TRUNCATE) ok in 340 ms · fsync ok
syncd:       [LTE] SITE ON BATTERY queued → delivered (1.2 s)
supervisord: updates interlocked (mains GPIO low)
provisiond:  claiming path suspended · cert/shift-key issuance ACTIVE
sited:       position persistence → coarse track (45 s interval)
supervisord: lens → amber breath · reserve 25.1 Wh coulomb-counted
```

## 9. Build order

1. `loc8-meshd` spike on a bench Pi against two phones — **the critical path**,
   and gate for everything else.
2. `relayd` + `sited` + mDNS: mostly moving existing repo code onto the box.
3. Image plumbing: read-only root, A/B, signing.
4. `supervisord` + the §4 power contract (needs the Tier C carrier's fuel
   gauge).
5. `provisiond` PKI + the Command claim flow.
6. `syncd` + the HQ tile.
