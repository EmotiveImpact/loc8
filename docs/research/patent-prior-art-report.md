---
title: "Prior-art, patentability and freedom-to-operate report — Loc8 offline crowd-location mesh"
produced: 2026-07-20
method: "132-style multi-agent adversarial research run (optimist assessment → red-team attack → resolved verdict, per candidate; parallel jurisdictional and practical workstreams)"
input_brief: docs/research/patent-research-brief.md
status: "Research input for a qualified UK/European patent attorney. NOT legal advice. No filing recommendation is made or implied."
reference_date: 2026-07-20
---

> **Not legal advice.** This document is pre-engagement research prepared to make
> an attorney engagement cheaper and better-informed. It is not legal advice, it
> is not an opinion on validity, infringement or freedom to operate, and nothing
> in it is a filing recommendation from counsel. Every conclusion is framed as a
> research finding for a qualified attorney to test.
>
> **Verification convention.** Verified fact, reasoned inference and unverified
> lead are distinguished **at the point of use**, not only in the appendix.
> Untagged statements about claim text mean *I read the claim*. `[INFERENCE]`
> means reasoned from verified material. `[UNVERIFIED]` means not checked
> against a primary source.
>
> **Systemic limitation, stated up front.** The session's WebSearch allowance
> (200 calls) was exhausted before most workstreams began. Nearly all research
> below was performed by *direct fetch* of registers, standards portals, statute
> sites and case-law databases, plus FreePatentsOnline expert-search as a
> substitute claims-text engine. Google Patents returned HTTP 503 throughout;
> Espacenet returned HTTP 403. **INPADOC legal status was therefore verified for
> ZERO references in this run.** This matters little for invalidity (art is art
> whether in force or lapsed) and a great deal for §9 (FTO), where it is the
> single largest open gap.

---

## 1. Executive summary

**All three candidate inventions failed adversarial verification. None survived.
The research recommends no drafting spend on any of them as presently framed.**

Per the brief's own framing (§8): *"The client is better served by a cheap 'no'
now than an expensive 'no' from an examiner in three years."* This is that "no",
delivered three times.

| Candidate | Initial assessment | Red team | **Resolved verdict** | Confidence | Single most threatening reference |
|---|---|---|---|---|---|
| **A** — disjoint code-space audience separation | Obvious | Destroyed ×3 | **DESTROYED** — anticipated in substance on Loc8's exact medium; fails claim-form viability independently | High | **Meshtastic `portnums.proto`** — reserved disjoint port bands (0–63 core / 64–127 registered / 256–511 private) carrying consumer chat (`TEXT_MESSAGE_APP = 1`) and professional tactical traffic (`ATAK_PLUGIN = 72`) on one phone-tethered BLE+LoRa flooding mesh, non-cryptographically |
| **B** — priority-ordered load shedding with protected audit write | Obvious | Severely weakened, then destroyed ×2 | **DESTROYED on inventive step**; novelty survives but is near-worthless alone | High | **NIST SP 800-53 Rev 5, control AU-5(4)** — mandates "partial system shutdown; degraded operational mode with limited mission or business functionality available" *to preserve audit logging*, with AU-9(3) requiring cryptographic integrity of audit information. Combined with **US 11,233,672 B2** (Parallel Wireless) or **US 11,994,399 B2** (Bosch "Last Gasp Mode") |
| **C** — fail-safe degradation layering | Anticipated | Destroyed ×3 | **DESTROYED** — anticipated by a 1997 European standard and by a 1998 granted US claim; and not viably claimable | High | **ETSI ETS 300 396-1 (TETRA DMO, Dec 1997)** — the four-tier additive stack (MS↔MS / DM-REP repeater / DM-GATE gateway / trunked SwMI) with "DM is performed without intervention of any Base Station" and emergency calling out of coverage. Pincered by **US 6,226,524 B1 claim 8** (Motorola, filed 1998-12-28) |

### The structural finding

Each candidate fails in a *different* place, and none fails where the client
expects:

- **A fails at contribution.** Its distinguishing feature — that the two
  partitioned ranges denote human *audience* classes — is a relabelling of
  reserved code bands. It is removed from consideration before obviousness is
  even reached (EPO: Comvik T 641/00 + T 1194/97 functional-vs-cognitive data;
  US: MPEP 2111.05 printed matter).
- **B fails at problem formulation.** Its distinguishing feature — "the legal
  record must outlive the service" — is a non-technical legal aim. Under Comvik
  it is *handed to the skilled person inside the problem statement*, leaving a
  routine combination. And NIST already published the instruction to do exactly
  that.
- **C fails at novelty and at claim form.** It is technical, and it is also what
  TETRA Direct Mode has done since 1997.

The common root cause, which the attorney should hear plainly: **in all three
candidates the asserted contribution is articulated as a PURPOSE (semantic
safety, evidentiary survival, architectural resilience) rather than a
MECHANISM.** EPO practice under Comvik is specifically constructed to strip
purpose out of the inventive-step assessment and leave only mechanism.

### Where the research suggests value actually sits — an analytical view, not a recommendation

The technical material Loc8 demonstrably possesses sits in the layers the brief
treats as background plumbing: the 25-byte frame budget and its `int32 × 1e7`
coordinate encoding; fragmentation across bytes 9–24 without a session; TTL 7
clamped to 5 under measured crowd density; duplicate suppression by message ID;
BLE⟷LoRa bridging by stateless anchors. In US terms this is the material that
looks like *Uniloc v LG* (a change in the manner of transmitting data) rather
than like *Electric Power Group* (selecting information by content). **This is a
research observation for the attorney to test — it has NOT been searched, and no
claim is made that it is novel.**

Two adjacent, genuinely technical problems were identified during the run and
are recorded because they are *different inventions* from A/B/C:

1. **Hash-chain continuity across a shedding or power-loss boundary.** A chain
   truncated mid-write is indistinguishable from a tampered one. A mechanism
   that reserves and continuously recomputes an energy budget sufficient to
   complete the outstanding chain-commit — derived from measured cell state and
   temperature — and sequences shedding so that budget is never encroached,
   solves a *data-integrity* problem by technical means and is not answered by
   Comvik. Adjacent to, but not obviously met by, US 12,445,929 B2. **Not
   searched. [INFERENCE].**
2. **State handoff at tier transitions** — how in-flight mesh messages and
   identity/session state survive the Gateway dying mid-incident without
   duplication or loss. Adjacent to US 12,445,929 B2 (pre-replicated local DB).
   **Not searched. [INFERENCE].**

### Headline FTO posture

**Preliminary screen only — this is NOT a freedom-to-operate opinion.** No
INPADOC legal status was verified for any reference in this run (§13).

- **Amber, trending to a real question: Motorola Solutions.** US 12,004,037 B2
  (granted 2024-06-04) and its continuation US 12,445,929 B2 (granted
  2025-10-14) form a **live family still prosecuting**. Pending continuations
  can be drafted to read on a competitor's shipped product; that, not the issued
  claims, is the exposure. US 12,445,929 B2's pre-replicated-local-database
  limitation is the direct analogue of Loc8's Gateway holding the site SQLite DB
  and syncing opportunistically.
- **Amber: Intel IP / Apple US 9,992,806 B2** (granted 2018-06-05, reported
  active to 2036). Claim 1 read verbatim and is short and functional: determine
  D2D-reachable UEs, "generate an announcement message that indicates the
  apparatus can serve as a relay based at least in part on the list", transmit
  it. Any Loc8 behaviour in which a phone or anchor advertises itself as a relay
  should be mapped against it. **Unresolved ownership conflict** — Google
  Patents records both a 2020-06-25 assignment to Apple Inc. and a 2020-07-17
  confirmatory assignment to Intel. Reported, not resolved.
- **Amber: Noodle Technology US 10,839,411 B2** (granted 2020-11-17, reported
  active) — device-to-device relay networks, "appending the validated activity
  to an existing record of prior validated activities", with dependent claims 5
  and 11 adding hashing of an activity summary. This is Loc8's hash-chained
  audit log in Loc8's own network context.
- **Green, and useful: goTenna.** The full 25-record portfolio was enumerated.
  **Negative result:** the most motivated commercial party — which sells both a
  consumer mesh and a public-safety Pro line — holds no patent on audience-class
  code-space partitioning, and its only load-management filings
  (US 11,082,344 B2, US 11,558,299 B2) contain zero occurrences of "load shed",
  "audit log", "hash chain", "tamper-evident" or "thermal".
- **Green: expired/dead art.** Nokia US 8,255,469 B2 (expired, fee related);
  Open Garden US 9,503,975 B2 (expired) and WO 2015/183583 A1 (abandoned,
  never granted anywhere); Motorola US 6,226,524 B1 (expired by statute — 20
  years from a 1998-12-28 filing, 35 USC 154(a)(2)). Zero FTO cost, free
  invalidity art.
- **KNOWN GAP: Bridgefy was not run down.** The brief made it a mandatory
  assignee alongside goTenna. Its portfolio does not appear in the delivered
  findings. This must be commissioned.

### Headline cost and timeline

**UK IPO restructured patent fees on 1 April 2026.** Any figure carried from
pre-2026 knowledge is wrong. All numbers below re-verified against live official
schedules on 2026-07-20.

| | Amount |
|---|---|
| UK "provisional-style" filing, online, filing date only | **£0 in official fees** |
| PCT at RO/GB, ≤30 sheets, PDF e-filing (EPO is the *only* competent ISA) | **£2,787** |
| Official fees to grant, UK + EP + US | **≈ £7,700 (small/micro) – £11,300 (standard)** |
| Including professional fees | **≈ £39,000 – £96,000 per invention** — ESTIMATE; the professional component is **[UNVERIFIED]** and is 80–89% of the total |
| Realistic time to grant | 4–6 years; UK IPO target is 95% of first substantive examinations within **48 months** of the Form 10 request, against a compliance period of 4y6m |

**Nothing is committed before month 12.** The first genuinely large official-fee
commitment is the PCT filing. That is the real decision gate.

### Disclosure do / don't

⚠️ **Workstream 7's dedicated findings did not reach this synthesis** (§13). The
list below is constructed from primary statutory texts and from the art actually
found; the statutory citations were **not re-fetched in this run** and are
tagged accordingly.

- **DO NOT** rely on the US §102(b)(1) one-year grace period. The UK
  (PA 1977 s.2(2)) and EPO (EPC Art 54) apply absolute novelty, subject only to
  the narrow Art 55 exceptions (evident abuse; certain official exhibitions).
  A disclosure that is survivable in the US is fatal in Europe. [UNVERIFIED — statute not re-fetched this run.]
- **DO** treat a festival field trial broadcasting unencrypted 25-byte frames as
  a **probable enabling public disclosure of both the frame format and the
  code-space scheme.** Anyone with a £20 BLE sniffer in the car park can capture
  and reconstruct it. This is the single most concrete disclosure risk in the
  system and it bears directly on Candidate A, whose subject matter *is* the
  wire format. [INFERENCE — reasoned from the system description; enablement authority not verified this run.]
- **DO** understand that Candidate A cannot be protected as a trade secret for
  the same reason: it is visible on the air.
- **DO** raise defensive publication with the attorney as the appropriate,
  near-zero-cost disposition for candidates this thoroughly anticipated. It
  forecloses a competitor patenting the same allocation against Loc8 and secures
  freedom to practise.
- **DO NOT** assume an NDA cures a disclosure problem retrospectively — and note
  that everything in §12 below is *already public today*, so the priority
  question for A, B and C is moot: the art predates any filing Loc8 could make.

---

## 2. System characterization as searched

Restated so the attorney can verify the right invention was assessed. Source:
brief §§1–2.

### 2.1 The four-layer architecture

1. **Phone mesh** — Bluetooth LE phone-to-phone flooding relay. 25-byte packets;
   TTL 7, clamped to 5 in dense crowds; duplicate suppression by message ID.
   Zero infrastructure.
2. **Anchors** — stateless pole-mounted radio translators (~£30–40, ESP32-class).
   Re-broadcast BLE; bridge BLE⟷LoRa (868 MHz) to span ground with no people on it.
3. **Gateway** — one per site, Raspberry Pi 4/CM4 class (~$93–113 BOM). Holds the
   site SQLite database and a hash-chained audit log; relays to a control-room
   console over LAN with mTLS; syncs to cloud opportunistically; acts as LoRa
   trunk head-end; and is also the best mesh node in the building. LFP-battery
   backed, PoE+ powered.
4. **Command console** — ordinary computer on the venue LAN; no Bluetooth — the
   Gateway is its radio.

### 2.2 The 25-byte frame

`type(1) senderId(4) targetId(4) lat(4, int32 × 1e7) lon(4, int32 × 1e7)
heading+floor(2, packed) battery(1) timestamp(4) accuracy(1)`

Text messages overlay bytes 9–24 with fragmentation fields
(`msgId`/`seq`/`total`/`len`) plus 11 payload bytes.

### 2.3 The three candidates, as elements

**Candidate A — disjoint code-space audience separation.** (i) a single shared
physical mesh carrying two audience classes; (ii) semantic message codes
partitioned into disjoint ranges per audience class (consumer quick-replies 1–7;
operational security statuses 20–23); (iii) cross-class misinterpretation made
structurally impossible by the partition itself; (iv) achieved without separate
networks, separate radios, priority tagging alone, or cryptographic separation.

**Candidate B — priority-ordered load shedding with a protected audit write.**
(i) resource-duress detection (battery/thermal); (ii) an ordered shedding
schedule over heterogeneous functions (cloud sync, console relay, LoRa trunking,
mesh participation); (iii) a tamper-evident hash-chained audit log; (iv) an
invariant that the audit write survives all shedding stages at maximum
durability (SQLite `synchronous=FULL`); (v) the evidentiary-record-outlives-the-service
rationale.

**Candidate C — fail-safe degradation layering.** (i) strict layering, each layer
purely additive; (ii) no layer is a dependency of the layer below it; (iii) the
terminal fallback is a *functioning* zero-infrastructure device-to-device mode,
not degraded service or outage.

### 2.4 Reference date

Nothing has been filed. **2026-07-20 is the effective reference date.** Everything
publicly available today is citable prior art against all three candidates. There
is no before-date filtering to do.

---

## 3. Patent landscape by assignee

**Legal-status warning applying to every row in this section.** Google Patents
returned HTTP 503 on every attempt across the entire run; Espacenet returned
HTTP 403; PatentsView redirected; the USPTO PED and assignment APIs were
unreachable. **No INPADOC legal-status event was read for any patent below.**
Where a status is given it is either (a) reported by a secondary source and
tagged, or (b) derived by statute and tagged as inference. Claim text was read
from FreePatentsOnline full text and, for US 6,226,524 B1, from the granted
patent image PDF.

### 3.1 Motorola Solutions — the incumbent, and the densest cluster

The single most important landscape finding: **Motorola holds granted claims on
essentially every narrowing road out of Candidate C, spanning 1993 to 2025.**

| Number | Title / substance | Dates | Status | Relevance |
|---|---|---|---|---|
| **US 5,423,055** | Trunked communication system with automatic repeater talk-around. Claim 1 verbatim: "automatically determining whether to implement a repeater talk-around communication", with geographic-location gating | filed 1993-06-29, granted 1995-06-06 | Expired c. 2013 `[INFERENCE]` — pre-URAA, transition rule not verified | C |
| **US 6,226,524 B1** | *Method of automatically selecting talk-around mode or repeater mode depending on repeater availability.* **THE ANTICIPATION REFERENCE FOR C.** Claims 1 and 8 read verbatim from the granted patent image | filed 1998-12-28, granted 2001-05-01 | **EXPIRED with certainty** — 35 USC 154(a)(2), 20 years from filing → term ended by 2018-12-28 | C (anticipation), zero FTO cost |
| **US 7,010,313** | Communication system with controlled talk around mode. Claim 1 verbatim: three-tier automatic descent on a measured RSSI window whose terminal tier is "a direct communication mode, which is independent of the communication system" | filed 2001-07-16, granted 2006-03-07 | Expired c. 2021 + unchecked PTA `[INFERENCE]` | C — occupies the threshold/hysteresis narrowing |
| **US 10,764,894 B2** | Devices losing the infrastructure band derive a direct-mode fallback channel *deterministically* from network identifiers (TAC/IBN/PSID×TGID), so peers land on the same channel with zero configuration | — | `[UNVERIFIED]` | C — occupies the zero-config narrowing |
| **US 11,540,351 B2** | Claim 1 verbatim: generate a fallback threshold *and per-site return thresholds* from measured radio characteristics; switch; scan while switched; return when RSSI exceeds the return threshold | filed 2020-02-20, granted 2022-12-27 | `[UNVERIFIED]` | C + FTO. **More sophisticated than Candidate C** — has hysteresis, which C does not |
| **US 12,004,037 B2** | Fallback in a multi-tenant system. Claim 1 read **verbatim and in full** this run, correcting an earlier truncated/paraphrased record: the link determined to have failed is a **second** link between a third and a fourth RF site across two RANs, while the link *dropped* is the **first** link. Materially narrower than the paraphrase implied | filed 2021-07-06, granted 2024-06-04 | Reported in force to 2041 `[UNVERIFIED]` | C + **FTO amber** |
| **US 12,445,929 B2** | Continuation. Adds the mechanism that makes additive layering work: the local site **pre-replicates the subset of the cloud database** it needs to run locally the instant the cloud link dies | granted 2025-10-14 | **Family LIVE and still prosecuting** `[UNVERIFIED]` | C + **FTO amber — the highest-value FTO item in the report** |

`[UNVERIFIED]` claims of US 10,764,894 B2, US 11,540,351 B2 (spec) and
US 12,445,929 B2 claim 1 (returned only in condensed form).

### 3.2 Apple / Intel

| Number | Title / substance | Dates | Status | Relevance |
|---|---|---|---|---|
| **US 10,228,751 B2** (Apple) | Claim 1 verified: battery characteristic below a first threshold; continue boot "according to the low power mode" performing "only a second set of functions, a subset of the first set", with a designated critical function (pre-authorised wireless/NFC transactions) preserved into the degraded mode | filed 2015-07-14, granted 2019-03-12 | `[UNVERIFIED]` | B — discloses element (i) and the *structure* of (iv). Confirmed NEGATIVE on log/audit/hash/durability |
| **US 9,992,806 B2** (Intel IP; conflicting Apple assignment) | *Public safety discovery and communication using a UE-to-UE relay.* Claim 1 verbatim: determine a list of D2D-reachable UEs; "generate an announcement message that indicates the apparatus can serve as a relay based at least in part on the list"; transmit. Short, functional, no goods-or-services or MIC limitation | filed 2015-07-29, granted 2018-06-05 | Reported active to 2036 `[UNVERIFIED]` | C + **FTO amber**. **Ownership conflict reported, not resolved** — Google Patents records a 2020-06-25 assignment to Apple and a 2020-07-17 confirmatory assignment to Intel |
| **US 11,765,778 B2 / US 10,638,293 B2 / US 10,728,937 B2** (Apple) | "Off Grid Radio Service" (OGRS) — a bespoke infrastructure-free D2D radio stack (synchronisation, master information block, frequency-hopping peer discovery) for out-of-coverage operation, 2017 priority | — | `[UNVERIFIED]` — my fetch of US 11,765,778 B2 returned HTTP 503 | C — evidence that terminal-fallback-to-D2D was an established, heavily-invested goal at a major assignee. FTO risk low (PHY-layer; Loc8 rides standard BLE) |

### 3.3 goTenna — the closest commercial player, and a reportable negative

Full portfolio enumerated via FreePatentsOnline assignee search `AN/"goTenna"`
(25 records): US 9,756,549; 10,015,720; 10,602,424; 9,992,021; 10,164,776;
10,813,169; 11,297,688; 10,944,669; 11,750,505; 11,082,324; 11,811,642;
11,082,344; 11,558,299; 11,563,644; plus applications.

**Negative result, and a useful one:** goTenna holds **no** patent on
audience-class code-space partitioning, despite selling both a consumer mesh and
a public-safety Pro line. Its only load-management filings —
**US 11,082,344 B2** and **US 11,558,299 B2** — are congestion-triggered (not
duress-triggered) uniform rate modulation, MAC-measures/Transport-decides. Team
full-text search confirmed **zero** occurrences of "load shed", "shedding",
"audit log", "hash chain", "tamper-evident" or "thermal". Recorded as a
searched-and-cleared near miss an examiner may nonetheless cite.

### 3.4 Open Garden / FireChat — dead, and therefore pure invalidity art

| Number | Substance | Status | Relevance |
|---|---|---|---|
| **US 9,503,975 B2** | Claim 1 requires clients to periodically report "battery capacity, fraction of battery power available, **battery temperature**, available connections types … and currently running applications" to a heuristic that reassigns communication and processing | **EXPIRED (Fee Related)** | B element (i) at its broadest — battery *and thermal* duress driving peer-network behaviour. Dead everywhere → zero FTO cost |
| **WO 2015/183583 A1 / US 2017/0070841 A1** | Claim 22: if a neighbour has it, get it from the neighbour; when no neighbour has it, fall back to the app store — conditional selection between a peer path and an infrastructure path | **ABANDONED / Ceased — never granted anywhere** | C — the structural inverse. Invalidity art only |

### 3.5 Nokia

**US 8,255,469 B2** — connectionless, address-less broadcast flooding over a
zero-infrastructure ad-hoc phone mesh to find which "communities" are present
nearby, with a **festival group-finding worked example** in the specification.
Priority 2009. **Status: EXPIRED — Fee Related.** Continuations
US 8,856,252 B2 / US 9,277,477 B2 / US 10,057,753 B2 and EP 2436198 A1 /
CN 102461218 B were **NOT individually status-checked** — a live continuation
would change the FTO picture. My attempted fetch of US 10,057,753 returned
ECONNRESET twice; that check remains **OPEN**.

**Correction to the team record, reported because it is adverse to the
optimistic evidence:** the team carried Nokia as disclosing Candidate A element
(ii). Claim 1 read verbatim shows separation is achieved by *"a community
identifier corresponding to the community"* carried in a broadcast "community
search message" — an **addressing/identifier field, not a partitioned semantic
message-code space**. The header is described only as containing "a TX field to
identify the transmitter node ID (NID)". **Downgrade Nokia to weak background
art for element (i) only.**

### 3.6 Axon

**US 11,995,734 B2** — claim 1 read verbatim: transmit an "audit tag … assigned
an urgent categorization … during the first transmission prior to a data
upload", the server generating a record to confirm later receipt, expressly so
as *"to ensure the recorded data associated with the audit tag … is not lost,
spoiled, or destroyed"*. Filed 2022-03-10, granted 2024-05-28.

This puts **Candidate B's element (v) rationale — and the audit-record-ahead-of-the-payload
mechanism — into GRANTED CLAIM LANGUAGE.** Confirmed NEGATIVE on hash chain,
battery/thermal duress, and ordered shedding (its trigger is bandwidth, not power).

### 3.7 Parallel Wireless — the closest art to Candidate B on the shedding limb

**US 11,233,672 B2**, *Dynamic power management*, priority 2015-03-30, granted
2022-01-25 (sibling US 10,093,251 B2). Claim 1 read verbatim: a vehicle-mounted
base station with a voltage measurement module coupled to the vehicle battery,
a power management unit "configured to monitor the battery … determine a power
state … and coordinate access radio shutdown or graceful user detach … based on
the determined power state", where "the base station provides functionality so
that an emergency responder has cellular coverage" and "operates in conjunction
with other base stations in a mesh configuration".

The **specification** discloses Candidate B elements (i)+(ii) explicitly and
verbatim:

> "the mobile base station may turn off first its Wi-Fi access radio, then its
> mesh access radio, then its LTE access radio, before turning off its LTE
> backhaul radio … **the sequence of radios to be turned off may be
> configurable** … certain functionality … may be **tagged or identified as
> essential** (e.g., LTE backhaul) **or non-essential** (e.g., Wi-Fi access radio)."

That is an ordered, configurable shedding schedule across heterogeneous radio
functions with essential/non-essential tagging and a designated last-to-die
function, in a battery-backed field radio node for emergency responders.

### 3.8 Robert Bosch GmbH — found by the red team, closer to B than Parallel Wireless

**US 11,994,399 B2**, *Management and upload of ride monitoring data*, filed
2020-10-12, granted 2024-05-28. Claim 1 and the following specification passages
read verbatim:

> **"Last Gasp Mode"**: "if the power cable is unplugged during an active ride,
> the monitoring device transitions to battery power, **finishes recording the
> current ride data chunk, stops recording from all sensors, notifies the cloud
> storage backend, notifies the mobility service provider, uploads the last
> three ride data chunks, and safely shuts down.**"
>
> "The battery operation modes are included to ensure that data is protected in
> the event of a power loss during an active ride."
>
> Thermal: "the monitoring device monitors the temperature at multiple locations
> of the device and will safely shutdown if it's internal temperature is too high."
>
> Purpose: records exist for "occasions when disputes arise between the rider
> and the driver or between riders during the ride".

**This is Candidate B elements (i) [battery AND thermal], (ii), (iv) and (v) in
ONE document, in a device functionally identical to Loc8's Gateway — a
battery-backed edge appliance whose reason to exist is holding an evidentiary
record.** Confirmed **NEGATIVE on element (iii)**: Bosch's integrity means are
per-chunk AES, "RSA asymmetric encryption and SHA hashing for Public Key
Infrastructure (PKI) and related signing/certificate operations", secure boot,
OS integrity check and physical tamper detection — **no chained digest over log
entries**.

Sibling **US 11,748,407 B2** (granted 2023-09-05), claim 1 read verbatim, carries
the same Last Gasp and thermal passages. Further family members located but not
read: US 11,941,150 B2; US 2022/0113148 A1; US 2022/0114212 A1; US 2022/0114280 A1.

**FTO flag:** status and family are `[UNVERIFIED]` (Google Patents 503 ×3).
`[INFERENCE]` from 2024/2023 grant dates with no maintenance fee yet due:
presumptively in force in the US. **A live EP family member would convert Bosch
from invalidity art into an FTO item.** That check must be commissioned.

### 3.9 Other assignees touching the candidates

