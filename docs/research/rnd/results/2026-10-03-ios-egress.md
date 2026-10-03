# iOS relay queue continuation

The iPhone service now bounds its pending notifications and expires queued
writes/notifications. This closes a concrete resource gap identified during
the R3 queue/load follow-up: the old notification array could grow indefinitely
while Bluetooth was busy, and neither queue discarded work after a long pause.

Base: PR #5 at `d796e843f390fcf2ff38ae1b61d760811856a91b`.
Continuation branch: `rnd/ble-egress-2026-10-03`.
See the [registered protocol](../BLE-EGRESS-PROTOCOL-2026-10-03.md).

## Implemented behavior

- The actual Swift service uses `MeshEgressQueue` for both egress roles.
  Writes retain the existing 16-frame per-peer limit. Notifications retain at
  most 128 frame groups, with up to 64 recipient IDs per group. Overflow removes
  the oldest queued frame; malformed queue entries are rejected.
- Both use the sleep-inclusive clock. Local queue retention is capped at
  4.55 seconds. A branch relay passes its original admission deadline through
  to egress, so jitter and backpressure share one deadline. Readiness callbacks
  and repeated busy responses cannot renew it.
- New notifications no longer overtake older blocked notifications. Queues
  resume through CoreBluetooth readiness callbacks. Write queues are independent
  per peer; one blocked peer does not block another peer's queue.
- Unsubscribe removes that recipient from pending notifications while preserving
  other recipients. Resubscribe/rediscovery clear work for the replaced link.
  Stop/radio-off clear queued work; same-mode reattachment preserves it.
- Existing packet encoding, immutable native frame fields, TTL calculation,
  the branch algorithm, Android source and dependencies are unchanged.

The selected default remains `current`. **Both iOS modes receive this queue
change**, so behavior under congestion differs from the previous native control.
The old 5,400-run matrices remain historical; their static models do not model
these OS queues and provide no new performance claim for this continuation.

## Checks and evidence

The [receipt](evidence/2026-10-03-egress/manifest.json) records the exact sources,
toolchain, commands and compressed successful logs. The native runner executes
the actual helper/service source against Apple frameworks without starting BLE.
Its service fixture checks real same-mode reattachment and stop queue ownership.

The 12 new native checks include 10,000 blocked frames at each capacity, FIFO,
overflow, exact-deadline expiry, long suspension, invalid/regressing clocks,
inherited deadlines, expiry between OS attempts, partial recipient disconnect,
UUID reuse, independent peers, owned bytes and malformed input rejection.
Together with the existing 22 checks this produces 34 native host checks.

On the isolated continuation tree, all 34 native host checks, 335 scoped checks,
490 Jest tests and 100 field-contract checks passed. iOS Simulator source
typechecking, root TypeScript and lint also passed. The unchanged Android and
static benchmark results remain bound to their earlier source snapshots.

GitHub verification now has a separate macOS job to execute these checks and
typecheck the service against the installed iOS SDK. This job does not compile
the full Expo application or run an iPhone. Its result must be inspected for the
actual pushed commit before calling remote native verification successful.

Reproduce after the repository's locked dependency installation:

```sh
node tools/mesh-rnd/native-relay/run-ios-branch-tests.cjs --typecheck-ios
node tools/mesh-rnd/verify-branch-integration.cjs
```

The verifier retains the original integration receipt at `f7a600b` and the
reattachment receipt at `cee77cd`, then checks the new receipt against current
files. Old logs are not relabelled as checks of the new implementation.

## Scope, concurrent work and physical next steps

The separate native-field-build chat began adding app identities, offline
field access and packaging in the initially shared `loc8-build` directory.
Those edits are preserved. This continuation moved only its own queue changes
into `loc8-relay-queues` and uses a separate branch based on PR #5. It does not
claim that the other chat's unfinished build changes were tested or delivered
here. Review the combined source and regenerate current receipts when integrating
the two increments.

The locked dependencies already installed for PR #5 were reused through a local
symlink; no fresh dependency installation or package update is claimed. Local
storage was about 1.2 GiB and Xcode was 16.2. Full Expo app builds/install and
phone/RF/battery/background tests were not attempted in this continuation.

4.55 seconds is a local experimental queue budget, not source authenticity or
a delivery SLA. Overflow/expiry may discard SOS and text fragments as well as
positions. Priority reservation and authenticated durable delivery remain
separate work. The frozen MESH-01 JSONL schema remains unchanged: generic queue
drops appear in OS logs, not as invented field-event reasons. OS acceptance
does not prove receiver delivery.

Next: integrate with the supported native field builds, capture OS logs during
busy-write/notification tests, verify no old sends after screen-off/resume or
reconnect, then repeat the frozen A-B-C/B-absent controls and density/load
comparisons. Keep wire25 and physical acceptance criteria fixed. Main is not
merged and no application release or production promotion is claimed.
