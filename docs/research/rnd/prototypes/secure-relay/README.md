# Secure connected-relay prototype

This is an isolated R&D prototype for `CONN-01`. It does not replace
`tools/mesh-bridge`, change app behaviour or constitute production security.

It evaluates:

- short-lived signed connection capabilities;
- WebSocket-subprotocol authentication without query-string secrets (still a
  bearer credential that must be short-lived, memory-only and redacted from
  proxy/server logs);
- production TLS enforcement seam;
- strict site isolation and gateway/Command directionality;
- one-use token replay rejection;
- Command origin allowlisting;
- parser-level 25-byte payload rejection and bounded receiver send queues;
- bounded connection/token/audit state;
- token-bucket frame limiting; and
- hash-linked metadata audit with external head/count anchoring semantics.

It deliberately does not solve mesh payload encryption, production operator/
device PKI, durable audit, recovery, revocation or TLS certificate management.

Run:

```bash
node --test docs/research/rnd/prototypes/secure-relay/secure-relay.test.mjs
node docs/research/rnd/prototypes/secure-relay/benchmark.mjs
```

The pre-registered threat model/gates and final decision live in
[`../../results/CONN-01/2026-07-22-secure-relay-prototype/README.md`](../../results/CONN-01/2026-07-22-secure-relay-prototype/README.md).