| Number | Assignee | Substance | Relevance |
|---|---|---|---|
| **US 8,841,990 B2** | Franklin W. Bell (individual) | Claim 1 verbatim: separating a "specialized category of recipients" (police, fireman, ambulance) from "general public" on ONE shared broadcast, "by **code selection** and Program ID usage"; the public portion is "free from instructions" | **A** — audience-class separation on a shared medium, expressly non-cryptographic |
| **US 10,536,978 B2** | Ericsson | Claim 1 verbatim: LCID value "within a range of 00001 to 01010"; determine whether it "is associated with a non-standard class of wireless communication device". Spec: "reserving a first subset of available LCID values … and reserving a second subset … for identification of one or more non-standard classes" | **A** — literal disjoint-subset partition of one protocol code space on one shared radio |
| **US 10,839,411 B2** | Noodle Technology | Claim 1: "appending the validated activity to an existing record of prior validated activities"; claims 5 and 11 (read verbatim): "creating a summary of each activity in the record; generating a hash of the summary; and storing the hash in a decentralized data storage system" | **B element (iii) in Loc8's own field** + FTO amber. Reported ACTIVE `[UNVERIFIED]` |
| **US 7,493,441 B2** | Dot Hill Systems | Claim 1 verbatim: on "detecting said loss of main power", switch battery power to a first subset of memory banks holding "critical data … which must be retained", and "disable said second subset … from receiving power" | **B** (i)+(iv) in bare hardware form |
| **US 11,509,521 B2 / US 11,601,330 B2** | Fenix Group | Claim 1: "an automatic failover detection system … receives as input a plurality of network parameters and automatically performs failover and communication modality switching". Spec discloses LTE → MANET → satellite cascade | **C** — destroys the "four tiers not two" residue. **FTO low**: both independent claims require a cellular core and base station; the continuation additionally requires "at least one virtual machine (VM) implementing an Evolved Packet Core (EPC)". Loc8 has neither |
| **US 7,245,216** | Tri-Sentinel | Claim 1 verbatim: mobile devices with network + positioning subsystems "automatically assembling a wireless network among the mobile devices", automatic switch to an alternative channel "in response to a failure of the primary channel", plus "at least one control system … tracking and mapping individual positions". Priority 2004-11-15, granted 2007-07-17 | **The shape of the WHOLE Loc8 system from 2004, not merely of Candidate C. Flagged for attorney attention beyond this brief's scope** |
| **US 11,706,686 B2** | Peltbeam | Claim 1 read verbatim expecting a cloud→mesh anticipation. **It is NOT one** — every path, primary and secondary, is established by "a central cloud server that comprises a processor" | **Reported against my own case.** Corroborates that recent cellular/mesh art is network-anchored |
| **US 10,959,078 B2** | Qualcomm | D2D emergency assistance broadcast — **but claim 1 REQUIRES a successful network emergency call to a PSAP and a PSAP-issued token first** | **A point in Loc8's favour on bare novelty**, recorded for balance: mainstream D2D-emergency art is network-anchored. Does not help on inventive step |
| **US 9,894,591 B2** | Samsung | Reported to require the relaying UE to be within network coverage | C — same balance point `[UNVERIFIED]` |
| **US 11,139,954 B2** | Microsoft | Hash committed to a ledger with off-chain record, for proof against tampering and chain of custody. Priority 2017 | **B element (iii). CLAIMS NOT READ — named gap** |
| **US 11,676,230 B2** | Sumo Logic | Hash-based tamper detection over an evidence chain of custody. Reported priority ~2006 | **B element (iii). CLAIMS NOT READ — named gap. If the ~2006 priority holds it predates everything else on element (iii)** |
| **US 11,962,697** | Johnson Controls Tyco | Blockchain chain-of-custody for body cams. Claim 1 read verbatim: no shedding, no duress trigger. **Its only low-battery passage is ADVERSE to Loc8's concept** — the camera WIPES memory when battery is low | B — reported for balance |
| **US 8,977,860 / US 8,447,989** | Ricoh | Hash-chained embedded tamper-proof log in a capture device. Claim 1 of '860 read verbatim; spec confirmed to contain **NO** battery, power, shutdown-ordering or function-disabling disclosure | B — clean split: hash-chained evidentiary log with zero power-duress content |
| **RE 47,894** | III Holdings 2, LLC | Reissued 2020-03-03, priority 2006-07-27. **Live reissue** | **FTO follow-up — partial claim 1 only, not resolved** |

### 3.10 False friends — surfaced, examined, and DISCARDED

Recorded so the attorney does not re-spend effort:

- **US 11,611,390 B2** (SkyStream), *"Enhanced LDACS system having different user
  classes"* — title is exactly on point; claim 1 read verbatim is **pure QoS**:
  classes of *service* mapped to EPC bearers with "priority communication to a
  first LDACS airborne station having a higher user class of service" and
  preemption. Its classes ("emergency", "military", "commercial", "civil") are
  QCI priority tiers — which is precisely the "priority tagging alone" that
  Candidate A element (iv) expressly disclaims. **Not a code-space partition. Do
  not cite against A.**
- **US 8,130,704** (Sony, multi-tier wireless home mesh) — claim 1 read verbatim;
  its "tiers" are **node roles** (gateway / AC-powered stationary /
  battery-powered mobile), not fallback layers. Not on point for C.
- **US 10,216,563 / US 2016/0196176** (TRW Ltd, *Safety filter in a vehicle
  network*) — a fault-triggered runtime message filter, not a code-space
  partition. Discarded for A.
- **US 11,334,388** (Amber Solutions) — claim 1 is smart-outlet service offload.
  False positive for B.
- **US 12,231,996** (*Radio vehicle sidelink discovery*) — sole hit on one A-query,
  not on point.

---

## 4. Standards and academic prior-art timeline (oldest → newest)

Each entry mapped to the candidate elements it touches. Verification status
stated per row.

| Date | Source | What it discloses | Touches | Verified? |
|---|---|---|---|---|
| **1853** | *O'Reilly v. Morse*, 56 U.S. (15 How.) 62 | A claim to a result "however developed" is invalid — the doctrinal ancestor of the result-oriented-claim objection | **C claim form** | Verified via ChargePoint/Interval quotation |
| **1991** | Haber & Stornetta, *How to Time-Stamp a Digital Document*, J. Cryptology | Hash chaining of records | **B (iii)** | `[UNVERIFIED]` — not re-fetched |
| **Dec 1997** | **ETSI final draft prETS 300 396-1** (ref DE/RES-06007-1, ICS 33.020), *TETRA; Technical requirements for Direct Mode Operation; Part 1: General network design* | **THE KILLER FOR C.** §3.1: "Direct Mode (DM): A mode of simplex operation where mobile subscriber radio units may communicate using radio frequencies which may be monitored by but which are outside the control of the TETRA Trunked network. **DM is performed without intervention of any Base Station (BS).**" §1 Scope covers "the basic air interface, the inter-working between DM groups via **repeaters**, and inter-working with the TETRA V+D system via **gateways**." §4.1 Figures 1–5 give the four-tier stack: MS↔MS / DM-REP / DM-GATE / SwMI — with DM-REP defined as "a repeater function to enable two or more DM-MSs to **extend their coverage range**" and Figure 5 disclosing the **combined DM-REP/GATE unit**. §8.4: "The DM air interface supports emergency calling. A DM-MS initiating an emergency call **out of coverage** of the system may use a DM channel and, if necessary, pre-empt any lower priority communication" | **C (i), (ii), (iii) — all three, in one document** | **VERIFIED as to text** (full PDF extracted via pdftotext). **`[UNVERIFIED]` as to provenance** — obtained from a qsl.net mirror because etsi.org returned HTTP 403. Certified copy must be pulled from the ETSI portal |
| **1998** | Schneier & Kelsey, *Cryptographic Support for Secure Logs on Untrusted Machines*, 7th USENIX Security Symposium | Forward-secure tamper-evident audit logs | **B (iii)** | `[UNVERIFIED]` — not re-fetched; underlying state of the art not in doubt |
| **1999** | Ni et al., *The Broadcast Storm Problem in a Mobile Ad Hoc Network*, MobiCom | Counter-based / probabilistic flood suppression | Loc8 layer 1 generally | `[UNVERIFIED]` — brief lead, not run down |
| **c. 2000** | Vahdat & Becker, *Epidemic Routing for Partially-Connected Ad Hoc Networks*, Duke TR | Epidemic flooding | Loc8 layer 1 | `[UNVERIFIED]` — brief lead, not run down |
| **2004** | RFC 4838, *Delay-Tolerant Networking Architecture* | Partition tolerance by design | **C** | `[UNVERIFIED]` — brief lead, not run down |
| **2007** | *KSR Int'l Co. v. Teleflex Inc.*, 550 U.S. 398 | "The combination of familiar elements according to known methods is likely to be obvious when it does no more than yield predictable results"; "finite number of identified, predictable solutions"; "a person of ordinary creativity, not an automaton" | **A, B, C** | **VERIFIED verbatim** (law.cornell.edu) |
| **2013** | RFC 6962, *Certificate Transparency* | Merkle hash-chained append-only tamper-evident log | **B (iii)** | `[UNVERIFIED]` — not re-fetched |
| **Aug 2014** | Qualcomm, *LTE Direct — Always-on Device-to-Device Proximal Discovery* | Reported: one 128-bit expression code space on one shared D2D network split into private (audience-targeted) and public classes, public class further partitioned by a managed interest hierarchy, rationale being to combine all applications onto one network. **Adverse to Loc8's element (iv)**: enforcement is cryptographic | **A (i), (ii), (iv)** | **`[UNVERIFIED]` — PDF not re-fetched. Flagged as a PRIORITY re-read: on the team's description it may sit closer to Loc8 than Bell does, because it is D2D rather than broadcast** |
| **2017-06** | **RFC 8126 / BCP 26** §4, Cotton, Leiba & Narten, *Guidelines for Writing an IANA Considerations Section in RFCs* | **THE MOTIVATION-TO-COMBINE FOR A**: "it often makes sense to **partition a namespace into multiple categories**, with assignments within each category handled differently. Many protocols now partition namespaces into two or more parts, with one range reserved for Private or Experimental Use while other ranges are reserved for globally unique assignments … **Dividing a namespace into ranges makes it possible to have different policies in place for different ranges and different use cases.**" A published Best Current Practice instructing every protocol engineer to do exactly what A claims | **A (ii), (iv) — and it kills any "no motivation to combine" rebuttal** | **VERIFIED verbatim** (rfc-editor.org) |
| **2017-07-13** | **Bluetooth Mesh Profile Specification v1.0**, Bluetooth SIG | §3.7.3.1 + **Table 3.43 "Opcode formats"** (p.93 of 331): "0xxxxxxx (excluding 01111111) = 1-octet Opcodes; 01111111 = Reserved for Future Use; 10xxxxxx xxxxxxxx = 2-octet Opcodes; 11xxxxxx zzzzzzzz = 3-octet Opcodes", with 1- and 2-octet reserved to "Bluetooth SIG defined application opcodes" and 3-octet to "manufacturer-specific opcodes … managed by the company associated with the identifier". §2.3.4: "**Messages are dispatched within models based on opcodes and element addresses.**" §3.7.4.4 *Message error procedure*: "**When receiving a message that is not understood by an element, it shall ignore the message**", conditioned on "The application opcode is unknown by the receiving element" — with a Note confirming a message may pass "the NetMIC and TransMIC authentication using a known network key and application key" and still be not understood, i.e. **opcode separation operates independently of cryptography** | **A (ii), (iii), (iv) — verbatim and NORMATIVE, on the exact radio layer Loc8 uses** | **VERIFIED** — 331-page PDF downloaded from the SIG docman and extracted locally |
| **2017** | Motorola Solutions, *ASTRO 25 Systems At A Glance* (part 01-2017) | "Built with **multiple levels of redundancy and fallback modes**, ASTRO 25 systems maintain wide-area communications … even in the event of multiple points of failure" | **C** | **VERIFIED** via pdftotext |
| **2018-05-27** | Bharat Bhatia (Chair, ITU-R WP5D SWG on PPDR; Head of International Spectrum, Motorola Solutions), *Status and Trends of PPDR Communications*, ITU-R | Slide **"LIMITING THE IMPACT OF SYSTEM FAILURES / RESILIENCE TO FAILURE AT MULTIPLE LEVELS"**, listing in descending order: Fault Tolerant Components / Redundant Components / Geographic Redundancy / Redundant Links / Edge Availability / **Fallback Local Control (Site Trunking)** / **Fallback Local Basic Control (Failsoft)** / **Talkaround (Direct-Mode)**, captioned "CONTINUED OPERATION, EVEN IN A CATASTROPHE" | **C — the four-tier ladder as published engineering doctrine** | **VERIFIED** via pdftotext (itu.int) |
| **2020-09** | **NIST SP 800-53 Rev. 5**, control **AU-5(4) SHUTDOWN ON FAILURE** (p.69), with **AU-9** and **AU-9(3) CRYPTOGRAPHIC PROTECTION** (pp.73–74) | **THE KILLER FOR B.** AU-5(4): "Invoke a [Selection: full system shutdown; **partial system shutdown**; **degraded operational mode with limited mission or business functionality available**] in the event of [organization-defined audit logging failures], unless an alternate audit logging capability exists." Discussion: "partial system shutdowns or operating in a degraded mode with reduced capability may be viable alternatives". AU-9(3) requires "cryptographic mechanisms to protect the integrity of audit information", the Discussion naming "signed hash functions". **A federal control catalogue directing the implementer to degrade the service in order to preserve the audit record, and to protect it cryptographically** | **B (iii), (iv), (v)** | **VERIFIED** — official PDF downloaded from nvlpubs.nist.gov and extracted locally |
| **2021 →** | Meshtastic `meshtastic/portnums.proto` (open source) | **THE KILLER FOR A.** Verbatim band comments: "**0-63 Core Meshtastic use, do not use for third party apps**"; "**64-127 Registered 3rd party apps**…"; "**256-511 Use one of these portnums for your private applications that you don't want to register publically**"; "All other values are reserved." Consumer class `TEXT_MESSAGE_APP = 1`, `TEXT_MESSAGE_COMPRESSED_APP = 7`, `ALERT_APP = 11`. Professional/tactical class `ATAK_PLUGIN = 72`, `ATAK_PLUGIN_V2 = 78`, `ATAK_FORWARDER = 257`. Medium verified at meshtastic.org/docs/overview/mesh-algo: managed flooding, "every node rebroadcasts a packet it receives, up till a certain hop limit", listen-before-rebroadcast duplicate suppression, HopLimit decremented (3-bit header field), 32-bit packet ID dedup, LoRa transport with **phones attached over Bluetooth LE** | **A (i), (ii), (iii), (iv) — all four, on Loc8's exact architectural layer** | **VERIFIED verbatim** (raw.githubusercontent.com). **Dating `[UNVERIFIED]` pre-2021** — GitHub path filter does not follow renames; web.archive.org unreachable. **Immaterial: brief §3 makes today the reference date** |
| **2021 →** | Meshtastic ATAK-Plugin README; US DoD `AndroidTacticalAssaultKit-CIV` | "Seamless integration between the **Android Team Awareness Kit (ATAK)** and Meshtastic mesh networking devices", sharing "position location information (PLI), chat messages, and other CoT events", users identified as "**tactical teams**". ATAK characterised by its official DoD repository as "the official geospatial-temporal and situational awareness tool used by the US Government", "designed for use by federal employees" | **A (i) — establishes the two AUDIENCE classes on that one mesh** | **VERIFIED verbatim** |
| **2022-11** | **ISO/IEC 15408-2 / Common Criteria CC:2022 Part 2 Rev 1**, §8.7.14–8.7.16 (p.46) | Second independent standards body codifying B's "invariant": FAU_STG.3.3 — "ensure that [metric] stored audit data will be maintained when the following conditions occur: [selection: audit data storage **exhaustion, failure, attack**]"; FAU_STG.5.1 offers as a standard menu option "**prevent audited events**, except those taken by the authorized user with special rights" — i.e. halt the service rather than lose the record | **B (iv), (v)** | **VERIFIED verbatim** (commoncriteriaportal.org) |
| **current** | **14 CFR § 25.1457(d)(5)** — cockpit voice recorder independent power supply | "(i) That provides 10 ±1 minutes of electrical power to operate both the cockpit voice recorder and cockpit-mounted area microphone" and "(iii) To which the … recorder … [is] switched **automatically** in the event that all other power … is interrupted" | **B (i)+(iv)+(v) as binding airworthiness law** | **VERIFIED** — but fetched from Cornell LII (eCFR redirected to a bot-check host). Amendment date `[UNVERIFIED]` |
| **current** | **SQLite documentation, `PRAGMA synchronous`** | "FULL is the **default** synchronous mode for a rollback journal"; and, **adversely for Loc8**, "**FULL is not necessarily durable across a power loss in rollback mode, so if durability is desired, it is best to set the synchronous mode to EXTRA.**" Also, in tension: "EXTRA is no different from FULL in WAL mode" and "FULL is atomic, consistent, isolated, and durable (ACID) in WAL mode" | **B (iv) — destroys the "maximum durability" limb on its own terms** | **VERIFIED** (sqlite.org) |

### 4.1 Standards NOT run down — named gaps, each capable of worsening the verdict

Recorded per brief §7.13 so the attorney can commission them specifically. None
of these were reachable: etsi.org and 3gpp.org returned HTTP 403 to every direct
fetch attempted across the run.

- **Against A:** GMDSS/DSC message categories (distress / urgency / safety /
  routine) in one shared maritime protocol; **ITU-R M.493** DSC; **ITU-R M.1371
  AIS** message types 1–27 (self-organising TDMA maritime mesh, disjoint IDs per
  participant class — vessel / shore station / SAR aircraft / aid-to-navigation);
  aviation transponder reserved codes 7500/7600/7700; Link 16 / MIL-STD-6016
  partitioned message catalogues; **ETSI EN 300 392-2** TETRA status ranges
  (0–32767 ETSI-defined vs 32768–65535 user-defined, plus reserved emergency
  status); P25/DMR message-category separation; 802.11e EDCA access categories;
  DiffServ code points. **Any one of these could convert A's obviousness finding
  into an outright anticipation finding.**
- **`[UNVERIFIED]` and expressly NOT relied on:** SAE J2735 DSRCmsgID allocation
  (basicSafetyMessage / emergencyVehicleAlert / personalSafetyMessage as
  consumer-vs-professional classes in one partitioned message-ID space on a
  shared D2D safety medium). Three attempts to reach the ASN.1 in the US DOT
  `usdot-jpo-ode/asn1_codec` repository returned 404s and empty directories.
  Worth ten minutes of an attorney's time as belt-and-braces.
- **Against C:** ETSI EN 300 396-3 (MS-MS air interface), -4 (Type 1 repeater),
  -5 (gateway) — the multi-part structure alone evidences the additive layering;
  3GPP TS 23.303 (ProSe) and TS 23.379 (MCPTT off-network) — both returned HTTP
  403; P25 talkaround; DMR direct mode; **PACE plan** (Primary / Alternate /
  Contingency / Emergency), US Army doctrine published by CISA for emergency
  communications — cisa.gov and globalsecurity.org both returned HTTP 403, so
  this is Wikipedia-sourced only and is tagged `[UNVERIFIED]`. If PACE holds at
  primary source, **four-tier ordered fallback ending in the most austere working
  mode is a named, taught doctrine in Loc8's exact field.**
- **GB 2260881 A** (*Trunked system fallback operation*) — surfaced twice, never
  resolved. The one UK-register document in the C cluster; the natural next pull
  if a GB-domestic anchor is wanted.

---

## 5. Candidate A — disjoint code-space audience separation

**RESOLVED VERDICT: DESTROYED.** Anticipated in substance by a single reference
on Loc8's own medium; unanswerably obvious over that reference in view of a
published Best Current Practice; and independently unviable as a claim. **The
research finds no drafting value in Candidate A.**

### 5.1 Closest art

1. **Meshtastic `portnums.proto`** — one phone-tethered BLE+LoRa managed-flooding
   mesh, semantic dispatch-code space partitioned into reserved disjoint bands,
   carrying consumer chat and professional tactical (ATAK) traffic
   non-cryptographically. *(Found by the red team; NOT in the collected art.)*
2. **Bluetooth Mesh Profile v1.0 §3.7.3.1 / Table 3.43 / §3.7.4.4** — disjoint
   opcode ranges by leading bits, semantic dispatch on opcode, and a **normative
   `shall ignore`** for unknown opcodes operating independently of the crypto layer.
3. **US 8,841,990 B2** (Bell) — two audience classes (first responders vs general
   public) on one shared broadcast, separated expressly "by code selection".
4. **US 10,536,978 B2** (Ericsson) — "reserving a first subset … reserving a
   second subset" of one code space, subset determining participant class.
5. **RFC 8126 / BCP 26 §4** — the published instruction to partition namespaces
   into ranges with per-range policies.

### 5.2 Element-by-element comparison

| A element | Bluetooth Mesh v1.0 (VERIFIED) | US 8,841,990 B2 Bell, cl.1 (VERIFIED) | US 10,536,978 B2 Ericsson, cl.1 (VERIFIED) | **Meshtastic `portnums.proto` (VERIFIED)** | Gap left for Loc8 |
|---|---|---|---|---|---|
| **(i)** single shared physical mesh, two audience classes | One shared BLE mesh; classes are SIG-defined vs manufacturer-defined — **definer** classes, not human audiences | One shared broadcast carrying BOTH "a specialized category of recipients" (police, fireman, ambulance) AND "general public" — squarely two **audience** classes. Medium is EAS broadcast, not a mesh | One shared radio link, standard vs non-standard **device** classes | **One phone-tethered BLE/LoRa flooding mesh carrying consumer chat (`TEXT_MESSAGE_APP=1`) AND US-Government tactical ATAK traffic (`ATAK_PLUGIN=72`)** — audience classes AND the correct medium, in one document | **NONE.** Meshtastic supplies both halves simultaneously |
| **(ii)** codes partitioned into disjoint ranges per class | **Directly disclosed.** Table 3.43 allocates the opcode space into mutually exclusive ranges by leading bits | Separation "by **code selection**" — prefix code + delimiter, not numeric ranges | **Directly disclosed**, literal reserved disjoint subsets | **Directly disclosed**: 0–63 core / 64–127 registered / 256–511 private / "All other values are reserved" | **Essentially nil.** Disclosed literally by three independent verified references |
| **(iii)** cross-class misinterpretation structurally impossible | **Stronger form**: leading bits determine opcode length *and* code space, so a vendor opcode cannot be parsed as a SIG opcode. §3.7.4.4: unknown application opcode → "**it shall ignore the message**" | Generic devices "without any special code" receive only the uncoded portion, which "is free from instructions" | Class determined purely by which reserved subset the value occupies | Dispatch is strictly on portnum; a payload on 1 can never decode as ATAK CoT and vice versa | **Nil.** This is the necessary consequence of disjoint allocation — a tautology of disjointness, not an effect |
| **(iv)** without separate networks/radios, priority tagging alone, or crypto | One radio, one frame format, no crypto in the SIG/vendor distinction — and §3.7.4.4's Note **expressly** distinguishes the opcode mechanism from NetMIC/TransMIC | Expressly non-cryptographic: "by code selection and Program ID usage" | One shared MAC layer, no crypto in the LCID subset determination | Same mesh, same radio, same packet format; no priority field, no cryptographic gating (channel PSKs are orthogonal) | **Nil** |

### 5.3 The delta, stated precisely

After the art, what remains of Candidate A is **the choice of LABEL for two
reserved code bands.** No new structure, no new encoding, no new decoding rule,
no new radio behaviour. Loc8's codes 1–7 (`0x01–0x07`) and 20–23 (`0x14–0x17`)
are separated by exactly `(type & 0x10)` — **a one-bit class flag**, which is the
identical technique to Bluetooth Mesh's Table 3.43 partition one bit position to
the left.

### 5.4 Initial assessment — OBVIOUS (high confidence)

The optimistic pass concluded that no single reference anticipated all four
elements, so bare novelty under EPC Art 54 / PA 1977 s.2 / 35 USC §102 *probably*
survived on carefully worded claims — **but that the survival was worthless
because the candidate was defeated on obviousness.** Closest art: Bell. Objective
technical problem: implementing responder/public separation within a fixed-width
binary message-type field on a BLE mesh. The skilled person consults the
Bluetooth Mesh Profile — the spec of the radio they are implementing on — whose
§3.7.3.1 already solves that problem. Combination near-inevitable, no surprising
effect. Additionally exposed under Comvik and, in the UK, as a scheme for
presenting information.

**The optimist preserved exactly one residue:** that the partitioned classes are
human *audience* classes on a *BLE phone flooding mesh*, whereas the art offered
only definer classes (Bluetooth Mesh), device classes (Ericsson), or audience
classes on a *broadcast* (Bell).

### 5.5 Red-team attack — and it lands on all three axes

Three independent attacks were run (anticipation; obviousness; claim-form
viability). **All three returned "destroyed."**

**Attack 1 — anticipation.** The residue does not exist. Meshtastic is a
phone-to-phone flooding mesh with BLE-attached phones — architecturally the same
layer Loc8 describes — and on it runs a semantic dispatch-code space partitioned
into reserved disjoint bands carrying ordinary consumer text traffic in one band
and professional tactical-operative traffic in others. Every element of A is
present in one place, on the right medium, non-cryptographically, with no
priority field doing the work.

*Where the attack is honest about its own limit:* Meshtastic's bands are
**nominally** organised by registration authority (core / registered / private),
and the consumer-vs-tactical split falls across those bands as a consequence of
who registered which application, rather than being announced as an audience
partition. That is a difference in how the allocation is **described**, not in
what it **is** or what it **does**. And it is exactly the gap Bell fills verbatim.
So either an examiner takes Meshtastic alone under §102 (defensible), or
Meshtastic + Bell under §103 / EPO problem-solution (unanswerable). There is no
third outcome.

*A second point of fairness, recorded against the attack:* Meshtastic's Canned
Message module indexes preset messages **positionally by button press**, with no
partition of a semantic content-code space (verified at
meshtastic.org/docs/configuration/module/canned-message). So Meshtastic alone
does not anticipate the precise *semantic-layer* recitation. That gap is closed
by Bluetooth Mesh §2.3.4, where the partitioned space **is** the semantic
dispatch space.

**Attack 2 — obviousness.** The usual answer to an obviousness attack is that the
skilled person had no motivation to combine. Here the motivation is a published
IETF **Best Current Practice from 2017** affirmatively directing engineers to
partition namespaces into ranges with per-range policies (RFC 8126 §4). *When the
claimed contribution is the thing a BCP tells every practitioner to do, there is
no inventive step to argue about.*

**Attack 3 — claim-form viability, and this is the decisive one.** The claim's
exclusionary power is a monotonic function of exactly one variable: how specific
the recited code allocation is.

