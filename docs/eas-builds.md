# EAS Builds — getting Loc8 onto real phones

**Why this document exists.** Expo Go on the App Store is stuck behind Apple's
review and doesn't support SDK 57, so scanning the dev-server QR from a real
iPhone fails with "project is incompatible". More importantly, Expo Go could
never run our real BLE mesh anyway — `modules/loc8-mesh` is a custom native
module, and Expo Go only ships the stock modules. The permanent answer for
running Loc8 on physical devices is a **development build**: your own app
binary with SDK 57 + our native modules baked in, which then connects to the
Metro dev server and hot-reloads exactly like Expo Go.

EAS Build is Expo's cloud build service: it produces those binaries without a
local Xcode/Android Studio setup and hands you an install link/QR.

---

## What's already in the repo

| Piece | State |
| --- | --- |
| `eas.json` (repo root, Consumer app) | ✅ `development` + `preview` profiles (see below) |
| Consumer EAS project | ✅ linked — `projectId 750f451d-d5c9-42f5-8957-83415f526de3`, slug `loc8` |
| `apps/guard/eas.json` | ✅ added alongside this doc (same two profiles) |
| Guard EAS project | ❌ not linked yet — run `eas init` once in `apps/guard` (step 3) |
| `apps/command` | Not applicable — it's a Vite **web** app; deploy it as a website, no EAS |

The two build profiles (identical for both apps):

- **`development`** — a dev client (`developmentClient: true`): installs like a
  normal app, but opens your Metro server and hot-reloads. This is the Expo Go
  replacement. Internal distribution; Android builds an installable APK.
- **`preview`** — a release-style internal build with
  `EXPO_PUBLIC_TRANSPORT=ble` baked in: the "hand it to a colleague, real mesh
  on" build for field testing.

---

## One-time setup (10 minutes)

1. **Expo account** (free): <https://expo.dev/signup>.
2. **EAS CLI**:
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. **Apple — read this table before spending money:**

   | Goal | What you need |
   | --- | --- |
   | iOS **device** build via EAS cloud | **Apple Developer Program ($99/yr)** — internal (ad-hoc) distribution requires it, no way around |
   | iOS build, **free** | Build locally over a cable instead: `npx expo run:ios --device` (free Apple ID, Xcode signs it) |
   | iOS **Simulator** build via EAS | Free (add a simulator profile, see Appendix) |
   | **Android** device build via EAS | Free — the profiles output an APK you install directly |

   If you don't want the $99 yet: Android via EAS is free, and iOS works today
   via the cable build. The rest of this doc assumes the EAS cloud path.

---

## Consumer app (repo root)

Already linked — just build:

```bash
# from the repo root
eas build --profile development --platform ios      # or: --platform android
```

First iOS run will walk you through Apple sign-in and credentials — accept the
defaults and let EAS manage signing (it stores certs/profiles for you).

## Guard app (`apps/guard`)

One-time link, then build — **always run EAS commands from `apps/guard`**:

```bash
cd apps/guard
eas init                       # creates the EAS project, writes projectId into app.json — commit that change
```

Register your iPhone (once per device — EAS gives you a link/QR that installs
a provisioning profile and captures the UDID):

```bash
eas device:create
```

Build the dev client:

```bash
eas build --profile development --platform ios     # ~10–20 min in the cloud
# Android instead:  eas build --profile development --platform android
```

When it finishes, EAS prints an install link + QR. Open it on the phone,
install, and iOS users then trust the profile under
**Settings → General → VPN & Device Management** (internal distribution).

### Daily workflow after that

```bash
cd apps/guard
npx expo start --dev-client                          # simulated transport (design loop)
EXPO_PUBLIC_TRANSPORT=ble npx expo start --dev-client   # real BLE mesh
```

Open the **Loc8 Guard dev** app on the phone → it finds the server on your
Wi-Fi (or scan the QR) → JS hot-reloads on save. **You only rebuild with EAS
when native things change** — adding/upgrading a native module (e.g.
`expo-sensors`, `loc8-mesh`), or editing `app.json` plugins/permissions. Pure
TS/JS/UI work never needs a rebuild.

> **Env gotcha:** `EXPO_PUBLIC_*` vars are baked in **at JS-bundle time**. With
> a dev client that means: set them when you **start Metro** (as above), not at
> build time. Only release-style builds (the `preview` profile) bake them in at
> build time — which is why that profile carries `EXPO_PUBLIC_TRANSPORT=ble`.

### Field-test build (release-style, mesh on)

```bash
cd apps/guard
eas build --profile preview --platform ios          # and/or android
```

Installable via link/QR on registered devices; runs standalone (no Metro),
BLE mesh enabled. This is what you hand to stewards for a venue trial.

---

## Monorepo notes (why this Just Works)

- EAS uploads the **whole workspace** (it detects npm workspaces from the app
  directory), so `@loc8/engine` and the root lockfile ride along. Run commands
  from the **app's directory** so EAS picks the right `app.json`/`eas.json`.
- `apps/guard/metro.config.js` already handles workspace resolution
  (watchFolders + nodeModulesPaths + disableHierarchicalLookup) — nothing to do.
- Both apps must keep **distinct slugs/bundle ids** (they do: `loc8` /
  `com.emotiveimpact.loc8` vs `loc8-guard` / `com.emotiveimpact.loc8guard`) so
  they're separate apps on the phone and separate EAS projects.

## Troubleshooting

- **"Project is incompatible with this version of Expo Go"** — you're back in
  Expo Go. Open the **dev client** app instead; this whole doc exists so you
  never see that error again.
- **Build fails resolving `@loc8/engine`** — you ran `eas build` from the repo
  root with Guard's config, or from outside the workspace. `cd apps/guard`.
- **New native dependency crashes at runtime with "native module not found"** —
  the installed dev client predates the dependency. Re-run the EAS build.
- **iOS install blocked ("Untrusted Developer")** — Settings → General → VPN &
  Device Management → trust the profile.
- **Device not offered the build** — its UDID isn't registered; run
  `eas device:create` again with that phone, then rebuild (ad-hoc profiles
  embed the device list at build time).

## Appendix

**Free iOS Simulator builds** — add to the `build` section of either `eas.json`:

```json
"ios-simulator": {
  "developmentClient": true,
  "ios": { "simulator": true }
}
```

**`eas go` (optional)** — builds you a personal copy of Expo Go for the current
SDK, delivered via TestFlight. Also requires the Apple Developer Program, and
still can't load `loc8-mesh`; the dev client above is strictly better for us.
