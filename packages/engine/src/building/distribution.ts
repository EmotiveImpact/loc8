import type { VenuePackage, VenueValidationIssue } from './types';
import { canonicalVenueJson, compileVenuePackage } from './venuePackage';
import { assertVenuePackage, validateVenuePackage } from './validation';

export const VENUE_DISTRIBUTION_SCHEMA = 'loc8.venue-distribution.v1' as const;
export const GATEWAY_SIMULATION_SCHEMA = 'loc8.gateway-venue-simulation.v1' as const;

const STABLE_ID = /^[a-z][a-z0-9._-]{2,95}$/u;
const SHA256 = /^[a-f0-9]{64}$/u;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u;
const ENVELOPE_KEYS = new Set([
  'schemaVersion', 'envelopeId', 'mode', 'siteId', 'gatewayId', 'buildingId',
  'packageId', 'mapVersion', 'parentMapVersion', 'contentSha256', 'issuedAtMs',
  'expiresAtMs', 'verification', 'package',
]);
const VERIFICATION_KEYS = new Set(['providerId', 'keyId', 'signatureBase64']);
const SIMULATION_KEYS = new Set([
  'schemaVersion', 'evidenceClass', 'snapshotId', 'gatewaySimulatorId',
  'installedAtMs', 'buildingId', 'packageId', 'mapVersion', 'packageBytes', 'package',
]);

export type VenueDistributionMode = 'bootstrap' | 'update';

export interface VenueDistributionVerification {
  providerId: string;
  keyId: string;
  signatureBase64: string;
}

export interface VenueDistributionEnvelope {
  schemaVersion: typeof VENUE_DISTRIBUTION_SCHEMA;
  envelopeId: string;
  mode: VenueDistributionMode;
  siteId: string;
  gatewayId: string;
  buildingId: string;
  packageId: string;
  mapVersion: string;
  parentMapVersion: string | null;
  contentSha256: string;
  issuedAtMs: number;
  expiresAtMs: number;
  verification: VenueDistributionVerification;
  package: VenuePackage;
}

export interface InstalledVenueDistribution {
  envelope: VenueDistributionEnvelope;
  installedAtMs: number;
}

export interface VenueDigestProvider {
  sha256(payload: string): Promise<string>;
}

export interface VenueSignatureVerifier {
  verify(input: {
    providerId: string;
    keyId: string;
    signatureBase64: string;
    payload: string;
  }): Promise<boolean>;
}

export interface GatewayVenuePackageStore {
  readCurrent(siteId: string, buildingId: string): Promise<InstalledVenueDistribution | null>;
  append(input: {
    expectedCurrentMapVersion: string | null;
    installed: InstalledVenueDistribution;
  }): Promise<'stored' | 'conflict'>;
}

export interface TrustedGatewayClock {
  nowMs(): number;
}

export interface VenueInstallReceipt {
  outcome: 'installed' | 'already-installed';
  evidenceClass: 'provider-verified-contract';
  envelopeId: string;
  siteId: string;
  gatewayId: string;
  buildingId: string;
  packageId: string;
  mapVersion: string;
  previousMapVersion: string | null;
  installedAtMs: number;
}

export interface GatewaySimulationSnapshot {
  schemaVersion: typeof GATEWAY_SIMULATION_SCHEMA;
  evidenceClass: 'simulation-only';
  snapshotId: string;
  gatewaySimulatorId: string;
  installedAtMs: number;
  buildingId: string;
  packageId: string;
  mapVersion: string;
  packageBytes: number;
  package: VenuePackage;
}

export type VenueReplicaReference = Pick<VenuePackage, 'buildingId' | 'packageId' | 'mapVersion' | 'parentMapVersion'>;

export type VenueReconciliationResult =
  | { outcome: 'not-installed'; gatewayMapVersion: null; clientMapVersion: string }
  | { outcome: 'in-sync'; gatewayMapVersion: string; clientMapVersion: string }
  | { outcome: 'update-available'; gatewayMapVersion: string; clientMapVersion: string }
  | { outcome: 'client-ahead'; gatewayMapVersion: string; clientMapVersion: string }
  | { outcome: 'identity-conflict'; gatewayMapVersion: string; clientMapVersion: string };

