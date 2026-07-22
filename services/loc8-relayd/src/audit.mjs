import { createHash } from 'node:crypto';
import { RelayContractError, requirePort } from './contracts.mjs';

export const AUDIT_GENESIS = '0'.repeat(64);
const HASH = /^[0-9a-f]{64}$/;
const AUDIT_DETAIL_FIELDS = new Set([
  'connectionId', 'siteId', 'subjectId', 'role', 'reason', 'delivered', 'policyVersion',
]);

function canonicalJson(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
}

function digest(previousHash, body) {
  return createHash('sha256').update(previousHash).update('\n').update(canonicalJson(body)).digest('hex');
}

function validateAuditDetail(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new RelayContractError('invalid_audit_detail');
  }
  for (const [key, child] of Object.entries(value)) {
    if (/(authorization|cookie|token|capability|payload|frame|sec-websocket-protocol)/i.test(key)) {
      throw new RelayContractError('sensitive_audit_field', 'detail.' + key);
    }
    if (!AUDIT_DETAIL_FIELDS.has(key)) throw new RelayContractError('audit_field_not_allowed', 'detail.' + key);
    if (child !== null && typeof child !== 'string' && typeof child !== 'boolean'
      && !(typeof child === 'number' && Number.isSafeInteger(child))) {
      throw new RelayContractError('invalid_audit_detail', 'detail.' + key);
    }
    if (typeof child === 'string' && child.length > 256) {
      throw new RelayContractError('invalid_audit_detail', 'detail.' + key);
    }
  }
}

export class DurableAuditLog {
  constructor({ siteId, repository, anchorSink, clock, retentionDays }) {
    if (typeof siteId !== 'string' || !siteId) throw new RelayContractError('invalid_site');
    if (!Number.isSafeInteger(retentionDays) || retentionDays < 1 || retentionDays > 3650) {
      throw new RelayContractError('invalid_retention');
    }
    this.siteId = siteId;
    this.repository = requirePort(repository, ['loadHead', 'appendAtomic', 'exportBundle'], 'auditRepository');
    this.anchorSink = requirePort(anchorSink, ['publish'], 'auditAnchorSink');
    this.clock = requirePort(clock, ['now'], 'clock');
    this.retentionDays = retentionDays;
    this.head = null;
  }

  async initialize() {
    const loaded = await this.repository.loadHead(this.siteId);
    if (!loaded || !Number.isSafeInteger(loaded.count) || loaded.count < 0 || !HASH.test(loaded.head)
      || (loaded.count === 0 && loaded.head !== AUDIT_GENESIS)) {
      throw new RelayContractError('audit_unavailable');
    }
    this.head = Object.freeze({ count: loaded.count, head: loaded.head });
  }

  async append(event, detail = {}) {
    if (!this.head) throw new RelayContractError('audit_unavailable', 'audit not initialized');
    if (typeof event !== 'string' || event.length < 1 || event.length > 64 || !/^[a-z0-9_.:-]+$/.test(event)) {
      throw new RelayContractError('invalid_audit_event');
    }
    validateAuditDetail(detail);
    const instant = this.clock.now();
    const body = {
      format: 'loc8-relayd-audit-v1',
      siteId: this.siteId,
      seq: this.head.count + 1,
      wallMs: instant.wallMs,
      monotonicMs: instant.monotonicMs,
      clockTrusted: instant.trusted === true,
      event,
      detail,
      previousHash: this.head.head,
    };
    const entry = Object.freeze({ ...body, hash: digest(this.head.head, body) });
    const committed = await this.repository.appendAtomic(this.siteId, {
      expectedCount: this.head.count,
      expectedHead: this.head.head,
      entry,
    });
    if (!committed) throw new RelayContractError('audit_conflict');
    this.head = Object.freeze({ count: entry.seq, head: entry.hash });
    return entry;
  }

  async checkpoint() {
    if (!this.head) throw new RelayContractError('audit_unavailable');
    const instant = this.clock.now();
    const anchor = Object.freeze({
      format: 'loc8-relayd-audit-anchor-v1',
      siteId: this.siteId,
      count: this.head.count,
      head: this.head.head,
      wallMs: instant.wallMs,
    });
    const receipt = await this.anchorSink.publish(anchor);
    if (!receipt) throw new RelayContractError('anchor_unavailable');
    return { anchor, receipt };
  }

  async exportBundle() {
    return this.repository.exportBundle(this.siteId);
  }
}

export function verifyAuditBundle(bundle, expectedAnchor) {
  if (!bundle || bundle.format !== 'loc8-relayd-audit-backup-v1' || !Array.isArray(bundle.entries)) return false;
  if (typeof bundle.siteId !== 'string' || !Number.isSafeInteger(bundle.baseCount) || bundle.baseCount < 0
    || !HASH.test(bundle.baseHash) || !Number.isSafeInteger(bundle.count) || bundle.count < bundle.baseCount
    || !HASH.test(bundle.head)) return false;
  let count = bundle.baseCount;
  let head = bundle.baseHash;
  for (const stored of bundle.entries) {
    const { hash, ...body } = stored;
    if (body.siteId !== bundle.siteId || body.seq !== count + 1 || body.previousHash !== head) return false;
    if (digest(head, body) !== hash) return false;
    count = body.seq;
    head = hash;
  }
  if (count !== bundle.count || head !== bundle.head) return false;
  if (expectedAnchor) {
    if (expectedAnchor.siteId !== bundle.siteId || !Number.isSafeInteger(expectedAnchor.count)
      || !HASH.test(expectedAnchor.head) || expectedAnchor.count !== count || expectedAnchor.head !== head) return false;
  }
  return true;
}

export function verifyRestore(bundle, expectedSiteId, externalAnchor) {
  return bundle?.siteId === expectedSiteId && verifyAuditBundle(bundle, externalAnchor);
}
