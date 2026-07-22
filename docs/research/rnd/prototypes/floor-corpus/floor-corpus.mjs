const SCHEMA_VERSION = 'loc8.floor-corpus.v1';

export { SCHEMA_VERSION };

export const EVENT_KINDS = Object.freeze([
  'session-start',
  'session-end',
  'clock-sync',
  'sensor-status',
  'pressure',
  'motion',
  'steps',
  'magnetic-field',
  'radio-observation',
  'phone-state',
  'ground-truth-segment',
  'ground-truth-point',
  'operator-note',
]);

const EVENT_KIND_SET = new Set(EVENT_KINDS);
const PERIODIC_KINDS = new Set([
  'pressure',
  'motion',
  'steps',
  'magnetic-field',
  'radio-observation',
  'phone-state',
]);
const TRANSITION_MODES = new Set(['stairs', 'lift', 'escalator', 'ramp', 'unknown']);
const DIRECTIONS = new Set(['up', 'down', 'level']);
const TRUTH_CATEGORIES = new Set(['stationary', 'transition', 'same-floor-control']);
const CONFIRMERS = new Set(['participant', 'observer', 'both']);
const OPERATOR_CODES = new Set([
  'sensor-obstructed',
  'route-deviation',
  'manual-pause',
  'environment-change',
  'other-coded',
]);
const FORBIDDEN_KEYS = new Set([
  'name',
  'fullname',
  'firstname',
  'lastname',
  'email',
  'phone',
  'phonenumber',
  'accountid',
  'userid',
  'ssid',
  'bssid',
  'mac',
  'macaddress',
  'latitude',
  'longitude',
  'gps',
  'freetext',
]);
const MAC_VALUE = /^(?:(?:[0-9a-f]{2}[:-]){5}[0-9a-f]{2}|[0-9a-f]{4}(?:\.[0-9a-f]{4}){2})$/i;
const EMAIL_VALUE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STABLE_ID = /^[a-z][a-z0-9._-]{2,95}$/;
const RADIO_ID = /^tx_[a-z0-9_-]{8,96}$/;
const RESEARCH_LOCATION = /^research:\/\/[a-z0-9._/-]{3,240}$/;
const MAX_RAW_RETENTION_MS = 366 * 24 * 60 * 60 * 1000;
const UNITS_BY_KIND = new Map([
  ['pressure', new Set(['hpa'])],
  ['motion', new Set(['mps2-rps'])],
  ['steps', new Set(['count'])],
  ['magnetic-field', new Set(['microtesla'])],
  ['radio-observation', new Set(['dbm'])],
  ['phone-state', new Set(['state'])],
]);

const PAYLOAD_KEYS = new Map([
  ['session-start', new Set(['reason'])],
  ['session-end', new Set(['reason'])],
  ['clock-sync', new Set([
    'localSendUs', 'localReceiveUs', 'referenceWallTimeMs', 'offsetMs', 'rttMs', 'uncertaintyMs',
  ])],
  ['sensor-status', new Set(['status'])],
  ['pressure', new Set(['pressureHpa', 'relativeAltitudeM', 'nativeTimestamp', 'nativeTimestampUnit'])],
  ['motion', new Set([
    'accelerationIncludingGravityMps2', 'userAccelerationMps2', 'rotationRateRps',
    'screenOrientationDeg', 'nativeTimestamp', 'nativeTimestampUnit',
  ])],
  ['steps', new Set(['cumulativeSteps', 'nativeTimestamp', 'nativeTimestampUnit'])],
  ['magnetic-field', new Set(['microtesla', 'nativeTimestamp', 'nativeTimestampUnit'])],
  ['radio-observation', new Set([
    'radio', 'transmitterId', 'keyEpoch', 'rssiDbm', 'nativeTimestamp', 'nativeTimestampUnit',
  ])],
  ['phone-state', new Set([
    'appState', 'screenState', 'lowPowerMode', 'nativeTimestamp', 'nativeTimestampUnit',
  ])],
  ['ground-truth-segment', new Set([
    'segmentId', 'category', 'startUs', 'endUs', 'sourceLevelId', 'destinationLevelId',
    'connectorId', 'startLandingId', 'endLandingId', 'mode', 'direction', 'confirmedBy',
  ])],
  ['ground-truth-point', new Set([
    'pointId', 'action', 'levelId', 'connectorId', 'landingId', 'confirmedBy',
  ])],
  ['operator-note', new Set(['code'])],
]);
const MANIFEST_KEYS = new Set([
  'schemaVersion', 'recorderVersion', 'protocolVersion', 'createdAtMs', 'sessionId',
  'studyId', 'participantId', 'building', 'device', 'capabilities', 'clock', 'consent',
  'retention', 'radioPrivacy', 'analysis', 'exclusions',
]);
const BUILDING_KEYS = new Set(['buildingId', 'mapVersion', 'levels', 'connectors']);
const LEVEL_KEYS = new Set(['levelId', 'levelRef', 'ordinal', 'elevationM']);
const CONNECTOR_KEYS = new Set(['connectorId', 'modes', 'landings']);
const LANDING_KEYS = new Set(['landingId', 'levelId']);
const DEVICE_KEYS = new Set(['profileId', 'platform', 'osVersion', 'appBuild', 'model', 'carryPosition']);
const CAPABILITY_KEYS = new Set([
  'source', 'kind', 'available', 'permission', 'requestedIntervalMs', 'unit', 'nativeTimestampUnit',
]);
const CLOCK_KEYS = new Set(['monotonicSource', 'wallSource', 'maxUncertaintyMs', 'maxDriftMsPerMinute']);
const CONSENT_KEYS = new Set(['protocolVersion', 'consentedAtMs', 'purposes', 'withdrawalHandle']);
const RETENTION_KEYS = new Set(['class', 'deleteAfterMs', 'encryptedAtRest', 'accessLogging', 'rawDataLocation']);
const RADIO_PRIVACY_KEYS = new Set(['identifierForm', 'keyEpoch']);
const ANALYSIS_KEYS = new Set(['startMonotonicUs', 'endMonotonicUs', 'maxTruthGapUs']);
const EVENT_KEYS = new Set([
  'schemaVersion', 'sessionId', 'sequence', 'kind', 'monotonicUs', 'wallTimeMs',
  'clockUncertaintyMs', 'source', 'payload',
]);
const VECTOR_KEYS = new Set(['x', 'y', 'z']);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function isInteger(value) {
  return Number.isSafeInteger(value);
}

