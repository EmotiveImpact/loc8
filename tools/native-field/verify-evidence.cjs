'use strict';
// A source/log integrity gate, not a substitute for fresh execution or phones.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
// Preserve the original field-build receipt as a historical evidence snapshot.
// Current product code has advanced through later reviewed R&D branches, so
// comparing that old receipt against the new working tree is not meaningful.
// Checkout uses fetch-depth: 0 in CI, making the pinned source available.
const sourceCheckpoint = '09932ccb49a2deb67db924ee54c622b7a6302b3f';
function read(relative) {
  const file = path.resolve(root, relative);
  assert.ok(file.startsWith(root + path.sep), 'receipt path outside checkout');
  return fs.readFileSync(file);
}
function historicalSource(relative) {
  // Reuse the same path traversal guard for historical and current reads.
  const file = path.resolve(root, relative);
  assert.ok(file.startsWith(root + path.sep), 'historical source outside checkout');
  return execFileSync('git', ['show', `${sourceCheckpoint}:${relative}`], {
    cwd: root, maxBuffer: 12 * 1024 * 1024,
  });
}
const parentPath = 'docs/research/rnd/results/evidence/2026-10-03-egress/manifest.json';
const receipt = JSON.parse(read('docs/research/rnd/results/evidence/2026-10-03-native-field-build/manifest.json'));
assert.equal(receipt.schema, 'loc8.native-field-continuation.v1');
assert.equal(receipt.previous_checkpoint, 'e18b999026e493c816ead39a0b6f1d06169b201c');
assert.equal(receipt.previous_receipt_sha256, hash(read(parentPath)));
const covered = new Set(receipt.sources.map(row => row.path));
for (const row of JSON.parse(read(parentPath)).sources) assert.ok(covered.has(row.path), `Missing continued source: ${row.path}`);
for (const file of ['app.config.js', 'apps/guard/app.config.js', 'apps/guard/package.json',
  'src/research/meshFieldAccess.ts', 'src/research/meshFieldBuild.ts', 'tools/native-field/build.cjs',
  'tools/native-field/field-build.node.cjs', 'tools/native-field/verify-evidence.cjs', 'BUILD.md', 'FIELD-TEST.md']) {
  assert.ok(covered.has(file), `Missing field-build source: ${file}`);
}
for (const row of receipt.sources) {
  const bytes = historicalSource(row.path);
  assert.equal(bytes.length, row.bytes, row.path);
  assert.equal(hash(bytes), row.sha256, `Historical field source drift: ${row.path}`);
}
for (const row of receipt.artifacts) {
  const bytes = read(row.path);
  assert.equal(bytes.length, row.bytes, row.path);
  assert.equal(hash(bytes), row.sha256, `Field evidence drift: ${row.path}`);
}
assert.equal(receipt.physical_phone_attempts, 0);
assert.equal(receipt.production_promotion, false);
assert.equal(receipt.default_relay_mode, 'current');
console.log(`Historical native field receipt ${sourceCheckpoint}: ${receipt.sources.length} source hashes and ${receipt.artifacts.length} recorded artifacts verified. Read individual build receipts for supported/blocked stages; no phone/RF claim.`);
