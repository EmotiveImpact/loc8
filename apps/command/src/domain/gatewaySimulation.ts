import {
  createGatewaySimulationSnapshot,
  parseGatewaySimulationSnapshot,
  reconcileVenueReplica,
  serializeGatewaySimulationSnapshot,
  type GatewaySimulationSnapshot,
  type VenuePackage,
  type VenueReconciliationResult,
} from '../engine';

export const COMMAND_GATEWAY_SIMULATION_KEY = 'loc8.command.gateway-simulation.v1';

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type GatewaySimulationLoadResult =
  | { status: 'empty'; snapshot: null; error: null }
  | { status: 'loaded'; snapshot: GatewaySimulationSnapshot; error: null }
  | { status: 'invalid'; snapshot: null; error: 'snapshot-invalid' | 'storage-unavailable' };

export function loadCommandGatewaySimulation(storage: KeyValueStorage): GatewaySimulationLoadResult {
  let value: string | null;
  try {
    value = storage.getItem(COMMAND_GATEWAY_SIMULATION_KEY);
  } catch {
    return { status: 'invalid', snapshot: null, error: 'storage-unavailable' };
  }
  if (value === null) return { status: 'empty', snapshot: null, error: null };
  try {
    return { status: 'loaded', snapshot: parseGatewaySimulationSnapshot(value), error: null };
  } catch {
    return { status: 'invalid', snapshot: null, error: 'snapshot-invalid' };
  }
}

export function installCommandGatewaySimulation(
  venue: VenuePackage,
  installedAtMs: number,
  storage: KeyValueStorage,
): GatewaySimulationSnapshot {
  const snapshot = createGatewaySimulationSnapshot(venue, {
    snapshotId: `snapshot.command.${venue.mapVersion.replaceAll('.', '-')}.${installedAtMs}`,
    gatewaySimulatorId: 'gateway.simulator.command.01',
    installedAtMs,
  });
  const serialized = serializeGatewaySimulationSnapshot(snapshot);
  storage.setItem(COMMAND_GATEWAY_SIMULATION_KEY, serialized);
  const persisted = storage.getItem(COMMAND_GATEWAY_SIMULATION_KEY);
  if (persisted === null) throw new Error('Gateway simulation snapshot was not retained');
  return parseGatewaySimulationSnapshot(persisted);
}

export function clearCommandGatewaySimulation(storage: KeyValueStorage) {
  storage.removeItem(COMMAND_GATEWAY_SIMULATION_KEY);
}

export function reconcileCommandGatewaySimulation(
  snapshot: GatewaySimulationSnapshot | null,
  venue: VenuePackage,
): VenueReconciliationResult {
  return reconcileVenueReplica(snapshot, venue);
}
