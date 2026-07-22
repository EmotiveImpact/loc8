// Loc8 protocol-v2 boundary research spike.
//
// This module intentionally contains no cryptography. Opaque logical frames and
// signed-policy/topology claims must be opened or verified by a separately
// reviewed provider before application delivery or routing authority is granted.

export const LEGACY_PACKET_SIZE = 25;
export const V2_CELL_SIZE = 25;
export const V2_CELL_MARKER = 0xd2;
export const V2_CELL_HEADER_SIZE = 16;
export const V2_CELL_BODY_SIZE = V2_CELL_SIZE - V2_CELL_HEADER_SIZE; // 9
export const V2_MAX_FRAGMENTS = 255;

const LEGACY_TYPE_MIN = 0;
const LEGACY_TYPE_MAX = 7;

function asBytes(value, name = 'value') {
  if (!(value instanceof Uint8Array)) throw new TypeError(`${name} must be Uint8Array`);
  return value;
}

function sameBytes(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false;
  return true;
}

function hex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function classifyCarrierCell(value) {
  const bytes = asBytes(value, 'cell');
  if (bytes.length !== LEGACY_PACKET_SIZE) return { kind: 'invalid', reason: 'length' };
  if (bytes[0] === V2_CELL_MARKER) return { kind: 'v2-cell' };
  if (bytes[0] >= LEGACY_TYPE_MIN && bytes[0] <= LEGACY_TYPE_MAX) {
    return { kind: 'v1', packetTypeCode: bytes[0] };
  }
  return { kind: 'invalid', reason: 'discriminator' };
}

/**
 * Split one opaque v2 logical frame into fixed 25-byte transport cells.
 * The 8-byte handle is a routing/dedup handle supplied by the reviewed logical
 * frame layer. It is not an identity, authentication tag or cryptographic key.
 */
export function segmentV2Frame(payloadValue, { handle: handleValue, carrierPseudonym: pseudonymValue } = {}) {
  const payload = asBytes(payloadValue, 'payload');
  const handle = asBytes(handleValue, 'handle');
  const carrierPseudonym = asBytes(pseudonymValue, 'carrierPseudonym');
  if (payload.length < 1) throw new RangeError('payload must not be empty');
  if (handle.length !== 8) throw new RangeError('handle must be exactly 8 bytes');
  if (carrierPseudonym.length !== 4) throw new RangeError('carrierPseudonym must be exactly 4 bytes');
  const count = Math.ceil(payload.length / V2_CELL_BODY_SIZE);
  if (count > V2_MAX_FRAGMENTS) throw new RangeError('logical frame exceeds v2 cell count');

  const cells = [];
  for (let index = 0; index < count; index += 1) {
    const start = index * V2_CELL_BODY_SIZE;
    const body = payload.subarray(start, Math.min(payload.length, start + V2_CELL_BODY_SIZE));
    const cell = new Uint8Array(V2_CELL_SIZE);
    cell[0] = V2_CELL_MARKER;
    // Existing native v1 wrapping derives its 8-byte outer sender ID from
    // application bytes 1...4. Keep these four bytes stable across every cell
    // of one sender rotation period so legacy native relays do not manufacture
    // a different apparent sender for every fragment. This value grants no
    // authority; its generation/rotation belongs to the reviewed identity layer.
    cell.set(carrierPseudonym, 1);
    cell[5] = index;
    cell[6] = count;
    cell.set(handle, 7);
    cell[15] = body.length;
    cell.set(body, V2_CELL_HEADER_SIZE);
    cells.push(cell);
  }
  return cells;
}

export function decodeV2Cell(value) {
  const cell = asBytes(value, 'cell');
  if (cell.length !== V2_CELL_SIZE) throw new RangeError('v2 cell must be exactly 25 bytes');
  if (cell[0] !== V2_CELL_MARKER) throw new RangeError('not a v2 cell');
  const index = cell[5];
  const count = cell[6];
  const bodyLength = cell[15];
  if (count < 1 || index >= count) throw new RangeError('invalid fragment index/count');
  if (bodyLength < 1 || bodyLength > V2_CELL_BODY_SIZE) throw new RangeError('invalid body length');
  if (index < count - 1 && bodyLength !== V2_CELL_BODY_SIZE) {
    throw new RangeError('non-final fragment must be full');
  }
  for (let i = V2_CELL_HEADER_SIZE + bodyLength; i < V2_CELL_SIZE; i += 1) {
    if (cell[i] !== 0) throw new RangeError('non-zero v2 cell padding');
  }
  return {
    carrierPseudonym: cell.slice(1, 5),
    index,
    count,
    handle: cell.slice(7, 15),
    body: cell.slice(V2_CELL_HEADER_SIZE, V2_CELL_HEADER_SIZE + bodyLength),
  };
}

