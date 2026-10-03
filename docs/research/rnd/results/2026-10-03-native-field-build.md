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
cold-start into that screen without creating a crew or starting normal producers.
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
