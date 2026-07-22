# Research question register

This is the question backlog for the autonomous R&D programme. Questions are
prioritised by the cost of being wrong, the decision unlocked and whether another
workstream depends on the answer.

## How to use this register

- **P0:** answer now; blocks product truth, safe pilots or the core architecture.
- **P1:** answer next; likely differentiator or expensive build decision.
- **P2:** explore only after the P0/P1 dependency passes.
- **Watch:** revisit on a release, standards change or new customer evidence.

An answer requires the evidence named in the row. A design opinion or successful
single demo changes no state. Link completed work to a result directory and mark
the decision PROMOTE/REPEAT/HOLD/STOP.

## Current status — 2026-07-22

- `CONN-01`: **PROMOTE corrected boundary / REPEAT real integration / HOLD
  pilot**. The original 14-test
  [prototype](results/CONN-01/2026-07-22-secure-relay-prototype/README.md)
  is followed by the audited 24-test
  [product-boundary repeat](results/CONN-01/2026-07-22-product-boundary-repeat/README.md).
  Identity, durable stores, TLS/proxy, recovery and external review remain open.
- `SEC-01`–`SEC-04`: **PROMOTE research model / REPEAT specialist review**.
  Threat/identity and current-frame classification are recorded in the
  [protocol result](results/SEC-01/2026-07-22-protocol-v2-boundary/README.md).
- `SEC-05`: **NEXT reviewed-library/vector bake-off; HOLD implementation**.
  Include the corrected BitChat one-time-prekey source finding; copy no crypto
  merely because it is public domain.
- `SEC-06`/`SEC-07`: **PROMOTE candidate invariants / REPEAT native and
  interoperability**. Persistent replay/order and monotonic migration contracts
  pass the pure seam only.
- `MESH-06`–`MESH-10`: controlled fanout/routing/bounds now have useful
  synthetic contracts; physical, lossy, moving-peer, battery and native evidence
  remains REPEAT/HOLD according to `RDD-012`.
- `MESH-01`: **BLOCKED** until three physical phones can run the existing field
  protocol with direct A↔C reception excluded.
- `FLOOR-01`: **PROMOTE contract/core / REPEAT native pilot / HOLD field
  collection**. The preregistered
  [result](results/FLOOR-01/2026-07-22-corpus-contract/README.md) passed 40/40
  tests and the two-run 50,008-event replay gate. It is instrumentation evidence,
  not floor-accuracy or phone/building evidence.
- `MAP-01`: **NEXT autonomous investigation**, using FLOOR-01's frozen stable
  building/map/level/connector/landing ID seam.

## Mesh and device behaviour

