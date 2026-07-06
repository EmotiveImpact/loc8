// src/services/appServices.ts
import { SimulatedTransport } from '../transport/SimulatedTransport';
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

let transport: SimulatedTransport | null = null;
let service: MeshService | null = null;

export function getTransport(): SimulatedTransport {
  if (!transport) {
    transport = new SimulatedTransport({
      seed: 42,
      origin: useCrewStore.getState().myLocation ?? FALLBACK_ORIGIN,
      friends: DEMO_CREW,
    });
  }
  return transport;
}

export function getMeshService(): MeshService {
  if (!service) {
    service = createMeshService(getTransport(), new TrustLayer());
  }
  return service;
}

export function bootCrew(): void {
  useCrewStore.getState().registerFriends(DEMO_CREW.map(({ id, name, color }) => ({ id, name, color })));
}
