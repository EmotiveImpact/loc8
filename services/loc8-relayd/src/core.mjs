import {
  FRAME_BYTES,
  RelayContractError,
  oppositeRole,
  requirePort,
  validatePrincipal,
} from './contracts.mjs';
import { normalizeAllowedOrigins, transportIsSecure } from './security.mjs';

const DEFAULT_LIMITS = Object.freeze({
  maxConnections: 128,
  maxConnectionsPerSite: 64,
  framesPerSecond: 20,
  burstFrames: 40,
  maxQueueBytes: 64 * 1024,
  maxQueueAgeMs: 5_000,
  maxSessionAgeMs: 15 * 60_000,
});

function validateLimits(overrides = {}) {
  const limits = { ...DEFAULT_LIMITS, ...overrides };
  for (const key of ['maxConnections', 'maxConnectionsPerSite', 'burstFrames', 'maxQueueBytes', 'maxQueueAgeMs', 'maxSessionAgeMs']) {
    if (!Number.isSafeInteger(limits[key]) || limits[key] < 1) throw new RelayContractError('invalid_limit', key);
  }
  if (!Number.isFinite(limits.framesPerSecond) || limits.framesPerSecond < 0) {
    throw new RelayContractError('invalid_limit', 'framesPerSecond');
  }
  return Object.freeze(limits);
}

function validFrame(frame, binary) {
  return binary === true
    && (frame instanceof ArrayBuffer || ArrayBuffer.isView(frame))
    && frame.byteLength === FRAME_BYTES;
}

export class RelaydCore {
  constructor({ verifier, revocations, replay, policy, audit, clock, tls, allowedCommandOrigins, limits }) {
    this.verifier = requirePort(verifier, ['verify'], 'capabilityVerifier');
    this.revocations = requirePort(revocations, ['isRevoked'], 'revocationStore');
    this.replay = requirePort(replay, ['consume'], 'replayStore');
    this.policy = requirePort(policy, ['authorizeConnection', 'authorizeRoute'], 'sitePolicy');
    this.audit = requirePort(audit, ['append'], 'auditLog');
    this.clock = requirePort(clock, ['now'], 'clock');
    if (!tls || !['direct', 'trusted_proxy'].includes(tls.mode)) throw new RelayContractError('invalid_tls_config');
    if (tls.mode === 'trusted_proxy' && (!(tls.trustedProxyAddresses instanceof Set) || tls.trustedProxyAddresses.size === 0)) {
      throw new RelayContractError('invalid_tls_config');
    }
    this.tls = Object.freeze({ mode: tls.mode, trustedProxyAddresses: tls.trustedProxyAddresses ?? new Set() });
    this.allowedCommandOrigins = normalizeAllowedOrigins(allowedCommandOrigins);
    this.limits = validateLimits(limits);
    this.connections = new Map();
    this.sequence = 0;
    this.available = true;
    this.metrics = {
      acceptedConnections: 0,
      rejectedConnections: 0,
      acceptedFrames: 0,
      droppedFrames: 0,
      deliveredFrames: 0,
      droppedDeliveries: 0,
    };
  }

