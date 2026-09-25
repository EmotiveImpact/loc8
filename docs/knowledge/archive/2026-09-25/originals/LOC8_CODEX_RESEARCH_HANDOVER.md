# Loc8 Codex Research and Repository Handover

**Prepared:** 22 July 2026  
**Purpose:** Give Codex the product truth, known evidence, open technical risks, research programme, repository-audit instructions and a ready-to-paste continuation prompt.  
**Audience:** Codex or another engineering research agent working with the full Loc8 repository.

> This is a research and audit brief, not proof that the radio architecture works at scale. It deliberately separates product intent, reported implementation status, external platform facts, proposals and experiments still required.

---

## 1. How to use this file

Place this file at the root of the Loc8 repository and give Codex the prompt in section 18.

Codex must use this order of authority:

1. **Product intent and fixed constraints:** this file and `BRIEFING-FOR-AI.md`.
2. **Implementation truth:** the current repository, tests, build output and physical-device results.
3. **External facts:** current primary documentation, standards, regulations and peer-reviewed research.
4. **Earlier conversation and the old arena PDF:** historical context only. They are not authoritative.

If the repository conflicts with the briefing:

- The repository wins when describing what is actually implemented.
- The briefing wins when describing what Loc8 is intended to be.
- Codex must record the conflict. It must not silently change either side to make them agree.

Use these evidence labels in every research document:

| Label | Meaning |
|---|---|
| `CODE-VERIFIED` | Located in the repository and traced to a concrete implementation or test. |
| `DEVICE-VERIFIED` | Reproduced on named physical devices with logs and conditions recorded. |
| `EXTERNALLY-VERIFIED` | Supported by a current primary source. |
| `BRIEFING-CLAIM` | Reported by the existing Loc8 briefing, but not yet independently audited. |
| `PROPOSED` | A design recommendation, not current behaviour. |
| `EXPERIMENT-REQUIRED` | Cannot be settled by documentation or code inspection alone. |
| `UNKNOWN` | Evidence has not yet been found. |

Do not convert a `BRIEFING-CLAIM` into a fact merely because it appears in this handover.

---

## 2. Loc8 in one paragraph

Loc8 is an offline friend-finder for festivals, arenas, stadiums, nightclubs, cruise ships and other places where mobile data becomes unusable. A person opens the app, sees their crew as blips on a radar, follows a compass and receives a proximity confirmation when close. It is intended to require no mobile signal, Wi-Fi, account or server. Its defining technical proposition is a custom connectionless Bluetooth Low Energy advertising mesh in which ordinary phones relay small encrypted or eventually encrypted frames for other users, including strangers, without pairing or maintained connections. Optional venue hardware improves coverage, but the consumer phone mesh must still work without it.

Loc8 also has a professional product family:

| Product | User | Main job | Reported status |
|---|---|---|---|
| **Loc8 Consumer** | Festival-goers and groups | Radar, compass, proximity and crew finding | `BRIEFING-CLAIM`: built |
| **Loc8 Guard** | Venue security teams | Team map, SOS, dispatch, status, duress, lone-worker timer and muster | `BRIEFING-CLAIM`: built |
| **Loc8 Command** | Venue control room | Incident timelines, muster, coverage heatmap, audit log and responder dispatch | `BRIEFING-CLAIM`: built |
| **Partner SDK** | Third-party apps | Embed Loc8 finding in another application | `BRIEFING-CLAIM`: unwritten |

The intended software rule is that all products share one `@loc8/engine`; it must not be forked into separate protocol implementations.

---

## 3. Non-negotiable product constraints

Treat these as fixed unless the founder explicitly changes them:

1. BLE advertising is the base transport because it permits connectionless one-to-many discovery and potential stranger relay.
2. Phones are intended to relay. They are not merely endpoints receiving venue broadcasts.
3. The consumer product must work with zero installed infrastructure.
4. No consumer account or internet-connected server may be required for the core finding flow.
5. The current application frame target is 25 bytes because it is intended to fit within legacy advertising constraints.
6. Phones use BLE only. They do not transmit or receive LoRa directly.
7. Optional Anchors and the Gateway may amplify the phone mesh but must not become a prerequisite for basic consumer operation.
8. UK launch is first. Radio design must be checked against current Ofcom requirements, applicable designated standards, the Radio Equipment Regulations 2017 and Bluetooth qualification obligations.
9. Loc8 must never be marketed as an emergency communications system. Guard and Command supplement venue operations but do not replace the PA, radios, emergency services, stewarding procedures or statutory systems.
10. Recommendations must preserve the degradation ladder: loss of HQ must not stop the site; loss of LAN must not stop local radio activity; loss of the Gateway must leave phone-to-phone finding available.

Do not propose Wi-Fi Aware, Nearby Connections, GATT connections, venue Wi-Fi or mobile data as a replacement for the base BLE stranger-relay path. They may be investigated only as optional accelerators for a separate use case after the BLE feasibility gate has been passed.

### 3.1 What the earlier arena research got wrong

