'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const { sha256 } = require('./relay-simulation.cjs');
const root = path.resolve(__dirname, '../..');
const directory = path.join(root, 'docs/research/rnd/results/evidence/2026-10-03-branch-relay');
const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'branch-manifest.json')));
assert.equal(manifest.schema, 'loc8.branch-relay-receipt.v2');
const continuedMetadata = new Set();
for (const entry of [...manifest.code, ...manifest.historicalBaseline]) {
  const file = path.resolve(root, entry.path);
  assert.ok(file.startsWith(root + path.sep));
  if (['package-lock.json', 'tools/mesh-rnd/branch-verify.cjs'].includes(entry.path) && fs.existsSync(path.join(root, 'tools/native-field/model-lock.cjs')) &&
      require('../native-field/model-lock.cjs').validateModelLock(entry)) {
    continuedMetadata.add(entry.path);
    continue;
  }
  assert.equal(sha256(fs.readFileSync(file)), entry.sha256, `Source/historical drift: ${entry.path}`);
}
for (const entry of manifest.artifacts) {
  const file = path.resolve(directory, entry.path); assert.ok(file.startsWith(directory + path.sep));
  const data = fs.readFileSync(file);
  assert.equal(data.length, entry.bytes, entry.path); assert.equal(sha256(data), entry.sha256, entry.path);
}
const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 1 && args[0] === '--rerun'), 'usage: branch-verify.cjs [--rerun]');
console.log(`Verified ${manifest.code.length} model source objects, ${manifest.historicalBaseline.length} historical objects and ${manifest.artifacts.length} v2 artifacts.`);
if (args[0] === '--rerun') {
  const { benchmarkBranch, writeArtifacts } = require('./branch-benchmark.cjs');
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'loc8-branch-repeat-'));
  try {
    const repeated = writeArtifacts(benchmarkBranch(manifest.matrix), temporary);
    assert.deepEqual(repeated.artifacts, manifest.artifacts, 'V2 benchmark artifacts differ');
    const executableCode = rows => rows.filter(row => !continuedMetadata.has(row.path));
    assert.deepEqual(executableCode(repeated.code), executableCode(manifest.code), 'V2 executable source objects differ');
    assert.deepEqual(repeated.historicalBaseline, manifest.historicalBaseline, 'V1 historical objects differ');
    console.log(`Repeated ${manifest.runs} v2 runs; executable source and artifact hashes match (host Node and install-lock boundary reported separately).`);
  } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
} else console.log('Recorded software evidence only; --rerun repeats the model, not native/radio tests.');
