# R3 branch-preserving forwarding protocol, version 2

Registered on 3 October 2026 **before the v2 benchmark**. This is a new
experiment following the [negative v1 result](results/2026-10-03-ble-density.md).
The v1 policy, evidence and registered gate remain unchanged and HOLD. This
protocol does not retroactively make v1 pass or promote a production default.

## Hypothesis and frozen gate

One existing native jitter timer can forward to still-uncovered outgoing links
without cancelling the whole relay or introducing retries. A duplicate that
matches the entire immutable native frame establishes only that its actual
ingress link sent that frame. Exclude that link at the original timer's send;
do not infer coverage of other outgoing links.

Compare **current**, **jitter-only**, and **branch** in the same 5,400-run matrix
and paired topology/loss/timer seeds as v1: 10/25/50/100/250 nodes,
1/3/7 requested shortest hops, 0/10/30/50% independent directed link erasure,
line/layered crowd/sole bridge, ten seeds. Current includes cancellation;
jitter-only is the reliable one-send ablation, not a released Loc8 default.

Gate for a later native experiment, not product promotion:

1. Each individual branch trial must match jitter's first application delivery
   set and arrival times exactly under this model. No cohort averaging.
2. Each branch trial must use no more directed attempts than jitter. At least
   one strictly positive saving in every descriptive dense cohort (mean
   canonical degree >=6); report the distribution and magnitude, not only a
   combined mean. No fixed 20% saving is inferred before measurement.
3. Preserve the sole-bridge repair relative to current in the targeted duplicate
   regression, and retain all bridge matrix results, including initial-hop loss.
4. Stop on changed TTL/immutable frame fields, unbounded state, timer renewal,
   duplicate application delivery within retained identity state, mismatched
   baseline results, or non-deterministic reruns.

The old "twice current attempts" limit remains part of v1's failed retry gate.
The v2 reference is reliable jitter: cheaper current cancellations can omit
essential branches. Always disclose v2 cost relative to current as well.

## Scope and equality claim

Branch uses the same first-receipt degree clamp/decrement and inclusive native
jitter bands as jitter-only. There is one timer and at most one forwarding
callback per retained message, no retry, source re-origination or topology oracle.
Matched duplicates add bounded actual ingress identities; they do not move the
deadline, change TTL or cancel other branches. The send filters the current live
link list, retaining its order. Overflow stops recording extra exclusions and
continues forwarding, favouring coverage over additional suppression.

The policy copies a validated raw 47-byte native frame. Its full immutable
witness compares all 46 bytes except mutable TTL, rather than trusting the
native four-byte payload digest alone. The model also uses SHA256 over those
immutable bytes as its key. A supplied-key collision with unequal bytes is an
explicit conflict and cannot add exclusions or modify the admitted timer.
This witness is not authentication, a new wire field or an encryption layer.

The exact-arrival claim applies to one frame, static canonical directed GATT
links, identical first-receipt schedules and independent keyed erasures. A peer
that already sent the frame has already received it; omitting a later send back
to that peer cannot change first delivery under these assumptions. Jitter ignores
duplicate arrivals, so pruning those returns cannot change its pending timers.
This argument does not establish equivalence with native queues, reconnecting
link generations, multiple messages, seen-cache eviction, OS suspension,
correlated loss or hostile identity/frame injection. Link incarnation must be
explicit in a later churn/native repeat so an old receipt cannot exclude a new
connection that has forgotten the frame. `forgetLink` clears a link's exclusions
without moving any timer; forgetting favours an extra send over lost coverage.

Seen state <=1,000 entries, pending <=128 frames, exclusions <=64 per pending
frame by default; all are configurable bounded integers. First-receipt seen
expiry is 300 seconds; active pending expiry is 4,550 ms. Expiry/eviction permits
later replay admission and clears the associated pending work. Clock regression
rejects work; lifecycle reset clears all witness/timer/link state. Frames are
returned as owned copies with only TTL changed. Production exports/native code
remain unchanged during the initial detached modelling slice. A subsequent
explicit opt-in native continuation is a separate proof layer, retaining these
registered model thresholds and keeping the default current policy.

## Evidence and continuation

Publish per-run trials, cohort CSV/JSON, gate report, source/artifact hashes and
two byte-identical reruns. Use actual TypeScript source through the existing
source test loader. Tests include sparse multi-hop, duplicate bridge, directed
asymmetry, frame-key conflict, source-buffer ownership, late timer, TTL freeze,
capacity, ingress overflow, monotonic clock and reset.

Native proof, offered-load/queue simulation and physical MESH-01 are separate
gates. Directed counts are not RF airtime, energy, range or battery evidence.
Optional gateways and consumer independence retain the v1 research boundaries.
