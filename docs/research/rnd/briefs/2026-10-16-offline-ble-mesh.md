# Loc8 BLE mesh research intake | 16 October 2026

**Baseline:** `rnd/gatt-contention-2026-10-09` at `073cff22f4c7475f7a4cdd8eaf94e62efbd96524`, descendant of R3 draft PR #5. This is an experimental product-field observation change, not a release or proof of venue-scale mesh. Previous OEPB/Trickle, DPCS, Pang clock-drift, BLE–LoRa, BitChat and MeshCore work stays in the 3/9 October intake. None is falsely relabelled as newly published.

## Newly useful / consequential sources

### 1. EMBLEM multi-connection scheduling on 51 physical BLE devices (new to Loc8 intake)
*Multiconnection Scheduling With Fair Resource Management for Scalable Bluetooth Low-Energy Networks*, IEEE Internet of Things Journal 13(4), 7565–7582 (issue 15 February 2026; online 3 December 2025). DOI https://doi.org/10.1109/JIOT.2025.3639570 ; publisher https://ieeexplore.ieee.org/document/11275955 .

**Changed:** a hardware-validated, 51-node study goes beyond the R5 synthetic clock-overlap model. The authors describe a unified connection resource list, traffic-aware fairness, subrating, pre-emption and event extension, reporting better fairness/throughput in their testbed. Full data/reproducible source and software reuse rights were not verified; no implementation has been copied.

**Loc8:** many connected GATT peers compete for controller time; a phone's link count is not a throughput or capacity measurement. Controller mechanisms from the paper cannot simply be implemented via ordinary iOS/Android app APIs. **Test:** current vs branch relay mode under two, three and more observed link handles, 1/5/10 synthetic messages per second, app lifecycle/reconnect, interference and matched device/OS cohorts. Record application queue/pending timings and separately instrument actual BLE/HCI events with supported hardware. Do not infer radio collisions from app events.

### 2. Zephyr Bluetooth Mesh proxy advisory (published 7 October 2026)
CVE-2026-15894 / GHSA-x37p-38wq-cgwj. Primary https://github.com/zephyrproject-rtos/zephyr/security/advisories/GHSA-x37p-38wq-cgwj ; https://osv.dev/vulnerability/CVE-2026-15894 ; fix https://github.com/zephyrproject-rtos/zephyr/commit/4416ad13677259d180f35ce44338578694e48184 .

**Changed:** malformed advertising data can overflow the Zephyr Bluetooth Mesh On-Demand Private Proxy solicitation parser in affected versions 3.4.0 to before 4.4.2 when that feature is enabled and eligible; a 4.4.2 fix bounds the parsed input. **Loc8:** the phone mesh is custom GATT, NOT this Bluetooth SIG Mesh proxy. Do not claim the phone is vulnerable. A future Zephyr Gateway firmware must pin a patched version, confirm whether CONFIG_BT_MESH_OD_PRIV_PROXY_SRV is enabled, review AD-length validation and retest stale/recovery conditions. No security exploit tooling or code transplant added.

### 3. Hybrid deterministic/random BLE discovery (useful previously unintegrated comparator)
Shen, Jiang and Guo, *A Hybrid Advertising Mode for Neighbor Discovery in Bluetooth Low Energy Networks*, IEEE Transactions on Vehicular Technology 75(1), January 2026; online 4 August 2025. DOI https://doi.org/10.1109/TVT.2025.3595464 .

**Changed:** DRA mixes pseudo-random and periodic advertising timing to trade discovery latency against persistent co-phase collisions. The published abstract describes modelling/simulations, not a proved phone-mesh gain. No code or source licence verified. **Loc8:** advertising discovers a peer; the existing 25-byte message is actually relayed over connected GATT. **Test:** separately measure first discovery, usable connection and first delivered multi-hop message under dense traffic, movement and locked/background OS states. Only trial advertising-scheduler changes on controllable gateway hardware; do not assume phone API control.

### 4. Carry-over, not new: September clock-drift study and fixed long-range relay
Pang et al., *Deconstructing BLE Multi-hop* (28 September), https://arxiv.org/abs/2609.34483 ; already in 9 October R5. DPCS/Zephyr and MeshCore/LoRaMesher source/licence screening is in `docs/research/rnd/intake/2026-10-03-ble/`. No independently verified BLE-specific peer-reviewed publication from 9–16 October was found that supersedes those results. Sparse bridging, density suppression, ~7-hop TTL and site-wide coverage still require physical evidence. **Test:** separate periodic relay power/recovery bench, then two BLE islands bridged by dedicated long-range gateways with bounded authenticated outer envelopes, explicit expiry and gateway failure controls.

## Code delivered in this branch (R6)
- `src/research/meshFieldTelemetry.ts`: pure bounded summary of the existing native MESH-01 recorder. Counts peak *observed link handles*, link up/down, relay scheduled/forwarded/cancelled, application delivery and duplicates; pairs native schedule/forward timestamps to obtain **application-level pending relay** p50/p95, not RF airtime. Does not reveal hashed link/frame IDs.
- `app/mesh-field.tsx`: read-only local observation panel after a frozen snapshot. Guard reuses this exact screen through `apps/guard/app/mesh-field.tsx`. Both are **internal field/debug builds**, never ordinary public/Guard releases.
- Deterministic host contracts in `tools/mesh-rnd/field-telemetry.node.cjs`; CI/scoped verification integration. All original MESH-01 JSONL rows and secure-sharing/SHA-256 controls unchanged.
- Evidence quality flag `RECORDED` means only intact start/stop boundaries and valid event order with no native recorder overflow, **not** a MESH-01 pass. Partial evidence remains `INCOMPLETE` and exportable. iOS dual-role handles may count the same remote phone twice; do not call handle count device density.

**Implementation/reuse:** no upstream code imported or new dependency installed. No mobile OS radio policy, native source, wire format (25-byte payload/47-byte native frame), TTL, default relay mode, firmware, Command backend or production telemetry path changed. R3 branch mode stays opt-in and main stays unmerged.

**Gate:** run unchanged A–B–C MESH-01 physically, then independent multi-link load/churn/partitioned-venue cohorts; evaluate exported per-device JSONL together and instrument controller events separately. Before any large-site or battery claim, test real Android/iOS foreground/background, traffic density, mobility, range, power and gateways. Suggested host reproduction: `node --test tools/mesh-rnd/field-telemetry.node.cjs`, `npm test -- --runInBand`, `npx tsc --noEmit`, `npm run lint`; native builds/phones remain unverified until actual runs.