| ID | Priority | Research question | Evidence required | Decision unlocked | Collection value |
|---|---|---|---|---|---|
| MESH-01 | P0 | Can A reach C only through physical phone B? | 200+ sequenced packets, radio isolation proof, relay logs, latency/loss/duplicates | Phone mesh GO/LIMITED/NO-GO | Existing Loc8 native mesh and E01 |
| MESH-02 | P0 | Which iOS/Android foreground, locked, background and low-power states scan, advertise and relay? | Device/OS state matrix with discovery/recovery timing | Supported operating model and UI warnings | Loc8, Columba lifecycle patterns |
| MESH-03 | P0 | What is shift-length battery cost at idle, normal and incident traffic? | 8-12 hour runs per supported cohort; screen/BLE/app attribution where possible | Battery budget and scan/fanout settings | BitChat adaptive behaviour; Meshtastic measurement discipline |
| MESH-04 | P0 | How do bodies, pockets, walls, phone orientation and competing 2.4 GHz change delivery? | Repeated controlled trials with distributions, not maximum range | Deployment density and honest coverage claims | Existing field protocol, Bermuda/ESPresense warnings |
| MESH-05 | P0 | Does mixed iOS/Android interoperate without connection storms, duplicates or stalls? | Cross-platform sequences, reconnect and callback-loss cases | Platform support and native-module priorities | Columba, expo-bitchat scaffolding |
| MESH-06 | P1 | At what peer density does full fanout collapse? | Simulator plus packet replay and a smaller physical-density test | Controlled-fanout threshold and congestion policy | BitChat deterministic fanout; Meshtastic airtime |
| MESH-07 | P1 | What dedup size/expiry prevents loops without suppressing valid repeat messages? | Collision/replay/flood tests over realistic rates and restarts | Dedup algorithm and persistence rules | BitChat and MeshCore dedup implementations |
| MESH-08 | P1 | Does stable peer/topology knowledge improve delivery enough to justify metadata/state? | A/B flood versus directed/source-route runs under moving and failing peers | Protocol-v2 route strategy | BitChat topology/source routing; MeshCore paths |
| MESH-09 | P1 | When no route exists, do bounded couriers improve operational delivery without privacy or battery harm? | Delay-tolerant scenarios, copy/quota attacks, expiry and recipient privacy evaluation | Courier/store-forward feature | BitChat courier/outbox; Weshnet replication concepts |
| MESH-10 | P1 | What are the safe packet, fragment, queue, retry and peer bounds under hostile traffic? | Fuzz/load/resource-exhaustion tests on both platforms | DoS limits and protocol constants | BitChat bounded assemblies/outboxes |
| MESH-11 | P2 | Is Wi-Fi Aware/peer-to-peer worth a future high-capacity local transport? | Platform/background/compatibility prototype after BLE proof | Add/kill transport | BitChat transport abstraction |
| MESH-12 | Watch | Which upstream BitChat changes/security fixes should Loc8 port? | Quarterly diff, release/security review and regression relevance | Upgrade or no action | Public-domain BitChat repository |

## Protocol, security, identity and privacy

| ID | Priority | Research question | Evidence required | Decision unlocked | Collection value |
|---|---|---|---|---|---|
| SEC-01 | P0 | Who/what is trusted in consumer, Guard, Command, Gateway and anchor modes? | Threat model with assets, actors, trust boundaries, abuse cases and safety impact | Protocol-v2 scope | BitChat/Reticulum architecture as references |
| SEC-02 | P0 | What identifies a person, app install, device, site, team and shift—and which identifiers may appear over radio? | Identity lifecycle and unlinkability analysis | Key/identifier data model | BitChat static identity + ephemeral IDs |
| SEC-03 | P0 | How are site/shift membership, roles and revocation proven offline? | Lost/stolen/removed-device and expired-shift test scenarios | Authorisation protocol | BitChat signing/QR patterns; Loc8 TrustLayer baseline |
| SEC-04 | P0 | Which payload and metadata fields require confidentiality, authenticity or only integrity? | Field-by-field data classification and traffic-analysis review | Envelope and privacy design | Current 25-byte codec inventory |
| SEC-05 | P0 | What live and offline encryption pattern meets forward-secrecy and delayed-delivery needs? | Design comparison, public test vectors, specialist review plan | Noise/session/sealed-envelope selection | BitChat Noise XX/X; do not use MeshCore custom crypto |
| SEC-06 | P0 | How are replay, reordering, duplicate delivery and clock failure handled offline? | Restart, stale clock, sequence wrap, delayed packet and partition tests | Replay/freshness semantics | Current TrustLayer; BitChat timestamp/dedup rules |
| SEC-07 | P1 | How do protocol v1 and v2 coexist without downgrade attacks or false interoperability? | Migration state machine and adversarial compatibility tests | Rollout strategy | Existing Loc8 frame + BitChat-derived envelope |
| SEC-08 | P1 | How are device loss, panic wipe, recovery and key backup handled without central connectivity? | Tabletop and implementation drills | Operational recovery model | BitChat panic wipe/outbox; Gateway PKI specs |
| SEC-09 | P1 | Can radio identifiers rotate while preserving routing, acknowledgements and operator audit? | Linkability analysis and route/delivery tests | Pseudonym strategy | BitChat ephemeral IDs/topology |
| SEC-10 | P1 | What is the minimum externally auditable crypto surface? | Dependency/source inventory, test vectors, fuzz plan, review quote/scope | Build versus adopt boundary | Public-domain BitChat components |
| SEC-11 | P1 | How are signed anchors commissioned, moved, revoked and detected as stale/tampered? | Relocation/spoof/dead-anchor tests and installer workflow | Trusted floor/zone anchors | MeshCore admin patterns only as reference |
| SEC-12 | P2 | Can privacy-preserving aggregate coverage/occupancy metrics be useful without person trails? | Data-minimisation prototype and utility/privacy evaluation | Data product scope | Weshnet/Find3 concepts; Loc8 consent model |

