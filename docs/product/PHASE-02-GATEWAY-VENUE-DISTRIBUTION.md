# Phase 2 preregistration — Gateway venue-package distribution

**Frozen before implementation:** 2026-07-22

**Decision:** whether Loc8 can promote a fail-closed production distribution
contract and an honest offline simulation adapter without pretending a signing
provider, durable Gateway or deployed service exists

**Evidence class:** deterministic TypeScript, dependency-injected fake providers,
browser-local simulated Gateway and synthetic venue; no cryptographic, hardware,
network, durability, power-loss, deployment or field evidence

## Product boundary

The production path accepts only a validated `published` venue package inside a
strict distribution envelope. It must verify the content digest and external
signature through injected provider ports before an atomic store append. Loc8
will not implement custom cryptography, choose an algorithm/provider in this
increment or reuse the research HMAC issuer.

The runnable Command path is a separate `simulation-only` adapter. It may copy a
validated `local-demo` package into browser localStorage to exercise offline
installation and reconciliation, but it must not set `state: published`,
`signed: true`, Gateway authority or production receipt language.

## Acceptance gates

### A. Production distribution contract

1. Strict TypeScript defines the distribution envelope, external verification
   ports, atomic package store, install receipt and reconciliation result.
2. Envelope validation is exact and rejects unknown fields, malformed IDs/times,
   invalid base64, mismatched building/package/map/digest fields and expired or
   future-issued envelopes.
3. Installation accepts only a `published`, reviewed package with non-browser
   authority, declared signature evidence and matching `contentSha256`.
4. The digest payload is canonical and excludes only the self-referential digest
   value; both digest and signature verification fail closed through injected
   providers.
5. A package is visible only after an atomic append succeeds. Store failure,
   verifier error, digest mismatch or signature rejection leaves the previous
   current version unchanged.
6. Initial bootstrap is explicit. Later updates require
   `parentMapVersion === current.mapVersion`; rollback, forks, duplicates with
   different content and cross-building/site installation are rejected.
7. Reconciliation returns typed `in-sync`, `update-available`, `client-ahead`,
   `not-installed` or `identity-conflict` outcomes without comparing labels.

### B. Simulation-only offline adapter

1. A separately named/schema-versioned snapshot accepts only `local-demo`
   packages and contains `evidenceClass: simulation-only`.
2. Snapshot creation deep-clones/freezes the venue, records Gateway simulator ID,
   install time and byte count, and produces no signature/provider claim.
3. Snapshot serialisation/reload and client reconciliation work with the network
   absent; corrupt/invalid snapshots fail closed.
4. Command Commissioning has a functional `Gateway simulation` view showing
   phone/Command/Gateway data ownership, install state, map version, package size,
   Guard/Command projection counts and explicit production blockers.
5. The operator must first create a local demo, then explicitly install it on the
   simulated Gateway. Reset/removal works and no control says deploy/publish.

### C. Evidence and integration

1. At least 20 named invalid/adversarial distribution cases plus lineage,
   atomicity, reconciliation, immutability and simulation reload tests pass.
2. Existing 326 product tests and Phase 1 browser workflow remain green.
3. Root/engine/Guard/Command TypeScript, lint, Command production build, Expo
   Doctor and dependency audit pass.
4. Real-browser install, offline snapshot reload, reconciliation, reset and
   responsive/console checks pass; any new P0/P1/P2 visual finding is fixed.
5. Result, owner page, Claude handoff and decision log record exact evidence and
   a PROMOTE/REPEAT/HOLD/STOP decision before local-main fast-forward.

## Automatic hold/failure conditions

- Any simulation state uses `published`, `signed`, Gateway authority, deploy or
  cryptographic-verification wording.
- A production install succeeds without both digest and signature provider
  approval, or a failed append changes current state.
- A rollback/fork is inferred from mutable names or numeric floor bytes.
- localStorage is described as durable Gateway storage or a site source of truth.
- Test fixtures, deterministic digests or fake providers are presented as
  cryptographic or hardware evidence.

## Promotion rule

PROMOTE the provider/store/lineage/reconciliation contracts and simulation tool
only if all local gates pass. REPEAT with a reviewed native security provider,
SQLite/WAL store, Gateway process and power-loss/concurrency drills. HOLD signed
site publication, physical Gateway and operational distribution until those
repeats pass. STOP fake signing, localStorage authority and fail-open versioning.
