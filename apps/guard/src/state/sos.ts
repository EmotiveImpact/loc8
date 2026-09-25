// apps/guard/src/state/sos.ts — raise / stand-down an SOS.
//
// Pure engine reuse, three signals in one gesture:
//   1. a first-class 'sos' packet (type 7, position + floor aboard) — what the
//      Command console keys on in live mode;
//   2. a rally pin — the team's converge-here target (dispatch arrow, map marker);
//   3. a fragmented free-text alert — human-readable in every activity feed.
// The un-missable haptic is the engine's haptics.sos(). No forked transport.
import { getMeshService, getTransport, useCrewStore, haptics, opsMsg, legacySourceAccuracy, type Packet } from '@loc8/engine';
import { useGuardStore, badgeLabel } from './guardStore';

/** Broadcast the first-class 'sos' packet (Command's live-mode trigger). */
function broadcastSosPacket(): void {
  const crew = useCrewStore.getState();
  if (!crew.profile) return;
  const loc = crew.myLocation;
  const p: Packet = {
    type: 'sos',
    senderId: crew.profile.id,
    targetId: crew.crew?.tag ?? 0,
    latitude: loc?.latitude ?? 0,
    longitude: loc?.longitude ?? 0,
    headingDeg: 0,
    floor: crew.myFloor,
    batteryPct: 100,
    timestampSec: Math.floor(Date.now() / 1000),
    accuracyM: legacySourceAccuracy(loc, crew.myLocationSample),
  };
  getTransport().broadcast(p);
}

/** Fire an SOS: sos packet + rally position + text alert + buzz. Returns the label. */
export function raiseSosNow(): string {
  const g = useGuardStore.getState();
  const label = `SOS · Guard ${badgeLabel(g.badge)}`;
  const zone = g.shift.zone;
  const mesh = getMeshService();
  broadcastSosPacket();
  // dropRally broadcasts our position as the shared converge target + sets the pin.
  mesh.dropRally();
  // A human-readable alert rides the same mesh as free-text; echoes to activity.
  mesh.sendCrewMessage(opsMsg.sos(g.badge, zone));
  g.raiseSos(label);
  haptics.sos();
  return label;
}

/** Stand down: clear the pin + my SOS flag, confirm with a message. */
export function standDownSos(): void {
  const g = useGuardStore.getState();
  useCrewStore.getState().clearRally();
  getMeshService().sendCrewMessage(opsMsg.sosClear(g.badge));
  g.cancelSos();
  g.setDispatch(null);
  haptics.success();
}
