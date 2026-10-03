'use strict';
// Historical native/API evidence stays pinned to the reviewed commit. The
// reattachment and egress receipts stay historical; the field continuation
// binds current sources. --rerun repeats models, not native or phone tests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const directory = 'docs/research/rnd/results/evidence/2026-10-03-branch-relay';
const snapshot = 'f7a600bea9d90b3fd96b371c9b59204ddba98760';
const reattachmentSnapshot = 'cee77cd7f63ffb4c1dc083919dd40f97a405f481';
const args = process.argv.slice(2);
assert.ok(args.length === 0 || (args.length === 1 && args[0] === '--rerun'), 'usage: node tools/mesh-rnd/verify-branch-integration.cjs [--rerun]');
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
function read(relative, historical = false, ref = snapshot) {
  const file = path.resolve(root, relative);
  assert.ok(file.startsWith(root + path.sep), 'receipt path outside repository');
  return historical
    ? execFileSync('git', ['show', `${ref}:${relative}`], { cwd: root, maxBuffer: 10 * 1024 * 1024 })
    : fs.readFileSync(file);
}
function verify(rows, historical = false, ref = snapshot) {
  for (const row of rows) {
    const data = read(row.path, historical, ref);
    assert.equal(sha256(data), row.sha256, `Source/evidence drift (${historical ? ref : 'current'}): ${row.path}`);
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
const previousReceiptPath = `${directory}/reattachment/manifest.json`;
assert.equal(sha256(read(previousReceiptPath)), sha256(read(previousReceiptPath, true, reattachmentSnapshot)), 'Historical reattachment receipt changed');
const current = JSON.parse(read(previousReceiptPath));
assert.equal(current.schema, 'loc8.branch-reattachment.v1');
assert.equal(current.reviewed_checkpoint, snapshot);
assert.equal(current.historical_receipt_sha256, sha256(receiptBytes));
const currentPaths = new Set(current.sources.map(row => row.path));
for (const row of receipt.sources) assert.ok(currentPaths.has(row.path), `Missing current coverage: ${row.path}`);
verify(current.sources, true, reattachmentSnapshot);
verify(current.artifacts);
console.log(`Historical reattachment ${reattachmentSnapshot}: ${current.sources.length} source hashes and ${current.artifacts.length} recorded artifacts.`);
for (const script of ['verify-egress-evidence.cjs', 'verify-density-history.cjs', 'branch-verify.cjs']) {
  const forwardedArgs = script === 'verify-egress-evidence.cjs' ? [] : args;
  process.stdout.write(execFileSync(process.execPath, [path.join(__dirname, script), ...forwardedArgs], { cwd: root, maxBuffer: 10 * 1024 * 1024 }));
}
const fieldVerifier = path.join(root, 'tools/native-field/verify-evidence.cjs');
if (fs.existsSync(fieldVerifier)) {
  process.stdout.write(execFileSync(process.execPath, [fieldVerifier], { cwd: root, maxBuffer: 10 * 1024 * 1024 }));
}