An earlier 29-page report answered a different question: how fixed long-range BLE beacons could broadcast small identifiers across an arena. It recommended a powered fixed-node backbone and treated audience phones mainly as receivers. That report is superseded for Loc8 because it removes the phone-relay property that defines the product.

Do not carry these earlier conclusions into Loc8 architecture:

- “One beacon can serve an unlimited number of people” applies only to passive listeners receiving the same broadcast. It says nothing about thousands of phones originating and relaying distinct location packets.
- “Approximately 20 connections per radio” concerns maintained BLE connections. Loc8 is intended to use connectionless advertising, so it is not the relevant limit.
- “32,767 people on a Bluetooth mesh” confuses the Bluetooth SIG Mesh unicast address space with capacity. Loc8 is a separate custom protocol.
- “Four to eight long-range nodes cover an arena” is not a Loc8 deployment rule. Coverage must be measured on the weaker phone uplink and around the venue's actual geometry and crowd.
- “A 100-metre range gives a 200-metre diameter” is geometry applied to a vendor-style range claim, not evidence of useful bidirectional service in a packed venue.

Useful parts of the earlier investigation may still be retained as hypotheses:

- Connectionless advertising can have many listeners without one connection per listener.
- Elevated, overlapping fixed nodes can improve coverage and redundancy.
- A front-end module can improve receive sensitivity as well as transmit power.
- UK transmit power, antenna gain and channel-access rules constrain finished hardware.
- Empty-field range does not predict range through bodies, pockets, walls and steelwork.

The old PDF and its generator may remain in the working materials for provenance, but they must be marked **superseded** and must not be presented to venues or investors as the Loc8 system design.

---

## 4. Intended architecture

### 4.1 Phone layer

The crowd is intended to form a custom store-and-forward or receive-and-rebroadcast network using BLE advertising. It is **not** Bluetooth SIG Mesh. There is no provisioning of every phone into a SIG mesh, no GATT Proxy requirement and no maintained connection to a relay.

Intended relay behaviour from the briefing:

- Receive a Loc8 frame from any nearby participating device.
- Reject invalid, expired or already-seen frames.
- Decrease TTL or otherwise enforce a hop limit.
- Schedule a rebroadcast with collision-control behaviour.
- Forward even when the frame belongs to a stranger's crew and its payload cannot be decrypted locally.
- Never forward the same packet twice.

The last four bullets are architectural intent. Codex must locate their exact implementation and test coverage.

### 4.2 Loc8 Gateway

The Gateway is the one logical brain per venue, not a large Anchor. Intended responsibilities include:

- Site database
- Local Command API
- Radio bridge into the phone/Anchor network
- Hash-chained audit log
- Site identity and key infrastructure
- Optional HQ synchronisation
- Anchor commissioning and health
- Durable local operation when internet access is absent

`BRIEFING-CLAIM`: one Gateway is fully specified, with a standard-tier parts cost of approximately US$93 to US$113, but no physical Gateway has been built.

### 4.3 Loc8 Anchor

An Anchor is intended to be an inexpensive, pole-mounted radio translator:

- BLE receive and rebroadcast
- Optional BLE-to-LoRa and LoRa-to-BLE translation
- No venue database
- No durable operational state beyond identity, provisioning and firmware configuration
- Safe failure, where loss of an Anchor shrinks coverage but loses no authoritative data

Calling an Anchor stateless does **not** mean it can have no memory. It still needs controlled transient state such as a deduplication cache, relay queue, loop-prevention information, watchdog state and radio metrics.

`BRIEFING-CLAIM`: estimated Anchor cost is approximately £60 to £75 after including a front-end module. Anchors have not been built.

### 4.4 LoRa trunk

LoRa is intended only for Anchor-to-Anchor or Anchor-to-Gateway transport across empty ground. Phones never hear it. The exact design is not yet settled:

- Raw LoRa versus LoRaWAN is `UNKNOWN`.
- Frequency plan, sub-band and legal channel-access method are `UNKNOWN`.
- Airtime and duty-cycle capacity are `EXPERIMENT-REQUIRED` and require a current regulatory calculation.
- Messages crossing BLE and LoRa must not loop back indefinitely.

Never repeat “1% duty cycle” as a universal LoRa rule. The applicable limit depends on the exact UK sub-band, power and channel-access technique. Codex must identify the proposed radio settings and calculate the legal and practical airtime budget for each.

---

## 5. Current protocol description

The briefing describes one 25-byte frame:

| Bytes | Intended field |
|---|---|
| 0 | Type, unsigned 8-bit |
| 1 to 4 | Sender ID, unsigned 32-bit |
| 5 to 8 | Target ID, unsigned 32-bit |
| 9 to 12 | Latitude, signed 32-bit, multiplied by 10^7 |
| 13 to 16 | Longitude, signed 32-bit, multiplied by 10^7 |
| 17 to 18 | Heading and floor packed into 16 bits; 9 bits for heading and 7 bits for signed floor |
| 19 | Battery, unsigned 8-bit |
| 20 to 23 | Timestamp, unsigned 32-bit epoch value |
| 24 | Accuracy, unsigned 8-bit |