export class BoundedV2Reassembler {
  constructor({
    maxFrameBytes = 2048,
    maxAssemblies = 32,
    maxAssembliesPerPeer = 4,
    maxBufferedBytes = 32 * 1024,
    assemblyTimeoutMs = 30_000,
  } = {}) {
    for (const [name, value] of Object.entries({
      maxFrameBytes, maxAssemblies, maxAssembliesPerPeer, maxBufferedBytes, assemblyTimeoutMs,
    })) {
      if (!Number.isInteger(value) || value < 1) throw new RangeError(`${name} must be positive`);
    }
    this.config = { maxFrameBytes, maxAssemblies, maxAssembliesPerPeer, maxBufferedBytes, assemblyTimeoutMs };
    this.assemblies = new Map();
    this.bufferedBytes = 0;
  }

  ingest(peerId, cellValue, nowMs) {
    if (typeof peerId !== 'string' || peerId.length < 1 || peerId.length > 128) {
      return { status: 'rejected', reason: 'peer-id' };
    }
    if (!Number.isFinite(nowMs)) return { status: 'rejected', reason: 'clock' };
    this.prune(nowMs);

    let cell;
    try {
      cell = decodeV2Cell(cellValue);
    } catch (error) {
      return { status: 'rejected', reason: 'cell', detail: error.message };
    }
    const maxFragments = Math.ceil(this.config.maxFrameBytes / V2_CELL_BODY_SIZE);
    if (cell.count > maxFragments) return { status: 'rejected', reason: 'frame-limit' };
    const key = `${peerId}:${hex(cell.carrierPseudonym)}:${hex(cell.handle)}`;
    let assembly = this.assemblies.get(key);

    if (!assembly) {
      if (this.assemblies.size >= this.config.maxAssemblies) {
        return { status: 'rejected', reason: 'assembly-limit' };
      }
      let peerAssemblies = 0;
      for (const value of this.assemblies.values()) if (value.peerId === peerId) peerAssemblies += 1;
      if (peerAssemblies >= this.config.maxAssembliesPerPeer) {
        return { status: 'rejected', reason: 'peer-assembly-limit' };
      }
      assembly = {
        peerId,
        count: cell.count,
        handle: cell.handle,
        carrierPseudonym: cell.carrierPseudonym,
        chunks: new Map(),
        bytes: 0,
        firstSeenMs: nowMs,
        updatedMs: nowMs,
      };
      this.assemblies.set(key, assembly);
    } else if (assembly.count !== cell.count) {
      this.drop(key);
      return { status: 'rejected', reason: 'conflicting-count' };
    }

    const prior = assembly.chunks.get(cell.index);
    if (prior) {
      if (sameBytes(prior, cell.body)) return { status: 'duplicate' };
      this.drop(key);
      return { status: 'rejected', reason: 'conflicting-fragment' };
    }
    if (assembly.bytes + cell.body.length > this.config.maxFrameBytes) {
      this.drop(key);
      return { status: 'rejected', reason: 'frame-limit' };
    }
    if (this.bufferedBytes + cell.body.length > this.config.maxBufferedBytes) {
      this.drop(key);
      return { status: 'rejected', reason: 'buffer-limit' };
    }

    assembly.chunks.set(cell.index, cell.body);
    assembly.bytes += cell.body.length;
    assembly.updatedMs = nowMs;
    this.bufferedBytes += cell.body.length;
    if (assembly.chunks.size !== assembly.count) return { status: 'accepted' };

    const payload = new Uint8Array(assembly.bytes);
    let offset = 0;
    for (let index = 0; index < assembly.count; index += 1) {
      const chunk = assembly.chunks.get(index);
      if (!chunk) return { status: 'accepted' };
      payload.set(chunk, offset);
      offset += chunk.length;
    }
    this.drop(key);
    return { status: 'complete', payload, handle: cell.handle, carrierPseudonym: cell.carrierPseudonym };
  }

  prune(nowMs) {
    for (const [key, assembly] of this.assemblies) {
      if (nowMs - assembly.updatedMs >= this.config.assemblyTimeoutMs) this.drop(key);
    }
  }

  drop(key) {
    const assembly = this.assemblies.get(key);
    if (!assembly) return;
    this.bufferedBytes -= assembly.bytes;
    this.assemblies.delete(key);
  }

  stats() {
    return { assemblies: this.assemblies.size, bufferedBytes: this.bufferedBytes };
  }
}