function issue(code, path, message) {
  return { code, path, message };
}

function pushRequired(errors, object, fields, path) {
  if (!isRecord(object)) {
    errors.push(issue('type', path, 'must be an object'));
    return false;
  }
  for (const field of fields) {
    if (!(field in object)) errors.push(issue('required', `${path}.${field}`, 'is required'));
  }
  return true;
}

function validateStableId(errors, value, path) {
  if (typeof value !== 'string' || !STABLE_ID.test(value)) {
    errors.push(issue('stable-id', path, 'must be a lower-case stable identifier'));
  }
}

function rejectUnexpectedKeys(errors, object, allowed, path) {
  for (const key of Object.keys(object)) {
    if (!allowed.has(key)) errors.push(issue('unexpected-field', `${path}.${key}`, 'is not allowed by this event contract'));
  }
}

function scanForbidden(value, path = '$', errors = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanForbidden(item, `${path}[${index}]`, errors));
    return errors;
  }
  if (!isRecord(value)) return errors;

  for (const [key, child] of Object.entries(value)) {
    const normalisedKey = key.toLowerCase().replaceAll(/[_-]/g, '');
    const childPath = `${path}.${key}`;
    if (FORBIDDEN_KEYS.has(normalisedKey)) {
      errors.push(issue('forbidden-field', childPath, 'direct or raw identifying field is forbidden'));
    }
    if (typeof child === 'string' && (MAC_VALUE.test(child) || EMAIL_VALUE.test(child))) {
      errors.push(issue('forbidden-value', childPath, 'raw MAC address or email-like value is forbidden'));
    }
    scanForbidden(child, childPath, errors);
  }
  return errors;
}

function levelIndex(manifest) {
  return new Map((manifest?.building?.levels ?? []).map((level) => [level.levelId, level]));
}

function connectorIndex(manifest) {
  return new Map((manifest?.building?.connectors ?? []).map((connector) => [connector.connectorId, connector]));
}

function capabilityIndex(manifest) {
  return new Map((manifest?.capabilities ?? []).map((capability) => [capability.source, capability]));
}

