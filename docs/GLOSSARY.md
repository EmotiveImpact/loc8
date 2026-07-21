# Glossary — every term in this repo, in plain English

*Written 2026-07-21 because the docs had drifted into jargon. If a term in any
Loc8 document isn't here, that's a bug — add it.*

---

## Our own things

| Term | Plain English |
|---|---|
| **The mesh** | The core idea: phones pass messages along a chain, person to person, with no network. Every phone running Loc8 relays for every other one — including strangers. |
| **Hop** | One step in that chain. A message goes up to 7 hops. Each hop is 5–20 m in a crowd. |
| **Frame / packet** | One Loc8 message. Always 25 bytes — tiny, deliberately. |
| **Gateway** | The brain box. **One per venue.** Holds the incident record, feeds the control room, and acts as one very good mesh node. ~£75–90. |
| **Anchor** | The ears. A dumb box on a pole (or a steward's shoulder) that listens for phones and repeats what it hears. **Zero to dozens per venue.** ~£65–75. |
| **Body-worn anchor** | The same electronics in a pouch on a steward's shoulder, run off a phone powerbank. Stewards are already spread where the crowd is and walk toward trouble, so coverage follows the incident. No poles, no rigging, no licences. Rated better than any drone or mast option. |
| **Command** | The control-room screen. Runs on any laptop on the venue's own network. |
| **Guard** | The security staff app: SOS, dispatch, muster. |
| **Muster** | Roll call. Everyone confirms they're safe — and the board **names who hasn't**. This naming is the thing no competitor does. |
| **The gate** | The remaining field test: proving a message relays through a *third* phone. Two phones prove radios; three prove a mesh. |
| **Degradation ladder** | The design promise: each layer failing drops you to a still-working system. Internet dies → nothing happens. Control room dies → mesh keeps working. Gateway dies → phones still find each other. |

## Radio words

| Term | Plain English |
|---|---|
| **BLE** (Bluetooth Low Energy) | The ordinary Bluetooth in every phone. What the mesh runs on. |
| **Advertising / broadcast** | Shouting a message to anyone in earshot, with no pairing and no connection. This is why unlimited phones can listen at once — and why strangers can relay for you. |
| **LoRa** | A different radio: kilometres of range, very slow, tiny messages. Used to link anchors across empty ground. **Phones cannot hear LoRa** — different frequency *and* different method. Anchors translate. |
| **Uplink vs downlink** | **Downlink** = anchor → phone (strong: mains power, big antenna, up high). **Uplink** = phone → anchor (weak: battery, tiny antenna, in a pocket, against a body). **The weak one is the one that matters**, because finding people means *hearing* their phones. Plan anchor spacing on ~25–30 m, not the 50 m downlink figure. |
| **EIRP** | Total radio loudness, including the antenna. UK law caps it at 20 dBm (100 mW) at 2.4 GHz. You cannot legally buy more — so money spent on transmitting is wasted, and money spent on *listening* is not. |
| **dB / dBm** | The loudness scale. It's not linear: **+6 dB roughly doubles range, −6 dB roughly halves it.** A body between two phones costs about 15 dB. |
| **FEM** (front-end module) | A ~£4 chip that helps a radio hear better — +13 dB, which roughly doubles listening range and so covers ~4× the area. The reason the anchor went from £35 to £65, and why the expensive one is cheaper per venue. |
| **Capture effect** | **Why short range is a feature.** In a crowd the nearest phone drowns out distant ones, so one message gets decoded cleanly. Lift the receiver high and every signal arrives at similar strength, so they collide and cancel. This killed the drone idea — and it's why "more range" would break the product. |
| **Coded PHY** | A long-range Bluetooth mode. Useless to us: Apple removed iPhone support in iOS 14. |
| **PoE** (Power over Ethernet) | One cable carries power *and* network. An anchor or Gateway needs one wire, not two. |
| **RSSI** | How strong a received signal was. Useful, noisy, and **not** a reliable distance measurement. |

## Software and data words

| Term | Plain English |
|---|---|
| **TLS** | The padlock in your browser. Scrambles data travelling over a network. Free, built in, nothing to build. |
| **Transport** | However the bytes travel — Bluetooth mesh, or over a network. Loc8's engine is built so this is swappable; the muster board doesn't care what carried the message. |
| **SQLite** | The database inside the Gateway. One file, no server to look after. |
| **WAL / `synchronous=FULL`** | Database settings deciding whether the incident record survives a power cut. Only safe **in combination** — corrected in the spec on 21 July. |
| **Hash-chained / tamper-evident** | Each record locked to the one before it, so nobody — including us — can quietly alter history. This is what makes the log usable as evidence. |
| **AEAD / payload encryption** | Scrambling the message contents. **Loc8 has none today** — every frame is readable by anyone with a £20 Bluetooth sniffer. Needed before any public mesh pilot. |
| **Rotating pseudonyms** | Changing the ID a phone broadcasts, so nobody can follow one person around all night. Currently the sender ID is fixed and in the clear. |
| **DPIA** | Data Protection Impact Assessment — a document required before doing anything clever with personal data. Staff location counts as personal data. |

## Business words

| Term | Plain English |
|---|---|
| **TAM** | Total Addressable Market — how big a market is in total. The figure in the old `business-model.md` that was wrong by about 4×. |
| **SaaS** | Software sold by subscription rather than bought outright. |
| **ARR** | Annual Recurring Revenue — subscription income per year. Companies like ours sell for 4–9× this. |
| **Beachhead** | The first market you win completely before expanding. Research says: UK agricultural and county shows. |
| **Martyn's Law** | The Terrorism (Protection of Premises) Act 2025. Puts security-preparedness duties on UK venues. **Standard tier** = 200+ capacity, **enhanced tier** = 800+. Sell the deadline and the named accountable person — never the word "compliance" (ProtectUK explicitly says venues don't need to buy consultancy to comply). |
| **SAG** | Safety Advisory Group — the local body that reviews an event's safety plan. They review the lost-child plan, which is our way in at county shows. |
| **PQQ / ITT** | Pre-Qualification Questionnaire / Invitation To Tender — the paperwork stages of winning a big contract. |
| **Dunning** | Chasing unpaid invoices. Our policy: cloud stops, **the venue's safety system never does**. |