## Connected product and Gateway-facing service

| ID | Priority | Research question | Evidence required | Decision unlocked | Collection value |
|---|---|---|---|---|---|
| CONN-01 | P0 | What is the minimum safe connected pilot architecture? | Threat model, WSS/auth/site isolation/durable audit/restore design and hostile-client tests | Pilot engineering scope | Current bridge is the negative baseline |
| CONN-02 | P0 | Can a client inject into another site or impersonate Guard/Command/operator roles? | Automated tenant/role/replay test matrix | Authorisation acceptance gate | Loc8 ops grammar and bridge |
| CONN-03 | P0 | What audit record is required to reconstruct an incident, and how is tail truncation detected? | Scenario reconstruction, hash chain, externally signed head/count and restore tests | Server audit schema | Existing Command localStorage limitations; Loc8OS spec |
| CONN-04 | P0 | What happens when venue IP, DNS/mDNS, Command, Gateway or uplink fails independently? | Failure-injection matrix and recovery times | Degradation UX/runbook | Loc8 system degradation ladder |
| CONN-05 | P0 | What operator/device login and enrolment workflow works for temporary teams? | Prototype task test, revocation and role-error cases | Identity/SSO choice | Current static/demo identity baseline |
| CONN-06 | P1 | What server state is authoritative during reconnect, duplicate Gateway delivery or clock skew? | Partition/reconnect/merge tests | Event consistency model | Weshnet event-log ideas; Loc8OS `sited` spec |
| CONN-07 | P1 | Can the connected service be deployed, monitored, backed up and restored by someone other than its developer? | Fresh-machine runbook test and recovery drill | Operational readiness | Loc8OS service model |
| CONN-08 | P1 | What data retention/export/deletion choices do real pilot customers require? | Buyer/DPO interviews plus configurable prototype | Data policy/product controls | Existing privacy strategy |
| CONN-09 | P1 | What latency/reliability is required for SOS, muster, chat and telemetry separately? | Operator exercises and traffic-priority load tests | QoS and SLA boundaries | Meshtastic priority/airtime concepts |
| CONN-10 | P2 | Is a Tauri desktop wrapper necessary for deployment or is a managed browser sufficient? | Claim/provisioning/security/support task comparison | Desktop build or stop | Existing Command web app |

## Floor detection and vertical movement