export function validateManifest(manifest) {
  const errors = [];
  if (!pushRequired(errors, manifest, [
    'schemaVersion',
    'recorderVersion',
    'protocolVersion',
    'createdAtMs',
    'sessionId',
    'studyId',
    'participantId',
    'building',
    'device',
    'capabilities',
    'clock',
    'consent',
    'retention',
    'radioPrivacy',
    'analysis',
    'exclusions',
  ], '$.manifest')) return errors;
  rejectUnexpectedKeys(errors, manifest, MANIFEST_KEYS, '$.manifest');

  if (manifest.schemaVersion !== SCHEMA_VERSION) {
    errors.push(issue('schema-version', '$.manifest.schemaVersion', `must equal ${SCHEMA_VERSION}`));
  }
  validateStableId(errors, manifest.recorderVersion, '$.manifest.recorderVersion');
  validateStableId(errors, manifest.protocolVersion, '$.manifest.protocolVersion');
  if (!isInteger(manifest.createdAtMs) || manifest.createdAtMs <= 0) {
    errors.push(issue('time', '$.manifest.createdAtMs', 'must be a positive integer millisecond time'));
  }
  for (const [key, path] of [
    ['sessionId', '$.manifest.sessionId'],
    ['studyId', '$.manifest.studyId'],
    ['participantId', '$.manifest.participantId'],
  ]) validateStableId(errors, manifest[key], path);

  if (pushRequired(errors, manifest.building, ['buildingId', 'mapVersion', 'levels', 'connectors'], '$.manifest.building')) {
    rejectUnexpectedKeys(errors, manifest.building, BUILDING_KEYS, '$.manifest.building');
    validateStableId(errors, manifest.building.buildingId, '$.manifest.building.buildingId');
    validateStableId(errors, manifest.building.mapVersion, '$.manifest.building.mapVersion');
    if (!Array.isArray(manifest.building.levels) || manifest.building.levels.length < 2) {
      errors.push(issue('levels', '$.manifest.building.levels', 'must contain at least two semantic levels'));
    } else {
      const ids = new Set();
      const ordinals = new Set();
      for (const [index, level] of manifest.building.levels.entries()) {
        const path = `$.manifest.building.levels[${index}]`;
        if (!pushRequired(errors, level, ['levelId', 'levelRef', 'ordinal', 'elevationM'], path)) continue;
        rejectUnexpectedKeys(errors, level, LEVEL_KEYS, path);
        validateStableId(errors, level.levelId, `${path}.levelId`);
        if (ids.has(level.levelId)) errors.push(issue('duplicate', `${path}.levelId`, 'must be unique'));
        ids.add(level.levelId);
        if (typeof level.levelRef !== 'string' || level.levelRef.length < 1 || level.levelRef.length > 32) {
          errors.push(issue('level-ref', `${path}.levelRef`, 'must be a 1–32 character display label'));
        }
        if (!isFiniteNumber(level.ordinal) || !isFiniteNumber(level.elevationM)) {
          errors.push(issue('level-order', path, 'ordinal and elevationM must be finite numbers'));
        }
        if (ordinals.has(level.ordinal)) errors.push(issue('duplicate', `${path}.ordinal`, 'must be unique'));
        ordinals.add(level.ordinal);
      }
    }

    if (!Array.isArray(manifest.building.connectors)) {
      errors.push(issue('connectors', '$.manifest.building.connectors', 'must be an array'));
    } else {
      const connectors = new Set();
      const globalLandingIds = new Set();
      const levels = levelIndex(manifest);
      for (const [index, connector] of manifest.building.connectors.entries()) {
        const path = `$.manifest.building.connectors[${index}]`;
        if (!pushRequired(errors, connector, ['connectorId', 'modes', 'landings'], path)) continue;
        rejectUnexpectedKeys(errors, connector, CONNECTOR_KEYS, path);
        validateStableId(errors, connector.connectorId, `${path}.connectorId`);
        if (connectors.has(connector.connectorId)) errors.push(issue('duplicate', `${path}.connectorId`, 'must be unique'));
        connectors.add(connector.connectorId);
        if (!Array.isArray(connector.modes) || connector.modes.length === 0 ||
            connector.modes.some((mode) => !TRANSITION_MODES.has(mode) || mode === 'unknown')) {
          errors.push(issue('connector-mode', `${path}.modes`, 'must contain declared physical connector modes'));
        }
        if (!Array.isArray(connector.landings) || connector.landings.length < 2) {
          errors.push(issue('landings', `${path}.landings`, 'must contain at least two landings'));
        } else {
          const landingIds = new Set();
          const landedLevels = new Set();
          for (const [landingIndex, landing] of connector.landings.entries()) {
            const landingPath = `${path}.landings[${landingIndex}]`;
            if (!pushRequired(errors, landing, ['landingId', 'levelId'], landingPath)) continue;
            rejectUnexpectedKeys(errors, landing, LANDING_KEYS, landingPath);
            validateStableId(errors, landing.landingId, `${landingPath}.landingId`);
            if (landingIds.has(landing.landingId)) errors.push(issue('duplicate', `${landingPath}.landingId`, 'must be unique'));
            landingIds.add(landing.landingId);
            if (globalLandingIds.has(landing.landingId)) errors.push(issue('duplicate', `${landingPath}.landingId`, 'must be globally unique'));
            globalLandingIds.add(landing.landingId);
            if (!levels.has(landing.levelId)) errors.push(issue('unknown-level', `${landingPath}.levelId`, 'must reference a declared level'));
            if (landedLevels.has(landing.levelId)) errors.push(issue('duplicate', `${landingPath}.levelId`, 'connector may have only one landing per level'));
            landedLevels.add(landing.levelId);
          }
        }
      }
    }
  }

  if (pushRequired(errors, manifest.device, ['profileId', 'platform', 'osVersion', 'appBuild', 'model', 'carryPosition'], '$.manifest.device')) {
    rejectUnexpectedKeys(errors, manifest.device, DEVICE_KEYS, '$.manifest.device');
    validateStableId(errors, manifest.device.profileId, '$.manifest.device.profileId');
    validateStableId(errors, manifest.device.appBuild, '$.manifest.device.appBuild');
    if (!['ios', 'android'].includes(manifest.device.platform)) {
      errors.push(issue('platform', '$.manifest.device.platform', 'must be ios or android'));
    }
    if (!['hand', 'pocket', 'bag', 'body-mount', 'unknown'].includes(manifest.device.carryPosition)) {
      errors.push(issue('carry-position', '$.manifest.device.carryPosition', 'is not a declared carry position'));
    }
    for (const field of ['osVersion', 'model']) {
      if (typeof manifest.device[field] !== 'string' || manifest.device[field].length < 1 || manifest.device[field].length > 128) {
        errors.push(issue('device-profile', `$.manifest.device.${field}`, 'must be a 1–128 character catalogue value'));
      }
    }
  }

  if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) {
    errors.push(issue('capabilities', '$.manifest.capabilities', 'must declare at least one source'));
  } else {
    const sources = new Set();
    for (const [index, capability] of manifest.capabilities.entries()) {
      const path = `$.manifest.capabilities[${index}]`;
      if (!pushRequired(errors, capability, [
        'source', 'kind', 'available', 'permission', 'requestedIntervalMs', 'unit', 'nativeTimestampUnit',
      ], path)) continue;
      rejectUnexpectedKeys(errors, capability, CAPABILITY_KEYS, path);
      validateStableId(errors, capability.source, `${path}.source`);
      if (sources.has(capability.source)) errors.push(issue('duplicate', `${path}.source`, 'must be unique'));
      sources.add(capability.source);
      if (!PERIODIC_KINDS.has(capability.kind)) errors.push(issue('capability-kind', `${path}.kind`, 'must be a periodic event kind'));
      if (typeof capability.available !== 'boolean') errors.push(issue('type', `${path}.available`, 'must be boolean'));
      if (!['granted', 'denied', 'unavailable', 'not-required'].includes(capability.permission)) {
        errors.push(issue('permission', `${path}.permission`, 'is not a supported permission state'));
      }
      if (capability.available && (!isFiniteNumber(capability.requestedIntervalMs) || capability.requestedIntervalMs <= 0)) {
        errors.push(issue('interval', `${path}.requestedIntervalMs`, 'must be positive for an available stream'));
      }
      if (!capability.available && (!isFiniteNumber(capability.requestedIntervalMs) || capability.requestedIntervalMs !== 0)) {
        errors.push(issue('interval', `${path}.requestedIntervalMs`, 'must be zero for an unavailable stream'));
      }
      if (capability.available && ['denied', 'unavailable'].includes(capability.permission)) {
        errors.push(issue('permission', `${path}.permission`, 'cannot make a denied or unavailable stream available'));
      }
      if (!capability.available && capability.permission === 'granted') {
        errors.push(issue('permission', `${path}.permission`, 'cannot grant an unavailable stream'));
      }
      if (!UNITS_BY_KIND.get(capability.kind)?.has(capability.unit)) {
        errors.push(issue('unit', `${path}.unit`, 'does not match the declared event kind'));
      }
      if (!['seconds', 'milliseconds', 'nanoseconds', 'none'].includes(capability.nativeTimestampUnit)) {
        errors.push(issue('timestamp-unit', `${path}.nativeTimestampUnit`, 'is not supported'));
      }
    }
  }

  if (pushRequired(errors, manifest.clock, ['monotonicSource', 'wallSource', 'maxUncertaintyMs', 'maxDriftMsPerMinute'], '$.manifest.clock')) {
    rejectUnexpectedKeys(errors, manifest.clock, CLOCK_KEYS, '$.manifest.clock');
    validateStableId(errors, manifest.clock.monotonicSource, '$.manifest.clock.monotonicSource');
    validateStableId(errors, manifest.clock.wallSource, '$.manifest.clock.wallSource');
    if (!isFiniteNumber(manifest.clock.maxUncertaintyMs) || manifest.clock.maxUncertaintyMs <= 0 || manifest.clock.maxUncertaintyMs > 100) {
      errors.push(issue('clock-policy', '$.manifest.clock.maxUncertaintyMs', 'must be >0 and <=100 ms'));
    }
    if (!isFiniteNumber(manifest.clock.maxDriftMsPerMinute) || manifest.clock.maxDriftMsPerMinute <= 0 || manifest.clock.maxDriftMsPerMinute > 5) {
      errors.push(issue('clock-policy', '$.manifest.clock.maxDriftMsPerMinute', 'must be >0 and <=5 ms/min'));
    }
  }

  if (pushRequired(errors, manifest.consent, ['protocolVersion', 'consentedAtMs', 'purposes', 'withdrawalHandle'], '$.manifest.consent')) {
    rejectUnexpectedKeys(errors, manifest.consent, CONSENT_KEYS, '$.manifest.consent');
    validateStableId(errors, manifest.consent.protocolVersion, '$.manifest.consent.protocolVersion');
    if (!isInteger(manifest.consent.consentedAtMs) || manifest.consent.consentedAtMs <= 0 || manifest.consent.consentedAtMs > manifest.createdAtMs) {
      errors.push(issue('consent', '$.manifest.consent.consentedAtMs', 'must be a positive integer no later than session creation'));
    }
    if (!Array.isArray(manifest.consent.purposes) || manifest.consent.purposes.length === 0) {
      errors.push(issue('consent', '$.manifest.consent.purposes', 'must declare at least one approved purpose'));
    } else {
      manifest.consent.purposes.forEach((purpose, index) =>
        validateStableId(errors, purpose, `$.manifest.consent.purposes[${index}]`));
    }
    validateStableId(errors, manifest.consent.withdrawalHandle, '$.manifest.consent.withdrawalHandle');
  }

  if (pushRequired(errors, manifest.retention, ['class', 'deleteAfterMs', 'encryptedAtRest', 'accessLogging', 'rawDataLocation'], '$.manifest.retention')) {
    rejectUnexpectedKeys(errors, manifest.retention, RETENTION_KEYS, '$.manifest.retention');
    validateStableId(errors, manifest.retention.class, '$.manifest.retention.class');
    if (!isInteger(manifest.retention.deleteAfterMs) || manifest.retention.deleteAfterMs <= manifest.createdAtMs) {
      errors.push(issue('retention', '$.manifest.retention.deleteAfterMs', 'must be a future integer time'));
    }
    if (manifest.retention.encryptedAtRest !== true) {
      errors.push(issue('retention', '$.manifest.retention.encryptedAtRest', 'must be true for raw research data'));
    }
    if (manifest.retention.accessLogging !== true) {
      errors.push(issue('retention', '$.manifest.retention.accessLogging', 'must be true for raw research data'));
    }
    if (isInteger(manifest.retention.deleteAfterMs) && isInteger(manifest.createdAtMs) &&
        manifest.retention.deleteAfterMs - manifest.createdAtMs > MAX_RAW_RETENTION_MS) {
      errors.push(issue('retention', '$.manifest.retention.deleteAfterMs', 'v1 raw retention must not exceed 366 days'));
    }
    if (typeof manifest.retention.rawDataLocation !== 'string' || !RESEARCH_LOCATION.test(manifest.retention.rawDataLocation)) {
      errors.push(issue('retention', '$.manifest.retention.rawDataLocation', 'must use an opaque research:// location'));
    }
  }

  if (pushRequired(errors, manifest.radioPrivacy, ['identifierForm', 'keyEpoch'], '$.manifest.radioPrivacy')) {
    rejectUnexpectedKeys(errors, manifest.radioPrivacy, RADIO_PRIVACY_KEYS, '$.manifest.radioPrivacy');
    if (manifest.radioPrivacy.identifierForm !== 'site-keyed-hmac') {
      errors.push(issue('radio-privacy', '$.manifest.radioPrivacy.identifierForm', 'must be site-keyed-hmac'));
    }
    validateStableId(errors, manifest.radioPrivacy.keyEpoch, '$.manifest.radioPrivacy.keyEpoch');
  }

  if (pushRequired(errors, manifest.analysis, ['startMonotonicUs', 'endMonotonicUs', 'maxTruthGapUs'], '$.manifest.analysis')) {
    rejectUnexpectedKeys(errors, manifest.analysis, ANALYSIS_KEYS, '$.manifest.analysis');
    if (!isInteger(manifest.analysis.startMonotonicUs) || !isInteger(manifest.analysis.endMonotonicUs) ||
        manifest.analysis.endMonotonicUs <= manifest.analysis.startMonotonicUs) {
      errors.push(issue('analysis-window', '$.manifest.analysis', 'must contain an increasing safe-integer interval'));
    }
    if (!isInteger(manifest.analysis.maxTruthGapUs) || manifest.analysis.maxTruthGapUs < 0 || manifest.analysis.maxTruthGapUs > 100_000) {
      errors.push(issue('analysis-window', '$.manifest.analysis.maxTruthGapUs', 'must be between 0 and 100000 us'));
    }
  }

  if (!Array.isArray(manifest.exclusions)) {
    errors.push(issue('exclusions', '$.manifest.exclusions', 'must be an array'));
  } else {
    manifest.exclusions.forEach((exclusion, index) =>
      validateStableId(errors, exclusion, `$.manifest.exclusions[${index}]`));
  }
  scanForbidden(manifest, '$.manifest', errors);
  return errors;
}

