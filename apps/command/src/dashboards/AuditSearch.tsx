import { useState } from 'react';
import { useCommandStore } from '../store/commandStore';
import { zoneName } from '../domain/zones';
import { fmtHM } from '../domain/time';
import { Console, ConsoleTop, PageHead, SectionTitle } from '../ui/primitives';
import { Icon } from '../ui/Icon';

// Assisted search + audit trail — the ONLY path from anonymous crowd to a named
// individual, and it is deliberately narrow, reason-gated and fully logged.
// This is not a browsable live map: you must know who you're looking for, you
// must state why, and every attempt (even a zero-result one) is on the record.
export function AuditSearch() {
  const store = useCommandStore();
  const [query, setQuery] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = () => {
    const res = store.runAssistedSearch(query, reason);
    setError(res.ok ? null : res.error ?? 'search failed');
  };

  return (
    <>
      <PageHead title="Assisted search & audit" sub="Narrow, reason-gated, fully logged — the enforced alternative to a god-mode map." />
      <Console>
        <ConsoleTop site={<><span>· </span><b>Audit</b> · accountable search</>} tag={{ text: 'LOGGED · AUDITED', variant: 'amber' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* search */}
          <div style={{ padding: 18, borderRight: '1px solid var(--line)' }}>
            <SectionTitle>Assisted search</SectionTitle>
            <p className="warn" style={{ color: 'var(--caution)', fontSize: 12, margin: '8px 0 14px', lineHeight: 1.5 }}>
              Only consented subjects (on-duty staff, SOS initiators, opt-in medical, family crews) are
              searchable. A reason is required and written to the audit log.
            </p>
            <label className="field">
              <span>Who (name or id)</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Priya, or 07" />
            </label>
            <label className="field">
              <span>Reason (logged)</span>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. lost-child report at Gate C" />
            </label>
            <button type="button" className="btn go" onClick={run}>
              <Icon name="search" /> Run assisted search
            </button>
            {error && <div className="searcherr">{error}</div>}
            {store.lastSearch && !error && (
              <div className="searchres">
                {store.lastSearch.matches.length === 0 ? (
                  <p className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>No matches — attempt logged.</p>
                ) : (
                  store.lastSearch.matches.map((m) => (
                    <div key={m.id} className="rcard">
                      <div className="ra">{m.name.charAt(0)}</div>
                      <div>
                        <div className="rname">{m.name}</div>
                        <div className="rd">
                          {zoneName(store.zones, m.zoneId)} · basis: {m.basis.replace(/_/g, ' ')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <div className="audited">Every search is attributed to {store.operatorId} and recorded.</div>
          </div>

          {/* audit trail */}
          <div style={{ padding: 18 }}>
            <SectionTitle>Audit trail · {store.auditLog.length}</SectionTitle>
            <div className="feed" style={{ maxHeight: 420, marginTop: 10 }}>
              {store.auditLog.length === 0 && (
                <p className="mono" style={{ fontSize: 11, color: 'var(--faint)' }}>
                  No actions yet. Dispatch, acknowledge, escalate, muster and search all appear here.
                </p>
              )}
              {store.auditLog.map((a) => (
                <div key={a.id} className="fitem" style={{ cursor: 'default' }}>
                  <span className="fdot" style={{ background: a.action === 'escalate' ? 'var(--alert)' : a.action === 'assisted_search' ? 'var(--caution)' : 'var(--info)' }} />
                  <span className="ft">
                    <b style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{a.action.toUpperCase()}</b> — {a.reason}
                    <span className="sub">
                      {fmtHM(a.atSec)} · {a.operatorId}
                      {a.detail ? ` · ${a.detail}` : ''}
                      {a.subjectIds.length ? ` · subjects: ${a.subjectIds.join(', ')}` : ''}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Console>
    </>
  );
}
