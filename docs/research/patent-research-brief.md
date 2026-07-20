# Research brief: patentability, prior art and FTO

*Authored by Claude Fable 5 on 2026-07-20, executed by Opus at max effort.
Saved before execution so the brief itself is never lost — see [README](README.md).*

**Status:** this is the *input* to the research, not its findings. Output lands
alongside as `patent-prior-art-*.md`.

**Purpose:** research input for a qualified UK/European patent attorney, to make
that engagement cheaper and better-informed. Not legal advice, and no filing
recommendation is made or implied.

---

# Prior-Art, Patentability and Freedom-to-Operate Research Brief: Loc8 Offline Crowd-Location Mesh

You are conducting pre-engagement patent research for Loc8, a pre-revenue UK company. Your report will be handed to a qualified UK/European patent attorney to make that engagement cheaper and better-informed. Your job: map the prior art, assess the novelty of three candidate inventions adversarially, screen freedom-to-operate risk, and establish procedural facts (costs, deadlines, disclosure rules) — with primary-source citations throughout.

The most expensive failure mode is a false "yes, this is novel": it costs the client tens of thousands of pounds in drafting and prosecution before an examiner finds the art you missed. Weight your errors accordingly. "Likely not patentable, and here is the art" is a successful outcome of this research, not a disappointing one.

Ground rules — non-negotiable:

- Every substantive assertion carries a citation with a working URL, and a patent/application/document number where one exists. Read actual granted claims and published applications; abstracts, product pages and journalism never settle a claim-scope or legal-status question.
- Anything not verified against a primary source must be tagged [UNVERIFIED] or [INFERENCE] at the point of use. Never state an unverified claim in a confident register.
- Every "plausibly novel" conclusion must survive the written adversarial attack defined in §6 before it may appear in the report.
- You are not counsel. The report must not give legal advice or a filing recommendation as if from a qualified attorney. Frame all conclusions as research findings and analytical views for an attorney to test.

## 1. The system under investigation

Loc8 builds offline crowd-location and safety infrastructure for festivals, nightclubs and stadiums. Premise: when cell networks collapse under crowd density, phones find each other directly. Four layers, each designed to survive the loss of the layer above:

1. **Phone mesh** — Bluetooth LE phone-to-phone flooding relay. 25-byte packets; TTL 7, clamped to 5 in dense crowds; duplicate suppression by message ID. Works with zero infrastructure.
2. **Anchors** — cheap stateless pole-mounted radio translators (~£30-40, ESP32-class). Re-broadcast BLE, and bridge BLE⟷LoRa (868 MHz) to span ground with no people on it.
3. **Gateway** — one per site, Raspberry Pi 4/CM4 class (~$93-113 BOM). Holds the site SQLite database and a hash-chained audit log; relays to a control-room console over LAN with mTLS; syncs to cloud opportunistically; acts as LoRa trunk head-end; and is also simply the best mesh node in the building (mounted high, external antenna, always powered). LFP-battery backed, PoE+ powered.
4. **Command console** — ordinary computer on the venue LAN; no Bluetooth — the Gateway is its radio.

The 25-byte frame: type(1) senderId(4) targetId(4) lat(4, int32 × 1e7) lon(4, int32 × 1e7) heading+floor(2, packed) battery(1) timestamp(4) accuracy(1). Text messages overlay bytes 9-24 with fragmentation fields (msgId/seq/total/len) plus 11 payload bytes.

## 2. The three candidate inventions

Assess each independently. Each is broken into elements the way an examiner would read them; search against the elements, not the marketing description.

**Candidate A — Disjoint code-space audience separation.** Consumer and professional-security traffic share one physical mesh, one radio, one frame format. Consumer quick-replies occupy message codes 1-7; operational security statuses (en route / on scene / need backup / clear) occupy codes 20-23. The spaces are deliberately non-overlapping, so a festival-goer's message can never decode as a guard's operational status, and vice versa. Elements: (i) a single shared physical mesh carrying two audience classes; (ii) semantic message codes partitioned into disjoint ranges per audience class; (iii) cross-class misinterpretation made structurally impossible by the partition itself; (iv) achieved without separate networks, separate radios, priority tagging alone, or cryptographic separation. Asserted contribution: safety-critical semantic isolation as a property of code-space allocation.

**Candidate B — Priority-ordered load shedding with a protected audit write.** Under battery or thermal duress the Gateway sheds functions in a defined priority order, and the hash-chained audit/incident write is contractually the last function to die — persisted at SQLite synchronous=FULL even in the most degraded regime, on the reasoning that the legal record must outlive the service. Elements: (i) resource-duress detection (battery/thermal); (ii) an ordered shedding schedule over heterogeneous functions (cloud sync, console relay, LoRa trunking, mesh participation, etc.); (iii) a tamper-evident hash-chained audit log; (iv) an invariant that the audit write survives all shedding stages at maximum durability; (v) the evidentiary-record-outlives-the-service rationale.

