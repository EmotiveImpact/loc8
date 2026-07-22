import {
  GATEWAY_SIMULATION_SCHEMA,
  GatewayVenuePackageInstaller,
  VENUE_DISTRIBUTION_SCHEMA,
  VenueDistributionError,
  createGatewaySimulationSnapshot,
  createLocalDemoPublication,
  createSyntheticFourLevelVenue,
  parseGatewaySimulationSnapshot,
  reconcileVenueReplica,
  serializeGatewaySimulationSnapshot,
  validateGatewaySimulationSnapshot,
  validateVenueDistributionEnvelope,
  type GatewayVenuePackageStore,
  type InstalledVenueDistribution,
  type VenueDistributionEnvelope,
  type VenuePackage,
} from '..';

const DIGEST_A = 'a'.repeat(64);
const DIGEST_B = 'b'.repeat(64);
const NOW = 1_800_000_000_000;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function publishedVenue(options: { mapVersion?: string; parentMapVersion?: string | null; digest?: string } = {}): VenuePackage {
  const venue = createSyntheticFourLevelVenue();
  venue.packageId = `package.synthetic.hq.${options.mapVersion?.replaceAll('.', '-') ?? 'published-002'}`;
  venue.mapVersion = options.mapVersion ?? 'map.synthetic.published.002';
  venue.parentMapVersion = options.parentMapVersion === undefined ? 'map.synthetic.draft.001' : options.parentMapVersion;
  venue.state = 'published';
  venue.validFrom = '2027-01-15T08:00:00.000Z';
  venue.provenance.review = { status: 'reviewed', reviewedBy: 'reviewer.map.01', reviewedAt: '2027-01-15T07:30:00.000Z' };
  venue.publication = {
    authority: 'gateway',
    signed: true,
    contentSha256: options.digest ?? DIGEST_A,
    publishedAt: '2027-01-15T08:00:00.000Z',
    publishedBy: 'authority.gateway.01',
  };
  return venue;
}

function envelopeFor(venue = publishedVenue(), overrides: Partial<VenueDistributionEnvelope> = {}): VenueDistributionEnvelope {
  return {
    schemaVersion: VENUE_DISTRIBUTION_SCHEMA,
    envelopeId: `envelope.${venue.mapVersion.replaceAll('.', '-')}`,
    mode: 'bootstrap',
    siteId: 'site.synthetic.hq',
    gatewayId: 'gateway.synthetic.01',
    buildingId: venue.buildingId,
    packageId: venue.packageId,
    mapVersion: venue.mapVersion,
    parentMapVersion: venue.parentMapVersion,
    contentSha256: venue.publication.contentSha256!,
    issuedAtMs: NOW - 1_000,
    expiresAtMs: NOW + 60_000,
    verification: {
      providerId: 'provider.external.fixture',
      keyId: 'key.gateway.fixture.01',
      signatureBase64: 'c2lnbmF0dXJlLWZpeHR1cmU=',
    },
    package: venue,
    ...overrides,
  };
}

class MemoryStore implements GatewayVenuePackageStore {
  current: InstalledVenueDistribution | null = null;
  appendMode: 'stored' | 'conflict' | 'throw' = 'stored';
  readThrows = false;
  appends = 0;

  async readCurrent() {
    if (this.readThrows) throw new Error('read failed');
    return this.current;
  }

  async append(input: { expectedCurrentMapVersion: string | null; installed: InstalledVenueDistribution }) {
    this.appends += 1;
    if (this.appendMode === 'throw') throw new Error('append failed');
    if (this.appendMode === 'conflict' || input.expectedCurrentMapVersion !== (this.current?.envelope.mapVersion ?? null)) return 'conflict' as const;
    this.current = input.installed;
    return 'stored' as const;
  }
}

function installer(options: {
  store?: MemoryStore;
  digest?: string | 'throw';
  signature?: boolean | 'throw';
  nowMs?: number;
} = {}) {
  const store = options.store ?? new MemoryStore();
  const calls = { digest: 0, signature: 0 };
  const instance = new GatewayVenuePackageInstaller({
    digest: {
      async sha256() {
        calls.digest += 1;
        if (options.digest === 'throw') throw new Error('digest failed');
        return options.digest ?? DIGEST_A;
      },
    },
    signature: {
      async verify() {
        calls.signature += 1;
        if (options.signature === 'throw') throw new Error('signature failed');
        return options.signature ?? true;
      },
    },
    store,
    clock: { nowMs: () => options.nowMs ?? NOW },
  });
  return { instance, store, calls };
}

async function expectCode(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toMatchObject({ name: 'VenueDistributionError', code });
}