/** Require the reviewed logical-frame provider at the security boundary. */
export function verifyAndOpenLogicalFrame(frame, context, reviewedProvider) {
  if (!reviewedProvider || typeof reviewedProvider.verifyAndOpen !== 'function') {
    return { status: 'rejected', reason: 'no-reviewed-provider' };
  }
  let result;
  try {
    result = reviewedProvider.verifyAndOpen(asBytes(frame, 'frame'), context);
  } catch {
    return { status: 'rejected', reason: 'provider-error' };
  }
  if (!result || result.authenticated !== true || !(result.plaintext instanceof Uint8Array)) {
    return { status: 'rejected', reason: 'authentication' };
  }
  return { status: 'accepted', plaintext: result.plaintext, claims: result.claims ?? null };
}

const MODE_RANK = Object.freeze({ legacy: 0, dual: 1, 'v2-required': 2 });

export class MigrationGuard {
  constructor({ siteId, shiftId, snapshot = null } = {}) {
    if (!siteId || !shiftId) throw new Error('siteId and shiftId are required');
    this.siteId = siteId;
    this.shiftId = shiftId;
    this.epoch = 0;
    this.mode = 'legacy';
    this.allowedLegacyTypes = new Set();
    this.peerCapabilities = new Map();
    if (snapshot) this.restore(snapshot);
  }

  applyPolicy(policy, verified) {
    if (verified !== true) return { accepted: false, reason: 'unverified' };
    if (!policy || policy.siteId !== this.siteId || policy.shiftId !== this.shiftId) {
      return { accepted: false, reason: 'scope' };
    }
    if (!Number.isSafeInteger(policy.epoch) || policy.epoch < 1 || !(policy.mode in MODE_RANK)) {
      return { accepted: false, reason: 'shape' };
    }
    if (policy.epoch < this.epoch) return { accepted: false, reason: 'stale-epoch' };
    if (MODE_RANK[policy.mode] < MODE_RANK[this.mode]) return { accepted: false, reason: 'mode-regression' };
    if (policy.epoch === this.epoch && policy.mode !== this.mode) {
      return { accepted: false, reason: 'same-epoch-conflict' };
    }
    const allowed = policy.allowedLegacyTypes ?? [];
    if (!Array.isArray(allowed) || allowed.some((value) => !Number.isInteger(value) || value < 0 || value > 7)) {
      return { accepted: false, reason: 'legacy-types' };
    }
    const normalizedAllowed = policy.mode === 'dual' ? [...new Set(allowed)].sort((a, b) => a - b) : [];
    if (policy.epoch === this.epoch) {
      const currentAllowed = [...this.allowedLegacyTypes].sort((a, b) => a - b);
      if (policy.mode !== this.mode || !sameArray(currentAllowed, normalizedAllowed)) {
        return { accepted: false, reason: 'same-epoch-conflict' };
      }
      return { accepted: true, idempotent: true };
    }
    this.epoch = policy.epoch;
    this.mode = policy.mode;
    this.allowedLegacyTypes = new Set(normalizedAllowed);
    return { accepted: true };
  }

  observePeerCapability(peerId, capability, verified) {
    if (verified !== true) return false;
    if (!peerId || !capability || !['v1', 'v2'].includes(capability.version)) return false;
    this.peerCapabilities.set(peerId, { ...capability });
    return true;
  }

  acceptCarrier(value) {
    const classification = classifyCarrierCell(value);
    if (classification.kind === 'invalid') return { accepted: false, reason: 'invalid' };
    if (classification.kind === 'v2-cell') return { accepted: true, protocol: 'v2' };
    if (this.mode === 'legacy') return { accepted: true, protocol: 'v1' };
    if (this.mode === 'v2-required') return { accepted: false, reason: 'v2-required' };
    if (!this.allowedLegacyTypes.has(classification.packetTypeCode)) {
      return { accepted: false, reason: 'legacy-type-blocked' };
    }
    return { accepted: true, protocol: 'v1' };
  }

  snapshot() {
    return {
      version: 1,
      siteId: this.siteId,
      shiftId: this.shiftId,
      epoch: this.epoch,
      mode: this.mode,
      allowedLegacyTypes: [...this.allowedLegacyTypes].sort((a, b) => a - b),
    };
  }

