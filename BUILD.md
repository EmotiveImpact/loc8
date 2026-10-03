# Build Loc8, Guard and Command

Use draft [PR #5](https://github.com/EmotiveImpact/loc8/pull/5), branch
`rnd/ble-density-2026-10-03`. This branch includes R0/R1 and the native relay
experiment. You do not need to merge the stacked PRs to build it.

The programme is [LOC8_MASTER_PLAN.md](LOC8_MASTER_PLAN.md); the research entry
point is [RESEARCH.md](RESEARCH.md). Build/verification evidence is retained in
[the field-build handoff](docs/research/rnd/results/2026-10-03-native-field-build.md).
Public Loc8 still requires no server, Gateway or Anchor. `current` remains the
normal relay mode. `branch` is an experiment, not a shipping default.

## Start in a separate checkout

```sh
git clone --branch rnd/ble-density-2026-10-03 https://github.com/EmotiveImpact/loc8.git loc8-field
cd loc8-field
nvm install
nvm use
npm ci
npm run verify:field
```

`.nvmrc` pins Node 22.23.2; Expo 57 needs at least Node 22.13. The verification
command retains scoped relay/freshness/source/programme tests, the frozen field
contract, Jest, root and Guard TypeScript, lint and the branch evidence verifier
with model reruns. Logs go to `.native-field-artifacts/verification-*`.

Android needs JDK 17, SDK/target 36, Build Tools 36.0.0 and NDK 27.1.12297006.
Configure `JAVA_HOME`, `ANDROID_HOME` and SDK licences on your own computer.
For Homebrew Java on an Apple Silicon Mac, for example:

```sh
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
```

Provision about 25 GiB free for a fresh native toolchain/build. The builder
refuses compilation below 8 GiB free. These storage figures are build-operation
budgets, not Expo's official minimum. This iOS path requires **Xcode 26.4–26.x**, compatible
macOS, a supported device and iOS signing. See the exact
[SDK 57 requirements](https://docs.expo.dev/versions/v57.0.0/).

## Public app: offline field APKs

From the repo root:

```sh
npm run build:field -- public current android
npm run build:field -- public branch android
```

Each command generates the native project, checks that `loc8-mesh` is linked,
builds the actual native module and app, and verifies the APK contains its JS
bundle. The output folder contains the APK, complete build logs and a receipt
with commit, lockfile hash, APK SHA-256 and ABI. APKs target **arm64-v8a** phones;
they use the generated Expo debug signing key solely for internal installation.
They are release-mode bundles with `__DEV__` false, not app-store releases.

Install the APK path printed by the builder:

```sh
adb install -r /absolute/path/to/public-current-arm64.apk
adb shell monkey -p com.emotiveimpact.loc8.field.current -c android.intent.category.LAUNCHER 1
```

Use `.field.branch` when installing/opening the branch variant. APK build
success does not prove installation, native mode selection or radio operation.
The [Android build workflow](.github/workflows/native-field-build.yml) runs the
same commands for all four public/Guard × current/branch combinations and
preserves downloadable APKs and diagnostics for 14 days. Inspect the exact
source SHA and receipt before installing a workflow artifact.

All four builds below succeeded at source `26b5cf24228576de7defaa4b0e81e01476594bf1`.
Independent archive/APK hash, native package ID, arm64, embedded-JS and signature
checks passed. These internal artifacts expire **17 October 2026**; rebuild from
the commands above afterwards. Installation and offline launch still need phones.

| App | Current APK and logs | Branch APK and logs |
|---|---|---|
| Public | [Download current](https://github.com/EmotiveImpact/loc8/actions/runs/37098530051/artifacts/11264684561) | [Download branch](https://github.com/EmotiveImpact/loc8/actions/runs/37098530051/artifacts/11264799379) |
| Guard | [Download current](https://github.com/EmotiveImpact/loc8/actions/runs/37098530051/artifacts/11265423935) | [Download branch](https://github.com/EmotiveImpact/loc8/actions/runs/37098530051/artifacts/11266045099) |

Download while signed into GitHub, extract the ZIP, and use its labelled APK.
Full SHA-256 hashes and durable receipts are in the field-build handoff.

Generated `android` directories are ignored. The builder regenerates only a
directory it created and marked as owned; it refuses existing custom native
work. Use a fresh separate clone if you already maintain a hand-written native
project. APKs from earlier modes remain in their timestamped output folders.

## Guard: same native path, separate app

```sh
npm run build:field -- guard current android
npm run build:field -- guard branch android
```

Guard explicitly links `../../modules`. It uses the same frozen synthetic
field screen and recorder as the public app. Its internal app IDs are
`com.emotiveimpact.loc8guard.field.current` and `.field.branch`. Its normal
clock-in gate remains in ordinary releases. The field build starts directly in
the harness and does not clock in, join a crew or start normal location producers.

All four internal builds have distinct names, native IDs and URL schemes.
**Run only one variant per phone** and force-stop the others; an unnoticed extra
relay would invalidate isolation. Current/branch field builds select BLE and
their explicit mode. `LOC8_INTERNAL_FIELD_TEST=1` is the private config selector;
public environment flags alone cannot enable the kit in an ordinary release.
OTA updates are disabled for these dedicated field bundles. In these variants,
SDK 57 protected navigation excludes the ordinary screens before their producers
can mount; a redirect alone is insufficient.

## iOS on a supported Mac

After checking Xcode 26.4–26.x and signing/device availability:

```sh
export LOC8_IOS_DEVICE="your-physical-phone-UDID"
npm run build:field -- public current ios
npm run build:field -- public branch ios
npm run build:field -- guard current ios
npm run build:field -- guard branch ios
```

These invoke Expo's Release device build/install path without a Metro server.
Find the UDID with Xcode's Devices window or `xcrun xctrace list devices`.
Record its native app/build identity and actual mode;
the script does not export a distributable IPA. The local run is blocked on this
workstation's Xcode 16.2; lowering SDK requirements is not a supported repair.
Xcode 27/iOS 27 requires SDK 57's documented opt-in UIKit scene support through
`expo-build-properties`; the builder refuses that combination until its config
and phone launch are validated. See [Expo's Xcode 27 guidance](https://expo.dev/changelog/sdk-57#building-with-xcode-27-and-the-ios-27-sdk).

For internal EAS distribution, `field-current` and `field-branch` profiles exist
in both app folders. For example, on a configured account/toolchain:

```sh
eas build --platform android --profile field-current --local
cd apps/guard
eas build --platform android --profile field-current --local
```

Use `--platform ios` on the supported Mac with the appropriate Apple team and
device provisioning. EAS signing/account setup is separate from source checks;
cloud build requests consume your EAS plan. No submission or store publication
is part of this procedure.

## Normal app development and the dev-client decision

Use a **separate fresh ordinary-app checkout** for this section. The field
builder's generated native projects carry dedicated field identities; Expo
run commands reuse existing native projects and do not automatically replace
those identities. Do not run an ordinary build over a field-generated directory.

For the ordinary public app:

```sh
EXPO_PUBLIC_TRANSPORT=ble EXPO_PUBLIC_MESH_RELAY_MODE=current npm run android
# Or npm run ios on the supported Mac.
```

For ordinary Guard, run the equivalent command from `apps/guard`. These are
native debug builds and use Metro. For a bundled ordinary Android app needed
by separately registered public-session/background cohorts, use the following
from that fresh ordinary checkout (or `apps/guard` for Guard):

```sh
LOC8_INTERNAL_FIELD_TEST=0 EXPO_PUBLIC_MESH_FIELD_KIT=0 \
EXPO_PUBLIC_TRANSPORT=ble EXPO_PUBLIC_MESH_RELAY_MODE=current \
npx expo run:android --variant release --no-bundler
```

This ordinary Release command is a supported build recipe; it is separate from
the four internal field APKs built in this continuation. Use `branch` explicitly
for its own experiment. Record installation, actual mode and producer context.
 The `development` EAS profiles explicitly
build Debug without requesting the absent `expo-dev-client` launcher. `preview`
keeps BLE/current and the synthetic kit disabled. Expo Go cannot run Loc8Mesh.

**`expo-dev-client` is optional for this build path.** Custom native code needs
a compiled native app; it does not require the launcher library. SDK 57 documents
ordinary debug builds separately from debug builds with that library. The
offline field path uses a bundled Release app. If you deliberately choose
`developmentClient: true` and its launcher/debugging UI later, install the
SDK-matched package in each native app with a lockfile review. Merely adding it
would not make a Metro-dependent debug app prove offline cold start.
Sources: [local debug builds](https://docs.expo.dev/guides/local-app-development/),
[SDK 57 DevClient](https://docs.expo.dev/versions/v57.0.0/sdk/dev-client/),
[APK profiles](https://docs.expo.dev/build-reference/apk/),
[separate app variants](https://docs.expo.dev/build-reference/variants/).

Both apps now declare the **Expo 57.0.26 / React Native 0.86.3** patch set from
that Expo package's published dependency map. This repairs the known Hermes
memory/startup regressions. Keep the deliberate worklets 0.10.2 exception;
the older 0.10.0 package was missing required JS files. Run `npx expo-doctor`
after `npm ci` in the root and in `apps/guard`, and require all checks to pass
before a physical run. SDK 57 automatically configures Metro for this npm
workspace; the retired manual resolution overrides have been removed. Both
native apps declare `expo-sensors`, which the shared engine already imports. The old
19/21 Doctor result is retained as a failure receipt, not relabelled as a pass.

## Command: existing web console

```sh
npm run build --workspace @loc8/command
npm run preview --workspace @loc8/command -- --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173`. Command is currently a Vite web app, not a native
phone target. A browser preview does not participate in the GATT mesh. Its
existing bridge/connected lane and provider gates are separate from the public
phone mesh. Do not require that lane to make public Loc8 function.

## First physical step

Follow [FIELD-TEST.md](FIELD-TEST.md). First confirm offline cold start and actual
native mode; then execute the unchanged 14-block MESH-01 procedure on three
phones, with unique current/branch run IDs. No physical results are supplied by
the build scripts or CI.
