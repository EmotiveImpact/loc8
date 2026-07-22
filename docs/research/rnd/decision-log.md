# R&D decision log

Record research decisions here in date order. Do not rewrite old decisions when
evidence changes; add a superseding entry with links to both evidence sets.

## Decision template

```text
Decision ID:
Date:
Question IDs:
Decision: PROMOTE / REPEAT / HOLD / STOP / BLOCKED
What was decided:
Evidence/result links:
Constraints and cohorts:
Product/specification/claim changes:
Owner and next action:
Review trigger/date:
Supersedes/superseded by:
```

## Initial portfolio decisions — 2026-07-22

### RDD-001 — repository discovery is no longer the primary activity

- **Questions:** `OSS-01` through `OSS-08`, `X-04`
- **Decision:** HOLD broad discovery; continue a capped quarterly watch.
- **Reason:** 36 active/historical repositories now cover the major candidate
  approaches. Physical and product evidence has higher decision value than more
  cloning.
- **Next:** work `MESH-01`, `CONN-01`, `FLOOR-01`.

### RDD-002 — retain clones as research source, adopt code narrowly

- **Questions:** `OSS-01` through `OSS-08`
- **Decision:** PROMOTE bounded permissive/public-domain adoption spikes; STOP
  indiscriminate bulk merges.
- **Reason:** the collection mixes public domain, MIT, Apache, BSD, MPL, GPL,
  AGPL, custom, conflicting, unlicensed and non-commercial material. Architectural
  and cryptographic suitability also vary independently of licence.
- **Next:** file-level provenance for every component promoted into product.

### RDD-003 — current BitChat v2 is the primary protocol-v2 reference

- **Questions:** `SEC-01` through `SEC-10`, `OSS-01`
- **Decision:** PROMOTE component-level public-domain BitChat iOS/v2 research.
- **Constraints:** measure current Loc8 physical baseline first; do not copy GPL
  BitChat Android; do not bundle identity, crypto, routing and couriers into one
  unmeasurable rewrite.
- **Next:** threat model/identity followed by independent component bake-offs.

### RDD-004 — floor detection uses anchor + assist + topology

- **Questions:** `FLOOR-01` through `FLOOR-10`
- **Decision:** PROMOTE this as the research architecture; current manual anchor
  remains authoritative until field data passes.
- **Reason:** independent research and implementations consistently show that
  barometer, radio and motion signals complement one another and all require
  calibration/context.
- **Next:** build corpus/logger, baseline current threshold, then test HMM/Viterbi.

### RDD-005 — start building mapping with semantics, not universal SLAM

- **Questions:** `MAP-01` through `MAP-05`
- **Decision:** PROMOTE manual/imported-plan semantic graph and guided commissioning
  baseline. HOLD advanced automatic reconstruction until this baseline works.
- **Next:** model one real multi-floor building and repeat with a second installer.

### RDD-006 — fixed hardware remains gated

- **Questions:** `HW-01` through `HW-10`, `RADIO-01`
- **Decision:** HOLD full Gateway/anchor product build and custom carrier work.
- **Allowed:** interface design, small pressure-sensor/logger prototype and a
  controlled radio bench trial when mesh/customer evidence justifies it.
- **Reason:** Gateway and Loc8OS are extensively specified but zero hardware is
  proven; physical phone and commercial evidence retire more risk first.

### RDD-007 — run connected product and resilience research in parallel

- **Questions:** `CONN-01` through `CONN-09`, `MESH-01` through `MESH-05`
- **Decision:** PROMOTE connected pilot hardening as an independent P0 lane.
- **Constraint:** current `ws://` bridge, static/demo identity and browser-local
  audit do not constitute a production deployment.
- **Next:** threat model and minimum pilot boundary while physical mesh tests run.

### RDD-008 — the product thesis is a coverage-aware operational digital twin

- **Questions:** `X-03`, `MAP-*`, `FLOOR-*`, `RADIO-06`, `OPS-*`
- **Decision:** PROMOTE as the unifying research thesis, not yet an external
  performance claim.
- **Proof required:** one commissioned building, calibrated floor/zone confidence,
  live coverage graph and an operational exercise showing reduced uncertainty or
  time.

### RDD-009 — promote secure-relay controls, not the research identity system

- **Questions:** `CONN-01`, `CONN-02`, `CONN-09`, `SEC-03`, `SEC-06`
- **Decision:** PROMOTE bounded connection-authentication, site/role isolation,
  origin/TLS enforcement, replay/rate/state/parser/receiver-queue bounds, audit
  anchoring interfaces and adversarial tests into product engineering. REPEAT
  CONN-01 at integration level.
- **Evidence:** 14/14 adversarial tests; zero leakage for 1,000 cross-site frames;
  10,000/10,000 benchmark frames delivered; authentication p95 0.0043 ms and
  local loopback relay p95 0.0615 ms on Node 22.22.3.
- **Do not promote:** prototype HMAC issuer/secret, in-memory audit/replay state,
  plaintext test mode or any payload-security claim.
- **Stop:** query-string credentials, arbitrary query-selected production bridge
  endpoints, unredacted bearer-capability headers and operational exposure of the
  dumb broadcast relay.
- **Next:** complete the units in the linked
  [`promotion brief`](results/CONN-01/2026-07-22-secure-relay-prototype/promotion-brief.md),
  then obtain independent security review.

### RDD-010 — exclude research clones from the product toolchain

- **Questions:** `OSS-01` through `OSS-08`, `X-05`
- **Decision:** PROMOTE explicit Jest and TypeScript exclusions for the ignored
  `docs/research/rnd/repos/` source library.
- **Evidence:** without exclusions Jest discovered 719 suites and TypeScript
  compiled upstream Vue/Electron/Nest/Vitest files; with exclusions Jest found
  exactly 27 Loc8 test files, 274/274 tests passed, and all three Loc8 TypeScript
  checks passed.
- **Reason:** Git-ignore affects version control, not test discovery, module maps,
  compiler includes, IDE indexing or security scanners.
- **Next:** any future broad tool (lint, search index, packaging, licence/security
  scan) must consciously include or exclude the research library according to its
  purpose.

### RDD-011 — hold automatic dependency remediation; require an Expo-compatible fix

- **Questions:** `CONN-01`, `SEC-06`, product supply-chain gate
- **Decision:** HOLD production promotion on dependency hygiene. Do not run the
  offered force fix or downgrade Expo; assign targeted, SDK-57-compatible
  remediation and validation to product development.
- **Evidence:** live `npm audit --omit=dev` reported 12 advisories (1 high, 11
  moderate, 0 critical). The high path is `brace-expansion` 1.1.15 under Jest
  coverage tooling; `uuid` 7.0.3 is reached through Expo/Xcode configuration.
  The audit offered Expo 46.0.21 as part of a semver-major fix even though this
  repository mandates Expo 57.
- **Scope:** neither `ws` installation was reported by this audit. Passing relay
  tests do not make the wider workspace dependency-clean.
- **Next:** find compatible targeted upgrades/overrides, run Expo diagnostics,
  mobile/native builds and the full test/typecheck suite, then close or formally
  accept each residual advisory before an operational pilot.
