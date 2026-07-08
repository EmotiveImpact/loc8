// apps/guard/src/state/guardTeam.ts
//
// The Guard app reuses the engine's mesh + simulated transport unchanged. In sim
// mode the transport is seeded with the engine's DEMO_CREW ids (101–104) and
// moves those senders; we simply RESKIN those same ids as a security team so the
// live team map is driven by the real engine loop — no forked transport.
import { useCrewStore } from '@loc8/engine';
import { ops } from '../ui/opsTheme';

export type GuardStatus = 'ok' | 'caution';

export interface GuardMember {
  id: number; // must match the engine sim's senderId to receive live positions
  name: string;
  badge: number;
  zone: string;
  status: GuardStatus;
  color: string;
  /** Demo floor (sim mode only) — on real BLE the packet's floor wins. */
  floor: number;
}

/** Reskin of the engine DEMO_CREW ids (101–104) as a night-shift security team. */
export const GUARD_TEAM: GuardMember[] = [
  { id: 101, name: 'Priya', badge: 3, zone: 'Zone 1', status: 'ok', color: ops.ok, floor: 1 },
  { id: 102, name: 'Marcus', badge: 5, zone: 'Zone 2', status: 'ok', color: ops.ok, floor: 0 },
  { id: 103, name: 'Dyani', badge: 9, zone: 'Car Park', status: 'caution', color: ops.caution, floor: -1 },
  { id: 104, name: 'Sam', badge: 2, zone: 'Cloakroom', status: 'ok', color: ops.ok, floor: 0 },
];

const BY_ID: Record<number, GuardMember> = Object.fromEntries(GUARD_TEAM.map((g) => [g.id, g]));

/** Guard metadata for a friend id, or undefined for an unknown (real BLE) peer. */
export function guardFor(id: number): GuardMember | undefined {
  return BY_ID[id];
}

/**
 * A friend's current floor: the packet's floor when present (real BLE / stamped),
 * otherwise the demo floor for the sim, otherwise ground.
 */
export function friendFloor(f: { id: number; lastPacket?: { floor?: number } }): number {
  return f.lastPacket?.floor ?? guardFor(f.id)?.floor ?? 0;
}

/**
 * Seed the team into the engine crewStore (sim mode only). On real BLE we leave
 * autoAddPeers on and let tagged packets register live peers, exactly like the
 * consumer's bootCrew — we just don't inject fake guards.
 */
export function bootGuardTeam(): void {
  const isBle = process.env.EXPO_PUBLIC_TRANSPORT === 'ble';
  useCrewStore.getState().setAutoAddPeers(isBle);
  if (isBle) return;
  useCrewStore.getState().registerFriends(
    GUARD_TEAM.map(({ id, name, color }) => ({ id, name, color })),
  );
}