export class VenueDistributionError extends Error {
  readonly code: string;
  readonly issues?: readonly VenueValidationIssue[];

  constructor(code: string, message = code, issues?: readonly VenueValidationIssue[]) {
    super(message);
    this.name = 'VenueDistributionError';
    this.code = code;
    this.issues = issues;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>) {
  return Object.keys(value).every((key) => allowed.has(key)) && Object.keys(value).length === allowed.size;
}

function isStableId(value: unknown): value is string {
  return typeof value === 'string' && STABLE_ID.test(value);
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

function canonical(value: unknown): string {
  const sort = (candidate: unknown): unknown => {
    if (Array.isArray(candidate)) return candidate.map(sort);
    if (candidate !== null && typeof candidate === 'object') {
      return Object.fromEntries(Object.entries(candidate as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sort(child)]));
    }
    return candidate;
  };
  return JSON.stringify(sort(value));
}

function utf8ByteLength(value: string) {
  let bytes = 0;
  for (const character of value) {
    const codePoint = character.codePointAt(0)!;
    bytes += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
  }
  return bytes;
}

export function venuePackageDigestPayload(venue: VenuePackage): string {
  assertVenuePackage(venue);
  const payload = clonePlain(venue);
  payload.publication.contentSha256 = null;
  return canonical(payload);
}

export function venueEnvelopeSignaturePayload(envelope: VenueDistributionEnvelope): string {
  return canonical({
    schemaVersion: envelope.schemaVersion,
    envelopeId: envelope.envelopeId,
    mode: envelope.mode,
    siteId: envelope.siteId,
    gatewayId: envelope.gatewayId,
    buildingId: envelope.buildingId,
    packageId: envelope.packageId,
    mapVersion: envelope.mapVersion,
    parentMapVersion: envelope.parentMapVersion,
    contentSha256: envelope.contentSha256,
    issuedAtMs: envelope.issuedAtMs,
    expiresAtMs: envelope.expiresAtMs,
    providerId: envelope.verification.providerId,
    keyId: envelope.verification.keyId,
  });
}

export function validateVenueDistributionEnvelope(value: unknown): VenueValidationIssue[] {
  const issues: VenueValidationIssue[] = [];
  const add = (code: string, path: string, message: string) => issues.push({ code, path, message });
  if (!isRecord(value) || !hasExactKeys(value, ENVELOPE_KEYS)) {
    add('envelope-shape', '$', 'must contain exactly the distribution envelope fields');
    return issues;
  }
  if (value.schemaVersion !== VENUE_DISTRIBUTION_SCHEMA) add('schema-version', '$.schemaVersion', `must equal ${VENUE_DISTRIBUTION_SCHEMA}`);
  for (const key of ['envelopeId', 'siteId', 'gatewayId', 'buildingId', 'packageId', 'mapVersion']) {
    if (!isStableId(value[key])) add('stable-id', `$.${key}`, 'must be a lower-case stable identifier');
  }
  if (value.parentMapVersion !== null && !isStableId(value.parentMapVersion)) add('stable-id', '$.parentMapVersion', 'must be null or a stable identifier');
  if (value.mode !== 'bootstrap' && value.mode !== 'update') add('distribution-mode', '$.mode', 'must be bootstrap or update');
  if (typeof value.contentSha256 !== 'string' || !SHA256.test(value.contentSha256)) add('sha256', '$.contentSha256', 'must be a lower-case SHA-256 digest');
  if (!Number.isSafeInteger(value.issuedAtMs) || (value.issuedAtMs as number) <= 0) add('time', '$.issuedAtMs', 'must be a positive integer millisecond time');
  if (!Number.isSafeInteger(value.expiresAtMs) || (value.expiresAtMs as number) <= 0) add('time', '$.expiresAtMs', 'must be a positive integer millisecond time');
  if (Number.isSafeInteger(value.issuedAtMs) && Number.isSafeInteger(value.expiresAtMs) &&
      (value.expiresAtMs as number) <= (value.issuedAtMs as number)) {
    add('time-order', '$.expiresAtMs', 'must be after issuedAtMs');
  }
  if (!isRecord(value.verification) || !hasExactKeys(value.verification, VERIFICATION_KEYS)) {
    add('verification-shape', '$.verification', 'must contain exactly providerId, keyId and signatureBase64');
  } else {
    if (!isStableId(value.verification.providerId)) add('stable-id', '$.verification.providerId', 'must be a stable provider ID');
    if (!isStableId(value.verification.keyId)) add('stable-id', '$.verification.keyId', 'must be a stable key ID');
    if (typeof value.verification.signatureBase64 !== 'string' || value.verification.signatureBase64.length < 16 ||
        value.verification.signatureBase64.length > 4096 || !BASE64.test(value.verification.signatureBase64)) {
      add('signature-encoding', '$.verification.signatureBase64', 'must be bounded canonical base64');
    }
  }
  const venueIssues = validateVenuePackage(value.package);
  issues.push(...venueIssues.map((entry) => ({ ...entry, path: `$.package${entry.path.slice(1)}` })));
  if (isRecord(value.package)) {
    const venueCandidate = value.package;
    const match = (field: 'buildingId' | 'packageId' | 'mapVersion' | 'parentMapVersion', code: string) => {
      if (value[field] !== venueCandidate[field]) add(code, `$.${field}`, `must equal package.${field}`);
    };
    match('buildingId', 'building-mismatch');
    match('packageId', 'package-mismatch');
    match('mapVersion', 'map-version-mismatch');
    match('parentMapVersion', 'parent-version-mismatch');
    const publication = isRecord(venueCandidate.publication) ? venueCandidate.publication : undefined;
    if (publication && venueCandidate.state === 'published' && value.contentSha256 !== publication.contentSha256) {
      add('digest-mismatch', '$.contentSha256', 'must equal published package digest');
    }
  }
  return issues.sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code));
}

