# Result: protocol-v2 security, routing and migration boundary

## Identification

- **Date:** 2026-07-22
- **Question IDs:** SEC-01 through SEC-07; MESH-06 through MESH-10
- **Experiment:** E06 non-cryptographic component bake-off, version 1
- **Decision:** define the v2 trust/identity/migration boundary and decide which
  pure routing/dedup/fragmentation units can progress before encryption code
- **Owner/reviewer:** Codex R&D sprint; independent protocol/cryptographic review pending

## Outcome first

**PROMOTE** the threat/identity model, field classification, reviewed-security
provider boundary, monotonic migration floor, bounded reassembly/dedup contracts,
verified-topology/source-route contract and deterministic fanout policy into the
protocol-v2 engineering specification.

**REPEAT** the 25-byte carrier format and fanout measurements in native
iOS/Android, lossy packet replay and physical density tests. The fixed-cell spike
is deliberately not a frozen production wire format.

**HOLD** Noise/encryption/signature/key code, signed credentials/announcements,
outbox/courier/gossip product work, v2-required operational enablement and all
security claims until reviewed-library selection, public cross-platform vectors,
native fuzz/interoperability work and independent specialist review pass.

This is a reviewable protocol decision and measured non-cryptographic spike. It
is not a BitChat merge and provides no field-delivery or production-encryption
evidence.

## Pre-registered hypothesis and gate

The sprint records its threat model, five hypotheses, pass/fail gates and stop
conditions in [`pre-registration.md`](pre-registration.md). They were delivered
in the same uncommitted worktree change set as the implementation, so the
principal audit cannot independently prove their creation order. Treat them as
the experiment protocol and reported sequence, not a cryptographically or
commit-time verified preregistration. No gate was changed during the principal
audit.

One design correction occurred during implementation, before the final run: the
first cell layout put fragment-varying values in bytes 1–4. Existing native Loc8
derives its outer sender ID from those bytes, so the final layout reserves them
for one caller-supplied rotating compatibility pseudonym. The failure and reason
are preserved here rather than hidden.

## Method

1. Read the exact Expo SDK 57 reference before code, as required by `AGENTS.md`.
2. Inspected the current TypeScript codec, TrustLayer, MeshService,
   BridgedTransport/BLE transport and tests; iOS/Android constants, frame codec,
   dedup, relay and BLE services; and the dumb WebSocket relay.
3. Inspected the read-only upstream source library at its pinned commits, with
   BitChat iOS/v2 as the primary public-domain reference and licence-separated
   architectural review of Columba, Weshnet, MeshCore, Meshtastic and Reticulum.
4. Pre-registered threats, hypotheses, gates and stop conditions.
5. Independently implemented a pure Node.js 25-byte carrier/reassembly,
   migration, dedup, topology/routing and fanout seam with no dependency and no
   cryptography.
6. Ran 11 adversarial tests and a five-density, 100-message-per-density
   deterministic simulation. Principal review then added assertions for
   provider exceptions, same-epoch allowlist conflict, persisted-state shape,
   topology rollback/conflict and failed-edge route fallback and reran all 11.

## Current implementation findings

- Native v1 is 47 raw bytes: 14-byte header, 8-byte stable sender ID and the
  unchanged 25-byte plaintext application payload. Egress is raw 47 by default;
  decoders also accept 256-byte padded frames.
- iOS/Android originate TTL 7, apply degree clamps/jitter/split horizon, full
  fanout and a 1,000-entry/300-second in-memory dedup cache.
- Stable outer sender ID is `LOC8` plus application `senderId`; every content and
  location field is plaintext and unsigned.
- TypeScript TrustLayer is in-memory, seconds-resolution per-sender/type
  monotonicity with coarse wall-clock windows. It is not authentication,
  encryption or restart-persistent replay protection.
- Text/profile fragments bypass TrustLayer and use a 64-entry completed-message
  set after reassembly. Native code has no local unit-test target in this
  worktree; TypeScript BLE tests mock the native module.
- BridgedTransport and the demo relay still carry raw 25-byte frames through
  unauthenticated plain WebSocket infrastructure; CONN-01 separately defined the
  connected production boundary.

## Version manifest

