# FLOOR-01 privacy, consent and retention boundary

This is the minimum technical/governance boundary for the later physical
instrumentation pilot. It is not itself approval to collect data.

## Data minimisation

Permitted raw fields are limited to the versioned manifest/event contract.
Names, email addresses, phone/account/user identifiers, precise GPS, latitude,
longitude, free text, Wi-Fi SSID/BSSID and BLE/Wi-Fi MAC addresses are forbidden.
Kind-specific payload allowlists reject unreviewed extensions.

Radio observations use only `tx_<site-keyed value>` plus a declared key epoch.
The implementation does not create that value: the collection adapter must use
a secret site/study-keyed HMAC, rotate the key epoch under protocol, and never
write the input address or a globally stable unsalted hash. Research exports do
not contain the secret.

Session, participant, device-profile, building and withdrawal values are random
or catalogue-scoped pseudonyms. The withdrawal-token-to-session mapping is kept
separately from raw telemetry. Public fixtures and derived metrics contain no
real site or person trail.

## Consent and authority gate

Before a physical session, all of the following must exist outside the app:

1. building owner/occupier permission for the route and radio observations;
2. an approved protocol for consenting adult R&D participants;
3. a plain-language description of sensors, purposes, retention, withdrawal and
   limitations;
4. a consent record no later than session creation;
5. an independent ground-truth observer where required by the pilot; and
6. a stop/escalation procedure for accidental public or sensitive collection.

No member of the public or operational incident is part of E03. The app must
fail closed without the consent and site/study fields; a syntactically valid
manifest does not prove that governance approval is real.

## Storage and access

Raw bundles must be written only to the opaque `research://` location represented
in the manifest. The backing store must provide authenticated encryption at rest,
least-privilege access and access logging. Those are runtime properties to be
tested during the physical pilot; the boolean manifest fields are declarations,
not cryptographic proof.

Do not put raw physical bundles in Git, issue trackers, chat attachments,
analytics, crash reports or ordinary application logs. Derived committed
evidence must be aggregated/redacted and carry the source-bundle hash plus access
location without embedding the source.

## Retention and deletion

Schema v1 rejects raw retention beyond 366 days from session creation and
requires a future delete-after value. A future policy that changes this limit
must version the schema and obtain approval; it must not override the validator
silently.

The physical repeat must demonstrate:

- deletion by withdrawal/session token across primary storage and documented
  backups/replicas;
- inaccessibility after the retention deadline;
- retained audit evidence that a deletion occurred without retaining the person
  trail; and
- restoration only within the retention window from the documented encrypted
  location.

Until encryption, access logs, restore and deletion are actually exercised, the
field-collection decision remains `HOLD`.

## Residual risks

- Pseudonymous motion/radio traces may still be linkable within a site/session.
- Device model, time and route can make a small cohort recognisable.
- A keyed transmitter identifier remains linkable for its epoch.
- Building IDs and connector paths may be commercially sensitive even without
  an address.
- Strict field scanning catches named/direct leaks, not every secret embedded in
  an allowed catalogue string.

Mitigations are short collection windows, site-scoped keys, separated mappings,
minimum-access storage, fixed enumerations, cohort aggregation and deletion.
These risks must be reviewed again before any customer or operational pilot.
