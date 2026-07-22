# SEC-05 provider assessment

This is a source-and-evidence assessment, not a cryptographic certification.
`pass` means only that the named gate has direct evidence within its narrow
scope. `unknown` is a veto, not partial credit. No provider passed all ten
frozen gates and none is approved for direct product use.

## Candidate decisions

| Candidate | Pass / fail / unknown | Decision | Why and bounded next use |
|---|---:|---|---|
| CryptoKit iOS 17 + Tink Java HPKE Base | 3 / 0 / 7 | **REPEAT** | Best cross-provider first experiment. Both expose maintained mobile HPKE paths, but exact same-wire, cross-decrypt, vectors on both targets, lifecycle, mobile performance and composition review are unproved. Base mode provides recipient confidentiality, not sender authenticity. |
| Tink C++ with BoringSSL | 2 / 0 / 8 | **REPEAT** | A shared implementation could reduce cross-provider ambiguity and support pre-iOS-17, but the mobile FFI, packaging, binary size, lifecycle and review boundary are unproved. Current Tink support records HPKE for the BoringSSL build, not OpenSSL. |
| Swift Crypto shared HPKE | 2 / 0 / 8 | **REPEAT** | Strong RFC 9180 implementation/vector source. The normal Apple path re-exports CryptoKit; forced vendored builds and Android packaging need proof before this can be called a shared provider. |
| Snow Noise FFI | 3 / 1 / 6 | **HOLD** | Active, permissive and fuzzed Noise oracle, but its own record says it has not had a formal audit. Retain for differential/vector work; do not make it the mobile security boundary now. |
| noise-c | 1 / 1 / 8 | **HOLD** | Useful old reference/oracle, but not actively maintained enough for the product boundary and mobile integration remains unproved. |
| libsodium composition | 3 / 1 / 6 | **HOLD** | Strong maintained mobile primitive provider, but it is not the same named HPKE/Noise/credential composition. Building Loc8's own protocol from its primitives would recreate the custom-composition risk this study is intended to avoid. |
| BitChat custom Noise copy | 2 / 6 / 2 | **STOP** | Public-domain licensing makes the code legally reusable, not security-review evidence. Its live extracted 32-bit nonce mode is outside its public transport-vector path, and inspected identity/prekey persistence paths can fail open. Keep architecture, vectors and adverse lessons; do not copy the cryptographic implementation. |
| libsignal direct | 3 / 2 / 5 | **STOP** | Valuable PQXDH/ratchet architecture reference, but AGPL-3.0 and the project's unsupported external client API are incompatible with direct bounded adoption. Learn and independently specify only. |
| OpenMLS groups | 4 / 2 / 4 | **HOLD** | Maintained MIT group-security reference with recent audit activity, but separate from pairwise carrier crypto and its mobile support/evidence does not clear the current gate. Revisit only after pairwise identity, delivery and recovery exist. |
| go-cose oracle | 3 / 2 / 5 | **HOLD** | Fuzzed, independently reviewed Go COSE oracle with useful pass/fail evidence. MPL file/dependency boundary needs explicit treatment and it is not a mobile provider. Use as differential/reference evidence, not product code. |

The compact pass/fail/unknown counts above correspond to the ten gate names in
the prototype's `EVIDENCE_GATES` registry. The full status of every gate is
executable in `providerMeasurements()` and frozen by the test suite.

## Source-level findings that changed the decision

### Noise and BitChat

- Noise revision 34 supplies handshake/cipher-state rules and a 64-bit nonce
  space. It does not supply Loc8 credentials, application replay state,
  downgrade policy, storage transactions or recovery.
- BitChat's public vector runner uses the non-extracted transport mode, while
  established live sessions use an extracted 4-byte nonce mode. Therefore a
  public vector pass does not cover the live frame variant Loc8 would copy.
- A Noise static-key fingerprint proves only possession/linkage under the
  protocol. It does not establish site, employer, role, shift, revocation or
  authorisation.
- The inspected BitChat prekey code contains valuable ideas—signed bundles,
  targeted Noise X, depletion and grace—but persistence failure can be logged
  without failing the operation, corrupt state can reset, ID allocation wraps,
  and retained consumed keys need exact-message deduplication. The Loc8 model
  turns these into fail-closed invariants instead of copying the code.

### HPKE and Tink

- RFC 9180 X25519 HPKE contributes 32 bytes of encapsulated key and a 16-byte
  tag for the measured suite. It is unidirectional and does not itself provide
  replay control, sender authorisation, downgrade prevention, recovery or
  recipient-compromise forward secrecy.
- Tink's high-level Hybrid interface promises privacy, not sender authenticity.
  Its optional five-byte TINK prefix is an unauthenticated key-selection hint;
  the first repeat therefore uses RAW output.
- Current Tink support evidence covers HPKE in Java and C++/BoringSSL, not
  Objective-C or C++/OpenSSL. The inspected Java high-level path uses HPKE Base
  and maps `contextInfo` into HPKE `info` with empty AAD.
- The Android-keystore Auth helper found in Tink source is a separate P-256 /
  AES-GCM helper and is not evidence that the high-level X25519 Hybrid primitive
  provides HPKE Auth interoperability.

### Swift Crypto and Apple

- Swift Crypto includes HPKE source and public RFC vectors, but its ordinary
  Apple build selects CryptoKit. This is not evidence that one vendored binary
  supplies the same implementation on iOS and Android.
- The locally installed iPhoneOS 18.2 SDK interface records CryptoKit HPKE from
  iOS 17. This constrains the first native cohort and makes a shared-provider
  fallback a separate packaging question.

### Credentials and COSE

- CWT registered claim types matter: `iss`, `sub` and `aud` are text; `cti` is
  bytes; `cnf` is claim 8; scope is claim 9; numeric private-use claims are below
  `-65536`. The fixtures were corrected to those registry semantics before
  implementation.
- COSE_Sign1 and deterministic CBOR are candidate wire contracts, not proof of
  issuer policy or signature safety. Product development needs a reviewed
  mobile parser/provider, issuer/revocation design and specialist review.
- The retained go-cose audits are scoped to 2022 commits/dependencies. They are
  valuable historical evidence but cannot be projected onto current Loc8 or a
  different mobile parser.

## Audit interpretation

The gate field currently named `eligibleForNativeRepeat` is the programmatic
all-ten-gates threshold from the frozen preregistration. It is `false` for every
candidate. The frozen decision rule separately permits a tightly scoped native
**REPEAT** to generate missing evidence; that is not an automatic eligibility
or product-selection result.

The next experiment must keep that distinction explicit:

- **candidate chosen for measurement** does not mean provider selected;
- **cross-decryption works** does not prove application security;
- **official vectors pass** does not prove key storage/recovery;
- **secure storage works in a happy path** does not prove process-kill or
  rollback safety; and
- **specialist review planned** does not mean specialist review passed.
