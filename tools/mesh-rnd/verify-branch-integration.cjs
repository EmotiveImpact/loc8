'use strict';
// Verifies the recorded native/API/source and check-log receipt. Hash checking
// is not a fresh native build, Jest run or phone test. --rerun also repeats
// the two deterministic models; host build commands remain explicit.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const directory = 'docs/research/rnd/results/evidence/2026-10-03-branch-relay';
const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 1 && args[0] === '--rerun'), 'usage: node tools/mesh-rnd/verify-branch-integration.cjs [--rerun]');
const receipt = JSON.parse(fs.readFileSync(path.join(root, directory, 'integration-manifest.json')));
assert.equal(receipt.schema, 'loc8.branch-relay-integration.v1');
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
for (const row of [...receipt.sources, ...receipt.artifacts]) {
  const file = path.resolve(root, row.path);
  assert.ok(file.startsWith(root + path.sep), 'receipt path outside repository');
  const data = fs.readFileSync(file);
  assert.equal(sha256(data), row.sha256, `Current branch source/evidence drift: ${row.path}`);
  assert.equal(data.length, row.bytes, row.path);
}
console.log(`Current branch integration receipt: ${receipt.sources.length} source hashes, ${receipt.artifacts.length} recorded artifacts. Recorded software/native compilation evidence; zero physical phone attempts.`);
for (const script of ['verify-density-history.cjs', 'branch-verify.cjs']) {
  process.stdout.write(execFileSync(process.execPath, [path.join(__dirname, script), ...args], { cwd: root, maxBuffer: 10 * 1024 * 1024 }));
}