| ID | Priority | Research question | Evidence required | Decision unlocked | Collection value |
|---|---|---|---|---|---|
| FLOOR-01 | P0 | What exact sensor/event/ground-truth schema will produce reusable floor data? | Schema review, timestamp sync test, consent/retention plan and pilot recording | Logger implementation | Navigine, MagneFi-like fields, current engine |
| FLOOR-02 | P0 | How accurate is the current 0.42 hPa/3.5 m threshold by phone, building, weather and transition type? | Held-out labelled corpus and same-floor controls | Honest baseline and replacement case | Current floor tracker |
| FLOOR-03 | P0 | Which phone models lack a usable barometer or produce unstable/blocked readings? | Capability/quality matrix and rejection criteria | Device profiles/fallback UX | NavCog device allowlist lesson |
| FLOOR-04 | P0 | Does a signed landing anchor plus hysteresis initialise/correct floor reliably? | Known-floor passes, radio leakage, moved/stale/spoofed-anchor cases | Anchor deployment baseline | Bermuda algorithms |
| FLOOR-05 | P0 | Does topology-constrained HMM/Viterbi beat threshold and radio-only baselines on unseen buildings/devices? | Pre-registered E04 split evaluation | Estimator promotion | Navigine, blelocpp, Viterbi research |
| FLOOR-06 | P1 | How much does a fixed venue pressure reference reduce weather/HVAC/cross-phone error? | Simultaneous fixed/phone sensors over days and pressure-zone events | Gateway/anchor sensor requirement | Barometer research synthesis |
| FLOOR-07 | P1 | Can stairs, lift, escalator and ramp be distinguished reliably enough to improve transitions? | Mode-labelled IMU/pressure corpus with false-mode costs | Motion observation model | Microsoft study; S-Graphs state-machine idea |
| FLOOR-08 | P1 | Should height be learned per building, floor pair or connector? | Hierarchical model comparison with held-out walks | Calibration model | BaroFloorHeight idea; independently implement |
| FLOOR-09 | P1 | What posterior confidence/persistence should change an operationally displayed floor? | Cost-sensitive error analysis and operator comprehension study | UI/service thresholds | Confidence-native product thesis |
| FLOOR-10 | P1 | How should contradictory manual, anchor, radio, barometer and map evidence resolve? | Injected conflict matrix and audit review | Evidence trust policy | Proposed `FloorEstimate` contract |
| FLOOR-11 | P1 | Can magnetic fingerprints add value that survives device/orientation/building variation? | Cross-device/orientation holdout using internal or MagneFi-compatible data | Add/kill magnetometer feature | MagneFi; Find3 baseline |
| FLOOR-12 | P2 | Does Android Wi-Fi RTT materially improve floor/zone accuracy at supported sites? | Three+ surveyed FTM AP trial, foreground/battery/error data | Premium Android tier | Navigine input support; Android API |
| FLOOR-13 | P2 | Is BLE AoA/UWB worth specialist installed hardware versus simple landing anchors? | Cost/calibration/outcome comparison | Precision tier build/kill | Bluetooth Direction Finding research |
| FLOOR-14 | P2 | Can floor estimates be corrected retrospectively without confusing incident audit? | Viterbi-history and operator-timeline prototype | Event correction semantics | Viterbi research |

## Building mapping and operational digital twin

| ID | Priority | Research question | Evidence required | Decision unlocked | Collection value |
|---|---|---|---|---|---|
| MAP-01 | P0 | What minimum semantic graph supports current Guard/Command, floor fusion and cross-floor routing? | Schema against real scenarios and one building | Domain model v1 | Anyplace, OSM Indoor, Loc8 workflows |
| MAP-02 | P0 | How are human floor labels separated from stable IDs, order and elevation? | Basements, G/0/1, mezzanine, skipped-floor fixtures | Level data model | OSM `level`/`level:ref` |
| MAP-03 | P0 | How are stairs, lifts, escalators, ramps and inaccessible/skipped landings represented? | Multi-connector route fixtures and validation | Connector graph | Anyplace/S-Graphs/OSM concepts |
| MAP-04 | P0 | Can an installer import and trace a plan with explicit scale/control-point uncertainty? | One real plan, residuals, corrections and repeat operator | Manual commissioning baseline | Hilti as-planned/as-built lesson |
| MAP-05 | P1 | What raw/derived/provenance/version model allows remapping and rollback? | Rebuild an old map version from immutable source observations | Map governance | Research mapping synthesis |
| MAP-06 | P1 | Does Apple RoomPlan reduce commissioning time/error across multi-room and multi-floor scans? | Manual versus RoomPlan task comparison on supported iPhones | iOS mapping accelerator | Apple `CapturedStructure` |
| MAP-07 | P1 | Does PALMS enable useful relocalisation against known plans with LiDAR or monocular phones? | Reproduction on local plans/device cohorts | Installer relocalisation method | MIT PALMS |
| MAP-08 | P1 | Which geometry errors matter operationally: walls, doors, connectors, exits or object detail? | Sensitivity tests against routing/search tasks | Mapping QA priorities | hdl_graph_slam/HOV-SG ideas |
| MAP-09 | P1 | Can floor-plane constraints reduce AR/SLAM drift without confusing physical planes and semantic floors? | Plane extraction/registration comparison and failure cases | Geometry module | BSD hdl_graph_slam |
| MAP-10 | P1 | Can a second installer reproduce a commissioned building without developer help? | Timed usability/rework test and topology completeness | Service scalability | E08 |
| MAP-11 | P2 | Which BIM/IFC/CAD/OSM imports are demanded by buyers and safe to support first? | Customer artefact sample and conversion fidelity | Import roadmap | Anyplace/OSM/Hilti references |
| MAP-12 | P2 | Can visual/semantic object detection reduce work without creating unsafe false certainty? | Human-reviewed precision/recall and time saved | Semantic automation scope | HOV-SG learn-only architecture |