  #instant() {
    if (!this.available) throw new RelayContractError('service_unavailable');
    const instant = this.clock.now();
    if (!instant || !Number.isSafeInteger(instant.wallMs) || !Number.isFinite(instant.monotonicMs)) {
      throw new RelayContractError('clock_unavailable');
    }
    if (instant.trusted !== true) throw new RelayContractError('clock_untrusted');
    return instant;
  }

  async #appendAudit(event, detail) {
    if (!this.available) throw new RelayContractError('service_unavailable');
    try {
      await this.audit.append(event, detail);
    } catch (error) {
      this.available = false;
      for (const connection of this.connections.values()) connection.sink.close('audit_unavailable');
      this.connections.clear();
      throw new RelayContractError('audit_unavailable', error instanceof Error ? error.message : 'audit unavailable');
    }
  }

  async #reject(code, detail = {}) {
    this.metrics.rejectedConnections++;
    await this.#appendAudit('connection_rejected', { reason: code, ...detail });
    throw new RelayContractError(code);
  }

  async acceptConnection({ capability, origin, request, sink }) {
    requirePort(sink, ['send', 'close', 'bufferedBytes', 'oldestBufferedAtMonotonicMs'], 'connectionSink');
    const instant = this.#instant();
    if (!transportIsSecure(this.tls.mode, request, this.tls.trustedProxyAddresses)) {
      return this.#reject('tls_required');
    }
    if (typeof capability !== 'string' || capability.length < 1 || capability.length > 4096) {
      return this.#reject('authentication_required');
    }
    let untrusted;
    try {
      untrusted = await this.verifier.verify(capability, { nowMs: instant.wallMs });
    } catch {
      return this.#reject('invalid_capability');
    }
    let principal;
    try {
      principal = validatePrincipal(untrusted, instant.wallMs);
    } catch (error) {
      return this.#reject(error.code ?? 'invalid_capability');
    }
    if (principal.role === 'command' && !this.allowedCommandOrigins.has(origin)) {
      return this.#reject('origin_rejected', { siteId: principal.siteId, subjectId: principal.subjectId, role: principal.role });
    }
    if (await this.revocations.isRevoked(principal, instant.wallMs)) {
      return this.#reject('revoked', { siteId: principal.siteId, subjectId: principal.subjectId, role: principal.role });
    }
    if (!(await this.policy.authorizeConnection(principal))) {
      return this.#reject('policy_rejected', { siteId: principal.siteId, subjectId: principal.subjectId, role: principal.role });
    }
    if (this.connections.size >= this.limits.maxConnections) return this.#reject('connection_limit');
    const atSite = () => [...this.connections.values()]
      .filter((entry) => entry.principal.siteId === principal.siteId).length;
    if (atSite() >= this.limits.maxConnectionsPerSite) return this.#reject('site_connection_limit', { siteId: principal.siteId });
    const consumed = await this.replay.consume({
      issuerId: principal.issuerId,
      siteId: principal.siteId,
      tokenId: principal.tokenId,
      expiresAtMs: principal.expiresAtMs,
    });
    if (!consumed) return this.#reject('replayed', { siteId: principal.siteId, subjectId: principal.subjectId, role: principal.role });

    // Verifier/revocation/policy/replay ports are asynchronous. Recheck capacity
    // after the final await; this synchronous check+insert section prevents a
    // concurrent admission wave from crossing the configured bounds.
    if (this.connections.size >= this.limits.maxConnections) return this.#reject('connection_limit');
    if (atSite() >= this.limits.maxConnectionsPerSite) return this.#reject('site_connection_limit', { siteId: principal.siteId });

    const id = `connection-${++this.sequence}`;
    this.connections.set(id, {
      id,
      principal,
      sink,
      tokens: this.limits.burstFrames,
      lastRefillMs: instant.monotonicMs,
      acceptedAtMonotonicMs: instant.monotonicMs,
    });
    try {
      await this.#appendAudit('connection_accepted', {
        connectionId: id,
        siteId: principal.siteId,
        subjectId: principal.subjectId,
        role: principal.role,
      });
    } catch (error) {
      // The one-use capability stays consumed, but a connection cannot become
      // live unless its admission record is durably accepted.
      this.connections.delete(id);
      sink.close('audit_unavailable');
      throw error;
    }
    this.metrics.acceptedConnections++;
    return Object.freeze({ id, siteId: principal.siteId, subjectId: principal.subjectId, role: principal.role });
  }

  async closeConnection(id, reason = 'closed') {
    const connection = this.connections.get(id);
    if (!connection) return;
    this.connections.delete(id);
    await this.#appendAudit('connection_closed', {
      connectionId: id,
      siteId: connection.principal.siteId,
      subjectId: connection.principal.subjectId,
      role: connection.principal.role,
      reason,
    });
  }

  async receive(id, frame, { binary = true } = {}) {
    const sender = this.connections.get(id);
    if (!sender) throw new RelayContractError('unknown_connection');
    const instant = this.#instant();
    if (instant.wallMs >= sender.principal.expiresAtMs
      || instant.monotonicMs - sender.acceptedAtMonotonicMs >= this.limits.maxSessionAgeMs) {
      sender.sink.close('session_expired');
      await this.closeConnection(id, 'session_expired');
      throw new RelayContractError('session_expired');
    }
    if (!validFrame(frame, binary)) {
      this.metrics.droppedFrames++;
      await this.#appendAudit('frame_dropped', {
        connectionId: id,
        siteId: sender.principal.siteId,
        subjectId: sender.principal.subjectId,
        role: sender.principal.role,
        reason: 'invalid_frame',
      });
      return 0;
    }

    const elapsed = Math.max(0, instant.monotonicMs - sender.lastRefillMs);
    sender.tokens = Math.min(this.limits.burstFrames, sender.tokens + elapsed * this.limits.framesPerSecond / 1000);
    sender.lastRefillMs = instant.monotonicMs;
    if (sender.tokens < 1) {
      this.metrics.droppedFrames++;
      await this.#appendAudit('frame_dropped', {
        connectionId: id,
        siteId: sender.principal.siteId,
        subjectId: sender.principal.subjectId,
        role: sender.principal.role,
        reason: 'rate_limited',
      });
      return 0;
    }
    sender.tokens -= 1;
    this.metrics.acceptedFrames++;
    // Persist acceptance before the first external send. The later routed
    // record adds delivery count, but an audit failure cannot leave an entirely
    // unrecorded accepted frame that was already delivered.
    await this.#appendAudit('frame_accepted', {
      connectionId: id,
      siteId: sender.principal.siteId,
      subjectId: sender.principal.subjectId,
      role: sender.principal.role,
    });

    let delivered = 0;
    const targetRole = oppositeRole(sender.principal.role);
    for (const peer of [...this.connections.values()]) {
      if (peer.id === id || peer.principal.siteId !== sender.principal.siteId || peer.principal.role !== targetRole) continue;
      if (!(await this.policy.authorizeRoute(sender.principal, peer.principal))) continue;
      const oldest = peer.sink.oldestBufferedAtMonotonicMs();
      const queueTooOld = oldest != null && instant.monotonicMs - oldest > this.limits.maxQueueAgeMs;
      if (peer.sink.bufferedBytes() + frame.byteLength > this.limits.maxQueueBytes || queueTooOld) {
        this.metrics.droppedDeliveries++;
        peer.sink.close('slow_consumer');
        await this.closeConnection(peer.id, 'slow_consumer');
        continue;
      }
      try {
        await peer.sink.send(frame);
        delivered++;
      } catch {
        this.metrics.droppedDeliveries++;
        peer.sink.close('send_failed');
        await this.closeConnection(peer.id, 'send_failed');
      }
    }
    this.metrics.deliveredFrames += delivered;
    await this.#appendAudit('frame_routed', {
      connectionId: id,
      siteId: sender.principal.siteId,
      subjectId: sender.principal.subjectId,
      role: sender.principal.role,
      delivered,
    });
    return delivered;
  }

  snapshot() {
    return Object.freeze({
      connectionCount: this.connections.size,
      available: this.available,
      metrics: Object.freeze({ ...this.metrics }),
    });
  }
}
