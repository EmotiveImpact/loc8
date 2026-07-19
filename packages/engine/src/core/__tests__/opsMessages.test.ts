import { opsMsg, parseOpsMessage } from '../opsMessages';
import { MAX_MESSAGE_BYTES } from '../textFragments';
import { encodeUtf8 } from '../textFragments';

describe('ops-message grammar (Guard ↔ Command contract)', () => {
  it('round-trips every builder through the parser', () => {
    expect(parseOpsMessage(opsMsg.dispatch('Gate C · fight'))).toEqual({
      kind: 'dispatch',
      label: 'Gate C · fight',
    });
    expect(parseOpsMessage(opsMsg.musterCall('Assembly Point A'))).toEqual({
      kind: 'muster_call',
      assembly: 'Assembly Point A',
    });
    expect(parseOpsMessage(opsMsg.musterSafe(7, 'Assembly Point A'))).toEqual({
      kind: 'muster_safe',
      badge: 7,
      assembly: 'Assembly Point A',
    });
    expect(parseOpsMessage(opsMsg.musterClear(9, 12))).toEqual({
      kind: 'muster_clear',
      accounted: 9,
      total: 12,
    });
    expect(parseOpsMessage(opsMsg.sos(7, 'Zone 2'))).toEqual({
      kind: 'sos_text',
      badge: 7,
      zone: 'Zone 2',
    });
    expect(parseOpsMessage(opsMsg.sosClear(7))).toEqual({ kind: 'sos_clear', badge: 7 });
    expect(parseOpsMessage(opsMsg.incident('Fight', 'Main Floor', 'Zone 2'))).toEqual({
      kind: 'incident',
      type: 'Fight',
      level: 'Main Floor',
      zone: 'Zone 2',
    });
    expect(parseOpsMessage(opsMsg.loneOverdue(7, '9C3XGV00+'))).toEqual({
      kind: 'lone_overdue',
      badge: 7,
      plusCode: '9C3XGV00+',
    });
    expect(parseOpsMessage(opsMsg.loneOverdue(9))).toEqual({
      kind: 'lone_overdue',
      badge: 9,
      plusCode: undefined,
    });
  });

  it('every built message fits a single fragmented mesh message', () => {
    const all = [
      opsMsg.dispatch('Converge on Gate C — hold the cordon until relieved'),
      opsMsg.musterCall('Assembly Point A'),
      opsMsg.musterSafe(7, 'Assembly Point A'),
      opsMsg.musterClear(12, 12),
      opsMsg.sos(7, 'Smoking Terrace'),
      opsMsg.sosClear(7),
      opsMsg.incident('Lost person', 'Roof Terrace', 'Zone 1'),
      opsMsg.loneOverdue(9, '9C3XGV00+2X'),
    ];
    for (const m of all) expect(encodeUtf8(m).length).toBeLessThanOrEqual(MAX_MESSAGE_BYTES);
  });

  it('accepts the legacy stand-down and lone-worker phrasings', () => {
    expect(parseOpsMessage('Stood down — Guard 07 is OK')).toEqual({ kind: 'sos_clear', badge: 7 });
    expect(parseOpsMessage('LONE-WORKER OVERDUE — Guard 07 @ 9C3XGV00+')).toEqual({
      kind: 'lone_overdue',
      badge: 7,
      plusCode: '9C3XGV00+',
    });
  });

  it('plain crew chat is not an ops event', () => {
    expect(parseOpsMessage('meet me by the bar')).toBeNull();
    expect(parseOpsMessage('SOS later maybe')).toBeNull();
    expect(parseOpsMessage('')).toBeNull();
    expect(parseOpsMessage('DISPATCH — ')).toBeNull(); // empty label
    expect(parseOpsMessage('INCIDENT · Fight')).toBeNull(); // too few fields
  });
});