| Item | Version/identifier |
|---|---|
| Loc8 base | worktree HEAD recorded in `manifest.json` |
| Expo docs read | exact `https://docs.expo.dev/versions/v57.0.0/`; SDK 57 targets React Native 0.86 / React 19.2.3 / Node 22.13.x minimum |
| Runtime | sprint reported Node.js 22.12.0; principal audit reran on Node.js 22.22.3 |
| Spike | protocol-v2-boundary v1 |
| BitChat iOS/v2 | `733098bb633e`, Unlicense/public domain |
| Columba | `a19b2c2a1a7c`, MPL-2.0, inspect/learn only |
| Weshnet | `d735e1d4f723`, MIT/Apache-2.0, inspect/learn only |
| MeshCore | `a3a1aa5e3be3`, MIT, routing reference only; custom crypto rejected |
| Meshtastic firmware | `f90c1340de20`, GPL-3.0, benchmark/learn only |
| Reticulum | `122f17fad69a`, custom reference-code licence; protocol separately public domain, no code copied |
| Devices/OS/building | none; synthetic pure-code experiment |

## Licence, privacy and consent

No upstream source was copied. The prototype was independently written after
architectural inspection. BitChat's public-domain components informed selection
and comparison; all other named projects remained read-only within their recorded
licence boundaries. There are no participants, sites, personal data, location
traces or large/generated artifacts.

Product adoption of any upstream file still requires file-level provenance,
copyright/licence notices, dependency review and a third-party notices entry.
BitChat Android/GPL, Meshtastic/GPL, Columba/MPL, Reticulum custom code and any
conflicting/unlicensed source are not product-copy sources for this sprint.

Principal source audit found one important BitChat inconsistency: the pinned
whitepaper describes static-key courier Noise X as lacking forward secrecy and
calls prekeys future work, while the same pinned source tree implements and tests
signed/gossiped one-time prekey bundles and prekey-targeted Noise X with a
consumption grace/deletion lifecycle. The public-domain implementation is now a
candidate for the reviewed bake-off, not evidence that Loc8 should copy or trust
the cryptographic composition without vectors and specialist review.

## Results

### Adversarial seam tests

`11/11` passed, covering:

- discriminator separation across all eight valid v1 packet types;
- exact 25-byte cells, out-of-order reassembly and exact-duplicate handling;
- malformed length/index/count/padding, conflicting fragments and oversize;
- per-peer/global assembly count, buffer bytes and timeout cleanup;
- mandatory reviewed-provider gate before logical-frame delivery;
- provider exceptions and unverified/stale/conflicting/regressive migration policy;
- v2-required downgrade rejection after snapshot/restart;
- bounded dedup under load, control reserve, expiry and restart;
- unverified/stale/unidirectional/regressive/conflicting topology, route hop
  bound, failed-edge alternate route and flood fallback;
- deterministic logarithmic fanout and full fanout for critical classes.

### Synthetic fanout measurement

All cohorts used a deterministic connected 32-node ring-plus-chords graph and 100
message handles. There was no radio loss, churn, background suspension or battery
model.

| Target degree | Controlled delivery | Full attempts/msg | Controlled attempts/msg | Reduction |
|---:|---:|---:|---:|---:|
| 2 | 100.00% | 33 | 33.00 | 0.00% |
| 4 | 97.41% | 97 | 63.34 | 34.70% |
| 8 | 98.84% | 225 | 95.89 | 57.38% |
| 16 | 98.91% | 481 | 127.60 | 73.47% |
| 31 | 99.81% | 961 | 159.70 | 83.38% |

The recorded ≥95% delivery gate passed in every synthetic cohort. The ≥50%
dense transmission-reduction gate passed at target degrees 8, 16 and 31. Degree
2 correctly produces no saving, and degree 4 saves only 34.7%; sparse/moderate
graphs should retain fuller fanout. Raw numeric output is in
[`measurements.json`](measurements.json).

## Protocol and security decisions

- Full trust/identity/offline revocation/pseudonym/audit linkage:
  [`threat-identity.md`](threat-identity.md)
- Field-by-field current-v1 confidentiality/authenticity/integrity/traffic
  analysis: [`field-classification.md`](field-classification.md)
- Component ADR, 25-byte coexistence and adoption map:
  [`protocol-v2-adr.md`](protocol-v2-adr.md)

