import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import http from 'node:http';
import wsPackage from 'ws';

const { Server: WebSocketServer } = wsPackage;

export const PROTOCOL = 'loc8.v1';
export const AUTH_PREFIX = 'loc8.auth.';
export const FRAME_SIZE = 25;
export const ROLES = new Set(['gateway', 'command']);
const GENESIS_HASH = '0'.repeat(64);

function b64url(value) {
  return Buffer.from(value).toString('base64url');
}

function fromB64url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function hmac(payload, secret) {
  return createHmac('sha256', secret).update(payload).digest();
}

function validId(value, max = 96) {
  return typeof value === 'string' && value.length >= 1 && value.length <= max && /^[A-Za-z0-9_.:-]+$/.test(value);
}

export function signCapability(claims, secret) {
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error('secret must be at least 32 bytes');
  const payload = b64url(JSON.stringify(claims));
  return `${payload}.${hmac(payload, secret).toString('base64url')}`;
}

export function verifyCapability(token, secret, nowSec = Math.floor(Date.now() / 1000)) {
  if (typeof token !== 'string' || token.length > 2048) throw new Error('invalid token');
  const parts = token.split('.');
  if (parts.length !== 2) throw new Error('invalid token');
  const [payload, encodedSig] = parts;
  let actual;
  try {
    actual = Buffer.from(encodedSig, 'base64url');
  } catch {
    throw new Error('invalid signature');
  }
  const expected = hmac(payload, secret);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error('invalid signature');

  let claims;
  try {
    claims = JSON.parse(fromB64url(payload));
  } catch {
    throw new Error('invalid claims');
  }
  if (claims?.v !== 1) throw new Error('unsupported token version');
  if (!validId(claims.siteId) || !validId(claims.sub) || !validId(claims.jti, 128)) throw new Error('invalid identity');
  if (!ROLES.has(claims.role)) throw new Error('invalid role');
  if (!Number.isSafeInteger(claims.iat) || !Number.isSafeInteger(claims.exp)) throw new Error('invalid time');
  if (claims.exp <= claims.iat) throw new Error('invalid lifetime');
  if (claims.iat > nowSec + 30) throw new Error('issued in future');
  if (claims.exp <= nowSec || claims.exp - claims.iat > 15 * 60) throw new Error('expired or excessive lifetime');
  return Object.freeze({
    v: 1,
    siteId: claims.siteId,
    sub: claims.sub,
    role: claims.role,
    iat: claims.iat,
    exp: claims.exp,
    jti: claims.jti,
  });
}

function auditHash(previousHash, entry) {
  return createHash('sha256').update(previousHash).update('\n').update(JSON.stringify(entry)).digest('hex');
}

export class AuditChain {
  constructor({ maxEntries = 4096, nowMs = () => Date.now() } = {}) {
    if (!Number.isSafeInteger(maxEntries) || maxEntries < 2) throw new Error('maxEntries must be at least 2');
    this.maxEntries = maxEntries;
    this.nowMs = nowMs;
    this.entries = [];
    this.baseHash = GENESIS_HASH;
    this.baseCount = 0;
    this.totalCount = 0;
  }

  append(event, detail = {}) {
    const previousHash = this.entries.at(-1)?.hash ?? this.baseHash;
    const body = {
      seq: ++this.totalCount,
      atMs: this.nowMs(),
      event,
      ...detail,
      previousHash,
    };
    const entry = Object.freeze({ ...body, hash: auditHash(previousHash, body) });
    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      const removed = this.entries.shift();
      this.baseHash = removed.hash;
      this.baseCount = removed.seq;
    }
    return entry;
  }

  exportBundle() {
    return {
      format: 'loc8-relay-audit-prototype-v1',
      baseHash: this.baseHash,
      baseCount: this.baseCount,
      count: this.totalCount,
      head: this.entries.at(-1)?.hash ?? this.baseHash,
      entries: this.entries.map((entry) => ({ ...entry })),
    };
  }
}

export function verifyAuditBundle(bundle, expectedAnchor) {
  if (!bundle || !Array.isArray(bundle.entries)) return false;
  let previousHash = bundle.baseHash;
  let previousSeq = bundle.baseCount;
  for (const stored of bundle.entries) {
    const { hash, ...body } = stored;
    if (body.previousHash !== previousHash || body.seq !== previousSeq + 1) return false;
    if (auditHash(previousHash, body) !== hash) return false;
    previousHash = hash;
    previousSeq = body.seq;
  }
  if (previousSeq !== bundle.count || previousHash !== bundle.head) return false;
  if (expectedAnchor && (bundle.count !== expectedAnchor.count || bundle.head !== expectedAnchor.head)) return false;
  return true;
}