describe('Gateway production venue distribution contract', () => {
  it('verifies providers before an atomic bootstrap and returns a bounded receipt', async () => {
    const { instance, store, calls } = installer();
    const venue = publishedVenue();
    const envelope = envelopeFor(venue);
    const receipt = await instance.install(envelope);
    expect(receipt).toMatchObject({
      outcome: 'installed',
      evidenceClass: 'provider-verified-contract',
      mapVersion: venue.mapVersion,
      previousMapVersion: null,
    });
    expect(calls).toEqual({ digest: 1, signature: 1 });
    expect(store.appends).toBe(1);
    expect(Object.isFrozen(store.current)).toBe(true);
    venue.name = 'Caller mutation';
    expect(store.current?.envelope.package.name).toBe('Loc8 Synthetic Operations Centre');
  });

  it('is idempotent for the exact installed package without another append', async () => {
    const { instance, store } = installer();
    const envelope = envelopeFor();
    await instance.install(envelope);
    const again = await instance.install(clone(envelope));
    expect(again.outcome).toBe('already-installed');
    expect(store.appends).toBe(1);
  });

  it('installs an update only when it descends from current map version', async () => {
    const { instance, store } = installer();
    const first = envelopeFor();
    await instance.install(first);
    const nextVenue = publishedVenue({ mapVersion: 'map.synthetic.published.003', parentMapVersion: first.mapVersion });
    const next = envelopeFor(nextVenue, { mode: 'update' });
    const receipt = await instance.install(next);
    expect(receipt.previousMapVersion).toBe(first.mapVersion);
    expect(store.current?.envelope.mapVersion).toBe(next.mapVersion);
  });

  it('never changes current state when the atomic append conflicts', async () => {
    const store = new MemoryStore();
    const firstInstaller = installer({ store }).instance;
    const first = envelopeFor();
    await firstInstaller.install(first);
    const before = store.current;
    store.appendMode = 'conflict';
    const nextVenue = publishedVenue({ mapVersion: 'map.synthetic.published.003', parentMapVersion: first.mapVersion });
    await expectCode(firstInstaller.install(envelopeFor(nextVenue, { mode: 'update' })), 'atomic-conflict');
    expect(store.current).toBe(before);
  });
});

type InvalidEnvelopeCase = [string, string, (value: VenueDistributionEnvelope) => void];

const invalidEnvelopeCases: InvalidEnvelopeCase[] = [
  ['unknown root field', 'envelope-shape', (value) => { (value as VenueDistributionEnvelope & { extra: boolean }).extra = true; }],
  ['wrong schema', 'schema-version', (value) => { (value.schemaVersion as string) = 'loc8.venue-distribution.v0'; }],
  ['invalid envelope ID', 'stable-id', (value) => { value.envelopeId = 'BAD ID'; }],
  ['unknown distribution mode', 'distribution-mode', (value) => { (value.mode as string) = 'replace'; }],
  ['invalid parent map ID', 'stable-id', (value) => { value.parentMapVersion = 'BAD'; }],
  ['invalid digest encoding', 'sha256', (value) => { value.contentSha256 = 'abc'; }],
  ['invalid issue time', 'time', (value) => { value.issuedAtMs = 0; }],
  ['expiry before issue', 'time-order', (value) => { value.expiresAtMs = value.issuedAtMs - 1; }],
  ['extra verification field', 'verification-shape', (value) => { (value.verification as VenueDistributionEnvelope['verification'] & { extra: boolean }).extra = true; }],
  ['invalid provider ID', 'stable-id', (value) => { value.verification.providerId = 'PROVIDER'; }],
  ['invalid key ID', 'stable-id', (value) => { value.verification.keyId = 'KEY'; }],
  ['invalid signature base64', 'signature-encoding', (value) => { value.verification.signatureBase64 = 'not base64!!!'; }],
  ['building field mismatch', 'building-mismatch', (value) => { value.buildingId = 'building.other'; }],
  ['package field mismatch', 'package-mismatch', (value) => { value.packageId = 'package.other'; }],
  ['map version mismatch', 'map-version-mismatch', (value) => { value.mapVersion = 'map.other.version'; }],
  ['parent version mismatch', 'parent-version-mismatch', (value) => { value.parentMapVersion = 'map.other.parent'; }],
  ['publication digest mismatch', 'digest-mismatch', (value) => { value.contentSha256 = DIGEST_B; }],
  ['invalid nested venue', 'stable-id', (value) => { value.package.levels[0].levelId = 'BAD'; }],
];

describe.each(invalidEnvelopeCases)('distribution validation: %s', (_name, expectedCode, mutate) => {
  it(`reports ${expectedCode}`, () => {
    const value = envelopeFor();
    mutate(value);
    expect(validateVenueDistributionEnvelope(value)).toEqual(expect.arrayContaining([expect.objectContaining({ code: expectedCode })]));
  });
});

