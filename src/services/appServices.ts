// src/services/appServices.ts
import type { LocationTransport } from '../transport/LocationTransport';
import { SimulatedTransport } from '../transport/SimulatedTransport';
import { BleMeshTransport } from '../transport/BleMeshTransport';
import { TrustLayer } from '../core/trustLayer';
import { createMeshService, type MeshService } from './meshService';
import { useCrewStore } from '../state/crewStore';
import type { Coordinate } from '../core/types';

export const DEMO_CREW = [
  { id: 101, name: 'Maya', color: '#4be3c0', startBearingDeg: 45, startDistanceM: 80 },
  { id: 102, name: 'Jules', color: '#ff9a5a', startBearingDeg: 210, startDistanceM: 140 },
  { id: 103, name: 'Sam', color: '#8c9aff', startBearingDeg: 270, startDistanceM: 210, relayVia: 'Maya', lagTicks: 2 },
  { id: 104, name: 'Rae', color: '#ffcf5a', startBearingDeg: 130, startDistanceM: 320 },
];

// Fallback origin if location permission denied (spec §10 error handling): Golden Gate Park.
export const FALLBACK_ORIGIN: Coordinate = { latitude: 37.7694, longitude: -122.4862 };

let transport: LocationTransport | null = null;
let service: MeshService | null = null;

/**
 * Transport factory (mesh spike brief §2): EXPO_PUBLIC_TRANSPORT=ble → real BLE mesh
 * via the loc8-mesh native module; anything else/unset → SimulatedTransport, so the
 * demo keeps working everywhere the native module isn't installed.
 */
export function getTransport(): LocationTransport {
  if (!transport) {
    transport = process.env.EXPO_PUBLIC_TRANSPORT === 'ble'
      ? new BleMeshTransport()
      : new SimulatedTransport({
          seed: 42,
          origin: useCrewStore.getState().myLocation ?? FALLBACK_ORIGIN,
          friends: DEMO_CREW,
        });
  }
  return transport;
}

/**
 * The active transport ONLY when it's the sim — for sim-only controls
 * (setOrigin/scenario/simulateIncomingPing). Returns null on the BLE mesh,
 * where real peers move themselves; callers must no-op in that case.
 */
export function getSimTransport(): SimulatedTransport | null {
  const t = getTransport();
  return t instanceof SimulatedTransport ? t : null;
}

export function getMeshService(): MeshService {
  if (!service) {
    service = createMeshService(getTransport(), new TrustLayer());
  }
  return service;
}

export function bootCrew(): void {
  const isBle = process.env.EXPO_PUBLIC_TRANSPORT === 'ble';
  // BLE mode: no fake friends — real peers auto-add as their packets arrive.
  useCrewStore.getState().setAutoAddPeers(isBle);
  // Seed the demo crew ONLY in sim mode with no real crew — a real crew's
  // members auto-register from their tagged packets (see applyPacket).
  if (isBle || useCrewStore.getState().crew) return;
  useCrewStore.getState().registerFriends(DEMO_CREW.map(({ id, name, color }) => ({ id, name, color })));
}
