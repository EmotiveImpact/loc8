import { RelayContractError } from './contracts.mjs';

export const SENSITIVE_HEADERS = Object.freeze([
  'authorization',
  'cookie',
  'proxy-authorization',
  'sec-websocket-protocol',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
]);

const SENSITIVE = new Set(SENSITIVE_HEADERS);
const LOGGABLE = new Set(['host', 'origin', 'user-agent', 'x-forwarded-proto']);

export function redactHeaders(headers = {}) {
  const redacted = {};
  for (const [rawName, value] of Object.entries(headers)) {
    const name = rawName.toLowerCase();
    if (SENSITIVE.has(name)) redacted[name] = '[REDACTED]';
    else if (LOGGABLE.has(name)) redacted[name] = String(value);
  }
  return redacted;
}

export function normalizeAllowedOrigins(origins) {
  if (!origins || typeof origins[Symbol.iterator] !== 'function') {
    throw new RelayContractError('invalid_origin_config');
  }
  const normalized = new Set();
  for (const origin of origins) {
    let url;
    try {
      url = new URL(origin);
    } catch {
      throw new RelayContractError('invalid_origin_config');
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash
      || url.pathname !== '/' || url.toString() !== `${url.origin}/`) {
      throw new RelayContractError('invalid_origin_config');
    }
    normalized.add(url.origin);
  }
  if (normalized.size === 0) throw new RelayContractError('invalid_origin_config');
  return normalized;
}

export function normalizeFixedEndpoint(endpoint, allowedEndpoints) {
  let url;
  try {
    url = new URL(endpoint);
  } catch {
    throw new RelayContractError('invalid_endpoint');
  }
  if (url.protocol !== 'wss:' || url.username || url.password || url.search || url.hash) {
    throw new RelayContractError('invalid_endpoint', 'relay endpoint must be credential-free fixed wss');
  }
  const normalized = url.toString();
  if (!(allowedEndpoints instanceof Set) || !allowedEndpoints.has(normalized)) {
    throw new RelayContractError('endpoint_not_provisioned');
  }
  return normalized;
}

export function transportIsSecure(mode, request, trustedProxyAddresses = new Set()) {
  if (mode === 'direct') return request?.encrypted === true;
  if (mode !== 'trusted_proxy') return false;
  if (!trustedProxyAddresses.has(request?.remoteAddress)) return false;
  const forwarded = request?.forwardedProto;
  if (typeof forwarded !== 'string' || forwarded.includes(',')) return false;
  return forwarded.toLowerCase() === 'https' || forwarded.toLowerCase() === 'wss';
}

export function commandSecurityHeaders(fixedEndpoint) {
  const url = new URL(fixedEndpoint);
  if (url.protocol !== 'wss:') throw new RelayContractError('invalid_endpoint');
  return Object.freeze({
    'content-security-policy': [
      "default-src 'none'",
      "base-uri 'none'",
      `connect-src 'self' ${url.origin}`,
      "font-src 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "img-src 'self' data:",
      "manifest-src 'self'",
      "object-src 'none'",
      "script-src 'self'",
      "style-src 'self'",
      "worker-src 'none'",
      "require-trusted-types-for 'script'",
    ].join('; '),
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-resource-policy': 'same-origin',
    'referrer-policy': 'no-referrer',
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
  });
}