## Gateway, anchors, LoRa and physical infrastructure

| ID | Priority | Research question | Evidence required | Decision unlocked | Collection value |
|---|---|---|---|---|---|
| HW-01 | P0 | Is a fixed calibrated pressure reference useful enough to include in Gateway/anchor hardware? | FLOOR-06 multi-day result and BOM/power impact | Sensor/BOM decision | Floor research |
| HW-02 | P1 | Can Linux BLE `loc8-meshd` interoperate reliably with two phones? | Bench packet/reconnect/background traces | Gateway radio path | Existing Loc8 protocol |
| HW-03 | P1 | What RTC/NTP fallback preserves trustworthy offline event time across power cycles? | Cold boot, dead uplink, clock rollback and audit tests | Gateway time architecture | Master checklist gap |
| HW-04 | P1 | What power, thermal and battery reserve are measured under real service/radio loads? | Instrumented Tier B/C-like bench runs and shutdown drill | BOM/service interval/claims | Existing battery synthesis |
| HW-05 | P1 | Can a dead Gateway be swapped and restored without losing identity/site/audit state? | Timed box-swap and restore exercise | DR design | Master checklist gap |
| HW-06 | P1 | How do multiple Gateways deduplicate, elect ownership and survive partitions? | Simulator/bench split-brain and merge tests | Stadium/multi-box architecture | Weshnet event log concepts; BitChat dedup |
| HW-07 | P1 | How should fleet health distinguish dead, isolated and intentionally offline sites? | Expected-heartbeat model and failure simulations | HQ monitoring | Master checklist gap |
| HW-08 | P1 | What is the minimum signed floor/zone anchor hardware and commissioning/security workflow? | Prototype, relocation/tamper, battery and radio tests | Anchor v1 | Bermuda evidence model; MeshCore hardware options |
| HW-09 | P2 | Does a custom carrier board create enough reliability/service value to justify NRE? | Off-the-shelf bench evidence, failure modes and costed alternatives | Carrier build/stop | Current Gateway specification |
| HW-10 | P2 | What certification/regulatory path applies to each deployment tier and radio configuration? | Specialist review against final BOM/markets | Productisation budget/timeline | Existing compliance research; refresh when BOM stabilises |

## LoRa/backbone and coverage

| ID | Priority | Research question | Evidence required | Decision unlocked | Collection value |
|---|---|---|---|---|---|
| RADIO-01 | P1 | MeshCore or LoRaMesher: which carrier performs better in relevant venue topologies? | Same-radio/power/antenna trial with latency/loss/airtime/recovery/admin metrics | Experimental backbone choice | Both MIT repositories |
| RADIO-02 | P1 | Can Loc8 application envelopes cross BLE↔LoRa without weakening identity/security or duplicating events? | Adapter conformance and loop/dedup tests | Gateway/anchor translation design | Transport abstraction; MeshCore companion protocol |
| RADIO-03 | P1 | Where does LoRa add value inside concrete multi-floor buildings versus outdoor seams/campus links? | Basement/stairwell/plant/outdoor traces | Deployment recipes | MeshCore/Meshtastic ecosystem |
| RADIO-04 | P1 | What airtime/duty-cycle budget supports emergency traffic legally and reliably? | Region/profile calculations plus measured packet airtime and congestion | Payload/QoS/radio settings | RadioLib/Meshtastic measurement patterns |
| RADIO-05 | P1 | Does a stateless anchor mesh avoid Gateway single-point failure without creating routing storms? | Gateway-loss and anchor partition/rejoin tests | Anchor routing model | MeshCore/LoRaMesher; existing Loc8 design |
| RADIO-06 | P1 | Can commissioning observations predict held-out dead zones and repeater positions? | Withheld-area validation and manual-installer comparison | Placement recommender | MeshCore diagnostic ecosystem |
| RADIO-07 | P2 | Which commercial radio modules/antennas survive venue installation, power and regulatory constraints? | Bench/environmental/vendor evidence after carrier selection | Hardware shortlist | RadioLib hardware breadth |
| RADIO-08 | Watch | Do MeshCore/Meshtastic ecosystem changes reduce Loc8's need for custom firmware? | Quarterly capability/licence/interoperability review | Adopt/fork/custom decision | `awesome-meshcore`, firmware repos |

