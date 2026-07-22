# MESH-01 E01 three-phone physical runbook

**Status:** ready for native build/review; physical execution still required

**Protocol:** `mesh-01.e01.v1`
**Preregistration:** `docs/research/rnd/results/MESH-01/2026-07-22-three-phone-relay-kit/pre-registration.md`

Do not improvise thresholds or discard a failed block. If a block is
interrupted, secure its evidence and classify the run `INCOMPLETE`; use a new
run ID for a full repeat.

## 1. Stop conditions before building

Do not begin unless all are true:

- three permissioned phones and a physically isolated A/C layout are available;
- site and operator authority are recorded;
- an approved encrypted, access-logged evidence location and deletion owner
  exist before any export;
- all three phones can run the same commit/native build;
- Node is at least 22.13 (the canonical runtime is 22.22.3);
- the SDK 57 toolchain is supported: Xcode 26.4+ for iOS, or a compatible JDK
  plus Android SDK/target 36 for Android;
- `npx expo-doctor` reports 20/20; and
- the field build is not distributed as a production or safety system.

This workstation currently has Xcode 16.2, which cannot close the Expo SDK 57
iOS native-build gate. Homebrew OpenJDK 17, Android SDK/API 36 and NDK
27.1.12297006 are now installed. An isolated generated Expo/Gradle project has
compiled and packaged the `loc8-mesh` Android module as a debug AAR, but no full
app APK/AAB has been installed or exercised on a phone. Do not treat the macOS
Swift harness, Android module AAR or generated-project compile as an iOS app
build, complete Android app build, installation or radio result.

## 2. Freeze metadata and build one labelled client

Copy `run-metadata.template.json` into the approved evidence location. Replace
every `REPLACE`, all zero geometry values and every false authority/storage
field with observed facts. Record the exact 40-character commit. Do not edit
the frozen block matrix.

From a clean canonical checkout:

```sh
npm ci
npx expo-doctor
EXPO_PUBLIC_TRANSPORT=ble EXPO_PUBLIC_MESH_FIELD_KIT=1 npx expo run:ios --device
```

Install that same native development build on A, B and C. Native changes and
the FileSystem/Sharing modules require a rebuilt development client; a Metro
reload or Expo Go is insufficient. Record each device model, OS build, native
build ID, start battery and granted permissions in metadata.

Open `loc8://mesh-field` on each phone. Confirm the screen says `RESEARCH BUILD
· PHYSICAL EVIDENCE`. The field route uses the BLE transport only. Record and
hold the state of Wi-Fi, cellular, Airplane mode and any development IP bridge
constant across all blocks; none may carry Loc8 frames. Leave Bluetooth in the
state declared for each block. Keep each app foreground and screen on
throughout a block.

## 3. Evidence handling

Each participating phone produces one JSONL file per block. The screen names it:

```text
<runId>__<blockId>__<role>.jsonl
```

After `Stop + freeze snapshot`:

1. check overflow is zero;
2. use `Share JSONL file` and choose only the approved transfer/storage target;
3. verify the exact file is present in encrypted storage;
4. record its SHA-256 outside the app; and
5. only then tap `Confirm secured + SHA-256 recorded`.

The confirmation deletes the transient cache file and unlocks the next block.
The OS share sheet closing is not proof that a file was saved. Do not use
Universal Clipboard, email, consumer messaging or an unapproved cloud drive.

After every export on macOS/Linux:

```sh
shasum -a 256 path/to/export.jsonl
```

Append the filename/hash to the run's `SHA256SUMS`; never overwrite an earlier
hash. Hash the metadata, clock result, manifest and evaluator results too.

## 4. Frozen block order

For every participating device, choose the same run ID, cohort ID, block and
role, then start diagnostics before the source sends.

| Order | Block | Active phones | Source | Attempts |
|---:|---|---|---|---:|
| 1 | `near-a-b` | A, B | A | 10 |
| 2 | `near-b-a` | A, B | B | 10 |
| 3 | `near-b-c` | B, C | B | 10 |
| 4 | `near-c-b` | B, C | C | 10 |
| 5 | `near-a-c` | A, C | A | 10 |
| 6 | `near-c-a` | A, C | C | 10 |
| 7 | `isolation-pre-a-c` | A, C; B disabled | A | 50 |
| 8 | `isolation-pre-c-a` | A, C; B disabled | C | 50 |
| 9 | `relay-a-c-1` | A, B, C | A | 100 |
| 10 | `relay-c-a-1` | A, B, C | C | 100 |
| 11 | `relay-a-c-2` | A, B, C | A | 100 |
| 12 | `relay-c-a-2` | A, B, C | C | 100 |
| 13 | `isolation-post-a-c` | A, C; B disabled | A | 50 |
| 14 | `isolation-post-c-a` | A, C; B disabled | C | 50 |