- **Broad** ("partition a message-type code space into disjoint subsets, each
  determining a class of participant, on a shared mesh, non-cryptographically")
  → reads on Bluetooth Mesh Table 3.43 and on Ericsson claim 1. **Invalid.**
- **Middle** (add "wherein the classes are a civilian-attendee class and a
  security-personnel class") → the only residue, and it is legally weightless in
  both jurisdictions (§5.7). **Buys nothing.**
- **Narrow** (recite codes 1–7 and 20–23) → grantable perhaps; worthless
  certainly. **Unenforceable.**

There is no intermediate position. **A claim whose validity and whose
enforceability are governed by the same single knob, in opposite directions, is
not an invention — it is a naming convention.**

**A correction to the optimist's own analysis, reported as a conflict.** The
optimist listed "a one-bit class flag in the type octet" as one design-around
among several. That is wrong, and it *understates* the severity. Loc8's codes are
separated by exactly `(type & 0x10)` — **Loc8's "disjoint numeric ranges" ARE a
one-bit class flag.** The alleged design-around *is* the invention. Any claim
drafted to exclude it would fail to read on Loc8's own product.

**Doctrine of equivalents will not rescue a narrow claim.** The same reasoning
that makes 8–15 equivalent to 20–23 makes the claim indistinguishable from the
Bluetooth Mesh partition, so the equivalent range is barred by the prior art.
Loc8 cannot have DOE reach without swallowing the art.

### 5.6 Reasoned inventive-step view

**Obviousness is not arguable on this record.** Two verified standards documents
and two granted claims disclose the mechanism; a third published standard
supplies the motivation to combine; and a fourth reference (Meshtastic)
assembles the whole thing on the correct medium with the correct audience pairing.

**Confidence: HIGH, and the residual risk points the wrong way.** The unrun
standards searches (§4.1) are the brief's own leads against A, and each is
capable of converting the obviousness finding into an **outright anticipation**
finding. This is the single largest open risk on A and it is adverse.

### 5.7 Jurisdictional view

**UK.** Passes the Stage 1 "any technical means" hurdle trivially (radios, phones)
— note this is a *gateway*, not a verdict, and under the post-[2026] UKSC 3
framework it moves all the risk onto s.3 obviousness. At the **intermediate
filtering step**, A splits: the *decoding property* (a receiver dispatches on
numeric range) is plausibly a contributing feature; the *meaning* attached to
code 20 vs code 3 is cognitive content aimed at a human reader and, `[INFERENCE]`,
does not contribute and touches s.1(2)(d). Once the semantics are filtered out,
the residue is "a message-type field whose value ranges are allocated to
different classes of recipient" — and that is routine.

**EPO — A is doubly exposed, and this is the weakest jurisdictional position of
any candidate.**

- *Ground 1 — cognitive content, not functional data.* **T 1194/97** draws the
  operative line: functional data means "coded picture line synchronisations,
  line numbers, and addresses" — data determining how the reading system
  physically operates. Loc8's code values, on the stated facts, determine nothing
  physical: same 25 bytes, same parser, same relay, same airtime, same power. What
  differs is which human-readable label is rendered. Under Comvik Headnote I such
  features "cannot support the presence of inventive step."
- *Ground 2 — Comvik is on all fours, factually.* This is the finding the client
  most needs to hear. **T 641/00 was a GSM SIM allocated two identities,
  selectively activatable, so that different users or service types could be
  distinguished on shared telecoms infrastructure. It was a radio/telecoms
  invention and it STILL LOST**, because the delta lay in allocating identities
  to different users or service types. Candidate A is a shared mesh with a code
  space partitioned so that different audience classes can be distinguished on
  shared radio infrastructure. **Allocation of a namespace to classes of user on
  shared telecoms infrastructure** — the structural identity is close to exact.
- *Ground 3, independent and arguably fatal alone — T 258/03 Headnote II:*
  "Method steps … aimed at **circumventing** a technical problem rather than
  solving it by technical means cannot contribute to the technical character of
  the subject-matter claimed." Element (iii) asserts that misinterpretation is
  "made structurally impossible by the partition itself." Nothing has been
  engineered — a convention has been declared and the problem stipulated out of
  existence. Element (iv) makes it worse by expressly **disclaiming every
  technical mechanism that would have carried the day**.

**US — A is the strongest of the three on §101 and still dies on §103.**
*ADASA* (55 F.4th 900) is structurally near-identical (allocating and encoding
blocks of a number space so a field's value identifies its block) and was held
eligible; *Uniloc v LG* (957 F.3d 1303) is the closest factual analogue (an added
data field in a Bluetooth-family inquiry message) and was held eligible because
it changed "the manner of transmitting data." The December 2025 *Desjardins*
amendments help: examiners may no longer dismiss the partition as a generic data
element without addressing technological improvement.

**But the §101 win is conditional and A is weak on the condition.** In ADASA the
improvement was *operational* (commissioning without a central-database
connection); in Uniloc it was *latency*. Loc8's asserted contribution is
*semantic*. Avery Dennison's **losing** argument in ADASA — that the claim was
directed to "mentally assigning meaning to a subsection of a data field" — is
precisely the attack against A, and it is **materially stronger** here than it
was there.

Independently, **MPEP 2111.05 printed matter** is fatal to the narrowing move. A
limitation "claims the content of information" and receives weight only where
"functionally or structurally related to the associated physical substrate"
(*In re DiStefano*, 808 F.3d 845, 848 and 850). The mesh transmits, relays,
TTL-decrements, dedupes and dispatches identically whether code 20 means "en
route" or "buy a beer." **The sole distinguishing limitation carries ZERO
patentable weight, and the claim collapses back onto the art with no delta.**
Note the trap: the natural response to the art is to narrow onto the labels — and
that narrowing is self-defeating in the US.

Under §103/KSR: classic combination of familiar elements yielding predictable
results, and "obvious to try" from a finite set. And *ADASA* itself, having upheld
eligibility, **VACATED** summary judgment of no anticipation/obviousness on the
strength of a general-audience trade book (*RFID for Dummies*) disclosing an
"intelligent hierarchy" allocating serial-number ranges. **The killer against a
number-space claim comes from ordinary technical literature, not a patent** — as
happened here with Meshtastic and RFC 8126.

### 5.8 The one surviving path, and it is a different invention

If — and only if — the code-range partition **changes device behaviour**, it
becomes functional data under T 1194/97 and communication coordination under
T 6/83, and technical character returns. Concretely: different relay/TTL policy
per range; per-range duplicate-suppression cache sizing or ageing; out-of-range
codes dropped without relaying so airtime and battery are conserved in dense
crowds; range determining transmit priority under congestion.

**Note precisely what this means: the asserted contribution as written — "safety-critical
semantic isolation as a property of code-space allocation" — is the part that
CANNOT be patented, and the part that could be is the part Loc8 has not claimed.**

---

## 6. Candidate B — priority-ordered load shedding with a protected audit write

**RESOLVED VERDICT: DESTROYED on inventive step.** Novelty survives — this is the
only candidate that does — but it is a novelty point where the failure is at
inventive step, which makes it near-worthless. The candidate additionally fails
claim-form viability on the design-around and detectability limbs.

**Two red-team passes independently downgraded this candidate from the
optimist's "obvious" to "destroyed", and one returned "severely weakened" while
declining to overstate its own lens. Both downgrades are recorded below.**

### 6.1 Closest art

| Reference | Why it matters |
|---|---|
| **US 11,233,672 B2** (Parallel Wireless) | Battery-backed emergency-responder field radio node; **ordered, expressly configurable** shedding sequence across heterogeneous radio functions with **essential/non-essential tagging** and a designated last-to-die function |
| **US 11,994,399 B2** (Bosch) | *"Last Gasp Mode"* — battery AND thermal duress, ordered shed sequence, evidentiary write **sequenced last**, dispute-resolution rationale. **One document, one device, one mechanism** |
| **NIST SP 800-53 Rev 5, AU-5(4) + AU-9(3)** | Federal control catalogue **directing** degradation of service to preserve the audit function, and cryptographic hash protection of it |
| **ISO/IEC 15408-2 CC:2022, FAU_STG.3 / FAU_STG.5** | Second standards body codifying the same invariant as a selectable requirement |
| **US 11,995,734 B2** (Axon) | Element (v)'s rationale **in granted claim language** |
| **US 10,839,411 B2** (Noodle) | Element (iii) claimed in a **device-to-device relay network** — Loc8's own field |
| **US 10,228,751 B2** (Apple), **US 7,493,441 B2** (Dot Hill), **US 9,503,975 B2** (Open Garden) | Elements (i) and the structure of (iv), three further independent ways |
| Haber-Stornetta 1991 / Schneier-Kelsey 1998 / RFC 6962 | Element (iii) as 25-year-old CGK `[UNVERIFIED citations]` |

### 6.2 Element-by-element comparison

| B element | Parallel Wireless US11233672B2 | Bosch US11994399B2 | Apple US10228751B2 | Axon US11995734B2 | Noodle US10839411B2 | Standards (NIST AU-5(4)/AU-9(3); CC FAU_STG; SQLite) | GAP |
|---|---|---|---|---|---|---|---|
| **(i)** battery/thermal duress detection | Battery voltage module + power-state determination, **in granted cl.1** | **Battery AND thermal**, both in one spec | Battery below first threshold, **in granted cl.1** | Not disclosed | Not disclosed | Routine CGK | **NONE.** Disclosed in claim language by four independent references; thermal by Bosch and Open Garden |
| **(ii)** ordered shedding over heterogeneous functions | **Verbatim in spec**: Wi-Fi access → mesh access → LTE access → LTE backhaul; sequence **configurable**; functions tagged essential/non-essential | **Verbatim**: finish current chunk → stop all sensors → notify cloud → notify provider → upload last three chunks → shut down | Binary only (full set → subset) | Not disclosed | Not disclosed | Prioritised load shedding is textbook (UFLS; `oom_score_adj`; Kubernetes PriorityClass/QoS eviction) | **NONE.** Parallel Wireless discloses it configurably; Bosch discloses it *together with* the evidentiary write |
| **(iii)** tamper-evident hash-chained log | Absent | **Absent** — AES + RSA/SHA PKI signing + secure boot + physical tamper detection, but **no chained digest** | Absent (confirmed negative) | Audit record, **no hash chain** (confirmed negative) | **Append-only record + hash of each activity summary, in a D2D relay network** | Canonical since 1991; **NIST AU-9(3) mandates it**; RFC 6962 standardises it | **NONE as an independent contribution.** 25+ years old and claimed by Noodle in Loc8's exact context |
| **(iv)** audit write survives ALL stages at max durability | Designated last-to-die function (LTE backhaul tagged essential) | **Record write sequenced last, expressly "to ensure that data is protected in the event of a power loss"** | Designated critical function pre-provisioned to survive degraded mode | Audit tag decoupled from and transmitted BEFORE the bulk payload | Absent | **NIST AU-5(4) directs exactly this**; CC FAU_STG.5.1 offers it as a menu option; **SQLite says FULL is NOT the maximum** | **THIN, and the durability limb COLLAPSES — see §6.5** |
| **(v)** evidentiary-record-outlives-the-service rationale | Absent | **Present** — records for "occasions when disputes arise between the rider and the driver" | Absent | **In granted cl.1 verbatim**: "to ensure the recorded data … is not lost, spoiled, or destroyed" | Implicit | NIST AU-5(4) is the *institutional* form of the same rationale | **NONE — and it is not a technical element.** See §6.6 |

### 6.3 The delta, stated precisely

The residue is **a single design SELECTION, not a mechanism**: that the function
occupying the last slot in a known ordered shedding schedule is a hash-chained
audit write, committed at a documented SQLite durability setting. That is the
substitution of one known essential-function designation for another, within a
known scheme, to meet a stated non-technical requirement.

### 6.4 Initial assessment — OBVIOUS (high confidence)

EPO problem-solution from Parallel Wireless as D1. Distinguishing features: the
preserved log is hash-chained; the audit write rather than the backhaul radio
occupies the last position; the write is at `synchronous=FULL`. Technical effect:
modest and entirely predictable from the properties of hash chaining and fsync.

**The optimist's genuine finding, and its only asset:** a full-text claim search
for the exact combination returned **ZERO results** (FreePatentsOnline expert
search, `ACLM/"hash chain" AND ACLM/"log" AND SPEC/"load shedding"`, run
2026-07-20). The precise combination is unclaimed. **The optimist correctly
labelled this a novelty point, not an inventive-step point.**

### 6.5 Red-team attack

**Attack 1 (anticipation lens) — verdict: SEVERELY WEAKENED. The attack on its
assigned lens FAILED and says so.** No single reference discloses all five
elements, because element (iii) does not co-occur with (i)/(ii)/(iv) in any
document surfaced across eleven independent full-text searches. **This
corroborates the optimist's zero-result rather than overturning it. Candidate B
is genuinely novel under §102 / Art 54.**

**But the attack landed hard on a different axis, and it makes the position
WORSE.** The "closest prior art" designation was wrong. Parallel Wireless
preserves a *radio service* under battery duress; it has no record, no log, no
evidentiary purpose. The optimist consequently needed a **three-reference
mosaic** — Parallel Wireless (shedding) + Axon (rationale) + Dot Hill (preserve
record under power loss) — and any mosaic invites the argument that the skilled
person had no reason to assemble it.

**Bosch removes that argument.** One document, one device, one mechanism: battery
*and* thermal duress, an ordered shed sequence across heterogeneous functions,
the evidentiary write deliberately last, and dispute-resolution as the stated
aim. Bosch is a closer starting point than a vehicle-mounted LTE base station,
and in a more analogous art — both Bosch's monitoring device and Loc8's Gateway
are **battery-backed edge recorders whose reason to exist is holding an
evidentiary record**. Reformulated problem from Bosch: *"how to make the
preserved record tamper-evident as well as confidential."* Answer: chain the
digests. Textbook CGK from 1991, and already claimed by Noodle in a D2D relay
network. **A one-step, two-reference case replaces a three-reference mosaic.**

*Caveat recorded at point of use `[INFERENCE]`:* Bosch's Last Gasp sequence is a
**fixed** ordered sequence — I did NOT find language calling it configurable or
priority-ranked. So Bosch supports the *ordering* limb but not a *"configurable
priority schedule"* limb. If a claim is drafted around **configurability**,
Parallel Wireless remains the better reference and the two should be cited
together.

**Attack 2 (obviousness lens) — verdict: DESTROYED. This is the decisive finding
on B.** The optimist stopped one step short: it treated the residual selection as
*unmotivated by the art*, and rested B's remaining value on the zero-result
search. **The motivation exists. It is not in the patent corpus — which is why
claim-text searching kept returning zero — it is in the published standards a
systems engineer building an evidential logging appliance is expected to read,
and it instructs the skilled person to make exactly the selection Loc8 calls its
invention.**

- **NIST SP 800-53 AU-5(4)** directs "partial system shutdown" or "**degraded
  operational mode with limited mission or business functionality available**" in
  order to preserve audit logging.
- **AU-9(3)** requires cryptographic mechanisms protecting audit integrity, the
  Discussion naming "signed hash functions."
- **CC:2022 FAU_STG.3/FAU_STG.5** say the same from a different standards body,
  including the option to "prevent audited events" rather than lose the record.

**Once those are on the table, Candidate B is Parallel Wireless's (or Bosch's)
machine configured as NIST tells you to configure it, using a hash chain
everyone has used since 1991. There is no step left to be inventive about.**

**Why this was missed, and why it matters procedurally.** Eleven further
patent-text searches reproduced the zero-result. *That consistency is not
reassurance — it is diagnostic.* The bridging teaching is not in the patent
corpus, so patent-text search of any phrasing was **structurally incapable** of
finding it. The optimist's query is also brittle: "load shedding" is
power-utility vocabulary (a `SPEC/"load shedding" AND SPEC/"audit log"` run
returned 21 hits, **all** power-grid and building-management), while the
embedded/mobile field says "power management", "low power mode", "degraded mode",
"thermal throttling"; and "hash chain" in claims is usually drafted as "hash of
the preceding record", "cryptographically linked", or "Merkle". **A defensible
search must be CPC-driven (G06F 21/64, G06F 1/3212, H04L 9/3236), not
phrase-driven.**

Standards and regulatory documents are prior art under EPC Art 54(2) and are the
CGK of this skilled person. **An attorney who files on the strength of the
zero-result search will be met with precisely this art.**

**Attack 3 (claim-form viability) — verdict: DESTROYED, on a limb distinct from
obviousness.** To clear the art the claim must retain all five limbs. Every one
is independently avoidable:

- **L4 (`synchronous=FULL`)** — escaped by changing one line to `EXTRA`, which on
  SQLite's own documentation makes the competitor's record **more durable than
  Loc8's**. *A claim limitation a rival escapes by improving his product is
  worthless.* Worse: FULL is the documented **default** for a rollback journal,
  so the limb recites doing nothing. And "maximum durability" has no fixed
  referent → §112(b)/Art 84 indefiniteness on top.
- **L3 (hash chain)** — escaped by per-record signature, Merkle tree, forward-secure
  evolving-key HMAC, monotonic TPM counter, or WORM media.
- **L2 (ordered schedule)** — escaped by independent per-function thresholds
  ("cloud sync off below 40%, console relay below 30%") or a recomputed utility
  score. Functionally identical; no "predetermined priority order" to infringe.
- **L5 (last)** — escaped by keeping two functions alive, or making the log write
  second-to-last.
- **THE ARCHITECTURAL KILL:** move the audit log off the Gateway. Stream the
  chain to an anchor, a companion MCU, a second card, or the cloud, then let the
  Gateway shed everything including logging. **The evidentiary record still
  outlives the service — rationale (v) is fully satisfied — and no limb is met.
  Loc8's own §1 architecture hands a competitor this design-around.**

**Detectability — the point that should end the commercial discussion.** The
claim reads on internal firmware behaviour manifesting only under an induced
fault. To plead infringement Loc8 must acquire the rival gateway, drive it into
battery/thermal duress, and observe both the shedding **order** and the
**durability setting** of a database write. The latter is not externally
observable at all without dumping flash or decompiling firmware. **Contrast
Candidate A, whose subject matter is sniffable from the car park.** A claim whose
infringement is invisible from outside the defendant's device cannot support the
good-faith pre-suit belief needed to plead, and cannot be policed.

### 6.6 The Comvik non-technical-aim analysis (brief §7.6, mandatory)

**This is where B fails at the EPO, and the analysis inverts what the client
expects.**

**Technical character is unproblematic.** Elements (i)–(iv) all survive the
filter independently. Battery/thermal duress detection and management of radio
subsystems concern the internal physical state of the Gateway — **T 115/85**:
"Giving visual indications automatically about conditions prevailing in an
apparatus or system is basically a technical problem"; *a fortiori*, detecting
and acting on such conditions is technical. **T 769/92 (Sohei)** is satisfied:
managing a thermal and battery budget on a PoE+/LFP-backed Raspberry Pi requires
genuine "technical considerations concerning particulars of the solution."
Element (iii), cryptographic integrity, is technical in itself. **No Art 52
problem anywhere in B.**

**Element (v) is the problem, and it is the element the client regards as the
soul of the invention.** "The legal record must outlive the service" originates
in law, compliance and contract. It is the paradigm *"aim to be achieved in a
non-technical field"* of **T 641/00 Headnote II**, verified verbatim:

> "where the claim refers to an aim to be achieved in a non-technical field, this
> aim **may legitimately appear in the formulation of the problem** as part of the
> framework of the technical problem that is to be solved, **in particular as a
> constraint that has to be met.**"

**So the examiner does not argue about element (v). The examiner ADOPTS it, and
hands it to the skilled person free of charge, inside the problem statement:**

> *"Given a resource-constrained gateway subject to battery and thermal duress,
> and given the [non-technical] requirement that the tamper-evident incident
> record must be preserved and durably committed in preference to all other
> functions, implement the device's degraded-mode behaviour."*

Once that reformulation is made, examine what is left:

- **Element (iv)** is now merely a **restatement of the constraint already
  given**, not a solution to it.
- **Element (ii)** is generic prioritised resource management, with dense art.
- **Element (iii)** is 1991-era CGK, and NIST AU-9(3) mandates it.
- **`synchronous=FULL`** is use of a known vendor feature for its known purpose —
  and is factually mis-described as "maximum".

**Comvik does not merely weaken B; it converts B's headline feature from an
inventive contribution into a given constraint, leaving a combination of
well-known techniques each used for its known purpose.** This is a **DOWNGRADE**
from any prior "plausibly novel" assessment, recorded as such per brief §6.3.

**Aggravating fact:** the spacecraft safe-mode and flight-recorder leads embody
the *same rationale* — preserve the record, shed everything else — meaning even
element (v) is not novel as a design philosophy. 14 CFR § 25.1457(d)(5) makes it
**binding airworthiness law**.

**A secondary EPO objection the attorney must solve regardless:** element (iv) as
drafted ("an invariant that the audit write survives all shedding stages") states
a **result to be achieved** rather than the technical means. `[INFERENCE]` — this
is standard Art 84 practice; I could not machine-verify the Guidelines passage.

### 6.7 Jurisdictional view (UK / US)

**UK.** Passes Stage 1 overwhelmingly. At the intermediate step, (i)–(iv) all
contribute; **(v) does not**, per Comvik principle (F) as adopted at UKSC para 66.
Note the practice notice confirms non-technical features "may even form a
dominating part of the claimed subject matter" without invalidating the claim —
so (v) may be **recited**; it simply earns nothing, and is handed over as a
constraint. The genuinely arguable inventive kernel — that the audit write is the
*last* to die at *maximum* durability in the *most* degraded regime, inverting
the normal instinct to reduce expensive fsyncs under duress — is `[INFERENCE]`
real, and not strong. A skilled engineer combining spacecraft safe-mode
philosophy with any tamper-evident logging reference reaches it without
difficulty. NIST removes even that.

**US — B is the weakest of the three on §101.** Three adverse lines converge:

- ***ChargePoint v. SemaConnect*** (920 F.3d 759) is close to on all fours, and it
  is the brief's own named adverse case. Claim 1 there recited a transceiver to
  communicate with a remote server, "wherein the received communications include
  communications as part of a demand response system", and a controller "to …
  modify the application of charge transfer based on the communications received".
  **Strip the EV context and that is B's (i)+(ii): receive a resource-duress
  signal, modify what the device does.** Held directed to an abstract idea because
  the specification "never suggests that the charging station itself is improved
  from a technical perspective, or that it would operate differently than it
  otherwise could. Nor does the specification suggest that the invention involved
  overcoming some sort of technical difficulty." **Loc8's Gateway spec has the
  same defect** — it describes *what* is shed and in *what order*, not any
  technical difficulty overcome. Note also: whether a device is "a tangible system
  (in §101 terms, a 'machine')" is **"not dispositive"**, and "any reliance on the
  specification in the §101 analysis must always yield to the claim language."
- ***Electric Power Group*** (830 F.3d 1350) — priority-tiered shedding under
  monitored duress is grid-monitoring's home ground, and that is where such claims
  lost: no "nonconventional computer, network, or display components."
- ***Two-Way Media*** (874 F.3d 1329) is the most pointed, because the patentee
  argued **the very benefit Loc8 asserts**. Per the Federal Circuit's own later
  description in *Uniloc*: Two-Way Media "argued that the claims solved data
  transmission problems, including **load management** and bottlenecking, but the
  claimed method was not directed to those improvements", failing as
  "**result-based functional language** … without the means for achieving any
  purported technological improvement." *"Shed functions in priority order under
  duress"* is result-based functional language in its purest form.

Best available defence, real but narrow: the **December 2025 Desjardins**
amendments bar an examiner from waving off the shedding schedule as "generic
computer components" without engaging with technological improvement, and the
**August 2025 close-call rule** (reject only if >50% likely ineligible) helps at
the margin. To exploit either, B must be claimed at *Uniloc*'s granularity —
named measured quantities and thresholds, a specific ordered sequence of state
transitions, and a recited machine-level consequence such as bounded worst-case
time-to-durable-write under a stated power envelope. **That is draftable. It is
also trivially designed around by reordering two shedding stages.**

Under **§103/KSR**: MPEP 2143 rationale (B), simple substitution of one known
essential-function designation for another, and rationale (D), applying a known
technique to a device ready for improvement. Unusually, there is a genuine
**teaching-suggestion-motivation in the art itself** — Parallel Wireless's
"configurable sequence" and "essential/non-essential" tagging is an express
suggestion to make exactly this selection.

### 6.8 The salvage path, and the source conflict the attorney must resolve first

**Comvik removes the LEGAL aim from the contribution. It does not remove a
genuinely TECHNICAL problem that happens to arise in the same place.** One is
available: **the atomicity of an append-only hash chain across an unplanned power
loss.** A hash-chained log is uniquely brittle under brown-out — a truncated or
half-written link does not merely lose one record, **it invalidates the
verifiability of the chain from that point forward, and a truncated chain is
indistinguishable from a tampered one.**

A claim to reserving and continuously recomputing an energy budget sufficient to
complete the outstanding chain-commit — derived from measured cell state,
temperature and pending-append cost — and sequencing shedding so that budget is
never encroached, is **solving a technical problem (data-structure integrity
under power failure) by technical means**. The aim served is
integrity-under-power-loss, **not** legal admissibility — which is exactly what
keeps it outside Comvik HN II.

Two warnings. First, it is **much narrower than what Loc8 believes it has**, and
the client should be told the difference in scope explicitly. Second, **cell-site
battery-backup shedding patents and the smart-meter "last gasp" literature**
(`SPEC/"last gasp"` returned 49 hits including US 11,456,944; US 11,125,792;
US 2013/0200815; US 11,460,902) are the most likely place a killer reference sits.
One targeted query, `SPEC/"last gasp" AND SPEC/"event log"`, **failed with
ECONNRESET and was never completed.** It should be re-run first.

**SOURCE CONFLICT, REPORTED NOT RESOLVED.** Loc8's specification asserts
`synchronous=FULL` is "maximum durability". SQLite's own documentation states
"FULL is not necessarily durable across a power loss in rollback mode, so if
durability is desired, it is best to set the synchronous mode to EXTRA" — while
*also* stating "EXTRA is no different from FULL in WAL mode" and "FULL is …
durable (ACID) in WAL mode." **The adverse reading is journal-mode-dependent, and
Candidate B as drafted does not specify journal mode.** On either branch the limb
recites nothing inventive. **Drafting an inventive-step argument on a limitation
that recites an off-the-shelf configuration flag which the vendor's own
documentation says is NOT the maximum would be actively damaging in prosecution,
and worse in litigation.** The attorney should be shown this directly and should
not let the limitation into a claim without resolving it.

### 6.9 An internal tension the attorney should be warned about

`[INFERENCE]` Candidate C asserts the terminal fallback is the phone-to-phone
mesh, yet Candidate B sheds the Gateway's **mesh participation** before the audit
write. The Gateway therefore stops relaying safety traffic in order to keep
writing records. Whatever its merits, **that is a policy ranking of legal
exposure above operational safety — which is the signature of an
administrative/legal requirement under Comvik, and strengthens rather than
weakens the exclusion attack.**

---

## 7. Candidate C — fail-safe degradation layering

**RESOLVED VERDICT: DESTROYED.** Anticipated by a single 1997 European standard
that discloses the entire four-tier architecture element-for-element, and
independently by a granted 1998 US claim. **The most technical of the three
candidates and the least novel.** On the brief's direct question — is C
expressible as a patent claim at all — the answer is developed in §7.7 and is
**"expressible, but every expressible form is either anticipated or worthless,"**
which is a *worse* outcome than unclaimability.

### 7.1 Closest art

| Reference | Why it matters |
|---|---|
| **ETSI ETS 300 396-1 (Dec 1997), TETRA DMO Part 1** | **THE ANTICIPATION.** The four-tier additive stack in one document: MS↔MS / DM-REP / DM-GATE / SwMI, with "DM is performed without intervention of any Base Station" and emergency calling out of coverage |
| **US 6,226,524 B1 claims 1 AND 8** (Motorola, 1998) | Automatic, timeout-triggered, **bearer-agnostic and infrastructure-agnostic** fallback to a working direct mode, in granted claim language |
| **US 11,509,521 B2** (Fenix Group) | Three-tier automatic modality cascade (LTE → MANET → satellite) including an infrastructure-free MANET tier — destroys the "four tiers not two" residue |
| **US 7,010,313** (Motorola) | Three-tier automatic descent on a measured RSSI window terminating in a mode "independent of the communication system" |
| **US 5,274,838 A** (Ericsson GE) | "operating said repeater architecture in a **failsoft mode** which trunks said plural RF channels **when said centralized site controller fails or is absent**" — granted 1993 |
| **US 12,004,037 B2 / US 12,445,929 B2** (Motorola Solutions) | Cloud-link failure → local operation, with pre-replicated local database. **Also the primary FTO item** |
| **US 8,255,469 B2** (Nokia) | Zero-infrastructure phone-to-phone flooding with a **festival** worked example, 2009 |
| ITU-R PPDR decks; ASTRO 25 brochure; PACE doctrine | The four-tier ladder as **published engineering doctrine** in Loc8's exact field |

### 7.2 Element-by-element comparison

| C element | **ETS 300 396-1 (1997) — VERIFIED** | US 6,226,524 B1 cl.1 & cl.8 — VERIFIED | US 11,509,521 B2 Fenix | US 12,004,037 B2 Motorola | GAP |
|---|---|---|---|---|---|
| **(i)** strict layering, each layer purely additive | **Disclosed as the structure of the standard.** Figures 1–5: DM-MS↔DM-MS; DM-MS↔**DM-REP**↔DM-MS ("provides a repeater function to enable two or more DM-MSs to **extend their coverage range**"); DM-MS↔**DM-GATE**↔SwMI; and Figure 5's combined **DM-REP/GATE** unit — Loc8's own Gateway-is-also-the-best-mesh-node design. Additivity stated: "**The same Ud air interface applies** … also … to links between DM-MSs and DM-REPs, or … DM-MSs and DM-GATEs." The published EN's part structure (Part 3 MS-MS AI, Part 4 repeater AI, Part 5 gateway AI) is itself the additive layering | Claims 4–7: the repeater monitors, retransmits, and on timeout "resum[es] the monitoring of step (e)" — a purely additive layer over an independently functional direct path. Claim 3 adds dwell/hysteresis | Discloses a 3-tier cascade LTE → MANET → satellite | Cloud tier additive over RF-site-local operation | **NONE.** Loc8 has four tiers rather than two or three; tier count is not a technical contribution and no reference teaches away |
| **(ii)** no layer is a dependency of the layer below | "**DM is performed without intervention of any Base Station (BS)**" — the limitation, affirmatively recited, at the base of the stack | **Claim 8 recites it AFFIRMATIVELY as a granted US limitation**: units "capable of communicating with each other **aided or unaided by the infrastructure equipment**" | Inherent in the MANET tier | Claimed affirmatively — the system **DROPS** the dead cloud link rather than blocking on it | **NONE.** And note Motorola solved in 1998 the very drafting problem C faces — by reciting independent operation **positively** rather than as a negative limitation |
| **(iii)** terminal fallback is a **functioning** zero-infrastructure D2D mode | **§8.4**: "The DM air interface supports emergency calling. A DM-MS initiating an emergency call **out of coverage of the system** may use a DM channel and, if necessary, pre-empt any lower priority communication using that channel." A fully specified mode with its own air interface, addressing, security and teleservices | **Claim 1(d) / claim 8(d)**: "upon receiving **no response** within the first time period, **establishing** communication with the second subscriber unit in talk-around mode." The call is **ESTABLISHED** and completes. Automatic; no user action; no infrastructure | Cascade **bottoms out at satellite** — infrastructure-dependent. Does NOT reach a true zero-infrastructure terminal state | Fallback is site-local RF — still infrastructure-borne | **NONE.** The only difference from Loc8 is the bearer — BLE advertising vs a licensed LMR channel — which is paradigm predictable substitution |
| *(implicit)* automatic unattended transition | Standard DMO behaviour | Timeout-triggered, "**automatically**" in the step preamble | Claimed generically as an "automatic failover detection system" | Link-failure-triggered | **NONE.** US 11,540,351 B2 goes further with hysteresis, which C does not contain |

### 7.3 The delta, stated precisely

**Precisely nothing patentable remains.** Element (iii) — the element Loc8 treats
as its distinguishing contribution — is disclosed in granted claim language by
Motorola from a 1998 filing, and as a numbered clause of a 1997 European
standard. Element (ii) is inherent in both and claimed affirmatively by two.
Element (i) is disclosed as the *organising structure of the standard*.

The residue is: **four tiers instead of two or three, and BLE instead of TETRA.**

### 7.4 Initial assessment — ANTICIPATED (high confidence)

The optimistic pass already reached "anticipated", relying on US 6,226,524 B1
claim 1. It conceded one residue — that four tiers is a quantitative extension of
a two-tier pattern with no teaching away — and defeated it by an *obviousness*
argument.

### 7.5 Red-team attack — three passes, all "destroyed", each strengthening the finding

**An honest red team could not improve this verdict by disagreeing with it. It
improved it by attacking the assessment's evidentiary weakness**, which was
self-declared: *"the direct-mode STANDARDS are the cheapest and probably most
decisive art against C and I could not fetch any of them."* **A finding resting
on a reference the researcher could not read is a finding an opponent can
reopen.** That gap is now closed.

**Attack 1 — the standards gap closed.** etsi.org blocks automated fetches (403),
so search-engine and register endpoints were driven through direct fetch and
every PDF extracted locally with `pdftotext` rather than relying on the fetch
tool's summariser. *(This mattered: the summariser failed on all five PDFs and
self-reported a **125-character quoting limit** — which independently explains
the earlier truncated claim text for US 12,004,037 B2. **Recommendation: treat
any claim text in this project that came from the fetch summariser as
provisional and re-extract it locally.**)*

**ETS 300 396-1 removes the concession entirely.** It discloses the four-tier
additive stack *itself*, in a single document, as the organising structure of the
standard. Loc8's Anchors are DM-REPs. Loc8's Gateway is a DM-GATE. Loc8's
combined Gateway-as-best-mesh-node is Figure 5's DM-REP/GATE. **The mapping is
1:1 and was not strained for.** That converts an arguable obviousness case
(which survives a first office action and costs money to fight) into a plain
anticipation case an attorney can act on in one reading.

**Attack 2 — the assessment had under-read its own best reference.**
US 6,226,524 B1 has an **independent claim 8** that nobody on the team reported.
Claim 1 is repeater-specific — which is what let the optimist concede that BLE vs
LMR was a "predictable substitution." **Claim 8 recites only "infrastructure
equipment" and "communication channel" — no repeater, no licensed spectrum, no
LMR** — and dependent claim 13 ("wherein the infrastructure equipment comprises a
repeater") confirms **by claim differentiation** that claim 8 is broader.
Read verbatim from the granted patent image:

> "8. In a radio communication system having infrastructure equipment and first
> and second subscriber units **capable of communicating with each other aided or
> unaided by the infrastructure equipment**, a method comprising the steps of: at
> the first subscriber unit, **automatically**: (a) transmitting a call setup
> request on a first communication channel; (b) monitoring the first
> communication channel, for a first time period, for a response from the
> infrastructure equipment …; (c) communicating with the second subscriber unit,
> aided by the infrastructure equipment … upon receiving a response …; and
> (d) communicating with the second subscriber unit **unaided by the
> infrastructure equipment**, by transmitting on the first communication channel,
> **upon receiving no response within the first time period**."

**There is no substitution question. Loc8's Gateway-dies-and-phones-keep-locating-each-other
behaviour reads on claim 8 substantially literally, with "infrastructure
equipment" = Gateway or Anchor.**

**Attack 3 — the four-tier residue dies three ways.** (a) US 7,010,313 already
claims three tiers ending infrastructure-free; (b) TETRA DMO defines a four-tier
topology structurally identical to Loc8's; (c) four-tier ordered fallback ending
in the most austere working mode is a **named, published doctrine** — the **PACE
plan** (Primary / Alternate / Contingency / Emergency), US Army, published by
CISA *for emergency communications specifically*, which "designates the order in
which an element will move through available communications systems until contact
can be established." `[UNVERIFIED — Wikipedia-sourced; cisa.gov and
globalsecurity.org both returned HTTP 403.]` If PACE holds at primary source, the
tier **count** is not a quantitative extension of a known pattern — **it is a
doctrine with its own name, taught in Loc8's exact field.**

**Reportable negative results, and why they cut against Loc8.** A FreePatentsOnline
expert search across US patents, US applications, DE, JP and PCT for
specifications containing `"site trunking" AND "failsoft" AND "talkaround"`
together returned **ZERO**. Two further searches for a granted claim reciting the
full ordered ladder returned nothing beyond an application (US 2015/0031405 A1).
A search for `ACLM/"hierarchical fallback" OR "tiered fallback" OR "fallback
hierarchy"` returned two unrelated hits. **So the four-tier ladder is documented
as engineering doctrine but is not claimed as such by anyone.**

**An optimist could read that as white space. It is not.** Unclaimed public
documentation is **the worst possible combination for Loc8**: it destroys novelty
without leaving any competitor patent to license around. It is prior art that
nobody owns.

**A finding recorded AGAINST the attack, for balance.** US 11,706,686 B2
(Peltbeam) was pulled expecting a cloud→mesh fallback anticipation. **It is not
one**, and is not cited as such: every path, primary and secondary, is
established and switched by "a central cloud server that comprises a processor",
with no un-anchored terminal state. This genuinely corroborates the single point
in Loc8's favour — the recent cellular/mesh art *is* network-anchored (Qualcomm
US 10,959,078 B2 requires a live PSAP call and PSAP-issued token first; Samsung
US 9,894,591 B2 reportedly requires the relaying UE to be in coverage). **It also
marks the exact limit of that point**, since ETS 300 396-1 and US 6,226,524 B1
claim 8 both supply the un-anchored case directly. Bare novelty over Qualcomm and
Samsung is real and worth nothing.

