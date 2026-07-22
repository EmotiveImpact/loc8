import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { DurableAuditLog, verifyAuditBundle, verifyRestore } from '../src/audit.mjs';
import { ManualClock, MemoryAuditRepository } from './support.mjs';

describe('durable audit and restore contracts', () => {
  test('hash-links atomic repository appends and exports head/count externally', async () => {
    const repository = new MemoryAuditRepository();
    const published = [];
    const audit = new DurableAuditLog({
      siteId: 'site-a',
      repository,
      anchorSink: { async publish(anchor) { published.push(anchor); return { receiptId: 'signed-elsewhere-1' }; } },
      clock: new ManualClock(),
      retentionDays: 90,
    });
    await audit.initialize();
    await audit.append('connection_accepted', { subjectId: 'guard-a', role: 'gateway' });
    await audit.append('frame_routed', { subjectId: 'guard-a', delivered: 1 });
    const { anchor, receipt } = await audit.checkpoint();
    const bundle = await audit.exportBundle();
    assert.equal(verifyAuditBundle(bundle, anchor), true);
    assert.equal(anchor.count, 2);
    assert.equal(published.length, 1);
    assert.equal(receipt.receiptId, 'signed-elsewhere-1');
  });

  test('detects mutation, middle deletion, anchored tail truncation and site rollback', async () => {
    const repository = new MemoryAuditRepository();
    const audit = new DurableAuditLog({
      siteId: 'site-a', repository,
      anchorSink: { async publish() { return { receiptId: 'r' }; } },
      clock: new ManualClock(), retentionDays: 30,
    });
    await audit.initialize();
    for (const event of ['one', 'two', 'three']) await audit.append(event);
    const bundle = await audit.exportBundle();
    const anchor = { siteId: 'site-a', count: bundle.count, head: bundle.head };

    const mutated = structuredClone(bundle);
    mutated.entries[1].event = 'changed';
    assert.equal(verifyAuditBundle(mutated, anchor), false);
    const deleted = structuredClone(bundle);
    deleted.entries.splice(1, 1);
    assert.equal(verifyAuditBundle(deleted, anchor), false);
    const truncated = structuredClone(bundle);
    truncated.entries.pop();
    truncated.count--;
    truncated.head = truncated.entries.at(-1).hash;
    assert.equal(verifyAuditBundle(truncated), true);
    assert.equal(verifyAuditBundle(truncated, anchor), false);
    assert.equal(verifyRestore(bundle, 'site-b', anchor), false);
    assert.equal(verifyRestore(bundle, 'site-a', anchor), true);
  });

  test('rejects sensitive audit fields and concurrent head conflicts', async () => {
    const repository = new MemoryAuditRepository();
    const options = {
      siteId: 'site-a', repository,
      anchorSink: { async publish() { return { receiptId: 'r' }; } },
      clock: new ManualClock(), retentionDays: 30,
    };
    const first = new DurableAuditLog(options);
    const second = new DurableAuditLog(options);
    await first.initialize();
    await second.initialize();
    await assert.rejects(
      () => first.append('bad', { capability: 'never-store-this' }),
      (error) => error?.code === 'sensitive_audit_field',
    );
    await assert.rejects(
      () => first.append('bad', { unreviewedMetadata: 'never-log-by-default' }),
      (error) => error?.code === 'audit_field_not_allowed',
    );
    await first.append('one');
    await assert.rejects(() => second.append('two'), /audit_conflict/);
  });

  test('uses canonical field ordering and rejects malformed chain metadata', async () => {
    const make = async (detail) => {
      const repository = new MemoryAuditRepository();
      const audit = new DurableAuditLog({
        siteId: 'site-a', repository,
        anchorSink: { async publish() { return { receiptId: 'r' }; } },
        clock: new ManualClock(), retentionDays: 30,
      });
      await audit.initialize();
      await audit.append('connection_accepted', detail);
      return audit.exportBundle();
    };
    const first = await make({ subjectId: 'guard-a', role: 'gateway' });
    const second = await make({ role: 'gateway', subjectId: 'guard-a' });
    assert.equal(first.head, second.head);
    const malformed = structuredClone(first);
    malformed.baseHash = 'not-a-hash';
    assert.equal(verifyAuditBundle(malformed), false);
  });
});
