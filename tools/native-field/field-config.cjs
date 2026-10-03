'use strict';
const { execFileSync } = require('node:child_process');
const path = require('node:path');

// The private build selector changes the native identity. Public JS flags alone
// cannot turn an ordinary release into an internal field build.
function withFieldBuild(config, app, env = process.env) {
  if (env.LOC8_INTERNAL_FIELD_TEST !== '1') return config;
  if (!['public', 'guard'].includes(app)) throw new Error('Unknown field app');
  const mode = env.EXPO_PUBLIC_MESH_RELAY_MODE ?? 'current';
  if (env.EXPO_PUBLIC_TRANSPORT !== 'ble' || env.EXPO_PUBLIC_MESH_FIELD_KIT !== '1' ||
      !['current', 'branch'].includes(mode)) {
    throw new Error('Internal field builds require BLE, field kit 1 and current or branch relay mode');
  }
  let commit = env.LOC8_BUILD_COMMIT || env.EAS_BUILD_GIT_COMMIT_HASH;
  if (!commit) {
    try {
      commit = execFileSync('git', ['rev-parse', 'HEAD'], {
        cwd: path.resolve(__dirname, '../..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch { /* An exported source archive must supply LOC8_BUILD_COMMIT. */ }
  }
  if (!/^[0-9a-f]{40}$/.test(commit ?? '')) throw new Error('Record a full LOC8_BUILD_COMMIT for the field build');
  const id = `${app === 'guard' ? 'com.emotiveimpact.loc8guard' : 'com.emotiveimpact.loc8'}.field.${mode}`;
  return {
    ...config,
    name: `${app === 'guard' ? 'Loc8 Guard' : 'Loc8'} Field (${mode})`,
    scheme: `${app === 'guard' ? 'loc8guard' : 'loc8'}-field-${mode}`,
    ios: { ...config.ios, bundleIdentifier: id },
    android: { ...config.android, package: id },
    updates: { ...config.updates, enabled: false },
    extra: {
      ...config.extra,
      loc8FieldBuild: { schema: 'loc8.internal-field-build.v1', app, mode, commit, applicationId: id },
    },
  };
}
module.exports = { withFieldBuild };
