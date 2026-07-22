# SEC-05 preregistration — crypto-provider and credential bake-off

**Frozen:** 2026-07-22, at Loc8 commit `74eb9b354c0a`, before prototype
implementation or measurement

**Question:** `SEC-05`, with evidence for `SEC-03`, `SEC-06`, `SEC-08` and
`SEC-10`

**Experiment:** `E06` reviewed-provider, logical-frame, credential and prekey
contract bake-off

**Decision unlocked:** which standards, interfaces, byte budgets and candidate
providers may enter a native iOS/Android interoperability repeat; no provider or
cryptographic implementation can be promoted to the product by this pure-code
cycle

## Research question

What connected-session and delayed-delivery encryption architecture can meet
Loc8's authentication, authorisation, replay, forward-secrecy and constrained
carrier requirements without making Loc8 the author of cryptographic
primitives?

This cycle deliberately separates five decisions that are too often collapsed:

1. the logical frame and transport carrier;
2. the connected-session or offline-sealed-message protocol;
3. the implementation provider on each supported platform;
4. the credential and application authorisation policy; and
5. key generation, storage, rotation, deletion, rollback and recovery.

Possession of a Noise or HPKE static private key is not by itself a Loc8
credential. Passing a public vector is not by itself a provider security review.
Deleting a one-time key may improve a narrowly stated compromise property, but
is not evidence of end-to-end forward secrecy unless deletion, replay,
credential binding and recovery are all demonstrated.

## Pre-registered hypotheses

1. **No single current candidate clears the product gate.** The inspected
   candidates will each leave at least one required item unproved: a common
   public mobile API/wire format, relevant independent review, native device
   evidence, credential binding, or crash-safe key lifecycle.
2. **Standard wire contracts beat copied custom crypto.** RFC 9180 HPKE or a
   precisely named Noise protocol, public vectors and a narrow provider
   interface will leave a smaller auditable surface than copying BitChat's
   handwritten Noise state machine, despite its public-domain licence.
3. **Credentials belong above the encryption primitive.** A deterministic
   CWT/COSE_Sign1 candidate plus short cached key/credential handles can bind
   site, subject, scope, validity and proof-of-possession without carrying a
   full credential in every 25-byte transport cell.
4. **Offline encryption has an unavoidable byte cost.** X25519 HPKE adds 48
   bytes before application framing, while one-way Noise X adds 96 bytes before
   an optional prekey identifier. The existing 9-byte cell body can carry these
   only through bounded fragmentation; no design may conceal this cost.
5. **One-time-prekey safety is a storage transaction, not just a DH pattern.** A
   prekey design cannot pass if assignment or consumption can be reported as
   successful before durable persistence, if corrupt state silently resets, or
   if the same prekey can accept distinct logical messages.
6. **Connected and delayed delivery require different compositions.** Noise XX
   is a useful connected-session candidate; one-shot HPKE or a reviewed
   prekey-based construction is a delayed-delivery candidate. Neither is
   assumed to replace replay, credentials, policy, delivery receipts or secure
   recovery.

## Evidence inspected before freezing

### Primary standards and current registries

- Noise Protocol Framework revision 34:
  <https://noiseprotocol.org/noise.html>. Noise defines the handshake and
  cipher-state machinery, a 64-bit nonce space, channel binding and optional
  explicit nonces for out-of-order transport. The application still owns
  framing, credential acceptability, replay retention, termination and rekey.
- RFC 9180 HPKE: <https://www.rfc-editor.org/rfc/rfc9180.html>. X25519's
  encapsulated key is 32 bytes and the selected AEAD tag is 16 bytes. HPKE is
  unidirectional, does not provide recipient-compromise forward secrecy in any
  mode, and does not supply application replay, downgrade, reordering or length
  hiding.
- RFC 8949 CBOR: <https://www.rfc-editor.org/rfc/rfc8949.html>. The candidate
  uses core deterministic encoding: preferred shortest forms, no indefinite
  lengths and bytewise lexical ordering of encoded map keys. Duplicate map keys
  must be detected before conversion to a lossy native map.