  restore(snapshot) {
    if (!snapshot || snapshot.version !== 1 || snapshot.siteId !== this.siteId || snapshot.shiftId !== this.shiftId) {
      throw new Error('invalid migration snapshot scope/version');
    }
    if (!Number.isSafeInteger(snapshot.epoch) || snapshot.epoch < 0 || !(snapshot.mode in MODE_RANK)) {
      throw new Error('invalid migration snapshot state');
    }
    const allowed = snapshot.allowedLegacyTypes ?? [];
    if (!Array.isArray(allowed)
      || allowed.some((value) => !Number.isInteger(value) || value < 0 || value > 7)
      || (snapshot.mode !== 'dual' && allowed.length > 0)) {
      throw new Error('invalid migration snapshot legacy types');
    }
    this.epoch = snapshot.epoch;
    this.mode = snapshot.mode;
    this.allowedLegacyTypes = new Set(allowed);
  }
}

export class BoundedDedupStore {
  constructor({ capacity = 1000, maxAgeMs = 300_000, controlReserve = 0.2 } = {}) {
    if (!Number.isInteger(capacity) || capacity < 2) throw new RangeError('capacity must be >= 2');
    if (!Number.isInteger(maxAgeMs) || maxAgeMs < 1) throw new RangeError('maxAgeMs must be positive');
    if (!(controlReserve >= 0 && controlReserve < 1)) throw new RangeError('controlReserve must be [0,1)');
    this.capacity = capacity;
    this.maxAgeMs = maxAgeMs;
    this.controlSlots = Math.floor(capacity * controlReserve);
    this.bulkLimit = capacity - this.controlSlots;
    this.entries = new Map();
  }

  checkAndRemember(key, trafficClass, nowMs) {
    if (!['bulk', 'control'].includes(trafficClass)) throw new Error('trafficClass must be bulk or control');
    this.prune(nowMs);
    if (this.entries.has(key)) return { status: 'duplicate' };

    if (trafficClass === 'bulk' && this.countClass('bulk') >= this.bulkLimit) {
      if (!this.evictOldest('bulk')) return { status: 'rejected', reason: 'control-reserve' };
    }
    if (this.entries.size >= this.capacity) {
      const evicted = trafficClass === 'control'
        ? (this.evictOldest('bulk') || this.evictOldest('control'))
        : this.evictOldest('bulk');
      if (!evicted) return { status: 'rejected', reason: 'capacity' };
    }
    this.entries.set(key, { trafficClass, expiresAtMs: nowMs + this.maxAgeMs });
    return { status: 'accepted' };
  }

  prune(nowMs) {
    for (const [key, entry] of this.entries) if (entry.expiresAtMs <= nowMs) this.entries.delete(key);
  }

  countClass(trafficClass) {
    let count = 0;
    for (const entry of this.entries.values()) if (entry.trafficClass === trafficClass) count += 1;
    return count;
  }

  evictOldest(trafficClass) {
    for (const [key, entry] of this.entries) {
      if (entry.trafficClass === trafficClass) {
        this.entries.delete(key);
        return true;
      }
    }
    return false;
  }

  snapshot(nowMs) {
    this.prune(nowMs);
    return {
      version: 1,
      entries: [...this.entries].map(([key, entry]) => ({
        key,
        trafficClass: entry.trafficClass,
        remainingMs: Math.max(0, entry.expiresAtMs - nowMs),
      })),
    };
  }

  restore(snapshot, nowMs, trustedDowntimeMs = 0) {
    if (!snapshot || snapshot.version !== 1 || !Array.isArray(snapshot.entries)) throw new Error('invalid dedup snapshot');
    if (!Number.isFinite(trustedDowntimeMs) || trustedDowntimeMs < 0) throw new Error('invalid downtime');
    this.entries.clear();
    for (const entry of snapshot.entries.slice(-this.capacity)) {
      const remainingMs = Math.min(this.maxAgeMs, entry.remainingMs) - trustedDowntimeMs;
      if (remainingMs <= 0 || !['bulk', 'control'].includes(entry.trafficClass)) continue;
      this.entries.set(entry.key, { trafficClass: entry.trafficClass, expiresAtMs: nowMs + remainingMs });
    }
  }

  stats() {
    return { total: this.entries.size, bulk: this.countClass('bulk'), control: this.countClass('control') };
  }
}

export class VerifiedTopology {
  constructor({ maxNodes = 128, maxNeighbors = 16, maxObservationAgeMs = 60_000 } = {}) {
    for (const [name, value] of Object.entries({ maxNodes, maxNeighbors, maxObservationAgeMs })) {
      if (!Number.isInteger(value) || value < 1) throw new RangeError(`${name} must be positive`);
    }
    this.maxNodes = maxNodes;
    this.maxNeighbors = maxNeighbors;
    this.maxObservationAgeMs = maxObservationAgeMs;
    this.nodes = new Map();
  }

