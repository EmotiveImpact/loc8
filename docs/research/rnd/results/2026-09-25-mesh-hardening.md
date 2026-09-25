# R0 implementation receipt: shared BLE hardening

**Date:** 25 September 2026  
**Base commit:** `f6b09a492c362f1c73b775d67721da1cc345fe91`  
**Decision:** implemented on a review branch; not a production or physical-radio promotion.

## Changed behaviour

- `packages/engine/src/core/fragmentValidation.ts`: shared byte/count/sequence/ID bounds for wire and direct fragment input.
- `packages/engine/src/core/packetCodec.ts`: reject malformed inbound fields; no valid legacy encoding change.
- `packages/engine/src/core/textFragments.ts`: type/sender/target/message isolation, copied bytes, aggregate limits, first-receipt expiry, bounded capacity and strict complete UTF-8 validation.
- `packages/engine/src/transport/BleMeshTransport.ts`: generation-safe callbacks/restarts, correct application-listener clearing and visible broadcast errors.
- `tools/mesh-rnd/verify.node.cjs`: repeatable scoped regression tests with real TypeScript source and explicitly mocked native/debug boundaries.
- `tools/mesh-rnd/wire-v1-golden.json`: 14 byte-for-byte legacy encoding fixtures generated from the pinned original codec.
- Programme and README: durable R&D entry point and implementation-versus-historical-documentation correction.

No changes to Swift/Kotlin, radio schedules, TTL, security protocols, UI screens,
package versions, main branch or deployment. The new reassembly timeout is
configurable and remains a software policy pending native latency evidence.

## Verification performed

Environment: Node **22.16.0**, locally available TypeScript **5.8.3**. The repo
requests TypeScript **~6.0.3**; that exact dependency toolchain was not installed
in this environment. Five fetched source blobs were checked against Git blob
SHA-1s before modification. The repository was inspected through the GitHub
connector and a source subset reconstructed locally, not cloned in full.

**80 of 80 scoped tests passed.** Included within that suite:

- strict semantic TypeScript checking of the changed pure core and actual local dependencies;
- the three runtime modules, with native BLE and Zustand debug boundary mocked only for transport tests;
- valid packet types, signed floors, consumer and operational reply codes;
- malformed frame lengths, geography, heading, battery and fragment metadata;
- fragment limits, destination/type isolation, ownership, expiry, clock regression and invalid UTF-8;
- stale asynchronous start failure, listener replacement, stale callback rejection and broadcast errors;
- **25,000 deterministic seeded wire mutations**, an application-ingress corpus, not native radio fuzzing;
- **14 golden encoder fixtures** matching the baseline bytes.

Against the pinned original sources, the same newly introduced suite passes
42 checks and fails 38. Those are unmet regression/security requirements and
new API expectations, **not 38 distinct discovered vulnerabilities**. This
before/after comparison does not represent the repository's existing test suite.

## Reproduce in a complete checkout

```sh
npm ci
node --test tools/mesh-rnd/verify.node.cjs
npm test -- --runInBand
npm run lint
```

The first command sequence uses the repository's own TypeScript dependency.
The scoped runner does not install dependencies or contact the network.
`LOC8_SOURCE_ROOT` may point to a separate baseline checkout to repeat the
before/after comparison while keeping the new runner and golden fixtures.

## Not performed

The existing full Jest/Expo suite, whole-monorepo TypeScript checking, lint,
Consumer/Guard/Command builds, native iOS/Android builds, physical phone tests,
Gateway firmware fuzzing and independent security review were **not run** here.
No GitHub Actions result is claimed. Passing this receipt is insufficient to
merge without the complete checkout checks and review.

Known boundaries: input validation is not authentication; the native relay can
see a frame before the JavaScript validation boundary; complete-message replay
policy and same-count rolling-ID ambiguity are not redesigned; lazy expiry does
not create a persistent courier queue; send attempts are not delivery receipts.

## Review and rollback

Review the four runtime files together. The wire format and public method
signatures remain compatible; `TextReassembler` only adds optional constructor
arguments and cleanup hooks. Invalid inbound packets intentionally become
rejections. Revert the implementation commit as a unit to restore the old shared
engine behaviour. Do not cherry-pick a re-export without its validation module.

Next: full-toolchain verification, then inspect and implement a shared
observation-freshness contract across the three apps. Physical work continues
under the existing `MESH-01 E01` and `MESH-02/MESH-03 E02` gates.