## Hardware and compliance words

| Term | Plain English |
|---|---|
| **Dev board / dev kit** | A bare circuit board with the chips exposed — a **test tool, not a product**. The Nordic nRF21540-DK is ~£76. **Buy three (~£230): two prove a link, three prove a relay.** Never mistake this for what a product costs; the chips inside are a few pounds. |
| **nRF52840** | The Bluetooth chip an anchor would use. |
| **nRF21540** | The listening amplifier (the FEM) that goes with it. |
| **Pre-certified module** | A radio component someone else already got legally approved. Using one means your product inherits that approval. **Decide this before designing any circuit board** — getting it wrong can cost more than two years of hardware revenue. |
| **IP66 / IP54** | Weatherproofing ratings. IP66 survives outdoors in rain; IP54 is indoor-ish. |
| **Ofcom IR 2030** | The UK rulebook for what radios may do at 2.4 GHz. Source of the 20 dBm cap. |
| **EN 300 328** | The European test standard behind that cap. |
| **RER 2017** | Radio Equipment Regulations — the law for putting radio hardware on the UK market. **Renting counts** as placing on the market. |
| **UKCA / CE** | The marks saying a product meets those rules. |
| **ATEX / intrinsic safety** | Certification for electronics in explosive atmospheres (mines, oil rigs). A hard blocker — it's why those markets were killed. |
| **RECCO** | The passive, battery-free avalanche reflector sewn into ski jackets since 1983. The incumbent that makes the ski market unwinnable. |
