# Mesh and resilience research

## Executive answer

Loc8 should keep one application message model and support several transports:

- venue IP for the connected-first service;
- phone-to-phone BLE for local infrastructure-free operation;
- dedicated LoRa companion/repeater/gateway hardware for building-scale reach;
  and
- delayed courier/store-forward delivery when no end-to-end route exists.

The major near-term breakthrough is that Loc8's existing native BLE mesh closely
resembles an early BitChat broadcast design, while current public-domain BitChat
v2 contains production-relevant improvements Loc8 does not yet have. Adopt those
components into a new, versioned protocol rather than enlarging the current
25-byte plaintext frame until it breaks.

## Current Loc8 mesh truth

Implemented:

- iOS and Android BLE native modules;
- 25-byte frames, TTL 7, duplicate suppression, forwarding jitter, split horizon,
  degree-based TTL clamp and full fanout;
- Android foreground service and GATT write backpressure; and
- successful two-iPhone frame exchange reported by the founder.

Not established:

- signed/authenticated or encrypted BLE frames;
- stable peer/last-hop identity for topology and directed routing;
- physical three-phone relay;
- mixed iOS/Android operation;
- locked/background behaviour across the device matrix;
- crowd/body/wall range, packet success, latency and shift battery; or
- a secure production bridge to Command.

The connected bridge is also currently plain unauthenticated WebSocket and must
not be described as a production resilience path.

## BitChat v2 components to adopt

Current public-domain source/whitepaper includes:

- a common transport abstraction (BLE and Nostr upstream; map this to BLE, venue
  IP and Loc8 gateway transports);
- Curve25519/Ed25519 long-term identity, ephemeral session IDs and QR verification;
- signed announcements and topology observations;
- Noise XX live sessions and Noise X offline sealed messages;
- TTL 7, time-bounded dedup, split horizon and degree-based TTL clamping;
- deterministic logarithmic fanout for normal traffic, full fanout for protocol
  announcements/fragments/synchronisation;
- directed traffic with source routes and flood fallback;
- bounded fragmentation/reassembly;
- encrypted persistent per-recipient outboxes and retry policy;
- privacy-limited store-and-forward couriers using spray-and-wait copy budgets;
- GCS-based recent-public-message reconciliation; and
- storage/rate limits plus panic wipe.

Do not make this one giant merge. Each component needs a Loc8 threat model,
protocol test vectors, cross-platform interoperability tests and a migration
story. In particular, identities and payload sizes cannot fit in the legacy
25-byte application frame without a new envelope/fragment strategy.

The current Android BitChat repository is GPL-3.0. For a proprietary Loc8 client,
implement Android from the public-domain protocol/iOS materials or obtain a
licence; do not paste GPL Android source into the app.

## Proposed layering

```text
Loc8 operational event/message
  -> authenticated application envelope (site/shift scope, sender role, replay data)
  -> delivery service (direct, flood, route, outbox, courier, acknowledgement)
  -> transport adapter (BLE, WSS, LoRa companion, simulator)
  -> platform/radio
```

Application security should survive an untrusted transport. WSS is still required
for metadata and channel protection, but the relay must not be able to forge an
operator or silently move a message between tenants/sites.

## Dedicated hardware path

### MeshCore option

MeshCore is the strongest active permissive ecosystem for an immediate LoRa
prototype. It has companion/repeater/server roles, prebuilt firmware, compact
hybrid routing, BLE/USB/TCP clients and many hardware targets. Use it as an
untrusted carrier for Loc8 application envelopes.

Do not adopt its bespoke direct-message crypto as Loc8's security boundary. Its
present construction uses AES block operations plus truncated HMAC and lacks the
session/forward-secrecy properties wanted for the operational layer.

### LoRaMesher option

LoRaMesher is the alternate MIT firmware path when Loc8 needs more control. It
offers distance-vector routing, route aging, link-quality and unidirectional-link
penalties, alternate next hops and synchronisation/slot management. It needs a
comparative field bake-off with MeshCore.

### Meshtastic and Reticulum

Meshtastic is the maturity benchmark for radio roles, airtime, congestion,
store-forward and hardware coverage, but GPL affects proprietary integration.
Reticulum's architecture is excellent, and its protocol is public domain, but
the current reference-code licence is restrictive. Study both; do not silently
vendor them.

## BLE engineering improvements

Independently implement and test the strongest Columba patterns:

- stable per-install transport ID independent of rotating BLE MAC/session IDs;
- central and peripheral roles with deterministic duplicate-connection collapse;
- adaptive scan duty cycles;
- explicit handshake before data transfer;
- serialized GATT operations with per-operation timeout;
- callback-loss recovery and bounded exponential reconnect;
- negotiated MTU and fragmentation; and
- clear foreground/background state telemetry.

These lifecycle details will determine real-world reliability as much as routing
math does.

## Congestion and observability

Borrow concepts, not incompatible source:

- track transmit/receive airtime, channel utilisation, queue age, duplicate rate,
  hop count, acknowledgement latency and drops by reason;
- priority queues must protect SOS/control messages from bulk telemetry;
- apply per-site, per-sender and global rate limits;
- normal broadcasts use controlled fanout; topology/sync may justify full fanout;
- expose coverage and repeater health in Command; and
- provide deterministic simulation plus packet-capture replay before field tests.

MeshCore's community includes current signal testers, coverage maps, simulators
and packet analysers. The cloned `awesome-meshcore` list should remain an R&D
radar rather than become an uncontrolled dependency list.

## Protocol-v2 acceptance conditions

- cryptographic design reviewed by an external specialist;
- public cross-platform test vectors and fuzzed decoders;
- authenticated sender/site/shift context and replay resistance;
- forward secrecy for live sessions and documented weaker properties for offline
  sealed delivery;
- bounded memory, disk, fragments, peers, retries and couriers under hostile input;
- iOS/Android interoperability and protocol downgrade protection;
- safe key rotation, device loss, revocation and panic wipe;
- migration/compatibility telemetry with the old frame; and
- no marketing encryption claim before the implementation and audit pass.

## Primary reading

- [BitChat repository](https://github.com/permissionlesstech/bitchat)
- [BitChat releases/current engineering work](https://github.com/permissionlesstech/bitchat/releases)
- [MeshCore](https://github.com/meshcore-dev/MeshCore)
- [LoRaMesher](https://github.com/LoRaMesher/LoRaMesher)
- [MeshCore ecosystem catalogue](https://github.com/samuk/awesome-meshcore)
- [Meshtastic firmware](https://github.com/meshtastic/firmware)
- [Reticulum](https://github.com/markqvist/Reticulum)
