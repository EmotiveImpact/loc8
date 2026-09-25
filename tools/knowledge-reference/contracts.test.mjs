import test from 'node:test';
import assert from 'node:assert/strict';
import { projectFreshness, emptyDelivery, addDeliveryEvidence, deliveryFacts } from './contracts.mjs';

const policy = { recentMs: 15000, staleMs: 60000, futureToleranceMs: 1000 };
const context = { nowMs: 600000, authorised: true };
const observation = { lat: 51.5, lon: -0.1, observedAtMs: 590000, receivedAtMs: 599000, sourceClockTrusted: true };
const project = (patch = {}, ctx = context) => projectFreshness({ ...observation, ...patch }, ctx, policy);

test('trusted recent observation', () => assert.deepEqual(project(), { status: 'recent', ageMs: 10000 }));
test('delayed arrival cannot refresh old observation', () => assert.deepEqual(project({ observedAtMs: 300000, receivedAtMs: 600000 }), { status: 'stale', ageMs: 300000 }));
test('changing receipt time alone cannot change age', () => assert.deepEqual(project({ receivedAtMs: 600000 }), project()));
test('reconnect flag cannot make an old observation fresh', () => assert.equal(project({ observedAtMs: 300000, connected: true }).status, 'stale'));
test('recent boundary is explicit', () => assert.equal(project({ observedAtMs: 585000 }).status, 'recent'));
test('ageing begins after boundary', () => assert.equal(project({ observedAtMs: 584999 }).status, 'ageing'));
test('stale boundary is explicit', () => assert.equal(project({ observedAtMs: 540000 }).status, 'ageing'));
test('stale begins after boundary', () => assert.equal(project({ observedAtMs: 539999 }).status, 'stale'));
test('unknown source clock is not recent', () => assert.equal(project({ sourceClockTrusted: false }).status, 'clock-uncertain'));
test('future observation is uncertain', () => assert.equal(project({ observedAtMs: 603000 }).status, 'clock-uncertain'));
test('wall-clock rollback beyond receipt is uncertain', () => assert.equal(project({}, { ...context, nowMs: 590000 }).status, 'clock-uncertain'));
test('source later than receipt is uncertain', () => assert.equal(project({ receivedAtMs: 580000 }).status, 'clock-uncertain'));
test('missing observation', () => assert.equal(projectFreshness(null, context, policy).status, 'missing'));
test('invalid position is not located', () => assert.equal(project({ lat: NaN }).status, 'missing'));
test('out-of-range longitude is not located', () => assert.equal(project({ lon: 181 }).status, 'missing'));
test('revoked visibility withholds all position output', () => assert.deepEqual(project({}, { ...context, authorised: false }), { status: 'withheld', ageMs: null }));
test('missing authority fails closed', () => assert.equal(project({}, { nowMs: context.nowMs }).status, 'withheld'));
test('invalid time rejected', () => assert.throws(() => project({}, { ...context, nowMs: Infinity }), TypeError));
test('invalid policy rejected', () => assert.throws(() => projectFreshness(observation, context, { ...policy, staleMs: 1 }), TypeError));
test('projection does not mutate input', () => { const input = Object.freeze({ ...observation }); projectFreshness(input, context, policy); assert.equal(input.observedAtMs, 590000); });

const correlation = { messageId: 'message-1', incidentId: 'incident-1', recipientId: 'recipient-1' };
const event = patch => ({ ...correlation, eventId: 'event-1', kind: 'queued', atMs: 1000, ...patch });
const record = (patch = {}, state = emptyDelivery(correlation)) => addDeliveryEvidence(state, event(patch));

test('correlation required', () => assert.throws(() => emptyDelivery({}), TypeError));
test('queue is not submission or receipt', () => { const facts = deliveryFacts(record().state); assert.equal(facts.queued, true); assert.equal(facts['locally-submitted'], false); assert.equal(facts['destination-received'], false); });
test('local submission is not receipt or acknowledgement', () => { const facts = deliveryFacts(record({ kind: 'locally-submitted' }).state); assert.equal(facts['destination-received'], false); assert.equal(facts['human-acknowledged'], false); });
test('relay receipt is not destination receipt', () => { const facts = deliveryFacts(record({ kind: 'relay-received', verifiedOrigin: true }).state); assert.equal(facts['relay-received'], true); assert.equal(facts['destination-received'], false); });
test('destination receipt is not human acknowledgement', () => assert.equal(deliveryFacts(record({ kind: 'destination-received', verifiedOrigin: true }).state)['human-acknowledged'], false));
test('human acknowledgement requires its own evidence', () => assert.equal(deliveryFacts(record({ kind: 'human-acknowledged', verifiedOrigin: true }).state)['human-acknowledged'], true));
test('unverified remote evidence rejected', () => assert.equal(record({ kind: 'destination-received' }).reason, 'unverified-origin'));
for (const key of ['messageId', 'incidentId', 'recipientId']) {
  test(`wrong ${key} rejected`, () => assert.equal(record({ [key]: 'wrong' }).reason, 'wrong-correlation'));
}
test('duplicate evidence is idempotent', () => { const first = record().state; const next = record({}, first); assert.equal(next.reason, 'duplicate'); assert.equal(next.state.events.length, 1); });
test('conflicting event identity rejected', () => assert.equal(record({ atMs: 2000 }, record().state).reason, 'conflicting-event-id'));
test('arrival ordering does not erase evidence', () => { const first = record({ kind: 'human-acknowledged', verifiedOrigin: true, atMs: 4000 }).state; const next = record({ eventId: 'older', atMs: 1000 }, first).state; assert.equal(deliveryFacts(next)['human-acknowledged'], true); });
test('input event mutation cannot rewrite retained evidence', () => { const input = event(); const state = addDeliveryEvidence(emptyDelivery(correlation), input).state; input.kind = 'human-acknowledged'; assert.equal(deliveryFacts(state)['human-acknowledged'], false); });
test('unknown event kind rejected', () => assert.equal(record({ kind: 'magic-success' }).reason, 'invalid-event'));
test('malformed event timestamp rejected', () => assert.equal(record({ atMs: -1 }).reason, 'invalid-event'));
