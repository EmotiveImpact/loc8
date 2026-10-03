'use strict';
// The frozen macOS and repeated Linux gzip streams differ only at header byte 9.
// Keep recorded hashes intact; permit just the observed zlib OS codes (19/3).
// RFC 1952 section 2.3.1 and zlib v1.3.1 zutil.h define this host metadata.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function read(directory, relative) {
  const root = path.resolve(directory), file = path.resolve(root, relative);
  assert.ok(file.startsWith(root + path.sep), 'Model artifact path outside evidence directory');
  return fs.readFileSync(file);
}
function verifyRepeatedArtifacts(repeated, recorded, repeatedDirectory, recordedDirectory) {
  assert.deepEqual(repeated.map(({ path, bytes }) => ({ path, bytes })),
    recorded.map(({ path, bytes }) => ({ path, bytes })), 'Benchmark artifact names/lengths changed');
  assert.equal(new Set(recorded.map(row => row.path)).size, recorded.length, 'Duplicate artifact paths');
  for (let index = 0; index < recorded.length; index++) {
    const expected = recorded[index], actual = repeated[index];
    const original = read(recordedDirectory, expected.path), regenerated = read(repeatedDirectory, actual.path);
    assert.equal(original.length, expected.bytes, expected.path);
    assert.equal(regenerated.length, actual.bytes, actual.path);
    assert.equal(hash(original), expected.sha256, `Historical artifact drift: ${expected.path}`);
    assert.equal(hash(regenerated), actual.sha256, `Repeated artifact receipt mismatch: ${actual.path}`);
    if (actual.sha256 === expected.sha256) continue;
    assert.ok(expected.path.endsWith('.json.gz'), `Benchmark artifact changed: ${expected.path}`);
    for (const bytes of [original, regenerated]) {
      assert.ok(bytes.length >= 18 && bytes.subarray(0, 9).equals(Buffer.from('1f8b08000000000002', 'hex')),
        'Expected the frozen gzip header without optional fields');
      assert.ok([3, 19].includes(bytes[9]), 'Unreviewed gzip OS code');
    }
    const normalized = Buffer.from(regenerated);
    normalized[9] = original[9];
    assert.ok(normalized.equals(original), `Benchmark gzip differs beyond OS header byte 9: ${expected.path}`);
    assert.ok(zlib.gunzipSync(regenerated).equals(zlib.gunzipSync(original)), 'Benchmark gzip content changed');
    console.log(`Gzip host metadata ${expected.path}: OS ${original[9]} -> ${regenerated[9]}; historical ${expected.sha256}; repeated ${actual.sha256}. Every other compressed byte and all content match.`);
  }
}
module.exports = { verifyRepeatedArtifacts };