- RFC 9052 COSE: <https://www.rfc-editor.org/rfc/rfc9052.html>. COSE_Sign1 is
  `[protected, unprotected, payload, signature]`; tag 18 is optional by context.
  Duplicate header labels are malformed and critical headers must be processed.
- RFC 8392 CWT: <https://www.rfc-editor.org/rfc/rfc8392.html>, RFC 8747 proof of
  possession: <https://www.rfc-editor.org/rfc/rfc8747.html>, and the live IANA
  CWT registry: <https://www.iana.org/assignments/cwt/cwt.xhtml>. In particular,
  `iss`, `sub` and `aud` are text, `cti` is bytes, `cnf` is registered key 8,
  `scope` is key 9, and numeric private-use claim keys are below `-65536`.
- RFC 9420 MLS: <https://www.rfc-editor.org/rfc/rfc9420.html>. MLS is retained as
  a later group-security comparison, not treated as a pairwise drop-in. It
  assumes an Authentication Service and Delivery Service and makes the
  application responsible for credential acceptability.

### Retained source and provider candidates

All repositories below are retained under `docs/research/rnd/repos/`; no source
has been copied into Loc8. Tree-only clones intentionally have no checked-out
files; evidence is read with `git show` and `git ls-tree`.

| Candidate | Pinned commit | Root licence / role frozen for this cycle |
|---|---|---|
| BitChat iOS/v2 | `733098bb633e` | Unlicense; architecture and adverse-case source evidence only |
| Noise-C | `cfe25410979a` | MIT; old official-reference candidate/oracle |
| Snow | `8ac60f51cfe3` | MIT/Apache-2.0; active Rust Noise candidate/oracle, README says no formal audit |
| Swift Crypto | `47d3869a7291` | Apache-2.0; HPKE/provider candidate and RFC-vector source |
| libsodium | `7014b204b6fb` | ISC; primitive/provider candidate, not a protocol or credential system |
| Tink Java | `1423887709cd` | Apache-2.0; Android HPKE Base/Hybrid candidate |
| Tink C++ | `5bf527a8dc73` | Apache-2.0; shared BoringSSL HPKE packaging repeat |
| Tink Objective-C | `04e43ef89f8c` | Apache-2.0; signature/AEAD evidence only; current support table has no HPKE |
| archived Tink umbrella | `1f4cd38874ec` | Apache-2.0; historical split-repository evidence only |
| libsignal | `8e49f09bbcde` | AGPL-3.0 and unsupported external API; learn-only PQXDH/ratchet reference |
| OpenMLS | `65396d8ed312` | MIT; separate group-security reference/repeat |
| COSE Examples | `53c9d634333b` | Unlicense; public COSE/CWT pass/fail vector provenance |
| go-cose | `022cb5419154` | MPL-2.0; audited Go parser/oracle, not a mobile provider |

Current Tink documentation records HPKE support for Java and C++ with BoringSSL,
not Objective-C or C++ with OpenSSL, and warns that its high-level Hybrid
primitive provides privacy rather than sender authenticity. Tink's HPKE wire is
an optional 5-byte Tink prefix followed by `enc || ciphertext || tag`; the
prefix is an unauthenticated key-selection hint. These facts are candidate
constraints, not a conclusion that Tink is safe for Loc8.

Swift Crypto contains an RFC 9180 implementation and official vectors, but its
normal Apple build re-exports the operating-system CryptoKit rather than
guaranteeing that the vendored implementation is used. The installed Xcode
iPhoneOS 18.2 SDK marks CryptoKit HPKE as available from iOS 17. Swift Crypto's
non-Apple implementation and platform declarations do not erase that Apple API
floor or prove Kotlin/Android interoperability.

### BitChat source findings that must be challenged

- BitChat implements its own Noise XX/IK/NK/X state machine over CryptoKit. Its
  XX vector runner requests `useExtractedNonce: false`, while established live
  sessions request the extracted-nonce mode. The latter prepends a 4-byte nonce
  and stops near `UInt32.max`; the public transport ciphertext vectors therefore
  do not cover the live framing mode.
- Its vector fixture combines the Cacophony and Snow community vectors and is
  valuable provenance. Matching those vectors is necessary but cannot validate
  BitChat's additional live framing, replay window, credential policy or key
  lifecycle.
