import { encodePacket } from '@loc8/engine/core/packetCodec';
import type { Packet } from '@loc8/engine/core/types';

export type MeshFieldRole = 'A' | 'B' | 'C';
export type MeshFieldBlockKind = 'near' | 'isolation-pre' | 'relay' | 'isolation-post';

export interface MeshFieldBlock {
  blockId: string;
  kind: MeshFieldBlockKind;
  sourceRole: MeshFieldRole;
  destinationRole: MeshFieldRole;
  relayRole: 'B' | null;
  expectedAttempts: 10 | 50 | 100;
}

function block(
  blockId: string,
  kind: MeshFieldBlockKind,
  sourceRole: MeshFieldRole,
  destinationRole: MeshFieldRole,
  expectedAttempts: 10 | 50 | 100,
): MeshFieldBlock {
  return {
    blockId,
    kind,
    sourceRole,
    destinationRole,
    relayRole: kind === 'relay' ? 'B' : null,
    expectedAttempts,
  };
}

/** Frozen 14-block MESH-01 E01 matrix; order is the operator run order. */
export const MESH_FIELD_BLOCKS: readonly MeshFieldBlock[] = Object.freeze([
  block('near-a-b', 'near', 'A', 'B', 10),
  block('near-b-a', 'near', 'B', 'A', 10),
  block('near-b-c', 'near', 'B', 'C', 10),
  block('near-c-b', 'near', 'C', 'B', 10),
  block('near-a-c', 'near', 'A', 'C', 10),
  block('near-c-a', 'near', 'C', 'A', 10),
  block('isolation-pre-a-c', 'isolation-pre', 'A', 'C', 50),
  block('isolation-pre-c-a', 'isolation-pre', 'C', 'A', 50),
  block('relay-a-c-1', 'relay', 'A', 'C', 100),
  block('relay-c-a-1', 'relay', 'C', 'A', 100),
  block('relay-a-c-2', 'relay', 'A', 'C', 100),
  block('relay-c-a-2', 'relay', 'C', 'A', 100),
  block('isolation-post-a-c', 'isolation-post', 'A', 'C', 50),
  block('isolation-post-c-a', 'isolation-post', 'C', 'A', 50),
]);

export const MESH_FIELD_SENDER_IDS: Readonly<Record<MeshFieldRole, number>> = Object.freeze({
  A: 0x4c3800a1,
  B: 0x4c3800b1,
  C: 0x4c3800c1,
});

export function participatingRoles(block: MeshFieldBlock): readonly MeshFieldRole[] {
  return block.relayRole === 'B'
    ? [block.sourceRole, 'B', block.destinationRole]
    : [block.sourceRole, block.destinationRole];
}

export function fieldContextIssue(runId: string, cohortId: string): string | null {
  if (!/^[a-z0-9][a-z0-9-]{7,63}$/u.test(runId)) {
    return 'Run ID must be 8–64 lowercase letters, numbers, or hyphens.';
  }
  if (!/^[a-z0-9][a-z0-9-]{0,47}$/u.test(cohortId)) {
    return 'Cohort ID must be 1–48 lowercase letters, numbers, or hyphens.';
  }
  return null;
}

/**
 * A synthetic, non-location payload. The native frame timestamp supplies
 * freshness; `accuracyM` carries the visible attempt number only for manual
 * debugging and is never exported as packet bytes.
 */
export function fieldAttemptPacket(role: MeshFieldRole, sequence: number, nowMs = Date.now()): Uint8Array {
  if (!Number.isInteger(sequence) || sequence < 0 || sequence > 99) {
    throw new Error('MESH-01 sequence must be an integer from 0 through 99.');
  }
  const packet: Packet = {
    type: 'position',
    senderId: MESH_FIELD_SENDER_IDS[role],
    targetId: 0,
    latitude: 0,
    longitude: 0,
    headingDeg: 0,
    batteryPct: 100,
    timestampSec: Math.floor(nowMs / 1_000) >>> 0,
    accuracyM: sequence,
    floor: 0,
  };
  return new Uint8Array(encodePacket(packet));
}

export function fieldExportFilename(runId: string, blockId: string, role: MeshFieldRole): string {
  return `${runId}__${blockId}__${role.toLowerCase()}.jsonl`;
}

export function encodeFieldJsonl(events: readonly unknown[]): string {
  return events.map((event) => JSON.stringify(event)).join('\n') + (events.length > 0 ? '\n' : '');
}