function validateVector(errors, vector, path, limit) {
  if (!pushRequired(errors, vector, ['x', 'y', 'z'], path)) return;
  rejectUnexpectedKeys(errors, vector, VECTOR_KEYS, path);
  for (const axis of ['x', 'y', 'z']) {
    if (!isFiniteNumber(vector[axis]) || Math.abs(vector[axis]) > limit) {
      errors.push(issue('range', `${path}.${axis}`, `must be finite with absolute value <= ${limit}`));
    }
  }
}

function validateTruthPayload(errors, payload, path, manifest) {
  if (!pushRequired(errors, payload, [
    'segmentId', 'category', 'startUs', 'endUs', 'sourceLevelId', 'destinationLevelId',
    'mode', 'direction', 'confirmedBy',
  ], path)) return;
  validateStableId(errors, payload.segmentId, `${path}.segmentId`);
  if (!TRUTH_CATEGORIES.has(payload.category)) errors.push(issue('truth-category', `${path}.category`, 'is not supported'));
  if (!isInteger(payload.startUs) || !isInteger(payload.endUs) || payload.endUs <= payload.startUs) {
    errors.push(issue('truth-time', path, 'must contain an increasing safe-integer interval'));
  }
  const levels = levelIndex(manifest);
  if (!levels.has(payload.sourceLevelId)) errors.push(issue('unknown-level', `${path}.sourceLevelId`, 'is not declared'));
  if (!levels.has(payload.destinationLevelId)) errors.push(issue('unknown-level', `${path}.destinationLevelId`, 'is not declared'));
  if (!TRANSITION_MODES.has(payload.mode)) errors.push(issue('transition-mode', `${path}.mode`, 'is not supported'));
  if (!DIRECTIONS.has(payload.direction)) errors.push(issue('direction', `${path}.direction`, 'is not supported'));
  if (!CONFIRMERS.has(payload.confirmedBy)) errors.push(issue('confirmed-by', `${path}.confirmedBy`, 'is not supported'));

  const sameLevel = payload.sourceLevelId === payload.destinationLevelId;
  if (payload.category === 'transition') {
    if (sameLevel) errors.push(issue('truth-transition', path, 'transition must change semantic level'));
    if (typeof payload.connectorId !== 'string') {
      errors.push(issue('connector', `${path}.connectorId`, 'is required for a transition'));
    } else {
      const connector = connectorIndex(manifest).get(payload.connectorId);
      if (!connector) {
        errors.push(issue('unknown-connector', `${path}.connectorId`, 'is not declared'));
      } else {
        const connectedLevels = new Set(connector.landings.map((landing) => landing.levelId));
        const landings = new Map(connector.landings.map((landing) => [landing.landingId, landing]));
        if (!connectedLevels.has(payload.sourceLevelId) || !connectedLevels.has(payload.destinationLevelId)) {
          errors.push(issue('connector-topology', `${path}.connectorId`, 'does not connect both labelled levels'));
        }
        if (payload.mode !== 'unknown' && !connector.modes.includes(payload.mode)) {
          errors.push(issue('connector-mode', `${path}.mode`, 'is not supported by the connector'));
        }
        if (typeof payload.startLandingId !== 'string' || typeof payload.endLandingId !== 'string') {
          errors.push(issue('landing', path, 'transition must declare start and end landing IDs'));
        } else {
          const startLanding = landings.get(payload.startLandingId);
          const endLanding = landings.get(payload.endLandingId);
          if (!startLanding || startLanding.levelId !== payload.sourceLevelId) {
            errors.push(issue('landing-topology', `${path}.startLandingId`, 'must be the connector landing on the source level'));
          }
          if (!endLanding || endLanding.levelId !== payload.destinationLevelId) {
            errors.push(issue('landing-topology', `${path}.endLandingId`, 'must be the connector landing on the destination level'));
          }
        }
      }
    }
    const source = levels.get(payload.sourceLevelId);
    const destination = levels.get(payload.destinationLevelId);
    if (source && destination) {
      const expected = destination.ordinal > source.ordinal ? 'up' : destination.ordinal < source.ordinal ? 'down' : 'level';
      if (payload.direction !== expected) errors.push(issue('direction', `${path}.direction`, `must be ${expected}`));
    }
  } else {
    if (!sameLevel) errors.push(issue('truth-stationary', path, 'non-transition segment must stay on one level'));
    if (payload.mode !== 'unknown' || payload.direction !== 'level') {
      errors.push(issue('truth-stationary', path, 'non-transition segment must use unknown/level'));
    }
    if (payload.connectorId !== undefined || payload.startLandingId !== undefined || payload.endLandingId !== undefined) {
      errors.push(issue('truth-stationary', path, 'non-transition segment must not declare connector or landing IDs'));
    }
  }
}

