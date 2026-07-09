// src/core/guardStatus.ts — the Guard door's status vocabulary.
//
// Wire-identical to a consumer quickReply packet (same 'quickReply' type, same
// code byte); only the code→label mapping differs per door. This mapping is
// the CONTRACT between Guard (which sends a status) and Command (which renders
// it), so it lives in the engine — never fork it per app.
//
// product-architecture.md §Communication: "Quick replies … Guard: reskins to
// status responses — En route / On scene / Need backup / Clear."

export interface GuardStatus {
  code: number;
  label: string;
}

export const GUARD_STATUS: GuardStatus[] = [
  { code: 1, label: 'En route' },
  { code: 2, label: 'On scene' },
  { code: 3, label: 'Need backup' },
  { code: 4, label: 'Clear' },
];

/** Resolve a Guard status code to its label, or '…' if unknown. */
export function guardStatusLabel(code: number): string {
  return GUARD_STATUS.find((s) => s.code === code)?.label ?? '…';
}
