# Loc8 BLE mesh research brief — 2 October 2026

**Recorded in the repository on 3 October 2026.** This brief is research input to
R3 / SEC-01 E06 and the physical MESH programme. It is not field evidence and
does not change the production relay default.

## What changed since the 25 September brief

The strongest new material is a pair of individual Experimental Internet-Drafts
published on **30 September 2026**:

- K. Sharma, *Offline Emergency Peer-to-Peer Broadcast Protocol*,
  `draft-sharma-oepb-01`:
  https://datatracker.ietf.org/doc/draft-sharma-oepb/
- K. Sharma, *OEPB Transport Binding: Bluetooth Low Energy*,
  `draft-sharma-oepb-binding-ble-01`:
  https://datatracker.ietf.org/doc/draft-sharma-oepb-binding-ble/

These are active individual Internet-Drafts, not IETF-endorsed standards. The
BLE binding explicitly says no implementation of that binding exists and no real
BLE-controller testing has been performed. Its author's Android prototypes use
Nearby Connections instead. Treat its BLE numbers as protocol-design evidence,
not phone evidence.

The drafts strengthen four Loc8 conclusions:

1. **Density must influence forwarding.** OEPB's simulator reports suppression
   increasing from 9.5% at 10 nodes to 83.2% at 200 nodes for
   `Imin=50ms, k=3, Imax=1000ms`. Its sparse 10-node case has a mean connected
   component of only 3.8 nodes, which is a reminder that nominal population and
   actual connected coverage are different things.
2. **Bounded retransmission primarily buys loss robustness, not free airtime.**
   OEPB's own revised comparison says deduplicated one-shot flooding transmits
   less on lossless links. Under independent 30% per-link loss, its Trickle
   model reports 96.6% / 98.1% delivery at 10 / 25 nodes versus 84.2% / 81.9%
   for one-shot flooding. The model does not include MAC collisions, bursty
   interference, OS scheduling or BLE connection setup.
3. **Small payloads remain strategically valuable.** The BLE binding allocates
   23 fragment-data bytes in legacy advertising and needs 12 fragments for a
   256-byte OEPB packet, estimating about 1.2–2.4 seconds just to emit those
   fragments at 100–200ms intervals before loss/repetition. Loc8's existing
   25-byte logical payload should therefore remain the control, not be expanded
   casually to absorb routing metadata.
4. **Transport scheduling belongs below message semantics.** OEPB separates
   per-transport dissemination state. Bluetooth SIG's IP Link project likewise
   targets IPv6/6LoWPAN over BLE with unicast/multicast and connection-oriented
   or connectionless bearers. Loc8 should keep message identity/meaning separate
   from the current BLE bearer.

Supporting engineering controls:

- Silicon Labs, *Bluetooth Mesh 1.1 Network Performance*:
  https://docs.silabs.com/btmesh/latest/btmesh-11-network-performance/
  Their 10/50/100/256-node work is dedicated-hardware evidence, not smartphone
  evidence. It reinforces keeping application payloads within a single packet
  where possible and independently testing node failure/recovery.
- Bluetooth SIG, *Features in development*:
  https://www.bluetooth.com/specifications/specifications-in-development/
  IP Link has completed IOP and targets adoption in fall 2026. This is a
  standards watch, not a reason to rewrite today's phone mesh.

## How this maps to the work already built in PR #5

The other 3 October build session did **not** duplicate this research. It already
turned the relay question into two distinct hypotheses:

- **v1 bounded Trickle/retry candidate:** retained as **HOLD** under its original
  software gate. It improved robustness in some simulated loss cases but paid
  retransmission cost and is not promoted from the OEPB paper.
- **v2 branch-preserving one-send candidate:** implemented behind
  `EXPO_PUBLIC_MESH_RELAY_MODE=branch` on iOS and Android. It preserves the
  existing jittered send but suppresses only return branches that have already
  supplied the exact frame, instead of cancelling the whole scheduled fanout.
  The default remains `current`.

PR #5's model reports 5,400 deterministic runs. Across 1,800 branch-versus-jitter
comparisons the first-delivery sets and arrival times match, while dense cohorts
save directed attempts versus jitter. Those are Loc8 software-model results and
must remain separate from OEPB's published simulation and from physical RF,
energy, locked-phone or background evidence.

This is an important design refinement: the new papers support adaptive
redundancy, but **they do not tell us to copy full Trickle retries into the
shipping phone relay**. PR #5 found a narrower candidate that repairs the
sole-bridge cancellation failure while avoiding repeat whole-fanout retries.
The next decision therefore belongs to controlled native/physical comparison,
not another simulator-only default change.

## Tests worth running next

### MESH-01 remains the first physical gate

Run the frozen isolated A–B–C relay test and B-absent control without relaxing
its criterion. Compare `current` and `branch` using distinct run IDs and the
same devices/builds.

### Duplicate / branch preservation

Construct a topology where B has two outgoing branches and hears a duplicate
from one already-covered branch before its timer fires. Verify that `branch`
still reaches the other branch while the current policy can cancel it. Capture
actual native mode, queue/drop diagnostics and application delivery.

### Density sweep

Use 5/10/25/50+ controllable devices or the nearest practical hardware cohort.
Measure unique delivery, directed send attempts, duplicate ratio, p50/p95
latency, queue pressure and battery. Do not convert software attempt counts into
RF airtime or energy claims without instrumentation.

### Loss and asymmetry

Introduce controlled obstruction, attenuation or link asymmetry rather than
only independent simulator loss. Sparse bridge failure matters more than dense
average success.

### Phone-state matrix

Repeat foreground, screen-off/background, low-power and restart cohorts on
current iPhone and Android builds. OEPB's proposed 10% idle scan floor is not a
mobile-OS guarantee.

### Payload control

Keep the current 25-byte logical payload as the baseline and compare deliberately
larger synthetic payloads only to quantify fragmentation/setup costs. Do not
expand the production wire because a draft uses a larger envelope.

## Firmware / Loc8OS implications

- Keep the production relay default `current` until physical gates pass.
- Keep `branch` opt-in and observable as a research mode.
- Preserve native ownership of relay timers, deduplication, TTL and live-link
  state. Do not add a competing JavaScript relay scheduler.
- Treat density, duplicate evidence, queue pressure, battery and link churn as
  future scheduler inputs, but require each new input to earn promotion through
  a registered comparison.
- Keep source-loss retry, authenticated store-carry-forward, structured routing,
  dedicated periodic-advertising hardware and long-range Gateway work as
  separate experiments.
- Preserve the 25-byte application payload and 47-byte native frame in this
  programme. Any future protocol-v2 metadata needs explicit version/capability
  design rather than hidden reuse of existing fields.
- Keep public Loc8 infrastructure-independent. Gateways and Anchors may improve
  venue reliability but are not prerequisites for the consumer product.

## Decision

**ADOPT as research direction:** density-aware suppression, bounded redundancy,
small-payload discipline and transport abstraction.

**DO NOT PROMOTE from this brief:** OEPB's constants, latency, delivery ratios,
scan duty cycle or BLE range as Loc8 phone guarantees.

**CURRENT IMPLEMENTATION CANDIDATE:** PR #5 branch-preserving forwarding in
opt-in native shadow mode.

**NEXT PROMOTION GATE:** physical MESH-01 plus duplicate/branch, churn/load,
background and battery cohorts on supported phone builds.
