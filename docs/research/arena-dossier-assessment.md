# Arena connectivity research — assessment and verdicts

*Assessment of the ChatGPT-produced "Arena Connectivity" dossier
(29 pp, 21 July 2026, archived verbatim as `arena-dossier-2026-07-21.pdf`) and
the chat-transcript research that preceded it. Written 2026-07-21. The dossier
was produced **without knowledge of Loc8's actual product** — it answers "how
do I cover an arena with Bluetooth?" where our question is "how do phones find
each other?". Read every verdict through that lens. `BRIEFING-FOR-AI.md` now
exists specifically to prevent a third round of this mismatch.*

---

## Headline

**Nothing structural in Loc8 changed.** Two independent research passes (ours
and the dossier) converged on the same physics, the same architecture shape,
and the same measure-before-promising discipline. They diverge only where the
dossier didn't know the product. The concrete corrections to our plan from the
entire episode: **anchors cost ~£65 not ~£35, they are ears not mouths, and
spacing is planned on the uplink.** The concrete gains: a written field-test
protocol, acceptance criteria, placement rules, a compliance map — and the
realisation that gate ④ (encryption) must include **rotating pseudonyms**.

## Verified independently (not taken on the dossier's word)

| Claim | Verification |
|---|---|
| Phones cannot natively join SIG Bluetooth Mesh; they must be provisioned and hold a GATT Proxy connection; unprovisioned phones cannot passively receive mesh traffic | Bluetooth SIG Mesh Primer, fetched directly: "Proxy client devices must first be provisioned, just like any other device that is a member of the network" |
| Coded PHY (BLE long range) unusable for reaching iPhones | Apple removed support in iOS 14 (developer forum threads); no roadmap since |
| nRF21540 front-end: +13 dB RX gain / 2.7 dB NF, up to +21 dBm TX, "16–20 dB link budget improvement" | Nordic product page, fetched directly |
| Ofcom 20 dBm EIRP ceiling at 2.4 GHz | IR 2030 (also independently cited in the patent research) |
| 32,767 = SIG mesh unicast address space, not crowd capacity | SIG primer; the dossier itself corrects its own chat-era framing on p. 9 |

## Errors in the earlier chat-transcript research (all corrected in the dossier)

1. **"32,767 people on the mesh"** — category error; address space ≠ people,
   and phones can't join anyway. Dossier p. 9 explicitly lists "32,767 busy
   phones will work in one arena" under *what the number does not mean*.
2. **Coded PHY as a phone-range booster** — dead on iOS since iOS 14.
3. **£105–145/node presented near product costs** — that is dev-board pricing;
   the silicon is a few pounds. Dossier p. 14 corrects with its "budget gate".

## Adopt (folded into our docs)

| What | Where it landed |
|---|---|
| Four-phase test plan + measurement sheet + go/no-go gates | `../testing/field-test-protocol.md` (rewritten phones-first — the dossier wrote it for fixed nodes) |
| Acceptance criteria (95%-in-5s, overlap, single-node resilience, no plaintext identifiers) | `../hardware/anchor-deployment.md` + `../BUSINESS.md` |
| Placement rules (height, plastic, overlap, zone bends, backstage nodes) | `../hardware/anchor-deployment.md` |
| Compliance workstream (IR 2030, EN 300 328, RER 2017, SIG qualification, the no-amplifier trap) | `../compliance.md` |
| "Prototype ≠ product" cost warning; certification can exceed hardware by orders of magnitude | `../compliance.md`, `../BUSINESS.md` |
| Safety boundary sentence (supplements, never replaces, emergency services) | `../BUSINESS.md` claims discipline |
| 3-dev-kit-first purchase discipline (£230); no custom PCB before a six-node pilot proves the experience | `../BUSINESS.md` near-term plan |
| Threat table (tracking, spoofing, replay, coercive use) → rotating pseudonyms into gate ④ scope | `../SYSTEM.md` encryption row |

## Adapt (right idea, wrong product assumption)

| Dossier position | Our adaptation |
|---|---|
| "Fixed relays are the backbone; phones are endpoints" | True *for a venue install as an addition*. False as architecture: Loc8 must work at a bare field with zero infrastructure on day one. Phone mesh is the floor; anchors amplify. A field-test NO-GO would flip this (see protocol) — deliberately, not by default. |
| SIG Bluetooth Mesh between fixed nodes | Take the idea (fixed nodes relay, group addressing, TTL 3–5, wired backhaul where possible); skip the third protocol stack — our 25-byte protocol + LoRa + Ethernet already covers it. Revisit only if the bench spike argues otherwise. |
| Zone identifiers (FLOOR-A, BOWL-NORTH) broadcast by fixed nodes | Adopt as a **new engine feature** (zone frame type + store + UI) — currently exists nowhere in `@loc8/engine`. Small, valuable, unspecced. Backlog after gate ①. |
| Roadmap (bench → small hall → hybrid → arena pilot) | Reordered: our gate ① (two phones, a park) precedes all fixed-node work. |

## Reject (with reasons — the load-bearing part)

| Dossier position | Why rejected |
|---|---|
| **Wi-Fi Aware / Nearby Connections as the two-way data plane** | (a) Pairwise links between consenting devices **cannot relay through strangers** — stranger relay *is* the product. (b) Apple support is iOS 26 + iPhone 12 or later — excludes a large slice of any real crowd. (c) Nearby Connections is Android-only. (d) We have no bandwidth problem to solve: a 12-person crew at 5 s updates ≈ 96 B/s of payload; 25-byte frames ride BLE advertising trivially. Net: we'd build and maintain a second transport, keep BLE anyway as the floor, and gain nothing the product needs. **File under future accelerator** for rich features (photos, voice) — not architecture. |
| Auracast | Broadcast audio. Different product. |
| Phones as passive receivers of venue broadcasts | Inverts the product. Data flows *from* phones, many-to-many. |
| Any 100 m planning figure | Open-air line-of-sight downlink marketing. Crowd reality: 15–40 m down, ~25–30 m up. Both research passes agree. |

## The uplink/downlink asymmetry (this episode's permanent lesson)

The dossier never states it, but its own numbers imply it and ours confirm it:
an anchor **shouts** at 20 dBm from a clean antenna in clear air and **hears**
phones whispering at ~0–4 dBm from pockets through bodies. The binding
constraint on a friend-finder is the hearing direction. Consequences —
receive-side gain is where money goes, height is free and beats components,
spacing is planned at ~25–30 m in crowd — are now spec
(`../hardware/anchor-deployment.md`). Getting this wrong builds a venue where
every phone shows connected and nobody can be found.

## Provenance & standing rule

Chat-transcript research (relayed ~20 July) + 29-page dossier (21 July),
both ChatGPT, neither briefed on the product. PDF archived unmodified beside
this file. Per `README.md` in this directory: research is archived into the
repo the moment it completes, and the corrections/verdicts — not just the
conclusions — are the valuable part.
