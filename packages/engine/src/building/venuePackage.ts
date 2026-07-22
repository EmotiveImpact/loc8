import type {
  LegacyFloorCode,
  VenueConnector,
  VenueFloorPlan,
  BuildingLevel,
  VenuePackage,
  VenuePlace,
  VenuePortal,
  VenueRouteEdge,
  VenueRouteNode,
  VenueSpace,
  VenueZone,
} from './types';
import { assertVenuePackage } from './validation';

export interface CompiledVenuePackage {
  readonly package: Readonly<VenuePackage>;
  readonly levelsById: Readonly<Record<string, Readonly<BuildingLevel>>>;
  readonly plansByLevelId: Readonly<Record<string, Readonly<VenueFloorPlan>>>;
  readonly spacesById: Readonly<Record<string, Readonly<VenueSpace>>>;
  readonly zonesById: Readonly<Record<string, Readonly<VenueZone>>>;
  readonly connectorsById: Readonly<Record<string, Readonly<VenueConnector>>>;
  readonly portalsById: Readonly<Record<string, Readonly<VenuePortal>>>;
  readonly placesById: Readonly<Record<string, Readonly<VenuePlace>>>;
  readonly nodesById: Readonly<Record<string, Readonly<VenueRouteNode>>>;
  readonly edgesById: Readonly<Record<string, Readonly<VenueRouteEdge>>>;
  readonly legacyCodesByLevelId: Readonly<Record<string, Readonly<LegacyFloorCode>>>;
}

export interface LocalDemoPublicationOptions {
  packageId: string;
  mapVersion: string;
  publishedAt: string;
  publishedBy: string;
}

export interface DraftForkOptions {
  packageId: string;
  mapVersion: string;
  validFrom: string;
}

function clonePlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): Readonly<T> {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return value;
}

function indexBy<T>(values: readonly T[], field: keyof T): Record<string, T> {
  return Object.fromEntries(values.map((value) => [String(value[field]), value]));
}

function sortCanonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortCanonical);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, sortCanonical(child)]));
  }
  return value;
}

export function canonicalVenueJson(value: VenuePackage): string {
  assertVenuePackage(value);
  return JSON.stringify(sortCanonical(value));
}

export function compileVenuePackage(value: VenuePackage): CompiledVenuePackage {
  assertVenuePackage(value);
  const snapshot = clonePlain(value);
  const compiled: CompiledVenuePackage = {
    package: snapshot,
    levelsById: indexBy(snapshot.levels, 'levelId'),
    plansByLevelId: indexBy(snapshot.floorPlans, 'levelId'),
    spacesById: indexBy(snapshot.spaces, 'spaceId'),
    zonesById: indexBy(snapshot.zones, 'zoneId'),
    connectorsById: indexBy(snapshot.connectors, 'connectorId'),
    portalsById: indexBy(snapshot.portals, 'portalId'),
    placesById: indexBy(snapshot.places, 'placeId'),
    nodesById: indexBy(snapshot.routeNodes, 'nodeId'),
    edgesById: indexBy(snapshot.routeEdges, 'edgeId'),
    legacyCodesByLevelId: indexBy(snapshot.legacyFloorCodes, 'levelId'),
  };
  return deepFreeze(compiled) as CompiledVenuePackage;
}

export function createLocalDemoPublication(
  draft: VenuePackage,
  options: LocalDemoPublicationOptions,
): CompiledVenuePackage {
  assertVenuePackage(draft);
  if (draft.state !== 'draft') throw new Error('only a draft venue package can become a local demo publication');
  const publication: VenuePackage = {
    ...clonePlain(draft),
    packageId: options.packageId,
    mapVersion: options.mapVersion,
    parentMapVersion: draft.mapVersion,
    state: 'local-demo',
    validFrom: options.publishedAt,
    publication: {
      authority: 'browser-local',
      signed: false,
      contentSha256: null,
      publishedAt: options.publishedAt,
      publishedBy: options.publishedBy,
    },
  };
  return compileVenuePackage(publication);
}

export function forkVenueDraft(
  source: VenuePackage,
  options: DraftForkOptions,
): VenuePackage {
  assertVenuePackage(source);
  if (source.state === 'draft') throw new Error('draft source should be edited directly rather than forked');
  const draft: VenuePackage = {
    ...clonePlain(source),
    packageId: options.packageId,
    mapVersion: options.mapVersion,
    parentMapVersion: source.mapVersion,
    state: 'draft',
    validFrom: options.validFrom,
    validTo: null,
    publication: {
      authority: 'browser-local',
      signed: false,
      contentSha256: null,
      publishedAt: null,
      publishedBy: null,
    },
  };
  assertVenuePackage(draft);
  return draft;
}
