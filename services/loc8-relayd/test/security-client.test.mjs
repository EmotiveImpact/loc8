import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { ProductRelayClient } from '../src/client.mjs';
import { APPLICATION_PROTOCOL, FRAME_BYTES } from '../src/contracts.mjs';
import { commandSecurityHeaders, normalizeFixedEndpoint, redactHeaders, transportIsSecure } from '../src/security.mjs';
import { PRODUCT_WS_VERSION, assertDeterministicRuntime } from '../src/runtime.mjs';

class FakeSocket {
  constructor() {
    this.readyState = 0;
    this.binaryType = '';
    this.protocol = '';
    this.listeners = new Map();
    this.sent = [];
  }
  addEventListener(type, callback) {
    const list = this.listeners.get(type) ?? [];
    list.push(callback);
    this.listeners.set(type, list);
  }
  fire(type) {
    for (const callback of this.listeners.get(type) ?? []) callback({});
  }
  open(protocol = APPLICATION_PROTOCOL) {
    this.readyState = 1;
    this.protocol = protocol;
    this.fire('open');
  }
  close() {
    this.readyState = 3;
    this.fire('close');
  }
  send(value) {
    this.sent.push(value);
  }
}

class ManualReconnect {
  schedule(callback) {
    this.callback = callback;
  }
  cancel() {
    this.callback = null;
  }
  async run() {
    const callback = this.callback;
    this.callback = null;
    await callback?.();
  }
}

describe('fixed endpoint, redaction and browser defence in depth', () => {
  test('fails startup below the Node minimum or on either observed drifting ws runtime', () => {
    assert.deepEqual(assertDeterministicRuntime({ nodeVersion: '22.13.0', wsVersion: PRODUCT_WS_VERSION }), {
      nodeVersion: '22.13.0', wsVersion: '8.21.1',
    });
    assert.throws(() => assertDeterministicRuntime({ nodeVersion: '22.12.0', wsVersion: PRODUCT_WS_VERSION }),
      (error) => error?.code === 'unsupported_node_runtime');
    assert.throws(() => assertDeterministicRuntime({ nodeVersion: '22.13.0', wsVersion: '7.5.11' }),
      (error) => error?.code === 'websocket_runtime_drift');
    assert.throws(() => assertDeterministicRuntime({ nodeVersion: '22.13.0', wsVersion: '8.21.0' }),
      (error) => error?.code === 'websocket_runtime_drift');
  });

  test('rejects plaintext, query credentials and unprovisioned endpoints', () => {
    const allowed = new Set(['wss://relay.loc8.test/v1']);
    assert.equal(normalizeFixedEndpoint('wss://relay.loc8.test/v1', allowed), 'wss://relay.loc8.test/v1');
    assert.throws(() => normalizeFixedEndpoint('ws://relay.loc8.test/v1', allowed), (error) => error?.code === 'invalid_endpoint');
    assert.throws(() => normalizeFixedEndpoint('wss://relay.loc8.test/v1?token=secret', allowed), (error) => error?.code === 'invalid_endpoint');
    assert.throws(() => normalizeFixedEndpoint('wss://evil.example/v1', allowed), (error) => error?.code === 'endpoint_not_provisioned');
  });

  test('redacts bearer-bearing headers and pins a restrictive connect-src', () => {
    const headers = redactHeaders({
      Host: 'relay.loc8.test',
      Authorization: 'Bearer secret-a',
      Cookie: 'session=secret-b',
      'Sec-WebSocket-Protocol': 'loc8.v1, loc8.auth.secret-c',
      'X-Api-Key': 'secret-d',
      'X-Unreviewed-Header': 'secret-e',
    });
    assert.equal(headers.host, 'relay.loc8.test');
    for (const name of ['authorization', 'cookie', 'sec-websocket-protocol']) assert.equal(headers[name], '[REDACTED]');
    assert.doesNotMatch(JSON.stringify(headers), /secret-[abc]/);
    assert.equal(headers['x-api-key'], '[REDACTED]');
    assert.equal(Object.hasOwn(headers, 'x-unreviewed-header'), false);
    const security = commandSecurityHeaders('wss://relay.loc8.test/v1');
    assert.match(security['content-security-policy'], /connect-src 'self' wss:\/\/relay\.loc8\.test/);
    assert.match(security['content-security-policy'], /script-src 'self'/);
    assert.equal(security['x-frame-options'], 'DENY');
  });

  test('never trusts forwarded TLS from an unlisted immediate peer', () => {
    const trusted = new Set(['10.0.0.9']);
    assert.equal(transportIsSecure('trusted_proxy', { remoteAddress: '10.0.0.8', forwardedProto: 'https' }, trusted), false);
    assert.equal(transportIsSecure('trusted_proxy', { remoteAddress: '10.0.0.9', forwardedProto: 'https,http' }, trusted), false);
    assert.equal(transportIsSecure('trusted_proxy', { remoteAddress: '10.0.0.9', forwardedProto: 'https' }, trusted), true);
  });
});