**Candidate C — Fail-safe degradation layering.** The system is architected so the death of any infrastructure layer returns users to a working phone-to-phone mesh rather than a dead system: HQ/cloud loss is invisible on site; LAN loss keeps mesh and local recording alive; Gateway loss still leaves phones locating each other. Elements: (i) strict layering with each layer purely additive; (ii) no layer is a dependency of the layer below it; (iii) the terminal fallback is a functioning zero-infrastructure device-to-device mode, not degraded service or outage. Additionally assess honestly whether C is expressible as a patent claim at all, or is a system-design principle.

## 3. Reference date

Nothing has been filed. Treat today as the effective reference date: everything publicly available now is citable prior art against all three candidates, so there is no before-date filtering to do — the question is what exists, full stop. Priority-date mechanics still matter for WS6 and WS7.

## 4. Research workstreams

### WS1 — Patent landscape

Search Google Patents, Espacenet, WIPO Patentscope and USPTO Patent Public Search (plus Lens.org where useful). For each relevant family record: patent/application number, title, assignee, priority date, current legal status (granted / pending / lapsed / expired — check INPADOC legal status, not mere existence), jurisdictions covered, and the actual scope of the broadest independent claim (quote the key limitation, then paraphrase it).

Mandatory assignees/products to run down: goTenna; Bridgefy; Open Garden / FireChat; Meshtastic-adjacent LoRa-mesh filings; Apple (Find My offline finding network, AirTag, Emergency SOS via satellite); Samsung (offline finding, D2D); Qualcomm (LTE Direct / ProSe / sidelink); Motorola Solutions (WAVE, APX, mission-critical PTT); Axon (digital evidence, chain of custody); Zello; Siyata. Then go beyond the list: festival/stadium/crowd-safety-specific holders (crowd density monitoring, event wearables, venue location systems) and BLE-mesh positioning filings generally.

Candidate CPC areas to seed classification searches — verify each code's current definition before relying on it: H04W 84/18 (ad-hoc/mesh), H04W 4/90 (emergency services), H04W 4/02x (location services), H04W 76/50, H04L 45/32 [flooding — verify], G08B 21/x and G08B 25/x (personal safety/alarms), G06F 1/32x (power management), and hash-chain/audit-log areas under H04L 9/32 and G06F 21/64.

Vocabulary varies wildly across this art; search each candidate under multiple phrasings. A: "message type", "opcode range", "canned message", "quick reply", "status code", "role-based messaging", "traffic class". B: "load shedding", "graceful degradation", "prioritized power management", "tamper-evident log", "audit trail", "black box", "event recorder". C: "fallback", "direct mode", "out of coverage", "infrastructure-less", "device-to-device", "network partition".

### WS2 — Academic and standards prior art

Establish how far back each core technique goes, with dated primary sources, and map every item onto the specific candidate elements it touches:

- MANET/DTN flooding and epidemic routing: Vahdat & Becker's epidemic routing (Duke TR, c. 2000); the broadcast storm problem (Ni et al., MobiCom 1999) and counter-based/probabilistic flood suppression; gossip routing; DTN architecture (RFC 4838) and Bundle Protocol (RFC 5050 / RFC 9171).
- Bluetooth Mesh Profile (SIG, 2017 onward): managed flooding, TTL, message cache deduplication, relay nodes — map each feature against Loc8's phone-mesh layer. Also examine the model-spec opcode allocation (SIG-defined vs vendor-specific ranges), which bears directly on Candidate A.
- LoRaWAN specifications and LoRa mesh literature; Thread; 802.11s where instructive.
- Public-safety direct-mode standards (feeds C): TETRA Direct Mode Operation (ETSI EN 300 396 family), P25 talkaround, DMR direct mode, 3GPP ProSe/sidelink from Release 12, MCPTT off-network mode.

### WS3 — Per-candidate novelty assessment

For A, B and C separately: identify the closest prior art across patents, standards, papers and shipped products (shipped behavior is prior art too); build an element-by-element comparison table (candidate element vs what each reference discloses); state the delta precisely; then give a reasoned view on whether an inventive step plausibly survives. Distinguish anticipation (single reference, all elements) from obviousness (skilled-person combination); frame obviousness using the EPO problem-solution approach, note the UK Pozzoli restatement, and use KSR framing for the US. Cite specific art against every element. "No art found" for an element is reportable only alongside the searches (queries and databases) that failed to find it.

### WS4 — Jurisdictional patentability

For each candidate, analyze where it sits under:

