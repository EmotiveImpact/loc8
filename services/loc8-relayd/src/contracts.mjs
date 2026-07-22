export const APPLICATION_PROTOCOL = 'loc8.v1';
export const AUTH_PROTOCOL_PREFIX = 'loc8.auth.';
export const FRAME_BYTES = 25;
export const RELAY_ROLES = Object.freeze(['gateway', 'command']);

export class RelayContractError extends Error {
  constructor(code, message = code) {
    super(message);
    this.name = 'RelayContractError';
    this.code = code;
  }
}

export function requirePort(port, methods, name) {
  if (!port || methods.some((method) => typeof port[method] !== 'function')) {
    throw new RelayContractError('invalid_dependency', `${name} must implement ${methods.join(', ')}`);
  }
  return port;
}

export function validatePrincipal(value, nowMs) {
  const validId = (id) =>
    typeof id === 'string' && id.length > 0 && id.length <= 128 && /^[A-Za-z0-9_.:-]+$/.test(id);
  if (!value || value.version !== 1) throw new RelayContractError('invalid_capability', 'unsupported capability version');
  for (const field of ['issuerId', 'siteId', 'subjectId', 'tokenId']) {
    if (!validId(value[field])) throw new RelayContractError('invalid_capability', `invalid ${field}`);
  }
  if (!RELAY_ROLES.includes(value.role)) throw new RelayContractError('invalid_role');
  if (!Number.isSafeInteger(value.issuedAtMs) || !Number.isSafeInteger(value.expiresAtMs)) {
    throw new RelayContractError('invalid_capability', 'invalid capability time');
  }
  if (value.expiresAtMs <= value.issuedAtMs || value.expiresAtMs <= nowMs) {
    throw new RelayContractError('expired_capability');
  }
  if (value.issuedAtMs > nowMs + 30_000 || value.expiresAtMs - value.issuedAtMs > 15 * 60_000) {
    throw new RelayContractError('invalid_capability', 'invalid capability lifetime');
  }
  return Object.freeze({
    version: 1,
    issuerId: value.issuerId,
    siteId: value.siteId,
    subjectId: value.subjectId,
    role: value.role,
    tokenId: value.tokenId,
    issuedAtMs: value.issuedAtMs,
    expiresAtMs: value.expiresAtMs,
  });
}

export function oppositeRole(role) {
  if (role === 'gateway') return 'command';
  if (role === 'command') return 'gateway';
  throw new RelayContractError('invalid_role');
}
