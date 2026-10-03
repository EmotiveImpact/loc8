/** Synthetic reference only. Integrate invariants into existing host records; not a live adapter. */
const validTime = value => Number.isSafeInteger(value) && value >= 0;
const validId = value => typeof value === 'string' && value.trim().length > 0;

export function projectFreshness(observation, context, policy) {
  if (!context || !validTime(context.nowMs)) throw new TypeError('Invalid current time');
  if (!policy || !validTime(policy.recentMs) || !validTime(policy.staleMs) ||
      policy.staleMs <= policy.recentMs || !validTime(policy.futureToleranceMs)) {
    throw new TypeError('Invalid explicit freshness policy');
  }
  // The host must establish authorisation. This flag is not an authentication mechanism.
  if (context.authorised !== true) return { status: 'withheld', ageMs: null };
  if (!observation) return { status: 'missing', ageMs: null };
  const { lat, lon, observedAtMs, receivedAtMs, sourceClockTrusted } = observation;
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 ||
      !Number.isFinite(lon) || lon < -180 || lon > 180) {
    return { status: 'missing', ageMs: null };
  }
  if (sourceClockTrusted !== true || !validTime(observedAtMs) || !validTime(receivedAtMs) ||
      observedAtMs > context.nowMs + policy.futureToleranceMs ||
      receivedAtMs > context.nowMs + policy.futureToleranceMs ||
      observedAtMs > receivedAtMs + policy.futureToleranceMs) {
    return { status: 'clock-uncertain', ageMs: null };
  }
  const ageMs = Math.max(0, context.nowMs - observedAtMs);
  const status = ageMs <= policy.recentMs ? 'recent' : ageMs <= policy.staleMs ? 'ageing' : 'stale';
  return { status, ageMs };
}

const kinds = new Set(['queued', 'locally-submitted', 'relay-received', 'destination-received', 'human-acknowledged']);
const remoteKinds = new Set(['relay-received', 'destination-received', 'human-acknowledged']);

export function emptyDelivery(correlation) {
  if (!correlation || !['messageId', 'incidentId', 'recipientId'].every(key => validId(correlation[key]))) {
    throw new TypeError('Explicit message, incident and recipient correlation required');
  }
  return { correlation: { ...correlation }, events: [] };
}

export function addDeliveryEvidence(state, event) {
  if (!state || !state.correlation || !Array.isArray(state.events)) throw new TypeError('Invalid state');
  if (!event || !validId(event.eventId) || !kinds.has(event.kind) || !validTime(event.atMs)) {
    return { accepted: false, reason: 'invalid-event', state };
  }
  if (!['messageId', 'incidentId', 'recipientId'].every(key => event[key] === state.correlation[key])) {
    return { accepted: false, reason: 'wrong-correlation', state };
  }
  // Synthetic trust assertion only: production needs actual authenticated and authorised receipt validation.
  if (remoteKinds.has(event.kind) && event.verifiedOrigin !== true) {
    return { accepted: false, reason: 'unverified-origin', state };
  }
  const canonical = {
    eventId: event.eventId, kind: event.kind, atMs: event.atMs,
    messageId: event.messageId, incidentId: event.incidentId, recipientId: event.recipientId,
    verifiedOrigin: event.verifiedOrigin === true,
  };
  const previous = state.events.find(item => item.eventId === event.eventId);
  if (previous) {
    const same = Object.keys(canonical).every(key => canonical[key] === previous[key]);
    return { accepted: same, reason: same ? 'duplicate' : 'conflicting-event-id', state };
  }
  return { accepted: true, reason: 'recorded', state: { correlation: { ...state.correlation }, events: [...state.events, canonical] } };
}

export function deliveryFacts(state) {
  const observed = new Set(state.events.map(event => event.kind));
  return Object.fromEntries([...kinds].map(kind => [kind, observed.has(kind)]));
}
