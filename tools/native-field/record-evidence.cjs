'use strict';
// Refresh integrity hashes after a reviewed source change. Logs are supplied
// separately and retain their individual execution/dependency boundaries.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const directory = 'docs/research/rnd/results/evidence/2026-10-03-native-field-build';
const parentPath = 'docs/research/rnd/results/evidence/2026-10-03-egress/manifest.json';
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const parent = fs.readFileSync(path.join(root, parentPath));
const gitFiles = args => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const changed = gitFiles(['diff', '--name-only', '-z', 'e18b999026e493c816ead39a0b6f1d06169b201c']);
const added = gitFiles(['ls-files', '--others', '--exclude-standard', '-z']);
const sources = new Set([...JSON.parse(parent).sources.map(row => row.path), ...changed, ...added]);
function row(relative) {
  const bytes = fs.readFileSync(path.join(root, relative));
  return { path: relative, bytes: bytes.length, sha256: hash(bytes) };
}
const sourceRows = [...sources].filter(file => !file.startsWith(directory + '/') && fs.statSync(path.join(root, file)).isFile()).sort().map(row);
const artifacts = [];
function walk(relative) {
  for (const item of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
    const file = `${relative}/${item.name}`;
    if (item.isDirectory()) walk(file);
    else if (item.name !== 'manifest.json') artifacts.push(row(file));
  }
}
walk(directory);
const manifest = {
  schema: 'loc8.native-field-continuation.v1',
  previous_checkpoint: 'e18b999026e493c816ead39a0b6f1d06169b201c',
  previous_receipt_sha256: hash(parent),
  physical_phone_attempts: 0, production_promotion: false, default_relay_mode: 'current',
  execution_boundary: 'Read each receipt/log and the field-build handoff. Hash validation does not execute checks or prove a native app/physical result. Pre-patch local logs use the prior shared installation; final dependency installation and native compilation are separate CI gates.',
  sources: sourceRows, artifacts: artifacts.sort((a, b) => a.path.localeCompare(b.path)),
};
fs.writeFileSync(path.join(root, directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Recorded ${sourceRows.length} source hashes and ${artifacts.length} artifacts. Run the branch integration verifier next.`);