- Noise static-key possession/fingerprints are described in places as
  authenticated, but no venue/site/role credential binding follows from that
  alone.
- Keychain failure can fall back to an ephemeral identity. A product identity
  path must instead fail closed and surface recovery.
- The one-time-prekey source is newer than its whitepaper: signed/gossiped
  bundles, targeted Noise X, 48-hour consumed-key grace and deletion are
  implemented. This is a useful design candidate, not independent review.
- `LocalPrekeyStore.markConsumed` mutates state before a persistence function
  whose failure is logged but not returned. Corrupt loads can silently reset
  state, and `nextID &+= 1` has no collision/wrap policy.
- `PrekeyBundleStore` can return an assignment after persistence failure and
  uses wall-clock freshness without a complete future-time/rollback contract.
  Retaining a consumed private key permits repeated decryption during the grace
  window unless the application binds an exact logical message and dedup record.
- The current rekey helper removes a session, generates the first replacement
  handshake message, then discards that returned message. This is recorded as a
  lifecycle question, not asserted as an exploitable vulnerability.

## Scope

### Included

1. A dependency-free, non-cryptographic model of deterministic CBOR and the
   exact CWT/COSE_Sign1 byte shape below.
2. Strict parsing tests for canonical form, duplicate keys, malformed lengths,
   tags, headers, trailing bytes and bounded inputs.
3. Exact byte/cell formulas for the shortlisted Noise and HPKE shapes.
4. A fail-closed evidence-gate evaluator for every provider candidate.
5. A pure prekey assignment/consumption state machine with injected persistence
   failure, clock anomaly, rollback, retransmission and identifier-wrap cases.
6. A provenance manifest containing upstream URL, commit, path, Git object and
   SHA-256 for selected public vectors and source evidence.
7. Deterministic tests and a local benchmark, repeated twice.

### Excluded

- generating a key, signature, shared secret, ciphertext or cryptographic nonce;
- copying or modifying BitChat, Snow, Noise-C, Tink, Swift Crypto, libsodium,
  libsignal, OpenMLS or go-cose source;
- choosing final algorithms, key lifetimes or a provider for production;
- Expo/native-module integration, app behaviour or wire-format migration;
- device builds, secure-enclave/keystore tests, interoperability, energy,
  latency or binary-size claims;
- proving cryptographic correctness, side-channel resistance, audit coverage,
  forward secrecy, post-compromise security or operational recovery; and
- claiming that COSE, CWT, HPKE, Noise, MLS or a permissive licence makes the
  overall Loc8 composition secure.

## Frozen deterministic fixtures

### Credential shapes

The encoder must produce and the strict decoder must validate six exact
stand-alone shapes: two claims maps across three tag variants. Values are fixed
fixture data, not a proposed production issuer namespace.

The standard claims map is:

| Claim | Fixture value | Meaning |
|---|---|---|
| `1` (`iss`) | `"loc8-ca"` | credential issuer |
| `2` (`sub`) | `"device-00000001"` | study device/install subject |
| `3` (`aud`) | `"site-001"` | intended site verifier |
| `4` (`exp`) | `1800003600` | expiration NumericDate |
| `5` (`nbf`) | `1800000000` | not-before NumericDate |
| `6` (`iat`) | `1800000000` | issued-at NumericDate |
| `7` (`cti`) | eight bytes `01..08` | credential ID |
| `8` (`cnf`) | `{3: eight bytes 11..18}` | proof-of-possession signing-key handle |
| `9` (`scope`) | eight bytes `21..28` | compact fixture authorisation scope |

The extended Loc8 size candidate adds private-use claims:

- `-70001`: eight-byte recipient-encryption-key handle `31..38`;
- `-70002`: unsigned policy epoch `7`; and
- `-70003`: eight-byte shift handle `41..48`.

Private claims are a byte-cost and parser fixture only. Promotion would require
a written application specification, collision governance and specialist/legal
review; they are not silently interoperable CWT claims.

The COSE_Sign1 shape is:

```text
[
  protected: deterministic-CBOR({1: -8, 4: h'5152535455565758'}),
  unprotected: {},
  payload: deterministic-CBOR(claims),
  signature: 64 zero placeholder bytes
]
```

Algorithm `-8` is the EdDSA identifier in the size fixture only. The prototype
does not sign or verify. It must report the sizes of untagged COSE_Sign1, tag 18
COSE_Sign1, and tag 61 CWT wrapping tag 18. The double-tagged form is the frozen
stand-alone comparison; an eventual application may omit tags only if its
context unambiguously fixes both types.

### Logical-frame metadata

The comparison frame has a fixed 32-byte outer metadata header:

| Field | Bytes |
|---|---:|
| protocol version | 1 |
| message kind | 1 |
| crypto suite | 1 |
| flags | 1 |
| credential handle | 8 |
| recipient handle | 8 |
| message ID | 8 |
| policy epoch | 4 |

This header is assumed to be cryptographically bound as associated data by a
future provider. The prototype may calculate sizes but must not imply that the
binding exists in the current product.

Payload cohorts are `0`, `16`, `32`, `64`, `128`, `512` and `1024` bytes. Every
formula is evaluated both without and with the 32-byte logical header.

### Frozen byte formulas

For X25519 and a 16-byte AEAD tag:

| Candidate shape | Encoded bytes before outer logical header |
|---|---:|
| Noise X one-way handshake | `payload + 96` |
| Noise X plus explicit 4-byte prekey ID | `payload + 100` |
| Noise XX complete three-message handshake, initiator payload in final message | `payload + 192` |
| Noise transport, sequential implicit nonce | `payload + 16` |
| Noise transport, explicit full 64-bit nonce | `payload + 24` |
| RFC 9180 HPKE X25519 raw Base or Auth one-shot | `payload + 48` |
| Tink HPKE with RAW output prefix | `payload + 48` |
| Tink HPKE with TINK output prefix | `payload + 53` |

The formula for HPKE Auth has the same wire length as Base; that equality does
not make their authentication properties equal. BitChat's `payload + 20`
4-byte-nonce transport is measured only as an adverse upstream comparison and
cannot be selected by this cycle.

The existing SEC-01 candidate carrier contributes 9 logical-frame body bytes per
25-byte cell. Cell cost is `ceil(frameBytes / 9)`, with a hard 255-cell and
2048-frame-byte limit. A 2048-byte frame requires 228 cells. Anything over 2048
bytes must fail rather than wrap, truncate or allocate unbounded state.

## Provider evidence gate

The evaluator is veto-based, not a weighted score. `unknown` fails a mandatory
gate. A provider may enter the native repeat only if its evidence manifest shows:

1. a product-compatible licence and recorded file/dependency boundary;
2. active maintenance and a pinned supported release/commit;
3. a stable public API usable on both target platforms, or a deliberately shared
   provider with a documented FFI boundary;
4. exactly the same named protocol, suite and wire encoding on iOS and Android;
5. official/public vectors executed on both platform implementations;
6. an independent review whose commit, provider, primitive and integration scope
   are relevant, with unresolved findings recorded;
7. fail-closed key generation/storage/rotation/deletion and recovery integration;
8. adversarial parser tests, fuzzing and bounded input/state behaviour;
9. real mobile build, interoperability, minimum-OS, binary-size and performance
   evidence; and
10. a specialist review plan for the Loc8 composition, credentials, framing,
    replay, downgrade and lifecycle—not just the primitive.

The pure prototype can populate `pass`, `fail` or `unknown` evidence and identify
the next experiment. It cannot turn gates 5–10 green by assertion.

## Prekey lifecycle contract to test

The pure state machine must enforce all of the following:

- bundle generation, revision and expiry are monotonic; rollback is rejected;
- a bundle generated over 5 minutes in the future or over 7 days old is rejected;
- the lowest unused prekey ID is assigned deterministically to a logical
  `messageId` only after an injected durable transaction succeeds;
- an exact retransmission with the same `messageId` and ciphertext digest is
  idempotent, while any distinct message or digest using that prekey is rejected;
- recipient consumption and the replay/dedup record commit atomically before
  plaintext release is represented as successful;