Text is described as overlaying bytes 9 to 24 using 11-byte fragments, supporting up to 160 bytes and out-of-order reassembly.

Reported relay policy:

- TTL 7
- TTL clamped to 5 in dense crowds
- Deduplication prevents a device forwarding the same frame twice
- Consumer quick-reply codes use 1 to 7
- Operational status codes use 20 to 23

`BRIEFING-CLAIM`: 274 tests across 27 suites, including 214 engine tests, currently pass. Codex must reproduce the exact figures from the repository rather than copying them.

---

## 6. Protocol contradictions and unanswered questions

The current frame description consumes all 25 bytes but does not show where the following are encoded:

- Protocol version
- TTL
- Relay or hop count
- Stable packet/message identifier
- Sequence number
- Fragment index and fragment count
- Encryption key identifier
- Nonce material
- Authentication tag
- Priority or SOS class
- Expiry or freshness policy beyond a coarse timestamp

Text uses a 16-byte overlay area but provides 11 bytes of content per fragment, implying five bytes of fragment metadata whose format is not documented in the briefing.

Codex must answer these from code:

1. What exact byte sequence reaches the operating-system advertising API?
2. Does the 25-byte frame include all BLE advertising data-structure overhead, or is it only application payload?
3. Where are TTL and deduplication identity stored?
4. What tuple forms the deduplication key?
5. Can one sender generate two legitimate packets within the same timestamp unit without collision?
6. Are sender and target identifiers crew-scoped, event-scoped or global?
7. How are IDs generated, rotated and persisted?
8. How does a relay validate an opaque packet before forwarding it?
9. How does fragmentation coexist with TTL, authentication, expiry and deduplication?
10. What happens when device clocks differ or are manually changed?
11. How are latitude, longitude, heading, floor and accuracy interpreted when GPS and compass data are stale or unreliable indoors?
12. What is the actual unit and range of `accuracy`?
13. What are the malformed-frame and resource-exhaustion limits?

### 6.1 Sender ID collision risk

If 32-bit sender IDs are uniformly random and globally active within one event, approximate birthday-collision probabilities are:

| Simultaneously active random IDs | Probability of at least one collision |
|---:|---:|
| 10,000 | 1.2% |
| 20,000 | 4.5% |
| 50,000 | 25% |
| 80,000 | 53% |

This may be irrelevant if IDs are crew-scoped and packet identity contains more entropy. It may be serious if IDs are global and used alone for routing or deduplication. Codex must determine the actual scope before recommending a change.

### 6.2 The “96 bytes per second” claim

The briefing says a 12-person crew sending a 25-byte update every five seconds is approximately 96 bytes per second. Application payload alone is:

`12 × 25 / 5 = 60 bytes per second`

Ninety-six bytes per second may include an assumed 40-byte per-transmission envelope, but that assumption is not written down. Codex must distinguish:

- Application payload bytes
- Advertisement data bytes
- Complete Link Layer PDU bytes
- Total radio airtime across the advertising channels
- Relay-amplified traffic

Do not use the 96-byte figure in investor, venue or engineering material until its accounting basis is explicit.

---

## 7. The two existential feasibility gates

### Gate A: Can the required dynamic payload be advertised and relayed by real phones?

Apple's documented Core Bluetooth peripheral API accepts a restricted set of advertising keys. Apple's background documentation says the local name is not advertised in the background and advertised service UUIDs move into an overflow area discoverable only by an iOS device explicitly scanning for them. This creates a serious question about how an arbitrary, frequently changing 25-byte Loc8 frame is represented on iPhone, particularly in the background.

This does not prove Loc8 is impossible. It means Codex must inspect the exact successful two-iPhone code path. Possibilities include service-UUID encoding, fragmentation, a connection, a third-party/native mechanism or a misunderstanding of what was exchanged.

Required code evidence:

- The precise iOS call used to advertise each frame
- The dictionary or payload passed to the API
- The over-the-air data captured by a scanner or sniffer
- Whether a GATT connection is ever formed
- How often advertising is stopped, changed and restarted
- Whether the pair test ran in foreground, background or both
- Whether both devices were iPhones and which iOS versions
- Whether the receiver obtained the entire frame from an advertisement alone

Primary Apple references:

- [Core Bluetooth background processing](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/CoreBluetoothBackgroundProcessingForIOSApps/PerformingTasksWhileYourAppIsInTheBackground.html)
- [Core Bluetooth peripheral advertising guidance](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/BestPracticesForSettingUpYourIOSDeviceAsAPeripheral/BestPracticesForSettingUpYourIOSDeviceAsAPeripheral.html)
- [Core Bluetooth advertisement-data keys](https://developer.apple.com/documentation/corebluetooth/advertisement-data-retrieval-keys)

### Gate B: Can the mesh remain useful as participation and density rise?

The claim “more people always makes the network better” is not safe as written. More nodes initially improve path availability, but they also create more source advertisements, more receivers and potentially far more relay transmissions. Deduplication stops the same device forwarding one packet twice. It does not by itself prevent every nearby device forwarding that packet once.

For illustration only, 10,000 active users each originating one update every five seconds create 2,000 new source packets per second before any relay. The feasibility cannot be inferred from the small size of one crew's data. It depends on:

- Total active Loc8 users in the same interference domain
- Per-user generation interval
- Number of advertisements per logical frame
- Neighbour count
- Relay probability or suppression rule
- TTL and actual hop-depth distribution
- Advertising-channel occupancy
- Scanner duplicate filtering and operating-system scheduling
- Spatial reuse across the venue
- Coexisting 2.4 GHz Wi-Fi and Bluetooth traffic

Required work:

1. Extract the real forwarding algorithm.
2. Build an event-driven simulator using the real frame generation, cache, TTL, jitter and relay rules.
3. Model 10, 50, 100, 500, 1,000, 5,000 and 10,000 participating phones with several spatial layouts.
4. Measure delivery probability, p50/p95/p99 latency, duplicate amplification, transmissions per delivered update and channel load.
5. Test probabilistic, counter-based, distance/RSSI-informed and density-adaptive forwarding if the current algorithm produces a broadcast storm.
6. Preserve stranger relay and zero infrastructure while improving contention control.

Capacity must be expressed as a curve under stated conditions, not as one number of “people on the mesh”. The Bluetooth SIG Mesh 32,767-address figure is irrelevant to this custom mesh.

---

## 8. Honest status to carry into the audit

### Reported as built

- Shared `@loc8/engine`
- Consumer app
- Guard app
- Command app
- Operational message grammar
- Bridged software transport
- Two physical iPhones exchanging real frames in July 2026
- 274 tests in 27 suites, with 214 engine tests

All are `BRIEFING-CLAIM` until Codex reproduces them.

### Reported as specified but unbuilt

- Gateway hardware at all tiers
- Gateway power and battery design
- Loc8OS and six daemons
- Service portal
- Anchors
- Cloud backend
- HQ dashboard

### Open or unproven

- Three-phone A to B to C relay
- Reliable background and locked-screen operation
- App-swiped-away and phone-restart behaviour
- Android transport
- Cross-platform relaying
- Measured phone-to-phone and phone-to-Anchor range
- Dense-crowd collision behaviour
- Battery impact
- Payload confidentiality and authentication
- Multi-Gateway venues
- Disaster recovery
- Fleet health
- Real Anchor and Gateway hardware
- LoRa trunk capacity and compliance

### Briefing inconsistency to correct

Section 8 of the old briefing says the two-iPhone exchange is complete and the remaining gate is three-phone relaying plus the platform/range matrix. Its glossary still defines “the gate” as the unproven two-phone field test.

Use this corrected definition:

> **The current gate is a three-phone advertisement-only relay, followed by the foreground/background/locked, iOS/Android, range, density and battery matrix.**

---

## 9. Radio and coverage assumptions

The briefing supplies the following planning values. They are not substitutes for Loc8 measurements:

| Link | Packed crowd | Open ground | Clear line of sight |
|---|---:|---:|---:|
| Anchor to phone | approximately 50 m | approximately 150 to 200 m | up to approximately 1 km |
| Phone to Anchor | approximately 25 to 30 m | approximately 80 to 100 m | approximately 300 to 500 m |
| Anchor to Anchor over BLE | not specified | approximately 300 to 500 m | approximately 1 to 2 km |
| Anchor to Anchor over LoRa | not specified | approximately 1 to 3 km | approximately 5 to 15 km |

Treat every number in this table as a `BRIEFING-CLAIM` and planning hypothesis. Range depends on device, PHY, power, antenna, mounting height, orientation, bodies, structure, interference and success criterion.

The core deployment principle is sound: plan Anchor spacing around the weaker phone-to-Anchor uplink, not a powerful Anchor's downlink. A venue can otherwise create a system in which phones hear infrastructure but infrastructure cannot hear phones.

Codex must produce link budgets and test results for:

- Representative iPhones and Android phones
- Phone in hand, front pocket, back pocket and bag
- Portrait and landscape orientation
- Human body between phone and receiver
- Empty venue and populated event conditions
- Receiver at head height and elevated mounting heights
- Several advertising intervals and transmit powers where the OS permits
- Relevant 2.4 GHz Wi-Fi loads

Do not promise a 100-metre phone range or a fixed number of Anchors from vendor data alone.

---

## 10. Physical field-test programme

### 10.1 Three-phone relay proof

Required topology:

`Phone A -> Phone B -> Phone C`

Conditions:

1. A and C must be unable to hear each other directly. Prove this by running the test with B absent or its relay disabled for a meaningful baseline period.
2. A originates uniquely identifiable frames.
3. B receives and rebroadcasts them without forming a maintained BLE connection.
4. C records receipt, original identity, relay metadata and latency.
5. Logs from all three devices use synchronised or reconciled time.
6. Repeat in both directions.
7. Capture the over-the-air advertisement if test equipment is available.

Record:

- Device models
- OS versions
- App build and Git commit
- Permissions and background modes
- Screen and lock state
- Distance, obstructions and RF environment
- Advertising/scanning settings requested by the app
- Frames generated, received, relayed, duplicated, expired and dropped
- End-to-end latency
- Whether any GATT connection appeared

### 10.2 State matrix

Run at least:

| Origin state | Relay state | Receiver state |
|---|---|---|
| Foreground, screen on | Foreground, screen on | Foreground, screen on |
| Foreground | Background | Foreground |
| Background | Background | Background |
| Screen off and locked | Screen off and locked | Screen off and locked |
| Low Power/Battery Saver | Normal | Normal |
| App removed from recent apps | Normal | Normal |
| After phone restart | Normal | Normal |

Test homogeneous and mixed combinations:

- iPhone to iPhone to iPhone
- Android to Android to Android
- iPhone to Android to iPhone
- Android to iPhone to Android

Apple and Android background behaviour varies with version, device, OEM and power state. Documentation can define expectations, but only physical testing can decide Loc8's operating envelope.

Primary Android references:

- [Android BLE overview](https://developer.android.com/develop/connectivity/bluetooth/ble/ble-overview)
- [Android BLE background communication](https://developer.android.com/develop/connectivity/bluetooth/ble/background)
- [Android Bluetooth permissions](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions)

### 10.3 Provisional engineering gates

Codex should propose final thresholds from product requirements. Until then, report raw results and do not hide failure behind averages. At minimum report:

- Delivery ratio
- p50, p95 and p99 end-to-end latency
- Duplicate transmissions per original frame
- Relay success after direct-path elimination
- Battery drain per hour versus an idle-control build
- Recovery time after suspension or radio interruption
- Stale-location age at the receiving UI

Guard and Consumer may need different performance targets. Neither target may be described as safety-certified without the appropriate engineering and legal process.

---

## 11. Security, privacy and abuse research

The current plaintext status is a release blocker for real location use. Encryption alone is not sufficient. Loc8 needs a compact security design that addresses:

- Passive location tracking
- Sender impersonation
- Guard or Command message forgery
- Replay of old positions or SOS frames
- Malicious TTL manipulation
- Packet injection and radio flooding
- Crew-code guessing
- Unauthorised crew joining
- Linkability through static sender IDs
- Key compromise and rotation
- Lost or stolen Guard devices
- Malformed fragment memory exhaustion
- Denial of service against relay caches and queues

The 25-byte budget makes conventional authenticated encryption difficult because nonces, key identifiers and authentication tags consume bytes. Codex must begin with a threat model and evaluate alternatives rather than simply “adding AES”.

Questions to answer:

1. Which header fields must remain visible so strangers can relay opaque frames?
2. Which visible fields must be authenticated?
3. Can nonce components be derived safely from a rotating sender identifier and sequence counter?
4. What is an acceptable truncated authentication-tag length under expected packet volumes and attacker capabilities?
5. How are high-entropy crew keys exchanged by QR?
6. If a short human code is supported, is it only a lookup/join code, or does it directly derive the cryptographic key?
7. How are crew members removed without internet access?
8. How are operational identities provisioned and revoked?
9. Can a relay reject obvious junk before expensive cryptographic work without learning private payload data?
10. How do rotating identifiers interact with routing, deduplication and “found” state?

Required output: a threat model, candidate frame layouts with byte budgets, test vectors and a migration plan. Do not modify the production wire format silently.

---

## 12. Recommended shared engine structure

This is `PROPOSED` and must be reconciled with the real repository:

| Module | Responsibility |
|---|---|
| Frame codec | Versioned binary encoding/decoding, validation and canonical test vectors |
| Router | Transport-independent acceptance, forwarding and expiry decisions |
| Deduplication cache | Bounded packet identity cache with explicit lifetime and metrics |
| Relay scheduler | Jitter, suppression, density adaptation and priority |
| Fragment assembler | Bounded out-of-order reassembly with expiry and abuse limits |
| Position scheduler | Movement/freshness-aware generation rather than fixed high-rate updates everywhere |
| Security | Crew keys, operational identities, authenticated encryption and rotation |
| Capability model | Platform and device radio behaviour without leaking platform logic into the protocol |
| Simulation transport | Thousands of deterministic virtual devices and topologies |
| Fault-injection transport | Loss, duplication, delay, clock skew, corruption and suspension |
| Metrics | Privacy-minimised counters and latency histograms for field diagnostics |

Platform adapters should remain thin. Core relay decisions should be deterministic and testable without physical radio hardware.

---

## 13. Anchor firmware research

Evaluate at least a Nordic BLE SoC plus an nRF21540-class front-end module and suitable 868 MHz LoRa radios. Do not select a board solely from a maximum-range claim.

Firmware responsibilities should include:

- BLE scan/advertise scheduling
- Short-lived deduplication cache
- BLE-to-LoRa and LoRa-to-BLE queueing
- Cross-transport loop prevention
- Priority and expiry
- Congestion control
- Watchdog and brownout recovery
- Safe boot and rollback
- Signed firmware update
- Secure provisioning and unique hardware identity
- Revocation
- Radio, power and temperature health
- Receive sensitivity and packet counters
- Region-locked legal power configuration
- Factory-reset behaviour that removes venue secrets

Hardware research must compare:

- Receiver sensitivity and blocking performance
- Front-end module receive gain, not just transmit gain
- Antenna efficiency and connector loss
- Plastic versus metal enclosure effects
- Mounting clearance from truss and steelwork
- Mains, PoE, battery and solar options
- Weatherproofing, condensation and thermal behaviour
- Component availability, lifecycle and lead times
- UKCA/CE pre-compliance and final test implications

The Nordic nRF21540 supports up to +21 dBm output and low-noise receive amplification, but finished-device EIRP includes antenna gain and losses. Use the current [Nordic product documentation](https://www.nordicsemi.com/Products/nRF21540), not a distributor headline.

Historical planning figures from the superseded report:

- Nordic nRF21540 development bundle: approximately £76 at the time checked
- Enclosed one-node prototype: approximately £105 to £145
- Four-node test installation: approximately £650 to £800

These are historical prototype allowances, not current quotes and not the Loc8 Anchor bill of materials. Re-price parts before any purchase recommendation.

---

## 14. Gateway and Loc8OS research

Loc8OS is intended to make the Gateway behave like a recoverable appliance rather than a general-purpose hobby computer.

### 14.1 Proposed operating-system properties

- Read-only or immutable base image
- Secure boot where hardware permits
- Signed A/B system updates with rollback
- Encrypted writable data partition
- Per-service users and sandboxing
- Hardware watchdog
- Local-first operation with no inbound internet dependency
- Database integrity checks and power-loss recovery
- Controlled log rotation and storage limits
- Strong local administrator authentication
- Exportable diagnostic bundle with privacy controls
- Factory reset that securely removes site keys and old data
- Recovery console that does not expose secrets
- Reproducible build and software bill of materials

Codex should compare Debian-based appliance builds, Buildroot/Yocto and an immutable update framework such as RAUC, Mender or an equivalent. Choose from operational requirements, not fashion.

### 14.2 Proposed six-service model

1. `loc8-radio`: BLE/LoRa companion hardware and radio events
2. `loc8-router`: frame validation, deduplication, priority and routing
3. `loc8-store`: site state, incidents and audit records
4. `loc8-command`: local API for Command clients on the venue LAN
5. `loc8-sync`: optional HQ synchronisation that never blocks local operation
6. `loc8-health`: watchdogs, updates, hardware health and diagnostics

Codex must look for the existing six-daemon specification before adopting these names or boundaries.

### 14.3 Gateway design questions

- Which Pi-class board and storage medium are currently specified?
- Is BLE handled on the host or a dedicated radio co-processor?
- How is LoRa connected and isolated?
- Where do PKI private keys live: filesystem, TPM or secure element?
- How does Command discover the Gateway on the LAN?
- What is the exact offline API and authentication model?
- How is the hash-chained audit log formed, verified, exported and repaired?
- How does the Gateway recover from abrupt power loss?
- What UPS runtime is required?
- What happens when the one logical Gateway fails?
- Can a future warm spare preserve the “one logical brain” rule?
- How are backups encrypted, tested and restored?

---

## 15. UK compliance and product boundaries

Compliance is a workstream, not a final checkbox.

Codex must verify the current versions and applicability of:

- [Ofcom IR 2030 for licence-exempt short-range devices](https://www.ofcom.org.uk/siteassets/resources/documents/spectrum/interface-requirements/ir-2030.pdf?v=415472)
- ETSI EN 300 328 for 2.4 GHz wideband data transmission where applicable
- ETSI EN 300 220 family for sub-GHz short-range devices where applicable
- [UK Radio Equipment Regulations 2017 guidance](https://www.gov.uk/government/publications/radio-equipment-regulations-2017)
- Electromagnetic compatibility, electrical safety and exposure requirements
- UKCA and CE marking routes for the intended sales territories
- Bluetooth SIG membership, qualification and trademark obligations
- Battery transport and product-safety rules if a battery is included
- WEEE, RoHS and packaging obligations
- Data protection and location-privacy obligations for Consumer, Guard and Command

Do not assume 20 dBm EIRP or a 1% LoRa duty cycle is the only rule. The applicable table entry, spectrum-access technique, antenna gain and product classification must be established for the actual hardware and firmware configuration. Obtain a specialist test house review before freezing the PCB.

Safety and marketing boundary:

> Loc8 Guard and Command are operational awareness tools. They do not replace emergency communications, radios, alarms, PA systems, emergency services or venue incident procedures.

---

## 16. Repository audit instructions

Codex must inspect before proposing changes.

### 16.1 First pass

1. Read `AGENTS.md`, `README*`, `BRIEFING-FOR-AI.md`, package manifests, workspace configuration and architecture documents.
2. Record Git status and preserve all existing user changes.
3. Map packages, applications, native iOS/Android projects, shared engine, protocol definitions, tests and hardware documents.
4. Find all BLE advertising and scanning calls, native bridges and permission/background declarations.
5. Find frame codecs, TTL, deduplication, fragmentation, encryption, message types and ID generation.
6. Find Gateway, Anchor and Loc8OS specifications.
7. Run the narrowest safe test and build commands documented by the repository.
8. Report missing secrets or unavailable hardware as blockers. Do not invent successful results.

Useful search terms include:

```text
CBPeripheralManager
startAdvertising
CBAdvertisementData
CBCentralManager
scanForPeripherals
BluetoothLeAdvertiser
startAdvertisingSet
BluetoothLeScanner
ScanSettings
manufacturerData
serviceData
serviceUUID
ttl
dedup
fragment
senderId
targetId
@loc8/engine
LoRa
Gateway
Anchor
Loc8OS
```

### 16.2 Repository truth table

For every important claim, produce:

| Claim | Evidence path | Symbol/test | Status | Confidence | Follow-up |
|---|---|---|---|---|---|
| Example: iOS sends 25 dynamic bytes without connection | `path/to/file` | `functionName` | `CODE-VERIFIED` or contradicted | High/medium/low | Device capture required |

Do not cite search-result snippets as proof. Trace the call path from engine frame to native advertising API and from scan callback back to engine decoding.

### 16.3 Implementation restraint

This handover authorises research, repository inspection, documentation, tests, simulation and isolated diagnostic harnesses. It does not authorise Codex to quietly replace the production protocol or rewrite product architecture. Major wire-format, security or transport changes must first be presented as an explicit decision with migration consequences.

---

## 17. Required research outputs

Create or update these files inside `docs/research/` unless the repository already has a better documented location:

1. `LOC8_REPOSITORY_TRUTH_AUDIT.md`
2. `LOC8_IOS_ANDROID_RADIO_FEASIBILITY.md`
3. `LOC8_PROTOCOL_AND_CAPACITY_REVIEW.md`
4. `LOC8_SECURITY_THREAT_MODEL.md`
5. `LOC8_THREE_PHONE_FIELD_TEST_PLAN.md`
6. `LOC8_MESH_SIMULATION_REPORT.md`
7. `LOC8_ANCHOR_GATEWAY_LOC8OS_RESEARCH.md`
8. `LOC8_UK_COMPLIANCE_PATH.md`
9. `LOC8_DECISION_LOG.md`

Also create, where practical:

- A deterministic mesh simulator that imports or exactly mirrors the production relay rules
- Protocol test vectors shared across TypeScript, Swift, Kotlin and firmware targets
- A three-phone diagnostic build with privacy-safe packet logs
- A hardware bill-of-materials comparison with date, supplier, stock and lifecycle fields
- An experiments folder containing raw results, device details and Git commit identifiers

Every report must include:

- Executive conclusion
- What is proven
- What is contradicted
- What is inferred
- What requires physical testing
- Sources near the claims they support
- Decision implications
- Next action

Do not produce a replacement marketing PDF until the repository audit, Gate A and the initial capacity model are complete. The old arena PDF treated fixed relays as the backbone and is superseded.

---

## 18. Ready-to-paste prompt for Codex

Copy everything inside the following block and give it to Codex with the repository and this file:

```text
You are taking over technical research and repository auditing for Loc8.

The current repository is the working source of implementation truth. First read LOC8_CODEX_RESEARCH_HANDOVER.md and BRIEFING-FOR-AI.md in full, then read all applicable AGENTS.md files and inspect the repository before making recommendations.

Loc8 is an offline friend-finder built around a custom, connectionless BLE advertising relay network. Ordinary phones are intended to relay small frames for other phones, including strangers, without pairing or maintained connections. This is not Bluetooth SIG Mesh and it is not a venue-to-crowd broadcast system. Optional Gateway and Anchor hardware improves coverage but must not become necessary for basic consumer phone-to-phone operation. Consumer Loc8, Guard and Command are intended to share one @loc8/engine.

Your job is to establish what is actually true, continue the external research using primary sources, identify anything that could invalidate the product, and leave the repository with an evidence-backed engineering dossier and executable validation tools.

Work in this order:

1. Repository truth audit
   - Map the monorepo, apps, packages, native projects, protocol, tests and hardware specifications.
   - Trace one frame end-to-end from creation through encoding, iOS/Android advertising, scanning, relay, decoding and UI state.
   - Reproduce the reported test counts and builds. If they differ, report the actual results.
   - Locate exact implementations of TTL, deduplication, packet identity, fragmentation, ID generation, expiry, priority and security.
   - Prove whether the successful two-iPhone path used advertisement-only dynamic data or formed a connection.

2. iOS and Android feasibility
   - Inspect the precise public APIs and payloads used.
   - Compare them with current Apple and Android primary documentation.
   - Determine foreground, background, locked, low-power, terminated and restarted behaviour that must be tested physically.
   - Do not claim background reliability from code or documentation alone.

3. Protocol and scale audit
   - Produce the exact bit-level wire format, including fields absent from the current 25-byte briefing layout.
   - Resolve how 25 application bytes fit inside the actual legacy advertisement data structures.
   - Model total network load across all participating users, not merely one crew.
   - Build a deterministic event-driven simulator using the real relay algorithm.
   - Test density, collision, TTL, jitter, cache lifetime, relay suppression and broadcast-storm behaviour from 10 to 10,000 virtual devices.
   - Express capacity as curves under stated assumptions, never as a single unsupported people count.

4. Three-phone physical validation
   - Create a diagnostic plan and, if the repository supports it, isolated diagnostic builds for A -> B -> C relay.
   - Require a baseline proving A and C cannot communicate directly.
   - Capture packet identity, relay decisions, duplicates, latency, device/OS/build state and radio state.
   - Cover iPhone, Android and mixed paths in foreground, background and locked states.

5. Security and privacy
   - Build a threat model for passive tracking, impersonation, replay, injection, crew-code guessing, operational-message forgery, denial of service and lost Guard devices.
   - Design candidate authenticated-encryption layouts with explicit 25-byte budgets, nonce rules, tag lengths, key rotation and migration.
   - Do not simply add encryption or change the wire format without presenting the decision and compatibility impact.

6. Hardware, firmware and Loc8OS
   - Audit existing Gateway, Anchor and six-daemon specifications.
   - Research BLE receive performance, front-end modules, antennas, mounting, enclosure, power, LoRa trunk capacity and current component costs.
   - Treat Anchor spacing as uplink-limited by the phone, not downlink-limited by the Anchor.
   - Compare sensible appliance OS and signed A/B update approaches for Loc8OS.
   - Keep the Gateway as one logical site brain and Anchors as disposable radio translators with only bounded transient state.

7. UK compliance
   - Verify the current Ofcom IR 2030 entries, applicable ETSI standards, Radio Equipment Regulations, UKCA/CE route and Bluetooth qualification for the actual proposed configurations.
   - Calculate LoRa airtime and duty/channel-access limits for each chosen sub-band and setting. Do not assume a universal 1% rule.
   - Maintain the boundary that Loc8 is not an emergency communications system.

Use the evidence labels in the handover: CODE-VERIFIED, DEVICE-VERIFIED, EXTERNALLY-VERIFIED, BRIEFING-CLAIM, PROPOSED, EXPERIMENT-REQUIRED and UNKNOWN.

For technical web research, prefer current primary sources: official platform documentation, standards bodies, regulators, component manufacturers and peer-reviewed papers. Cite the exact page near every claim. Vendor range figures must include PHY, power, antenna, environment and success conditions. State uncertainty plainly.

Preserve existing user changes. Do not perform destructive Git operations. Do not silently redesign production code. You may create documentation, tests, simulation and isolated diagnostic tooling needed for this research. Where physical devices or credentials are required, complete every read-only or simulated step possible, then provide exact run instructions and result templates.

Write the outputs listed in section 17 of LOC8_CODEX_RESEARCH_HANDOVER.md. Begin by returning a concise repository map, a truth-versus-claim table and the top five risks ranked by existential impact. Then continue the work rather than stopping at a plan.
```

---

## 19. Primary source starting set

Codex must confirm freshness and applicability when it uses these:

### Apple

- [Core Bluetooth background processing for iOS apps](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/CoreBluetoothBackgroundProcessingForIOSApps/PerformingTasksWhileYourAppIsInTheBackground.html)
- [Advertising as an iOS peripheral](https://developer.apple.com/library/archive/documentation/NetworkingInternetWeb/Conceptual/CoreBluetooth_concepts/BestPracticesForSettingUpYourIOSDeviceAsAPeripheral/BestPracticesForSettingUpYourIOSDeviceAsAPeripheral.html)
- [Core Bluetooth advertisement-data retrieval keys](https://developer.apple.com/documentation/corebluetooth/advertisement-data-retrieval-keys)

### Android

- [Bluetooth Low Energy overview](https://developer.android.com/develop/connectivity/bluetooth/ble/ble-overview)
- [BLE background communication](https://developer.android.com/develop/connectivity/bluetooth/ble/background)
- [Bluetooth permissions](https://developer.android.com/develop/connectivity/bluetooth/bt-permissions)

### Bluetooth

- [Bluetooth Low Energy Primer](https://www.bluetooth.com/bluetooth-le-primer/)
- [Bluetooth Core Specification](https://www.bluetooth.com/specifications/specs/core-specification/)

### UK regulation

- [Ofcom IR 2030](https://www.ofcom.org.uk/siteassets/resources/documents/spectrum/interface-requirements/ir-2030.pdf?v=415472)
- [Radio Equipment Regulations 2017](https://www.gov.uk/government/publications/radio-equipment-regulations-2017)

### Example radio component

- [Nordic nRF21540](https://www.nordicsemi.com/Products/nRF21540)

This list is a starting point, not a complete literature review.

---

## 20. Final decision rule

Loc8's commercial promise is compelling only if its radio behaviour survives contact with operating-system restrictions and crowd-scale contention.

The correct order is:

1. Prove the exact advertisement-only frame path.
2. Prove A to B to C relay on physical phones.
3. Measure background and locked behaviour.
4. Model and test dense-crowd contention.
5. Secure the protocol within a defensible byte budget.
6. Build optional Anchors, the Gateway and Loc8OS around the working phone layer.
7. Make commercial range, capacity and reliability claims only from recorded evidence.

Hardware can improve a viable phone mesh. It cannot rescue an unproven phone transport without changing what Loc8 is.