The core migration invariant is: authenticated site/shift policy only moves
`legacy → dual → v2-required`; peer capability, absence, timeout, failure or a
later ordinary policy cannot move it backwards. Operational v2 messages are never
translated or mirrored to v1.

## Exact product units

### Promoted as contracts, not production-ready source

1. `V2CarrierClassifier` — intercept marker `0xD2` before current `decodePacket`.
2. `V2CellCodec` — fixed-cell validation/segmentation with caller-supplied opaque
   pseudonym and message handle.
3. `V2ReassemblyPool` — per-peer/global count/byte/time bounds and conflict drop.
4. `ReviewedFrameSecurityProvider` — mandatory verify/open/seal/policy/
   announcement/key-destruction boundary; implementation pending selection/review.
5. `MigrationPolicyStore` + `MigrationGuard` — authenticated monotonic site/shift
   floor persisted across restart.
6. `PersistentDedupStore` — site/shift/authenticated-message key, expiry,
   control reserve and conservative restart.
7. `VerifiedTopologyStore` + `RoutePlanner` — signed/fresh/bidirectional bounded
   graph, source route and flood fallback.
8. `FanoutPolicy` — traffic-class full fanout and measured deterministic normal
   fanout, configurable by density/field evidence.

### Held units and their prerequisites

`IdentityKeyProvider`, `CredentialVerifier`, `RevocationStore`,
`PseudonymProvider`, Noise-backed `ReviewedFrameSecurityProvider`,
`EncryptedOutboxStore`, `CourierStore`, `GossipReconciler`,
`PanicWipeCoordinator` and `RecoveryCeremony`. Their independent security,
licence, storage, native interoperability and physical-test gates are enumerated
in the ADR.

## Adverse observations and limitations

- The compatibility cell now carries only nine logical bytes: 36% payload
  efficiency before native wrapping. A 2,048-byte logical frame can require 228
  cells. This may be unacceptable for BLE airtime/battery and must be compared
  with negotiated variable-length native v2 framing.
- Controlled fanout intentionally sacrifices some delivery in the deterministic
  simulator (minimum 97.41%). Real packet loss/churn may push it below the gate;
  critical classes remain full fanout.
- The four-byte compatibility pseudonym is collision-prone and observable. It is
  not an authenticated route or install identity.
- Persistent dedup requires a trusted downtime/clock adapter. With uncertain
  downtime, retaining entries for the full window protects replay at the cost of
  possible valid-message suppression.
- Offline revocation has irreducible propagation delay. Credential lifetime and
  explicit grace define the risk window.
- The prototype does not exercise React Native, Expo, native BLE, secure storage,
  crypto libraries, app restart, hardware, battery, OS background behavior or
  physical topology.
- Repository-wide regression was attempted with
  `npm test -- --runInBand --forceExit` but could not start because this isolated
  worktree has no installed `jest` binary. Dependencies were not installed: free
  disk space had fallen to approximately 406 MiB and this sprint explicitly
  forbids installs under constrained space. The standalone syntax/JSON checks and
  11/11 spike tests passed.

## Decision and remaining gates

- **State:** PROMOTE bounded prototype interfaces and candidate invariants into
  engineering specification / REPEAT native and
  physical evidence / HOLD cryptography and product enablement.
- **Scope:** protocol architecture and pure deterministic simulator only.
- **Product/specification change:** protocol v2 is now explicitly layered,
  downgrade-resistant, identity-scoped and bound before cryptography. Current v1
  remains a plaintext lab prototype and cannot be an operational fallback.
- **Next owner action:** protocol/security engineering selects candidate reviewed
  libraries and writes the logical-frame/credential vectors; native engineering
  runs MTU/loss/restart/fuzz comparisons; an independent specialist reviews the
  whole composition before encryption code or claims.
- **Physical gates still open:** MESH-01 through MESH-05, lossy density replay,
  native restart/background/MTU, packet capture, shift battery and physical
  migration interoperability.
- **Review trigger:** candidate library and logical frame draft, or any physical
  result that changes the 25-byte/relay/fanout assumptions.

## Reproduction

No install is required:

```sh
node --test docs/research/rnd/prototypes/protocol-v2-boundary/protocol-v2-boundary.test.mjs
node docs/research/rnd/prototypes/protocol-v2-boundary/benchmark.mjs
```
