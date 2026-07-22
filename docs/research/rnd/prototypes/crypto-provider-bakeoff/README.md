# SEC-05 crypto-provider bake-off prototype

This dependency-free Node.js research prototype tests the pure contracts frozen
in the SEC-05 preregistration. It does not implement cryptography and changes no
Loc8 application, native module, key store or wire behaviour.

## What it tests

- a deliberately small strict encoder/decoder for the deterministic CBOR subset
  used by the fixture;
- standard and application-extended CWT claim shapes inside a COSE_Sign1 byte
  shape with a clearly labelled 64-byte zero placeholder instead of a signature;
- exact Noise/HPKE/logical-frame overhead and 25-byte-cell fragmentation costs;
- a veto-based provider evidence gate in which `unknown` never becomes `pass`;
- an immutable prekey lifecycle model with injected durable-write failure,
  exact-retransmission binding, clock bounds, rollback detection, deletion,
  depletion and UInt32 exhaustion; and
- Git-object and SHA-256 provenance for selected retained public vectors.

The CBOR code is an R&D parser and size oracle, not a product COSE/CWT library.
It intentionally rejects floats, indefinite lengths, unknown claims and every
value outside the frozen Loc8 fixture contract. Product development must adopt
a reviewed provider/parser after native interoperability and specialist review.

## Run

From the canonical repository root:

```sh
node --test docs/research/rnd/prototypes/crypto-provider-bakeoff/crypto-provider-bakeoff.test.mjs
node docs/research/rnd/prototypes/crypto-provider-bakeoff/benchmark.mjs
node docs/research/rnd/prototypes/crypto-provider-bakeoff/vector-provenance.mjs
```

The tests read retained repositories only to verify pinned vector provenance.
Tree-only clones are expected and must not be checked out merely to run this
prototype; Git reads their blobs directly.

## Interpretation boundary

A green run proves only deterministic encoding, parser rejection, byte formulas,
evidence-gate behaviour and the pure lifecycle state machine on the recorded
Node runtime. It does not prove:

- a valid signature, ciphertext, key agreement or authenticated channel;
- iOS/Android provider availability or interoperation;
- secure-enclave/keychain/Android Keystore crash safety;
- confidentiality, sender authentication, forward secrecy or
  post-compromise security;
- radio delivery, background execution, phone performance or pilot readiness;
  or
- that any candidate has passed the ten-gate product threshold.

The durable measurements, source matrix and decisions belong in the matching
`results/SEC-05/2026-07-22-crypto-provider-bakeoff/` directory rather than in
this prototype README.
