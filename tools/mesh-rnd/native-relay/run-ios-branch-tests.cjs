#!/usr/bin/env node
'use strict';
// Uses real Apple SDKs and the actual native sources; no CoreBluetooth stubs.
// Host execution does not start BLE. --typecheck-ios checks Simulator sources;
// ExpoModulesCore app/pod integration and phone behavior need their own builds.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');

const args = process.argv.slice(2);
if (args.some(arg => arg !== '--typecheck-ios')) throw new Error('Usage: node run-ios-branch-tests.cjs [--typecheck-ios]');
const root = path.resolve(__dirname, '../../..');
const native = path.join(root, 'modules/loc8-mesh/ios');
const files = ['MeshConstants.swift', 'MeshFrameCodec.swift', 'MeshDeduplicator.swift',
  'MeshRelayController.swift', 'MeshDiagnostics.swift', 'MeshPendingRelays.swift', 'MeshService.swift']
  .map(file => path.join(native, file));
const pendingSource = fs.readFileSync(path.join(native, 'MeshPendingRelays.swift'), 'utf8');
assert.match(pendingSource, /Double\(mach_continuous_time\(\)\)/, 'relay age must include device sleep');
assert.doesNotMatch(pendingSource, /ProcessInfo\.processInfo\.systemUptime|mach_absolute_time\(\)/,
  'awake-only uptime cannot enforce relay lifetime through device sleep');
assert.equal((pendingSource.match(/nowUptime: TimeInterval = MeshRelayContinuousClock\.nowSeconds\(\)/g) || []).length, 2,
  'admission and take must use the same default continuous clock');
function run(command, commandArgs, capture = false) {
  const result = spawnSync(command, commandArgs, { cwd: root, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status}): ${result.stderr || ''}`);
  return (result.stdout || '').trim();
}
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'loc8-ios-branch-'));
try {
  const sdk = run('xcrun', ['--sdk', 'macosx', '--show-sdk-path'], true);
  const binary = path.join(temporary, 'ios-branch-tests');
  // Copy actual production bytes unchanged into one temporary compilation unit.
  // The appended, host-only fixture can inspect Swift private state without a
  // shipped setter, CoreBluetooth stubs or starting BLE managers.
  const hostSource = path.join(temporary, 'MeshService-host.swift');
  const combinedNames = ['MeshPendingRelays.swift', 'MeshService.swift'];
  fs.writeFileSync(hostSource, [...combinedNames.map(file => fs.readFileSync(path.join(native, file), 'utf8')),
    fs.readFileSync(path.join(__dirname, 'ios-service-host-access.swift'), 'utf8')].join('\n'));
  const hostFiles = files.filter(file => !combinedNames.includes(path.basename(file))).concat(hostSource);
  console.log('Compiling actual Loc8 native service/helper with host-only private access; BLE never started');
  run('xcrun', ['swiftc', '-swift-version', '5', '-sdk', sdk, ...hostFiles,
    path.join(__dirname, 'ios-branch-tests.swift'), '-o', binary]);
  run(binary, []);
  if (args.includes('--typecheck-ios')) {
    const simulatorSDK = run('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path'], true);
    console.log(`Typechecking actual Loc8 service/helper against iOS Simulator SDK: ${simulatorSDK}`);
    run('xcrun', ['swiftc', '-swift-version', '5', '-typecheck', '-target', 'arm64-apple-ios15.1-simulator',
      '-sdk', simulatorSDK, ...files]);
    console.log('iOS Simulator source typecheck passed (Expo module/pods and hardware not exercised)');
  }
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