function parseProtocols(header) {
  if (typeof header !== 'string') return [];
  return header.split(',').map((item) => item.trim()).filter(Boolean);
}

function rejectUpgrade(socket, status, reason) {
  const safeReason = String(reason).replace(/[^A-Za-z0-9 _-]/g, '').slice(0, 80);
  socket.write(`HTTP/1.1 ${status} ${safeReason}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  socket.destroy();
}

function oppositeRole(role) {
  return role === 'gateway' ? 'command' : 'gateway';
}

function refill(meta, nowMs, rate, burst) {
  const elapsed = Math.max(0, nowMs - meta.lastRefillMs);
  meta.tokens = Math.min(burst, meta.tokens + (elapsed * rate) / 1000);
  meta.lastRefillMs = nowMs;
}

export function createSecureRelay(options = {}) {
  const {
    secret,
    server = http.createServer((_req, res) => {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
    }),
    allowInsecureForTests = false,
    allowedCommandOrigins = [],
    maxClients = 128,
    maxUsedTokens = 4096,
    framesPerSecond = 20,
    burstFrames = 40,
    maxRateViolations = 10,
    maxBufferedBytes = 64 * 1024,
    auditMaxEntries = 4096,
    nowMs = () => Date.now(),
  } = options;

  if (!secret || Buffer.byteLength(secret) < 32) throw new Error('secret must be at least 32 bytes');
  for (const [name, value] of Object.entries({ maxClients, maxUsedTokens, burstFrames, maxRateViolations, maxBufferedBytes })) {
    if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
  }
  if (!Number.isSafeInteger(auditMaxEntries) || auditMaxEntries < 2) throw new Error('auditMaxEntries must be at least 2');
  if (!Number.isFinite(framesPerSecond) || framesPerSecond < 0) throw new Error('framesPerSecond must be non-negative');

  const audit = new AuditChain({ maxEntries: auditMaxEntries, nowMs });
  const clients = new Map();
  const usedTokens = new Map();
  const metrics = {
    acceptedConnections: 0,
    rejectedConnections: 0,
    acceptedFrames: 0,
    droppedFrames: 0,
    deliveredFrames: 0,
    droppedDeliveries: 0,
  };
  const originSet = new Set(allowedCommandOrigins);
  const wss = new WebSocketServer({
    noServer: true,
    // Reject oversized messages in the protocol parser instead of buffering an
    // attacker-controlled payload before application validation.
    maxPayload: FRAME_SIZE,
    perMessageDeflate: false,
    handleProtocols(protocols) {
      const offered = Array.isArray(protocols) ? protocols.includes(PROTOCOL) : protocols.has(PROTOCOL);
      return offered ? PROTOCOL : false;
    },
  });

  function cleanupTokens(nowSec) {
    for (const [jti, exp] of usedTokens) if (exp <= nowSec) usedTokens.delete(jti);
  }

  server.on('upgrade', (req, socket, head) => {
    const now = nowMs();
    const nowSec = Math.floor(now / 1000);
    const remote = req.socket.remoteAddress ?? 'unknown';
    const deny = (status, reason, detail = {}) => {
      metrics.rejectedConnections++;
      audit.append('connection_rejected', { remote, reason, ...detail });
      rejectUpgrade(socket, status, reason);
    };

    if (!allowInsecureForTests && !req.socket.encrypted) return deny(426, 'TLS Required');
    if (clients.size >= maxClients) return deny(503, 'Client Limit');

    const protocols = parseProtocols(req.headers['sec-websocket-protocol']);
    if (!protocols.includes(PROTOCOL)) return deny(401, 'Protocol Required');
    const authProtocol = protocols.find((value) => value.startsWith(AUTH_PREFIX));
    if (!authProtocol) return deny(401, 'Authentication Required');

    let claims;
    try {
      claims = verifyCapability(authProtocol.slice(AUTH_PREFIX.length), secret, nowSec);
    } catch (error) {
      return deny(401, 'Invalid Capability', { error: error.message });
    }

    if (claims.role === 'command' && originSet.size > 0 && !originSet.has(req.headers.origin)) {
      return deny(403, 'Origin Rejected', { siteId: claims.siteId, sub: claims.sub, role: claims.role });
    }

    cleanupTokens(nowSec);
    if (usedTokens.has(claims.jti)) return deny(401, 'Capability Replayed', { siteId: claims.siteId, sub: claims.sub, role: claims.role });
    if (usedTokens.size >= maxUsedTokens) return deny(503, 'Token Cache Limit');
    usedTokens.set(claims.jti, claims.exp);

    wss.handleUpgrade(req, socket, head, (ws) => {
      const meta = {
        ...claims,
        remote,
        connectedAtMs: now,
        tokens: burstFrames,
        lastRefillMs: now,
        rateViolations: 0,
      };
      clients.set(ws, meta);
      metrics.acceptedConnections++;
      audit.append('connection_accepted', {
        siteId: meta.siteId,
        sub: meta.sub,
        role: meta.role,
        remote: meta.remote,
      });
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws) => {
    const meta = clients.get(ws);
    ws.on('message', (data, binaryFlag) => {
      if (!meta) return;
      const now = nowMs();
      refill(meta, now, framesPerSecond, burstFrames);
      // `ws` v7 emits only `data`; v8 also emits `isBinary`. Support both so
      // the security decision is not coupled to a hoisted workspace version.
      const isBinary = typeof binaryFlag === 'boolean' ? binaryFlag : Buffer.isBuffer(data) || ArrayBuffer.isView(data) || data instanceof ArrayBuffer;
      const byteLength = data?.byteLength ?? data?.length;
      if (!isBinary || byteLength !== FRAME_SIZE) {
        metrics.droppedFrames++;
        audit.append('frame_dropped', { siteId: meta.siteId, sub: meta.sub, role: meta.role, reason: 'invalid_frame' });
        return;
      }
      if (meta.tokens < 1) {
        meta.rateViolations++;
        metrics.droppedFrames++;
        audit.append('frame_dropped', { siteId: meta.siteId, sub: meta.sub, role: meta.role, reason: 'rate_limited' });
        if (meta.rateViolations >= maxRateViolations) ws.close(1008, 'rate limit');
        return;
      }
      meta.tokens -= 1;
      metrics.acceptedFrames++;
      let delivered = 0;
      const targetRole = oppositeRole(meta.role);
      for (const [peer, peerMeta] of clients) {
        if (peer !== ws && peer.readyState === wsPackage.OPEN && peerMeta.siteId === meta.siteId && peerMeta.role === targetRole) {
          if (peer.bufferedAmount + byteLength > maxBufferedBytes) {
            metrics.droppedDeliveries++;
            audit.append('frame_delivery_dropped', {
              siteId: meta.siteId,
              sub: meta.sub,
              role: meta.role,
              targetSub: peerMeta.sub,
              reason: 'slow_consumer',
            });
            continue;
          }
          try {
            peer.send(data, { binary: true });
            delivered++;
          } catch {
            metrics.droppedDeliveries++;
            audit.append('frame_delivery_dropped', {
              siteId: meta.siteId,
              sub: meta.sub,
              role: meta.role,
              targetSub: peerMeta.sub,
              reason: 'send_failed',
            });
          }
        }
      }
      metrics.deliveredFrames += delivered;
      audit.append('frame_routed', {
        siteId: meta.siteId,
        sub: meta.sub,
        role: meta.role,
        delivered,
      });
    });

    ws.on('close', () => {
      const closed = clients.get(ws);
      clients.delete(ws);
      if (closed) audit.append('connection_closed', { siteId: closed.siteId, sub: closed.sub, role: closed.role });
    });

    ws.on('error', () => {});
  });

  return {
    server,
    wss,
    audit,
    metrics,
    clients,
    usedTokens,
    async listen(port = 0, host = '127.0.0.1') {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, host, () => {
          server.off('error', reject);
          resolve();
        });
      });
      return server.address();
    },
    async close() {
      for (const ws of clients.keys()) ws.close(1001, 'server shutdown');
      await new Promise((resolve) => wss.close(() => resolve()));
      if (server.listening) await new Promise((resolve) => server.close(() => resolve()));
    },
  };
}

export function capabilityClaims({ siteId, sub, role, jti, nowSec = Math.floor(Date.now() / 1000), lifetimeSec = 60 }) {
  return { v: 1, siteId, sub, role, jti, iat: nowSec, exp: nowSec + lifetimeSec };
}
