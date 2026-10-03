# Native field-build continuation

Date: 3 October 2026. Current development line: draft PR #5,
`rnd/ble-density-2026-10-03`. Start with [BUILD.md](../../../../BUILD.md),
[RESEARCH.md](../../../../RESEARCH.md), [FIELD-TEST.md](../../../../FIELD-TEST.md)
and the [master programme](../../../../LOC8_MASTER_PLAN.md).

## Reconciliation and resulting build path

Live PR #5 was inspected at `d796e843f390fcf2ff38ae1b61d760811856a91b`.
Main remained `f6b09a4`; PRs #1/#3/#4, tracker #2 and the archive/current-build
pointers were preserved. Separate local checkouts and ignored generated native
folders are used. The mixed `loc8-build` folder was left intact after detecting
the other build chat's concurrent edits.

The other chat published the queue continuation as draft PR #6. Its exact
CI-verified commit `e18b999026e493c816ead39a0b6f1d06169b201c` is retained as
an ancestor of this combined field line, including its 82-source/six-log receipt.
[Actions 37096124358](https://github.com/EmotiveImpact/loc8/actions/runs/37096124358)
passed 34 actual iOS host checks, Simulator source typecheck and the wider
software chain. Those were host/source checks, not an Expo iOS app build.

This continuation adds public/Guard current/branch internal build identities,
bundled Release build commands, explicit EAS profiles, Guard local-module
autolinking, and a shared narrowly gated synthetic field screen. Internal builds
cold-start into that screen. SDK 57 `Stack.Protected` excludes ordinary
screens in internal builds before they can mount and start mesh/location
producers; ordinary notification/deep-link handlers are also gated there.
A redirect alone would leave a producer-start race.
Ordinary releases keep the field route disabled; other `__DEV__` protections
remain. `expo-dev-client` was not added: a compiled native app is required, while
its debug launcher library is optional for this bundled field path.

The SDK 57 patch alignment is a necessary build repair: Doctor identified the
known Hermes regression in Expo 57.0.8 / RN 0.86.0. Both native apps now use the
published Expo 57.0.26 dependency map and RN 0.86.3. The required matching
`@react-native/jest-preset` peer is explicit in dev dependencies; exact lock
resolution and `npm ci --dry-run` pass without force or legacy peer flags. Worklets stays at the
previously justified 0.10.2. Guard's stale nested native lock entries are removed. A fresh CI install then
exposed `expo-sensors` as an undeclared root dependency used by the shared
engine; it is now explicitly declared by both native apps. The obsolete manual
Metro monorepo overrides are replaced with SDK 57 defaults. The Android runner
installs supported platform-tools rather than the removed SDK `tools` package.
Sources: [SDK 57](https://docs.expo.dev/versions/v57.0.0/) and
[known regressions](https://expo.dev/changelog/sdk-57#known-regressions).

No upstream relay implementation was copied. Payload 25/frame 47, native GATT and
advertising, TTL counting semantics, current default, original benchmark gates
and public zero-required-infrastructure boundary remain. The integrated queue
expiry/capacity change affects congested iOS behavior in both modes; original
static density results remain historical and must not attest it by inference.

## Exact local evidence and limits

| Observation | Evidence boundary |
|---|---|
| Default Node 22.12.0 / npm 10.9.8 | Shell default is below SDK 57's Node 22.13 minimum. Cached Node 22.23.2 is used and pinned in `.nvmrc`. |
| macOS 14.5 / Xcode 16.2 (16C5032a) | iOS Expo build is blocked below Xcode 26.4. No target/SDK downgrade was attempted. Xcode 27 additionally needs scene support and is explicitly held by the builder. |
| Signing/device inventory | Permitted inventory found an Apple Development identity and a Developer ID identity, but no connected iOS/Android phones and no available Simulator runtimes. Device provisioning/team access was not established. Earlier sandbox-only inventory failed and is superseded by the permitted query. |
| Android tools | Android Studio GUI absent; Homebrew JDK 17.0.20 exists outside java_home discovery. Explicit JAVA_HOME works. SDK/API 36, Build Tools 35.0.0, NDK 27.1.12297006 and platform-tools 37 are installed. |
| Disk | About 1.2 GiB at initial inspection; later fell below 200 MiB. The Android builder stopped before Gradle under its 8 GiB reserve. No user/cache data from other sessions was deleted. |
| Expo/EAS | Installed Expo 57.0.8 and EAS 16.9.0 were inspected; EAS reports 23.2.0 available. The final declared SDK patch set requires fresh CI/clone installation, not mutation of another checkout's node_modules. |
| Pre-patch local software chain | 342 scoped, 490 Jest, 100 frozen field checks, root/Guard TypeScript and lint passed with the reused prior install. This does not attest the new SDK lockfile. |
| Native queue recheck | 34 actual host tests and iOS 18.2 Simulator source typecheck passed after granting access to the existing compiler cache. BLE never started; Expo module/pods were not built. |
| Four Android prebuild/autolink variants | Public/Guard × current/branch passed on the earlier install, including Loc8Mesh/FileSystem/Sharing. Generated project is not an APK. |
| JS and Command baseline | Public Android Hermes JS export passed; Command production build passed using Vite's runner config loader to avoid writing through the shared dependency symlink. Default loader's EPERM is retained. These are baseline bundler checks; final SDK builds require CI. |
| Doctor before alignment | 19/21 failed: Hermes memory regression and 28 patch mismatches. Exact failure log retained. Physical operation requires all checks after a fresh final install. |

The build workflow attempts actual Android module/app Release compilation and
retains APKs plus logs/receipts when successful. Only an APK with embedded JS is
accepted by the builder. Workflow artifacts expire after 14 days; durable source,
receipt hashes, exact build status and limitations belong in Git and PR/tracker
updates. A successful build still leaves installation, offline cold start,
actual native mode, RF, background and battery unverified.

[The current receipt](evidence/2026-10-03-native-field-build/manifest.json) binds
this combined tree and local logs. The branch verifier checks original branch,
reattachment and egress source receipts against `f7a600b`, `cee77cd` and
`e18b999` respectively, then checks the field continuation against current files.
Only the new install lock and integrity verifier are allowed to continue with
new hashes; simulation/benchmark sources and historical artifacts stay strictly
checked. Local V1 and V2 reruns each reproduced all 5,400 recorded synthetic
runs and exact result artifacts. Hash validation is not native execution.
CI result receipts added later identify
their own exact source commit and stages.

Fresh rerun [37100340422](https://github.com/EmotiveImpact/loc8/actions/runs/37100340422)
at receipt head `c834bb7` exposed a host metadata difference: V1 JSON/CSV and
gzip size matched, while gzip header byte 9 was 19 on macOS and 3 on Linux.
Changing only that byte in the retained archive reproduces the exact Linux
SHA-256 from the failure. See [RFC 1952 section 2.3.1](https://www.rfc-editor.org/rfc/rfc1952.html)
and [zlib's platform codes](https://github.com/madler/zlib/blob/v1.3.1/zutil.h).
The historical archive and its receipt remain unchanged. The repeat verifier
now allows only that observed 19/3 header difference: it checks each original
and regenerated receipt hash, names, lengths, every other compressed byte,
trailer and decompressed content. Six regression checks reject payload/result,
other header, receipt, artifact-list and path-boundary drift. Frozen model
sources and all historical artifact hashes are still strictly checked. The
failed CI log/status and byte-level proof are retained under `ci-c834bb7/`.
This changes verification only; APK/native/application source remains `26b5cf2`.

## Next physical step

Install the same labelled build on A/B/C, stop all other variants, disable Metro
and network transports, prove disconnected cold start, then record actual native
current or branch selection. Execute the unchanged 14-block MESH-01 runbook with
B-absent controls and distinct mode run IDs. Additional duplicate/branch,
density, asymmetric-loss, churn/load and MESH-02/MESH-03 E02 screen-off/low-power/
restart/battery cohorts retain separate methods and gates. The foreground JS
source loop's guard remains; background-source testing needs a separate producer
method. No physical observations have been invented. Main is not merged and no
store release, deployment or publication was performed.

## Recorded first CI attempt

At `deb46e59701e65321e857422318f4bd9f34324bb`, exact `npm ci`, 342 scoped
checks, the frozen 100 checks, source receipts, lint and the native iOS host job
passed. Root Doctor passed 21/21. Jest and root/Guard TypeScript exposed the
missing root sensor dependency; Guard Doctor failed its old hierarchical-lookup
override. All four Android jobs stopped in runner setup at the removed SDK
`tools` package, before dependency install or native compilation. No APK was
produced. These failures are retained in the continuation evidence directory;
the follow-up must earn a fresh complete CI/build pass.

## Fresh final-source software verification

[Actions 37098530069](https://github.com/EmotiveImpact/loc8/actions/runs/37098530069)
is green for source `26b5cf24228576de7defaa4b0e81e01476594bf1`: exact `npm ci`,
342 scoped checks, 100 frozen field checks, the full layered source verifier,
490 Jest tests in 36 suites, root and Guard TypeScript, lint, public/Guard
Doctor 21/21 each and the Command production build. The separate native job
passes 34 actual iOS host checks and the iOS 18.5 Simulator source typecheck.
It does not compile an Expo iOS application or exercise Bluetooth. Complete
software logs and job status are retained under `ci-26b5cf2/` in the receipt.

Command also rendered locally at `http://127.0.0.1:4173/`; its existing Live Site
screen explicitly says SCRIPTED DEMO. This preview uses a prior installed
local bundle; the final dependency installation/build is separately verified
in the green CI above. No connected provider or phone claim follows.

## Public Android native results

[Native run 37098530051](https://github.com/EmotiveImpact/loc8/actions/runs/37098530051)
built both public variants from clean source `26b5cf24228576de7defaa4b0e81e01476594bf1`.
Gradle passed actual `:loc8-mesh:assembleRelease` and `:app:assembleRelease` for
each. The recorded SDK 57 defaults are Build Tools 36.0.0, min SDK 24, compile/
target SDK 36, NDK 27.1.12297006 and Kotlin 2.1.20. The earlier CI bootstrap also
installs Build Tools 35.0.0; Gradle correctly selects its supported 36.0.0 default.

Both downloaded archives match GitHub's SHA-256 digest. Their APKs each contain
59,129,144 bytes; internal APK hashes match the builder receipts. Independent
`aapt` checks confirm separate current/branch package identities, API 24 minimum
and API 36 target; APK content checks confirm arm64-v8a only and nonempty embedded
JS. `apksigner verify` passes with the generated Android Debug certificate
`fac61745dc0903786fb9ede62a962b399f7348f0bb6f899b8332667591033b9c`.

| Public mode | APK SHA-256 | Download |
|---|---|---|
| current | `0567ad3e5cfbd8c231015d2f687ce8191f59245162b236063e0294aca4ae0a99` | [Artifact 11264684561](https://github.com/EmotiveImpact/loc8/actions/runs/37098530051/artifacts/11264684561) |
| branch | `7bcca74c416dc9cd701740e50de099f54156a2d6a366c61e4707a1199b466b4e` | [Artifact 11264799379](https://github.com/EmotiveImpact/loc8/actions/runs/37098530051/artifacts/11264799379) |

Artifacts expire 17 October 2026. Complete build/autolink/contents/install logs,
original builder receipts and independent signature/package review receipts
are durably compressed under `android-26b5cf2/`. These prove a signed installable
package with embedded JS; no phone installation or offline launch has occurred.

## Guard Android native results and final boundary

The same native run is fully green for all four variants. Both Guard variants
passed real module/app Release compilation, archive/APK hash checks, separate
Guard package IDs, nonempty embedded JS, arm64-v8a inspection and independent
Android signature verification with the same internal debug certificate.

| Guard mode | APK bytes | APK SHA-256 | Download |
|---|---|---|---|
| branch | 46,875,338 | `5757bad5e8ac9f6f5ed7b44b3dfd07b7bcf7c6f132c4a86f7803f286f8b57255` | [Artifact 11266045099](https://github.com/EmotiveImpact/loc8/actions/runs/37098530051/artifacts/11266045099) |
| current | 46,875,342 | `c7d50e43d2c3d96ea660a0dcbe750ed5af97c9f6e578cb98143456b13de04a08` | [Artifact 11265423935](https://github.com/EmotiveImpact/loc8/actions/runs/37098530051/artifacts/11265423935) |

The APK source is exactly `26b5cf24228576de7defaa4b0e81e01476594bf1`; later
receipt/docs/verification-workflow commits retain that source identity rather
than relabelling these binaries. A public current APK is also retained locally
in the ignored build artifact folder. Guard binary downloads were removed after
review to respect the workstation's disk limit; all four binaries remain in
the linked Actions artifacts until 17 October 2026. Build/install commands and
source, receipts, compressed logs, hashes and limitations remain in Git.

Next required work is physical installation and disconnected cold start on
A/B/C, observed native mode, the frozen MESH-01 controls/gates, and separately
registered extra cohorts. There have been zero phone attempts. No iOS Expo app
was built on the unsupported Xcode, and no physical outcome is inferred from
Android compilation, bundled JS, signatures or software checks.
