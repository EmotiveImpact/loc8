'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const { createLoader } = require('./source-test-loader.cjs');

function fixture(native = {}) {
  let resolutions = 0;
  const api = createLoader({
    'expo-modules-core': { requireNativeModule(name) {
      assert.equal(name, 'Loc8Mesh');
      resolutions++;
      return native;
    } },
  })('modules/loc8-mesh/index.ts');
  return { api, resolutions: () => resolutions };
}

test('relay API imports lazily and rejects unknown input before accessing a native runtime', async () => {
  const { api, resolutions } = fixture();
  assert.equal(resolutions(), 0);
  await assert.rejects(api.configureRelayMode('brnach'), /Unknown native relay mode/);
  assert.equal(resolutions(), 0);
});

test('configuration resolves only after native acceptance and uses the selected native mode', async () => {
  let accept;
  const calls = [];
  const { api, resolutions } = fixture({ configureRelayMode(mode) {
    calls.push(mode);
    return new Promise(resolve => { accept = resolve; });
  } });
  let settled = false;
  const selected = api.configureRelayMode('branch').then(mode => { settled = true; return mode; });
  await Promise.resolve();
  assert.equal(settled, false);
  assert.deepEqual(calls, ['branch']);
  accept('branch');
  assert.equal(await selected, 'branch');
  assert.equal(resolutions(), 1);
});

test('active native configuration failure reaches caller without masking it', async () => {
  const { api } = fixture({ configureRelayMode() { return Promise.reject(new Error('Stop mesh first')); } });
  await assert.rejects(api.configureRelayMode('branch'), /Stop mesh first/);
});

test('actual native mode is queried rather than inferred from environment', async () => {
  let mode = 'current';
  const { api } = fixture({ getRelayMode: async () => mode });
  assert.equal(await api.getRelayMode(), 'current');
  mode = 'branch';
  assert.equal(await api.getRelayMode(), 'branch');
});

test('unsupported native selections are surfaced by both configuration and receipt reads', async () => {
  const { api } = fixture({ configureRelayMode: async () => 'other', getRelayMode: async () => 'other' });
  await assert.rejects(api.configureRelayMode('current'), /Unknown native relay mode/);
  await assert.rejects(api.getRelayMode(), /Unknown native relay mode/);
});

test('an older native binary requires a rebuild rather than silently claiming the mode is active', async () => {
  const { api } = fixture({});
  await assert.rejects(api.configureRelayMode('branch'), /Rebuild the native development client/);
  await assert.rejects(api.getRelayMode(), /Rebuild the native development client/);
});