### 7.6 Two escape routes tested and closed

1. **"Loc8 crosses heterogeneous bearers (BLE / LoRa / IP / cloud); TETRA is one
   radio system."** Fails on the reference's own text: the **DM-GATE bridges Ud
   to Um — two different air interfaces** — with the direct-mode tier unaffected.
   Cross-bearer additive layering is disclosed. What remains is BLE-and-LoRa
   instead of TETRA.
2. **"TETRA DMO is itself *degraded*, so it is the 'degraded service' that
   element (iii) disclaims."** Fails symmetrically. DMO is a fully specified mode
   with its own addressing, security, teleservices and out-of-coverage emergency
   calling. Loc8's terminal BLE mesh loses the console, the cloud, LoRa spanning,
   and clamps TTL to 5. **There is no principled line that puts Loc8's terminal
   layer on the "functioning" side and TETRA DMO on the "degraded" side — and
   Loc8 would be on the wrong side of any line it drew.**

### 7.7 Is C expressible as a patent claim at all? (brief §7.7, mandatory)

**Three answers were developed. They differ, and the difference matters, so all
three are reported rather than smoothed over.**

**View 1 (initial assessment): NO — C is unexaminable.** Element (ii) is a
**negative limitation** (the absence of a dependency) inviting Art 84 clarity and
Art 83 sufficiency objections at the EPO and §112 written-description/definiteness
risk in the US; element (i) is a **property of an architecture, not a technical
step** — there is no operative verb to infringe.

**View 2 (red team, and it CORRECTS View 1): YES, C is expressible — View 1 is
overstated as a validity objection.** **MPEP 2173.05(i)** states there is
"nothing inherently ambiguous or uncertain about a negative limitation" provided
"the boundaries of the patent protection sought are set forth definitely, albeit
negatively" (*In re Johnson*; *Ex parte Grasselli*; *Novartis v Accord*).
**MPEP 2173.05(g)**: "Functional language does not, in and of itself, render a
claim improper." **And the point is answered empirically: Motorola already
claimed element (ii), affirmatively, in US 6,226,524 B1 claim 8.** Element (ii)
plainly *can* be claimed. It simply cannot be claimed **by Loc8**.

**This correction matters for the attorney**, who would otherwise be told a
drafting objection is fatal when it is not, and who does not need to litigate
Art 84 clarity on a claim that fails Art 54 novelty first.

**View 3 (the resolved position): C is expressible, and every expressible form
fails. That is WORSE than unclaimability.** The candidate is caught in a pincer
with no gap between the jaws:

- **Architectural form** (no operative step) → anticipated literally by
  ETS 300 396-1 Figures 1–5, and a **Morse** claim besides. *ChargePoint*,
  quoting *Interval Licensing*: in *Morse* and *Wyeth* each inventor "lost a claim
  that encompassed **all solutions for achieving a desired result**" because
  drafted "in such a result-oriented way that they amounted to encompassing the
  'principle in the abstract' no matter how implemented." *Electric Power Group*
  states the affirmative test: "there is a critical difference between patenting a
  particular concrete solution to a problem and attempting to patent the abstract
  idea of a solution to the problem in general."
- **Mechanism form** (recite trigger, timeout, transition, state) → **every road
  is occupied**: timeout trigger by US 6,226,524 B1 claim 8; RSSI-window
  three-tier descent by US 7,010,313; measured-degradation thresholds with
  automatic return by US 11,540,351 B2; deterministic zero-config fallback
  channel by US 10,764,894 B2; pre-replicated local state by US 12,445,929 B2
  (a **live** family prosecuting to 2041); geographic-proximity selection by
  US 5,423,055.

**And even a granted narrow claim fails brief §6.2(d) on two independent
grounds.** First, escape is free: change the trigger (timeout → heartbeat-miss
count → packet-loss ratio → user toggle), the tier count (3 or 5), or the bearer
(BLE → Wi-Fi Aware/NAN, UWB, LoRa direct). Second — and this is specific to
negative limitations — **a competitor escapes by doing the excluded thing
NOMINALLY**: have the phone mesh pull a key-rotation epoch or time-sync value
from the Gateway when one is present, falling back to a cached value when it is
not. That competitor delivers C's **entire user benefit** (works with the Gateway
dead) but literally has a dependency, so it does not infringe. **Negative
architectural limitations invite token compliance.**

**Worse, infringement would be undetectable.** Proving "layer N is not a
dependency of layer N+1" means proving a negative about a competitor's internal
software architecture — invisible from observable product behaviour and reachable
only through source-code discovery.

**Why this framing matters commercially:** unclaimable inventions get abandoned
cheaply. **Claimable-but-worthless ones get drafted, filed and prosecuted before
anyone notices.**

### 7.8 Jurisdictional view

**EPO — C is the MOST technical of the three and gets no shelter for it.**
Squarely within **T 6/83** (IBM, Data processor network), whose headnote is the
best available anchor for the brief's protocol-vs-application-logic question:

> "An invention relating to the co-ordination and control of the internal
> communication between programs and data files held at different processors …
> in a telecommunication network, **and the features of which are not concerned
> with the nature of the data and the way in which a particular application
> program operates on them**, is to be regarded as solving a problem which is
> essentially technical."

C attracts **no** Art 52(2)(c) exclusion argument — which is precisely why there
is nowhere to hide from the novelty analysis. **G 1/19** transfers two holdings:
that it is "not a sufficient condition that the simulation is based … on
technical principles underlying the simulated system" generalises to *operating
in a technical domain and invoking technical principles does not itself deliver a
technical effect* — and C's claim to inventiveness is largely a claim about
**principled architecture**, exactly what that answer forecloses. The whole-scope
requirement is severe for a claim as functionally broad as C `[INFERENCE — settled
practice, passage not machine-verified]`.

**UK.** Passes Stage 1 (phones, mesh, gateway); the new framework offers C no
help, because passing a low eligibility hurdle does nothing for a claim that
cannot be given definite scope. The problem surfaces as **s.14(5)(b) clarity and
s.14(5)(c) support**, not excluded matter. Anticipation is the decisive point.

**US.** With a concrete mechanism recited, C probably survives *Alice* step one;
without one it reads as the abstract idea of organising a fallback hierarchy and
is a **Morse** claim. Either way it is destroyed under §103/KSR: **"When a work is
available in one field of endeavor, design incentives and other market forces can
prompt variations of it, either in the same field or a different one"**, and
applying a technique known to improve one device to similar devices "is obvious."

### 7.9 Beyond Candidate C — a reference the attorney should look at hard

**US 7,245,216** (Tri-Sentinel, priority 2004-11-15, granted 2007-07-17), claim 1
verbatim: mobile devices with network and positioning subsystems "**automatically
assembling a wireless network among the mobile devices**", the network subsystem
"**automatically switches to use an alternative channel … in response to a failure
of the primary channel**", each device "**automatically generating position
information**", and "**at least one control system … tracking and mapping
individual positions of each mobile device.**"

**That is the shape of the entire Loc8 system from a 2004 priority — self-assembling
ad hoc device network, automatic failover, per-device positioning, and a control
console mapping everyone — not merely of Candidate C.** It warrants attention
wider than this brief's scope.

---

## 8. What would kill each candidate

Per brief §7.8: for each candidate, the specific reference, combination,
exclusion doctrine or disclosure event that most plausibly destroys it — plus the
further search an attorney should commission to confirm or clear the threat.

### 8.1 Candidate A

| Threat type | The killer |
|---|---|
| **Single-reference anticipation** | **Meshtastic `portnums.proto`** — all four elements on Loc8's exact architectural layer (phone-tethered BLE+LoRa managed flooding), with consumer and US-Government tactical classes in disjoint reserved bands, non-cryptographically, no priority field |
| **Best obviousness combination** | **Meshtastic `portnums.proto` + RFC 8126/BCP 26 §4 + Bluetooth Mesh Table 3.43.** Meshtastic supplies the machine; RFC 8126 supplies the published *instruction* to partition namespaces into ranges (killing "no motivation to combine"); Bluetooth Mesh supplies the partitioned space **as the semantic dispatch space** |
| **Alternative combination if an examiner declines §102** | **Meshtastic in view of US 8,841,990 B2** (Bell) — Bell supplies the express audience-class organising principle "by code selection and Program ID usage" |
| **Exclusion doctrine** | **EPO: T 641/00 Comvik** (allocation of a namespace to classes of user on shared telecoms infrastructure — the Comvik facts themselves) **+ T 1194/97** (cognitive content vs functional data) **+ T 258/03 HN II** (circumvention by definition, not solution). **US: MPEP 2111.05 printed matter** — the audience label carries zero patentable weight, so the narrowing amendment is self-defeating. **UK: the intermediate filtering step**, where the semantics are struck out |
| **Claim-form kill (independent)** | The scope vise of §5.5. Broad → reads on Bluetooth Mesh and Ericsson. Narrow → escaped by `1–7 / 8–15`, or a class flag bit, or odd/even interleaving, each delivering the identical safety property at zero cost |
| **Disclosure event** | **A festival field trial broadcasting unencrypted 25-byte frames.** A's subject matter *is* the wire format; it is capturable with a £20 BLE dongle from outside the fence. `[INFERENCE]` |

**Searches an attorney should commission for A** (each capable of converting
obviousness into outright anticipation): GMDSS/DSC message categories; **ITU-R
M.493**; **ITU-R M.1371 AIS** message types 1–27; aviation transponder codes
7500/7600/7700; Link 16 / MIL-STD-6016; **ETSI EN 300 392-2** TETRA status ranges
(0–32767 ETSI-defined vs 32768–65535 user-defined); P25/DMR message-category
separation; 802.11e EDCA; DiffServ. Plus: **re-read the Qualcomm LTE Direct
whitepaper (Aug 2014) as a priority** — on the team's description it may sit
closer to Loc8 than Bell does, because it is D2D rather than broadcast. Plus:
close out **SAE J2735 DSRCmsgID** (ten minutes, belt-and-braces). Plus: CPC-driven
searching, not phrase-driven.

### 8.2 Candidate B

| Threat type | The killer |
|---|---|
| **Single-reference anticipation** | **None found, and eleven independent searches confirm it.** B is genuinely novel. This is B's only strength and it is legally near-worthless standing alone |
| **Best obviousness combination — THE decisive threat** | **US 11,233,672 B2 (Parallel Wireless) + NIST SP 800-53 Rev 5 AU-5(4)/AU-9(3).** Parallel Wireless supplies the duress-detection machine, the ordered heterogeneous schedule, and an **express invitation** to configure which function is tagged essential; NIST **directs** the implementer to degrade the service to preserve the audit function and to protect it with signed hash functions. *Show the attorney these two texts side by side; that pairing is the whole case and takes ninety seconds to read* |
| **Shorter two-reference route** | **US 11,994,399 B2 (Bosch "Last Gasp Mode") + hash chaining as CGK** (Haber-Stornetta 1991 / Schneier-Kelsey 1998 / RFC 6962), or **+ Noodle US 10,839,411 B2** which claims it in a D2D relay network. Bosch supplies (i), (ii), (iv), (v) in one device; the only step left is swapping AES+PKI signing for a chained digest |
| **Corroborating standard** | **ISO/IEC 15408-2 CC:2022 FAU_STG.3 / FAU_STG.5** — a second standards body codifying the invariant. **14 CFR § 25.1457(d)(5)** — the same philosophy as binding airworthiness law |
| **Exclusion doctrine** | **EPO: Comvik T 641/00 HN II** — element (v) is adopted into the problem statement as a constraint, converting B's headline feature from a contribution into a given. **US: *ChargePoint* + *Electric Power Group* + *Two-Way Media***, the last of which rejected a claim whose patentee argued the identical **load-management** benefit as "result-based functional language." **UK: Comvik principle (F)** as adopted at UKSC para 66 |
| **Factual kill on the durability limb** | **SQLite's own documentation** — `FULL` is the rollback-journal **default** and is "not necessarily durable across a power loss in rollback mode." The limb recites neither an invention nor, on the vendor's account, the maximum |
| **Claim-form kill (independent)** | The five-limb conjunction of §6.5, every limb one-line-escapable, defeated outright by **relocating the audit log off the Gateway** — which still satisfies rationale (v). Plus **undetectability**: infringement requires inducing a fault inside a rival's device and reading a database durability setting out of firmware |

**Searches an attorney should commission for B:** (1) **Re-run the query that
failed** — `SPEC/"last gasp" AND SPEC/"event log"` died with ECONNRESET; the
smart-meter last-gasp domain (49 hits already surfaced: US 11,456,944;
US 11,125,792; US 2013/0200815; US 11,460,902) is the most likely source of an
outright anticipation — supercapacitor-backed tamper-evident event write on power
loss. (2) **CPC-class searching in G06F 21/64, G06F 1/3212, H04L 9/3236** — the
phrase-driven zero-result is a vocabulary artifact and must not be relied on.
(3) **Pull the unread claims of US 11,676,230 B2 (Sumo Logic, reported ~2006
priority) and US 11,139,954 B2 (Microsoft)** — a 2006 priority on hash-based
chain-of-custody would further erode element (iii). (4) **Cell-site battery-backup
shedding patents.** (5) **EP/WO family members** of the Parallel Wireless, Axon
and **Bosch** families — Loc8 is a UK company and a live EP Bosch member converts
that reference from invalidity art into an FTO item.

### 8.3 Candidate C

| Threat type | The killer |
|---|---|
| **Single-reference anticipation (architecture)** | **ETSI ETS 300 396-1 (Dec 1997), TETRA DMO Part 1**, §1 Scope, §3.1 Definitions, §4.1 Figures 1–5, §8.4 Emergency calls. All three elements, four-tier additive stack, one document, 28 years before the reference date |
| **Single-reference anticipation (mechanism)** | **US 6,226,524 B1, independent claim 8** — bearer-agnostic, infrastructure-agnostic, automatic. **The pincer: C's architectural form is anticipated by the standard; C's mechanism form is anticipated by claim 8. There is no breadth in between**|
| **Residue-killer** | **US 11,509,521 B2 (Fenix)** for the multi-tier cascade; **US 7,010,313** for three tiers ending infrastructure-free; **PACE doctrine** `[UNVERIFIED]` for four-tier ordered fallback as a *named* doctrine in emergency communications |
| **Exclusion doctrine** | **US: *O'Reilly v. Morse* / *Interval Licensing* / *Electric Power Group*** — a claim encompassing all solutions for achieving a desired result. **EPO: G 1/19** whole-scope, plus Art 84 result-to-be-achieved. **UK: s.14(5)(b)/(c)**, not s.1(2) |
| **Claim-form kill (independent)** | Negative-limitation token compliance (a nominal cached time-sync dependency defeats the claim while delivering the full benefit) **and** undetectability of infringement |

**Searches an attorney should commission for C:** (1) **Pull the certified
ETS/EN 300 396 family from the ETSI portal** — Parts 1, 3 (MS-MS AI), 4 (repeater
AI), 5 (gateway AI). This is the cheapest and most decisive art in the entire
report and my copy came from a mirror. (2) **3GPP TS 23.303 (ProSe) and TS 23.379
(MCPTT off-network)** — both returned HTTP 403. (3) **Confirm PACE at primary
source** via CISA/US Army doctrine (cisa.gov 403). (4) **GB 2260881 A**
(*Trunked system fallback operation*) — the one UK-register document in this
cluster, never resolved. (5) **P25 talkaround and DMR direct mode**
specifications.

### 8.4 The disclosure event that would kill all three simultaneously

`[INFERENCE — WS7's dedicated findings did not reach synthesis; see §13]`

**Any enabling public disclosure by Loc8 before a priority filing.** Under
absolute novelty in the UK (PA 1977 s.2(2)) and at the EPO (EPC Art 54), Loc8's
own prior disclosure is citable against Loc8's own application, and the US
§102(b)(1) grace period does not rescue the European position. The concrete
vectors, in descending order of risk for this specific system:

1. **A festival field trial broadcasting unencrypted 25-byte frames** — enabling
   as to the frame format *and* the code-space scheme (kills A directly).
2. **A public code repository or committed design document** containing the frame
   layout or the code table. *Note the precedent in the art itself:* Meshtastic's
   killer disclosure **is** a public `.proto` file in a git repository.
3. **Pitch decks, conference demos, crowdfunding pages, app-store listings.**
4. **Prior public use** at any venue.

