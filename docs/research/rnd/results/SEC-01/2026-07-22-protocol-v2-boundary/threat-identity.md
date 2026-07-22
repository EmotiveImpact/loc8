# Protocol-v2 threat and identity boundary

**Date:** 2026-07-22
**Questions:** SEC-01, SEC-02, SEC-03, SEC-06, SEC-08, SEC-09

## Trust rule

Trust is granted by verified keys and current scoped credentials, not by a BLE
address, radio pseudonym, display name, crew code, packet sender ID, route,
transport, proximity, possession of old traffic, or a claim made by a relay.
BLE peers, venue IP relays, LoRa carriers, gateways acting only as carriers,
couriers and wall clocks are untrusted inputs.

## Assets and actors

| Actor or asset | Trust/authority | Main failure or abuse |
|---|---|---|
| Person | Human subject linked to an operational roster by an authorised issuer; never itself a key | Misidentification, coercion, shared phones, stale roster, excess location exposure |
| App install | Primary cryptographic principal and key holder | Reinstall/clone, key extraction, stolen unlocked phone, rollback |
| Physical device | Capability and secure-storage context; not proof of personhood | Device reuse, OS compromise, missing secure hardware, attestation overreach |
| Site | Tenant/venue security and policy scope | Cross-site injection, malicious site admin, wrong commissioning root |
| Team | Operational membership subset within a site | Role escalation, stale reassignment, team-tag enumeration |
| Shift | Short-lived authorisation epoch and privacy scope | Expired credential use, clock failure, incomplete revocation distribution |
| Guard/consumer app | Originates and receives operational/user events under its credential | Spoofed sender, background loss, sensitive plaintext, UI over-trust |
| Command/operator | Privileged operational reader/sender with named operator session | Static/demo identity, overbroad roles, unaudited correction or dispatch |
| Gateway | May issue local delivery receipts and persist authorised audit; is not allowed to forge users | Capture, box swap, clock rollback, tenant bridging, tail deletion |
| Anchor | Commissioned site asset that may assert its own zone/floor only | Relocation, cloned/stale anchor, false floor evidence |
| Relay/courier/carrier | Availability-only intermediary | Read/link/drop/replay/reorder/amplify traffic or claim false routes |
| Site/shift issuer | Signs membership, policy and revocation state | Key compromise is site-scope catastrophic; requires offline recovery |
| Recovery authority | Explicit out-of-band reset after issuer/device loss | Silent downgrade or unaudited mass re-enrolment |

## Adversary capabilities

- Passive BLE observation, including service UUID, timing, size, proximity,
  rotation events and traffic bursts.
- Frame injection, alteration, replay, truncation, fragmentation, reordering and
  duplicated delivery from one or many radios.
- Sybil peers, churn, false neighbor lists, route poisoning, pseudonym collision,
  queue/fragment/courier exhaustion and malicious-but-valid low-role members.
- App restart, storage rollback, wall-clock rollback/jump, long partitions and
  delivery after the originating shift ended.
- Lost/stolen devices, leavers, role changes, compromised anchors and malicious
  or captured relays/gateways.

Out of scope for this local spike: resistance to a fully compromised phone OS,
radio jamming, issuer-root compromise recovery details, cryptographic side
channels, coercion, and claims of emergency-grade availability. Those remain
system/security review topics, not assumptions silently treated as solved.

## Identity lifecycles

### Person

`personRef` is a site-owned opaque roster reference. It is never broadcast and
must not be used as a radio or dedup identifier. A person may have zero, one or
multiple installs during a shift; shared-device use is explicit and auditable,
not inferred from the hardware. Joining, leaving, correction and roster deletion
must not require reusing the radio identifier.

### Install

An app install generates its long-term identity inside platform protected
storage through a reviewed key provider. Reinstallation creates a new install;
it does not silently recover the old authority. Enrolment binds the install's
public identity to a person/site scope through an issuer-signed credential.
Key export is forbidden by default; recovery is a new enrolment plus revocation
of the old install.

### Device

The physical device record contains model/OS/capability and optional hardware
key evidence. Device ID/serial/advertising MAC is not a protocol identity.
Hardware attestation may increase assurance after a privacy and platform review,
but absence of attestation must produce a named policy outcome rather than a
false authentication failure.

### Site, team and shift

- `siteId` is a stable internal tenant scope, hidden from ordinary radio
  observers where routing permits.
- `teamId` is a scoped operational group; current numeric crew/team tags are
  routing hints only and cannot prove membership.
- `shiftId` and monotonic `shiftEpoch` bound authority, pseudonyms, replay state
  and migration policy. A shift ends by credential expiry and explicit local
  closure; a wall clock alone is not trusted to revoke it.
