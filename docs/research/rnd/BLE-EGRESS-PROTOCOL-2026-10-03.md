# R3 iOS egress queue continuation

Registered before implementation checks on 3 October 2026. Builds on PR #5 in `rnd/ble-egress-2026-10-03`, starting at
`d796e843f390fcf2ff38ae1b61d760811856a91b`. The earlier static model and its
results remain frozen; this is a native queue experiment, not a new RF result.

## Problem and research connection

The source intake calls for bounded queues and lifetime under load, suspension
and reconnects. `MeshService` bounds writes at 16 frames per peer but does not
expire them. Its notification backlog has neither a frame bound nor expiry.
New notifications can bypass older queued notifications. Unsubscribe leaves
queued recipient IDs behind, allowing a later subscription to inherit old work.
These behaviors sit after the branch policy's one-send decision and therefore
are absent from its static benchmark.

## Proposed behavior

- Share one independently authored queue helper across the two iOS egress roles.
  Keep 16 write frames per peer; cap pending notification groups at 128, with
  at most 64 recipient IDs per group. Reject oversized/invalid queue entries.
- Use the existing sleep-inclusive continuous clock. Queued work expires no
  later than 4.55 seconds after local admission. Branch relays inherit their
  original pending-relay deadline, including time already spent waiting for
  jitter; queueing and readiness callbacks cannot renew it.
- Overflow removes the oldest pending frame. Preserve FIFO within each role's
  queue. Stop on CoreBluetooth backpressure and resume only from its readiness
  callback. A blocked write peer does not block another peer's queue.
- Remove a disconnected/unsubscribed recipient from pending work before the
  same ID can be reused. Stop and radio-off clear the respective queues.
- Keep the exact 25-byte payload, frame47 codec, hop budget, branch selection,
  default mode and Android service. Apply queue safety to both iOS modes and
  disclose that the native `current` control therefore also changes under load.

4.55 seconds is an experimental local resource budget inherited from R3, not
an emergency-delivery SLA or authenticated source age. These queues can drop
SOS, text fragments and locations alike. Priority/reservation and durable
authenticated courier delivery need separate designs and evidence.

## Acceptance criteria

1. Execute actual production helper code under a deterministic 10,000-frame
   blocked load: bounds hold and retained frames preserve their bytes/order.
2. Cover overflow, exact-boundary expiry, sleep-length jumps, clock regression,
   rejected malformed frames, external deadlines and repeated busy callbacks.
3. Cover recipient removal/reuse, partially disconnected notification groups,
   independent queues, reset and preservation across same-mode reattachment.
4. Compile/typecheck the actual integrated iOS service against the installed
   platform SDK and run the existing native host suite. Exercise service-owned
   queue cleanup through the host fixture without starting Bluetooth managers.
5. Pass the existing scoped/Jest/field-contract/type/lint checks and retain new
   source and raw-log hashes. Preserve prior receipts against their exact Git
   snapshots rather than relabelling old test logs as current.

Physical backpressure callbacks, complete supported Expo builds, phone installs,
mixed-OS traffic, priority behavior, RF/battery and MESH-01 remain independent
gates. The frozen field JSONL vocabulary has no generic queue-expiry/notification
overflow reason; report these through OS logs without misclassifying delivery.

Primary API contracts: [Apple notification backpressure](https://developer.apple.com/documentation/corebluetooth/cbperipheralmanager/updatevalue(_:for:onsubscribedcentrals:))
and [write readiness](https://developer.apple.com/documentation/corebluetooth/cbperipheraldelegate/peripheralisready(tosendwritewithoutresponse:)).
No upstream implementation code or dependency is imported.