- persistence failure leaves no successful assignment/consumption and rolls
  in-memory state back to the last durable revision;
- corrupt or missing previously-initialised state fails closed into recovery; it
  never silently creates a replacement identity/prekey namespace;
- `UInt32.max` identifier exhaustion stops allocation; wrap is forbidden;
- deletion/grace is explicit and measured. A 48-hour retained-key fixture may
  accept only the exact recorded retransmission, never a distinct message; and
- absence/depletion of a one-time prekey cannot silently fall back to a long-term
  recipient static key. Any fallback suite requires an explicit authenticated
  policy decision and a distinct wire identifier.

## Pre-registered prototype gates

1. **Deterministic CBOR:** fixture maps encode identically regardless of insertion
   order; every integer and length uses its shortest form; round trip is exact.
2. **Strict parser:** 100% of at least 40 named malformed/adversarial cases are
   rejected, including duplicate/equivalent keys, non-minimal integers,
   indefinite lengths, unknown/incorrect tags, unknown critical headers,
   duplicated protected/unprotected labels, trailing bytes, excessive nesting,
   excessive input, invalid claim types/ranges and malformed lengths.
3. **Credential shape:** the three tag variants and both standard/extended claims
   produce fixed hex and SHA-256 fingerprints, and a second run reproduces them
   exactly. No key or signature operation occurs.
4. **Byte accounting:** code-calculated values equal every frozen formula for all
   seven payload cohorts, all cell counts equal `ceil(bytes/9)`, and 2048/2049
   boundary cases pass/fail exactly.
5. **Provider evidence:** every candidate has a pinned URL/commit/licence and all
   ten gates populated. Missing evidence is `unknown`, never inferred `pass`.
6. **Vector provenance:** each selected upstream artifact records repository,
   commit, path, Git object ID, byte length and SHA-256; recomputation matches.
   Selected artifacts cover RFC 9180, Noise XX, COSE_Sign1 pass/fail and CWT.
7. **Prekey lifecycle:** all frozen success, retransmission, persistence-failure,
   corrupt-state, rollback, future/stale-clock, depletion, deletion and wrap cases
   pass; no distinct logical message can reuse a prekey in the model.
8. **No-crypto boundary:** repository search finds no key generation,
   encryption, decryption, signing, verification or third-party dependency in the
   prototype. Placeholder signature bytes are labelled and never accepted as a
   security result.
9. **Practicality:** at least 50,000 deterministic encode/decode/evidence/lifecycle
   operations complete in under 5 seconds on the recorded local Node runtime.
   This is a research-tool regression, not a phone performance claim.
10. **Reproduction:** two immediate test-and-benchmark runs agree on all counts,
    hex, hashes, sizes, gate states and decisions; only elapsed time may differ.

## Frozen decision rule

- **PROMOTE into product development** only the separation of carrier, logical
  frame, provider, credential and lifecycle interfaces; exact version/suite
  registry requirements; deterministic credential/cache contract; public-vector
  provenance; 64-bit Noise nonce requirement; and fail-closed lifecycle
  invariants, if their applicable pure gates pass.
- **REPEAT** any technically viable provider/protocol in a native iOS/Android
  harness when public vectors, same-wire interoperability, secure storage,
  crash/rollback, OS availability, binary-size and latency evidence remain
  missing.
- **HOLD** final algorithm/provider selection, product implementation, claims of
  confidentiality/authentication/forward secrecy, credential issuance,
  recovery, group MLS and post-quantum work until native evidence and specialist
  review exist.
- **STOP** copying BitChat's cryptographic implementation; 32-bit live Noise
  nonces; silent identity or static-key fallback; unbound fingerprints treated as
  authorisation; persistence errors reported as success; corrupt-state reset;
  prekey reuse by distinct messages; direct AGPL libsignal adoption; assuming
  Tink Objective-C supplies HPKE; or describing 48-hour key retention/deletion as
  full forward secrecy.

If any prototype gate fails, this cycle is `REPEAT` or `STOP`; it cannot be
rescoped after measurement to manufacture a promotion. No result from this
cycle permits enabling protocol v2, changing production cryptography, claiming
security, or starting a safety-critical pilot.
