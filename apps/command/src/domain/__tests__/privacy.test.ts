// The iron privacy rule, tested. These assertions are the difference between a
// legitimate ops console and a surveillance tool.
import {
  assistedSearch,
  canReveal,
  AssistedSearchError,
  MIN_REASON_LEN,
  type SearchableSubject,
} from '../privacy';
import type { ConsentBasis } from '../types';

const pool: SearchableSubject[] = [
  { id: 7, name: 'Priya Okafor', zoneId: 'gate_c', basis: 'sos' },
  { id: 1, name: 'Kofi Adeyemi', zoneId: 'main', basis: 'on_duty_staff' },
  { id: 42, name: 'Lost Child', zoneId: 'foyer', basis: 'family_crew' },
  { id: 88, name: 'Diabetic Guest', zoneId: 'bar', basis: 'opt_in_medical' },
];

describe('consent ladder', () => {
  it('every enumerated basis is a consensual basis', () => {
    const all: ConsentBasis[] = ['on_duty_staff', 'sos', 'opt_in_medical', 'family_crew'];
    for (const b of all) expect(canReveal(b)).toBe(true);
  });

  it('fails closed for an unknown/unreviewed basis', () => {
    // Simulate a future union member that was not reviewed for consent.
    expect(canReveal('mystery' as unknown as ConsentBasis)).toBe(false);
  });
});

describe('assisted-search is narrow, logged and audited', () => {
  it('refuses to run without an operator identity', () => {
    expect(() =>
      assistedSearch(pool, { operatorId: '  ', reason: 'lost child', query: 'child', nowSec: 1 }),
    ).toThrow(AssistedSearchError);
  });

  it('refuses to run without a reason (accountability)', () => {
    expect(() =>
      assistedSearch(pool, { operatorId: 'sup-1', reason: '', query: 'priya', nowSec: 1 }),
    ).toThrow(AssistedSearchError);
    expect('lo'.length).toBeLessThan(MIN_REASON_LEN); // guards the boundary below
    expect(() =>
      assistedSearch(pool, { operatorId: 'sup-1', reason: 'lo', query: 'priya', nowSec: 1 }),
    ).toThrow(AssistedSearchError);
  });

  it('returns only consent-carrying matches and always writes an audit entry', () => {
    const res = assistedSearch(pool, {
      operatorId: 'sup-1',
      reason: 'medical: locate opted-in diabetic guest',
      query: 'guest',
      nowSec: 1234,
    });
    expect(res.matches.map((m) => m.id)).toEqual([88]);
    expect(res.audit.operatorId).toBe('sup-1');
    expect(res.audit.action).toBe('assisted_search');
    expect(res.audit.reason).toContain('medical');
    expect(res.audit.subjectIds).toEqual([88]);
    expect(res.audit.atSec).toBe(1234);
  });

  it('logs even a zero-match search (an attempt is on the record)', () => {
    const res = assistedSearch(pool, {
      operatorId: 'sup-9',
      reason: 'checking for a name not present',
      query: 'nobody-here',
      nowSec: 5,
    });
    expect(res.matches).toEqual([]);
    expect(res.audit.subjectIds).toEqual([]);
    expect(res.audit.detail).toContain('0 match');
  });

  it('an empty query never dumps the whole pool (no browse-all)', () => {
    const res = assistedSearch(pool, {
      operatorId: 'sup-1',
      reason: 'accidental empty query',
      query: '   ',
      nowSec: 9,
    });
    expect(res.matches).toEqual([]);
  });
});