- Site policy and the highest accepted migration/revocation epoch persist across
  app restart. Regressing that state requires an explicit recovery-authority
  ceremony and audit event, not a peer capability advertisement.

## Offline membership and roles

A future reviewed credential format must bind at least:

```text
credential version
siteId, teamId(s), shiftId, shiftEpoch
install public identity
opaque personRef (encrypted to authorised operational recipients where needed)
role and permitted message/operation set
not-before/not-after plus maximum offline grace
revocation generation
issuer identity and reviewed-library authenticator
```

Roles are capabilities, not labels. Suggested minimum scopes are consumer,
guard, supervisor, command-operator, gateway-service, anchor, commissioner and
site-issuer. Relaying is not a privileged role and grants no content access.
An SOS from an unverified/expired source may be shown as an **unverified safety
signal**, but must not be attributed to a named person or trigger privileged
automation as if authenticated.

Offline authorisation uses short-lived shift credentials plus a monotonic signed
revocation bundle distributed before and during the shift. Nodes persist the
highest accepted revocation generation and reject lower generations after
restart. Revocation cannot be instant in a partition: the residual-risk bound is
the shorter of credential expiry, offline grace and time until a newer bundle
reaches the node. Product UX and runbooks must state that bound.

## Lost, stolen, removed and expired installs

1. Site authority publishes a higher-generation revocation entry for the install.
2. Online gateway/Command and connected peers stop privileged traffic from it.
3. Partitioned peers apply the change when the signed bundle arrives; until then,
   the expiring credential is the bound.
4. Outboxes/courier deposits for the revoked install are quarantined/dropped
   according to authenticated recipient identity, not its last pseudonym.
5. Re-enrolment creates a new install identity and credential. It never clears
   the audit record or silently reuses the lost key.

Panic wipe destroys local identity keys, session state, sealed outbox/courier
material and local mappings. It does not erase remote incident/audit records,
does not revoke copies still accepted by partitioned peers, and is not a substitute
for issuing revocation.

## Radio-visible identifiers and rotating pseudonyms

The spike's four-byte `carrierPseudonym` exists only so current native v1 wrapping
uses one consistent outer sender value across a set of v2 cells. It grants no
authority and is too short to be a durable identity. Its generation and rotation
must come from the reviewed identity provider.

The production model needs separate names:

- **carrier pseudonym:** short-lived compatibility/link value, radio visible;
- **route pseudonym:** current-session identifier used only in verified topology
  and source routes, radio visible where required;
- **message handle:** per-logical-message opaque dedup/reassembly value, radio
  visible and never reused;
- **install identity:** stable cryptographic principal, not radio visible in
  normal traffic;
- **person/audit subject:** stable authorised operational mapping, encrypted and
  visible only to authorised recipients/audit services.

Rotate carrier/route pseudonyms on shift change, credential change, revocation,
panic wipe and a reviewed time/connection schedule. Do not rotate mid-fragment or
mid-route without a continuity rule. A verified announcement maps the current
pseudonym to an install credential locally; relays do not receive the person
mapping.

## Audit linkage

Authenticated logical envelopes carry an encrypted audit-subject reference and
install credential reference to authorised operational recipients. Gateway and
Command record the verified install/person/role, policy and revocation generation,
logical message ID, receipt/delivery decisions, corrections and current radio
pseudonym only when operationally necessary. Ordinary relays retain only bounded
dedup/routing state and must not build a persistent pseudonym-to-person history.

Pseudonym rotation therefore breaks passive radio linkage while authorised audit
can still link an event after successful envelope verification. A failure to
verify produces an unverified event with raw-evidence minimisation, never a guessed
person attribution.

## Replay and clock rules

- Noise/session nonces and authenticators belong to the reviewed provider.
- Application replay keys are `(site, shiftEpoch, authenticated install,
  senderSequence/messageId)`; current seconds-resolution last-write-wins is not
  sufficient for multiple same-second events or restart.
- Persist bounded recent IDs and the highest authenticated sender epoch/sequence.
  On uncertain downtime, conservatively retain replay entries for their full
  remaining window; availability loss is safer than silently reopening replay.
- Wall time is a coarse expiry/usability signal. It cannot be the sole ordering or
  authorisation source. Clock rollback/jump is surfaced and audited.
- Offline/courier messages carry authenticated creation/expiry policy, but the
  receiving node uses its local observation time and issuer/shift epoch to decide
  whether the time claim is plausible.
- Sequence wrap requires a new authenticated sender epoch/session; it must never
  reset silently inside the same credential epoch.
