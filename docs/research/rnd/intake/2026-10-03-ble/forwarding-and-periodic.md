# Loc8 forwarding and periodic-advertising R&D intake

Verified 2026-10-03 (Europe/London). Research/source inspection only. No third-party code executed, imported into Loc8, or copied into the product. Temporary inspection files: `/tmp/loc8-research-vendor/`; documents below are references, not production dependencies.

## Decision

Implement an independent bounded forwarding experiment in Loc8's detached simulator first. Keep the existing 25-byte application payload and native 47-byte frame unchanged. Treat density/unique-peer thresholds as Loc8 hypotheses; do not claim RFC6206, adaptive-k, OEPB, or Bluetooth Mesh compliance. Dedicated periodic-advertising relay hardware is a later bench track, not a smartphone transport replacement.

## Original standards, papers, technical reports

### RFC6206, RFC7731, and the original Trickle paper

- [RFC6206, The Trickle Algorithm, March 2011](https://www.rfc-editor.org/rfc/rfc6206.html), Standards Track. Sections 4–6 define random transmission in the second half of each interval, consistent-message counting, suppression, interval doubling, reset semantics and timing cautions. Parameter Imax in this RFC is a doubling count, not an absolute millisecond cap. Specify consistency explicitly and base Imin on measured link-layer timing. Repeated duplicates must not restart completed forwarding indefinitely.
- [RFC7731, Multicast Protocol for Low-Power and Lossy Networks, February 2016](https://www.rfc-editor.org/rfc/rfc7731.html), Standards Track. Sections 5.4 and 11 motivate per-message timers with bounded expiration counts. Defaults are k=1, three timer expirations, and Imin ten times expected link-layer latency. Expirations and actual transmissions are different counters. MPL is IPv6 multicast; borrow ideas independently, not its wire format.
- [Levis et al., Trickle: A Self-Regulating Algorithm for Code Propagation and Maintenance in Wireless Sensor Networks, NSDI 2004](https://www.usenix.org/conference/nsdi-04/trickle-self-regulating-algorithm-code-propagation-and-maintenance-wireless). [Original full paper](https://www.usenix.org/publications/library/proceedings/nsdi04/tech/levisTrickle/levisTrickle.pdf). Established the listen-only period and density scaling decades before OEPB. Public scholarly text is not an unrestricted source-code licence.

No RFC code components were copied. The independent algorithm can cite these standards without a third-party runtime dependency; if code components are later copied, check the applicable IETF Trust licence requirements first.

### Adaptive-k and transport queue interference

- [Meyfroyt, Stolikj and Lukkien, Adaptive Broadcast Suppression for Trickle-Based Protocols, WoWMoM 2015](https://arxiv.org/abs/1509.08664v1), [full paper](https://arxiv.org/pdf/1509.08664), DOI [10.1109/WoWMoM.2015.7158134](https://doi.org/10.1109/WoWMoM.2015.7158134). Section IV adapts next-interval k from the previous interval's consistent-message count: clamp(floor(alpha*c), kmin, kmax). This is distinct from choosing k from connection degree or log2(degree). It warns about heterogeneous topology, bridge bottlenecks and unfair load distribution. Paper inspected; no author-linked reproducible repository found (GitHub repository search `adaptive-k trickle` returned zero), and source-code licence is unverified. Ideas-only intake, independently implement if tested.
- [Stolikj et al., Improving the Performance of Trickle-Based Data Dissemination in Low-Power Networks, EWSN 2015](https://arxiv.org/abs/1509.08654v1), [full paper](https://arxiv.org/pdf/1509.08654), DOI [10.1007/978-3-319-15582-1_12](https://doi.org/10.1007/978-3-319-15582-1_12). Shows how MAC queues/backoffs disrupt Trickle timing and proposes queue cleansing; study uses IEEE802.15.4/ContikiMAC, not BLE GATT. Loc8 inference: count actual handoff/transport sends, cancel only still-pending work, and model queue delay separately from algorithm timer delay. Reproduction code/licence not located; no copying.

### OEPB -01 and BLE binding -01: prior shortlist verified with important qualifications

Original sources: [draft-sharma-oepb-01](https://datatracker.ietf.org/doc/html/draft-sharma-oepb-01), [draft-sharma-oepb-binding-ble-01](https://datatracker.ietf.org/doc/html/draft-sharma-oepb-binding-ble-01). Both dated 30 September 2026; individual experimental Internet-Drafts, not IETF-endorsed standards. OEPB sections 6.1/6.3 report 84.2%→96.6% (10 nodes) and 81.9%→98.1% (25) delivery at independent 30% link loss, within the source connected component. Configuration: random 200m square, 50m range, 30 runs, 5s window; Imin 50 ms, Imax 1000 ms, k=3, eight intervals or three sends, maximum state lifetime 4.55 s. These are author simulation claims, not Loc8 benchmarks: no MAC/collision/radio model. Section13 explicitly states no BLE binding implementation, independent implementation, or on-air/hardware testing.

Named repository [karansharma1732/OEPB](https://github.com/karansharma1732/OEPB) returned HTTP404 via authenticated GitHub API and browser; author public repository listing showed only two unrelated repositories. `trickle_sim.py`/results and source licence could not be inspected or reproduced. Record this as unavailable, not nonexistent. Use specification ideas independently; neither OEPB's 256-byte packet nor signature/trust design is a drop-in fit.

The BLE draft addresses advertising, fragmentation, extended advertising and ATT MTU as separate concerns. [BLE binding sections3–5](https://datatracker.ietf.org/doc/html/draft-sharma-oepb-binding-ble-01#section-3) should not be mistaken for evidence that smartphone GATT fanout inherits broadcast-overhearing suppression behaviour. Its text is under IETF Trust/BCP78; no repository-code licence verified.

### Periodic advertising low-power relays (DPCS)

Original article: [Gautam, Kumar and Tsiropoulou, Unlocking Ultralow-Power Bluetooth Low Energy Relays With Periodic Advertisements](https://doi.org/10.1109/JIOT.2026.3680032), IEEE Internet of Things Journal 13(12), 27717–27735, 15 June 2026; publisher [article 11471785](https://ieeexplore.ieee.org/document/11471785). Publisher full text blocked by robot verification during this run. Bibliographic/provenance data verified from publisher-deposited [Crossref metadata](https://api.crossref.org/works/10.1109/JIOT.2026.3680032) and author-linked repository. Article licence recorded as standard IEEE terms, not an open source-code grant.

Primary institutional source: [IIT Ropar April 2026 publication digest, item 110, pages44–45](https://www.iitrpr.ac.in/library/pdf/Publications%20Digest%2004.2026.pdf). Abstract describes DPCS: stop primary scanning after periodic sync, resume after loss. It reports five-node nRF52832 chains, >99% per-hop reception, indoor50–60m and outdoor180–200m, and 100–1000x savings against continuous scan at60 s sensing interval. These figures were not independently reproduced; do not convert per-hop results into whole-chain delivery or imply phone battery/range results. Full measurement methods/power traces remain unavailable in this intake.

[Bluetooth Core 5.4 Link Layer, sections4.4.2.2.3 and4.4.2.12](https://www.bluetooth.com/wp-content/uploads/Files/Specification/HTML/Core-54/out/en/low-energy-controller/link-layer-specification.html) and [Bluetooth SIG LE primer section 7.8](https://www.bluetooth.com/bluetooth-le-primer/) separate periodic advertising without responses from PAwR. DPCS demo uses periodic advertising without responses; PAwR is a different capability. These are standards/design references, not application source-code licences.

## Repository inspection receipts and reuse classification

| Repository and pinned commit | Files inspected | Licence and maintenance | Fit/reuse decision |
|---|---|---|---|
| [sukgautamgit/DPCS-SimultaneousTx-Rx-BLE-Demo](https://github.com/sukgautamgit/DPCS-SimultaneousTx-Rx-BLE-Demo/tree/469086d42b3e6a482a23595ec13c4f0d20f6b066),`469086d42b3e6a482a23595ec13c4f0d20f6b066` | LICENSE,README.md,CITATION.cff; all 3 `src/main.c`; relay `prj.conf` | Apache-2.0 verified from LICENSE and file SPDX.19 commits; last default-branch commit21 Feb 2026;0 releases/tags/issues at check; no CI/tests or pinned SDK manifest in tree. Author-linked, minimal research demo. | External hardware-bench candidate under attribution/notice obligations, not imported. NCS/Zephyr, nRF52832/52840/5340 stated. Static predecessor whitelist,4-byte application payload, 1 s periodic interval,500 ms extended advertising,5 s sync timeout. |
| [NordicPlayground/nRF51-ble-bcast-mesh](https://github.com/NordicPlayground/nRF51-ble-bcast-mesh/tree/9647fd7357a6a66741f30ea97913874d4cb30bcc),`9647fd7357a6a66741f30ea97913874d4cb30bcc` | LICENSE.adoc,README.adoc,docs/how_it_works.adoc,`nRF51/rbc_mesh/src/trickle.c`,include/trickle.h | Nordic modified BSD-like terms; clause4 restricts processor use to Nordic or combinations including Nordic. Default branch last commit7 Apr 2017; repo pushed27 Oct 2017;72 open issues; not archived. | Historical Trickle BLE reference; no copy into general phone code. Versioned handle/value propagation differs from Loc8 event messages. Legacy stack/SoftDevice integration is substantial. |
| [zephyrproject-rtos/zephyr](https://github.com/zephyrproject-rtos/zephyr/tree/2428837a26050e11d0d541432a5fa783666c0c8e),`2428837a26050e11d0d541432a5fa783666c0c8e` | LICENSE;`subsys/net/lib/trickle/trickle.c`;`include/zephyr/net/trickle.h`;periodic_adv/src/main.c+README;periodic_sync/src/main.c+README+prj.conf;`tests/bsim/bluetooth/host/adv/periodic` tests.yaml,src/per_adv_sync.c,tests_scripts/per_adv_app_not_scanning.sh | Apache-2.0 in inspected files; active, latest default commit2 Oct 2026; latest non-prerelease GitHub release v4.4.2, 7 Aug 2026. Whole-repo licensing is file-specific. | Maintained reference timer and periodic TX/RX samples; possible independent hardware firmware dependency with proper notices. BabbleSim periodic tests offer a later Linux native BLE/controller/PHY harness; not executed and not an existing complete DPCS relay benchmark. |

DPCS source review found reasons to keep it external: relay receive callback copies four bytes at fixed offset4 without checking received length/AD type/company identifier; after upstream sync loss the relay continues advertising the last payload indefinitely. Add validated AD parsing, Loc8 frame-size validation, age/lifetime bounds, loss/recovery instrumentation, pinned NCS/controller versions, and hardware/energy receipts before considering any adoption. Source copyright headers retain Nordic/Intel attribution. No claim that Apache licensing alone establishes correctness or production readiness.

## Concrete Loc8 mapping (architecture supplied by parent after native-source inspection)

- Native bearer is dual-role GATT; relay performs directed fanout excluding original ingress. Application payload 25 bytes; full raw frame 47 bytes. Preserve both sizes. TTL header byte 2 starts 7, is capped to 5 dense/6 medium, then decremented.
- Dedup identity currently combines sender 8 bytes, header timestamp, type 0x30 (decimal 48), and first 4 bytes of SHA256(payload); TTL excluded. Repeated forwarding should reuse the already-decremented outgoing frame, not decrement once per retry. Do not let suppression/lifetime alter dedup identity or payload bytes.
- Existing native forwarding already has degree-dependent jitter:10–40,60–150,80–180,100–220ms. Any duplicate cancels pending forwarding, a k=1 style heuristic. Compare against faithful current-native semantics as well as an immediate-forwarding reference; avoid labelling the existing product as naive immediate flooding.
- iOS role counts may count the same peer twice; Android degree uses address union. Degree estimates require a stable unique-peer definition before runtime adaptive policies.
- Broadcast theory does not prove that hearing copies over a few incoming GATT links means a separate outgoing branch has received them. Unique-ingress-link counts reduce duplicate inflation but do not prove downstream coverage. Dumbbell/bridge/star/chain and asymmetric-directed-link tests are mandatory, and sparse nodes should retain forwarding opportunities.
- Detached Loc8 hypothesis:unique-link duplicate threshold max(2,ceil(log2(d+1))), sparse degree <= 2 never suppress;Imin 80 ms, Imax 640 ms, <=3 actual sends, <=7 intervals, active lifetime <=4550 ms. This is neither OEPB constants nor paper adaptive-k reproduction. Termination bounds must count suppressed intervals, cap resident state, retain replay/dedup tombstones independently, and cancel pending sends on shutdown/expiry.

## Recommended experiment gates

1. Deterministic matrix:10/25/50/100/200 nodes,chain/star/dumbbell/grid/random geometric;hop budgets 1/3/5/7;independent link loss 0/10/30/50%;multiple seeded runs. Report delivery both within source component and across all nodes, component size,median/p95latency,total actual directed sends,retries/suppression,peak cache/state and tail-node reachability.
2. Add queue delay,bursty/correlated loss and asymmetric links separately. Simulation relay decisions are not BLE RF,range,power,OS-background or MAC evidence. Do not assert airtime gains from counting directed GATT writes alone.
3. Compare current jitter+k=1 cancellation,new jitter-only,bounded fixed-k Trickle,and Loc8 unique-peer density policy. Keep reset rules/configuration visible. Investigate sparse retries vs dense suppression as separate axes.
4. Hardware DPCS track:three Nordic boards+PPK-II first; preserve Loc8 frames as application bytes inside a lab-only bearer envelope;test1/10/60 s update cadence,upstream power cycling,body-obstruction,mobility,multiple parents,stale expiry and clock drift. Record cold discovery/recovery,time-to-first-forward,whole-path delivery,current over both discovery and steady state. Run author demo externally only after licence notices and pinned SDK are captured.
5. Consumer deployment gate remains current GATT hardware/background evidence. Do not change all clients to periodic advertising or claim phone API/hardware support from Nordic demonstrations.

## Exact downloaded text hashes

These files were downloaded from official sources for temporary reading only; not vendored into Loc8.

| Official text | SHA256 |
|---|---|
| https://www.ietf.org/archive/id/draft-sharma-oepb-01.txt | `97ca81b65ced673931e9c2f38925eadb1bcb1df89bf4bff663c0e7ae938d44c4` |
| https://www.ietf.org/archive/id/draft-sharma-oepb-binding-ble-01.txt | `4595b6b5ead96749f55cfc8aed90f22dd6c865a33e0e0d4dc396e7e28060f2aa` |
| https://www.rfc-editor.org/rfc/rfc6206.txt | `a38faf4084395f992b8fd2f7e07d5da22184f7251a55287a387a3c9a25337d47` |
| https://www.rfc-editor.org/rfc/rfc7731.txt | `6b767881bde42a0666d2d508d52620547966b01470eca82f8a2eec319c4e7ede` |