  update({ nodeId, neighbors, observedAtMs }, verified, nowMs) {
    if (verified !== true) return { accepted: false, reason: 'unverified' };
    if (!validNodeId(nodeId) || !Array.isArray(neighbors) || neighbors.length > this.maxNeighbors) {
      return { accepted: false, reason: 'shape' };
    }
    if (!Number.isFinite(observedAtMs) || observedAtMs > nowMs || nowMs - observedAtMs > this.maxObservationAgeMs) {
      return { accepted: false, reason: 'stale' };
    }
    if (!this.nodes.has(nodeId) && this.nodes.size >= this.maxNodes) return { accepted: false, reason: 'node-limit' };
    const clean = new Set();
    for (const neighbor of neighbors) {
      if (!validNodeId(neighbor) || neighbor === nodeId) return { accepted: false, reason: 'neighbor' };
      clean.add(neighbor);
    }
    const prior = this.nodes.get(nodeId);
    if (prior && observedAtMs < prior.observedAtMs) return { accepted: false, reason: 'observation-regression' };
    if (prior && observedAtMs === prior.observedAtMs && !sameArray([...prior.neighbors].sort(), [...clean].sort())) {
      return { accepted: false, reason: 'observation-conflict' };
    }
    this.nodes.set(nodeId, {
      neighbors: clean,
      observedAtMs,
      expiresAtMs: observedAtMs + this.maxObservationAgeMs,
    });
    return { accepted: true };
  }

  sourceRoute(from, to, nowMs, maxHops = 7, excludedEdges = new Set()) {
    if (from === to) return [from];
    const queue = [[from]];
    const seen = new Set([from]);
    while (queue.length) {
      const path = queue.shift();
      if (path.length - 1 >= maxHops) continue;
      const current = path[path.length - 1];
      for (const neighbor of this.mutualNeighbors(current, nowMs)) {
        if (excludedEdges.has(edgeKey(current, neighbor))) continue;
        if (seen.has(neighbor)) continue;
        const next = [...path, neighbor];
        if (neighbor === to) return next;
        seen.add(neighbor);
        queue.push(next);
      }
    }
    return null;
  }

  mutualNeighbors(nodeId, nowMs) {
    const source = this.nodes.get(nodeId);
    if (!source || source.expiresAtMs <= nowMs) return [];
    const result = [];
    for (const neighbor of source.neighbors) {
      const target = this.nodes.get(neighbor);
      if (target && target.expiresAtMs > nowMs && target.neighbors.has(nodeId)) result.push(neighbor);
    }
    return result.sort();
  }
}

function validNodeId(value) {
  return typeof value === 'string' && value.length >= 1 && value.length <= 64;
}

function sameArray(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function edgeKey(a, b) {
  return a < b ? `${a}\0${b}` : `${b}\0${a}`;
}

/** Deterministic load-spreading score. It is explicitly not a security hash. */
function nonSecurityScore(nodeId, neighborId, handle) {
  let value = 0x811c9dc5;
  const bytes = [...new TextEncoder().encode(`${nodeId}\0${neighborId}`), ...handle];
  for (const byte of bytes) {
    value ^= byte;
    value = Math.imul(value, 0x01000193) >>> 0;
  }
  return value;
}

export function selectFanout(neighborsValue, handleValue, { nodeId = 'local', trafficClass = 'normal' } = {}) {
  const handle = asBytes(handleValue, 'handle');
  if (handle.length !== 8) throw new RangeError('handle must be exactly 8 bytes');
  const neighbors = [...new Set(neighborsValue)].sort();
  if (['control', 'announcement', 'fragment', 'sync'].includes(trafficClass)) return neighbors;
  if (neighbors.length <= 2) return neighbors;
  const count = Math.ceil(Math.log2(neighbors.length + 1));
  return neighbors
    .map((neighbor) => ({ neighbor, score: nonSecurityScore(nodeId, neighbor, handle) }))
    .sort((a, b) => a.score - b.score || a.neighbor.localeCompare(b.neighbor))
    .slice(0, count)
    .map(({ neighbor }) => neighbor);
}

export function routeOrFlood(topology, from, to, nowMs, maxHops = 7, failedEdges = []) {
  const excludedEdges = new Set();
  for (const edge of failedEdges) {
    if (!Array.isArray(edge) || edge.length !== 2 || !validNodeId(edge[0]) || !validNodeId(edge[1])) {
      throw new TypeError('failedEdges must contain node-id pairs');
    }
    excludedEdges.add(edgeKey(edge[0], edge[1]));
  }
  const route = topology.sourceRoute(from, to, nowMs, maxHops, excludedEdges);
  return route ? { mode: 'source-route', route } : { mode: 'controlled-flood' };
}
