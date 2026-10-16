# Loc8 offline BLE mesh: research delta and engineering intake
**Brief date:** 16 October 2026
**Window:** 10–16 October 2026; includes a newly discovered 28 September research preprint.
**Source application line:** draft PR #5, "rnd/ble-density-2026-10-03", head 09932ccb49a2deb67db924ee54c622b7a6302b3f.
**Status:** research and proposed experiments only. No new physical field observations, performance claims or production promotion.

## What actually changed since the 9 October brief

The previous brief placed first priority on installing current/branch Android builds and completing the frozen three-device relay protocol. Keep that priority.

New to this intake:
1. A hardware-validated research preprint identifies clock drift and conflicting BLE connection events as an independent multi-hop constraint. This was published on 28 September but was not adequately covered by our 9 October brief.
2. Three Zephyr Bluetooth/L2CAP and Bluetooth Mesh lifecycle/queue advisories became public on 11–12 October. Their failure modes inform our fault-injection criteria. They do **not** establish that the Swift/Kotlin Loc8 implementation is vulnerable.
3. Two 9 October Internet-Draft revisions provide design input for optional transport-neutral neighbour discovery and compact out-of-band service advertisements. Neither is a shipping interoperability mandate.

The main engineering distinction is: **radio discovery, maintainable GATT connection, relay admission, end-destination delivery and human acknowledgement are separate layers of evidence**. A higher participant count does not establish increased usable connected degree or delivered throughput. Never report simulated coverage as real phone coverage.

## Source shortlist with relevance and limits

### P0: Pang et al. (2026), "Deconstructing BLE Multi-hop: a Model-based Approach to Quantifying the Challenges"
- **Original:** https://arxiv.org/abs/2609.34483 (submitted 28 September 2026)
- **Nature:** mathematical model plus practical experiments on dedicated nRF52840 hardware / RIOT OS; not an Android/iOS field study.
- **Finding to test:** drift between separately scheduled BLE connection events can produce recurring collisions/retries in some multi-hop topologies; central/peripheral relationship and concurrent connection count matter.
- **Loc8 implication:** branch-preserving forwarding may improve logical fanout while physical/GATT contention still reduces delivery. Instrument concurrent live connections, role, duration, reconnects and queued send outcomes before considering topology or connection-degree caps.
- **Limit:** do not transfer collision frequencies or 100 ms/233-byte test conditions to Loc8's 25-byte application payload without handset measurements. Controller-level scheduling and packet collisions may not be observable via mobile APIs.