describe('distribution fail-closed runtime cases', () => {
  it('rejects a future-issued envelope', async () => {
    const value = envelopeFor();
    value.issuedAtMs = NOW + 30_001;
    value.expiresAtMs = NOW + 90_000;
    await expectCode(installer().instance.install(value), 'issued-in-future');
  });

  it('rejects an expired envelope', async () => {
    const value = envelopeFor();
    value.issuedAtMs = NOW - 60_000;
    value.expiresAtMs = NOW;
    await expectCode(installer().instance.install(value), 'envelope-expired');
  });

  it('rejects a local demo on the production path', async () => {
    const local = createLocalDemoPublication(createSyntheticFourLevelVenue(), {
      packageId: 'package.synthetic.hq.local.002', mapVersion: 'map.synthetic.local.002',
      publishedAt: '2027-01-15T08:00:00.000Z', publishedBy: 'operator.command.01',
    }).package as VenuePackage;
    const value = envelopeFor(local, { contentSha256: DIGEST_A });
    await expectCode(installer().instance.install(value), 'package-not-published');
  });

  it('fails closed when the digest provider throws', async () => {
    await expectCode(installer({ digest: 'throw' }).instance.install(envelopeFor()), 'digest-provider-failed');
  });

  it('rejects a provider digest mismatch', async () => {
    await expectCode(installer({ digest: DIGEST_B }).instance.install(envelopeFor()), 'content-digest-rejected');
  });

  it('fails closed when the signature provider throws', async () => {
    await expectCode(installer({ signature: 'throw' }).instance.install(envelopeFor()), 'signature-provider-failed');
  });

  it('rejects a false signature result', async () => {
    await expectCode(installer({ signature: false }).instance.install(envelopeFor()), 'signature-rejected');
  });

  it('rejects an untrusted clock', async () => {
    await expectCode(installer({ nowMs: 0 }).instance.install(envelopeFor()), 'clock-unavailable');
  });

  it('fails closed when current state cannot be read', async () => {
    const store = new MemoryStore();
    store.readThrows = true;
    await expectCode(installer({ store }).instance.install(envelopeFor()), 'store-read-failed');
  });

  it('rejects corrupt current store state before version comparison', async () => {
    const store = new MemoryStore();
    store.current = { envelope: envelopeFor(), installedAtMs: 0 };
    const nextVenue = publishedVenue({ mapVersion: 'map.synthetic.published.003', parentMapVersion: store.current.envelope.mapVersion });
    await expectCode(installer({ store }).instance.install(envelopeFor(nextVenue, { mode: 'update' })), 'store-state-invalid');
    expect(store.appends).toBe(0);
  });

  it('rejects a current record returned from another site scope', async () => {
    const store = new MemoryStore();
    store.current = { envelope: envelopeFor(publishedVenue(), { siteId: 'site.other.scope' }), installedAtMs: NOW - 10_000 };
    const nextVenue = publishedVenue({ mapVersion: 'map.synthetic.published.003', parentMapVersion: store.current.envelope.mapVersion });
    await expectCode(installer({ store }).instance.install(envelopeFor(nextVenue, { mode: 'update' })), 'store-scope-conflict');
    expect(store.appends).toBe(0);
  });

  it('requires explicit bootstrap when no package is installed', async () => {
    const value = envelopeFor(publishedVenue(), { mode: 'update' });
    await expectCode(installer().instance.install(value), 'bootstrap-required');
  });

  it('requires update mode after bootstrap', async () => {
    const { instance } = installer();
    const first = envelopeFor();
    await instance.install(first);
    const nextVenue = publishedVenue({ mapVersion: 'map.synthetic.published.003', parentMapVersion: first.mapVersion });
    await expectCode(instance.install(envelopeFor(nextVenue, { mode: 'bootstrap' })), 'update-required');
  });

  it('rejects a fork that does not descend from current', async () => {
    const { instance } = installer();
    await instance.install(envelopeFor());
    const fork = publishedVenue({ mapVersion: 'map.synthetic.published.003', parentMapVersion: 'map.synthetic.other' });
    await expectCode(instance.install(envelopeFor(fork, { mode: 'update' })), 'lineage-conflict');
  });

  it('rejects different content claiming the current map version', async () => {
    const store = new MemoryStore();
    const firstInstaller = installer({ store, digest: DIGEST_A }).instance;
    const first = envelopeFor();
    await firstInstaller.install(first);
    const conflictingVenue = publishedVenue({ mapVersion: first.mapVersion, parentMapVersion: first.parentMapVersion, digest: DIGEST_B });
    const conflicting = envelopeFor(conflictingVenue, { mode: 'update' });
    await expectCode(installer({ store, digest: DIGEST_B }).instance.install(conflicting), 'version-content-conflict');
  });

  it('fails closed when append throws', async () => {
    const store = new MemoryStore();
    store.appendMode = 'throw';
    await expectCode(installer({ store }).instance.install(envelopeFor()), 'store-failed');
    expect(store.current).toBeNull();
  });
});