export class GatewayVenuePackageInstaller {
  constructor(private readonly dependencies: {
    digest: VenueDigestProvider;
    signature: VenueSignatureVerifier;
    store: GatewayVenuePackageStore;
    clock: TrustedGatewayClock;
  }) {}

  async install(value: unknown): Promise<VenueInstallReceipt> {
    const issues = validateVenueDistributionEnvelope(value);
    if (issues.length > 0) throw new VenueDistributionError('invalid-envelope', 'distribution envelope failed validation', issues);
    const envelope = value as VenueDistributionEnvelope;
    const nowMs = this.dependencies.clock.nowMs();
    if (!Number.isSafeInteger(nowMs) || nowMs <= 0) throw new VenueDistributionError('clock-unavailable');
    if (envelope.issuedAtMs > nowMs + 30_000) throw new VenueDistributionError('issued-in-future');
    if (envelope.expiresAtMs <= nowMs) throw new VenueDistributionError('envelope-expired');
    if (envelope.package.state !== 'published' || envelope.package.publication.authority === 'browser-local' ||
        envelope.package.publication.signed !== true || envelope.package.provenance.review.status !== 'reviewed') {
      throw new VenueDistributionError('package-not-published');
    }
    let digest: string;
    try {
      digest = await this.dependencies.digest.sha256(venuePackageDigestPayload(envelope.package));
    } catch {
      throw new VenueDistributionError('digest-provider-failed');
    }
    if (!SHA256.test(digest) || digest !== envelope.contentSha256) throw new VenueDistributionError('content-digest-rejected');
    let verified: boolean;
    try {
      verified = await this.dependencies.signature.verify({
        ...envelope.verification,
        payload: venueEnvelopeSignaturePayload(envelope),
      });
    } catch {
      throw new VenueDistributionError('signature-provider-failed');
    }
    if (!verified) throw new VenueDistributionError('signature-rejected');

    let current: InstalledVenueDistribution | null;
    try {
      current = await this.dependencies.store.readCurrent(envelope.siteId, envelope.buildingId);
    } catch {
      throw new VenueDistributionError('store-read-failed');
    }
    if (current) {
      if (!Number.isSafeInteger(current.installedAtMs) || current.installedAtMs <= 0 ||
          validateVenueDistributionEnvelope(current.envelope).length > 0) {
        throw new VenueDistributionError('store-state-invalid');
      }
      const currentEnvelope = current.envelope;
      if (currentEnvelope.siteId !== envelope.siteId || currentEnvelope.buildingId !== envelope.buildingId) {
        throw new VenueDistributionError('store-scope-conflict');
      }
      if (envelope.mapVersion === currentEnvelope.mapVersion) {
        if (envelope.packageId === currentEnvelope.packageId && envelope.contentSha256 === currentEnvelope.contentSha256) {
          return this.receipt('already-installed', envelope, currentEnvelope.parentMapVersion, current.installedAtMs);
        }
        throw new VenueDistributionError('version-content-conflict');
      }
      if (envelope.mode !== 'update') throw new VenueDistributionError('update-required');
      if (envelope.parentMapVersion !== currentEnvelope.mapVersion) throw new VenueDistributionError('lineage-conflict');
    } else if (envelope.mode !== 'bootstrap') {
      throw new VenueDistributionError('bootstrap-required');
    }
    const installed: InstalledVenueDistribution = deepFreeze({ envelope: clonePlain(envelope), installedAtMs: nowMs }) as InstalledVenueDistribution;
    let appended: 'stored' | 'conflict';
    try {
      appended = await this.dependencies.store.append({
        expectedCurrentMapVersion: current?.envelope.mapVersion ?? null,
        installed,
      });
    } catch {
      throw new VenueDistributionError('store-failed');
    }
    if (appended !== 'stored') throw new VenueDistributionError('atomic-conflict');
    return this.receipt('installed', envelope, current?.envelope.mapVersion ?? null, nowMs);
  }

