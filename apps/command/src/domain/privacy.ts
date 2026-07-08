// src/domain/privacy.ts — the iron privacy rule, enforced in code.
//
// docs/strategy/identity-privacy-login.md:
//   - Mutual consent only; no silent god-mode.
//   - The safe operator overview is an ANONYMOUS crowd heatmap (counts only).
//   - Lost-person / emergency is a NARROW, LOGGED, AUDITED assisted-search —
//     NOT a browsable live map. Every use records who looked and why.
//
// This module is the single gate for turning an anonymous crowd into a named
// individual. It cannot be bypassed: the only individuals it will ever return
// are those carrying a consent basis, and it refuses to run without an operator
// identity and a reason — which it writes to the audit trail every time.

import type { AuditEntry, ConsentBasis } from './types';

/**
 * Is this consent basis one that permits revealing the individual?
 * Every ConsentBasis member is consensual by design — but we assert it here so
 * that if the union ever grows a non-consensual member, the reveal path fails
 * closed rather than open.
 */
export function canReveal(basis: ConsentBasis): boolean {
  switch (basis) {
    case 'on_duty_staff':
    case 'sos':
    case 'opt_in_medical':
    case 'family_crew':
      return true;
    default:
      // Exhaustiveness guard: any new, unreviewed basis is denied by default.
      return false;
  }
}

/** A person who MAY be surfaced by assisted-search — always consent-carrying. */
export interface SearchableSubject {
  id: number;
  name: string;
  zoneId: string;
  basis: ConsentBasis;
}

export interface AssistedSearchRequest {
  operatorId: string;
  reason: string;
  query: string;
  nowSec: number;
}

export interface AssistedSearchResult {
  matches: SearchableSubject[];
  audit: Omit<AuditEntry, 'id'>;
}

/** Thrown when a search is attempted without the accountability it requires. */
export class AssistedSearchError extends Error {}

export const MIN_REASON_LEN = 3;

/**
 * Narrow, logged, audited assisted-search.
 *
 * @param pool  ONLY consent-carrying subjects (staff + SOS/opt-in/family). The
 *              anonymous crowd is never part of this pool — there is no data
 *              structure in Command that holds attendee identities to search.
 * @returns the matches AND the audit entry that MUST be persisted. The audit
 *          entry is produced even for zero matches, so an attempted search is
 *          always on the record.
 * @throws  AssistedSearchError if no operator identity or no reason is given —
 *          an unaccountable search cannot proceed.
 */
export function assistedSearch(
  pool: SearchableSubject[],
  req: AssistedSearchRequest,
): AssistedSearchResult {
  if (!req.operatorId.trim()) {
    throw new AssistedSearchError('operator identity is required for an assisted search');
  }
  if (req.reason.trim().length < MIN_REASON_LEN) {
    throw new AssistedSearchError('a reason is required and is written to the audit log');
  }
  const q = req.query.trim().toLowerCase();
  const matches = q
    ? pool.filter(
        (s) => canReveal(s.basis) && (s.name.toLowerCase().includes(q) || String(s.id) === q),
      )
    : [];
  const audit: Omit<AuditEntry, 'id'> = {
    atSec: req.nowSec,
    operatorId: req.operatorId.trim(),
    action: 'assisted_search',
    reason: req.reason.trim(),
    subjectIds: matches.map((m) => m.id),
    detail: `query="${req.query.trim()}" · ${matches.length} match(es)`,
  };
  return { matches, audit };
}
