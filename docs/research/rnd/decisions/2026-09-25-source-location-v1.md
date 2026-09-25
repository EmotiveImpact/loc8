# ADR: preserve GPS sample provenance without changing legacy report semantics

Date: 25 September 2026. Status: implemented for review in PR #4; not merged.
Parent application: `c141dd6ef351205b6d33fa5aace8222032718f8b`.

## Observed problem

Both `src/hooks/useMyLocation.ts` and the Guard equivalent previously retained
only coordinates. `meshService.myPacket` publishes those cached coordinates with
`nowSec()` and fixed 10m accuracy. Guard's separate SOS producer also used 10m.
The publication clock is distinct from GPS measurement time.

Expo SDK 57 defines `LocationObject.timestamp` as epoch milliseconds for when
position information was obtained and permits null horizontal accuracy. Its
`watchPositionAsync` updates while foregrounded; a distance interval is not a
promise of continuous stationary observations. Sources:
https://docs.expo.dev/versions/v57.0.0/sdk/location/
https://docs.expo.dev/versions/v57.0.0/

The current receiver `TrustLayer` rejects equal/older timestamps for its sender,
type and applicable target key. Replacing publication time with a cached sample
time would therefore suppress repeated stationary reports. R1a already labels
live source age unverified; it must not be falsely upgraded by this patch.

## Options

1. Replace `timestampSec` with sensor time: rejected in this increment because it
   changes heartbeat/dedup semantics, even though the byte count stays at 25.
2. Hide age in heading/floor/accuracy fields: rejected. Those fields have existing
   meanings, and independent age/accuracy cannot be safely inferred by old peers.
3. Add an unversioned companion message: rejected under the unchanged-wire scope.
4. Retain source provenance locally and preserve the current wire report:
   selected. This fixes information loss now and makes the next boundary explicit.

## Selected contract and data path

`Expo sample -> shared lifecycle adapter -> existing crew store sample -> local
sample view / existing report publisher -> unchanged codec/native transport ->
existing remote report-freshness projection`.

A `SourceLocationSample` retains copied coordinates, original `observedAtMs`,
first `receivedAtMs`, original finite nonnegative accuracy (or null), device/demo
origin, optional provider mock indication and the local elapsed-clock domain.
No extra personal identifier, persistent location log or server is added.

The existing coordinate-only setter remains compatible but clears sample
provenance so another fix's timestamp/accuracy cannot attach to new coordinates.
Same-time duplicates and older callbacks cannot renew a retained sample in the
same domain. A same-coordinate newer fix is accepted. An explicit demo fallback
stays demo-only; a real-mode permission/watch failure clears real position state.

Sample age combines source delay with local elapsed time. Clock mismatch or
wall/elapsed discontinuity fails closed. The display thresholds are product
policy, not a radio SLA or proof of physical accuracy. These helpers do not
change native scanning, subscribe to background location or add GPS polling.

Reports keep publication time and the existing 5s/60s cadence. The accuracy byte
uses `min(255, ceil(providerAccuracy))`; unknown, unbound, demo or provider-mocked
values use the existing ceiling. This preserves byte format but deliberately
stops fabricating 10m accuracy. **255 is ambiguous**, not an invented sentinel
and not an upper bound on current location error. Sample age is not added to
accuracy as a guessed walking-speed model.

The no-fix quickReply path is geo-free and now remains usable with a profile
alone. Text already has no coordinate requirement. Geo-bearing normal reports
still require coordinates. SOS continues its existing signal/rally/text sequence;
no-fix zero coordinates remain a known v1 ambiguity. Alerts are not silently
suppressed to improve the appearance of location data.

## Lifetime and failure handling

Each source watcher owns its pending subscription and callbacks. Stopping during
permission/setup prevents subsequent state updates. A subscription resolving
after stop is removed once. Permission lookup/watch errors report unavailable
or denied and clear real location state; only the owner of a direct simulator
can seed a fallback. A recoverable watch error does not invent permission state
or an observation. This is not a full operating-system revocation service.

## Tests and compatibility boundary

The source suite exercises actual TypeScript helpers, store, publisher,
packet codec and trust rule, with declared framework/provider mocks. A five-minute
stationary fixture emits 61 distinct 25-byte reports accepted by the real trust
rule while retaining one original sample. Delayed callback, saturated/null
accuracy, mocked/demo data, stale clocks, same-coordinate new fixes, no-fix
status/text, privacy/session gates and async cleanup are covered.

No core codec/type/native file changes and no additional radio frames are
required. Existing R0 wire fixtures remain unchanged. Full exact-toolchain,
application/native builds, hardware battery/background tests and UI review are
still required. Scope does not include new authentication, ACKs, true remote
sample age, public-key time trust or multi-Gateway behaviour.

## Next explicit decision

R1c must define source sample identity, original timestamp or conservative age,
clock basis, unknown/saturated accuracy and location-validity semantics across
capability-negotiated versions. Specify late/duplicate companion metadata and
stationary/report correlation before choosing a representation. It must retain
v1 interoperability without claiming old peers understand new source semantics.
Do not implement it opportunistically inside an unrelated UI or relay change.