## Human factors, operations and safety

| ID | Priority | Research question | Evidence required | Decision unlocked | Collection value |
|---|---|---|---|---|---|
| OPS-01 | P0 | What exactly counts as expected, present, absent, exempt and unknown in a real muster? | Workflow interviews and tabletop event reconstruction | Muster data/UX truth | Current Guard/Command |
| OPS-02 | P0 | Can temporary/volunteer staff join and respond correctly after a five-minute briefing? | Observed task completion and errors with representative users | Pilot scope/onboarding | Current apps |
| OPS-03 | P0 | Which outcome should the first pilot prove: acknowledgement, muster, search or lone-worker response? | Buyer/operator agreement and measurable baseline | Pilot design | Business research |
| OPS-04 | P1 | How should low-confidence/stale floor or position be communicated under stress? | Comprehension/error study using incident scenarios | Confidence UI | Floor programme |
| OPS-05 | P1 | What happens when alerts conflict, repeat, arrive late or lose acknowledgement? | Failure-injected exercise | Alert/QoS/escalation design | Protocol experiments |
| OPS-06 | P1 | Does Loc8 reduce operator uncertainty or merely add another screen/radio channel? | Comparative exercise and workload/error measure | Product value/stop | Current Command |
| OPS-07 | P1 | What accessibility, noisy-environment, glove, low-light and language constraints change the workflow? | Representative task matrix | UI/haptics/audio/localisation priorities | Existing haptics and app design |
| OPS-08 | P1 | How should a human correction override automation and remain auditable? | Correction/reversal scenario test | Floor/incident audit semantics | Confidence-native design |
| OPS-09 | P2 | Which assisted-search routing information helps responders without encouraging unsafe reliance? | Expert scenario review and bounded exercise | Search feature scope | Building/coverage graph |
| OPS-10 | P2 | Can deployment and incident exercises become a customer evidence/certification-like pack? | Buyer review of commissioning report and willingness to rely/pay | Service/product packaging | R&D evidence structure |

## Data, models and defensibility

| ID | Priority | Research question | Evidence required | Decision unlocked | Collection value |
|---|---|---|---|---|---|
| DATA-01 | P0 | Which raw data is necessary for each research question, and what can be discarded/derived locally? | Data inventory mapped to decisions, consent and retention | Collection architecture | Existing privacy strategy |
| DATA-02 | P0 | How will timestamps, device/app/OS versions, maps and ground truth remain aligned? | Manifest schema and replay of one full experiment | Reproducibility | Proposed result structure |
| DATA-03 | P1 | Which features generalise across phones/buildings and which require local calibration? | Leave-one-device/building-out evaluation | Global versus venue model boundary | Floor/RF corpus |
| DATA-04 | P1 | Can uncertainty be calibrated so 80% confidence is correct about 80% of the time? | Reliability diagrams/Brier score by cohort | Safe confidence claims | Floor/coverage estimators |
| DATA-05 | P1 | What labelled data becomes a defensible asset rather than customer-specific exhaust? | Reuse/value/privacy review across sites | Data strategy | Loc8 field corpus |
| DATA-06 | P1 | Can placement/coverage models improve without retaining identifiable person trails? | Aggregated feature utility comparison | Privacy-preserving data moat | Coverage programme |
| DATA-07 | P1 | When is a transparent probabilistic model beaten by ML enough to justify complexity? | Locked baseline, held-out gains, calibration, explainability and maintenance cost | ML promotion/stop | Find3/mCEL ideas as baselines only |
| DATA-08 | P1 | How are bad/moved anchors, map errors and label mistakes detected rather than learned? | Poison/noise tests and review workflow | Data QA | Anchor/map versioning |
| DATA-09 | P2 | Can simulation generate useful pre-field cases without biasing reported field performance? | Sim-to-real correlation on observed traces | Simulator role | MeshCore/Meshtastic tools |
| DATA-10 | Watch | Which public datasets remain legally usable for commercial evaluation/training? | Asset-level licence/consent review at time of use | Dataset inclusion | NUFR-M3F likely; Hilti non-commercial; others vary |

