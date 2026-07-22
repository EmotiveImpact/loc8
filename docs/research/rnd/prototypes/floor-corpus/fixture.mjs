import { FloorCorpusRecorder, SCHEMA_VERSION } from './floor-corpus.mjs';

const BASE_WALL_MS = 1_784_675_200_000;

function wallAt(monotonicUs) {
  return BASE_WALL_MS + Math.round(monotonicUs / 1000);
}

export function createManifest({ pressureCount = 21, includeMotion = true } = {}) {
  if (!Number.isSafeInteger(pressureCount) || pressureCount < 3) {
    throw new Error('pressureCount must be a safe integer >= 3');
  }
  const analysisStartMonotonicUs = 1_000_000;
  const analysisEndMonotonicUs = analysisStartMonotonicUs + (pressureCount - 1) * 500_000;
  return {
    schemaVersion: SCHEMA_VERSION,
    recorderVersion: 'floor-recorder.0.1.0',
    protocolVersion: 'floor-01.e03.v1',
    createdAtMs: BASE_WALL_MS,
    sessionId: 'session-synthetic-a001',
    studyId: 'study-floor-contract-a001',
    participantId: 'participant-pseudonym-a001',
    building: {
      buildingId: 'building-synthetic-a001',
      mapVersion: 'map-synthetic-v1',
      levels: [
        { levelId: 'level-b1', levelRef: 'B1', ordinal: -1, elevationM: -3.2 },
        { levelId: 'level-ground', levelRef: 'G', ordinal: 0, elevationM: 0 },
        { levelId: 'level-2a', levelRef: '2A', ordinal: 2, elevationM: 6.8 }
      ],
      connectors: [
        {
          connectorId: 'connector-east-stairs',
          modes: ['stairs'],
          landings: [
            { landingId: 'landing-east-ground', levelId: 'level-ground' },
            { landingId: 'landing-east-2a', levelId: 'level-2a' }
          ]
        }
      ]
    },
    device: {
      profileId: 'device-profile-synthetic-a001',
      platform: 'ios',
      osVersion: 'synthetic-1',
      appBuild: 'loc8-rd.0.1.0-1',
      model: 'Synthetic phone cohort A',
      carryPosition: 'hand'
    },
    capabilities: [
      {
        source: 'barometer-primary',
        kind: 'pressure',
        available: true,
        permission: 'granted',
        requestedIntervalMs: 500,
        unit: 'hpa',
        nativeTimestampUnit: 'seconds'
      },
      {
        source: 'device-motion-primary',
        kind: 'motion',
        available: includeMotion,
        permission: includeMotion ? 'granted' : 'unavailable',
        requestedIntervalMs: includeMotion ? 100 : 0,
        unit: 'mps2-rps',
        nativeTimestampUnit: 'seconds'
      }
    ],
    clock: {
      monotonicSource: 'synthetic-monotonic-microseconds',
      wallSource: 'synthetic-reference-wall-milliseconds',
      maxUncertaintyMs: 100,
      maxDriftMsPerMinute: 5
    },
    consent: {
      protocolVersion: 'consent-floor-rd-v1',
      consentedAtMs: BASE_WALL_MS - 60_000,
      purposes: ['floor-transition-research', 'instrument-validation'],
      withdrawalHandle: 'withdrawal-a001'
    },
    retention: {
      class: 'research-raw-12m',
      deleteAfterMs: BASE_WALL_MS + 365 * 24 * 60 * 60 * 1000,
      encryptedAtRest: true,
      accessLogging: true,
      rawDataLocation: 'research://floor-01/synthetic/session-a001'
    },
    radioPrivacy: {
      identifierForm: 'site-keyed-hmac',
      keyEpoch: 'radio-key-epoch-a001'
    },
    analysis: {
      startMonotonicUs: analysisStartMonotonicUs,
      endMonotonicUs: analysisEndMonotonicUs,
      maxTruthGapUs: 100_000
    },
    exclusions: ['synthetic-not-device-evidence', 'synthetic-not-building-evidence']
  };
}

