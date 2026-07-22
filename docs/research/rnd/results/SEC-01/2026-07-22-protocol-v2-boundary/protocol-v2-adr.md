# ADR: Loc8 mesh protocol-v2 boundary and migration

- **Date:** 2026-07-22
- **Status:** research decision; product integration not authorised
- **Questions:** SEC-01 through SEC-10; MESH-06 through MESH-10; OSS-01
- **Decision:** promote bounded non-cryptographic interfaces and migration
  invariants; repeat wire/native work; hold cryptographic implementation and
  all external security claims for reviewed-library selection and independent
  specialist review.

## Context

Current Loc8 uses an unsigned/plaintext native v1 broadcast envelope with a
fixed 25-byte application payload. It has useful TTL, jitter, split-horizon and
dedup controls but no authenticated identity, membership, encryption, stable
peer topology, directed routing, persistent replay state or downgrade policy.
The TypeScript `TrustLayer` is only process-local wall-clock monotonicity.

BitChat iOS/v2 at `733098bb633e` is the primary public-domain reference and
implements the relevant family of components. It is not an independent review
of Loc8, and its presence does not make a Loc8 composition secure. GPL BitChat
Android, GPL Meshtastic, MPL Columba, custom-licensed Reticulum reference code
and any unresolved source remain outside copied product code.

## Decision: layering

```text
Loc8 operational event
  -> authenticated application envelope
       site + shift epoch + role/capability + sender sequence/message ID
       encrypted person/install/audit subject and event payload
  -> reviewed security provider
       live session / offline seal / policy & announcement verification
  -> logical delivery frame
       authenticated immutable routing/QoS/expiry fields
       separately governed mutable hop cursor/budget
  -> bounded delivery policy
       source route or controlled flood; dedup; outbox/courier/gossip
  -> 25-byte carrier cells or another negotiated transport framing
  -> BLE / authenticated WSS / LoRa adapter / simulator
```

Application security survives an untrusted transport. Relays get only the
minimum authenticated routing/QoS state they need. Exact cryptographic algorithms,
transcript/signature coverage, key storage and logical-frame bytes remain owned
by the reviewed provider and specialist-reviewed protocol specification.

## 25-byte coexistence seam

The spike proposes a fixed 25-byte **carrier cell**, not the final secure
logical frame:

```text
0       marker/version discriminator = 0xD2
1..4    rotating compatibility pseudonym (no authority)
5       fragment index
6       fragment count (1..255)
7..14   opaque per-message handle
15      body length (1..9)
16..24  opaque logical-frame bytes, zero-padded final cell
```

The marker cannot be a valid current v1 packet type (`0..7`). Current native
wrapping derives its outer sender ID from payload bytes `1..4`, so those bytes
must remain stable across all cells in a pseudonym rotation period. Legacy
native nodes may relay these cells as opaque v1 payloads while legacy JS drops
them as an unknown packet type. That is a compatibility carrier, not evidence
that the legacy relay understands or authenticates v2.

The cell carries nine useful bytes (36% efficiency before the existing 47-byte
native wrapper). A 2,048-byte logical-frame cap needs at most 228 cells. This is
deliberately expensive evidence: a production decision must compare (a) this
legacy-compatible cell path, (b) a new variable-length native v2 frame over
negotiated MTU and (c) lower-layer GATT segmentation. Do not freeze the spike
format until iOS/Android MTU, background, loss and battery measurements exist.

Reassembly is hop-by-hop and bounded before authentication: default 2,048 bytes,
32 global assemblies, four per peer, 32 KiB buffered and 30 seconds. A completed
logical frame still cannot reach the application or authoritative routing store
without `ReviewedFrameSecurityProvider.verifyAndOpen`.

## Migration state machine

| State | Receive | Send | Security meaning |
|---|---|---|---|
| `legacy` | v1 plus v2 cells | v1 only in an explicitly labelled lab build; v2 may probe | No encryption/authentication claim; current behavior |
| `dual` | v2; v1 only for signed-policy allowlisted types | Operational events use v2 only; never mirror or translate v2 into v1 | Compatibility observation without silent downgrade |
| `v2-required` | v2 only; reject v1 before application decode | v2 only | Minimum operational/pilot state after review and integration |