describe('simulation-only offline Gateway snapshot', () => {
  function localDemo() {
    return createLocalDemoPublication(createSyntheticFourLevelVenue(), {
      packageId: 'package.synthetic.hq.local.002', mapVersion: 'map.synthetic.local.002',
      publishedAt: '2027-01-15T08:00:00.000Z', publishedBy: 'operator.command.01',
    }).package as VenuePackage;
  }

  it('deep-freezes, serialises and reloads an explicitly simulated snapshot', () => {
    const venue = localDemo();
    const snapshot = createGatewaySimulationSnapshot(venue, {
      snapshotId: 'snapshot.gateway.local.001', gatewaySimulatorId: 'gateway.simulator.browser.01', installedAtMs: NOW,
    });
    expect(snapshot).toMatchObject({ schemaVersion: GATEWAY_SIMULATION_SCHEMA, evidenceClass: 'simulation-only' });
    expect(snapshot.packageBytes).toBeGreaterThan(1_000);
    expect(Object.isFrozen(snapshot.package.levels)).toBe(true);
    venue.name = 'Caller mutation';
    expect(snapshot.package.name).toBe('Loc8 Synthetic Operations Centre');
    const parsed = parseGatewaySimulationSnapshot(serializeGatewaySimulationSnapshot(snapshot));
    expect(parsed).toEqual(snapshot);
    expect(Object.isFrozen(parsed)).toBe(true);
  });

  it('rejects drafts and production-published packages on the simulation path', () => {
    expect(() => createGatewaySimulationSnapshot(createSyntheticFourLevelVenue(), {
      snapshotId: 'snapshot.gateway.local.001', gatewaySimulatorId: 'gateway.simulator.browser.01', installedAtMs: NOW,
    })).toThrow('simulation-requires-local-demo');
    expect(() => createGatewaySimulationSnapshot(publishedVenue(), {
      snapshotId: 'snapshot.gateway.local.001', gatewaySimulatorId: 'gateway.simulator.browser.01', installedAtMs: NOW,
    })).toThrow('simulation-requires-local-demo');
  });

  it('rejects corrupt JSON, fields, byte count and nested package state', () => {
    expect(() => parseGatewaySimulationSnapshot('{')).toThrow('invalid-simulation-json');
    const snapshot = createGatewaySimulationSnapshot(localDemo(), {
      snapshotId: 'snapshot.gateway.local.001', gatewaySimulatorId: 'gateway.simulator.browser.01', installedAtMs: NOW,
    });
    const extra = { ...clone(snapshot), extra: true };
    expect(validateGatewaySimulationSnapshot(extra)).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'simulation-shape' })]));
    const bytes = clone(snapshot);
    bytes.packageBytes += 1;
    expect(validateGatewaySimulationSnapshot(bytes)).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'package-bytes-mismatch' })]));
    const state = clone(snapshot);
    state.package.state = 'draft';
    state.package.publication.publishedAt = null;
    state.package.publication.publishedBy = null;
    expect(validateGatewaySimulationSnapshot(state)).toEqual(expect.arrayContaining([expect.objectContaining({ code: 'simulation-package-state' })]));
  });

  it('reconciles stable identity and lineage without comparing labels', () => {
    const installed = createGatewaySimulationSnapshot(localDemo(), {
      snapshotId: 'snapshot.gateway.local.001', gatewaySimulatorId: 'gateway.simulator.browser.01', installedAtMs: NOW,
    });
    expect(reconcileVenueReplica(null, installed.package)).toMatchObject({ outcome: 'not-installed' });
    expect(reconcileVenueReplica(installed, installed.package)).toMatchObject({ outcome: 'in-sync' });
    expect(reconcileVenueReplica(installed, { ...installed.package, mapVersion: installed.package.parentMapVersion! })).toMatchObject({ outcome: 'update-available' });
    expect(reconcileVenueReplica(installed, {
      ...installed.package, packageId: 'package.successor', mapVersion: 'map.successor', parentMapVersion: installed.mapVersion,
    })).toMatchObject({ outcome: 'client-ahead' });
    expect(reconcileVenueReplica(installed, {
      ...installed.package, buildingId: 'building.other', mapVersion: 'map.other', parentMapVersion: null,
    })).toMatchObject({ outcome: 'identity-conflict' });
  });
});

it('uses the dedicated error class for distribution failures', () => {
  expect(new VenueDistributionError('example')).toBeInstanceOf(Error);
});
