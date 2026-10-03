'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const { verifyRepeatedArtifacts } = require('./benchmark-artifacts.cjs');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function fixture(t, mutate = () => {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'loc8-gzip-metadata-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const recordedDirectory = path.join(root, 'recorded'), repeatedDirectory = path.join(root, 'repeated');
  fs.mkdirSync(recordedDirectory); fs.mkdirSync(repeatedDirectory);
  const original = zlib.gzipSync(Buffer.from('[{"delivered":true,"attempts":3}]\n'), { level: 9 });
  original[9] = 19;
  const regenerated = Buffer.from(original); regenerated[9] = 3; mutate(regenerated);
  const relative = 'trials.json.gz';
  fs.writeFileSync(path.join(recordedDirectory, relative), original);
  fs.writeFileSync(path.join(repeatedDirectory, relative), regenerated);
  const row = bytes => ({ path: relative, bytes: bytes.length, sha256: hash(bytes) });
  return { recorded: [row(original)], repeated: [row(regenerated)], recordedDirectory, repeatedDirectory };
}
const verify = fixture => verifyRepeatedArtifacts(fixture.repeated, fixture.recorded, fixture.repeatedDirectory, fixture.recordedDirectory);
test('frozen macOS gzip matches a Linux repeat with only the OS header byte changed', t => {
  const files = fixture(t); verify(files);
  files.repeated = files.recorded;
  fs.copyFileSync(path.join(files.recordedDirectory, 'trials.json.gz'), path.join(files.repeatedDirectory, 'trials.json.gz'));
  verify(files);
});
test('changed compressed payload or trailer fails even with correct regenerated receipt hashes', t => {
  for (const index of [10, -1]) {
    const files = fixture(t, bytes => { bytes[index === -1 ? bytes.length - 1 : index] ^= 1; });
    assert.throws(() => verify(files), /differs beyond OS header/);
    for (const directory of [files.recordedDirectory, files.repeatedDirectory]) {
      fs.renameSync(path.join(directory, 'trials.json.gz'), path.join(directory, 'matrix.json'));
    }
    for (const row of [...files.recorded, ...files.repeated]) row.path = 'matrix.json';
    assert.throws(() => verify(files), /Benchmark artifact changed/);
  }
});
test('other gzip header changes and unreviewed OS codes fail', t => {
  for (const index of [0, 3, 4, 8, 9]) {
    const files = fixture(t, bytes => { bytes[index] = index === 9 ? 255 : bytes[index] ^ 1; });
    assert.throws(() => verify(files), /frozen gzip header|Unreviewed gzip OS/);
  }
});
test('receipt hash errors and historical byte changes fail', t => {
  const files = fixture(t); files.repeated[0].sha256 = '0'.repeat(64);
  assert.throws(() => verify(files), /Repeated artifact receipt mismatch/);
  files.recorded[0].sha256 = '0'.repeat(64);
  assert.throws(() => verify(files), /Historical artifact drift/);
});
test('missing, extra, renamed or duplicate artifacts fail', t => {
  const files = fixture(t);
  for (const repeated of [[], [...files.repeated, ...files.repeated], [{ ...files.repeated[0], path: 'other.json.gz' }]]) {
    assert.throws(() => verify({ ...files, repeated }), /names\/lengths changed/);
  }
  assert.throws(() => verify({ ...files, repeated: [...files.repeated, ...files.repeated], recorded: [...files.recorded, ...files.recorded] }), /Duplicate artifact paths/);
});
test('artifact paths cannot escape either evidence directory', t => {
  const files = fixture(t);
  for (const relative of ['../trials.json.gz', path.join(files.recordedDirectory, '..', 'trials.json.gz')]) {
    assert.throws(() => verify({ ...files, recorded: [{ ...files.recorded[0], path: relative }], repeated: [{ ...files.repeated[0], path: relative }] }), /outside evidence directory/);
  }
});