**A self-disclosure check for already-public Loc8 material was NOT performed in
this run.** It is a named gap (§13) and should be commissioned, taking care to
distinguish this company from unrelated "Loc8"-named products.

---

## 9. Freedom-to-operate screen

> ### ⚠️ EXPLICIT NON-OPINION CAVEAT
>
> **This is a preliminary screen, NOT a freedom-to-operate opinion.** It does not
> and cannot support a reasoned belief of non-infringement, it is not a
> clearance, and it must not be relied on to defeat a claim of wilfulness. An FTO
> opinion requires a qualified attorney, a complete family search across all
> deployment jurisdictions, current INPADOC legal status, file-wrapper review,
> and claim construction. **None of those were done here.**
>
> ### ⚠️ THE GOVERNING LIMITATION ON THIS SECTION
>
> **INPADOC legal status was verified for ZERO references in this run.** Google
> Patents returned HTTP 503 on every attempt; Espacenet returned HTTP 403;
> PatentsView redirected via Cloudflare; the USPTO PED API and the USPTO
> assignment API were unreachable (`ped.uspto.gov` HTTP 000;
> `assignment-api.uspto.gov` DNS ENOTFOUND). **Every "status" cell below is
> either secondary-sourced or statutorily inferred, and is tagged.** For
> invalidity this does not matter — art is art whether in force or lapsed. **For
> FTO it matters completely, and this section cannot be relied on until an
> attorney closes it.**
>
> **Additionally: this screen was assembled from FTO-relevant material surfaced
> incidentally during the three novelty workstreams. A dedicated WS5 output did
> not reach synthesis (§13). Coverage is therefore uneven and Bridgefy — a
> mandatory assignee under the brief — was not run down at all.**

### 9.1 Risk register

| # | Patent | Assignee | Key independent-claim limitation | Maps to which Loc8 feature | Jurisdiction searched | Status | **Risk** | Avoidance notes |
|---|---|---|---|---|---|---|---|---|
| **1** | **US 12,445,929 B2** (+ parent **US 12,004,037 B2**) | Motorola Solutions | Parent cl.1 read verbatim: two RANs; determine a **second** link (third RF site ↔ fourth RF site) has failed; implement fallback allowing communication between RF sites at the first system only; **drop the first link**. Continuation adds: local site **pre-replicates the subset of the cloud database** needed to run locally | **Gateway holds the site SQLite DB locally and syncs to cloud opportunistically; site operates normally when the cloud link dies** | US | Granted 2024-06-04 / 2025-10-14. **Family LIVE, still prosecuting**, reported in force to 2041 `[UNVERIFIED]` | **AMBER — highest in the report** | Parent cl.1 as actually read is **materially narrower** than its earlier paraphrase: it requires a *multi-tenant two-RAN* context, a specific second-link failure and a first-link drop. Loc8 has one site and no RANs, so the **issued** parent likely does not read. **The exposure is the pending continuations**, which can be drafted to read on a shipped competitor product. Monitor the family; consider third-party observations |
| **2** | **US 9,992,806 B2** | Intel IP Corp. — **conflicting Apple assignment** | Cl.1 verbatim: determine a list of UEs reachable by D2D; "**generate an announcement message that indicates the apparatus can serve as a relay based at least in part on the list**"; transmit it. **Short, functional, no goods-or-services or MIC limitation** | **Any Loc8 behaviour in which a phone or Anchor advertises itself as a relay** | US | Granted 2018-06-05, reported active to 2036 `[UNVERIFIED]` | **AMBER** | The breadth is the problem — this is a three-step functional claim with no narrowing hardware limitation. Map Loc8's relay-advertisement behaviour against it element by element. **Ownership must be resolved**: Google Patents records both a 2020-06-25 assignment to Apple Inc. and a 2020-07-17 confirmatory assignment to Intel. **Reported as a conflict, not resolved** — the USPTO assignment API was unreachable |
| **3** | **US 10,839,411 B2** | Noodle Technology Inc. | Cl.1: "**appending the validated activity to an existing record of prior validated activities**" in a device-to-device relay network. Dependent cl.5 & 11 (verbatim): "creating a summary of each activity in the record; **generating a hash of the summary**; and storing the hash in a decentralized data storage system" | **Gateway's hash-chained audit log of relayed mesh activity** | US | Granted 2020-11-17, reported ACTIVE `[UNVERIFIED]` | **AMBER** | Cl.1 was returned **truncated** by the source and is only partially verified — pull the full text. The "decentralized data storage system" limitation in cl.5/11 is a likely avoidance route (Loc8's chain is local SQLite plus opportunistic cloud, not decentralised storage) but that depends on construction |
| **4** | **US 11,994,399 B2 / US 11,748,407 B2** (+ US 11,941,150 B2 and three published applications) | Robert Bosch GmbH | "Last Gasp Mode" — battery/thermal duress, ordered shed sequence, evidentiary write last | **Gateway load-shedding ladder with protected audit write** | US only | Granted 2024-05-28 / 2023-09-05. Status and family **`[UNVERIFIED]`** (Google Patents 503 ×3). `[INFERENCE]` presumptively in force in the US | **AMBER pending the EP check** | **Priority action: run the EP/DE/WO family.** A live EP member converts Bosch from invalidity art into a live FTO item in Loc8's home jurisdiction — a materially different exposure |
| **5** | **US 11,540,351 B2** | Motorola Solutions | Cl.1 verbatim: generate a fallback threshold **and per-site return thresholds** from measured radio characteristics; switch modality; scan while switched; return when RSSI exceeds the return threshold | Loc8 has **no** hysteresis or automatic-return mechanism today | US | Granted 2022-12-27 `[UNVERIFIED]` | **GREEN today / AMBER if Loc8 adds hysteresis** | Loc8 avoids by *not having* the return-threshold limitation. **This is a design constraint to record: if Loc8 later adds measured-degradation switching with automatic return, re-screen against this claim** |
| **6** | **US 10,764,894 B2** | Motorola Solutions | Deterministic derivation of a direct-mode fallback channel from network identifiers (TAC/IBN/PSID×TGID) | Loc8 does not derive channels arithmetically | US | `[UNVERIFIED]` | **GREEN** | Narrow arithmetic claim; negligible risk |
| **7** | **US 11,509,521 B2 / US 11,601,330 B2** | Fenix Group | Cl.1 requires **a cellular network core and a base station providing a private macro-cell**; continuation cl.1 additionally requires "at least one virtual machine (VM) implementing an **Evolved Packet Core (EPC)**" | Loc8 has neither a cellular core nor an EPC | US | Granted 2022-11-22 / 2023-03-07 `[UNVERIFIED]` | **GREEN** | Powerful obviousness art against C; low FTO risk. The EPC limitation is a clean avoidance |
| **8** | **US 11,995,734 B2** | Axon Enterprise | Audit tag with urgent categorization transmitted **prior to** the data upload, server generating a confirmation record | Loc8's audit write ordering — but Axon's trigger is **bandwidth/connectivity**, not battery/thermal | US | Granted 2024-05-28 `[UNVERIFIED]` | **GREEN-AMBER** | Loc8's duress trigger is a distinguishing feature. Worth an element map if Loc8 ever transmits an audit tag ahead of a payload upload |
| **9** | **US 11,233,672 B2** | Parallel Wireless | Cl.1 requires a **vehicle-mounted base station** with a **voltage measurement module coupled to a battery of the vehicle** | Loc8's Gateway is fixed-mount, PoE+/LFP, not vehicle-mounted | US | Granted 2022-01-25 `[UNVERIFIED]` | **GREEN** | The vehicle-battery limitation is a clean avoidance. Strong invalidity art against B regardless |
| **10** | **US 7,245,216** | Tri-Sentinel | Cl.1: self-assembling ad hoc device network + automatic channel failover + per-device positioning + **a control system tracking and mapping individual positions** | **The whole Loc8 system shape** | US | Priority 2004-11-15, granted 2007-07-17. Status `[UNVERIFIED]`; `[INFERENCE]` a 2004-priority US patent is very likely **expired** on a 20-year term | **GREEN if expired — VERIFY THIS FIRST** | If somehow maintained via PTA/PTE this would be the single broadest read on Loc8's architecture in the report. **Confirm expiry before anything else in this table** |
| **11** | **RE 47,894** | III Holdings 2, LLC | **Not resolved — partial claim 1 only** | Unknown | US | **Live reissue**, reissued 2020-03-03, priority 2006-07-27 `[UNVERIFIED]` | **UNSCREENED** | III Holdings 2 is an NPE-style holder. **This must be pulled and read** |
| **12** | **US 11,082,344 B2 / US 11,558,299 B2** | goTenna | Congestion-triggered uniform rate modulation; MAC-measures / Transport-decides | Loc8's TTL clamping under crowd density is **density**-triggered, not congestion-metric-triggered | US | `[UNVERIFIED]` | **GREEN-AMBER** | Closest commercial competitor. The two claims should be element-mapped against Loc8's TTL-clamping behaviour before deployment — the mechanisms differ but the effect is adjacent |
| **13** | goTenna portfolio (23 further records) | goTenna | Enumerated but **not individually claim-read**: US 9,756,549; 10,015,720; 10,602,424; 9,992,021; 10,164,776; 10,813,169; 11,297,688; 10,944,669; 11,750,505; 11,082,324; 11,811,642; 11,563,644 + applications | Loc8 mesh generally | US | `[UNVERIFIED]` | **UNSCREENED** | **The most important FTO gap that IS enumerated.** goTenna is the closest commercial player and 23 of its 25 records were never read |
| **14** | **Bridgefy** | Bridgefy | **NOT SEARCHED AT ALL** | Loc8 phone mesh | — | — | **UNSCREENED** | **Mandatory assignee under the brief; entirely absent from the delivered findings. Must be commissioned** |
| **15** | **US 8,255,469 B2** + continuations US 8,856,252 / US 9,277,477 / US 10,057,753; EP 2436198 A1; CN 102461218 B | Nokia | Connectionless address-less broadcast flooding over a zero-infrastructure phone mesh, community identifier in the flooded message, **festival worked example** | **Loc8's phone-mesh layer and group-finding, almost exactly** | US/EP/CN | Parent **EXPIRED (Fee Related)**. **Continuations NOT individually status-checked**; my fetch of US 10,057,753 returned ECONNRESET twice | **GREEN on the parent / UNSCREENED on the continuations** | **A live continuation would change the FTO picture materially** — the specification's worked example is Loc8's own use case. Check all four continuations and the EP member |
| **16** | **US 9,503,975 B2** (Open Garden); **WO 2015/183583 A1 / US 2017/0070841 A1** (Open Garden) | Open Garden / FireChat | Battery+thermal reporting driving peer-network reassignment; peer-vs-infrastructure path selection | B element (i); C | US/WO | **EXPIRED (Fee Related)** / **ABANDONED, never granted anywhere** | **GREEN — non-event** | Exactly the brief's predicted pattern: a lapsed FireChat-era patent is an FTO non-event **and** useful invalidity art at once |
| **17** | **US 6,226,524 B1** | Motorola | Automatic infrastructure-loss fallback to direct mode | Loc8's whole Candidate C behaviour, which reads on claim 8 **substantially literally** | US | **EXPIRED with certainty** — 35 USC 154(a)(2), 20 years from a verified 1998-12-28 filing → term ended by 2018-12-28; grant within ~2.3 years so no 3-year-pendency PTA arises | **GREEN — zero FTO cost** | Free invalidity art. Note the asymmetry: **had it been in force it would have been the most dangerous patent in this report** |
| **18** | **US 5,423,055; US 7,010,313; US 5,274,838 A** | Motorola / Ericsson GE | Talk-around, three-tier RSSI descent, failsoft trunking | C | US | Expired c. 2013 / c. 2021+PTA / long expired `[INFERENCE]` | **GREEN** | Pre-URAA transition rule and PTA not verified for the first two |

### 9.2 Litigation and opposition findings

**NEGATIVE — and this is a reportable gap, not a clean result.** No litigation
search, no EPO opposition-register search, no UK register search and no
CourtListener/PACER or Unified Patents/RPX search was performed in this run. The
WebSearch budget was exhausted before WS5 could execute, and CourtListener was
reached only for individual case *opinions* in the jurisdictional workstream
(*ChargePoint*, *ADASA*, *Uniloc*, *Electric Power Group*, *Recentive*), never as
a docket search.

**An attorney must treat the litigation landscape as entirely unexamined.**

### 9.3 The FTO actions, in priority order

1. **Verify INPADOC legal status for every row above.** Nothing in this section
   is reliable until this is done.
2. **Confirm US 7,245,216 (Tri-Sentinel) is expired** — it is the broadest read on
   Loc8's overall architecture found anywhere in this run.
3. **Run the Bosch EP/DE/WO family** — the difference between invalidity art and a
   live UK/EP FTO item.
4. **Read the 23 unread goTenna records** and **run Bridgefy from scratch.**
5. **Status-check the four Nokia continuations and EP 2436198 A1.**
6. **Pull RE 47,894** (III Holdings 2 — live reissue, unscreened).
7. **Resolve the Intel/Apple ownership conflict on US 9,992,806 B2** at the USPTO
   assignment register.
8. **Run the litigation/opposition search that was never run.**

---

## 10. Costs and timeline

**All figures verified against official fee schedules and primary legal texts on
2026-07-20.**

> ⚠️ **The UK IPO restructured its patent fees with effect from 1 April 2026.**
> Any figure carried from pre-2026 knowledge (application £60/£90, search
> £150/£180, examination £100/£130) is **now wrong**. Every UK number below was
> re-verified against the live gov.uk fee pages and the official April 2026
> revision of Patents Form 1/7/9A/10.

### 10.1 UK IPO official fees (effective 1 April 2026)

**The three ways to file:**

| Application type | Must contain | Online | By post |
|---|---|---|---|
| **Filing date only** | Description + any drawings. **No claims.** | **No fee** | £120 (pay now) / £150 (pay later) |
| Filing date + search | Description, drawings, **claims** | £275 + £27/claim over 25 | £360 + £27/claim over 25 |
| Filing date + search + examination | Description, drawings, **claims** | £405 + £27/claim over 25 + £13/page over 35 | £530 + same excess |

**Itemised components** (online figures independently confirmed by the UK
national-phase fee table, not merely inferred from the bundles):

| Component | Online | By post |
|---|---|---|
| Application fee, paid **at filing** | £75 | £120 |
| Application fee, paid **later** (Form AF1) | £95 | £150 |
| Search — national application (Form 9A) | £200 | £240 |
| Search — already searched in the international phase | £160 | £200 |
| Substantive examination (Form 10) | £130 | £170 |
| Excess claims (each over 25) | £27 | £27 |
| Excess description pages (each over 35) | £13 | £13 |
| Grant-stage excess claims / pages (Form 34) | £27 / £13 | £27 / £13 |
| National phase entry (Form NP1) | £40 | £40 |
| Publication of translation (s.89A(3)/(5)) | £16 | £16 |
| Renewal fees (per year) | £90 – £810 depending on year | same |

*Arithmetic checks, all consistent: 75+200+130 = £405 ✔; 120+240+170 = £530 ✔;
75+200 = £275 ✔; 120+240 = £360 ✔.*

**There is no flat UK grant fee.** Form 34 is an excess-claims/pages top-up at
grant only, payable when the IPO asks.

**Acceleration is free.** Green Channel, PCT (UK) Fast Track, and PPH/Global PPH
all carry no fee (gov.uk *Patents: accelerated processing*, updated 2025-01-23).
Given the backlog (§10.7), these matter more than their zero price suggests.

**SOURCE CONFLICT, reported rather than resolved.** gov.uk's overview page states
UK patenting *"costs at least £405 … This includes both an application fee and a
processing fee."* Two problems: (1) it describes **two** components where the
published schedule has **three** (application, search, examination), and
"processing fee" appears nowhere in the itemised tables or on the official form;
(2) **£405 is achievable only if the application fee is paid at the moment of
filing.** On the provisional-style route the application fee is £95, not £75, so
the **true floor is £425.** The overview and itemised pages are not reconciled.

`[INFERENCE]` The reconciliation of "Apply online — No fee" against the £75/£95
application fee is that nothing is payable *at the moment of online filing*; the
fee falls due later under PA 1977 s.15(10)(c). **gov.uk does not state this
explicitly and an attorney should confirm IPO operational practice.**

### 10.2 What a "provisional-style" UK filing actually is

**The UK has no provisional application.** What practitioners call one is an
ordinary **PA 1977 s.15** application filed without claims, deliberately left
incomplete, and usually abandoned at 12 months once priority has been used.

**Getting the date — s.15(1).** A filing date is the earliest date on which the
documents (a) indicate a patent is sought; (b) identify the applicant or enable
contact; (c) contain "**something which is or appears to be a description**" of
the invention, or a reference to an earlier relevant application. s.15(2)
confirms it is immaterial whether that "something" is in an accepted language or
otherwise complies with the Act. **No claims, no abstract, no fee, no formal
drafting standard is required to secure the date.**

**What must follow — s.15(10) + Patents Rules 2007 r.22.** The application is
**treated as withdrawn** unless, within the prescribed period, the applicant
(a) files claims and the abstract; (c) pays the application fee; and (d) requests
and pays for search under s.17. Rule 22(1)–(2), (7)(a): that period is **twelve
months beginning immediately after the date of filing** where there is no declared
priority date.

**The operationally important fact: the 12-month UK completion deadline and the
12-month Paris priority year run from the same date and expire together. There is
one decision point at month 12, not two.**

| Route | At filing | At month 12 if completed | If abandoned at month 12 |
|---|---|---|---|
| **Online, filing date only** | **£0** | £95 + £200 = £295 | **£0 ever paid** |
| By post, filing date only | £120 | £200 | £120 |

**Filing online and abandoning after using priority costs nothing in official
fees** — a materially better position than the US provisional ($70–$350).

**Caveats an attorney should test:**

- **The description must still be enabling.** s.15 gets a *date*; it does not get
  a *valid priority claim*. Priority under s.5(2)(a) attaches only to an invention
  "supported by matter disclosed in the earlier relevant application." **A thin
  provisional buys a date it cannot defend.** `[INFERENCE — follows from s.5(2)(a)
  read with s.15; settled law, but the adequacy of any Loc8 draft is for counsel]`
- **A 25-byte frame layout and a code-space allocation table are cheap to describe
  fully.** Candidates A and B are unusually well suited to a complete, enabling
  provisional-style filing, because the invention *is* the specification. A
  favourable fact for this route — **though it does not cure the art.**
- **Late priority declaration is discretionary.** PA 1977 s.5(2B)–(2C): the
  comptroller shall grant permission only if satisfied the failure was
  **unintentional**. Do not plan around it.

### 10.3 The 12-month Paris priority clock

| Provision | Effect |
|---|---|
| Art 4A(1) | Applicant filing in one Union country enjoys a right of priority elsewhere |
| **Art 4A(3)** | A "regular national filing" is any filing adequate to establish the filing date, "**whatever may be the subsequent fate of the application**" |
| Art 4B | Intervening acts — another filing, **publication or exploitation of the invention**, putting on sale — cannot invalidate the later filing |
| Art 4C(1) | **12 months** for patents and utility models |
| Art 4C(2) | Runs from the first filing; **the day of filing is not counted** |
| Art 4C(3) | If the last day is a holiday/closure, extended to the next working day |
| Art 4C(4) | A later application counts as "the first" only if the earlier was withdrawn/abandoned/refused without public inspection, leaving no rights outstanding and not having served as a priority basis |

**Art 4A(3) is the load-bearing provision for the abandon-at-12-months
strategy:** the UK filing founds priority even though later abandoned. UK
implementation: PA 1977 s.5(2A)(a).

**What the priority year does NOT do:** Art 4B protects against acts *in the
interval between the two filings*. **It does nothing about disclosures made
BEFORE the priority filing.** That is the boundary of what this clock buys — and
it is why §11 matters.

### 10.4 PCT route

**Fees at RO/GB (WIPO PCT Fee Tables, amounts on 1 June 2026):**

| Item | Amount |
|---|---|
| Transmittal fee | GBP 100 |
| International filing fee (first 30 sheets) | GBP 1,242 |
| Per sheet over 30 | GBP 14 |
| E-filing reduction, Item 4(b) — request in character-coded format | − GBP 187 |
| E-filing reduction, Item 4(c) — request + description + claims + abstract character-coded | − GBP 280 |
| **Competent ISA for RO/GB** | **EPO only — this is not a choice** |
| International search fee, EPO as ISA | EUR 1,885 / **GBP 1,632** |
| Chapter II: EPO as IPEA preliminary examination | EUR 2,010 |
| Chapter II: handling fee | EUR 215 |

| Filing format | Transmittal | Int'l filing (net) | ISA search | **Total** |
|---|---|---|---|---|
| PDF / character-coded request (4(b)) | £100 | £1,055 | £1,632 | **£2,787** |
| Full XML (4(c)) | £100 | £962 | £1,632 | **£2,694** |

The 90% filing-fee reduction applies only to applicants from specified developing
states — **a UK company does not qualify.** The 75% EPO search-fee reduction is
language-based — **a UK applicant filing in English does not qualify.**

**National / regional phase deadlines:**

| Office | Deadline | Authority |
|---|---|---|
| **US** | **30 months** from priority | PCT Art 22(1) via 35 USC 371(b) |
| **EPO** | **31 months** | Rule 159(1) EPC |
| **UK** | **31 months** | Patents Rules 2007 r.66(1) |

PCT Art 22(3) permits national law to fix later limits, which is how EP and UK
give 31 rather than 30. **The US 30-month date is the earliest hard deadline in
the whole programme and the one most often missed.**

**UK national phase (online):** Form NP1 £40 + search £160 (reduced rate, because
the EPO drew the ISR) + examination £130 = **£330**.

### 10.5 EP regional phase

**EPO Schedule of Fees applicable from 1 April 2026:**

| Item | EUR |
|---|---|
| Filing fee — EP phase entry | **135** online / 285 not online |
| European / supplementary European search | 1,595 |
| Designation fee, all contracting states | **720** |
| Examination fee — Euro-PCT **without** supplementary European search report | **2,240** |
| Examination fee — other applications | 2,010 |
| Claims fee, 16th–50th claim, each | 290 |
| Fee for grant and publishing (≤35 pages) | **1,135** |
| Renewal, 3rd / 4th / 5th year | 725 / 885 / 1,050 |
| Renewal, 10th year onward | 1,865 |

**Key structural saving:** Art 153(7) EPC, footnote 185, records AC decision
CA/D 11/09 (OJ EPO 2009, 594) **dispensing with the supplementary European search
report where the ISR was drawn by the EPO.** Since the EPO is the only ISA
available at RO/GB, **the €1,595 supplementary search fee is not payable.** The
trade-off is the higher examination fee (€2,240 vs €2,010): **net saving €1,365.**

**EPO micro-entity reduction — Rule 7a(3) EPC** (inserted by CA/D 16/23, in force
2024-04-01) reduces the **filing, search, examination (and in addition 30% of the
previously paid international search fee where the EPO acted as ISA), designation,
grant and renewal** fees:

| Condition | Detail |
|---|---|
| Eligible | Microenterprise, natural person, non-profit, university, public research organisation |
| Microenterprise | **< 10 full-time staff** AND turnover **or** balance sheet **≤ €2 million** |
| **Reduction** | **30%** of all main grant-procedure fees |
| Limit | Fewer than **five** EP/Euro-PCT applications in the preceding five years (R.7a(4)) |
| Co-applicants | **Every** co-applicant must qualify (R.7a(5)) |
| Assessment | **On the date of payment of each fee** (R.7a(6)) |

**Drafting asymmetry worth noting:** R.7a(2) lists SMEs as eligible for the
*language-based* reduction under 7a(1), but **R.7a(3) — the 30% scheme — omits
SMEs and covers microenterprises only.** A company that grows past 10 staff or
€2m before a payment date **loses the reduction for that payment.**

**`[UNVERIFIED]` whether Loc8 qualifies.** Two specific risks: (i) if VC-backed,
EU-style **linked and partner enterprise aggregation** may push it over the
thresholds — the EPO page states the criteria without addressing aggregation;
(ii) the mechanism by which the 30% reduction of the *already-paid* international
search fee is delivered at regional-phase entry (credit, refund, or reduced
payment) is **not stated** on any source retrieved.

**EP official fees to grant** (Euro-PCT, EPO was ISA, ≤15 claims, ≤35 pages):

| Item | Standard | With 30% R.7a(3) |
|---|---|---|
| Filing (entry, online) | €135 | €94.50 |
| Supplementary European search | €0 | €0 |
| Designation | €720 | €504 |
| Examination | €2,240 | €1,568 |
| Renewals, years 3–5 | €2,660 | €1,862 |
| Grant and publishing | €1,135 | €794.50 |
| Credit: 30% of int'l search fee | — | −€565.50 |
| **Total** | **€6,890** | **≈ €4,258** |

### 10.6 US national phase

**USPTO fee schedule effective 2025-01-19, last revised 2026-07-01:**

| Item | Undiscounted | Small (−60%) | Micro (−80%) |
|---|---|---|---|
| Basic national stage fee, 37 CFR 1.492(a) | $350 | $140 | $70 |
| **National stage search — ISR by a non-US ISA, provided to the Office**, 1.492(b)(3) | **$580** | $232 | $116 |
| National stage search — all other situations, 1.492(b)(4) | $770 | $308 | $154 |
| National stage examination, 1.492(c)(2) | $880 | $352 | $176 |
| Each independent claim over 3 | $600 | $240 | $120 |
| Each claim over 20 | $200 | $80 | $40 |
| Utility issue fee, 1.18(a) | $1,290 | $516 | $258 |

**Second structural saving from EPO-as-ISA:** 37 CFR 1.492(b)(3) reduces the
search fee to $580 from $770 where the ISR was prepared by a non-US ISA and
provided to the Office. **The EPO ISR qualifies.**

**Entity status — a UK company DOES qualify.** 37 CFR 1.27 requires a small
business concern to meet 13 CFR 121.802, quoted in full: "(a) Whose number of
employees, including affiliates, does not exceed 500 persons; and (b) Which has
not assigned … any rights in the invention to any person … who could not be
classified as an independent inventor, or to any concern which would not qualify
as a non-profit organization or a small business concern." **There is no US-residence
or US-nationality requirement.**

**Micro entity (80%)**: as of 2025-09-09 the maximum qualifying gross income is
**$251,190**. Also required: neither applicant nor any named inventor on **more
than four** previously filed applications. `[UNVERIFIED]` whether Loc8's
founder-inventors clear these — worth checking, as the step from small to micro
is a further 50% off already-discounted fees.

**US official fees to grant** (≤20 claims, ≤3 independent, EPO ISR provided):

| | Undiscounted | Small | Micro |
|---|---|---|---|
| Entry (basic + search + exam) | $1,810 | $724 | $362 |
| Issue fee | $1,290 | $516 | $258 |
| **Total** | **$3,100** | **$1,240** | **$620** |

