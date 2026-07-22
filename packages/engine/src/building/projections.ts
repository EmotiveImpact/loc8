import type {
  PlanPoint,
  ProjectedFloorPlan,
  ProjectedLevel,
  ProjectedPlace,
  ProjectedZone,
  VenuePackage,
} from './types';
import { compileVenuePackage } from './venuePackage';

function center(points: readonly PlanPoint[]): PlanPoint {
  const total = points.reduce((sum, point) => ({ xM: sum.xM + point.xM, yM: sum.yM + point.yM }), { xM: 0, yM: 0 });
  return { xM: total.xM / points.length, yM: total.yM / points.length };
}

export function projectLevels(venue: VenuePackage): ProjectedLevel[] {
  return [...venue.levels]
    .sort((left, right) => left.ordinal - right.ordinal || left.levelId.localeCompare(right.levelId))
    .map((level) => ({ ...level, buildingId: venue.buildingId, mapVersion: venue.mapVersion }));
}

export function projectFloorPlans(venue: VenuePackage): ProjectedFloorPlan[] {
  const order = new Map(projectLevels(venue).map((level, index) => [level.levelId, index]));
  return [...venue.floorPlans]
    .sort((left, right) => (order.get(left.levelId) ?? 0) - (order.get(right.levelId) ?? 0))
    .map((plan) => ({ ...plan, buildingId: venue.buildingId, mapVersion: venue.mapVersion }));
}

export function projectZones(venue: VenuePackage): ProjectedZone[] {
  const compiled = compileVenuePackage(venue);
  const centersBySpace = Object.fromEntries(venue.floorPlans.flatMap((plan) =>
    plan.shapes.map((shape) => [shape.spaceId, center(shape.points)])));
  return venue.zones.map((zone) => {
    const points = zone.spaceIds.map((spaceId) => centersBySpace[spaceId]).filter((point): point is PlanPoint => point !== undefined);
    const localCenterM = points.length > 0 ? center(points) : { xM: 0, yM: 0 };
    return {
      ...compiled.zonesById[zone.zoneId],
      buildingId: venue.buildingId,
      mapVersion: venue.mapVersion,
      localCenterM,
    };
  });
}

export function projectPlaces(venue: VenuePackage): ProjectedPlace[] {
  const compiled = compileVenuePackage(venue);
  return venue.places.map((place) => ({
    ...place,
    buildingId: venue.buildingId,
    mapVersion: venue.mapVersion,
    levelId: compiled.nodesById[place.nodeId].levelId,
  }));
}

export interface LegacyFloorCodec {
  encode(levelId: string): number | undefined;
  decode(code: number): string | undefined;
}

export function createLegacyFloorCodec(venue: VenuePackage): LegacyFloorCodec {
  compileVenuePackage(venue);
  const byLevel = new Map(venue.legacyFloorCodes.map((entry) => [entry.levelId, entry.code]));
  const byCode = new Map(venue.legacyFloorCodes.map((entry) => [entry.code, entry.levelId]));
  return {
    encode: (levelId) => byLevel.get(levelId),
    decode: (code) => byCode.get(code),
  };
}
