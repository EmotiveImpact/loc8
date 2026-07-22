# Product promotion brief: connected relay security seam

## Outcome

Promote the tested control interfaces and adversarial suite into the
`loc8-relayd` product backlog. Do not ship or silently substitute the research
prototype for the present field-demo relay.

## Product-development units

### PD-CONN-01 — separate demo relay from production relay

- Keep `tools/mesh-bridge` visibly named/documented as local field-demo tooling.
- Create the production `loc8-relayd` service boundary described by Loc8OS.
- Production configuration fails closed without TLS, issuer keys, durable audit
  and site policy.
- No `allowInsecure` production environment variable; test-only injection occurs
  through code/test construction.

### PD-CONN-02 — identity/capability issuer

- Define operator login and device/Gateway enrolment.
- Issue short-lived, one-use connection capabilities with version, site, subject,
  role, expiry and token ID.
- Use asymmetric issuer verification or an appropriately isolated issuer; do not
  distribute the prototype's HMAC signing secret to clients.
- Use a reviewed token/protocol implementation and cryptographically random,
  unpredictable token IDs; the prototype's dependency-free HMAC format and test
  sequence IDs are research fixtures, not a production token standard.
- Define renewal, reconnect, revocation, stolen-device and clock-failure behaviour.

### PD-CONN-03 — client authentication seam

- Extend `BridgedTransport` socket creation to accept negotiated subprotocols and
  an asynchronous fresh-capability provider.
- Never place capabilities in query strings, `localStorage`, `EXPO_PUBLIC_*`
  configuration or persistent app logs. Hold the connection capability in memory
  only and reacquire it for reconnect.
- Treat the subprotocol capability as a bearer credential: configure edge/server
  log redaction for `Sec-WebSocket-Protocol`, select/echo only the non-secret
  `loc8.v1` protocol, and test that redirects/errors/telemetry never disclose it.
- Record an ADR comparing this browser-compatible approach with a same-origin,
  authenticated HTTPS one-time-ticket/secure-cookie upgrade. Neither should be
  chosen by assuming WebSocket headers are secret.
- Verify browser and React Native WebSocket subprotocol interoperability on the
  supported Expo 57/device matrix.
- Remove the production ability to select an arbitrary bridge endpoint through
  `?bridge=`. Provision an exact `wss:` endpoint or strict allowlist; retain the
  query-driven endpoint only in visibly marked local demo builds.
- Expose reasoned states such as unauthenticated, expired, revoked, wrong site and
  unavailable rather than one ambiguous `connected` boolean.

### PD-CONN-04 — site and role policy

- Partition all connection/routing state by stable site ID.
- Enforce gateway-to-Command and Command-to-gateway delivery direction.
- Treat browser `Origin` checks as defence in depth, never as client identity or
  authorisation.
- Add payload/application authorisation once protocol v2 authenticates the sender
  and message; connection role alone cannot prove a 25-byte frame's sender.
- Test duplicate gateways, partitions and reconnects before multi-Gateway sites.

### PD-CONN-05 — limits and availability

- Configure per-site/global connections, capability cache, frame rate/burst,
  queue bytes/age and audit bounds.
- Set the WebSocket parser's maximum payload to the protocol maximum, disable
  compression unless separately justified/tested, and shed or close slow
  consumers before their outbound queue exceeds its byte/age budget.
- Preserve priority capacity for SOS/control traffic once payload type can be
  authenticated; the prototype cannot safely prioritise unsigned frame contents.
- Add reverse-proxy/process/network DoS controls and monitoring. For TLS
  termination, use direct TLS or an explicitly trusted proxy boundary; never
  trust arbitrary `X-Forwarded-Proto` input to satisfy the WSS requirement.

### PD-CONN-06 — durable audit and recovery

- Persist connection/policy/frame-metadata events in `sited` rather than memory or
  browser `localStorage`.
- Hash-link entries and export/sign both chain head and entry count off-box.
- Test mutation, middle/tail deletion, disk-full, power loss, backup/restore and
  stale/wrong-clock behaviour.
- Keep sensitive payload/location content out of relay audit unless a defined
  operational/legal need requires it.

### PD-CONN-07 — security verification

- Port the 14 adversarial cases and 10,000-operation regression benchmark.
- Add decoder fuzzing, multi-process/site tests, real TLS proxy tests, browser/
  phone reconnects, issuer compromise/revocation and external penetration review.
- Verify CSP/hosting headers, dependency/advisory scanning, secret/header
  redaction, fixed endpoint provisioning and browser XSS resistance around the
  in-memory capability.
- Do not describe the connected service as production-ready until these gates and
  the separate payload-authentication/encryption work pass.
- Close or formally accept every production dependency advisory using an Expo
  57-compatible remediation. Do not use `npm audit fix --force` to silently
  downgrade the required platform.

## Known product dependency

The prototype resolved `ws` 7.5.11 from the root while the mesh-bridge workspace
requests `^8.18.0` and reports 8.21.0. Product development must make dependency
resolution deterministic and retain compatibility tests rather than assuming the
manifest is the runtime.

## Acceptance for closing CONN-01

CONN-01 closes only after a product-shaped deployment proves:

- real TLS/certificate lifecycle;
- operator/device issuer and revocation;
- Command and Guard/Gateway reconnect with fresh capabilities;
- zero cross-site/role leakage under multi-process load;
- durable audit, backup and restore;
- failure/clock/disk/partition behaviour;
- explicit data retention and tenant controls;
- independent security review findings resolved or accepted in writing; and
- dependency audit findings closed or risk-accepted with scope and owner.
