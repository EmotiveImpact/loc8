'use strict';
// V1 is a historical adverse result. Native sources have since changed, so
// verify its source hashes against the exact retained application commit.
// Current branch sources are verified by the separate branch-relay receipt.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const snapshot = 'f4436b54ceb1e0efb9762ad7c721c3b826c4fcc6';
const directory = 'docs/research/rnd/results/evidence/2026-10-03-ble-density';
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 1 && args[0] === '--rerun'), 'usage: node tools/mesh-rnd/verify-density-history.cjs [--rerun]');
function local(relative) {
  const file = path.resolve(root, relative);
  assert.ok(file.startsWith(root + path.sep), 'receipt path outside repository');
  return fs.readFileSync(file);
}
function recorded(relative) {
  local(relative); // Validate the path boundary; these files remain available.
  return execFileSync('git', ['show', `${snapshot}:${relative}`], { cwd: root, maxBuffer: 10 * 1024 * 1024 });
}
const manifestPath = directory + '/verification-manifest.json';
const manifest = local(manifestPath);
assert.equal(sha256(manifest), sha256(recorded(manifestPath)), 'Historical receipt changed');
const receipt = JSON.parse(manifest);
assert.equal(receipt.schema, 'loc8.ble-density-verification.v1');
for (const row of receipt.sources) {
  const bytes = recorded(row.path);
  assert.equal(sha256(bytes), row.sha256, `Historical source mismatch: ${row.path}`);
  if (row.bytes !== undefined) assert.equal(bytes.length, row.bytes, row.path);
}
for (const row of receipt.artifacts) {
  const bytes = local(row.path);
  assert.equal(sha256(bytes), row.sha256, `Historical artifact drift: ${row.path}`);
  if (row.bytes !== undefined) assert.equal(bytes.length, row.bytes, row.path);
}
console.log(`V1 historical snapshot ${snapshot}: ${receipt.sources.length} recorded source hashes and ${receipt.artifacts.length} artifacts verified. This does not verify current native code.`);
if (args[0] === '--rerun') {
  const recordedRun = JSON.parse(local(directory + '/relay-manifest.json'));
  // V1 model files remain byte-for-byte unchanged. Refuse a repeat using drifted
  // model code even though its historical source object is still available.
  for (const row of recordedRun.code) assert.equal(sha256(local(row.path)), row.sha256, `Current V1 model source drift: ${row.path}`);
  const { benchmarkRelay, writeArtifacts } = require('./benchmark-relay.cjs');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'loc8-density-history-'));
  try {
    const repeated = writeArtifacts(benchmarkRelay(recordedRun.matrix), temporary);
    assert.deepEqual(repeated.artifacts, recordedRun.artifacts, 'V1 deterministic benchmark artifacts changed');
    console.log(`Repeated ${recordedRun.runs} V1 synthetic runs; all benchmark artifacts match.`);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
}
