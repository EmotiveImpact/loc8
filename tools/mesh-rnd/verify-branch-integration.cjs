'use strict';
// Historical native/API evidence stays pinned to the reviewed commit. The
// reattachment receipt binds current sources to new checks without relabelling
// old logs. --rerun repeats the unchanged models, not native or phone tests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const directory = 'docs/research/rnd/results/evidence/2026-10-03-branch-relay';
const snapshot = 'f7a600bea9d90b3fd96b371c9b59204ddba98760';
const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 1 && args[0] === '--rerun'), 'usage: node tools/mesh-rnd/verify-branch-integration.cjs [--rerun]');
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
function read(relative, historical = false) {
  const file = path.resolve(root, relative);
  assert.ok(file.startsWith(root + path.sep), 'receipt path outside repository');
  return historical
    ? execFileSync('git', ['show', `${snapshot}:${relative}`], { cwd: root, maxBuffer: 10 * 1024 * 1024 })
    : fs.readFileSync(file);
}
function verify(rows, historical = false) {
  for (const row of rows) {
    const data = read(row.path, historical);
    assert.equal(sha256(data), row.sha256, `Source/evidence drift (${historical ? snapshot : 'current'}): ${row.path}`);
    assert.equal(data.length, row.bytes, row.path);
  }
}
const receiptPath = `${directory}/integration-manifest.json`;
const receiptBytes = read(receiptPath);
assert.equal(sha256(receiptBytes), sha256(read(receiptPath, true)), 'Historical integration receipt changed');
const receipt = JSON.parse(receiptBytes);
assert.equal(receipt.schema, 'loc8.branch-relay-integration.v1');
verify(receipt.sources, true);
verify(receipt.artifacts);
console.log(`Historical branch integration ${snapshot}: ${receipt.sources.length} source hashes and ${receipt.artifacts.length} recorded artifacts verified.`);
const current = JSON.parse(read(`${directory}/reattachment/manifest.json`));
assert.equal(current.schema, 'loc8.branch-reattachment.v1');
assert.equal(current.reviewed_checkpoint, snapshot);
assert.equal(current.historical_receipt_sha256, sha256(receiptBytes));
const currentPaths = new Set(current.sources.map(row => row.path));
for (const row of receipt.sources) assert.ok(currentPaths.has(row.path), `Missing current coverage: ${row.path}`);
verify(current.sources);
verify(current.artifacts);
console.log(`Current reattachment receipt: ${current.sources.length} source hashes and ${current.artifacts.length} recorded artifacts. Software/native host evidence; zero physical phone attempts.`);
for (const script of ['verify-density-history.cjs', 'branch-verify.cjs']) {
  process.stdout.write(execFileSync(process.execPath, [path.join(__dirname, script), ...args], { cwd: root, maxBuffer: 10 * 1024 * 1024 }));
}
