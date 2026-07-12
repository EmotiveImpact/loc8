// Ops status responses ride the same quick-reply wire format as the consumer
// canned replies. These tests pin the additive contract: distinct code block,
// correct labels, and a single lookup that resolves BOTH sets.
import {
  QUICK_REPLIES,
  STATUS_REPLIES,
  STATUS_EN_ROUTE,
  STATUS_ON_SCENE,
  STATUS_NEED_BACKUP,
  STATUS_CLEAR,
  quickReplyLabel,
} from '../types';

describe('ops status replies', () => {
  it('exposes the four dispatch statuses with the spec labels', () => {
    expect(STATUS_REPLIES.map((r) => r.label)).toEqual([
      'En route',
      'On scene',
      'Need backup',
      'Clear',
    ]);
  });

  it('uses a code block that never collides with the consumer set', () => {
    const consumerCodes = new Set(QUICK_REPLIES.map((q) => q.code));
    for (const r of STATUS_REPLIES) {
      expect(consumerCodes.has(r.code)).toBe(false);
      expect(r.code).toBeGreaterThanOrEqual(20);
    }
  });

  it('quickReplyLabel resolves both consumer and ops codes', () => {
    expect(quickReplyLabel(1)).toBe('On my way'); // consumer, unchanged
    expect(quickReplyLabel(STATUS_EN_ROUTE)).toBe('En route');
    expect(quickReplyLabel(STATUS_ON_SCENE)).toBe('On scene');
    expect(quickReplyLabel(STATUS_NEED_BACKUP)).toBe('Need backup');
    expect(quickReplyLabel(STATUS_CLEAR)).toBe('Clear');
    expect(quickReplyLabel(999)).toBe('…'); // unknown still degrades gracefully
  });
});