### 10.7 Cumulative projection and the consolidated timeline

**Currency basis — `[INFERENCE]`.** Cross-rates derived from a single dated
official table: WIPO PCT Fee Tables state EUR 1,885 = GBP 1,632 = USD 2,237,
giving **EUR→GBP 0.866** and **USD→GBP 0.730**. These are derived from a *fee
table*, not an FX quote, and will drift.

| Stage | Timing | Standard | Small / micro |
|---|---|---|---|
| UK priority filing, online, filing date only | Month 0 | **£0** | **£0** |
| PCT at RO/GB, PDF e-filing, ≤30 sheets | Month 12 | £2,787 | £2,787 |
| UK national phase | Month 31 | £330 | £330 |
| EP regional phase to grant | Month 31–60 | €6,890 ≈ £5,966 | €4,258 ≈ £3,687 |
| US national phase to issue | Month 30–54 | $3,100 ≈ £2,262 | $1,240 ≈ £905 |
| **OFFICIAL FEES TOTAL** | | **≈ £11,345** | **≈ £7,709** |

The largest single official-fee line in the programme is the **EPO examination fee
(€2,240)**; second is the **PCT international search fee (£1,632)**. Both are
unavoidable on this route.

**Professional fees — A NAMED GAP, NOT A NUMBER.** **No published UK attorney
drafting cost range could be obtained.** Searches that failed, named per the
brief's rule: cipa.org.uk (HTTP 403 to every method); ipreg.org.uk (retrieved, no
cost figures published); albright-ip.co.uk costs page and European Patent Cost
Calculator (retrieved; **no patent prices published** — "fixed fee deal"
referenced, figures withheld); gje.com, murgitroyd.com (no pricing pages);
wilsongunn.com, scintilla-ip.com, franksco.com, wynne-jones.com (HTTP 404);
lawrieip.com, hindlesip.co.uk, patentcrunch.com, originip.co.uk, bawdenip.com
(connection failed / no GBP figures); gov.uk search API filtered to IPO, top 20 of
1,960 results reviewed (no publication giving attorney cost ranges).

**That is a finding in its own right: UK patent attorney firms overwhelmingly do
not publish fee schedules. Any cost range circulating in secondary sources is not
traceable to a primary source.**

Only two figures could be verified: gov.uk states attorney help "can cost
**several thousand pounds**"; Albright IP publishes patent specification
translation at **£1,000–£2,000 + VAT**.

**The placeholders below are UNSOURCED and must be replaced by an actual quote:**
drafting a software/protocol specification with claims £4,000–£9,000; UK filing
formalities £400–£900; PCT filing £1,500–£3,000; each response to a written
opinion or examination report £1,200–£3,000 (expect 2–4); EP regional entry
£1,200–£2,500; US national entry via US attorney $1,500–$3,000; each US office
action response $2,000–$4,500 (expect 2–3); EP grant formalities and validation
in 3–4 states £2,000–£5,000.

| Component | Low | High |
|---|---|---|
| Official fees, UK+EP+US | £7,709 (small/micro) | £11,345 (standard) |
| Professional fees — **`[UNVERIFIED]` placeholders** | ≈ £31,000 | ≈ £85,000 |
| **TOTAL TO GRANT, UK+EP+US — ESTIMATE** | **≈ £39,000** | **≈ £96,000** |

**Reading this honestly:** it covers **one** invention (three candidates
prosecuted separately roughly triples it); it runs to **grant**, not enforcement
(EPO renewals alone reach €1,865/year from year 10); and **the spread is
dominated by the unverified professional component, which is 80–89% of the
total.** The precision of the official-fee tables must not be mistaken for
precision in the total.

**Two structural cost points that are NOT placeholders:** (1) **excluded-matter
risk is a cost multiplier, not just a risk** — all three candidates sit in
software/protocol territory, prosecution against an eligibility objection means
more rounds, and the office-action lines should be read at the **upper end**;
(2) **US prosecution requires a US practitioner**, so US costs are additive to UK
attorney costs, not substitutable.

**Both clocks on one timeline:**

| Month | Event | Authority |
|---|---|---|
| **0** | UK application filed online, description only, no claims — **£0** | PA 1977 s.15(1) |
| 4 | Deadline to file description/copy where filing was by reference to an earlier application | Patents Rules r.22(3) |
| **12** | **⏰ PARIS PRIORITY EXPIRES** — *and simultaneously* the deadline for UK claims + abstract + application fee + search request | Paris Art 4C(1); PA 1977 s.15(10); r.22(7)(a) |
| **12** | PCT filed at RO/GB; **EPO is ISA (no choice)** | PCT Fee Tables Table I(a) row GB |
| ~16–21 | International search report and written opinion | — |
| 18 | UK application published (if maintained) | gov.uk |
| ~18 | International publication | — |
| 24 (or 6 months from publication) | UK substantive examination request deadline | r.28(2), r.28(7) |
| **30** | **⏰ US NATIONAL PHASE — the earliest hard deadline in the programme** | PCT Art 22(1); 35 USC 371(b) |
| **31** | **⏰ EP AND UK NATIONAL/REGIONAL PHASE** | Rule 159(1) EPC; Patents Rules r.66(1) |
| 54 | **UK compliance period** — 4y6m from filing/priority, or 12 months from the first examination report if later | Patents Rules r.30(2) |
| 48 from Form 10 | UK IPO target: 95% of substantive examinations completed | gov.uk timescales guidance |
| 48–72 | Realistic grant window, normal track, all three offices | — |

**The UK IPO states openly that it "currently has a backlog of unprocessed work"
and that "substantive examination reports are issuing later than we would like."**
Its published target is 95% of first substantive examinations within **48 months**
of the Form 10 request. **Against a compliance period of 4 years 6 months from
priority, the normal track is uncomfortably tight** — which is why the free
acceleration routes matter.

**And the decision gate: nothing is committed before month 12.** The online
filing-date-only route costs £0 in official fees; the first genuinely large
commitment is the PCT filing at £2,787.

---

## 11. Disclosure rules and practical guidance

> ### ⚠️ THE GOVERNING LIMITATION ON THIS SECTION — READ FIRST
>
> **Workstream 7's dedicated research output did not reach this synthesis step.**
> The delivered payload contained the candidate assessments, the three
> jurisdictional analyses and the WS6 cost/timeline workstream; the WS7 findings
> were absent or truncated.
>
> Consequently: **the statutory framework below is stated from primary texts I am
> confident of, but those texts were NOT re-fetched or re-verified in this run,
> and are tagged `[UNVERIFIED]` accordingly.** The two Loc8-specific scenario
> analyses are **`[INFERENCE]`** — reasoned from the system description and from
> the art actually found, not from researched disclosure-law authority. In
> particular **the enablement standard was NOT grounded in authority as the brief
> required** (*Synthon v SmithKline Beecham* was not verified), and **the
> self-disclosure check for already-public Loc8 material was NOT performed.**
>
> **This section must be treated as the weakest in the report and should be
> re-commissioned before reliance.** It is included because the underlying
> propositions are consequential enough that omitting them would be worse than
> flagging them.

### 11.1 The absolute-novelty / grace-period asymmetry

`[UNVERIFIED — statutes not re-fetched this run]`

| Jurisdiction | Rule | Practical effect for Loc8 |
|---|---|---|
| **UK** | **PA 1977 s.2(2)** — the state of the art comprises **all matter made available to the public** (by written or oral description, by use, or in any other way) before the priority date, **anywhere in the world**. Absolute novelty | **Loc8's own prior disclosure is citable against Loc8's own application.** There is no grace period |
| **EPO** | **EPC Art 54** — same absolute-novelty rule. **Art 55** provides only two narrow, six-month exceptions: **evident abuse** in relation to the applicant, and display at an **officially recognised international exhibition** | Art 55 is *not* a grace period and is not a plan. It is a remedy for specific misfortune |
| **US** | **35 USC 102(b)(1)** — a one-year grace period for disclosures made by the inventor or derived from the inventor | **A disclosure survivable in the US is fatal in Europe** |

**The headline practical point, and it is the one that matters for a UK company
wanting European protection: relying on the US grace period forfeits Europe.** By
the time the US grace period is being invoked, the UK and EP applications are
already dead on their own facts. `[UNVERIFIED as to the statutory citations;
the asymmetry itself is not in doubt]`

### 11.2 What constitutes an enabling public disclosure

`[UNVERIFIED — the enablement standard was NOT grounded in authority in this run;
the brief specifically directed grounding it in *Synthon v SmithKline Beecham*
and that was not done. Treat the following as the framework to test, not as
settled research output.]`

The general shape: a disclosure is novelty-destroying where it makes the
invention **available to the public** in a form that **enables** the skilled
person to perform it. Availability to a single member of the public without an
obligation of confidence can suffice; the question is enablement, not readership
numbers.

Vectors relevant to this system, in descending order of concrete risk:

1. **Radio transmissions in public.** See §11.4.
2. **Public code repositories and committed design documents.** Note the
   precedent *within the art found in this very report*: **Meshtastic's killer
   disclosure IS a public `.proto` file in a git repository.** A committed
   `frame_format.h` or a code-allocation table in a public repo is the same
   artifact. `[INFERENCE]`
3. **Pitch decks and conference demos.** See §11.3.
4. **Crowdfunding pages and app-store listings** — dated, archived, and routinely
   cited by examiners.
5. **Prior public use** — deployment at a venue.

### 11.3 Scenario (a): is pitching under NDA genuinely safe?

`[INFERENCE — obligation-of-confidence law was not researched in this run]`

**The framework as I understand it, offered for the attorney to correct:**

- Information disclosed under a genuine **obligation of confidence** is not
  "made available to the public", so a properly-conducted NDA pitch is **not**
  novelty-destroying. This is the general position and is why NDA pitching is
  standard practice.
- **The risk is not the NDA — it is the gap between the NDA and the room.** Three
  failure modes worth raising: (i) disclosure to attendees not covered by the
  agreement (a VC's unnamed analyst, a portfolio-company guest, a venue's
  contractor); (ii) material left behind, emailed onward, or uploaded to a data
  room with weaker terms; (iii) the pitch being recorded or streamed.
- **On breach: the disclosure is still a disclosure.** This is the point most
  often misunderstood. If a recipient breaches and publishes, the information
  **has** been made available to the public as a matter of fact. The NDA gives a
  **contractual remedy against the recipient**; it does not automatically restore
  novelty.
- **The evident-abuse exception (EPC Art 55(1)(a)) is the repair mechanism, and
  it is narrower than people assume:** it requires the disclosure to be *in
  consequence of an evident abuse in relation to the applicant*, and it is
  subject to a **six-month** window measured from the disclosure. A breach
  discovered in month seven is unrepairable. `[UNVERIFIED — Art 55 text not
  re-fetched]`

**Analytical view for the attorney to test:** NDA pitching is *comparatively*
safe but is not a substitute for a priority filing, because its safety depends on
counterparty behaviour Loc8 does not control, and its repair mechanism is time-
limited and evidentially demanding. **The cheap mitigation is already identified
in §10.2 — a £0 online UK filing-date-only application before pitching.**

### 11.4 Scenario (b): does a festival field trial disclose the frame format?

`[INFERENCE — this is my reasoned analysis from the system description; no
disclosure-law authority was verified in this run]`

**My analytical view: yes, probably, and this is the single most concrete
disclosure risk in the system.**

The reasoning:

1. **The transmission is unencrypted and public.** Loc8's layer 1 broadcasts
   25-byte frames over BLE advertising to anyone in range. There is no obligation
   of confidence attaching to a radio wave crossing a public field.
2. **It is trivially capturable.** A £20 BLE dongle in the car park captures the
   traffic. No skill barrier, no access barrier, no need to be a ticket-holder.
3. **The format is short and self-revealing.** A fixed 25-byte frame with an
   `int32 × 1e7` latitude and longitude, a monotonic timestamp and a battery byte
   is **reverse-engineerable from a modest capture** — a moving observer with a
   known position solves the coordinate fields almost immediately, and the
   timestamp and battery fields are self-evident from their behaviour over time.
4. **The code space is exposed by observation.** Watching guards send status
   messages while attendees send quick-replies reveals that codes 20–23 and codes
   1–7 exist and are disjoint. **That is Candidate A's entire asserted
   contribution, disclosed by operating the system in public.**

**The asymmetry the attorney should note:** the field trial is a *stronger*
disclosure of Candidate A than of B or C. A's subject matter **is** the wire
format, which is on the air. **B's** subject matter is internal Gateway firmware
behaviour under duress, which is **not** observable from outside the box (the
same undetectability that destroys B's enforcement value **protects** it from
disclosure). **C's** subject matter is architectural and is partly inferable from
observed behaviour (the system keeps working when the Gateway is unplugged) but
not enablingly so.

**Corollary the client must hear: Candidate A cannot be protected as a trade
secret either, for exactly the same reason.** It is visible on the air the first
time the system runs in public. Trade-secret treatment is inapposite; **defensive
publication** is the disposition worth raising with counsel, since it costs
little and forecloses a competitor patenting the same allocation against Loc8.

**A mitigation worth raising with the attorney `[INFERENCE]`:** if a field trial
must precede a filing, options include running it under a venue-wide
confidentiality arrangement (weak — it does not bind passers-by outside the
fence), encrypting the payload for the trial (changes the system under test), or
— far simpler — **filing the £0 filing-date-only UK application first.**

### 11.5 Self-disclosure check — NOT PERFORMED

**The brief (§WS7) required a search for already-public Loc8 material describing
this architecture — repositories, pitch pages, listings — and it was not done.**
No search was run, so **no finding of "nothing found" may be inferred**; the
question is simply open.

**This is a named gap and should be closed first**, because if such material
already exists, it is prior art against Loc8's own future filing and it changes
every calculation in §10. The brief's own caution applies: **take care to
distinguish this company from unrelated "Loc8"-named products.**

**Note the interaction with the reference date.** Per brief §3, nothing has been
filed, so *everything public today is citable*. For Candidates A, B and C this is
academic — the art in §12 predates any filing Loc8 could now make. But for the
two adjacent inventions flagged in §1 (hash-chain continuity across a power-loss
boundary; state handoff at tier transitions), **Loc8's own prior public material
could be the deciding factor**, and it is unexamined.

### 11.6 Practical do / don't, as positions to review with the attorney

| | Position | Basis |
|---|---|---|
| **DON'T** | Rely on the US §102(b)(1) grace period if European protection is wanted | Absolute novelty in UK/EPO `[UNVERIFIED statutes]` |
| **DON'T** | Treat an NDA as restoring novelty after a breach | The disclosure is still a disclosure; Art 55 is narrow and six-month-limited `[INFERENCE]` |
| **DON'T** | Run a public field trial of the unencrypted frame before filing, if any filing on frame-level or code-space subject matter is contemplated | §11.4 `[INFERENCE]` |
| **DON'T** | Commit the frame layout or code-allocation table to a public repository before filing | The Meshtastic precedent in this very report `[INFERENCE]` |
| **DO** | Recognise that a £0 online UK filing-date-only application removes almost all of this risk for the cost of drafting alone | §10.2, verified fees |
| **DO** | Ensure any such filing is genuinely **enabling** — s.15 buys a date, s.5(2)(a) requires support | §10.2 `[INFERENCE]` |
| **DO** | Raise **defensive publication** for candidates this thoroughly anticipated — near-zero cost, forecloses a competitor patenting the same allocation, secures freedom to practise | §1, §5.8, §7.7 |
| **DO** | Commission the self-disclosure search that was not run | §11.5 |

---

## 12. Master prior-art table

One row per reference cited anywhere in this report.
**Relevance:** A / B / C / FTO / LAW.
**Verification:** ✅ = read against a primary source in this run; ⚠️ = partial or
secondary; ❌ = `[UNVERIFIED]`, carried from a team record or a lead.

### 12.1 Patents and applications