Because every current v1 type exposes or authorises sensitive data, a public or
operational dual-mode policy should normally have an empty v1 allowlist. A closed
lab policy may allow explicit types to measure migration.

Rules:

1. Site/shift policy is authenticated by the reviewed policy verifier and has a
   monotonic epoch and mode rank.
2. Persist the highest accepted epoch/mode. Reject stale epochs, same-epoch
   conflicts and any later mode regression, including after restart.
3. Peer capability is only a hint when verified and can never lower policy.
   Timeout, radio silence, malformed v2, route failure or a v1-only peer never
   triggers fallback.
4. v2 application messages are never translated to v1, because translation
   discards end-to-end identity/security semantics.
5. A v1-only peer in v2-required mode is shown as incompatible/unavailable, not
   reached insecurely.
6. Resetting the migration floor requires an out-of-band recovery authority,
   factory reset/re-enrolment and audit event. The spike does not implement it.

## Component adoption map

| Component | Upstream evidence | Decision | Exact Loc8 unit / gate |
|---|---|---|---|
| Signed install identity and announcements | BitChat public-domain three-layer identity/signing; Reticulum protocol concepts | **HOLD implementation; PROMOTE model** | `IdentityKeyProvider`, `CredentialVerifier`, `AnnouncementVerifier`, platform protected storage, cross-platform vectors and specialist review |
| Reviewed Noise live/offline sessions | BitChat uses Noise XX live. Its whitepaper still describes static-key Noise X courier seals without forward secrecy, but pinned source `733098bb633e` also implements signed/gossiped one-time prekey bundles and prekey-targeted Noise X with a post-consumption grace/deletion window. Source/docs therefore conflict and the composition is not independently reviewed. | **HOLD implementation; PROMOTE prekey candidate for bake-off** | `ReviewedFrameSecurityProvider` with `sealLive`, `sealOffline`, `verifyAndOpen`, prekey lifecycle, key destruction and replay API. Compare a maintained reviewed library and public vectors against the public-domain prekey design; do not treat upstream code or tests as a security review. |
| Topology and source routing | BitChat public-domain shallow signed topology/source routes; MeshCore/Reticulum concepts | **PROMOTE contract; REPEAT radio** | `VerifiedTopologyStore`, `RoutePlanner`; only verified, fresh, bidirectional edges; max nodes/neighbors/hops; flood fallback; failure cache and movement tests |
| Controlled fanout | BitChat deterministic logarithmic fanout; Meshtastic airtime discipline | **PROMOTE simulator policy; REPEAT physical** | `FanoutPolicy`; full fanout for control, announcements, sync and fragments until packet-loss tests justify narrowing; normal dense traffic uses deterministic subset |
| Deduplication | Current Loc8/BitChat bounded LRU; MeshCore/Meshtastic benchmarks | **PROMOTE bounded persistent contract** | `PersistentDedupStore`; authenticated message handle + site/shift epoch; 1,000/300 s are starting values only; control reserve; snapshot/restart and collision tests |
| Bounded fragmentation | BitChat 128 assemblies/30 s/1 MiB; current Loc8 text reassembly lacks equivalent security boundary | **PROMOTE bounds; REPEAT format** | `V2CellCodec`, `V2ReassemblyPool`; per-peer/global bytes/count/time bounds, conflicting duplicate rejection, auth only after complete frame, native fuzz/conformance |
| Persistent sender outbox | BitChat public-domain sealed 100/peer, 24 h, retry cap | **HOLD behind crypto/identity** | `EncryptedOutboxStore`; plaintext never persisted, recipient credential not pseudonym, per-site/recipient bytes/count/age/retry quotas, delivery acknowledgement semantics, restart/key-loss tests |
| Couriers / spray-and-wait | BitChat rotating recipient tags and copy budgets; Weshnet replication concepts | **HOLD** | `CourierStore` and `CourierPolicy`; requires offline seal, revocation, privacy analysis, copy/depositor/global quotas, battery/movement evidence and explicit operational value |
| Gossip reconciliation | BitChat GCS public-history sync; Weshnet replicated logs | **HOLD / narrow** | `GossipReconciler`; only authenticated explicitly reconcilable classes, bounded filter/cache windows, false-positive/missing-message tests. Do not gossip person location/history by default |
| Replay, ordering and clocks | Current TrustLayer plus BitChat windows/session nonces | **PROMOTE new semantics; STOP current logic as v2 security** | authenticated install+epoch+sequence/message ID, persistent recent set, coarse local expiry, explicit clock anomaly, sequence-wrap rekey. Seconds-only process-local LWW is insufficient |
| Panic/loss handling | BitChat panic wipe; Loc8 gateway/audit requirements | **PROMOTE separation; REPEAT drills** | `PanicWipeCoordinator`, `RevocationStore`, `RecoveryCeremony`; destroy local secrets/outboxes/mappings, publish revocation separately, preserve authorised remote audit, verify storage/backups and lost-device partition behavior |
| BLE lifecycle | Columba MPL patterns; current native modules | **LEARN/reimplement** | stable transport identity distinct from pseudonym, deterministic duplicate-link collapse, explicit handshake, serialized GATT queue/timeouts, callback-loss recovery, adaptive scanning and state telemetry. No Columba code copied |