function validateNativeTimestamp(errors, event, path, manifest) {
  if (!PERIODIC_KINDS.has(event.kind)) return;
  const capability = capabilityIndex(manifest).get(event.source);
  if (!capability || capability.kind !== event.kind) return;
  const payloadPath = `${path}.payload`;
  if (capability.nativeTimestampUnit === 'none') {
    if (event.payload.nativeTimestamp !== undefined || event.payload.nativeTimestampUnit !== undefined) {
      errors.push(issue('native-time', payloadPath, 'must omit native time when the declared source has none'));
    }
    return;
  }
  if (!isFiniteNumber(event.payload.nativeTimestamp) || event.payload.nativeTimestamp < 0 ||
      event.payload.nativeTimestampUnit !== capability.nativeTimestampUnit) {
    errors.push(issue('native-time', payloadPath, 'must retain a non-negative native timestamp in the source-declared unit'));
  }
}

function validatePayload(errors, event, path, manifest) {
  const payload = event.payload;
  if (!isRecord(payload)) {
    errors.push(issue('payload', `${path}.payload`, 'must be an object'));
    return;
  }
  rejectUnexpectedKeys(errors, payload, PAYLOAD_KEYS.get(event.kind) ?? new Set(), `${path}.payload`);
  switch (event.kind) {
    case 'session-start':
      if (payload.reason !== 'started') errors.push(issue('session-reason', `${path}.payload.reason`, 'must be started'));
      break;
    case 'session-end':
      if (!['completed', 'cancelled', 'error'].includes(payload.reason)) {
        errors.push(issue('session-reason', `${path}.payload.reason`, 'must be completed, cancelled or error'));
      }
      break;
    case 'clock-sync':
      if (pushRequired(errors, payload, [
        'localSendUs', 'localReceiveUs', 'referenceWallTimeMs', 'offsetMs', 'rttMs', 'uncertaintyMs',
      ], `${path}.payload`)) {
        if (!isInteger(payload.localSendUs) || !isInteger(payload.localReceiveUs) || payload.localReceiveUs < payload.localSendUs) {
          errors.push(issue('clock-sync', `${path}.payload`, 'local send/receive times must increase'));
        }
        for (const field of ['referenceWallTimeMs', 'offsetMs', 'rttMs', 'uncertaintyMs']) {
          if (!isFiniteNumber(payload[field]) || (['rttMs', 'uncertaintyMs'].includes(field) && payload[field] < 0)) {
            errors.push(issue('clock-sync', `${path}.payload.${field}`, 'must be a valid clock measurement'));
          }
        }
        if (isInteger(payload.localSendUs) && isInteger(payload.localReceiveUs) &&
            (event.monotonicUs < payload.localSendUs || event.monotonicUs > payload.localReceiveUs)) {
          errors.push(issue('clock-sync', `${path}.monotonicUs`, 'must fall inside the local sync request interval'));
        }
      }
      break;
    case 'sensor-status':
      if (!['available', 'unavailable', 'permission-denied', 'started', 'stopped', 'error'].includes(payload.status)) {
        errors.push(issue('sensor-status', `${path}.payload.status`, 'is not supported'));
      }
      break;
    case 'pressure':
      if (!isFiniteNumber(payload.pressureHpa) || payload.pressureHpa < 300 || payload.pressureHpa > 1100) {
        errors.push(issue('pressure-range', `${path}.payload.pressureHpa`, 'must be 300–1100 hPa'));
      }
      if (payload.relativeAltitudeM !== undefined && (!isFiniteNumber(payload.relativeAltitudeM) || Math.abs(payload.relativeAltitudeM) > 10_000)) {
        errors.push(issue('altitude-range', `${path}.payload.relativeAltitudeM`, 'must be finite and plausible'));
      }
      break;
    case 'motion':
      validateVector(errors, payload.accelerationIncludingGravityMps2, `${path}.payload.accelerationIncludingGravityMps2`, 500);
      if (payload.userAccelerationMps2 !== undefined) validateVector(errors, payload.userAccelerationMps2, `${path}.payload.userAccelerationMps2`, 500);
      if (payload.rotationRateRps !== undefined) validateVector(errors, payload.rotationRateRps, `${path}.payload.rotationRateRps`, 100);
      if (payload.screenOrientationDeg !== undefined && ![0, 90, 180, -90].includes(payload.screenOrientationDeg)) {
        errors.push(issue('orientation', `${path}.payload.screenOrientationDeg`, 'must be a supported screen orientation'));
      }
      break;
    case 'steps':
      if (!isInteger(payload.cumulativeSteps) || payload.cumulativeSteps < 0) {
        errors.push(issue('steps', `${path}.payload.cumulativeSteps`, 'must be a non-negative safe integer'));
      }
      break;
    case 'magnetic-field':
      validateVector(errors, payload.microtesla, `${path}.payload.microtesla`, 10_000);
      break;
    case 'radio-observation':
      if (!['ble', 'wifi'].includes(payload.radio)) errors.push(issue('radio', `${path}.payload.radio`, 'must be ble or wifi'));
      if (typeof payload.transmitterId !== 'string' || !RADIO_ID.test(payload.transmitterId)) {
        errors.push(issue('radio-id', `${path}.payload.transmitterId`, 'must be a site-keyed pseudonymous tx_ identifier'));
      }
      if (payload.keyEpoch !== manifest.radioPrivacy.keyEpoch) errors.push(issue('radio-epoch', `${path}.payload.keyEpoch`, 'must match the manifest key epoch'));
      if (!isFiniteNumber(payload.rssiDbm) || payload.rssiDbm < -127 || payload.rssiDbm > 20) {
        errors.push(issue('rssi-range', `${path}.payload.rssiDbm`, 'must be -127–20 dBm'));
      }
      break;
    case 'phone-state':
      if (!['active', 'background', 'inactive'].includes(payload.appState) ||
          !['on', 'off', 'locked', 'unknown'].includes(payload.screenState) ||
          typeof payload.lowPowerMode !== 'boolean') {
        errors.push(issue('phone-state', `${path}.payload`, 'contains an invalid app/screen/power state'));
      }
      break;
    case 'ground-truth-segment':
      validateTruthPayload(errors, payload, `${path}.payload`, manifest);
      break;
    case 'ground-truth-point':
      if (!pushRequired(errors, payload, ['pointId', 'action', 'levelId', 'confirmedBy'], `${path}.payload`)) break;
      validateStableId(errors, payload.pointId, `${path}.payload.pointId`);
      if (!['landing-confirmed', 'correction'].includes(payload.action)) errors.push(issue('truth-point', `${path}.payload.action`, 'is not supported'));
      if (!levelIndex(manifest).has(payload.levelId)) errors.push(issue('unknown-level', `${path}.payload.levelId`, 'is not declared'));
      if (!CONFIRMERS.has(payload.confirmedBy)) errors.push(issue('confirmed-by', `${path}.payload.confirmedBy`, 'is not supported'));
      if (payload.action === 'landing-confirmed') {
        const connector = connectorIndex(manifest).get(payload.connectorId);
        if (!connector) {
          errors.push(issue('unknown-connector', `${path}.payload.connectorId`, 'is not declared'));
        } else {
          const landing = connector.landings.find((candidate) => candidate.landingId === payload.landingId);
          if (!landing || landing.levelId !== payload.levelId) {
            errors.push(issue('landing-topology', `${path}.payload.landingId`, 'must identify this connector landing on the confirmed level'));
          }
        }
      } else if (payload.connectorId !== undefined || payload.landingId !== undefined) {
        errors.push(issue('truth-point', `${path}.payload`, 'correction points must not declare a connector or landing'));
      }
      break;
    case 'operator-note':
      if (!OPERATOR_CODES.has(payload.code) || Object.keys(payload).some((key) => key !== 'code')) {
        errors.push(issue('operator-note', `${path}.payload`, 'must contain only an enumerated code'));
      }
      break;
  }
  validateNativeTimestamp(errors, event, path, manifest);
}

