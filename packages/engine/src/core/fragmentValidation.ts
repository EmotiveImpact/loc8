import type { Packet } from './types';

/** Limits of the existing application protocol, not a new radio envelope. */
export const TEXT_FRAG_BYTES = 11;
export const MAX_MESSAGE_BYTES = 160;
export const NAME_MAX_BYTES = 48;

export type FragmentPacket = Packet & {
  type: 'text' | 'profile';
  msgId: number;
  seq: number;
  total: number;
  frag: number[];
};

export function fragmentByteLimit(type: 'text' | 'profile'): number {
  return type === 'profile' ? NAME_MAX_BYTES : MAX_MESSAGE_BYTES;
}

function isUint(value: unknown, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= max;
}

/** Validate direct/in-memory input too: not every transport uses decodePacket. */
export function isValidFragment(value: unknown): value is FragmentPacket {
  if (value === null || typeof value !== 'object') return false;
  const p = value as Partial<Packet>;
  if (p.type !== 'text' && p.type !== 'profile') return false;
  if (!isUint(p.senderId, 0xffffffff) || !isUint(p.targetId, 0xffffffff) ||
      !isUint(p.msgId, 0xffff) || !isUint(p.total, Math.ceil(fragmentByteLimit(p.type) / TEXT_FRAG_BYTES)) ||
      p.total === 0 || !isUint(p.seq, p.total - 1) || !Array.isArray(p.frag) ||
      p.frag.length > TEXT_FRAG_BYTES) return false;
  // Array.every skips holes; a sparse byte array must not become implicit zeros.
  for (let i = 0; i < p.frag.length; i++) {
    if (!isUint(p.frag[i], 0xff)) return false;
  }
  return true;
}