## Commercial, procurement and market evidence

| ID | Priority | Research question | Evidence required | Decision unlocked | Collection value |
|---|---|---|---|---|---|
| BIZ-01 | P0 | Which buyer owns the painful workflow and can sign a bounded pilot? | Direct interviews with signer, operator and blocker roles | Target/account motion | GTM research baseline |
| BIZ-02 | P0 | What incident volume and current response time make the product economically meaningful? | Customer logs/estimates with provenance and sensitivity ranges | ROI and pilot metric | Open lost-child/incident question |
| BIZ-03 | P0 | Does the venue have usable site-wide networking where the team actually works? | On-site network survey, failure history and policy constraints | Connected-only versus Gateway requirement | Existing GTM open question |
| BIZ-04 | P0 | Will a buyer accept connected-first without mesh/hardware, and for which workflow? | Proposal/concept test tied to price and implementation | Near-term product | Current business strategy |
| BIZ-05 | P0 | What prevents temporary staff from installing, joining or keeping the app active? | Observed pilot rehearsal and abandonment reasons | Adoption design/pilot size | Volunteer problem research |
| BIZ-06 | P1 | Which capability changes willingness to pay: audit, muster, SOS, search, offline resilience or mapping? | Forced trade-off/conjoint-style interviews and proposal response | Roadmap/pricing | Current product doors |
| BIZ-07 | P1 | What setup, support and hardware burden destroys gross margin? | Bottom-up time/BOM/support model validated on a rehearsal | Service tier and price | Gateway/commissioning plans |
| BIZ-08 | P1 | Is the revenue unit event, site-year, contractor portfolio or hardware rental? | Buyer procurement/budget evidence and renewal logic | Commercial packaging | GTM site-licence thesis |
| BIZ-09 | P1 | Which incumbent workflow/vendor is displaced, complemented or required to integrate? | Current-stack interviews and hands-on competitor trials where lawful | Positioning/integration strategy | Existing competitor corrections |
| BIZ-10 | P1 | What evidence does H&S, security, IT, DPO, insurer and procurement each require? | Role-specific objection/evidence matrix | Evidence pack and sales sequence | Compliance/GTM research |
| BIZ-11 | P1 | Does a commissioning/coverage report have standalone paid value? | Customer concept/price test and comparison to existing surveys | Services/data product | Operational twin thesis |
| BIZ-12 | P2 | Which second vertical reuses the same workflow and deployment physics with least change? | Scored evidence after first pilot; no TAM-only ranking | Expansion sequence | Existing vertical research |
| BIZ-13 | Watch | Have laws, standards, tenders or competitor claims changed the forcing function? | Current primary-source refresh before any claim/proposal | Message/compliance adjustment | GTM correction discipline |

## Open-source adoption and maintenance

