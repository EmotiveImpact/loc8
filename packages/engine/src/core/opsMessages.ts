// src/core/opsMessages.ts — the ops-event grammar shared by Guard and Command.
//
// Ops verbs (dispatch, muster, incident reports, lone-worker escalation) ride
// the SAME fragmented free-text channel as crew chat, as human-readable
// sentences — so every activity feed stays legible — but each one starts with
// a stable prefix this module can parse back into a typed event. One grammar,
// defined once in the engine: Guard builds, Command parses, and neither door
// can drift from the other.
//
// Keep every built message ≤ MAX_MESSAGE_BYTES (160) — builders here stay well
// under it. The sender's mesh id (from the packet) is ALWAYS the authoritative
// identity; badges/names inside the text are display-only.

export type OpsEvent =
  | { kind: 'dispatch'; label: string }
  | { kind: 'muster_call'; assembly: string }
  | { kind: 'muster_safe'; badge: number; assembly: string }
  | { kind: 'muster_clear'; accounted: number; total: number }
  | { kind: 'sos_text'; badge: number; zone: string }
  | { kind: 'sos_clear'; badge: number }
  | { kind: 'incident'; type: string; level: string; zone: string }
  | { kind: 'lone_overdue'; badge: number; plusCode?: string };

const b2 = (n: number) => String(Math.abs(Math.round(n)) % 100).padStart(2, '0');

// ---- builders (Guard + Command emit through these, never hand-rolled) ----

export const opsMsg = {
  dispatch: (label: string) => `DISPATCH — ${label}`,
  musterCall: (assembly: string) => `MUSTER — evacuate to ${assembly} now`,
  musterSafe: (badge: number, assembly: string) => `MUSTER SAFE — Guard ${b2(badge)} at ${assembly}`,
  musterClear: (accounted: number, total: number) => `MUSTER CLEAR — ${accounted}/${total} accounted`,
  sos: (badge: number, zone: string) => `SOS — Guard ${b2(badge)} needs help · ${zone}`,
  sosClear: (badge: number) => `SOS CLEAR — Guard ${b2(badge)} is OK`,
  incident: (type: string, level: string, zone: string) => `INCIDENT · ${type} · ${level} · ${zone}`,
  loneOverdue: (badge: number, plusCode?: string) =>
    `LONE OVERDUE — Guard ${b2(badge)}${plusCode ? ` @ ${plusCode}` : ''}`,
};

// ---- parser (returns null for plain crew chat) ----

const BADGE = /Guard (\d{1,3})/;

/** Parse a completed mesh message into a typed ops event, or null if it's chat. */
export function parseOpsMessage(text: string): OpsEvent | null {
  const t = text.trim();

  if (t.startsWith('DISPATCH — ')) {
    const label = t.slice('DISPATCH — '.length).trim();
    return label ? { kind: 'dispatch', label } : null;
  }

  if (t.startsWith('MUSTER SAFE — ')) {
    const m = t.match(BADGE);
    const at = t.match(/ at (.+)$/);
    if (!m) return null;
    return { kind: 'muster_safe', badge: Number(m[1]), assembly: at?.[1]?.trim() ?? '' };
  }

  if (t.startsWith('MUSTER CLEAR — ')) {
    const m = t.match(/(\d+)\s*\/\s*(\d+)/);
    if (!m) return null;
    return { kind: 'muster_clear', accounted: Number(m[1]), total: Number(m[2]) };
  }

  if (t.startsWith('MUSTER — ')) {
    const m = t.match(/evacuate to (.+?) now$/);
    return { kind: 'muster_call', assembly: m?.[1]?.trim() ?? t.slice('MUSTER — '.length).trim() };
  }

  if (t.startsWith('SOS CLEAR — ') || t.startsWith('Stood down — ')) {
    const m = t.match(BADGE);
    if (!m) return null;
    return { kind: 'sos_clear', badge: Number(m[1]) };
  }

  if (t.startsWith('SOS — ')) {
    const m = t.match(BADGE);
    if (!m) return null;
    const zone = t.split('·')[1]?.trim() ?? '';
    return { kind: 'sos_text', badge: Number(m[1]), zone };
  }

  if (t.startsWith('INCIDENT · ')) {
    const parts = t.split('·').map((p) => p.trim());
    // "INCIDENT", type, level, zone
    if (parts.length < 4) return null;
    return { kind: 'incident', type: parts[1], level: parts[2], zone: parts[3] };
  }

  if (t.startsWith('LONE OVERDUE — ') || t.startsWith('LONE-WORKER OVERDUE — ')) {
    const m = t.match(BADGE);
    if (!m) return null;
    const pc = t.match(/@ (\S+)/);
    return { kind: 'lone_overdue', badge: Number(m[1]), plusCode: pc?.[1] };
  }

  return null;
}
