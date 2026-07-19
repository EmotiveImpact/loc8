# Anchors & LoRa — the coverage hardware (Phase 3)

## Why anchors

Phone-to-phone Bluetooth mesh is range-limited (~10–100m, ~30m in a dense crowd). Anchors are optional always-on boxes deployed at a venue that:

- **Extend coverage** across a whole site.
- **Provide a resilient backbone** even at low crowd / day-one, when there aren't enough phones to form a mesh.
- **Double as indoor-positioning beacons.**

## LoRa vs Bluetooth (the key distinction)

|                  | Bluetooth (BLE)       | LoRa                     |
| ---------------- | --------------------- | ------------------------ |
| Range            | ~10–100m              | ~1–15 km                 |
| Speed            | fast (megabits)       | very slow (bytes)        |
| Power            | low                   | very low                 |
| In every phone?  | YES                   | NO — never               |
| Good for         | phone-to-phone        | long-range tiny messages |

- **Phones have Bluetooth, NOT LoRa.** No iPhone/Android has a LoRa chip. So LoRa is **never** phone-to-phone. The app runs on Bluetooth, full stop.
- LoRa is slow, but our location packets are ~25 bytes — so LoRa's trickle bandwidth is a **perfect fit** for spraying tiny location pings across a whole site.

## How the anchor works (the two-tier architecture)

The anchor is a **translator** with BOTH radios:

- **Bluetooth side** → talks to nearby phones (last ~50m), speaking OUR mesh protocol so a phone treats it exactly like another phone.
- **LoRa side** → talks to the OTHER anchors across the whole site (kilometres).

**Packet path:** phone → (BLE) → nearest anchor → (LoRa) → far anchor → (BLE) → far phone. Phones never touch LoRa.

> See `docs/design/anchor-hop.html` for the animation.

## It already mostly exists: Meshtastic

[Meshtastic](https://meshtastic.org) is open-source firmware for cheap LoRa boards that mesh over LoRa **and** pair to a phone over Bluetooth. It's proof the hardware pattern is commodity — we assemble known parts + write glue, we don't invent a radio.

## Bill of materials (buy, don't build)

| Item                                             | Notes                                    | Cost           |
| ------------------------------------------------ | ---------------------------------------- | -------------- |
| Dev board — **LILYGO T-Beam** or **Heltec LoRa 32** | ESP32 + LoRa + BLE already on the board | ~£25–40 each   |
| Battery                                          | per board                                | —              |
| Weatherproof case                                | per board                                | —              |
| **First proof: buy 2–3 boards**                  | no custom hardware, no factory           | **~£100 total** |

## The software we create — anchor firmware (the new piece)

Two software pieces exist in this world:

- The **phone app** — already built = the Bluetooth mesh.
- The **anchor firmware** — new. It runs on the box and does 3 jobs:

1. **Speak OUR Bluetooth protocol to phones** — so a phone connects to an anchor like it connects to another phone.
2. **Bridge** — anything heard over BLE → re-send over LoRa to other anchors; anything heard over LoRa → re-broadcast over BLE to nearby phones.
3. **Carry the mesh rules** (dedup, TTL / hop limits) across both radios so packets don't loop.

**Fastest route:** fork/extend Meshtastic (already does LoRa mesh + BLE-to-phone) and teach it our packet format — rather than building from scratch. It's an embedded-C project on ESP32.

## Legal

LoRa uses the license-free ISM band — **868 MHz in UK/EU** (915 MHz in US). No license needed, but a **~1% duty-cycle transmit limit** applies. Tiny packets stay well within it — the firmware must respect it.

## Bonus: anchors solve indoor mapping too

The same anchors double as **indoor-positioning beacons** (a phone estimates position from anchor signal strength) — solving the indoor / multi-floor mapping frontier (malls, ships, hospitals) where GPS fails.

## Coverage planning

Rough rule: **~1 anchor per 100m.**

| Site                    | Anchors        |
| ----------------------- | -------------- |
| Main-stage area         | ~20–30         |
| Huge multi-stage site   | up to ~80–100  |

A handful of LoRa **"trunk" anchors** span the whole site and cut the count.

> See `docs/design/coverage-maps.html` for the 3-option comparison and `docs/strategy/` coverage numbers.

## Sequencing — this is PHASE 3

**Do NOT build anchors before the phone-only Bluetooth mesh is validated on real phones.** The anchor firmware must speak the phone protocol, so that protocol must be locked and working first. Then the anchor is a well-scoped ~few-weeks firmware project.

Steps:

1. Buy 2–3 boards.
2. Write / adapt firmware (fork Meshtastic).
3. Test phone ↔ anchor (BLE).
4. Test anchor ↔ anchor (LoRa).
5. End-to-end.
6. Case + battery.
7. Field test at range.