### P1: Zephyr security advisories CVE-2026-19935, CVE-2026-19936 and CVE-2026-19937
- **Primary advisories/register:** https://docs.zephyrproject.org/latest/security/vulnerabilities.html
- **Records:** https://nvd.nist.gov/vuln/detail/CVE-2026-19935 ; https://nvd.nist.gov/vuln/detail/CVE-2026-19936 ; https://nvd.nist.gov/vuln/detail/CVE-2026-19937
- **Nature:** L2CAP deferred-work lifetime management (#19935); unsynchronised delayed-message queue (#19936); delayed-message context exhaustion from an error path (#19937).
- **Loc8 implication:** assert bounded queues, generation-safe teardown, no stale callbacks after disconnect, deterministic backpressure/drop accounting and recovery after saturation. For any prospective Zephyr-based hardware, audit the chosen exact version/configuration and fixed upstream commits.
- **Limit:** Bluetooth Mesh access-layer and L2CAP CoC implementation details are not automatically present in Loc8's currently used mobile GATT paths. Never describe these as confirmed Loc8 vulnerabilities.

### P2: IETF DTN "Bundle Protocol Secure Advertisement and Neighborhood Discovery" (SAND), -05
- **Original:** https://datatracker.ietf.org/doc/draft-ietf-dtn-bp-sand/05/
- **Revision:** 9 October 2026; active DTN working-group Internet-Draft, not a final RFC.
- **Loc8 implication:** useful distinction between neighbour identity, link capabilities, measured reachability and higher-layer routing. Study a small internal capability/reachability representation for optional Loc8OS/Guard/Gateway transport adapters.
- **Limit:** SAND targets BPv7 delay-tolerant networks and is not a drop-in BLE phone discovery or packet-relaying protocol. No Bundle Protocol dependency for the consumer app.

### P3: "DNS-SD Data Block: An Encoding for Non-IP Transports", -02
- **Original:** https://datatracker.ietf.org/doc/draft-kennedy-dnssd-data-block/02/
- **Revision:** 9 October 2026; individual Internet-Draft, not IETF-approved.
- **Loc8 implication:** compact TLV discovery information, strict malformed-field rejection and future Gateway capability announcements are worth assessing separately from mesh traffic.
- **Limit:** do not insert discovery metadata into each 25-byte application packet; first assess BLE SIG/Android/iOS constraints and any version-negotiated, opt-in design.

## Reconciled project baseline

PR #5 is a **draft** stacked on PR #4 (itself dependent on PR #1). It contains labelled Public and Guard Android current/branch field APK build evidence, the current default relay, the opt-in branch candidate, and simulation/native host checks. These are **not** evidence of phone RF performance, battery, iOS deployment or physical multi-hop delivery.

The existing 5,400-run model shows branch's benefit relative to a simple jitter baseline but also larger cost than current in many cohorts. Keep Trickle/retry HOLD. Do not promote branch based on model-only results.

Keep unchanged unless a separately approved protocol revision exists:
- application payload 25 bytes, existing native framing 47 bytes and TTL semantics;
- BLE advertising for discovery and GATT transport, consumer zero-required-infrastructure behaviour;
- production relay default current, experimental branch separately labelled;
- frozen MESH-01 schema, evaluator, preregistration and pass/fail criteria;
- honest event semantics: delivery evidence is not human acknowledgement and reachability is not geographical coverage.

## Recommended research-to-build sequence

**R4-A: Evidence inventory and MESH-01 preparation (P0).** Audit documentation, links and build expiry. Rebuild labelled APKs from pinned source if expired. Prepare private on-device evidence collection and hash receipts. No remote agent may mark physical gates GO without actual devices.

**R4-B: Connection health and scheduler contention telemetry (P0).** Add *optional, development-only* native diagnostics around discovered peers, active GATT connection count, OS central/peripheral roles if exposed, scan/advertise lifecycle, monotonic connection lifetime, disconnect/reconnect reasons, egress queue admission/drop/expiry and send/delivery timing. Mark missing OS/controller signals as unavailable; never fabricate a collision metric. No sensitive location or stable personal identifier in shared telemetry.

**R4-C: Comparative field programme (P0, requires phones).** First run unmodified frozen MESH-01. Then preregister a separate 2–3-hour test, at actual observed active link counts 2/3/4, keeping device geometry and current/branch modes comparable; collect disconnections, reconnection time, late delivery, loss, duplicates, queue pressure, battery and OS state. Extend density to available 5/10/25/50 devices without extrapolating untested cohorts.

**R4-D: Queue lifecycle and parser resilience (P1).** Exercise saturated queues, mid-flight disconnect, delayed callback after generation change, repeated restart, invalid frame, duplicate frame and expiry races in deterministic native/host test harnesses. Recovery must be bounded, measurable and not require unrecorded state resets.

**R4-E: Optional Loc8OS discovery model (P2; design only).** Explore internal neighbour capability and freshness schema for optional anchor/gateway/connected bearer. Compare overhead before any BLE on-air change. Do not adopt SAND, DTN BPv7 or DNS-SD TLV into production outright.

## Falsifiable gates

- MESH-01: original A–B–C relay controls, 190/200 deliveries in **each** direction within 10 s, no application duplicates, pre/post B-absent A/C isolation, original clock/error/recording checks and full raw evidence. See root FIELD-TEST.md.
- R4-B: diagnostic counters reset and reconcile across restart/disconnect, no unbounded retention, no changed relay policy or release build behaviour, and host/native tests showing trace-to-metric consistency.
- R4-C: predeclared cohort, repeatable geometry, actual live degree, observed current/branch comparison, device/OS/power metadata, raw logs kept in private encrypted evidence, redacted hashed receipts only in Git.
- R4-D: deterministic fault tests for each condition; no crash, use-after-teardown, unbounded queue or silent hang. Label unsupported fuzz targets honestly.
- R4-E: written threat model, estimated bytes/airtime, interoperability limitations, explicit research-only decision.

## Decisions

**Promote to engineering test design:** connection contention/role instrumentation; queue-lifecycle robustness; systematic physical-current-versus-branch comparison.
**Monitor, do not adopt:** SAND and DNS-SD Data Block until their applicability is demonstrated; Zephyr fixes until hardware stack selection and affected-feature review.
**Do not change:** current production default, wire layout, privacy/security promises or consumer offline independence.

**Next execution:** see ../handoffs/2026-10-16-agent-implementation.md; master plan LOC8_MASTER_PLAN.md; research index RESEARCH.md; existing frozen FIELD-TEST.md.
