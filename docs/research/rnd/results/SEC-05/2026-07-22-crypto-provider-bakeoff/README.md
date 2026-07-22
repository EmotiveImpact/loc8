# Result: crypto-provider, credential and prekey contract bake-off

**Question:** `SEC-05`, with bounded evidence for `SEC-03`, `SEC-06`, `SEC-08`
and `SEC-10`

**Evidence date:** 2026-07-22

**Pre-registration:** commit `5ac8e76`

**Evidence class:** source audit plus deterministic, dependency-free,
non-cryptographic contract/lifecycle experiment

## Decision

### PROMOTE into bounded product specification/development

Promote only:

- separation of carrier, logical frame, crypto provider, credential/policy and
  key lifecycle;
- an exact version/message-kind/suite/flags registry and strict 32-byte logical
  header;
- deterministic credential/cache-handle and public-vector provenance contracts;
- full 64-bit explicit Noise nonces if an out-of-order Noise transport is later
  selected;
- atomic, fail-closed prekey assignment/consumption/replay/deletion invariants;
  and
- veto-based evidence gates where missing evidence remains `unknown`.

All ten pure gates passed. This promotion does not select a provider or put any
cryptographic implementation into Loc8.

### REPEAT

1. CryptoKit iOS 17+ and Tink Java Android API 24+ using HPKE Base, RAW output
   and an exact common suite/wire contract in the isolated
   [native E07 plan](native-repeat-plan.md).
2. Tink C++/BoringSSL as a deliberately separate shared-provider/FFI packaging
   fallback if the first cohort fails or the iOS 17 floor is unacceptable.
3. A reviewed native COSE/CWT parser/signature provider with public pass/fail
   vectors, fuzzing and issuer/revocation lifecycle evidence.

### HOLD

- final algorithm/provider selection and all product cryptography;
- confidentiality, sender-authentication, forward-secrecy, post-compromise,
  recovery or audit-security claims;
- issuer trust, credential recovery/revocation and private-claim governance;
- Noise production integration, MLS group security, ratchets and post-quantum
  composition; and
- any pilot use until native evidence and specialist review exist.

### STOP

- copying BitChat's custom cryptographic implementation despite its permissive
  public-domain licence;
- 32-bit live Noise nonce framing;
- silent ephemeral identity or recipient-static-key fallback;
- treating a static fingerprint as venue/role authorisation;
- persistence failure reported as success, corrupt-state reset, identifier wrap
  or distinct-message prekey reuse;
- direct AGPL libsignal adoption;
- assuming Tink Objective-C supplies HPKE; and
- describing 48-hour consumed-key retention/deletion as end-to-end forward
  secrecy.

## Finding

Loc8's defensible security advantage is not a new cipher. It is a small,
versioned and testable envelope that keeps five responsibilities independently
replaceable and auditable:

```text
carrier cells -> strict logical frame -> reviewed provider
                         |                    |
                         v                    v
                  credential/policy    atomic key lifecycle
```

That structure lets the same semantic message move over BLE, Wi-Fi or later LoRa
without letting a carrier define identity or cryptography. It also allows a
provider to be stopped after a failed review without replacing the application
message, credential or delivery model.

The byte result creates a concrete architectural edge: send/cache a standard
credential once and use its eight-byte handle in ordinary frames. The frozen
stand-alone CWT+COSE fixture is 174 bytes (20 current carrier cells), or 208
bytes (24 cells) with the experimental private claims. Repeating that credential
inside every message would be wasteful. A 64-byte HPKE Base message with the
32-byte header is 144 bytes/16 cells; a Noise X prekey message is 196 bytes/22
cells; an established Noise session is 112 bytes/13 cells with an implicit nonce
or 120 bytes/14 cells with a full explicit nonce. Credential caching therefore
improves constrained delivery while preserving a standards-shaped authority
object. It remains a candidate design until native and specialist gates pass.

## What was investigated

### Primary standards

- Noise Protocol Framework revision 34;
- RFC 9180 HPKE;
- RFC 8949 deterministic CBOR;
- RFC 9052 COSE;
- RFC 8392 CWT and RFC 8747 proof-of-possession;
- the live IANA CWT registry dated 2026-07-20; and
- RFC 9420 MLS as a later group-security comparison.

### Source, vectors and audit evidence

Pinned source was read from BitChat, noise-c, Snow, Swift Crypto, libsodium,
Tink Java/C++/Objective-C, libsignal, OpenMLS, COSE Examples and go-cose. No
upstream source was copied into Loc8. Exact URLs, commits, licences, paths, Git
objects, byte lengths and hashes are in the
[evidence manifest](evidence-manifest.json). The detailed conclusions and their
limits are in the [provider assessment](provider-assessment.md).