| ID | Number | Title / substance | Date | Assignee | URL | Rel. | One-line disclosure | Ver. |
|---|---|---|---|---|---|---|---|---|
| P1 | US 6,226,524 B1 | Automatically selecting talk-around or repeater mode depending on repeater availability | filed 1998-12-28, granted 2001-05-01 | Motorola | https://patentimages.storage.googleapis.com/pdfs/US6226524.pdf | **C** | Claim 8: units "capable of communicating … **aided or unaided by the infrastructure equipment**"; on timeout, **establish** communication unaided | ✅ claims 1,3,4–8,13 read from the granted image |
| P2 | US 7,010,313 | Communication system with controlled talk around mode | filed 2001-07-16, granted 2006-03-07 | Motorola | https://www.freepatentsonline.com/7010313.html | **C** | Three-tier descent on an RSSI window ending in "a direct communication mode, which is independent of the communication system" | ✅ claim 1 |
| P3 | US 5,423,055 | Trunked communication system with automatic repeater talk-around | filed 1993-06-29, granted 1995-06-06 | Motorola | https://www.freepatentsonline.com/5423055.html | **C** | "automatically determining whether to implement a repeater talk-around communication", geographic gating | ✅ claim 1 |
| P4 | US 5,274,838 A | Fail-soft architecture for public trunking system | filed 1992-07-16, granted 1993-12-28 | **Ericsson GE Mobile Communications** (NOT Motorola) | https://www.freepatentsonline.com/5274838.html | **C** | "operating said repeater architecture in a **failsoft mode** … when said centralized site controller fails or is absent" | ✅ claim 1 + assignee |
| P5 | US 8,255,469 B2 | Connectionless community broadcast over ad-hoc phone mesh | priority 2009 | Nokia | https://www.freepatentsonline.com/8255469.html | **A, C, FTO** | Zero-infrastructure flooding, community identifier, **festival worked example**. **Does NOT disclose a partitioned code space** — corrects the team record | ✅ claim 1 |
| P6 | US 11,233,672 B2 | Dynamic power management | priority 2015-03-30, granted 2022-01-25 | Parallel Wireless | https://www.freepatentsonline.com/11233672.html | **B, FTO** | Spec: Wi-Fi → mesh → LTE access → LTE backhaul; "sequence … may be **configurable**"; "tagged … **essential** … or **non-essential**" | ✅ claim 1 + spec |
| P7 | US 10,093,251 B2 | Sibling of P6 | — | Parallel Wireless | https://patents.google.com/patent/US11233672B2/en | B | Family member | ❌ |
| P8 | US 10,228,751 B2 | Low-power boot preserving a designated critical function | filed 2015-07-14, granted 2019-03-12 | Apple | https://www.freepatentsonline.com/10228751.html | **B** | Battery below threshold → "only a second set of functions, a subset"; pre-authorised transaction survives. NEGATIVE on log/hash/durability | ✅ claim 1 |
| P9 | US 11,995,734 B2 | Audit tag transmitted prior to data upload | filed 2022-03-10, granted 2024-05-28 | Axon Enterprise | https://www.freepatentsonline.com/11995734.html | **B, FTO** | "to ensure the recorded data … is not lost, spoiled, or destroyed" — element (v) in granted claim language. NEGATIVE on hash chain and duress | ✅ claim 1 |
| P10 | US 10,839,411 B2 | Validated-activity record in a D2D relay network | filed 2019-09-26, granted 2020-11-17 | Noodle Technology | https://www.freepatentsonline.com/10839411.html | **B, FTO** | Cl.5/11: "generating a hash of the summary; and storing the hash in a decentralized data storage system" | ⚠️ cl.5,11 read; cl.1 truncated |
| P11 | US 7,493,441 B2 | Battery power to critical memory banks on main-power loss | filed 2005-03-15, granted 2009-02-17 | Dot Hill Systems | https://www.freepatentsonline.com/7493441.html | **B** | Power only the banks holding "critical data … which must be retained"; disable the rest | ✅ claim 1 |
| P12 | US 9,503,975 B2 | Peer-network reassignment from device telemetry | — | Open Garden | https://patents.google.com/patent/US9503975B2/en | **B** | Clients report "battery capacity … **battery temperature** …". **EXPIRED (Fee Related)** | ❌ |
| P13 | US 11,994,399 B2 | Ride monitoring data management — **"Last Gasp Mode"** | filed 2020-10-12, granted 2024-05-28 | Robert Bosch GmbH | https://www.freepatentsonline.com/11994399.html | **B, FTO** | Battery AND thermal duress; ordered shed sequence; **evidentiary write last**; dispute-resolution rationale. NEGATIVE on hash chain | ✅ claim 1 + spec passages |
| P14 | US 11,748,407 B2 | Activity-level-based sibling of P13 | filed 2020-10-12, granted 2023-09-05 | Robert Bosch GmbH | https://www.freepatentsonline.com/11748407.html | **B** | Same Last Gasp and thermal passages | ✅ claim 1 |
| P15 | US 11,941,150 B2; US 2022/0113148 A1; US 2022/0114212 A1; US 2022/0114280 A1 | Bosch family members | 2020–2022 | Robert Bosch GmbH | — | B, FTO | **Located but NOT read** | ❌ |
| P16 | US 11,139,954 B2 | Hash committed to a ledger, off-chain record, chain of custody | priority 2017 | Microsoft Technology Licensing | https://patents.google.com/patent/US11139954B2/en | **B** | **CLAIMS NOT READ — named gap** | ❌ |
| P17 | US 11,676,230 B2 | Hash-based tamper detection over an evidence chain of custody | reported priority ~2006 | Sumo Logic | https://patents.google.com/patent/US11676230B2/en | **B** | **CLAIMS NOT READ — named gap. If the ~2006 priority holds it predates all other element-(iii) art** | ❌ |
| P18 | US 11,082,344 B2; US 11,558,299 B2 | Congestion-triggered uniform rate modulation | — | goTenna | https://patents.google.com/patent/US11082344B2/en | **B, FTO** | Searched-and-cleared near miss: **zero** occurrences of "load shed", "audit log", "hash chain", "tamper-evident", "thermal" | ⚠️ full-text keyword search only |
| P19 | goTenna portfolio, 23 further records (US 9,756,549; 10,015,720; 10,602,424; 9,992,021; 10,164,776; 10,813,169; 11,297,688; 10,944,669; 11,750,505; 11,082,324; 11,811,642; 11,563,644 + applications) | — | — | goTenna | FPO `AN/"goTenna"` | **FTO** | **Enumerated, NOT claim-read.** Negative result: no audience-class code-space partition patent | ⚠️ enumeration only |
| P20 | US 8,841,990 B2 | Emergency broadcast with selectivity to specialized recipients | filed 2012-05-10, granted 2014-09-23 | Franklin W. Bell (individual) | https://www.freepatentsonline.com/8841990.html | **A** | "distinguishing specialized category recipients … from public transmission **by code selection** and Program ID usage"; public portion "free from instructions" | ✅ claim 1 + 3 spec passages |
| P21 | US 10,536,978 B2 | Classification of non-standard UE | filed 2016-04-29, granted 2020-01-14 | Ericsson | https://www.freepatentsonline.com/10536978.html | **A** | "reserving a **first subset** of available LCID values … and reserving a **second subset** … for … non-standard classes" | ✅ claim 1 + spec |
| P22 | US 9,763,311 B2 | Venue wearables storing hierarchical zone codes | granted 2017-09-12 | iPRO Technology | https://www.freepatentsonline.com/9763311.html | **A** | Reported: shared RF venue broadcast, devices act only on matching codes | ❌ claims not read |
| P23 | US 9,992,806 B2 | Public safety discovery using a UE-to-UE relay | filed 2015-07-29, granted 2018-06-05 | **Intel IP — conflicting Apple assignment** | https://www.freepatentsonline.com/9992806.html | **C, FTO** | "generate an announcement message that indicates the apparatus can serve as a relay" — short, functional | ✅ claim 1; ❌ ownership + status |
| P24 | US 11,540,351 B2 | Fallback + per-site return thresholds with hysteresis | filed 2020-02-20, granted 2022-12-27 | Motorola Solutions | https://www.freepatentsonline.com/11540351.html | **C, FTO** | Measured-degradation switching **with automatic return** — a refinement C does not contain | ✅ claim 1 |
| P25 | US 10,764,894 B2 | Deterministic direct-mode fallback channel derivation | — | Motorola Solutions | https://patents.google.com/patent/US10764894B2/en | **C** | TAC/IBN/PSID×TGID arithmetic; zero-config, zero-negotiation | ❌ |
| P26 | US 12,004,037 B2 | Fallback in a multi-tenant communication system | filed 2021-07-06, granted 2024-06-04 | Motorola Solutions | https://www.freepatentsonline.com/12004037.html | **C, FTO** | Two RANs; failed **second** link; **drop the first** link. **Materially narrower than its earlier paraphrase** | ✅ claim 1 read in full, correcting the record |
| P27 | US 12,445,929 B2 | Continuation of P26 | granted 2025-10-14 | Motorola Solutions | https://www.freepatentsonline.com/12445929.html | **C, FTO — highest** | Local site **pre-replicates the cloud-database subset** it needs. **Family LIVE, still prosecuting** | ⚠️ replication limitation quoted; cl.1 condensed only |
| P28 | US 11,765,778 B2; US 10,638,293 B2; US 10,728,937 B2 | "Off Grid Radio Service" (OGRS) | 2017 priority | Apple | https://patents.google.com/patent/US11765778B2/en | **C** | Bespoke infrastructure-free D2D stack for out-of-coverage operation | ❌ fetch returned HTTP 503 |
| P29 | WO 2015/183583 A1 / US 2017/0070841 A1 | Peer-vs-infrastructure path selection | — | Open Garden | https://patents.google.com/patent/WO2015183583A1/en | **C** | Cl.22: neighbour first, app store when no neighbour has it. **ABANDONED — never granted anywhere** | ❌ |
| P30 | US 10,959,078 B2 | D2D emergency assistance broadcast | — | Qualcomm | https://www.freepatentsonline.com/10959078.html | **C (favourable)** | **Requires a successful PSAP call and PSAP-issued token first** — the network must be alive | ⚠️ |
| P31 | US 9,894,591 B2 | Relaying UE must be within network coverage | — | Samsung | — | C (favourable) | Same balance point | ❌ |
| P32 | US 11,509,521 B2 | Multiple communication modes in a self-contained unit | priority 2020-02-03, granted 2022-11-22 | Fenix Group | https://www.freepatentsonline.com/11509521.html | **C, FTO** | "automatic failover detection system … automatically performs failover and communication modality switching"; LTE→MANET→satellite cascade. **Requires a cellular core** | ✅ claim 1 + spec |
| P33 | US 11,601,330 B2 | Continuation of P32 | granted 2023-03-07 | Fenix Group | https://www.freepatentsonline.com/11601330.html | **C, FTO** | Narrower — additionally requires "a virtual machine (VM) implementing an **Evolved Packet Core (EPC)**" | ✅ claim 1 |
| P34 | US 7,245,216 | First responder communications system | priority 2004-11-15, granted 2007-07-17 | Tri-Sentinel | https://www.freepatentsonline.com/7245216.html | **C, FTO, system-wide** | Self-assembling ad hoc network + automatic channel failover + per-device positioning + **a control system tracking and mapping individual positions**. **The shape of the whole Loc8 system from 2004** | ✅ claim 1 |
| P35 | US 11,706,686 B2 | 5G mesh for enhanced coverage | priority 2021-10-15, granted 2023-07-18 | Peltbeam | https://www.freepatentsonline.com/11706686.html | **C (reported against my own case)** | **NOT an anticipation** — every path is switched by "a central cloud server" | ✅ claim 1 |
| P36 | US 11,611,390 B2 | Enhanced LDACS with different user classes | filed 2021-07-03, granted 2023-03-21 | SkyStream LLC | https://www.freepatentsonline.com/11611390.html | **A — FALSE FRIEND, DISCARDED** | Title on point; claim 1 is **pure QoS** priority tiers, i.e. exactly what A element (iv) disclaims. **Do not cite against A** | ✅ claim 1 |
| P37 | US 8,130,704 | Multi-tier wireless home mesh | — | Sony | https://www.freepatentsonline.com/8130704.html | **C — FALSE FRIEND** | "Tiers" are node **roles**, not fallback layers | ✅ claim 1 |
| P38 | US 10,216,563 / US 2016/0196176 | Safety filter in a vehicle network | — | TRW Ltd | — | **A — DISCARDED** | Runtime fault-triggered message filter, not a code-space partition | ✅ claim 1 |
| P39 | US 11,962,697 | Blockchain chain-of-custody for body cameras | — | Johnson Controls Tyco | — | **B (adverse to Loc8's concept)** | Its only low-battery passage has the camera **WIPE** memory when battery is low | ✅ claim 1 |
| P40 | US 8,977,860 / US 8,447,989 | Tamper-proof camera logs | — | Ricoh | — | **B** | Hash-chained embedded log in a capture device, with **NO** battery/power/shutdown-ordering disclosure | ✅ cl.1 of '860 + spec negative |
| P41 | RE 47,894 | — | reissued 2020-03-03, priority 2006-07-27 | III Holdings 2, LLC | — | **FTO — UNSCREENED** | **Live reissue. Partial claim 1 only. Must be pulled** | ❌ |
| P42 | US 11,334,388 | Smart-outlet service offload | — | Amber Solutions | — | B — false positive, discarded | Not on point | ✅ |
| P43 | US 8,964,984 | Speed-violation evidence protection | — | — | — | B | Hash-chained evidentiary data, no ordered shedding, no duress detection | ⚠️ |
| P44 | US 11,456,944; US 11,125,792; US 2013/0200815; US 11,460,902 | Smart-meter "last gasp" outage reporting and energy recovery at shutdown | — | various | FPO `SPEC/"last gasp"` (49 hits) | **B — HIGH-PRIORITY UNREAD** | On power loss, shed all function and spend residual energy emitting the record. **The most likely source of an outright anticipation of B** | ❌ claims not read |
| P45 | US 2015/0031405 A1 | TMO/DMO switching | — | — | — | C | Application only; no granted claim reciting the full ordered ladder was found | ⚠️ |
| P46 | GB 2260881 A | Trunked system fallback operation | — | — | — | **C — UNRESOLVED** | The one UK-register document in the C cluster. Never pulled | ❌ |

### 12.2 Standards, specifications and technical literature

| ID | Identifier | Title / substance | Date | Author/body | URL | Rel. | One-line disclosure | Ver. |
|---|---|---|---|---|---|---|---|---|
| S1 | **ETS 300 396-1** (final draft prETS, ref DE/RES-06007-1) | TETRA DMO Part 1: General network design | **Dec 1997** | ETSI | https://www.qsl.net/kb9mwr/projects/dv/tetra/ets_30039601e01v.pdf | **C — THE KILLER** | Four-tier additive stack (MS↔MS / DM-REP / DM-GATE / SwMI); "DM is performed **without intervention of any Base Station**"; §8.4 emergency calling **out of coverage** | ✅ text (pdftotext); ❌ provenance — **mirror, not etsi.org (403)** |
| S2 | **EN 300 396-1 V1.2.1** | Published version of S1; Foreword lists Part 3 (MS-MS AI), Part 4 (repeater AI), Part 5 (gateway AI) | 2011-12 | ETSI | https://cdn.standards.iteh.ai/samples/etsi/etsi-en-300-396-1-v1-2-1-2011-12-/af40707432564d8f8983203917aebd4b/en-30039601v010201p.pdf | **C** | The part structure **is** the additive layering | ⚠️ cover + Foreword + TOC only |
| S3 | **Bluetooth Mesh Profile Specification v1.0** | §3.7.3.1 + Table 3.43 + §2.3.4 + §3.7.4.4 | **2017-07-13** | Bluetooth SIG | https://www.bluetooth.org/docman/handlers/downloaddoc.ashx?doc_id=429633 | **A** | Disjoint opcode ranges by leading bits; "Messages are **dispatched** within models **based on opcodes**"; unknown opcode → "**it shall ignore the message**", independent of NetMIC/TransMIC | ✅ 331-page PDF extracted locally |
| S4 | **Meshtastic `portnums.proto`** | PortNum semantic dispatch-code allocation | 2021 → (pre-2021 provenance `[UNVERIFIED]`) | Meshtastic project | https://raw.githubusercontent.com/meshtastic/protobufs/master/meshtastic/portnums.proto | **A — THE KILLER** | "0-63 Core Meshtastic use"; "64-127 Registered 3rd party apps"; "256-511 … private applications"; `TEXT_MESSAGE_APP=1` vs `ATAK_PLUGIN=72` / `ATAK_FORWARDER=257` | ✅ verbatim |
| S5 | Meshtastic ATAK-Plugin README | Tactical-team usage on the shared mesh | — | Meshtastic project | https://raw.githubusercontent.com/meshtastic/ATAK-Plugin/main/README.md | **A** | "Seamless integration between the Android Team Awareness Kit (ATAK) and Meshtastic"; users are "**tactical teams**" | ✅ verbatim |
| S6 | Meshtastic mesh-algo docs | Managed flooding transport | — | Meshtastic project | https://meshtastic.org/docs/overview/mesh-algo/ | **A** | "every node rebroadcasts a packet … up till a certain hop limit"; listen-before-rebroadcast; HopLimit; 32-bit packet-ID dedup; **phones over BLE** | ✅ |
| S7 | Meshtastic canned-message docs | Preset messages | — | Meshtastic project | https://meshtastic.org/docs/configuration/module/canned-message/ | **A — recorded AGAINST the attack** | Canned messages are indexed **positionally by button**, NOT by a partitioned code range | ✅ |
| S8 | `AndroidTacticalAssaultKit-CIV` | ATAK characterisation | — | US Dept of Defense | https://github.com/deptofdefense/AndroidTacticalAssaultKit-CIV | **A** | "the official geospatial-temporal and situational awareness tool used by the US Government", "designed for use by federal employees" | ✅ verbatim |
| S9 | **RFC 8126 / BCP 26** §4 | Guidelines for Writing an IANA Considerations Section | **2017-06** | Cotton, Leiba & Narten (IETF) | https://www.rfc-editor.org/rfc/rfc8126.html | **A — motivation to combine** | "it often makes sense to **partition a namespace into multiple categories** … **Dividing a namespace into ranges makes it possible to have different policies** …" | ✅ verbatim |
| S10 | **NIST SP 800-53 Rev. 5** | AU-5(4) SHUTDOWN ON FAILURE (p.69); AU-9, AU-9(3) (pp.73–74) | **2020-09** (updates 2020-12-10) | NIST | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf | **B — THE KILLER** | "Invoke a [… **partial system shutdown**; **degraded operational mode** …] in the event of [audit logging failures]"; AU-9(3) requires cryptographic integrity, naming "signed hash functions" | ✅ official PDF extracted locally |
| S11 | **ISO/IEC 15408-2 / CC:2022 Part 2 Rev 1** | FAU_STG.3, FAU_STG.5 (§8.7, p.46) | 2022-11 | Common Criteria | https://www.commoncriteriaportal.org/files/ccfiles/CC2022PART2R1.pdf | **B** | Stored audit data "maintained when … [exhaustion, failure, attack]"; option to "**prevent audited events**" rather than lose the record | ✅ verbatim |
| S12 | **14 CFR § 25.1457(d)(5)** | CVR independent power supply | current | FAA / eCFR | https://www.law.cornell.edu/cfr/text/14/25.1457 | **B** | 10 ±1 minutes of backup power, switched **automatically** on loss of all other power | ⚠️ Cornell LII mirror (eCFR redirected to bot-check); amendment date ❌ |
| S13 | **SQLite `PRAGMA synchronous`** | Durability semantics | current | SQLite | https://www.sqlite.org/pragma.html | **B — destroys the durability limb** | "FULL is the **default** … for a rollback journal"; "**FULL is not necessarily durable across a power loss in rollback mode** … best to set … **EXTRA**". Conflicting: "EXTRA is no different from FULL in WAL mode" | ✅ |
| S14 | ITU-R PPDR deck | "RESILIENCE TO FAILURE AT MULTIPLE LEVELS" | 2018-05-27 | Bhatia (Chair ITU-R WP5D SWG PPDR; Motorola Solutions) | https://www.itu.int/dms_pub/itu-r/oth/0a/0E/R0A0E0000CB0001PDFE.pdf | **C** | The ladder: … Fallback Local Control (Site Trunking) / Failsoft / **Talkaround (Direct-Mode)**, "CONTINUED OPERATION, EVEN IN A CATASTROPHE" | ✅ pdftotext |
| S15 | ITU-R RRS-21-Africa deck | Same ladder | 2021-07-14 | Hamadeh (Motorola Solutions) | itu.int RRS-21-Africa PPDR deck | C | Identical slide. **CAVEAT: carries a "Confidential and Proprietary" legend despite being published on itu.int — S14 is the cleaner citation** | ✅ pdftotext |
| S16 | ASTRO 25 Systems At A Glance (01-2017) | Product brochure | © 2017 | Motorola Solutions | https://www.aircomm.com/downloads/motorola/astro25_brochure.pdf | C | "**multiple levels of redundancy and fallback modes** … even in the event of multiple points of failure" | ⚠️ one passage; rest image-only |
| S17 | Qualcomm LTE Direct whitepaper | Always-on D2D proximal discovery | 2014-08 | Qualcomm | https://www.qualcomm.com/media/documents/files/lte-direct-always-on-device-to-device-proximal-discovery.pdf | **A — PRIORITY RE-READ** | Reported: one 128-bit expression code space split private/public on one D2D network. **Adverse on element (iv): enforcement is cryptographic** | ❌ not re-fetched |
| S18 | Schneier & Kelsey | Cryptographic Support for Secure Logs on Untrusted Machines, 7th USENIX Security | 1998 | Schneier, Kelsey | https://www.usenix.org/legacy/publications/library/proceedings/sec98/full_papers/schneier/schneier.pdf | **B** | Forward-secure tamper-evident audit logs | ❌ not re-fetched |
| S19 | Haber & Stornetta | How to Time-Stamp a Digital Document, J. Cryptology | 1991 | Haber, Stornetta | — | **B** | Hash chaining of records | ❌ |
| S20 | RFC 6962 | Certificate Transparency | 2013 | IETF | https://www.rfc-editor.org/rfc/rfc6962 | **B** | Merkle hash-chained append-only tamper-evident log | ❌ not re-fetched |
| S21 | RFC 4838 | Delay-Tolerant Networking Architecture | 2004 | IETF | — | **C** | Partition tolerance by design | ❌ lead only |
| S22 | Vahdat & Becker | Epidemic Routing for Partially-Connected Ad Hoc Networks, Duke TR | c. 2000 | Vahdat, Becker | — | layer 1 | Epidemic flooding | ❌ lead only |
| S23 | Ni et al. | The Broadcast Storm Problem in a MANET, MobiCom | 1999 | Ni et al. | — | layer 1 | Counter-based / probabilistic flood suppression | ❌ lead only |
| S24 | PACE plan | Primary / Alternate / Contingency / Emergency | — | US Army; published by CISA | https://www.cisa.gov/resources-tools/resources/leveraging-pace-plan-emergency-communications-ecosystem | **C** | Four-tier ordered fallback as a **named doctrine** for emergency communications | ❌ cisa.gov 403; Wikipedia-sourced |
| S25 | ETSI EN 300 396-3/-4/-5; 3GPP TS 23.303; TS 23.379; P25 talkaround; DMR direct mode | Direct-mode standards family | various | ETSI / 3GPP / TIA | etsi.org, 3gpp.org — **both HTTP 403** | **C** | **NOT OBTAINED — named gap, the cheapest decisive art against C** | ❌ |
| S26 | GMDSS/DSC categories; ITU-R M.493; ITU-R M.1371 AIS; transponder 7500/7600/7700; Link 16 / MIL-STD-6016; ETSI EN 300 392-2 TETRA status ranges; 802.11e EDCA; DiffServ | Partitioned code spaces per class | various | various | — | **A** | **NOT RUN — each capable of converting A's obviousness finding into anticipation** | ❌ |
| S27 | SAE J2735 DSRCmsgID | V2X message-ID allocation per actor class | — | SAE | usdot-jpo-ode/asn1_codec — 404 | **A** | Theory: basicSafetyMessage / emergencyVehicleAlert / personalSafetyMessage as consumer-vs-professional classes. **NOT verified, NOT relied on** | ❌ |

### 12.3 Case law, guidance and official schedules

| ID | Citation | Substance | Rel. | URL | Ver. |
|---|---|---|---|---|---|
| L1 | **[2026] UKSC 3** *Emotional Perception AI v Comptroller* (2026-02-11) | **Reversed the Court of Appeal and expressly DISAPPROVED Aerotel**: "the *Aerotel* approach should not be followed, in the light of *G1/19*" (para 20); steps 2–4 "cannot be maintained" (para 64). Adopted Comvik + Duns (F); Pozzoli survives | **LAW — UK** | https://caselaw.nationalarchives.gov.uk/uksc/2026/3 | ✅ |
| L2 | UKIPO practice notice, *Search and Examination of UK patent applications* (2026-07-14) | "Examiners should **not** apply the approach set out by the Court of Appeal in [Aerotel]" (para 47); disregard MoPP 1.07–1.51.7; "Any claim which involves technical means … avoids exclusion" (para 50); >feature-by-feature intermediate step (paras 30, 53–54) | **LAW — UK** | https://www.gov.uk/government/publications/search-and-examination-of-uk-patent-applications-under-the-patents-act-1977-as-amended | ✅ |
| L3 | Aerotel/Macrossan [2006] EWCA Civ 1371; AT&T/CVON [2009] EWHC 343; HTC v Apple [2013] EWCA Civ 451; Symbian [2008] EWCA Civ 1066; Lantana [2014] EWCA Civ 1463 | The displaced framework. **Lantana is the most destabilised** and was the leading authority that moving data between computers is not a technical contribution | LAW — UK | caselaw.nationalarchives.gov.uk | ⚠️ status per L1/L2 |
| L4 | **T 641/00 (Comvik)** | HN I: non-contributing features "cannot support the presence of inventive step". HN II: a non-technical aim "may legitimately appear in the formulation of the problem … **as a constraint that has to be met**". **Facts: a GSM SIM with two identities — a radio invention that still lost** | **LAW — EPO; A and B** | https://www.epo.org/en/boards-of-appeal/decisions/t000641ex1 | ✅ headnotes verbatim |
| L5 | **T 258/03 (Hitachi)** | HN I: "A method involving technical means is an invention". **HN II: steps "aimed at CIRCUMVENTING a technical problem rather than solving it by technical means cannot contribute to the technical character"** | **LAW — EPO; A** | https://www.epo.org/en/boards-of-appeal/decisions/t030258ex1 | ✅ |
| L6 | **T 1194/97 (Philips)** | Functional data (coded synchronisations, line numbers, addresses) vs data defined by cognitive content | **LAW — EPO; A** | https://www.epo.org/en/boards-of-appeal/decisions/t971194ex1 | ✅ |
| L7 | **T 6/83 (IBM)** | The protocol-vs-application-logic line: features "**not concerned with the nature of the data and the way in which a particular application program operates on them**" are essentially technical | **LAW — EPO; all** | https://www.epo.org/en/boards-of-appeal/decisions/t830006ex1 | ✅ |
| L8 | T 208/84 (Vicom); T 769/92 (Sohei); T 163/85 (BBC); T 115/85 (IBM); T 154/04 (Duns); G 1/19; G 3/08 | Supporting EPO doctrine | LAW — EPO | epo.org | ✅ |
| L9 | **KSR v Teleflex, 550 U.S. 398 (2007)** | "combination of familiar elements according to known methods … predictable results"; "finite number of identified, predictable solutions"; "a person of ordinary creativity, not an automaton" | **LAW — US; all** | https://www.law.cornell.edu/supct/html/04-1350.ZO.html | ✅ verbatim |
| L10 | **ChargePoint v SemaConnect, 920 F.3d 759 (Fed. Cir. 2019)** | Spec "never suggests that the charging station itself is improved from a technical perspective"; a tangible machine is "not dispositive"; reliance on the spec "must always yield to the claim language"; Morse/Wyeth result-oriented claims | **LAW — US; B** | https://storage.courtlistener.com/pdf/2019/03/28/chargepoint_inc._v._semaconnect_inc..pdf | ✅ |
| L11 | **Electric Power Group, 830 F.3d 1350 (Fed. Cir. 2016)** | "Information as such is an intangible"; "merely selecting information, by content or source"; "a critical difference between patenting a particular concrete solution … and … the abstract idea of a solution … in general" | **LAW — US; A, B, C** | https://storage.courtlistener.com/pdf/2016/08/01/electric_power_group_llc_v._alstom_s.a..pdf | ✅ |
| L12 | **Two-Way Media, 874 F.3d 1329 (Fed. Cir. 2017)** | Patentee argued the claims solved **load management**; ineligible as "result-based functional language … without the means" | **LAW — US; B** | https://www.courtlistener.com/opinion/4439569/two-way-media-ltd-v-comcast-cable-communications-llc/ | ⚠️ via the Fed. Cir.'s own description in *Uniloc* |
| L13 | **Uniloc v LG, 957 F.3d 1303 (Fed. Cir. 2020)** | Bluetooth piconet polling **ELIGIBLE**: "this change in the manner of transmitting data results in reduced response time"; "changes the normal operation of the communication system itself"; "Claims need not articulate the advantages" | **LAW — US; A (favourable)** | https://storage.courtlistener.com/pdf/2020/04/30/uniloc_usa_inc._v._lg_electronics_usa_inc..pdf | ✅ |
| L14 | **ADASA v Avery Dennison, 55 F.4th 900 (Fed. Cir. 2022)** | Number-space partitioning **ELIGIBLE** as "a hardware-based data structure focused on improvements to the technological process by which that data is encoded" — **but §102/§103 summary judgment VACATED over a trade book (*RFID for Dummies*)** | **LAW — US; A (both ways)** | https://storage.courtlistener.com/pdf/2022/12/16/adasa_inc._v._avery_dennison_corporation.pdf | ✅ |
| L15 | **MPEP 2111.05** / *In re DiStefano*, 808 F.3d 845 | Printed matter: "a limitation is printed matter only if it claims the content of information"; weight only where "functionally or structurally related to the associated physical substrate" | **LAW — US; A** | https://www.uspto.gov/web/offices/pac/mpep/s2111.html | ✅ |
| L16 | **MPEP 2173.05(i) and (g)** | Negative limitations are permissible — "nothing inherently ambiguous or uncertain about a negative limitation"; "Functional language does not, in and of itself, render a claim improper" | **LAW — US; C** | https://www.bitlaw.com/source/mpep/2173_05_i.html | ✅ (BitLaw mirror; uspto.gov truncated 2173.05(i)) |
| L17 | USPTO memo, *Reminders on evaluating subject matter eligibility* (2025-08-04) | Do not expand the mental-process grouping; distinguish "recite" from "involve"; **close calls → reject only if >50% likely ineligible** | LAW — US | https://www.uspto.gov/sites/default/files/documents/memo-101-20250804.pdf | ✅ |
| L18 | USPTO memo, *Advance notice … in light of Ex parte Desjardins* (2025-12-05); **Ex parte Desjardins**, Appeal 2024-000567 (PTAB, designated **precedential** 2025-11-04) | Amends MPEP 2106.04(d), (d)(1), 2106.05(a), (f), **superseding Rev. 01.2024**: improvement enquiry broadened to "**or an improvement to other technology or a technical field**"; do not evaluate "at such a high level of generality"; do not dismiss elements as "generic computer components" without considering technological improvement | **LAW — US; B (best available defence)** | https://www.uspto.gov/sites/default/files/documents/memo-desjardins.pdf | ✅ |
| L19 | *Recentive Analytics v Fox*, 134 F.4th 1205 (Fed. Cir. 2025-04-18) | "steps incidental to automating an abstract idea were not sufficient to confer eligibility" | LAW — US | https://www.courtlistener.com/opinion/10381132/recentive-analytics-inc-v-fox-corp/ | ⚠️ **USPTO's characterisation, not the court's own words — opinion text not retrieved** |
| L20 | PA 1977 ss.5, 15; Patents Rules 2007 rr.22, 27, 28, 30, 66 | UK filing-date, completion and compliance mechanics | LAW — WS6 | legislation.gov.uk | ✅ |
| L21 | Paris Convention Art 4 (esp. 4A(3), 4B, 4C) | Priority mechanics; "whatever may be the subsequent fate of the application" | LAW — WS6 | https://www.wipo.int/wipolex/en/text/288514 | ✅ |
| L22 | PCT Art 22; **WIPO PCT Fee Tables (amounts on 1 June 2026)** | 30-month rule; RO/GB fees; **EPO is the only competent ISA** | WS6 | https://www.wipo.int/documents/d/pct-system/docs-en-fees.pdf | ✅ |
| L23 | EPC Art 153(7); Rules 7a, 159; **Schedule of Fees from 1 April 2026** | Supplementary search dispensation (CA/D 11/09); 30% microenterprise reduction (CA/D 16/23); 31-month rule | WS6 | https://www.epo.org/en/legal/epc/2020/rfees.html | ✅ (live fee API) |
| L24 | **USPTO fee schedule (eff. 2025-01-19, rev. 2026-07-01)**; 37 CFR 1.27, 1.492; 13 CFR 121.802; micro-entity income limit $251,190 (2025-09-09) | US national-phase fees; **a UK company qualifies as a small entity — no residence requirement** | WS6 | https://www.uspto.gov/learning-and-resources/fees-and-payment/uspto-fee-schedule | ✅ |
| L25 | **gov.uk UK IPO fee pages + Patents Form 1/7/9A/10 (April 2026 revision)** | UK fees effective 2026-04-01 | WS6 | https://www.gov.uk/patent-your-invention/decide-which-type-of-application-to-file | ✅ |
| L26 | PA 1977 s.2(2); EPC Arts 54, 55; 35 USC 102(b)(1); *Synthon v SmithKline Beecham* | Absolute novelty; grace period; enablement | **WS7** | legislation.gov.uk / epo.org / law.cornell.edu | ❌ **NOT re-fetched — see §11** |

---

## 13. Verification appendix

### 13.1 Verified against a primary source in this run

**Claim text read verbatim from a register or full-text source:**
US 6,226,524 B1 (claims 1, 3, 4–8, 13 — **from the granted patent image PDF**,
9pp, the strongest source tier used anywhere in this run); US 7,010,313 cl.1;
US 5,423,055 cl.1; US 5,274,838 A cl.1 + assignee; US 8,255,469 B2 cl.1;
US 11,233,672 B2 cl.1 + the ordered-shedding spec passage; US 10,228,751 B2 cl.1;
US 11,995,734 B2 cl.1; US 7,493,441 B2 cl.1; US 11,994,399 B2 cl.1 + Last Gasp /
thermal / dispute-resolution spec passages; US 11,748,407 B2 cl.1;
US 8,841,990 B2 cl.1 + three spec passages; US 10,536,978 B2 cl.1 + the
reserved-subset spec passage; US 9,992,806 B2 cl.1; US 11,540,351 B2 cl.1;
**US 12,004,037 B2 cl.1 in full** (correcting an earlier truncated record);
US 11,509,521 B2 cl.1 + failover spec; US 11,601,330 B2 cl.1; US 7,245,216 cl.1;
US 11,706,686 B2 cl.1; US 11,611,390 B2 cl.1; US 8,130,704 cl.1;
US 10,839,411 B2 cl.5 and cl.11; US 8,977,860 cl.1; US 11,962,697 cl.1;
US 10,216,563 cl.1; US 2003/0142652 cl.1.

**Standards and technical documents extracted locally with `pdftotext` and read
in context:** Bluetooth Mesh Profile v1.0 (331pp — §2.3.4 p.21, §3.7.3.1 +
Table 3.43 p.93, §3.7.4.4); NIST SP 800-53 Rev 5 (AU-5, AU-5(1)–(5), AU-9,
AU-9(3), title-page date); CC:2022 Part 2 Rev 1 (§8.7, pp.44–46); ETS 300 396-1
Dec 1997 (§1, §3.1, §4.1.1–4.1.5 with Figures 1–5, §8.4); ITU-R Bhatia 2018 and
Hamadeh 2021 decks; ASTRO 25 brochure; Meshtastic `portnums.proto`, ATAK-Plugin
README, mesh-algo and canned-message docs; DoD ATAK repository README; RFC 8126
§4; SQLite `PRAGMA synchronous`.

**Law and official schedules:** [2026] UKSC 3; UKIPO practice notice 2026-07-14;
T 641/00, T 258/03, T 1194/97, T 6/83, T 208/84, T 769/92, T 163/85, T 115/85,
T 154/04, G 1/19, G 3/08, T 1194/97; KSR; ChargePoint; Electric Power Group;
Uniloc; ADASA; MPEP 2106, 2111.05, 2173.05(g), 2173.05(i); USPTO memos
2025-08-04 and 2025-12-05; 35 USC 101, 103, 154(a)(2), 371; 37 CFR 1.27, 1.492;
13 CFR 121.802; PA 1977 ss.5, 15; Patents Rules 2007 rr.22, 27, 28, 30, 66;
Paris Art 4; PCT Art 22 + WIPO Fee Tables; EPC Art 153(7), Rules 7a, 159 + the
live EPO fee API; USPTO, gov.uk and EPO fee schedules.

**Computed, not cited:** the bit arithmetic on Loc8's own code ranges — 1–7 =
`0x01–0x07`, 20–23 = `0x14–0x17`, discriminator `(type & 0x10)`.

### 13.2 Reasoned inference, tagged in place

- The deferred-fee reconciliation of gov.uk's "No fee" filing-date-only route
  against the £75/£95 application fee (§10.1).
- EUR→GBP 0.866 and USD→GBP 0.730, derived from the WIPO fee table rather than an
  FX quote (§10.7).
- **US 6,226,524 B1 is expired**, derived from 35 USC 154(a)(2) plus a verified
  1998-12-28 filing date — the conclusion is certain, the reported c.2005
  fee-lapse *route* is unverified.
- US 5,423,055 (c. 2013) and US 7,010,313 (c. 2021 + unchecked PTA) expiry.
- Bosch presumptively in force in the US, from 2024/2023 grant dates.
- Bosch's Last Gasp sequence is **fixed, not configurable** — no language calling
  it configurable was found, so it supports the ordering limb but **not** a
  "configurable priority schedule" limb.
- The enabling-disclosure caveat on thin provisionals (§10.2).
- The UK intermediate-step feature allocation (§5.7) — reasoned from G 1/19's
  four-class division and the practice notice, **not** from any decided UK case.
- The Comvik/Art 84 result-to-be-achieved objection to B element (iv).
- The whole §11 scenario analysis.
- The B-vs-C internal tension (§6.9).

### 13.3 Searches that found nothing — queries and databases named

Reportable negatives, per brief §7.13. **A negative is only reportable alongside
the search that produced it; the following are the searches, not conclusions.**

**Against A:**
- FPO `ACLM/"first range of message" OR ACLM/"second range of message" OR ACLM/"first subset of message types"` → **ZERO**
- FPO `ACLM/"message type" AND ACLM/"mesh network" AND ACLM/"reserved"` → **ZERO** *(caution: FPO's ACLM field behaviour is unreliable; treat these two nulls as weak evidence only)*
- FPO `ACLM/"range of message types" OR "first range of message identifiers" OR "reserved range of message types"` across US/DE/JP/PCT/EP → only TRW US 10,216,563, examined and discarded
- FPO `ACLM/("mesh network" AND "first set of message types") OR "first plurality of message types" OR SPEC/("non-overlapping" AND "message type" AND "mesh")` → noise only
- FPO `SPEC/"mesh network" AND SPEC/"security personnel" AND SPEC/"attendees" AND SPEC/"message type"` → 28 hits, all Google/Nest doorbell family
- FPO `SPEC/"mesh network" AND SPEC/"first responder" AND SPEC/"message type" AND SPEC/"reserved" AND SPEC/"civilian"` → 23 hits, LDACS family, no killer
- FPO `AN/"goTenna"` → 25 records; **no audience-class code-space partition patent at the most motivated commercial party**
- DuckDuckGo: `patent "mesh network" "first set of message types" "second set of message types"` → no results; `site:patents.google.com mesh network "message type" "security personnel" attendees venue range` → no results

**Against B:**
- FPO `ACLM/"hash chain" AND ACLM/"log" AND SPEC/"load shedding"` → **ZERO** *(the optimist's headline finding — and see the diagnosis below)*
- FPO `SPEC/"hash chain" AND SPEC/"low battery" AND SPEC/"audit log"` → 1 irrelevant hit (pest-control laser)
- FPO `ACLM/"low battery" AND ACLM/"continue recording"` → **ZERO**
- FPO `ACLM/"body-worn camera" AND ACLM/"battery" AND ACLM/"low power"` → **ZERO**
- FPO `ACLM/"load shedding" AND ACLM/battery AND ACLM/log` → 3 hits, one solar-power family
- FPO `ACLM/"battery" AND ACLM/"audit log" AND ACLM/"priority"` → 2 irrelevant
- FPO `SPEC/"graceful degradation" AND ACLM/"audit log" AND ACLM/"power"` → 2 irrelevant
- FPO `ACLM/"non-critical" AND ACLM/"log" AND ACLM/"battery"` → 4, none on point
- FPO `ACLM/"hash" AND ACLM/"log" AND ACLM/"power" AND ACLM/"priority"` → 8, none on point
- FPO `ACLM/"battery level" AND ACLM/"disabling" AND ACLM/"recording"` → 3, none on point
- FPO `SPEC/"load shedding" AND SPEC/"audit log"` → 21 hits, **all** power-grid/building-management
- FPO `SPEC/"load shedding" AND ACLM/"event log"` → 4, all smart-grid

**⚠️ THE DIAGNOSIS THAT MATTERS: the consistency of these nulls is not
reassurance — it is diagnostic.** The bridging teaching for B (NIST AU-5(4)) is
**not in the patent corpus**, so patent-text search of *any* phrasing was
structurally incapable of finding it. The queries are also brittle: "load
shedding" is power-utility vocabulary that drags the searcher into the wrong art
(21/21 hits), while embedded/mobile practice says "power management", "low power
mode", "degraded mode", "thermal throttling"; and "hash chain" is usually drafted
as "hash of the preceding record", "cryptographically linked", or "Merkle".
**A defensible search must be CPC-driven (G06F 21/64, G06F 1/3212,
H04L 9/3236), not phrase-driven.**

**Against C:**
- FPO `SPEC/"site trunking" AND SPEC/"failsoft" AND SPEC/"talkaround"` across US/DE/JP/PCT/EP → **ZERO** — no single specification uses all three ladder terms
- FPO `ACLM/("direct mode" AND "repeater" AND "gateway" AND "infrastructure")` → 1 hit, US 9,137,002, not on point
- FPO `ACLM/"hierarchical fallback" OR "tiered fallback" OR "fallback hierarchy" OR TTL/"fallback hierarchy"` → 2, both unrelated
- FPO `ACLM/"order of preference" AND ACLM/"ad hoc"` → **ZERO**
- FPO `ACLM/"second communication mode" AND ACLM/"third communication mode" AND ACLM/"unavailable"` → **ZERO**
- DuckDuckGo `patent claim 'plurality of fallback modes' OR 'hierarchy of operating modes' … automatic selection` → **ZERO**
- DuckDuckGo `patent "site trunking" "failsoft" "talkaround" automatic fallback levels` → **ZERO**

**⚠️ AND THE READING THAT MATTERS: the four-tier ladder is documented as
engineering doctrine (ITU-R decks, ASTRO 25, the standards architecture) but is
NOT claimed as such by anyone. An optimist would read that as white space. It is
the worst possible combination for Loc8 — it destroys novelty without leaving any
competitor patent to license around. It is prior art that nobody owns.**

### 13.4 Failed fetches — access barriers, NOT negative findings

| Source | Failure | Consequence |
|---|---|---|
| **patents.google.com** | HTTP 503 on **every** attempt across the whole run (US6226524B1 ×3, US10536978B2 ×2, US8841990B2 ×2, US11994399B2 ×2, US11509521B2, US11765778B2, and the `/xhr/query` endpoint ×3) | **No INPADOC legal status, expiry date or worldwide family for ANY reference** |
| **worldwide.espacenet.com** | HTTP 403 (bot interstitial) | Same |
| PatentsView API | Cloudflare 301 | Same |
| **ped.uspto.gov** | HTTP 000 (unreachable) | No maintenance-fee data |
| **assignment-api.uspto.gov** | DNS ENOTFOUND | **Intel/Apple ownership conflict on US 9,992,806 B2 UNRESOLVED** |
| fees.uspto.gov maintenance details | HTTP 403 | Same |
| patents.justia.com | HTTP 403 | — |
| patentguru.com | HTTP 403 | — |
| portal.unifiedpatents.com | Page served, no patent data (JS-rendered) | — |
| **etsi.org `/deliver/`** | HTTP 403 on EN 300 396-1, -3, -4, and on TS 123 303 / TS 123 379 | **S1 obtained only from a mirror; S25 not obtained at all** |
| 3gpp.org | HTTP 403 | ProSe/MCPTT not obtained |
| **cisa.gov**, globalsecurity.org | HTTP 403 | **PACE doctrine unverified** |
| web.archive.org | Unreachable | Meshtastic pre-2021 dating unresolved |
| epo.org Guidelines G-II 3.6, G-VII 5.4, F-IV 4.10 | JavaScript-only shell / HTTP 404 | EPO Guidelines passages unverified — analysis anchored on **decisions** instead, which is a stronger source tier |
| EPC Art 52 text page | JS-only | Provision content not machine-read (not in dispute) |
| eCFR | 302 to a bot-check host | 14 CFR 25.1457 taken from Cornell LII |
| supremecourt.gov slip opinions | HTTP 403 | KSR taken from Cornell LII |
| **cipa.org.uk** | HTTP 403 to curl and fetch | **No CIPA cost source** |
| Multiple UK firm sites | 404 / no pricing published | **No published attorney fee range obtainable** |
| FPO `SPEC/"last gasp" AND SPEC/"event log"` | **ECONNRESET — query never completed** | **The most likely remaining anticipation of B was never run** |
| freepatentsonline.com/10057753.html | ECONNRESET ×2 | Nokia continuation status **OPEN** |
| FPO `SPEC/"festival" AND ACLM/"mesh network" AND ACLM/"gateway"` | Connection reset | Open |
| dhs.gov/science-and-technology/tak | HTTP 403 | ATAK characterisation fell back to the DoD repo |

**A tooling finding worth carrying forward:** the fetch tool's summariser failed
on all five large PDFs needed for the C workstream and **self-reported a
125-character quoting limit** — which independently explains the earlier
truncated claim text for US 12,004,037 B2. Local `pdftotext` extraction produced
clean verbatim text every time. **Recommendation: treat any claim text in this
project sourced from the fetch summariser as provisional and re-extract it
locally.**

### 13.5 Known gaps and low-confidence areas — ranked by consequence

1. **INPADOC legal status: verified for ZERO references.** §9 cannot be relied on
   until closed. **Highest-consequence gap in the report.**
2. **Workstream 7 (disclosure) did not reach synthesis.** §11 is the weakest
   section; the enablement standard was not grounded in authority as the brief
   required; **the self-disclosure check for already-public Loc8 material was not
   performed at all.**
3. **Workstream 5 (FTO) had no dedicated output.** §9 was assembled from material
   surfaced incidentally by the novelty workstreams. **Bridgefy — a mandatory
   assignee — was not searched at all.** 23 of goTenna's 25 records were never
   claim-read. **No litigation, opposition or docket search of any kind was run.**
4. **WebSearch was unavailable for essentially the entire run** (budget exhausted
   at 200/200 before the candidate workstreams began). All discovery ran through
   direct fetch plus FreePatentsOnline expert-search — **a narrower net than a
   proper multi-register search. Non-US-origin art is correspondingly
   under-sampled**, and a Bosch-class reference sitting in an EP or JP family
   that FPO indexes poorly would not have surfaced. This is a real limitation on
   how much comfort the negative anticipation finding for B should be given.
5. **Espacenet, WIPO Patentscope, USPTO Patent Public Search and Lens.org were
   never successfully searched.** The brief named all four as primary registers.
   Every register search in this report ran through FreePatentsOnline.
6. **No CPC-classification searching was possible** in any of the seeded areas
   (H04W 84/18, H04W 4/90, H04W 4/02x, H04W 76/50, H04L 45/32, G08B 21/x,
   G08B 25/x, G06F 1/32x, H04L 9/32, G06F 21/64).
7. **Direct-mode standards not obtained** (ETSI/3GPP 403) — the cheapest and most
   decisive art against C, and my ETS 300 396-1 copy is from a **mirror**.
8. **Professional fee figures are unsourced placeholders** driving 80–89% of the
   §10 headline total.
9. **Unread claims:** US 11,676,230 B2 (Sumo Logic, reported ~2006 priority),
   US 11,139,954 B2 (Microsoft), RE 47,894 (III Holdings 2), the Bosch family
   members, US 9,763,311 B2, the smart-meter "last gasp" cluster, and 23 goTenna
   records.
10. **The Qualcomm LTE Direct whitepaper was not re-fetched** despite being
    flagged as potentially closer to Loc8 than Bell.
11. **UK law has five months of history and no judicial gloss.** [2026] UKSC 3 was
    decided 2026-02-11 and a forward-citation search on Find Case Law returned
    **no subsequent judgments**. The entire UK intermediate-step analysis is
    inference from a framework no UK tribunal has yet applied. Two live source
    conflicts remain: the **Manual of Patent Practice** (updated 2026-07-01) still
    sets out Aerotel and the AT&T signposts, contradicting the 2026-07-14 practice
    notice; and the 2024-07-25 neural-networks practice notice still instructs
    examiners to "apply the Aerotel approach" and **appears not to have been
    withdrawn**.
12. **Meshtastic pre-2021 provenance unresolved** — immaterial, since brief §3
    makes today the reference date.
13. `[UNVERIFIED]` **Loc8's eligibility** for the EPO Rule 7a(3) microenterprise
    reduction (VC aggregation risk) and USPTO micro-entity status.

### 13.6 A note on how the adverse findings were reached

Three findings were recorded **against the interest of the party making them**,
and are flagged here because their presence is evidence about the run's method:

- The B anticipation attack **failed on its assigned lens and said so** — it
  corroborated the optimist's zero-result rather than overturning it, then landed
  on a different axis.
- The A obviousness attack recorded that **Meshtastic's canned-message module
  indexes positionally, not by code range**, weakening its own anticipation case.
- The C attack pulled US 11,706,686 B2 (Peltbeam) **expecting an anticipation and
  reported that it was not one**, corroborating the one point in Loc8's favour.

Two corrections to the team's own collected art were also adverse to the
optimistic evidence and are recorded in place: **Nokia US 8,255,469 B2 does not
disclose Candidate A element (ii)** (§3.5), and **US 11,611,390 B2 is a false
friend that must not be cited against A** (§3.10).

---

## 14. Questions for the attorney

### 14.1 Questions research could not resolve

1. **Legal status.** INPADOC status, expiry and worldwide family for every
   reference in §9 — nothing in that section is reliable until this is done.
   Priority: US 7,245,216 (Tri-Sentinel) first.
2. **Bosch EP/DE/WO family.** Does a live EP member exist? This decides whether
   US 11,994,399 B2 is invalidity art or a UK/EP FTO item.
3. **Motorola Solutions US 12,445,929 B2 continuations.** What is pending, and
   what could it be drafted to cover? Is a third-party observation warranted?
4. **US 9,992,806 B2 ownership** — Intel or Apple? The USPTO assignment register
   was unreachable and Google Patents records both.
5. **Nokia continuations** US 8,856,252 / US 9,277,477 / US 10,057,753 and
   EP 2436198 A1 — any live member? The specification's worked example is Loc8's
   own use case.
6. **The unread claims** listed at §13.5(9).
7. **EPO Rule 7a(3):** does Loc8 meet the microenterprise test, and do
   linked/partner enterprise aggregation rules apply if there are investors?
   Worth ≈€2,600 on the EP case alone. And by what mechanism is the 30% reduction
   of the *already-paid* international search fee delivered at regional-phase entry?
8. **USPTO micro-entity:** do the founder-inventors clear the four-application
   limit and the $251,190 income limit?
9. **UK operational practice:** on the online "filing date only — No fee" route,
   is the application fee genuinely deferred to the 12-month s.15(10)(c)
   deadline, and does the £95 "pay later" rate then apply?
10. **Has the MoPP been revised** to reflect the 2026-07-14 practice notice, and
    has the 2024 neural-networks notice been withdrawn? (§13.5(11))
11. **Are there UKIPO hearing-officer decisions or first-instance judgments
    applying the new intermediate step?** There were none as at 2026-07-20; there
    will be by the time any Loc8 application is examined.
12. **SQLite journal mode.** Which mode does the Gateway actually use? The
    `synchronous=FULL` conflict (§6.8) cannot be resolved without it, and the
    limitation should not enter a claim until it is.

### 14.2 Alternatives worth raising

**Defensive publication** — the disposition the research points to for all three
candidates. Near-zero cost; forecloses a competitor patenting the same allocation
or the same shedding schedule against Loc8; secures freedom to practise. Given
that A, B and C are each anticipated or plainly obvious over public art, a
monopoly is not available, but *denial of a monopoly to others* is, and it is
cheap.

**Trade-secret treatment — available for B, INAPPOSITE for A.** Candidate A's
subject matter is broadcast unencrypted over the air and is capturable with a £20
BLE dongle; it cannot be a secret once the system runs in public (§11.4).
Candidate B's subject matter is internal Gateway firmware behaviour under duress
and **is not externally observable** — the same undetectability that destroys its
enforcement value makes it a plausible trade secret. **That is the honest
trade-off to put to the client: B is worth more as a secret than as a patent.**

**Demote rather than abandon.** The one theory under which Candidate A could
survive is as a **dependent claim** on some other genuinely novel primary
mechanism, not as an independent claim. Same for C.

**The two adjacent inventions (§1)** — hash-chain continuity across a
power-loss boundary, and state handoff at tier transitions — are different
inventions from A/B/C, are technical rather than administrative in aim (so
Comvik does not answer them), and **have not been searched**. If any budget is to
be spent on searching, the research view is that it should go there rather than
into confirming what is already established about A, B and C.

**The frame-format layer.** §1 records the analytical view that Loc8's
*Uniloc*-shaped material sits in the 25-byte frame budget, the fragmentation
scheme, TTL clamping under measured density and BLE⟷LoRa bridging. **Unsearched,
and no novelty claim is made.**

### 14.3 The question the client will ask, and the honest answer

*"Is there anything here worth patenting?"* — On the research as it stands, **not
in Candidates A, B or C as framed.** Each is either anticipated or obvious over
public, freely available art, and each independently fails the brief's own
§6.2(d) test: a claim narrow enough to grant is escapable in an afternoon, and a
claim broad enough to matter reads on the art. **Per the brief's §8, that is a
successful research outcome, not a disappointing one — it costs a report instead
of tens of thousands of pounds and three years.**

---

## 15. Full source list

All URLs accessed **2026-07-20** unless otherwise stated. Grouped by tier per
brief §8 (registers and claims → statutes and cases → official fee schedules →
standards → papers → everything else).

### Patent registers and full text
- https://patentimages.storage.googleapis.com/pdfs/US6226524.pdf
- https://www.freepatentsonline.com/6226524.html · /7010313.html · /7428423.html · /5423055.html · /5274838.html · /8255469.html
- https://www.freepatentsonline.com/11233672.html · /10228751.html · /11995734.html · /10839411.html · /7493441.html
- https://www.freepatentsonline.com/11994399.html · /11748407.html
- https://www.freepatentsonline.com/8841990.html · /10536978.html · /9763311.html · /11611390.html
- https://www.freepatentsonline.com/9992806.html · /11540351.html · /12004037.html · /12445929.html
- https://www.freepatentsonline.com/11509521.html · /11601330.html · /7245216.html · /11706686.html · /8130704.html
- https://www.freepatentsonline.com/10959078.html · /y2003/0142652.html
- https://patents.google.com/patent/US11233672B2/en · /US9503975B2/en · /US10839411B2/en · /US11139954B2/en · /US11676230B2/en · /US11082344B2/en · /US10764894B2/en · /US11765778B2/en · /WO2015183583A1/en *(all HTTP 503 or unread — listed for the attorney's use)*
- FreePatentsOnline expert search interface: https://www.freepatentsonline.com/result.html
- https://api.github.com/repos/meshtastic/protobufs/commits *(dating)*

### Statutes, rules and decided cases
- https://www.legislation.gov.uk/ukpga/1977/37/section/1 · /section/5 · /section/15
- https://www.legislation.gov.uk/uksi/2007/3291/article/22 · /27 · /28 · /30 · /66
- https://caselaw.nationalarchives.gov.uk/uksc/2026/3
- https://caselaw.nationalarchives.gov.uk/ewca/civ/2024/825 · /2006/1371 · /2013/451 · /2014/1463 · /2008/1066
- https://caselaw.nationalarchives.gov.uk/ewhc/pat/2009/343 · /ewhc/ch/2023/2948
- https://caselaw.nationalarchives.gov.uk/search?query=%22Emotional+Perception%22&order=-date
- https://www.epo.org/en/boards-of-appeal/decisions/t000641ex1 · t000641ep1 · t030258ex1 · t040154ex1 · t830006ex1 · t840208ex1 · t850115ex1 · t850163ex1 · t920769ex1 · t971194ex1 · g190001ex1 · g080003ex1
- https://www.epo.org/en/legal/epc/2020/a52.html · /a153.html · /r7a.html · /r159.html · /rfees.html
- https://www.law.cornell.edu/uscode/text/35/101 · /103 · /119 · /154 · /371
- https://www.law.cornell.edu/supct/html/04-1350.ZO.html · /04-1350.ZS.html
- https://www.law.cornell.edu/cfr/text/14/25.1457
- https://www.ecfr.gov/current/title-37/part-1/section-1.492 · /section-1.27 · https://www.ecfr.gov/current/title-13/part-121/section-121.802
- https://storage.courtlistener.com/pdf/2019/03/28/chargepoint_inc._v._semaconnect_inc..pdf
- https://storage.courtlistener.com/pdf/2022/12/16/adasa_inc._v._avery_dennison_corporation.pdf
- https://storage.courtlistener.com/pdf/2020/04/30/uniloc_usa_inc._v._lg_electronics_usa_inc..pdf
- https://storage.courtlistener.com/pdf/2016/08/01/electric_power_group_llc_v._alstom_s.a..pdf
- https://www.courtlistener.com/opinion/4439569/two-way-media-ltd-v-comcast-cable-communications-llc/
- https://www.courtlistener.com/opinion/10381132/recentive-analytics-inc-v-fox-corp/
- https://www.wipo.int/wipolex/en/text/288514 *(Paris Convention Art 4)*
- https://www.wipo.int/pct/en/texts/articles/a22.html

### Office guidance and practice
- https://www.gov.uk/government/publications/search-and-examination-of-uk-patent-applications-under-the-patents-act-1977-as-amended
- https://www.gov.uk/government/collections/patents-practice-notices
- https://www.gov.uk/guidance/manual-of-patent-practice-mopp/section-1-patentability
- https://www.gov.uk/government/publications/examining-patent-applications-involving-artificial-neural-networks
- https://www.uspto.gov/web/offices/pac/mpep/s2106.html · /s2111.html · /s2173.html
- https://www.bitlaw.com/source/mpep/2173_05_i.html
- https://www.uspto.gov/sites/default/files/documents/memo-101-20250804.pdf
- https://www.uspto.gov/sites/default/files/documents/memo-desjardins.pdf
- https://www.uspto.gov/patents/laws/examination-policy/subject-matter-eligibility
- https://www.uspto.gov/patents/laws/micro-entity-status
- https://www.federalregister.gov/documents/2024/07/17/2024-15377/2024-guidance-update-on-patent-subject-matter-eligibility-including-on-artificial-intelligence *(302-redirected; cited from two USPTO documents that quote it)*

### Official fee schedules
- https://www.gov.uk/patent-your-invention · /decide-which-type-of-application-to-file · /request-your-search-and-examination
- https://www.gov.uk/government/publications/apply-for-a-patent-search-and-examination-and-add-inventors
- https://assets.publishing.service.gov.uk/media/6a2ab8fe1f6fa5c3377e5dd6/Apply-for-a-patent-search-and-examination-and-add-inventors-form-pf1-7-9a-10.pdf
- https://www.gov.uk/government/publications/application-fee-for-patent-application · /grant-fee-for-patent-application · /national-processing-of-international-patent-uk-application · /payment-of-renewal-fee · /patent-forms-and-fees/patent-forms-and-fees
- https://www.gov.uk/request-uk-processing-of-international-patent-application
- https://www.gov.uk/guidance/patents-accelerated-processing
- https://www.gov.uk/government/publications/timescales-for-the-examination-of-patents/timescales-for-the-examination-of-patents
- https://www.gov.uk/guidance/patent-factsheet-filing-abroad · /protecting-your-patent-abroad · /get-legal-advice-from-an-intellectual-property-professional
- https://www.wipo.int/documents/d/pct-system/docs-en-fees.pdf · https://www.wipo.int/pct/en/fees/
- https://fees.apps.epo.org/prod/bff/api/fees?lang=EN&currency=EUR
- https://www.epo.org/en/applying/fees · /fee-reductions-and-compensation
- https://www.uspto.gov/learning-and-resources/fees-and-payment/uspto-fee-schedule

### Standards and technical specifications
- https://www.bluetooth.org/docman/handlers/downloaddoc.ashx?doc_id=429633 *(Bluetooth Mesh Profile v1.0)*
- https://www.qsl.net/kb9mwr/projects/dv/tetra/ets_30039601e01v.pdf *(ETS 300 396-1, Dec 1997 — MIRROR)*
- https://cdn.standards.iteh.ai/samples/etsi/etsi-en-300-396-1-v1-2-1-2011-12-/af40707432564d8f8983203917aebd4b/en-30039601v010201p.pdf
- https://standards.iteh.ai/catalog/standards/etsi/739dcc58-dc45-4ec4-9bbb-5c5c8b4d1f0e/etsi-en-300-396-1-v1-2-1-2011-12
- https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf · https://doi.org/10.6028/NIST.SP.800-53r5
- https://www.commoncriteriaportal.org/files/ccfiles/CC2022PART2R1.pdf
- https://www.rfc-editor.org/rfc/rfc8126.html · https://www.rfc-editor.org/rfc/rfc6962
- https://www.sqlite.org/pragma.html
- https://raw.githubusercontent.com/meshtastic/protobufs/master/meshtastic/portnums.proto
- https://raw.githubusercontent.com/meshtastic/ATAK-Plugin/main/README.md
- https://meshtastic.org/docs/overview/mesh-algo/ · /docs/configuration/module/canned-message/
- https://github.com/deptofdefense/AndroidTacticalAssaultKit-CIV

### Papers, industry and other
- https://www.usenix.org/legacy/publications/library/proceedings/sec98/full_papers/schneier/schneier.pdf
- https://www.itu.int/dms_pub/itu-r/oth/0a/0E/R0A0E0000CB0001PDFE.pdf
- https://www.itu.int/en/ITU-R/seminars/rrs/2021-Africa/Forum/Session%204_Emergency%20Communications/Motorola%20Solutions_PPDR_Spectrum._Africa%20-%20Emergency%20radiocommunications%20RRS-21-Africa.pdf
- https://www.aircomm.com/downloads/motorola/astro25_brochure.pdf
- https://www.qualcomm.com/media/documents/files/lte-direct-always-on-device-to-device-proximal-discovery.pdf *(NOT re-fetched)*
- https://en.wikipedia.org/wiki/Terrestrial_Trunked_Radio · /wiki/PACE_(communication_methodology) *(secondary only; used solely where primary sources returned 403)*
- https://www.cisa.gov/resources-tools/resources/leveraging-pace-plan-emergency-communications-ecosystem *(HTTP 403)*
- https://www.albright-ip.co.uk/patents/costs/ · https://ipreg.org.uk/got-an-idea

---

*End of report. Produced 2026-07-20 by a 132-style multi-agent adversarial
research run. Research input for a qualified UK/European patent attorney. Not
legal advice; no filing recommendation is made or implied.*
