'use strict';
// This is a static integration contract for the ACTUAL Kotlin service, not a
// claim that Android controller or Handler code ran. Physical tests are required.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname,
  '../../modules/loc8-mesh/android/src/main/java/expo/modules/loc8mesh/MeshBleService.kt'), 'utf8');
const region = (start, end) => {
  assert.equal(source.split(start).length, 2, 'missing/duplicate start: ' + start);
  const tail = source.split(start)[1];
  assert.ok(tail.includes(end), 'missing end: ' + end);
  return tail.split(end)[0];
};

test('R10 uses one stable Android callback and cleans registration before retry', () => {
  const scanning = region('// MARK: - Scanning (central role)', 'private fun handleScanResult(');
  assert.equal(scanning.match(/private val scanCallback = object : ScanCallback\(\)/g)?.length, 1);
  assert.ok(scanning.includes('sc.startScan(listOf(filter), settings, scanCallback)'));
  const error = region('private fun recoverScanFromFailure(errorCode: Int)', 'private fun startScanningIfPossible()');
  assert.ok(error.indexOf('scanner?.stopScan(scanCallback)') < error.indexOf('scanning = false'));
  assert.ok(error.indexOf('scanning = false') < error.indexOf('scheduleScanRetry('));
  assert.ok(!error.includes('if (scanning)'), 'must clean even when flag has already been cleared');
});

test('R10 owns retries on the handler and cancels on Bluetooth teardown', () => {
  const schedule = region('private fun scheduleScanRetry(reason: String)', 'private fun recoverScanFromFailure(');
  assert.ok(schedule.includes('scanRetry != null'));
  assert.ok(schedule.includes('adapter?.isEnabled != true'));
  assert.ok(schedule.includes('owner.postDelayed(retry, delayMs)'));
  assert.ok(schedule.includes('scanRetry !== this'));
  assert.ok(schedule.includes('handler !== owner'));
  assert.ok(schedule.includes('coerceAtMost(30_000L)'));
  assert.ok(schedule.includes('coerceAtMost(5)'));
  const drop = region('private fun dropRadioState()', 'fun broadcast(payload: ByteArray');
  assert.ok(drop.indexOf('cancelScanRetry()') < drop.indexOf('scanner?.stopScan(scanCallback)'));
  assert.ok(drop.includes('scanRetryAttempt = 0'));
  assert.ok(drop.includes('runCatching { scanner?.stopScan(scanCallback) }'));
});

test('R10 does not retry known unsupported PHY and starts only while BLE is enabled', () => {
  const recover = region('private fun recoverScanFromFailure(errorCode: Int)', 'private fun startScanningIfPossible()');
  assert.ok(recover.includes('ScanCallback.SCAN_FAILED_FEATURE_UNSUPPORTED'));
  assert.ok(recover.indexOf('cancelScanRetry()') < recover.indexOf('scheduleScanRetry('));
  const start = region('private fun startScanningIfPossible()', 'private val scanCallback = object');
  assert.ok(start.includes('adapter?.isEnabled != true'));
  assert.ok(start.includes('scanRetry != null'));
  assert.ok(start.includes('sc.stopScan(scanCallback)'));
  assert.ok(start.includes('scheduleScanRetry("start exception")'));
});

test('R10 never changes the packet framing constants or native forwarding here', () => {
  assert.ok(source.includes('MeshConstants.ORIGIN_TTL'));
  assert.ok(source.includes('MeshFrameCodec.encode(frame)'));
  assert.ok(!source.includes('SCAN_FAILED_ALREADY_STARTED -> startScanningIfPossible()'));
});