The study also inspected the installed iPhoneOS 18.2 CryptoKit interface. Its
hash and exact path are recorded in the manifest; it marks HPKE availability
from iOS 17. Local SDK availability is not device interoperability evidence.

## What was built

Prototype directory:
[`../../../prototypes/crypto-provider-bakeoff/`](../../../prototypes/crypto-provider-bakeoff/README.md)

- deliberately small strict deterministic-CBOR subset;
- exact standard and extended CWT/COSE_Sign1 **size fixtures** with a labelled
  zero signature placeholder;
- strict logical-header encoder/decoder;
- executable Noise/HPKE/Tink overhead and nine-byte-cell formulas;
- veto-based ten-gate provider evaluator;
- immutable prekey lifecycle model with injected persistence, rollback, clock,
  corruption, depletion, replay and ID-exhaustion failures;
- retained-Git-object provenance verifier; and
- deterministic 50,000-operation benchmark.

There is no key generation, signing, verification, encryption or decryption.
SHA-256 is used only for evidence/fixture fingerprints.

## Measurements

Full machine-readable results, including all six exact fixture hex values, are
in [`measurements.json`](measurements.json).

| Measure | Result |
|---|---:|
| Tests | 88/88 passed in each of two commands |
| Named parser adversaries | 67/67 rejected |
| Credential variants reproduced | 6/6 exact hex and SHA-256 |
| Provider candidates | 10 |
| Providers clearing all ten gates | 0 |
| Direct provider adoptions | 0 |
| Provider decisions | 3 REPEAT / 5 HOLD / 2 STOP |
| Benchmark | 50,000 operations per run |
| Durations | 487.096 ms / 485.770 ms |
| Deterministic benchmark SHA-256 | `5577191263e060fca6f07302aa375fe7f59809520af245a2926fc12a67a1f807` |
| Frame boundary | 2,048 bytes = 228 cells accepted; 2,049 rejected |

Both test commands returned 88/88. Both benchmark commands agreed on every
count, decision, checksum and fingerprint; only elapsed time differed. The
benchmark is a local research-tool regression, not phone performance.

## Gate audit

| Gate | Evidence | Result |
|---|---|---|
| G1 deterministic CBOR | insertion-order independence, shortest forms, exact round trip | PASS |
| G2 strict parser | 67 named malformed/adversarial cases, zero accepts | PASS |
| G3 credential shapes | six fixed hex/size/hash outputs reproduced | PASS |
| G4 byte accounting | all shapes × seven payloads × header/no-header; exact boundaries | PASS |
| G5 provider evidence | ten candidates × ten populated pass/fail/unknown gates | PASS |
| G6 vector provenance | RFC 9180, Noise, COSE pass/fail and CWT Git blobs rehashed | PASS |
| G7 prekey lifecycle | transaction, retransmit, corruption, time, rollback, depletion, deletion, wrap | PASS |
| G8 no-crypto boundary | built-ins only; no crypto operation API; labelled placeholder | PASS |
| G9 practicality | both 50,000-operation runs under 5,000 ms | PASS |
| G10 reproduction | two test and two benchmark commands agree deterministically | PASS |

The provider evaluator field `eligibleForNativeRepeat` represents the frozen
all-ten-gates threshold and is false for every candidate. A Principal decision
to run the isolated E07 experiment is a controlled way to produce missing
evidence; it is not an automatic provider qualification.

## Limitations

- No cryptographic operation occurred, so there is no confidentiality,
  integrity, authentication or forward-secrecy result.
- No iPhone, Android phone, Keychain, Keystore, process kill, reboot, network,
  background task, radio or battery was tested.
- Strict fixture parsing does not make this prototype a reviewed COSE/CWT
  implementation.
- The placeholder COSE signature cannot verify and must never leave research.
- A lifecycle state-machine test does not prove that a platform database or
  secure hardware implements the transaction.
- An upstream audit applies only to its recorded commit/dependencies/scope, not
  automatically to a later version or Loc8 composition.
- Licences were recorded, but permissiveness is not cryptographic suitability.

## Reproduce

From the canonical R&D worktree:

```sh
node --test docs/research/rnd/prototypes/crypto-provider-bakeoff/crypto-provider-bakeoff.test.mjs
node docs/research/rnd/prototypes/crypto-provider-bakeoff/benchmark.mjs
node docs/research/rnd/prototypes/crypto-provider-bakeoff/vector-provenance.mjs
```

The provenance verifier reads blobs from the retained tree-only research clones
without checking them out.

## Next action

Freeze E07's exact provider releases, domain-separator bytes, native toolchains
and acceptance thresholds, then implement the isolated two-platform harness.
Until devices and specialist review are available, SEC-05 remains a scoped
contract promotion plus native **REPEAT**, not a completed product-security
decision. The Principal R&D queue now prepares `MESH-01` so its physical
three-phone relay experiment can run without further protocol ambiguity.