  private receipt(
    outcome: VenueInstallReceipt['outcome'],
    envelope: VenueDistributionEnvelope,
    previousMapVersion: string | null,
    installedAtMs: number,
  ): VenueInstallReceipt {
    return deepFreeze({
      outcome,
      evidenceClass: 'provider-verified-contract',
      envelopeId: envelope.envelopeId,
      siteId: envelope.siteId,
      gatewayId: envelope.gatewayId,
      buildingId: envelope.buildingId,
      packageId: envelope.packageId,
      mapVersion: envelope.mapVersion,
      previousMapVersion,
      installedAtMs,
    }) as VenueInstallReceipt;
  }
}

export function createGatewaySimulationSnapshot(
  venue: VenuePackage,
  options: { snapshotId: string; gatewaySimulatorId: string; installedAtMs: number },
): GatewaySimulationSnapshot {
  assertVenuePackage(venue);
  if (venue.state !== 'local-demo' || venue.publication.authority !== 'browser-local' || venue.publication.signed) {
    throw new VenueDistributionError('simulation-requires-local-demo');
  }
  if (!isStableId(options.snapshotId) || !isStableId(options.gatewaySimulatorId) ||
      !Number.isSafeInteger(options.installedAtMs) || options.installedAtMs <= 0) {
    throw new VenueDistributionError('invalid-simulation-options');
  }
  const packageSnapshot = clonePlain(venue);
  const snapshot: GatewaySimulationSnapshot = {
    schemaVersion: GATEWAY_SIMULATION_SCHEMA,
    evidenceClass: 'simulation-only',
    snapshotId: options.snapshotId,
    gatewaySimulatorId: options.gatewaySimulatorId,
    installedAtMs: options.installedAtMs,
    buildingId: venue.buildingId,
    packageId: venue.packageId,
    mapVersion: venue.mapVersion,
    packageBytes: utf8ByteLength(canonicalVenueJson(packageSnapshot)),
    package: packageSnapshot,
  };
  const issues = validateGatewaySimulationSnapshot(snapshot);
  if (issues.length > 0) throw new VenueDistributionError('invalid-simulation-snapshot', 'generated snapshot failed validation', issues);
  return deepFreeze(snapshot) as GatewaySimulationSnapshot;
}

