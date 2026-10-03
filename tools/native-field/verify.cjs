'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, '.native-field-artifacts', `verification-${new Date().toISOString().replace(/[:.]/g, '-')}`);
fs.mkdirSync(out, { recursive: true });
const scoped = fs.readdirSync(path.join(root, 'tools/mesh-rnd')).filter(f => f.startsWith('branch-') && f.endsWith('.node.cjs')).map(f => `tools/mesh-rnd/${f}`);
const checks = [
  ['scoped', process.execPath, ['--test', ...['verify', 'freshness', 'source-location', 'programme', 'relay-policy', 'relay-simulation', 'native-relay-api'].map(f => `tools/mesh-rnd/${f}.node.cjs`), ...scoped, 'tools/native-field/field-build.node.cjs']],
  ['field-contract', process.execPath, ['--test', 'docs/research/rnd/prototypes/mesh-field-kit/mesh-field-kit.test.mjs']],
  ['jest', 'npm', ['test', '--', '--runInBand']],
  ['typescript', process.execPath, [require.resolve('typescript/bin/tsc'), '--noEmit']],
  ['guard-typescript', process.execPath, [require.resolve('typescript/bin/tsc'), '--noEmit', '-p', 'apps/guard/tsconfig.json']],
  ['lint', 'npm', ['run', 'lint']],
  ['branch-integration', process.execPath, ['tools/mesh-rnd/verify-branch-integration.cjs', '--rerun']],
];
let failed = false;
const results = [];
for (const [name, command, args] of checks) {
  const fd = fs.openSync(path.join(out, `${name}.log`), 'w');
  const result = spawnSync(command, args, { cwd: root, env: { ...process.env, CI: '1', EXPO_NO_TELEMETRY: '1' }, stdio: ['ignore', fd, fd] });
  fs.closeSync(fd);
  results.push({ name, exitCode: result.status, error: result.error?.message ?? null });
  console.log(`${name}: ${result.status === 0 ? 'pass' : 'FAIL'}`);
  if (result.status !== 0) { failed = true; console.error(fs.readFileSync(path.join(out, `${name}.log`), 'utf8').split('\n').slice(-35).join('\n')); }
}
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ node: process.version, dependencyInstall: 'Run npm ci separately before this chain', checks: results }, null, 2) + '\n');
console.log(`Full logs: ${out}`);
process.exitCode = failed ? 1 : 0;
