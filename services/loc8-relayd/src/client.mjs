import {
  APPLICATION_PROTOCOL,
  AUTH_PROTOCOL_PREFIX,
  FRAME_BYTES,
  RelayContractError,
  requirePort,
} from './contracts.mjs';
import { normalizeFixedEndpoint } from './security.mjs';

export class ProductRelayClient {
  constructor({ endpoint, allowedEndpoints, role, capabilityProvider, socketFactory, reconnect, onState = () => {} }) {
    this.endpoint = normalizeFixedEndpoint(endpoint, allowedEndpoints);
    if (!['gateway', 'command'].includes(role)) throw new RelayContractError('invalid_role');
    this.role = role;
    this.capabilityProvider = requirePort(capabilityProvider, ['issueFresh'], 'capabilityProvider');
    this.socketFactory = requirePort(socketFactory, ['create'], 'socketFactory');
    this.reconnect = requirePort(reconnect, ['schedule', 'cancel'], 'reconnectScheduler');
    this.onState = onState;
    this.socket = null;
    this.running = false;
    this.generation = 0;
  }

  async start() {
    if (this.running) return;
    this.running = true;
    await this.#connect();
  }

  stop() {
    this.running = false;
    this.reconnect.cancel();
    this.socket?.close();
    this.socket = null;
    this.onState({ state: 'stopped' });
  }

  sendFrame(frame) {
    if (!frame || frame.byteLength !== FRAME_BYTES) throw new RelayContractError('invalid_frame');
    if (!this.socket || this.socket.readyState !== 1) return false;
    this.socket.send(frame);
    return true;
  }

  async #connect() {
    if (!this.running) return;
    const generation = ++this.generation;
    this.onState({ state: 'authenticating' });
    let capability;
    try {
      capability = await this.capabilityProvider.issueFresh({ endpoint: this.endpoint, role: this.role });
      if (typeof capability !== 'string' || capability.length < 16 || capability.length > 3500
        || !/^[A-Za-z0-9._~-]+$/.test(capability)) {
        throw new RelayContractError('capability_unavailable');
      }
      const protocols = [APPLICATION_PROTOCOL, AUTH_PROTOCOL_PREFIX + capability];
      const socket = this.socketFactory.create(this.endpoint, protocols);
      capability = undefined;
      if (!this.running || generation !== this.generation) {
        socket.close();
        return;
      }
      this.socket = socket;
      socket.binaryType = 'arraybuffer';
      socket.addEventListener('open', () => {
        if (socket.protocol !== APPLICATION_PROTOCOL) {
          this.onState({ state: 'protocol_rejected' });
          socket.close();
          return;
        }
        this.onState({ state: 'connected' });
      });
      socket.addEventListener('close', () => {
        if (this.socket === socket) this.socket = null;
        if (!this.running) return;
        this.onState({ state: 'unavailable' });
        this.reconnect.schedule(() => this.#connect());
      });
      socket.addEventListener('error', () => this.onState({ state: 'unavailable' }));
    } catch (error) {
      capability = undefined;
      this.onState({ state: 'unauthenticated', reason: error?.code ?? 'capability_unavailable' });
      if (this.running) this.reconnect.schedule(() => this.#connect());
    }
  }
}