## Routing and fanout policy

- Source route only when every edge is fresh, verified and bidirectionally
  confirmed; cap route length at seven until field evidence changes it.
- On missing/stale route or failed next hop, use controlled flood. Do not treat a
  route as an authorisation decision.
- Normal traffic fanout target is `ceil(log2(degree + 1))`, deterministically
  seeded by the message handle and current node. The spike's non-security hash
  only spreads load and must never protect integrity or generate identifiers.
- Full fanout remains for security/control announcements, fragmentation and
  reconciliation because losing one of those can amplify state or stall a whole
  logical message. Physical tests may justify a different class later.
- Split horizon, TTL/hop cap, per-sender/site/global rate limits, queue age and
  drop-reason metrics remain mandatory.

## Offline delivery and reconciliation

Outbox, courier and gossip are three distinct products, not one queue:

- **Outbox:** sender-owned, recipient-authenticated, sealed persistence; cleared
  only by authenticated receipt, expiry, retry cap, revocation or wipe.
- **Courier:** third-party opaque carriage with recipient privacy and copy budget;
  never enabled for plaintext or stable person identifiers.
- **Gossip:** set reconciliation for an explicitly public/authenticated bounded
  class; not a shortcut to replicating sensitive operational history to phones.

All use the logical message ID for end-to-end dedup and preserve the original
authenticated creation/expiry/shift claims. Rewrapping across BLE/WSS/LoRa may
change carrier cells/hop state but never the authenticated application identity.

## Consequences

Benefits: a narrow crypto review surface, explicit downgrade state, transport
independence, resource bounds before expensive work and migration that can use
the existing 25-byte carrier during measurement.

Costs: 25-byte compatibility cells have severe overhead; hop-by-hop reassembly
adds latency/state; routing metadata and timing remain observable; offline
revocation is never instantaneous; and v1-only devices become unavailable rather
than receiving sensitive data insecurely after v2-required.

## Independent gates before product encryption code

1. Specialist review of threat model, identity/credential/revocation model,
   logical frame, mutable-hop authentication, Noise pattern/library choice,
   offline-forward-secrecy tradeoff and migration recovery.
2. Public cross-platform vectors for policy, credential, announcement, live
   session, offline seal, logical frame and replay/rekey behavior.
3. Fuzzed TypeScript/native decoders and reassemblers with allocation/CPU bounds.
4. iOS/Android interoperability across MTU, restart, background, locked and
   malformed-peer cases.
5. Physical fanout/dedup/load tests and packet captures; synthetic delivery is
   not field evidence.
6. Lost/stolen/revoked/panic/recovery tabletop plus implementation drill.
7. Third-party notices/provenance for every adopted file and dependency; no GPL,
   custom or unresolved source copied into proprietary product.
8. Security/product language remains “plaintext v1 prototype; v2 under review”
   until implementation and independent review pass.
