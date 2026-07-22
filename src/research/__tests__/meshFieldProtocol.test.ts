import { decodePacket, PACKET_SIZE } from '@loc8/engine/core/packetCodec';
import {
  MESH_FIELD_BLOCKS,
  MESH_FIELD_SENDER_IDS,
  encodeFieldJsonl,
  fieldAttemptPacket,
  fieldContextIssue,
  fieldExportFilename,
  participatingRoles,
} from '../meshFieldProtocol';

describe('MESH-01 field protocol', () => {
  it('pins the complete ordered 14-block matrix and attempt budget', () => {
    expect(MESH_FIELD_BLOCKS.map((entry) => entry.blockId)).toEqual([
      'near-a-b', 'near-b-a', 'near-b-c', 'near-c-b', 'near-a-c', 'near-c-a',
      'isolation-pre-a-c', 'isolation-pre-c-a',
      'relay-a-c-1', 'relay-c-a-1', 'relay-a-c-2', 'relay-c-a-2',
      'isolation-post-a-c', 'isolation-post-c-a',
    ]);
    expect(MESH_FIELD_BLOCKS.reduce((sum, entry) => sum + entry.expectedAttempts, 0)).toBe(660);
  });

  it('assigns B only to relay blocks unless B is a near-control endpoint', () => {
    const relay = MESH_FIELD_BLOCKS.find((entry) => entry.blockId === 'relay-a-c-1')!;
    const isolation = MESH_FIELD_BLOCKS.find((entry) => entry.blockId === 'isolation-pre-a-c')!;
    expect(participatingRoles(relay)).toEqual(['A', 'B', 'C']);
    expect(participatingRoles(isolation)).toEqual(['A', 'C']);
  });

  it('encodes only a synthetic zero-coordinate 25-byte attempt payload', () => {
    const bytes = fieldAttemptPacket('C', 99, 1_800_000_000_000);
    expect(bytes).toHaveLength(PACKET_SIZE);
    const packet = decodePacket(bytes.buffer as ArrayBuffer);
    expect(packet).toMatchObject({
      type: 'position',
      senderId: MESH_FIELD_SENDER_IDS.C,
      targetId: 0,
      latitude: 0,
      longitude: 0,
      headingDeg: 0,
      batteryPct: 100,
      accuracyM: 99,
      floor: 0,
    });
  });

  it('rejects out-of-range attempts and malformed context IDs', () => {
    expect(() => fieldAttemptPacket('A', -1)).toThrow();
    expect(() => fieldAttemptPacket('A', 100)).toThrow();
    expect(fieldContextIssue('short', 'ios-ios-ios')).toMatch(/Run ID/u);
    expect(fieldContextIssue('mesh01-run-001', 'Bad cohort')).toMatch(/Cohort ID/u);
    expect(fieldContextIssue('mesh01-run-001', 'ios-ios-ios')).toBeNull();
  });

  it('creates deterministic export names and newline-terminated JSONL', () => {
    expect(fieldExportFilename('mesh01-run-001', 'near-a-b', 'B')).toBe('mesh01-run-001__near-a-b__b.jsonl');
    expect(encodeFieldJsonl([{ b: 2, a: 1 }, { ok: true }])).toBe('{"b":2,"a":1}\n{"ok":true}\n');
    expect(encodeFieldJsonl([])).toBe('');
  });
});
