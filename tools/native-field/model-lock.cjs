'use strict';
// SDK patch upgrades change the install lock, not the frozen model sources.
// Validate both locks rather than rewriting the historical benchmark receipt.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const receiptPath = path.join(root, 'docs/research/rnd/results/evidence/2026-10-03-native-field-build/manifest.json');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function validateModelLock(entry) {
  const permitted = ['package-lock.json', 'tools/mesh-rnd/branch-verify.cjs'];
  if (!permitted.includes(entry.path) || !fs.existsSync(receiptPath)) return false;
  execFileSync(process.execPath, [path.join(__dirname, 'verify-evidence.cjs')], { cwd: root });
  const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
  const current = receipt.sources.find(row => row.path === entry.path);
  assert.ok(current, 'Field continuation must bind the changed install lock/verifier');
  assert.equal(hash(fs.readFileSync(path.join(root, current.path))), current.sha256);
  const ref = entry.path === 'package-lock.json' ? 'f4436b54ceb1e0efb9762ad7c721c3b826c4fcc6' : 'f7a600bea9d90b3fd96b371c9b59204ddba98760';
  const historical = execFileSync('git', ['show', `${ref}:${entry.path}`], { cwd: root, maxBuffer: 10 * 1024 * 1024 });
  assert.equal(hash(historical), entry.sha256, 'Frozen model install-lock/verifier receipt changed');
  console.log(`Model metadata continuation ${entry.path}: historical ${entry.sha256}; current ${current.sha256}. Simulation and benchmark sources remain strictly checked.`);
  return true;
}
module.exports = { validateModelLock };