describe('fresh, memory-only client capability seam', () => {
  test('obtains a new capability for every reconnect and selects only loc8.v1', async () => {
    const calls = [];
    const sockets = [];
    let issue = 0;
    const states = [];
    const reconnect = new ManualReconnect();
    const client = new ProductRelayClient({
      endpoint: 'wss://relay.loc8.test/v1',
      allowedEndpoints: new Set(['wss://relay.loc8.test/v1']),
      role: 'command',
      capabilityProvider: { async issueFresh() { return `fresh-capability-${++issue}`; } },
      socketFactory: {
        create(endpoint, protocols) {
          calls.push({ endpoint, protocols: [...protocols] });
          const socket = new FakeSocket();
          sockets.push(socket);
          return socket;
        },
      },
      reconnect,
      onState: (state) => states.push(state),
    });
    await client.start();
    sockets[0].open();
    assert.equal(client.sendFrame(new Uint8Array(FRAME_BYTES)), true);
    sockets[0].close();
    await reconnect.run();
    sockets[1].open();

    assert.deepEqual(calls.map((call) => call.endpoint), ['wss://relay.loc8.test/v1', 'wss://relay.loc8.test/v1']);
    assert.equal(calls[0].protocols[0], APPLICATION_PROTOCOL);
    assert.notEqual(calls[0].protocols[1], calls[1].protocols[1]);
    assert.match(calls[0].protocols[1], /^loc8\.auth\.fresh-capability-1$/);
    assert.match(calls[1].protocols[1], /^loc8\.auth\.fresh-capability-2$/);
    assert.equal(Object.hasOwn(client, 'capability'), false);
    assert.doesNotMatch(JSON.stringify(states), /fresh-/);
    client.stop();
  });

  test('rejects an echoed auth protocol instead of treating it as negotiated', async () => {
    const states = [];
    const sockets = [];
    const client = new ProductRelayClient({
      endpoint: 'wss://relay.loc8.test/v1',
      allowedEndpoints: new Set(['wss://relay.loc8.test/v1']),
      role: 'gateway',
      capabilityProvider: { async issueFresh() { return 'one-use-capability'; } },
      socketFactory: { create() { const socket = new FakeSocket(); sockets.push(socket); return socket; } },
      reconnect: new ManualReconnect(),
      onState: (state) => states.push(state),
    });
    await client.start();
    sockets[0].open('loc8.auth.one-use-capability');
    assert.equal(states.at(-1).state, 'unavailable');
    assert.equal(sockets[0].readyState, 3);
    client.stop();
  });

  test('rejects capabilities that cannot be safely encoded as a WebSocket subprotocol', async () => {
    const states = [];
    let created = false;
    const client = new ProductRelayClient({
      endpoint: 'wss://relay.loc8.test/v1',
      allowedEndpoints: new Set(['wss://relay.loc8.test/v1']),
      role: 'gateway',
      capabilityProvider: { async issueFresh() { return 'contains spaces and /slashes'; } },
      socketFactory: { create() { created = true; } },
      reconnect: new ManualReconnect(),
      onState: (state) => states.push(state),
    });
    await client.start();
    assert.equal(created, false);
    assert.equal(states.at(-1).state, 'unauthenticated');
    client.stop();
  });
});
