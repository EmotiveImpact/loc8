# SEC-05 E07 native HPKE interoperability repeat

## Purpose

Generate the missing native evidence for the leading *confidentiality-only*
candidate without putting cryptography into the product. The first cohort is
CryptoKit on iOS 17+ and Tink Java on Android API 24+. Tink C++/BoringSSL is a
separate fallback cohort; it must not be mixed into the first result after data
collection starts.

This plan authorises an isolated test harness only. It does not authorise a
production provider, sender-authentication claim, protocol-v2 enablement or
deployment.

## Pre-freeze items

Before writing native code, freeze and commit:

1. exact package/release pins and checksums;
2. supported Xcode/Swift/iOS and Gradle/JDK/Kotlin/Android versions;
3. the HPKE suite registry entry:
   `DHKEM(X25519, HKDF-SHA256) / HKDF-SHA256 / AES-256-GCM`;
4. RAW output encoding `enc(32) || ciphertext || tag(16)`;
5. an exact byte string for the domain separator;
6. `info = domain-separator || logical-header-32`, with empty AAD for the
   Tink high-level Base-mode comparison;
7. payload cohorts `0, 1, 16, 64, 128, 512, 1024` bytes;
8. replay/dedup, credential and policy checks outside the provider; and
9. acceptance thresholds and STOP conditions below.

The use of the logical header in `info` is a testable Base-mode composition for
the cross-provider high-level API. It is not a final security design. A
specialist must review whether the final provider boundary should instead use a
lower-level context with AAD, and must review metadata visibility and binding.

## Harness structure

Build two isolated command-line/native test targets, not app screens:

- iOS: CryptoKit HPKE adapter with raw X25519 public/private key import,
  deterministic fixture decoder, encrypt/decrypt, error classification and
  Keychain lifecycle adapter;
- Android: Tink Java HPKE Hybrid adapter with RAW keyset/output, equivalent
  fixture decoder, encrypt/decrypt, error classification and Keystore-backed
  lifecycle adapter; and
- a dependency-free fixture coordinator that never receives production keys and
  records only synthetic vectors, timings and failure classes.

The provider interface must expose `suiteId`, `keyId`, `seal`, `open`,
`deleteKey` and typed fail-closed errors. It must not expose primitive-level
building blocks that invite a second custom protocol.

## Required evidence

### Wire and vector evidence

- Execute the applicable RFC 9180 vectors on each provider path; document any
  provider API that prevents deterministic vector injection rather than
  silently substituting a round trip.
- Generate on iOS and decrypt on Android for every cohort; generate on Android
  and decrypt on iOS for every cohort.
- Assert exact 48-byte overhead and raw `enc || ciphertext || tag` parsing.
- Repeat across three independently generated recipient key pairs and at least
  1,000 messages per direction.
- Record exact OS/device/build/provider pins and a non-secret fixture hash.

### Negative/adversarial evidence

Every provider must reject, without plaintext release:

- every single-byte mutation in `enc`, ciphertext and tag samples;
- truncation at every boundary and trailing/oversized frames;
- wrong recipient key;
- changed version, suite, credential handle, recipient handle, message ID or
  policy epoch in the bound logical header;
- unknown suite/version/flags before provider invocation;
- duplicate message ID under the same recipient/policy replay domain; and
- malformed key material, deleted keys and unavailable secure storage.

Provider exceptions must become stable typed errors without logging key,
plaintext, full ciphertext, bearer capability or sensitive metadata.

### Lifecycle and crash evidence

- Generate/import, persist, open, rotate and delete test keys using the platform
  security boundary.
- Kill the process before, during and after every persistence/rotation step;
  reboot at least once per platform; verify that success is never returned
  before durable state exists.
- Simulate backup restore/rollback and corrupt metadata. Fail into explicit
  recovery; never silently create a replacement identity.
- Verify prekey assignment/consumption plus replay record as one durable
  transaction in the harness store.
- Verify depletion is a typed failure with no static-key fallback.
- Demonstrate that deleted test keys cannot decrypt after the declared grace
  policy, while an exact retransmission during grace is the only accepted reuse.

### Mobile engineering evidence

For at least one representative supported iPhone and Android phone, record:

- minimum OS/API build success;
- debug and release binary-size delta;
- cold/warm seal/open p50, p95 and p99 for every payload cohort;
- 10,000-operation error/leak count and peak memory;
- 15-minute thermal/battery observation under a frozen workload; and
- background/process-kill recovery behaviour.

These are cohort measurements, not fleet capacity or battery-life claims.

## Acceptance and decision rule

The CryptoKit/Tink Java cohort can advance to specialist composition review only
if all of the following are true:

- 100% cross-decrypt in both directions for all valid fixtures;
- 100% public-vector cases supported by the provider path pass, with unsupported
  deterministic injection explicitly scoped;
- 100% named tamper/truncation/wrong-context cases reject before plaintext;
- zero replay duplicates accepted;
- zero persistence/crash cases report success without durable matching state;
- no identity reset or static-key fallback occurs;
- exact overhead/encoding agrees on both platforms;
- minimum-OS and release-build evidence is captured;
- no unresolved high/critical dependency or harness finding exists; and
- an independent cryptography specialist accepts the review scope before any
  product integration.

Decision after measurement:

- **PROMOTE** only a reviewed provider adapter and exact suite/wire contract if
  every gate, specialist review and product threat-model update passes.
- **REPEAT** for a correctable API/build/test limitation without changing the
  frozen suite or weakening a safety gate.
- **HOLD** if secure storage, lifecycle, review or supported-device evidence is
  unavailable.
- **STOP** the cross-provider composition on any same-suite wire mismatch,
  plaintext release after a named negative case, fail-open key lifecycle,
  provider ambiguity that requires custom cryptographic glue, or unacceptable
  unresolved specialist finding.

Only after this cohort is decided may the team preregister the Tink
C++/BoringSSL shared-provider fallback or a Noise connected-session cohort.