| ID | Priority | Research question | Evidence required | Decision unlocked | Collection value |
|---|---|---|---|---|---|
| OSS-01 | P0 | Which exact BitChat files/components should be adopted, and what are their transitive dependencies? | File-level provenance/licence/API/test inventory | Protocol-v2 adoption units | Public-domain BitChat |
| OSS-02 | P1 | Does Bermuda's filtering/hysteresis beat a clean Loc8 baseline on our anchor data? | Reimplemented/adapted A/B test with attribution | Anchor algorithm | MIT Bermuda |
| OSS-03 | P1 | Which Navigine/blelocpp components are cleanly separable and maintainable in Loc8's TypeScript/native architecture? | Dependency/API/port/test spike | Reuse versus reimplement | MIT projects |
| OSS-04 | P1 | Can PALMS be reproduced on current supported phones and local floor plans? | Environment build, local run, error/time/device report | Mapping accelerator | MIT PALMS |
| OSS-05 | P1 | What obligations arise from using MPL Columba patterns/files, and can clean implementation avoid product disclosure ambiguity? | Legal/provenance review before file reuse | BLE lifecycle implementation route | MPL Columba |
| OSS-06 | P1 | Which Anyplace schemas/algorithms remain useful without importing its old stack? | Extracted model comparison and tests | Data model reuse | MIT Anyplace |
| OSS-07 | P1 | Are MeshCore/Open client protocol libraries stable enough to integrate, or should Loc8 maintain a narrow adapter? | Interop/version-break test and maintenance assessment | LoRa adapter ownership | MIT MeshCore ecosystem |
| OSS-08 | Watch | Have repository licences or commercial-use statements changed? | Quarterly root/file/package licence scan and maintainer confirmation where conflicting | Continue/stop adoption | HOV-SG conflict, Reticulum custom terms |

## Cross-program questions

| ID | Priority | Research question | Evidence required | Decision unlocked |
|---|---|---|---|---|
| X-01 | P0 | What result would make us stop calling phone-to-phone relay the moat? | Pre-agreed MESH-01/02/03 thresholds | Prevent sunk-cost continuation |
| X-02 | P0 | What minimum evidence permits a paid connected pilot without implying emergency-grade assurance? | CONN and OPS gates plus written scope | Honest pilot launch |
| X-03 | P1 | What unique customer outcome requires the building graph, floor fusion and communications graph together? | Operational exercise/customer evidence | Digital-twin roadmap |
| X-04 | P1 | Which single experiment has the highest expected decision value each week? | Updated cost-of-delay, probability and consequence score | Weekly autonomous queue |
| X-05 | P1 | What has R&D learned that invalidates a current README, deck, specification or price? | Weekly claim audit | Product truth update |
| X-06 | P1 | Which active project should be killed or held to fund replication? | Monthly portfolio review | Capacity reallocation |

## Initial NOW / NEXT / LATER board

### NOW — no more than three active decision questions

1. `MAP-01` — minimum semantic building graph aligned to frozen FLOOR-01 IDs.
2. `SEC-05` — reviewed crypto/library, logical-frame, credential and prekey
   vector bake-off; implementation remains HOLD.
3. `FLOOR-01` native repeat preparation — exact Expo adapter seam and approved
   iOS/Android physical protocol; field collection itself remains HOLD.

`MESH-01` outranks these when the three-device physical setup is available; until
then it is a named external-evidence blocker, not simulated progress.

### NEXT — prepared while NOW runs

- `MESH-02`, `MESH-03` — device state and shift battery.
- `MAP-02` through `MAP-04` — graph edge cases and first real building after
  MAP-01's pure schema gate.
- `OPS-01` through `OPS-03` — muster truth and pilot outcome.
- `SEC-06`, `SEC-07` — native replay/migration/interoperability repeats after
  `SEC-05` selects the reviewed provider boundary.
- `CONN-01` — real identity, durable stores and pinned TLS/proxy adapter repeat
  as product development; pilot remains HOLD.
- `FLOOR-02` through `FLOOR-05` — baselines, anchors and fusion.

### LATER — explicitly gated

- `RADIO-01` MeshCore versus LoRaMesher: after mesh/bench evidence or signed pilot
  need.
- `FLOOR-12/13` RTT/AoA/UWB: after simple fusion and anchor baseline.
- `MAP-06/07/09/12` advanced mapping automation: after manual commissioning v1.
- `HW-06/09/10` multi-Gateway/custom carrier/certification: after single-site
  architecture and commercial demand.
- machine learning beyond baselines: after the corpus and transparent estimator
  exist.

## Definition of a resolved question

A question is resolved only when:

1. its protocol and success/failure criteria were written before looking at the
   final result;
2. raw evidence and version manifest are durable;
3. results include distributions and cohort failures, not only averages;
4. licensing, privacy and consent are recorded;
5. the decision is PROMOTE/REPEAT/HOLD/STOP;
6. the downstream roadmap/specification/claim is updated; and
7. the next question or stop action is explicit.
