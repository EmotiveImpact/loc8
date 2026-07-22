# loc8-relayd product core boundary

This directory is the smallest product-shaped seam promoted from `CONN-01`.
It is **not a runnable production service** and it is not pilot-ready.

The core owns connection admission, expiring sessions, site/role routing,
parser/rate/connection/queue bounds and metadata-audit calls. Production implementations are required
for all of these injected ports:

- reviewed asymmetric capability verification;
- operator/device enrolment and one-use capability issuance;
- shared durable replay and revocation stores;
- versioned site/role policy;
- hash-linked audit repository and externally signed head/count sink;
- trustworthy wall/monotonic clock;
- direct-TLS or explicitly trusted-proxy WebSocket adapter; and
- fixed-endpoint client provisioning.

There is intentionally no signer, HMAC secret, database, TLS server or `ws`
import here. Test fakes prove contracts, not durability or identity. The future
network adapter must carry its own lockfile/image and pin one reviewed `ws` 8.x
patch; it must not inherit root `ws` 7.5.11 through workspace hoisting.
At startup that adapter must call `assertDeterministicRuntime`, create its
WebSocket parser with `maxPayload: 25` and `perMessageDeflate: false`, and wire
the adapter's `bufferedAmount`/oldest-queued monotonic timestamp into the core
sink.

`tools/mesh-bridge` remains local demo tooling. Do not route operational traffic
to it or describe this core as upgrading it in place.

Run the dependency-free contract suite and local regression benchmark with:

```sh
npm --prefix services/loc8-relayd test
npm --prefix services/loc8-relayd run benchmark
```

The pre-registration and final evidence live under
`docs/research/rnd/results/CONN-01/2026-07-22-product-boundary-repeat/`.
