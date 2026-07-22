# Current frame field classification

**Date:** 2026-07-22
**Question:** SEC-04
**Code inspected:** TypeScript 25-byte codec; iOS/Android v1 native codec,
deduplication and relay; TrustLayer; MeshService; BLE and bridge transports.

Legend: **C** confidentiality, **A** sender/authority authenticity, **I**
integrity, **TA** traffic-analysis/linkability exposure. `High` means compromise
can expose a person/operation, grant authority or materially mislead an incident;
`Med` is contextual/availability-relevant; `Low` does not mean harmless.

The current frame provides none of C/A/I cryptographically. Bounds and parsing
checks improve robustness, not authenticity.

## Native v1 wrapper (47 bytes raw; optionally padded to 256)

| Offset | Field | Current meaning | C | A | I | TA / observation |
|---:|---|---|---|---|---|---|
| 0 | `version` | `0x01` | Low | Med | High | Protocol fingerprint; permits format probing |
| 1 | `type` | Fixed Loc8 wrapper `0x30` | Low | Med | High | Identifies Loc8 traffic |
| 2 | `ttl` | Originate 7, relay-clamped/decremented | Low | Med | High | Arrival TTL exposes likely hop depth; mutable field needs a reviewed authenticated-hop rule |
| 3–10 | `timestampMs` | Fresh outer origination time and dedup input | Med | High | High | Millisecond timing links fragments/events and enables capture/replay analysis |
| 11 | `flags` | Always `0x00`: broadcast, unsigned, uncompressed | Low | High | High | Directly advertises absence of signature/recipient protection |
| 12–13 | `payloadLength` | Fixed 25 | Low | Med | High | Fixed length helps privacy but still identifies the carrier |
| 14–21 | `senderID` | `"LOC8"` + application `senderId` | High | High | High | Stable person/install tracking; origin spoofing; cross-message linkage |
| 22–46 | `payload` | Plain 25-byte application packet | High | High | High | Content/type/target/location leakage described below |
| 47–255 optional | padding | PKCS#7-style size padding | Low | Low | Med | Hides raw length only when enabled; timing/count remain visible |

The native dedup key is sender ID, outer timestamp, fixed type and the first four
bytes of SHA-256(payload). It is collision/replay suppression, not proof that the
sender created the payload. The current 300-second/1,000-entry state is in-memory
and resets with the native service.

## Current 25-byte application packet: position-like types

Used by `position`, `pingWhere`, `pingComeFind`, `rally` and `sos` (with
`quickReply` overlays noted below).

| Offset | Field | Meaning | C | A | I | TA / consequence |
|---:|---|---|---|---|---|---|
| 0 | packet type | 0 position, 1/2 ping, 3 rally, 4 reply, 5 text, 6 profile, 7 SOS | High | High | High | Reveals SOS/operational bursts even without decoding payload |
| 1–4 | `senderId` | Stable uint32 profile/install-like ID | High | High | High | Long-term person/device tracking and spoofing |
| 5–8 | `targetId` | Peer ID, crew/team tag or zero broadcast | High | High | High | Social/team graph and directed-recipient linkage; crew code hash is not membership proof |
| 9–12 | latitude | Signed fixed-point latitude | High | High | High | Precise staff/consumer location |
| 13–16 | longitude | Signed fixed-point longitude | High | High | High | Precise staff/consumer location |
| 17–18 | heading + floor | 9-bit heading and signed 7-bit floor | High | High | High | Movement/orientation and indoor level; safety impact if altered |
| 19 | battery | Percent | Med | High | High | Device availability and user-state inference |
| 20–23 | `timestampSec` | Sender wall-clock seconds | High | High | High | Track/replay/order signal; multiple events in one second collide in current TrustLayer keys |
| 24 | accuracy | GPS accuracy metres | Med | High | High | Location confidence; unsafe decisions if forged |

For `quickReply`, bytes 9–16 are zero, byte 17 is the reply/status code, and
bytes 18–24 retain zero/battery/timestamp/accuracy. Status codes 20–23 reveal en
route/on scene/backup/clear and therefore have high confidentiality and
authenticity requirements.

## Current text/profile fragment overlay

| Offset | Field | Meaning | C | A | I | TA / consequence |
|---:|---|---|---|---|---|---|
| 0 | type | text or profile | High | High | High | Distinguishes name/chat traffic |
| 1–4 | `senderId` | Stable origin | High | High | High | Tracking/spoofing |
| 5–8 | `targetId` | Crew/team tag or zero | High | High | High | Membership/relationship graph |
| 9–10 | `msgId` | uint16 message group, process-local counter | Med | High | High | Wrap/restart collisions and message linkage |
| 11 | `seq` | fragment index | Low | Med | High | Message size/progress |
| 12 | `total` | fragment count | Med | Med | High | Exact length bucket; hostile large/inconsistent totals consume state |
| 13 | `fragLen` | 0–11 | Med | Med | High | Exact final length |
| 14–24 | `frag` | UTF-8 name/chat/ops payload | High | High | High | Names and human-readable operations are plaintext |

Fragments bypass `TrustLayer` because they share timestamp and are routed to
`TextReassembler` first. Completed-message replay suppression is a process-local
64-entry set keyed by type/sender/msgId. A restart or eviction reopens the replay
window. Authentication must occur before content is surfaced, and fragmentation
state must be bounded before expensive cryptographic/application work.

## Non-frame radio and transport metadata

| Observable | Exposure and required treatment |
|---|---|
| Loc8 BLE service/characteristic UUID | Identifies a Loc8-capable device nearby; cannot be encrypted. Assess whether rotating advertisements/private service discovery are platform-feasible. |
| BLE MAC/platform peer ID and GATT role | Proximity/link duration and device behavior; platforms may rotate addresses, but current connection state can correlate them. |
| Timing, cell count, scan/advertise cadence | Reveals activity and message length; SOS priority may be intentionally visible to relays. Padding, batching and jitter trade privacy against incident latency. |
| RSSI/link topology | Reveals proximity and motion. Store minimally and never equate proximity with identity. |
| Bridge IP/TLS metadata | Relay sees connections, timing and site endpoint even when WSS is used. Authenticated application envelopes must survive an untrusted relay. |
| Drop/retry/ack patterns | Can reveal recipient availability and route. Bound retries and avoid externally stable message handles. |

## Proposed v2 cell visibility (spike, not frozen format)

Every 25-byte cell exposes marker `0xD2`, a four-byte rotating compatibility
pseudonym, fragment index/count, an eight-byte per-message handle, fragment body
length and nine opaque logical-frame bytes. This removes stable v1 `senderId`,
location, type and text from the cell header but still exposes sender-rotation
linkage, message size, timing and fragment loss/retry.

The pseudonym and handle are routing/dedup values only. A v2-aware node must not
grant identity, role, membership or application delivery until the fully
reassembled logical frame passes the reviewed security provider. Production
logical routing fields that relays must read remain traffic-analysis-visible and
must be authenticated; their exact encoding is held for specialist review.
