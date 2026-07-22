import { RelayContractError } from './contracts.mjs';

export const PRODUCT_NODE_RANGE = Object.freeze({ major: 22, minimumMinor: 13 });
export const PRODUCT_WS_VERSION = '8.21.1';

function parseVersion(value) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(value ?? '');
  if (!match) throw new RelayContractError('invalid_runtime_version');
  return match.slice(1).map(Number);
}

/** Startup assertion for the future WebSocket adapter/image. */
export function assertDeterministicRuntime({ nodeVersion, wsVersion }) {
  const [major, minor] = parseVersion(nodeVersion);
  if (major !== PRODUCT_NODE_RANGE.major || minor < PRODUCT_NODE_RANGE.minimumMinor) {
    throw new RelayContractError('unsupported_node_runtime');
  }
  if (wsVersion !== PRODUCT_WS_VERSION) throw new RelayContractError('websocket_runtime_drift');
  return Object.freeze({ nodeVersion: nodeVersion.replace(/^v/, ''), wsVersion });
}
