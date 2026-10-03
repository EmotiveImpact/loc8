'use strict';
// Hash verification restores confidence in a recorded run; it does not rerun
// Jest, native code or radio tests. --rerun additionally repeats the model.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const directory = path.join(root, 'docs/research/rnd/results/evidence/2026-10-03-ble-density');
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const receipt = JSON.parse(fs.readFileSync(path.join(directory, 'verification-manifest.json')));
assert.equal(receipt.schema, 'loc8.ble-density-verification.v1');
for (const row of [...receipt.sources, ...receipt.artifacts]) {
  const file = path.resolve(root, row.path);
  assert.ok(file.startsWith(root + path.sep), 'receipt path outside repository');
  const data = fs.readFileSync(file);
  assert.equal(sha256(data), row.sha256, `Recorded evidence/source drift: ${row.path}`);
  if (row.bytes !== undefined) assert.equal(data.length, row.bytes, row.path);
}
console.log(`Verified ${receipt.sources.length} source hashes and ${receipt.artifacts.length} recorded artifacts.`);
const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 1 && args[0] === '--rerun'), 'usage: node tools/mesh-rnd/verify-relay-evidence.cjs [--rerun]');
if (args[0] === '--rerun') {
  const { benchmarkRelay, writeArtifacts } = require('./benchmark-relay.cjs');
  const recorded = JSON.parse(fs.readFileSync(path.join(directory, 'relay-manifest.json')));
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'loc8-relay-repeat-'));
  try {
    const repeated = writeArtifacts(benchmarkRelay(recorded.matrix), temporary);
    assert.deepEqual(repeated.artifacts, recorded.artifacts, 'Deterministic benchmark artifacts changed');
    console.log(`Repeated ${recorded.runs} synthetic runs; all benchmark artifact hashes match.`);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
} else {
  console.log('Recorded evidence only. Use --rerun to repeat the deterministic benchmark.');
}