export function createCanonicalFixture(options = {}) {
  const manifest = createManifest(options);
  const recorder = new FloorCorpusRecorder(manifest);
  const startUs = manifest.analysis.startMonotonicUs;
  const endUs = manifest.analysis.endMonotonicUs;

  recorder.start({ monotonicUs: 0, wallTimeMs: wallAt(0), clockUncertaintyMs: 20 });
  recorder.record({
    kind: 'clock-sync',
    source: 'clock-reference',
    monotonicUs: 100_000,
    wallTimeMs: wallAt(100_000),
    clockUncertaintyMs: 20,
    payload: {
      localSendUs: 90_000,
      localReceiveUs: 110_000,
      referenceWallTimeMs: wallAt(100_000),
      offsetMs: 2,
      rttMs: 20,
      uncertaintyMs: 20
    }
  });

  const scheduled = [];
  const pressureCount = options.pressureCount ?? 21;
  for (let index = 0; index < pressureCount; index += 1) {
    const monotonicUs = startUs + index * 500_000;
    const progress = (monotonicUs - startUs) / Math.max(1, endUs - startUs);
    scheduled.push({
      kind: 'pressure',
      source: 'barometer-primary',
      monotonicUs,
      wallTimeMs: wallAt(monotonicUs),
      clockUncertaintyMs: 20,
      payload: {
        pressureHpa: 1013.2 - 0.82 * progress,
        relativeAltitudeM: 6.8 * progress,
        nativeTimestamp: monotonicUs / 1_000_000,
        nativeTimestampUnit: 'seconds'
      }
    });
  }

  if (options.includeMotion !== false) {
    const motionCount = Math.floor((endUs - startUs) / 100_000) + 1;
    for (let index = 0; index < motionCount; index += 1) {
      const monotonicUs = startUs + index * 100_000;
      scheduled.push({
        kind: 'motion',
        source: 'device-motion-primary',
        monotonicUs,
        wallTimeMs: wallAt(monotonicUs),
        clockUncertaintyMs: 20,
        payload: {
          accelerationIncludingGravityMps2: {
            x: Number((0.2 * Math.sin(index / 4)).toFixed(6)),
            y: Number((0.1 * Math.cos(index / 5)).toFixed(6)),
            z: Number((9.81 + 0.3 * Math.sin(index / 3)).toFixed(6))
          },
          userAccelerationMps2: { x: 0.01, y: -0.02, z: 0.03 },
          rotationRateRps: { x: 0.01, y: -0.02, z: 0.03 },
          screenOrientationDeg: 0,
          nativeTimestamp: monotonicUs / 1_000_000,
          nativeTimestampUnit: 'seconds'
        }
      });
    }
  }

  scheduled.sort((left, right) =>
    left.monotonicUs - right.monotonicUs || left.kind.localeCompare(right.kind)
  );
  for (const event of scheduled) recorder.record(event);

  const postAnalysisUs = endUs + 100_000;
  recorder.record({
    kind: 'clock-sync',
    source: 'clock-reference',
    monotonicUs: postAnalysisUs,
    wallTimeMs: wallAt(postAnalysisUs),
    clockUncertaintyMs: 20,
    payload: {
      localSendUs: postAnalysisUs - 10_000,
      localReceiveUs: postAnalysisUs + 10_000,
      referenceWallTimeMs: wallAt(postAnalysisUs),
      offsetMs: 2.25,
      rttMs: 20,
      uncertaintyMs: 20
    }
  });

  const firstBoundary = startUs + Math.floor((endUs - startUs) * 0.3);
  const secondBoundary = startUs + Math.floor((endUs - startUs) * 0.7);
  const segments = [
    {
      segmentId: 'segment-stationary-ground',
      category: 'stationary',
      startUs,
      endUs: firstBoundary,
      sourceLevelId: 'level-ground',
      destinationLevelId: 'level-ground',
      mode: 'unknown',
      direction: 'level',
      confirmedBy: 'both'
    },
    {
      segmentId: 'segment-transition-east-stairs',
      category: 'transition',
      startUs: firstBoundary,
      endUs: secondBoundary,
      sourceLevelId: 'level-ground',
      destinationLevelId: 'level-2a',
      connectorId: 'connector-east-stairs',
      startLandingId: 'landing-east-ground',
      endLandingId: 'landing-east-2a',
      mode: 'stairs',
      direction: 'up',
      confirmedBy: 'both'
    },
    {
      segmentId: 'segment-control-2a',
      category: 'same-floor-control',
      startUs: secondBoundary,
      endUs,
      sourceLevelId: 'level-2a',
      destinationLevelId: 'level-2a',
      mode: 'unknown',
      direction: 'level',
      confirmedBy: 'both'
    }
  ];
  segments.forEach((payload, index) => recorder.record({
    kind: 'ground-truth-segment',
    source: 'truth-ui',
    monotonicUs: postAnalysisUs + 100_000 + index * 100_000,
    wallTimeMs: wallAt(postAnalysisUs + 100_000 + index * 100_000),
    clockUncertaintyMs: 20,
    payload
  }));

  const endEventUs = postAnalysisUs + 500_000;
  recorder.end({
    monotonicUs: endEventUs,
    wallTimeMs: wallAt(endEventUs),
    clockUncertaintyMs: 20,
    reason: 'completed'
  });
  return { manifest: recorder.manifest, events: recorder.events, recorder };
}