export function validateEvent(event, manifest, path = '$.event') {
  const errors = [];
  if (!pushRequired(errors, event, [
    'schemaVersion', 'sessionId', 'sequence', 'kind', 'monotonicUs', 'wallTimeMs',
    'clockUncertaintyMs', 'source', 'payload',
  ], path)) return errors;
  rejectUnexpectedKeys(errors, event, EVENT_KEYS, path);
  if (event.schemaVersion !== SCHEMA_VERSION) errors.push(issue('schema-version', `${path}.schemaVersion`, `must equal ${SCHEMA_VERSION}`));
  if (event.sessionId !== manifest?.sessionId) errors.push(issue('session-id', `${path}.sessionId`, 'must match manifest'));
  if (!isInteger(event.sequence) || event.sequence < 0) errors.push(issue('sequence', `${path}.sequence`, 'must be a non-negative safe integer'));
  if (!EVENT_KIND_SET.has(event.kind)) errors.push(issue('event-kind', `${path}.kind`, 'is not supported'));
  if (!isInteger(event.monotonicUs) || event.monotonicUs < 0) errors.push(issue('time', `${path}.monotonicUs`, 'must be a non-negative safe integer'));
  if (!isInteger(event.wallTimeMs) || event.wallTimeMs <= 0) errors.push(issue('time', `${path}.wallTimeMs`, 'must be a positive safe integer'));
  const maxClockUncertaintyMs = isFiniteNumber(manifest?.clock?.maxUncertaintyMs)
    ? manifest.clock.maxUncertaintyMs
    : 0;
  if (!isFiniteNumber(event.clockUncertaintyMs) || event.clockUncertaintyMs < 0 || event.clockUncertaintyMs > maxClockUncertaintyMs) {
    errors.push(issue('clock-uncertainty', `${path}.clockUncertaintyMs`, 'exceeds the session clock policy'));
  }
  validateStableId(errors, event.source, `${path}.source`);
  if (EVENT_KIND_SET.has(event.kind)) validatePayload(errors, event, path, manifest);
  scanForbidden(event, path, errors);
  return errors;
}

function percentile(values, fraction) {
  if (values.length === 0) return null;
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.min(ordered.length - 1, Math.ceil(fraction * ordered.length) - 1)];
}

