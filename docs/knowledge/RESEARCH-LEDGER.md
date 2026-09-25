# Research recovery and applicability ledger

Prepared 25 September 2026. Preserve this alongside the existing R&D catalogue, not instead of it. Rows marked historical were recovered from prior material, not independently re-audited in full today. This is a decision ledger, not a capacity or security claim.

## Recovered upstream body of work

The existing `docs/research/rnd/repository-snapshot.tsv` records 48 named inputs. The companion `retained-repository-source-audit.tsv` records inspected file objects, licences, permitted code/idea use, decisions and next gates. Its July status column is a historical date, not today's freshness.

| Workstream | Recovered candidate families | Useful transfer | Boundary |
|---|---|---|---|
| Phone mesh and lifecycle | BitChat, expo-bitchat, Columba, Weshnet | Topology, controlled forwarding, bounded queues, connection lifecycle, delayed delivery and reconciliation. | Recheck exact source and licence. Do not bulk-merge frameworks or adopt crypto by reputation. |
| Anchor/LoRa | MeshCore, LoRaMesher, Meshtastic, RadioLib and ecosystem tools | Route ageing, asymmetric-link handling, airtime accounting, diagnostics and radio adapters. | Dedicated radios are not phone BLE. Preserve regional configuration and hardware test gates. |
| Floor/zone inference | Bermuda, room-assistant, ESPresense, Navigine, blelocpp, NavCog, BaroFloorHeight, Find3 | Calibration, categorical likelihoods, hysteresis, relative pressure and capability profiles. | Missing/no/conflicting licences and restrictive terms remain barriers to copying code; ideas require independent implementation. |
| Building models and localisation | Anyplace, PALMS, S-Graphs, hdl_graph_slam, HOV-SG, NUFR-M3F, SLABIM, Hilti | Building/floor/room/connectors, registration, repeated-floor failures and held-out evaluation. | Dataset terms differ from code terms. A plausible map or simulator is not site truth. |
| Security providers and vectors | Noise implementations, libsodium, Swift Crypto, Tink, COSE, OpenMLS, libsignal and others in the ledger | Reviewed provider comparisons, test vectors, envelope and key-lifecycle design. | No provider was approved for deployment by this archive. Preserve existing security promotion gates. |

Recovered licence cautions include the BitChat iOS/Android distinction, the HOV-SG root/README conflict, no-licence BaroFloorHeight source, and separate dataset terms. These are historical review findings to recheck, not new legal advice.

## Selected external sources checked during recovery

### S1 — Relay redundancy

Valenzuela-Perez and colleagues, *A Study on Packet Error Rate in Bluetooth Mesh Networks With Relay Redundancy*, IEEE Internet of Things Journal, 2025. DOI `10.1109/JIOT.2025.3556119`.

Source: https://ieeexplore.ieee.org/document/10945757/

Finding: extra relays can worsen reliability in some Bluetooth SIG Mesh topologies. Applicability: motivates paired full-fanout versus controlled-fanout tests; it does not demonstrate Loc8 GATT performance. Preserve sparse sole-bridge cases and existing `SEC-01 E06`; do not choose a production relay fraction from the paper.

### S2 — Identifier privacy

Alghamdi, Verna and Mellia, *Learning to Link: Automatic Re-identification of BLE Devices Under MAC Address Randomisation*, submitted 17 September 2026; author preprint.

Source: https://arxiv.org/abs/2609.26079

Finding: address rotation alone need not remove linkability from observable advertisement metadata. Applicability: add a privacy review of stable application fields, timing and payload structure. Do not carry a dataset result or headline percentage into a Loc8 privacy claim. No Loc8 re-identification experiment was run here.

### S3 — Multi-technology positioning evaluation

Schwarzbach and Ammad, *From Least Squares to Deep Learning: Benchmarking Indoor Positioning on the HYMN Multi-Technology Dataset*, submitted 22 September 2026; author preprint.

Source: https://arxiv.org/abs/2609.25835

Dataset background: https://arxiv.org/abs/2604.20349

Finding: conclusions about learned positioning depend materially on evaluation at unseen spatial points. Applicability: separate fitting/calibration from held-out points, floors, devices and venues; compare simpler baselines. HYMN's industrial multi-technology hardware and ranging setup are not proof that ordinary Loc8 phones can reproduce its results. No Loc8 floor model was trained or benchmarked here.

### S4 — Android process lifecycle

Official documentation: https://developer.android.com/develop/connectivity/bluetooth/ble/background

Finding: background execution and process lifetime constrain communication. Applicability: retain physical foreground/background/locked/low-power/terminated/restart cohorts, plus permission and lifecycle fault injection. Documentation cannot certify supported Loc8 phone states.

### S5 — Age, lifetime and interrupted delivery

IETF RFC 9171, Bundle Protocol Version 7, January 2022.

Source: https://www.rfc-editor.org/rfc/rfc9171.html

Finding: message age/lifetime and forwarding hop count are distinct design concerns. Applicability: distinguish observation time, receipt time, expiry and retry lifetime. Do not insert Bundle Protocol wholesale into a 25-byte application frame. Persistent courier operation needs authenticated identity, explicit retention and a reviewed privacy model.

### S6 — Repository framework boundary

Exact version required by AGENTS.md: https://docs.expo.dev/versions/v57.0.0/

Read during recovery. No Expo/React Native/compiler upgrade is part of this change.

## Historical weekly leads requiring further verification

HERMES; a GATT/L2CAP presentation; Bluetooth multicast with acknowledgements; CVE-2026-5706; OMP/Open Mesh Protocol; multichannel mesh, Wirepas and additional BLE-LoRa discussions. These names were recovered as leads, not as complete source documents with verified applicability. Do not invent titles, authors, vulnerability consequences or performance numbers. Resolve the exact primary source and date before turning a lead into a requirement.

## Promotion rule

For every adopted finding record: source and pinned revision; what it actually tested; what differs in Loc8; proposed experiment; licence/privacy review; frozen acceptance thresholds; actual result; and PROMOTE/REPEAT/HOLD/STOP decision. Keep theoretical capacity, simulated delivery, mock transport, physical radio results and production support separate.
