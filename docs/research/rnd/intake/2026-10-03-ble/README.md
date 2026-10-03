# BLE mesh research intake — 3 October 2026

This is a source-backed continuation of R3 / SEC-01 E06, R4 and RADIO-01 E07.
Read the [2 October research brief](../../briefs/2026-10-02-offline-ble-mesh.md), the [registered local experiment](../../BLE-DENSITY-PROTOCOL-2026-10-03.md)
and [implementation result](../../results/2026-10-03-ble-density.md) before
making a production decision. Existing MESH-01 physical acceptance remains held.

## Useful developments and their dispositions

| Technique | Best original sources / reproducible code | Fit to current Loc8 | Decision |
|---|---|---|---|
| Density / finite Trickle forwarding | RFC6206, RFC7731, NSDI2004, adaptive-k 2015; OEPB and BLE -01 drafts dated 30 September 2026 | Local native scheduling can preserve both the 25-byte payload and 47-byte frame. GATT copies do not prove outgoing coverage. | Independently implement a detached candidate and benchmark against actual jitter+cancellation. OEPB code unavailable; do not reproduce its stats as Loc8 results. |
| Periodic-advertising low-power relay | June 2026 DPCS paper; author three-board Apache-2.0 demo; maintained Zephyr samples / BabbleSim tests | Dedicated Nordic relay firmware, different bearer and discovery/power tradeoff. No verified consumer-phone periodic-API path. | External hardware bench candidate after parser/staleness fixes and pinned SDK; no client transport replacement. |
| Structured relay selection | May 2026 Saleh paper + MIT MPR MATLAB reference; OLSR/OLSRv2; SIG Mesh 1.1; current public-domain BitChat route policies | Current phones lack fresh authenticated two-hop topology/control signalling. Route lists do not fit legacy semantics. | Later graph comparator and failure fallback; hold runtime source routing. |
| Store-carry-forward | RFC9171, Spray and Wait; public-domain BitChat courier store; GPL THE ONE simulator | Age is separate from hop TTL; text/profile payloads have no usable timestamp. Retaining plaintext locations introduces new exposure. | Synthetic in-memory contact experiment only. No persistent phone outbox or remote-age claim. |
| BLE / long-range gateway | Current MIT MeshCore channel datagrams; MIT LoRaMesher; April 2026 hierarchical preprint | Optional dedicated carrier can tunnel raw 47-byte frames, leaving consumers on BLE. Gateway acceptance is not end-to-end acknowledgement. | Document explicit bench topology/envelope/loop/age gates. Preprint LoRa is not activated; no field-backed large-area claim. |

Detailed original links, source access limits, exact revisions, maintenance dates,
selected file headers, risks and next tests are in:

- [Forwarding and periodic advertising](forwarding-and-periodic.md), with
  [23 pinned file inspection hashes](forwarding-source-receipt.json).
- [Routing, couriers and gateways](routing-couriers-and-gateways.md), with
  [source inspection receipt](routing-source-receipt.json).

These refresh a narrow subset of the existing 48-repository July library;
unrefreshed entries keep their historical evidence dates. Papers, standards,
vendor reports, source code and Loc8 test evidence are distinct evidence classes.

## Reuse / licence receipt

**No third-party implementation code was copied, vendored, linked, executed or
added as a Loc8 dependency.** New policy, tests and simulator are independently
written. Selected upstream code was read for provenance and technical screening.
Research documents are original summaries with primary links and file hashes;
upstream clones/downloads remain outside the product tree. No changes to the
synced ChatGPT project reference files.

MIT (MeshCore, LoRaMesher, MPR) and Unlicense (BitChat iOS) are candidate code
assets; Apache-2.0 DPCS/Zephyr are candidate firmware assets with attribution and
notice obligations. Their selected-file screen is not a complete licence or
dependency clearance for distribution. Their code is not a drop-in phone relay.

Nordic OpenMesh has processor-restricted terms. Meshtastic/THE ONE are GPL;
THE ONE map assets have additional restrictions. Reticulum's current code licence
is custom/restrictive. Original BMSim lacks a code licence, even though a fork
advertises MIT. OEPB code/source licence is unavailable. These are idea or
separately isolated benchmark references; none enters proprietary Loc8 here.
IEEE/article access and CC BY paper terms do not grant software rights. IETF
text/code-component notice rules remain applicable if code is ever extracted;
this work extracted none.

## Next production decision

Retain the existing default and wire format. Use the local cohort result to
decide which hypothesis merits a subsequent native shadow/feature-flag bench.
Do not merge main from a synthetic win. Sparse bridges, bounded queues,
asymmetric links, real background/locked states and battery need independent
evidence. Gateways and authenticated courier envelopes remain separate lanes.
