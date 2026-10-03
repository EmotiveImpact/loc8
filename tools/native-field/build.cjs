'use strict';
// Build in a separate clone. Generated directories are regenerated only when
// this script created them; tracked/custom native projects are never removed.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync, execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const [app, mode, platform = 'android', option] = process.argv.slice(2);
if (!['public', 'guard'].includes(app) || !['current', 'branch'].includes(mode) ||
    !['android', 'ios'].includes(platform) || (option && option !== '--prebuild-only')) {
  console.error('Usage: npm run build:field -- public|guard current|branch android|ios [--prebuild-only]');
  process.exit(2);
}
const appRoot = app === 'public' ? root : path.join(root, 'apps/guard');
const out = path.join(root, '.native-field-artifacts', `${app}-${mode}-${platform}-${new Date().toISOString().replace(/[:.]/g, '-')}`);
fs.mkdirSync(out, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
const env = {
  ...process.env, NODE_ENV: 'production', CI: '1', EXPO_NO_TELEMETRY: '1',
  LOC8_INTERNAL_FIELD_TEST: '1', LOC8_BUILD_COMMIT: commit,
  EXPO_PUBLIC_TRANSPORT: 'ble', EXPO_PUBLIC_MESH_FIELD_KIT: '1', EXPO_PUBLIC_MESH_RELAY_MODE: mode,
};
const receipt = {
  schema: 'loc8.native-field-build.v1', app, mode, platform, commit,
  startedAt: new Date().toISOString(), node: process.version,
  lockfileSha256: hash(fs.readFileSync(path.join(root, 'package-lock.json'))),
  sourceDirty: Boolean(spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).stdout?.trim()),
  bundledJsRequested: true, bundledJsVerified: false,
  distribution: 'internal-only', phoneAttempts: 0, steps: [], artifacts: [],
};
function save(status, limitation) {
  receipt.status = status;
  receipt.limitation = limitation ?? null;
  receipt.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(out, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(`${status}: ${limitation ?? out}`);
}
function block(reason) { save('blocked', reason); process.exit(1); }
function run(label, executable, args, cwd = appRoot) {
  const log = path.join(out, `${label}.log`);
  const fd = fs.openSync(log, 'w');
  const result = spawnSync(executable, args, { cwd, env, stdio: ['ignore', fd, fd] });
  fs.closeSync(fd);
  receipt.steps.push({ label, command: [executable, ...args], exitCode: result.status, error: result.error?.message ?? null, logSha256: hash(fs.readFileSync(log)) });
  console.log(`${label}: ${result.status === 0 ? 'pass' : 'failed'} (${log})`);
  if (result.status !== 0) {
    console.error(fs.readFileSync(log, 'utf8').split('\n').slice(-50).join('\n'));
    block(`${label} failed; preserve its complete log`);
  }
}
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 13)) block('Expo SDK 57 requires Node >=22.13');
if (platform === 'ios') {
  const version = spawnSync('xcodebuild', ['-version'], { encoding: 'utf8' });
  fs.writeFileSync(path.join(out, 'xcode-version.log'), version.stdout ?? version.error?.message ?? 'unavailable');
  const match = /Xcode (\d+)\.(\d+)/.exec(version.stdout ?? '');
  if (!match || Number(match[1]) < 26 || (Number(match[1]) === 26 && Number(match[2]) < 4)) {
    block('Expo SDK 57 requires Xcode >=26.4; do not lower the SDK or deployment target');
  }
  if (Number(match[1]) >= 27) {
    block('SDK 57 with Xcode 27 requires the documented UIKit scene-support config; this path currently targets Xcode 26.4-26.x');
  }
  if (option !== '--prebuild-only') {
    const identities = spawnSync('security', ['find-identity', '-v', '-p', 'codesigning'], { encoding: 'utf8' });
    fs.writeFileSync(path.join(out, 'signing-identities.log'), identities.stdout ?? 'unavailable');
    if (!/[1-9]\d* valid identities found/.test(identities.stdout ?? '')) block('No valid iOS signing identity is available');
    if (!process.env.LOC8_IOS_DEVICE) block('Set LOC8_IOS_DEVICE to the physical phone UDID; this recorded build does not use an interactive device picker');
  }
}
const native = path.join(appRoot, platform);
const owner = path.join(native, '.loc8-field-generated.json');
if (fs.existsSync(native)) {
  let previous;
  try { previous = JSON.parse(fs.readFileSync(owner, 'utf8')); } catch { /* Fail closed on hand-written native work. */ }
  if (previous?.schema !== 'loc8.field-generated.v1' || previous.app !== app || previous.appRoot !== appRoot) {
    block(`Existing ${platform} directory is not owned by this builder. Use a fresh separate clone.`);
  }
}
const expo = require.resolve('expo/bin/cli');
run('prebuild', process.execPath, [expo, 'prebuild', '--platform', platform, '--no-install', '--clean']);
fs.writeFileSync(owner, JSON.stringify({ schema: 'loc8.field-generated.v1', app, appRoot, mode, commit }) + '\n');
const autolinking = require.resolve('expo/bin/autolinking');
run('autolinking', process.execPath, [autolinking, 'resolve', '--platform', platform === 'ios' ? 'apple' : 'android', '--json']);
const linked = JSON.parse(fs.readFileSync(path.join(out, 'autolinking.log'), 'utf8'));
if (!linked.modules?.some(module => module.packageName === 'loc8-mesh')) block('loc8-mesh is missing from native autolinking');
if (option === '--prebuild-only') { save('prebuild-only', 'No Gradle, pods, app compile, installation or phone test was performed'); process.exit(0); }
const disk = fs.statfsSync(appRoot);
receipt.freeBytesBeforeCompile = disk.bavail * disk.bsize;
if (receipt.freeBytesBeforeCompile < 8 * 1024 ** 3) block('Less than 8 GiB free before native compilation; provision about 25 GiB for a fresh toolchain/build');
if (platform === 'android') {
  run('java', 'java', ['-version']);
  run('gradle', path.join(native, 'gradlew'), [':loc8-mesh:assembleRelease', ':app:assembleRelease', '--no-daemon', '--max-workers', '2', '-PreactNativeArchitectures=arm64-v8a', '-Dorg.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g'], native);
  const apk = path.join(native, 'app/build/outputs/apk/release/app-release.apk');
  if (!fs.existsSync(apk)) block('Gradle did not produce app-release.apk');
  run('apk-contents', 'unzip', ['-Z1', apk]);
  if (!fs.readFileSync(path.join(out, 'apk-contents.log'), 'utf8').split('\n').includes('assets/index.android.bundle')) {
    block('APK has no embedded JavaScript bundle; it cannot qualify for an offline cold start');
  }
  const target = path.join(out, `${app}-${mode}-arm64.apk`);
  fs.copyFileSync(apk, target);
  receipt.bundledJsVerified = true;
  receipt.artifacts.push({ filename: path.basename(target), bytes: fs.statSync(target).size, sha256: hash(fs.readFileSync(target)), abi: 'arm64-v8a', signing: 'generated Expo debug key; internal testing only' });
  save('apk-built', 'Installation and actual native mode/RF/background/battery remain physical-device gates');
  console.log(`APK: ${target}\nInstall: adb install -r "${target}"`);
} else {
  run('ios-device-build', process.execPath, [expo, 'run:ios', '--configuration', 'Release', '--device', process.env.LOC8_IOS_DEVICE, '--no-bundler']);
  save('ios-build-command-passed', 'Record selected physical device, actual mode and installation separately; no IPA was exported by this script');
}
