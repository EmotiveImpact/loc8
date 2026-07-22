# SEC-01 protocol-v2 boundary spike — pre-registration

**Registered:** 2026-07-22, before implementation and measurement
**Questions:** SEC-01 through SEC-07; MESH-06 through MESH-10
**Experiment:** E06 component bake-off, non-cryptographic seam only
**Decision:** whether to promote a bounded routing, deduplication, fragmentation
and migration contract into protocol-v2 engineering before encryption code.

## Threat model in scope

Assets are operational messages, sender/site/shift/role attribution, membership
state, location, audit linkage, availability, and downgrade state. Adversaries may
passively observe BLE traffic; inject, replay, reorder, duplicate, truncate or
fragment traffic; advertise false protocol capability; create peer churn; exhaust
memory/queues; restart a node; roll its wall clock; steal a device; or operate a
legitimate but revoked install. Relays, couriers, venue IP, LoRa carriers and
nearby phones are not trusted with plaintext or authority.

This spike does not claim to resist cryptographic forgery. It assumes that a
future reviewed library can authenticate policies, membership, announcements and
logical frames through narrow interfaces. Until that verification succeeds,
routing input and migration capability are untrusted hints.

## Hypotheses

1. A v2 transport cell can be unambiguously distinguished from every valid
   25-byte v1 application packet, reassembled with strict resource bounds, and
   passed as opaque bytes to a reviewed-library verification interface.
2. A locally persisted, monotonic site/shift migration floor can prevent an
   attacker or stale peer from moving a node from `v2-required` back to dual/v1.
3. A bounded dedup cache can preserve recent message handles across restart,
   prefer control traffic under load, and remain within its configured limits.
4. Fresh, verified, bidirectional topology observations can provide bounded
   source routes, with controlled fanout as a fallback and full fanout reserved
   for protocol-critical traffic.
5. At dense synthetic topologies, deterministic logarithmic fanout will reduce
   transmission attempts by at least 50% versus full fanout while delivering at
   least 95% of messages in the tested connected synthetic graphs.

## Gates

- All codec/reassembly tests pass for exact size, truncation, conflicting
  fragments, duplicate fragments, count/index overflow, per-peer/global assembly
  limits, byte limits and timeout cleanup.
- Migration tests reject unverified policy/capability input, stale epochs,
  same-epoch mode regression, all v1 traffic in `v2-required`, and downgrade after
  snapshot/restore.
- Dedup tests cover duplicates, expiry, bounded load, control reserve and restart.
- Routing tests cover stale/unverified topology, bidirectional paths, route limits,
  failed next hops and flood fallback.
- Load measurement uses at least 100 message handles per density cohort and
  reports delivery and attempted transmissions, not only averages.
- The prototype uses no new dependency and no encryption/signature implementation.

## Failure and stop conditions

- **STOP** the proposed cell boundary if a valid v1 packet can be classified as
  v2, malformed input can exceed a configured memory/count bound, or authenticated
  v2-required state can be downgraded without an explicit recovery authority.
- **REPEAT** if controlled fanout misses the 95% synthetic-delivery or 50%
  transmission-reduction gate; retain full fanout as the safe fallback.
- **HOLD** cryptographic implementation, operational enablement and security
  claims until protocol format/library selection and an independent specialist
  review are complete.
- Synthetic results may change architecture, not field delivery, battery,
  background-operation or crowd-performance claims.

## Fixed scope and deviations rule

The spike may implement only: a 25-byte v2 cell codec/reassembler, bounded recent
message cache, verified-topology routing policy, deterministic fanout simulator,
and downgrade-resistant migration state. Identity/key operations, Noise, AEAD,
signatures, membership credentials, real persistent secrets, native BLE changes,
production app changes, courier payload storage and gossip filters are out of
scope. Any change to these gates must be recorded as a deviation before viewing
the final measurement.
