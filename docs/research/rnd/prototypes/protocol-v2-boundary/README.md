# Protocol-v2 boundary spike

Pure Node.js research code for the SEC-01/SEC-07 and MESH-06/MESH-10 decision.
It changes no application or native transport behavior and adds no dependency.

The spike covers:

- an unambiguous fixed 25-byte v2 transport cell and bounded hop-by-hop
  reassembly of opaque logical frames;
- a mandatory `verifyAndOpen` seam for a future reviewed cryptographic provider;
- a monotonic, persisted site/shift migration floor;
- a bounded, restartable dedup cache with a control-traffic reserve;
- fresh verified bidirectional topology and bounded source routes; and
- deterministic logarithmic fanout plus a synthetic load benchmark.

It does not implement encryption, signatures, identity keys, membership proofs,
pseudonym generation, a persistent secret store, courier payloads or gossip
filters. The 25-byte cell is an R&D transport proposal, not a frozen production
wire format.

Run without installing anything:

```sh
node --test docs/research/rnd/prototypes/protocol-v2-boundary/protocol-v2-boundary.test.mjs
node docs/research/rnd/prototypes/protocol-v2-boundary/benchmark.mjs
```

## Provenance

No upstream source was copied. The component selection and comparison were
informed by the public-domain BitChat iOS/v2 repository at `733098bb633e`; the
algorithms here were independently written for Loc8's constrained test seam.
Columba (MPL-2.0), Weshnet (MIT/Apache-2.0), MeshCore (MIT), Meshtastic
(GPL-3.0) and Reticulum (custom reference-code licence; protocol separately
public domain) were inspected only as architectural/test references. No source
from those projects is included here.
