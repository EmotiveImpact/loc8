// src/engine.ts — the ONE place Loc8 Command reaches into the shared engine.
//
// Command is a web app; it reuses @loc8/engine but ONLY its pure, RN-free
// modules (core/*). The barrel `@loc8/engine` is deliberately never imported:
// it re-exports the mesh service + crew store, which pull in react-native
// (AppState) and AsyncStorage and would not resolve on the web.
//
// This list is the HONEST reuse surface — every symbol here is consumed by the
// app (or its tests). What it buys, concretely:
//   - Packet/Coordinate + encodePacket/decodePacket → Command emits and ingests
//     the SAME 25-byte mesh frames Guard speaks (PACKET_SIZE proves it in
//     tests), so dispatch/status flow both ways with no translation layer.
//   - fragmentText/TextReassembler → dispatch orders fragment/reassemble
//     identically to consumer crew-chat and Guard team-comms.
//   - getHaversineDistance → real nearest-responder distances and zone
//     coverage, on the same geo math as the radar.

export type { Coordinate, Packet } from '@loc8/engine/core/types';
export { encodePacket, decodePacket, PACKET_SIZE } from '@loc8/engine/core/packetCodec';
export { fragmentText, TextReassembler } from '@loc8/engine/core/textFragments';
export { getHaversineDistance } from '@loc8/engine/core/geoMath';
export { GUARD_STATUS, guardStatusLabel, DURESS_CODE } from '@loc8/engine/core/guardStatus';
export type { GuardStatus } from '@loc8/engine/core/guardStatus';
export {
  STATUS_EN_ROUTE,
  STATUS_ON_SCENE,
  STATUS_NEED_BACKUP,
  STATUS_CLEAR,
} from '@loc8/engine/core/types';
// Live mode: the console becomes a bridge client and renders REAL mesh frames
// relayed from a Guard gateway phone (pure module — WebSocket is platform-global).
export { BridgedTransport } from '@loc8/engine/transport/BridgedTransport';
// The shared ops-event grammar (dispatch, muster, field reports) — built and
// parsed by the same module Guard uses, so the doors cannot drift.
export { opsMsg, parseOpsMessage } from '@loc8/engine/core/opsMessages';
export type { OpsEvent } from '@loc8/engine/core/opsMessages';

// Commissioning uses only the pure semantic-building submodule. Keeping this
// explicit preserves Command's no-React-Native web boundary while giving
// Guard, Command and Gateway packaging one versioned building contract.
export {
  SYNTHETIC_FOUR_LEVEL_VENUE,
  PLAN_REGISTRATION_MAX_RESIDUAL_M,
  PLAN_REGISTRATION_MAX_RMS_M,
  PlanRegistrationError,
  assertVenuePackage,
  compileVenuePackage,
  createGatewaySimulationSnapshot,
  createLocalDemoPublication,
  createSyntheticPlanImport,
  createSyntheticFourLevelVenue,
  evaluatePlanRegistration,
  forkVenueDraft,
  parsePlanImportJson,
  parseGatewaySimulationSnapshot,
  projectFloorPlans,
  projectLevels,
  projectPlaces,
  projectZones,
  reconcileVenueReplica,
  registerPlanImport,
  routeBetweenNodes,
  routeToNearestExit,
  serializeGatewaySimulationSnapshot,
  validateVenuePackage,
} from '@loc8/engine/building';
export type {
  PlanPoint,
  EvaluatedPlanRegistration,
  GatewaySimulationSnapshot,
  PlanImportBundle,
  PlanRegistrationReceipt,
  RouteProfile,
  VenuePackage,
  VenueReconciliationResult,
  VenueRouteResult,
  VenueSpace,
  VenueValidationIssue,
} from '@loc8/engine/building';

// Phone-floor development uses the pure replay/normalisation contract only.
// The Expo-backed native adapter remains in Guard/@loc8/engine and is never
// bundled into this web application.
export {
  FLOOR_REPLAY_MAX_BYTES,
  canonicalFloorReplayJson,
  createFloorReplayFrames,
  createSyntheticFloorReplay,
  floorReplayFrameAt,
  parseFloorReplayJson,
  validateFloorReplayBundle,
} from '@loc8/engine/sensing';
export type {
  FloorReplayBundle,
  FloorReplayEvent,
  FloorReplayFrame,
} from '@loc8/engine/sensing';
