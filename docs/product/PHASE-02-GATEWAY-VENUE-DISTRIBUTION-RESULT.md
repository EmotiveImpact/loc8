# Phase 2 result — Gateway venue-package distribution

**Measured:** 2026-07-22

**Decision:** **PROMOTE** the fail-closed distribution contract, version-lineage
rules, reconciliation vocabulary and explicitly simulation-only Command tool
into product development. **REPEAT** with a reviewed cryptographic provider,
durable on-Gateway store/process and target hardware. **HOLD** signed site
publication, radio transfer, durable Gateway and operational claims. **STOP**
fake signing, localStorage authority and fail-open version handling.

## What now works

- The shared engine has a strict `loc8.venue-distribution.v1` envelope for
  reviewed, published venue packages.
- Production installation depends on injected digest, signature, trusted-clock
  and atomic-store ports. Provider errors, rejection, expiry, malformed input,
  store failure, version forks and same-version content conflicts fail closed.
- Exact repeats are idempotent; later versions must directly descend from the
  currently installed map version.
- Reconciliation returns typed `not-installed`, `in-sync`, `update-available`,
  `client-ahead` or `identity-conflict` results from stable package identity and
  lineage, never labels.
- A separate `loc8.gateway-venue-simulation.v1` snapshot accepts only unsigned
  browser-local `local-demo` packages, deep-clones/freezes them and survives an
  offline browser reload.
- Command Commissioning now includes a functional **Gateway simulation** view.
  It explains phone/Command/Gateway data ownership, blocks draft installation,
  installs/removes a separate simulated copy, shows package size and operational
  projection counts, reconciles versions and lists the real production gates.

## Measured evidence

| Gate | Result |
|---|---:|
| Focused distribution + Command adapter tests | 47/47 passed |
| Named distribution validation/runtime/simulation cases | 43/43 passed |
| Full product regression | 33/33 suites, 373/373 tests |
| Root, engine, Guard and Command TypeScript | passed |
| Command production build | passed, 73 modules transformed |
| Expo lint | passed |
| Expo Doctor | 20/20 checks passed |
| Dependency audit | 0 vulnerabilities |
| Git whitespace check | passed |

The Jest run emits the existing Expo Go remote-notification warning from the
Guard projection import. It is not a test failure and this increment does not
change notifications.

## Browser and design verification

The Codex in-app browser exercised the real Command UI in this order:

1. Open Commissioning and confirm a draft cannot be installed.
2. Create a validated unsigned local demo.
3. Install the simulation-only copy and observe `IN SYNC`.
4. Reload the application, reopen Commissioning and recover the separate copy.
5. Fork a successor draft and observe `COMMAND AHEAD` without changing the
   simulated copy.
6. Reset/recreate the local demo, remove the simulated copy, observe
   `NOT INSTALLED`, then reinstall it.

The 1440×1000, 900×900 and 390×844 checks had document widths equal to their
viewports. Final logs contained development info/debug messages but no warning
or error. No P0/P1/P2 visual finding remained. Evidence:

- `evidence/phase-02-gateway-simulation-desktop.jpg`
- `evidence/phase-02-gateway-simulation-900.jpg`
- `evidence/phase-02-gateway-simulation-mobile.jpg`
- `evidence/phase-02-visual-comparison.jpg`
- root `design-qa.md`

## What this does not prove

- No digest or signature algorithm/provider was selected or implemented.
- No cryptographic verification, real key, certificate or secure-element
  lifecycle was exercised.
- Browser localStorage is not durable Gateway storage, site authority or a
  concurrency/power-loss result.
- No Gateway process, SQLite/WAL store, radio, LAN, BLE transfer, restart or
  target-hardware run occurred.
- No real building package, plan, floor observation or person-location record
  was used.

## Product consequence

Loc8 now has a concrete boundary between an editable Command package, an
offline client replica and the eventual on-site source of truth. Product teams
can build against the provider/store contract without inventing cryptography or
mistaking the browser demonstration for deployment.

## Exact next repeat

1. Implement the Expo SDK 57 phone sensor adapter and deterministic replay as a
   separate phase; do not collect physical data yet.
2. Select a supported Gateway runtime/storage candidate and preregister
   concurrency, restart and power-loss tests before implementation.
3. Freeze public vectors and a specialist review lane before choosing the real
   digest/signature provider.
4. Keep signed publication and physical distribution held until those repeats
   and target-hardware evidence pass.

## Reproduction

```text
npm test -- --runInBand --no-cache
npx tsc --noEmit --pretty false
npx tsc -p packages/engine/tsconfig.json --noEmit --pretty false
npx tsc -p apps/guard/tsconfig.json --noEmit --pretty false
npm run build --workspace @loc8/command
npm run lint
npx expo-doctor
npm audit --audit-level=low
git diff --check
```