function stableSummary(report) {
  return JSON.stringify({
    valid: report.valid,
    eventCount: report.eventCount,
    errorCodes: report.errors.map((error) => error.code).sort(),
    timeQuality: report.timeQuality,
    truth: report.truth,
    streams: report.streams,
  });
}

export function evaluateSession(manifest, events) {
  const errors = validateManifest(manifest);
  if (!Array.isArray(events)) {
    errors.push(issue('events', '$.events', 'must be an array'));
    return { valid: false, eventCount: 0, errors, timeQuality: null, truth: null, streams: {}, fingerprint: '' };
  }

  let previousTime = -1;
  for (const [index, event] of events.entries()) {
    errors.push(...validateEvent(event, manifest, `$.events[${index}]`));
    if (event.sequence !== index) errors.push(issue('sequence-gap', `$.events[${index}].sequence`, `must equal ${index}`));
    if (isInteger(event.monotonicUs) && event.monotonicUs < previousTime) {
      errors.push(issue('monotonic-regression', `$.events[${index}].monotonicUs`, 'must not move backwards'));
    }
    if (isInteger(event.monotonicUs)) previousTime = Math.max(previousTime, event.monotonicUs);
  }

  const starts = events.filter((event) => event.kind === 'session-start');
  const ends = events.filter((event) => event.kind === 'session-end');
  if (starts.length !== 1 || events[0]?.kind !== 'session-start') {
    errors.push(issue('session-boundary', '$.events', 'must start with exactly one session-start'));
  }
  if (ends.length !== 1 || events.at(-1)?.kind !== 'session-end') {
    errors.push(issue('session-boundary', '$.events', 'must end with exactly one session-end'));
  }
  if (starts[0]?.source !== 'recorder' || ends[0]?.source !== 'recorder') {
    errors.push(issue('session-boundary', '$.events', 'session boundaries must be emitted by recorder'));
  }
  const maxWallTime = Math.max(0, ...events.map((event) => isInteger(event.wallTimeMs) ? event.wallTimeMs : 0));
  if (manifest?.retention?.deleteAfterMs <= maxWallTime) {
    errors.push(issue('retention-expired', '$.manifest.retention.deleteAfterMs', 'must remain after the recorded session'));
  }

  const syncs = events.filter((event) => event.kind === 'clock-sync').sort((a, b) => a.monotonicUs - b.monotonicUs);
  if (syncs.length < 2) errors.push(issue('clock-sync-count', '$.events', 'must contain at least two clock-sync events'));
  const clockUncertaintyPolicy = isFiniteNumber(manifest?.clock?.maxUncertaintyMs)
    ? manifest.clock.maxUncertaintyMs
    : 0;
  const clockDriftPolicy = isFiniteNumber(manifest?.clock?.maxDriftMsPerMinute)
    ? manifest.clock.maxDriftMsPerMinute
    : 0;
  let maxUncertaintyMs = 0;
  let maxDriftMsPerMinute = 0;
  for (const sync of syncs) {
    const eventUncertainty = isFiniteNumber(sync.clockUncertaintyMs) ? sync.clockUncertaintyMs : Infinity;
    const payloadUncertainty = isFiniteNumber(sync.payload?.uncertaintyMs) ? sync.payload.uncertaintyMs : Infinity;
    maxUncertaintyMs = Math.max(maxUncertaintyMs, eventUncertainty, payloadUncertainty);
  }
  for (let index = 1; index < syncs.length; index += 1) {
    const minutes = (syncs[index].monotonicUs - syncs[index - 1].monotonicUs) / 60_000_000;
    if (minutes > 0 && isFiniteNumber(syncs[index].payload?.offsetMs) && isFiniteNumber(syncs[index - 1].payload?.offsetMs)) {
      maxDriftMsPerMinute = Math.max(
        maxDriftMsPerMinute,
        Math.abs(syncs[index].payload.offsetMs - syncs[index - 1].payload.offsetMs) / minutes,
      );
    }
  }
  if (maxUncertaintyMs > clockUncertaintyPolicy) {
    errors.push(issue('clock-uncertainty', '$.events', 'clock sync uncertainty exceeds policy'));
  }
  if (maxDriftMsPerMinute > clockDriftPolicy) {
    errors.push(issue('clock-drift', '$.events', 'clock drift exceeds policy'));
  }
  const timeQuality = {
    syncCount: syncs.length,
    maxUncertaintyMs: Number.isFinite(maxUncertaintyMs) ? maxUncertaintyMs : null,
    maxDriftMsPerMinute: Number(maxDriftMsPerMinute.toFixed(6)),
    validForTransitionTiming:
      syncs.length >= 2 &&
      maxUncertaintyMs <= clockUncertaintyPolicy &&
      maxDriftMsPerMinute <= clockDriftPolicy,
  };

  const analysisStart = isInteger(manifest?.analysis?.startMonotonicUs)
    ? manifest.analysis.startMonotonicUs
    : 0;
  const analysisEnd = isInteger(manifest?.analysis?.endMonotonicUs) && manifest.analysis.endMonotonicUs > analysisStart
    ? manifest.analysis.endMonotonicUs
    : analysisStart;
  const truthTolerance = isInteger(manifest?.analysis?.maxTruthGapUs)
    ? manifest.analysis.maxTruthGapUs
    : 0;
  if (starts.length === 1 && ends.length === 1 &&
      (starts[0].monotonicUs > analysisStart || ends[0].monotonicUs < analysisEnd)) {
    errors.push(issue('session-window', '$.events', 'session boundaries must contain the analysis interval'));
  }
  if (syncs.length >= 2 && (syncs[0].monotonicUs > analysisStart || syncs.at(-1).monotonicUs < analysisEnd)) {
    errors.push(issue('clock-sync-window', '$.events', 'clock sync points must bracket the analysis interval'));
  }
  const segments = events
    .filter((event) => event.kind === 'ground-truth-segment' && isRecord(event.payload) &&
      isInteger(event.payload.startUs) && isInteger(event.payload.endUs))
    .map((event) => event.payload)
    .sort((a, b) => a.startUs - b.startUs);
  const segmentIds = new Set();
  let gapUs = 0;
  let overlapUs = 0;
  let cursor = analysisStart;
  for (const segment of segments) {
    if (segmentIds.has(segment.segmentId)) errors.push(issue('duplicate', '$.events', `ground-truth segment ID ${segment.segmentId} is duplicated`));
    segmentIds.add(segment.segmentId);
    if (segment.startUs < analysisStart || segment.endUs > analysisEnd) {
      errors.push(issue('truth-window', '$.events', 'ground-truth segment lies outside analysis window'));
    }
    if (segment.startUs > cursor) gapUs += segment.startUs - cursor;
    if (segment.startUs < cursor) overlapUs += cursor - segment.startUs;
    cursor = Math.max(cursor, segment.endUs);
  }
  if (cursor < analysisEnd) gapUs += analysisEnd - cursor;
  if (gapUs > truthTolerance) errors.push(issue('truth-gap', '$.events', `ground truth has ${gapUs} us uncovered`));
  if (overlapUs > truthTolerance) errors.push(issue('truth-overlap', '$.events', `ground truth has ${overlapUs} us overlap`));
  const truth = {
    segmentCount: segments.length,
    transitionCount: segments.filter((segment) => segment.category === 'transition').length,
    sameFloorControlCount: segments.filter((segment) => segment.category === 'same-floor-control').length,
    gapUs,
    overlapUs,
  };

  const capabilities = capabilityIndex(manifest);
  const streams = {};
  for (const capability of manifest.capabilities ?? []) {
    if (!capability.available || !isFiniteNumber(capability.requestedIntervalMs) || capability.requestedIntervalMs <= 0) continue;
    const streamEvents = events.filter((event) =>
      event.source === capability.source &&
      event.kind === capability.kind &&
      event.monotonicUs >= analysisStart &&
      event.monotonicUs <= analysisEnd
    );
    const expected = Math.floor((analysisEnd - analysisStart) / (capability.requestedIntervalMs * 1000)) + 1;
    const intervalsMs = [];
    for (let index = 1; index < streamEvents.length; index += 1) {
      intervalsMs.push((streamEvents[index].monotonicUs - streamEvents[index - 1].monotonicUs) / 1000);
    }
    streams[capability.source] = {
      kind: capability.kind,
      expected,
      received: streamEvents.length,
      missing: Math.max(0, expected - streamEvents.length),
      dropoutRate: Number((Math.max(0, expected - streamEvents.length) / expected).toFixed(6)),
      medianIntervalMs: percentile(intervalsMs, 0.5),
      p95IntervalMs: percentile(intervalsMs, 0.95),
      maxIntervalMs: intervalsMs.length > 0 ? Math.max(...intervalsMs) : null,
      intervalsOverDoubleRequested: intervalsMs.filter((interval) => interval > capability.requestedIntervalMs * 2).length,
    };
  }
  for (const [index, event] of events.entries()) {
    if (PERIODIC_KINDS.has(event.kind)) {
      const capability = capabilities.get(event.source);
      if (!capability || capability.kind !== event.kind || !capability.available) {
        errors.push(issue('undeclared-stream', `$.events[${index}].source`, 'periodic event source/kind is not declared available'));
      }
    }
  }

  const report = {
    valid: errors.length === 0,
    eventCount: events.length,
    errors,
    timeQuality,
    truth,
    streams,
  };
  report.fingerprint = stableSummary(report);
  return report;
}