export function validateGatewaySimulationSnapshot(value: unknown): VenueValidationIssue[] {
  const issues: VenueValidationIssue[] = [];
  const add = (code: string, path: string, message: string) => issues.push({ code, path, message });
  if (!isRecord(value) || !hasExactKeys(value, SIMULATION_KEYS)) {
    add('simulation-shape', '$', 'must contain exactly the simulation snapshot fields');
    return issues;
  }
  if (value.schemaVersion !== GATEWAY_SIMULATION_SCHEMA) add('schema-version', '$.schemaVersion', `must equal ${GATEWAY_SIMULATION_SCHEMA}`);
  if (value.evidenceClass !== 'simulation-only') add('evidence-class', '$.evidenceClass', 'must equal simulation-only');
  for (const key of ['snapshotId', 'gatewaySimulatorId', 'buildingId', 'packageId', 'mapVersion']) {
    if (!isStableId(value[key])) add('stable-id', `$.${key}`, 'must be a lower-case stable identifier');
  }
  if (!Number.isSafeInteger(value.installedAtMs) || (value.installedAtMs as number) <= 0) add('time', '$.installedAtMs', 'must be a positive integer millisecond time');
  if (!Number.isSafeInteger(value.packageBytes) || (value.packageBytes as number) <= 0) add('package-bytes', '$.packageBytes', 'must be a positive integer');
  const venueIssues = validateVenuePackage(value.package);
  issues.push(...venueIssues.map((entry) => ({ ...entry, path: `$.package${entry.path.slice(1)}` })));
  if (isRecord(value.package)) {
    for (const field of ['buildingId', 'packageId', 'mapVersion'] as const) {
      if (value[field] !== value.package[field]) add(`${field}-mismatch`, `$.${field}`, `must equal package.${field}`);
    }
    if (value.package.state !== 'local-demo' || !isRecord(value.package.publication) ||
        value.package.publication.authority !== 'browser-local' || value.package.publication.signed !== false) {
      add('simulation-package-state', '$.package', 'must be an unsigned browser-local local-demo package');
    }
    if (venueIssues.length === 0) {
      const bytes = utf8ByteLength(canonicalVenueJson(value.package as unknown as VenuePackage));
      if (value.packageBytes !== bytes) add('package-bytes-mismatch', '$.packageBytes', 'must equal canonical package byte length');
    }
  }
  return issues.sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code));
}

export function serializeGatewaySimulationSnapshot(snapshot: GatewaySimulationSnapshot): string {
  const issues = validateGatewaySimulationSnapshot(snapshot);
  if (issues.length > 0) throw new VenueDistributionError('invalid-simulation-snapshot', 'cannot serialize invalid snapshot', issues);
  return canonical(snapshot);
}

export function parseGatewaySimulationSnapshot(value: string): GatewaySimulationSnapshot {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new VenueDistributionError('invalid-simulation-json');
  }
  const issues = validateGatewaySimulationSnapshot(parsed);
  if (issues.length > 0) throw new VenueDistributionError('invalid-simulation-snapshot', 'snapshot failed validation', issues);
  compileVenuePackage((parsed as GatewaySimulationSnapshot).package);
  return deepFreeze(parsed) as GatewaySimulationSnapshot;
}

export function reconcileVenueReplica(
  gateway: Pick<GatewaySimulationSnapshot, 'buildingId' | 'packageId' | 'mapVersion' | 'package'> | null,
  client: VenueReplicaReference,
): VenueReconciliationResult {
  if (!gateway) return { outcome: 'not-installed', gatewayMapVersion: null, clientMapVersion: client.mapVersion };
  if (gateway.buildingId !== client.buildingId) {
    return { outcome: 'identity-conflict', gatewayMapVersion: gateway.mapVersion, clientMapVersion: client.mapVersion };
  }
  if (gateway.mapVersion === client.mapVersion && gateway.packageId === client.packageId) {
    return { outcome: 'in-sync', gatewayMapVersion: gateway.mapVersion, clientMapVersion: client.mapVersion };
  }
  if (client.mapVersion === gateway.package.parentMapVersion) {
    return { outcome: 'update-available', gatewayMapVersion: gateway.mapVersion, clientMapVersion: client.mapVersion };
  }
  if (client.parentMapVersion === gateway.mapVersion) {
    return { outcome: 'client-ahead', gatewayMapVersion: gateway.mapVersion, clientMapVersion: client.mapVersion };
  }
  return { outcome: 'identity-conflict', gatewayMapVersion: gateway.mapVersion, clientMapVersion: client.mapVersion };
}
