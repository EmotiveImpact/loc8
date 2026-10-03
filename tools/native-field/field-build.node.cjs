'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { withFieldBuild } = require('./field-config.cjs');
const { createLoader } = require('../mesh-rnd/source-test-loader.cjs');
const { meshFieldAccess } = createLoader()('src/research/meshFieldAccess.ts');
const commit = 'a'.repeat(40);
const base = { name: 'Loc8', ios: { bundleIdentifier: 'com.emotiveimpact.loc8' }, android: { package: 'com.emotiveimpact.loc8' }, extra: { eas: { projectId: 'retained' } } };
const env = mode => ({ LOC8_INTERNAL_FIELD_TEST: '1', LOC8_BUILD_COMMIT: commit, EXPO_PUBLIC_TRANSPORT: 'ble', EXPO_PUBLIC_MESH_FIELD_KIT: '1', EXPO_PUBLIC_MESH_RELAY_MODE: mode });
test('ordinary config and production gate stay closed even with public field flags', () => {
  const flags = { ...env('branch'), LOC8_INTERNAL_FIELD_TEST: undefined };
  assert.equal(withFieldBuild(base, 'public', flags), base);
  assert.deepEqual(meshFieldAccess({ development: false, kit: '1', transport: 'ble', mode: 'branch', marker: undefined, applicationId: base.android.package }), { enabled: false, internal: false, commit: null });
});
test('native debug gate retains all existing opt-ins', () => {
  for (const kit of [undefined, '0', '1']) for (const transport of [undefined, 'sim', 'ble']) {
    assert.equal(meshFieldAccess({ development: true, kit, transport }).enabled, kit === '1' && transport === 'ble');
  }
});
for (const app of ['public', 'guard']) for (const mode of ['current', 'branch']) {
  test(`${app}/${mode} has a separate identity and opens only its matching offline gate`, () => {
    const config = withFieldBuild(base, app, env(mode));
    assert.notEqual(config.android.package, base.android.package);
    assert.equal(config.ios.bundleIdentifier, config.android.package);
    assert.equal(config.updates.enabled, false);
    assert.equal(config.extra.eas.projectId, 'retained');
    const input = { development: false, kit: '1', transport: 'ble', mode, marker: config.extra.loc8FieldBuild, applicationId: config.android.package };
    assert.deepEqual(meshFieldAccess(input), { enabled: true, internal: true, commit });
    for (const patch of [{ kit: '0' }, { transport: 'ws' }, { mode: 'invalid' }, { applicationId: base.android.package }, { marker: { ...input.marker, commit: 'short' } }, { marker: { ...input.marker, mode: mode === 'current' ? 'branch' : 'current' } }]) {
      assert.equal(meshFieldAccess({ ...input, ...patch }).enabled, false);
    }
    assert.equal(base.extra.loc8FieldBuild, undefined);
  });
}
test('internal build fails closed for an invalid transport, kit or relay mode', () => {
  for (const patch of [{ EXPO_PUBLIC_TRANSPORT: 'sim' }, { EXPO_PUBLIC_MESH_FIELD_KIT: '0' }, { EXPO_PUBLIC_MESH_RELAY_MODE: 'brnach' }]) {
    assert.throws(() => withFieldBuild(base, 'public', { ...env('current'), ...patch }), /Internal field builds require/);
  }
});