export function serializeBundle(manifest, events) {
  return [
    JSON.stringify({ recordType: 'manifest', manifest }),
    ...events.map((event) => JSON.stringify({ recordType: 'event', event })),
  ].join('\n') + '\n';
}

export function parseBundle(jsonl) {
  if (typeof jsonl !== 'string') throw new TypeError('bundle must be JSONL text');
  const records = jsonl.split(/\r?\n/).filter((line) => line.length > 0).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`invalid JSON on line ${index + 1}: ${error.message}`);
    }
  });
  if (records.length === 0 || records[0].recordType !== 'manifest' || !isRecord(records[0].manifest)) {
    throw new Error('first JSONL record must be the manifest');
  }
  if (records.slice(1).some((record) => record.recordType !== 'event' || !isRecord(record.event))) {
    throw new Error('all remaining JSONL records must be events');
  }
  return { manifest: records[0].manifest, events: records.slice(1).map((record) => record.event) };
}

export class FloorCorpusRecorder {
  constructor(manifest, sink = null) {
    const errors = validateManifest(manifest);
    if (errors.length > 0) throw new Error(`invalid manifest: ${errors[0].path} ${errors[0].message}`);
    if (sink !== null && typeof sink !== 'function') throw new TypeError('sink must be a function');
    this.manifest = structuredClone(manifest);
    this.events = [];
    this.sink = sink;
    this.started = false;
    this.ended = false;
    this.lastMonotonicUs = -1;
  }

  #append(kind, source, monotonicUs, wallTimeMs, clockUncertaintyMs, payload) {
    if (this.ended) throw new Error('session has ended');
    if (monotonicUs < this.lastMonotonicUs) throw new Error('monotonic time moved backwards');
    const event = {
      schemaVersion: SCHEMA_VERSION,
      sessionId: this.manifest.sessionId,
      sequence: this.events.length,
      kind,
      monotonicUs,
      wallTimeMs,
      clockUncertaintyMs,
      source,
      payload: structuredClone(payload),
    };
    const errors = validateEvent(event, this.manifest);
    if (errors.length > 0) throw new Error(`invalid event: ${errors[0].path} ${errors[0].message}`);
    if (this.sink) this.sink(structuredClone(event));
    this.events.push(event);
    this.lastMonotonicUs = monotonicUs;
    return event;
  }

  start({ monotonicUs, wallTimeMs, clockUncertaintyMs = 0 }) {
    if (this.started) throw new Error('session already started');
    const event = this.#append('session-start', 'recorder', monotonicUs, wallTimeMs, clockUncertaintyMs, { reason: 'started' });
    this.started = true;
    return event;
  }

  record({ kind, source, monotonicUs, wallTimeMs, clockUncertaintyMs = 0, payload }) {
    if (!this.started) throw new Error('session has not started');
    if (kind === 'session-start' || kind === 'session-end') throw new Error('use start()/end() for session boundaries');
    return this.#append(kind, source, monotonicUs, wallTimeMs, clockUncertaintyMs, payload);
  }

  end({ monotonicUs, wallTimeMs, clockUncertaintyMs = 0, reason = 'completed' }) {
    if (!this.started) throw new Error('session has not started');
    const event = this.#append('session-end', 'recorder', monotonicUs, wallTimeMs, clockUncertaintyMs, { reason });
    this.ended = true;
    return event;
  }

  exportJsonl() {
    if (!this.ended) throw new Error('session must end before export');
    return serializeBundle(this.manifest, this.events);
  }
}
