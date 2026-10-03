'use strict';
// Integrity check for recorded evidence. Native execution is a separate CI job.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
function read(relative) {
  const resolved = path.resolve(root, relative);
  assert.ok(resolved.startsWith(root + path.sep), 'receipt path outside checkout');
  return fs.readFileSync(resolved);
}
const parentPath = 'docs/research/rnd/results/evidence/2026-10-03-branch-relay/reattachment/manifest.json';
const receipt = JSON.parse(read('docs/research/rnd/results/evidence/2026-10-03-egress/manifest.json'));
assert.equal(receipt.schema, 'loc8.ios-egress-continuation.v1');
assert.equal(receipt.base_commit, 'd796e843f390fcf2ff38ae1b61d760811856a91b');
assert.equal(receipt.previous_receipt_sha256, hash(read(parentPath)));
const covered = new Set(receipt.sources.map(row => row.path));
for (const row of JSON.parse(read(parentPath)).sources) {
  assert.ok(covered.has(row.path), `Missing continued source coverage: ${row.path}`);
}
for (const required of ['modules/loc8-mesh/ios/MeshEgressQueue.swift',
  'tools/mesh-rnd/native-relay/ios-egress-tests.swift', 'tools/mesh-rnd/verify-egress-evidence.cjs']) {
  assert.ok(covered.has(required), `Missing new source: ${required}`);
}
for (const row of [...receipt.sources, ...receipt.artifacts]) {
  const data = read(row.path);
  assert.equal(data.length, row.bytes, row.path);
  assert.equal(hash(data), row.sha256, `Egress source/evidence drift: ${row.path}`);
}
assert.equal(receipt.physical_phone_attempts, 0);
assert.equal(receipt.production_promotion, false);
console.log(`Current egress receipt: ${receipt.sources.length} source hashes and ${receipt.artifacts.length} recorded artifacts verified. Native host evidence; no phone/RF result.`);
