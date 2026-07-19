// apps/guard/src/state/sos.ts — raise / stand-down an SOS.
//
// Pure engine reuse: an SOS IS a rally pin (my live position, broadcast to the
// team as the converge-here target) + a fragmented free-text alert over the
// mesh. The un-missable haptic is the engine's new haptics.sos(). No new packet
// type, no forked transport.
import { getMeshService, useCrewStore, haptics } from '@loc8/engine';
import { useGuardStore, badgeLabel } from './guardStore';

/** Fire an SOS: broadcast position (rally) + text alert + buzz. Returns the label. */
export function raiseSosNow(): string {
  const g = useGuardStore.getState();
  const label = `SOS · Guard ${badgeLabel(g.badge)}`;
  const zone = g.shift.zone;
  const mesh = getMeshService();
  // dropRally broadcasts our position as the shared converge target + sets the pin.
  mesh.dropRally();
  // A human-readable alert rides the same mesh as free-text; echoes to activity.
  mesh.sendCrewMessage(`SOS — Guard ${badgeLabel(g.badge)} needs help · ${zone}`);
  g.raiseSos(label);
  haptics.sos();
  return label;
}

/** Stand down: clear the pin + my SOS flag, confirm with a message. */
export function standDownSos(): void {
  const g = useGuardStore.getState();
  useCrewStore.getState().clearRally();
  getMeshService().sendCrewMessage(`Stood down — Guard ${badgeLabel(g.badge)} is OK`);
  g.cancelSos();
  g.setDispatch(null);
  haptics.success();
}