- **UK**: Patents Act 1977 s.1(2) excluded matter; the Aerotel/Macrossan four-step approach and the AT&T/CVON signposts; current UKIPO practice, including the present status and effect of Emotional Perception AI v Comptroller (verify where that litigation now stands and what current IPO practice notices say). Cite statutes from legislation.gov.uk and judgments from BAILII or The National Archives.
- **EPO**: Art 52(2)/(3) "programs for computers as such"; the technical-character/technical-effect framework; Comvik (T 641/00) treatment of non-technical requirements — apply this specifically to Candidate B, where "the legal record must survive" is arguably a non-technical legal/business requirement handed to the skilled person; Hitachi (T 258/03); G 1/19 where relevant. Answer squarely: where does radio-protocol engineering sit versus application logic in EPO practice? Find Board of Appeal decisions on communication-protocol inventions to anchor this, from the EPO case-law database.
- **US**: post-Alice §101 (the two-step test; favorable network-technology outcomes such as Enfish/McRO/DDR-style reasoning; adverse examples such as ChargePoint v. SemaConnect); the current status of USPTO subject-matter-eligibility guidance in 2025-26; and §103/KSR exposure given WS3's art.

### WS5 — Freedom-to-operate screen

The inverse question, which may matter more than patenting: does deploying the §1 architecture risk infringing live claims — especially goTenna's and Bridgefy's? From WS1, isolate granted, in-force claims in UK/EP/US whose independent claims could read on Loc8; map claim elements to Loc8 features; note limitations Loc8 clearly avoids. Check legal status carefully — a lapsed FireChat-era patent is an FTO non-event and useful invalidity art at the same time. Search for live or historical litigation and oppositions in this space (court records via CourtListener/PACER references, Unified Patents/RPX public reporting, EPO opposition records, UK registers). State explicitly that this is a preliminary screen, not an FTO opinion.

### WS6 — Cost and timeline reality

Current, cited numbers, each with an as-of date; official fees only from official fee schedules:

- UK first filing: IPO fees (application, search, examination), typical UK attorney drafting-cost ranges for a case of this kind (cite published firm or CIPA sources), and what a "provisional-style" UK priority filing actually is under current practice (filing without claims — verify the mechanics).
- The 12-month Paris Convention priority clock: when it starts, what it protects, what must happen by month 12.
- PCT route: current international filing and search fees (WIPO fee tables; EPO-as-ISA cost), 30/31-month national-phase deadlines, realistic national-phase costs for UK/EP/US at minimum.
- A cumulative cost projection to grant in UK+EP+US, presented as a cited range and clearly labeled as an estimate.

### WS7 — Disclosure rules

- Absolute novelty in the UK (PA 1977 s.2(2)) and at the EPO (Art 54, plus the narrow Art 55 exceptions) versus the US §102(b)(1) one-year grace period for inventor-originated disclosures — and why relying on the US grace period is dangerous for a company that wants European protection.
- What constitutes enabling public disclosure: publications, public code repositories and committed design documents, pitch decks, conference demos, crowdfunding pages, app-store listings, and prior public use. Ground the enablement standard in authority (e.g. Synthon v SmithKline Beecham — verify its holding) rather than first principles alone.
- Two Loc8-specific scenarios, analyzed explicitly: (a) is pitching under NDA genuinely safe — obligation-of-confidence law, what happens on breach, how the evident-abuse exception actually works; (b) does running a field trial at a festival — broadcasting unencrypted 25-byte frames that anyone with a BLE sniffer could capture — constitute enabling public disclosure of the frame format and code-space scheme?
- Self-disclosure check: search for any already-public Loc8 material describing this architecture (repositories, pitch pages, listings). If found, flag it prominently as potential prior art against the company's own future filing. Take care to distinguish this company from unrelated "Loc8"-named products.

## 5. Leads to verify (unconfirmed — confirm against primary sources or discard; never cite this list as authority)

These come from the commissioning team's memory. They are search accelerants, not established facts.

Against A: Bluetooth Mesh opcode ranges partitioned by authority class; P25/TETRA/DMR talkgroup and message-category separation on shared physical channels; GMDSS/DSC message categories (distress/urgency/safety/routine) within one shared maritime protocol; aviation transponder reserved emergency codes (7500/7600/7700); Link 16 / MIL-STD-6016 fixed message catalogs partitioned by function; FirstNet-style priority and preemption separating public-safety from consumer traffic on shared physical infrastructure; 802.11e EDCA access categories; DiffServ code points; IANA-style reserved ranges as routine protocol practice.