Only the source taps `Send attempts`. Observers must never originate. Wait at
least 10 seconds after the final submission before every participating phone
stops and exports. Stop/restart all participating mesh instances between blocks.

## 5. Near controls and measured clock gate

Place each pair near in turn. Require 10/10 exact-once delivery in both
directions. Once all six near blocks are secured, derive relative monotonic
clock bounds:

```sh
node docs/research/rnd/prototypes/mesh-field-kit/derive-clock-sync.mjs \
  path/to/near-exports/*.jsonl > path/to/clock-sync.json
```

The method uses the fact that radio transit time is non-negative. Bidirectional
samples bound each device's clock offset relative to relay B; A/C provides an
independent consistency check. The gate is conservative: the sum of the two
endpoint uncertainties must be at most 100 ms for every device pair, rather
than merely requiring each phone to be below 100 ms. Continue only if both are
true:

```text
nearControlsPass: true
within100msGate: true
```

This is measured evidence; “automatic date and time enabled” is not a clock
uncertainty measurement.

## 6. Bracketed isolation and relay

Keep A and C in fixed, measured positions for the rest of the run.

For pre-isolation, stop the app/mesh on B and disable B Bluetooth. Observe A and
C for at least 60 seconds with zero link count, then run both 50-attempt blocks.
Any A/C `link-up` or application delivery makes the later relay evidence
`CONFOUNDED`; a software recipient filter or deleted event is not isolation.

For each relay block, enable B in its fixed measured position and start A/B/C.
Wait until A-B and B-C are live. Do not move phones or barriers. Source A or C
sends 100 attempts at one/second. The B recorder must show ingress plus exactly
one `relay-forwarded` event with TTL 7→6 or lower for every counted destination
delivery.

After both independent blocks in each direction, disable B again without moving
A/C and repeat the two post-isolation controls. Any new A/C link/delivery is
`CONFOUNDED` even if relay delivery looked good.

## 7. Create manifest, verify hashes and evaluate twice

Update `overflowCounts` from every phone. Any non-zero count is fatal. Generate
the final manifest only after the near/clock gate passed:

```sh
node docs/research/rnd/prototypes/mesh-field-kit/create-physical-manifest.mjs \
  path/to/run-metadata.json path/to/clock-sync.json > path/to/manifest.json
```

Verify the raw hashes before interpretation:

```sh
shasum -a 256 -c path/to/SHA256SUMS
```

With zsh, evaluate the same sorted event set twice:

```sh
event_files=(path/to/exports/*.jsonl)
node docs/research/rnd/prototypes/mesh-field-kit/evaluate.mjs \
  path/to/manifest.json $event_files > path/to/result-1.json
node docs/research/rnd/prototypes/mesh-field-kit/evaluate.mjs \
  path/to/manifest.json $event_files > path/to/result-2.json
cmp path/to/result-1.json path/to/result-2.json
shasum -a 256 path/to/result-1.json path/to/result-2.json
```

Do not edit the raw exports to make validation pass.

## 8. Decision

- `GO`: each direction has at least 190/200 deliveries within 10 seconds; every
  counted delivery has exact A/C origin → B ingress → one B forward with TTL
  decrement → destination ingress/delivery proof; no application duplicates;
  all near/isolation/clock/integrity gates pass.
- `LIMITED`: isolation/path proof is real but at least one direction misses the
  95% gate.
- `NO-GO`: near controls fail, duplicates/loops occur, path/TTL proof fails, or
  no useful bidirectional relay is observed.
- `CONFOUNDED`: A/C isolation or fixed geometry/build/cohort integrity fails.
- `INCOMPLETE`: attempts, exports, diagnostic boundaries, clocks or other
  required evidence are missing/invalid.

Even `GO` promotes only the foreground static three-phone cohort. It does not
promote Android by inference, background behavior, capacity, range, battery,
security, buildings, safety or pilot readiness.
