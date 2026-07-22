import { AUDIT_GENESIS } from '../src/audit.mjs';
import { RelaydCore } from '../src/core.mjs';

export class ManualClock {
  constructor(wallMs = 1_000_000, monotonicMs = 10_000) {
    this.wallMs = wallMs;
    this.monotonicMs = monotonicMs;
    this.trusted = true;
  }
  now() {
    return { wallMs: this.wallMs, monotonicMs: this.monotonicMs, trusted: this.trusted };
  }
  advance(ms) {
    this.wallMs += ms;
    this.monotonicMs += ms;
  }
}

export class FakeAudit {
  constructor(maxEntries = 128) {
    this.entries = [];
    this.maxEntries = maxEntries;
    this.fail = false;
  }
  async append(event, detail) {
    if (this.fail) throw new Error('disk full');
    this.entries.push({ event, detail });
    if (this.entries.length > this.maxEntries) this.entries.shift();
  }
}

export class SharedReplay {
  constructor(max = 4096) {
    this.used = new Set();
    this.max = max;
    this.unavailable = false;
  }
  async consume(value) {
    if (this.unavailable) throw new Error('partitioned');
    const key = `${value.issuerId}/${value.siteId}/${value.tokenId}`;
    if (this.used.has(key) || this.used.size >= this.max) return false;
    this.used.add(key);
    return true;
  }
}

export class FakeSink {
  constructor() {
    this.frames = [];
    this.queueBytes = 0;
    this.oldest = null;
    this.closed = null;
  }
  async send(frame) {
    this.frames.push(new Uint8Array(frame));
  }
  close(reason) {
    this.closed = reason;
  }
  bufferedBytes() {
    return this.queueBytes;
  }
  oldestBufferedAtMonotonicMs() {
    return this.oldest;
  }
}

export function principal(overrides = {}) {
  return {
    version: 1,
    issuerId: 'issuer-a',
    siteId: 'site-a',
    subjectId: 'device-a',
    role: 'gateway',
    tokenId: 'token-a',
    issuedAtMs: 999_000,
    expiresAtMs: 1_060_000,
    ...overrides,
  };
}

export function makeCore(overrides = {}) {
  const clock = overrides.clock ?? new ManualClock();
  const audit = overrides.audit ?? new FakeAudit();
  const replay = overrides.replay ?? new SharedReplay();
  const tokens = overrides.tokens ?? new Map();
  const verifier = overrides.verifier ?? {
    async verify(token) {
      const value = tokens.get(token);
      if (!value) throw new Error('invalid');
      return value;
    },
  };
  const revoked = overrides.revoked ?? new Set();
  const revocations = overrides.revocations ?? {
    async isRevoked(value) {
      return revoked.has(`${value.siteId}/${value.subjectId}`);
    },
  };
  const policy = overrides.policy ?? {
    async authorizeConnection() {
      return true;
    },
    async authorizeRoute(sender, recipient) {
      return sender.siteId === recipient.siteId && sender.role !== recipient.role;
    },
  };
  const core = new RelaydCore({
    verifier,
    revocations,
    replay,
    policy,
    audit,
    clock,
    tls: overrides.tls ?? { mode: 'direct' },
    allowedCommandOrigins: ['https://command.loc8.test'],
    limits: overrides.limits,
  });
  return { core, clock, audit, replay, tokens, revoked };
}

export async function connect(core, tokens, token, value, sink = new FakeSink(), overrides = {}) {
  tokens.set(token, value);
  const handle = await core.acceptConnection({
    capability: token,
    origin: value.role === 'command' ? 'https://command.loc8.test' : undefined,
    request: { encrypted: true, remoteAddress: '127.0.0.1' },
    sink,
    ...overrides,
  });
  return { handle, sink };
}

export class MemoryAuditRepository {
  constructor() {
    this.sites = new Map();
  }
  #site(siteId) {
    if (!this.sites.has(siteId)) this.sites.set(siteId, { baseCount: 0, baseHash: AUDIT_GENESIS, entries: [] });
    return this.sites.get(siteId);
  }
  async loadHead(siteId) {
    const site = this.#site(siteId);
    return { count: site.entries.at(-1)?.seq ?? site.baseCount, head: site.entries.at(-1)?.hash ?? site.baseHash };
  }
  async appendAtomic(siteId, { expectedCount, expectedHead, entry }) {
    const head = await this.loadHead(siteId);
    if (head.count !== expectedCount || head.head !== expectedHead) return false;
    this.#site(siteId).entries.push(entry);
    return true;
  }
  async exportBundle(siteId) {
    const site = this.#site(siteId);
    const head = await this.loadHead(siteId);
    return {
      format: 'loc8-relayd-audit-backup-v1',
      siteId,
      baseCount: site.baseCount,
      baseHash: site.baseHash,
      count: head.count,
      head: head.head,
      entries: structuredClone(site.entries),
    };
  }
}