Against B: Schneier & Kelsey on secure audit logs for untrusted machines (c. 1997-98) and the forward-secure logging literature; Merkle/hash-chain logs (RFC 6962 Certificate Transparency); Axon digital-evidence chain-of-custody patents; flight-data-recorder design philosophy and crash-survivable memory (ED-112 family); spacecraft safe-mode fault protection (shed loads, preserve telemetry and the record); under-frequency load shedding with priority tiers in power systems; OS-level priority-ordered shedding under resource duress (Linux OOM killer oom_score_adj, mobile low-power modes); Kubernetes pod priority/preemption and QoS-class eviction ordering; cell-site battery-backup shedding patents; SQLite synchronous=FULL as documented durability practice.

Against C: TETRA DMO fallback when trunked mode is lost (ETSI EN 300 396); P25 talkaround; 3GPP ProSe/sidelink off-network public-safety mode and MCPTT off-network; the entire goTenna/Bridgefy/FireChat product premise (mesh keeps working when infrastructure is gone); DTN partition tolerance by design (RFC 4838); fail-soft and graceful-degradation literature in fault-tolerant computing; Apple satellite SOS as fallback layering.

## 6. Adversarial verification protocol

For every candidate whose initial assessment is "plausibly novel" or "inventive step plausibly survives", run a written red-team pass before the conclusion may appear:

1. A skeptic constructs the strongest anticipation attack (single best reference) and the strongest obviousness attack (best two-to-three-reference combination a skilled protocol/systems engineer would make) from the art actually found — plus at least one further targeted search hunting specifically for the killer reference the optimist would prefer not to find.
2. The skeptic also attacks claim-form viability: can this candidate be drafted as a claim that is simultaneously (a) not anticipated, (b) not obvious, (c) not excluded/abstract in at least one major jurisdiction, and (d) still broad enough that a competitor could not trivially design around it? A candidate failing (d) must be reported as such — a patent nobody can infringe is a cost, not an asset.
3. The conclusion survives only if the report answers the attack with evidence. Where the attack lands, downgrade the finding and state plainly that it was downgraded and why.

Record both sides of every attack. The attorney should be able to see the argument, not just the verdict.

## 7. Required report structure

Produce a single written report structured for handoff to a patent attorney:

1. **Executive summary** — one page: per-candidate verdict with confidence level and the single most threatening reference for each; headline FTO posture; headline cost/timeline numbers; disclosure do/don't list.
2. **System characterization as searched** — restate §1-2 so the attorney can verify the right invention was assessed.
3. **Patent landscape** — organized by assignee, with all WS1 fields.
4. **Standards and academic prior-art timeline** — WS2, oldest to newest, each entry mapped to the candidate elements it touches.
5. **Candidate A assessment** — closest art, element-by-element table, skeptic's attack and response, reasoned inventive-step view with confidence, jurisdictional view (UK/EPO/US).
6. **Candidate B assessment** — same structure, including the Comvik non-technical-aim analysis.
7. **Candidate C assessment** — same structure, including the is-this-even-a-claim analysis.
8. **What would kill each candidate** — for A, B and C: the specific reference, combination, exclusion doctrine, or disclosure event that most plausibly destroys it, plus the further search an attorney should commission to confirm or clear that threat.
9. **Freedom-to-operate screen** — risk register: patent, claim-element mapping to Loc8 features, legal status, jurisdiction, risk rating, avoidance notes; litigation findings; explicit non-opinion caveat.
10. **Costs and timeline** — WS6 tables with sources and as-of dates; the 12-month priority and 30/31-month national-phase clocks laid out on one timeline.
11. **Disclosure rules and practical guidance** — WS7, including the NDA-pitch and festival-field-trial analyses, framed as positions to review with the attorney.
12. **Master prior-art table** — every reference cited anywhere, one row each: ID, type (patent/standard/paper/product), number or identifier, title, date, assignee/author, URL, relevance (A/B/C/FTO), one-line disclosure summary, verification status.
13. **Verification appendix** — what was verified against a primary source versus inferred; searches run that found nothing (queries and databases named); known gaps and low-confidence areas.
14. **Questions for the attorney** — everything research could not resolve, plus alternatives worth raising (defensive publication; trade-secret treatment for any candidate the research suggests is weak).
15. **Full source list** — every URL cited, with access dates.

## 8. Standing constraints

- This is research input for a qualified attorney, not legal advice. Include a statement to that effect, and phrase no conclusion as a filing recommendation from counsel.
- Distinguish verified fact, reasoned inference, and unverified lead at the point of use, not only in the appendix.
- Source hierarchy: patent registers and published claims; statutes and decided cases; official fee schedules; standards documents; peer-reviewed papers; then everything else. Marketing pages and journalism may generate leads but never settle claim scope or legal status.
- If two sources conflict, report the conflict rather than silently choosing one.
- Do not soften adverse findings. The client is better served by a cheap "no" now than an expensive "no" from an examiner in three years.
