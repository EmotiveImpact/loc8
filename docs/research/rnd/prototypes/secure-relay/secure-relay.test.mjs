import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';
import WebSocket from 'ws';
import {
  AUTH_PREFIX,
  AuditChain,
  FRAME_SIZE,
  PROTOCOL,
  capabilityClaims,
  createSecureRelay,
  signCapability,
  verifyAuditBundle,
  verifyCapability,
} from './secure-relay.mjs';

const SECRET = 'research-only-secret-32-bytes-minimum-value';
let serial = 0;
const relays = [];
const sockets = [];

afterEach(async () => {
  for (const socket of sockets.splice(0)) {
    if (socket.readyState === socket.OPEN || socket.readyState === socket.CONNECTING) socket.terminate();
  }
  for (const relay of relays.splice(0)) await relay.close();
});

async function startRelay(overrides = {}) {
  const relay = createSecureRelay({
    secret: SECRET,
    allowInsecureForTests: true,
    allowedCommandOrigins: ['https://command.loc8.test'],
    ...overrides,
  });
  relays.push(relay);
  const address = await relay.listen();
  return { relay, url: `ws://127.0.0.1:${address.port}` };
}

function token(overrides = {}) {
  const nowSec = Math.floor(Date.now() / 1000);
  return signCapability(capabilityClaims({
    siteId: 'site-a',
    sub: 'device-1',
    role: 'gateway',
    jti: `test-${++serial}`,
    nowSec,
    ...overrides,
  }), SECRET);
}

function protocols(capability) {
  return [PROTOCOL, `${AUTH_PREFIX}${capability}`];
}

async function connect(url, { capability = token(), origin } = {}) {
  const socket = new WebSocket(url, protocols(capability), origin ? { origin } : {});
  sockets.push(socket);
  await new Promise((resolve, reject) => {
    socket.once('open', resolve);
    socket.once('error', reject);
  });
  return socket;
}

async function expectRejected(url, { capability, offeredProtocols, origin } = {}) {
  const socket = new WebSocket(url, offeredProtocols ?? protocols(capability ?? token()), origin ? { origin } : {});
  sockets.push(socket);
  const result = await new Promise((resolve) => {
    socket.once('open', () => resolve({ opened: true }));
    socket.once('unexpected-response', (_req, res) => resolve({ opened: false, status: res.statusCode }));
    socket.once('error', (error) => resolve({ opened: false, error }));
  });
  assert.equal(result.opened, false);
  return result;
}

function frame(value = 1) {
  return Buffer.alloc(FRAME_SIZE, value);
}

function collect(socket) {
  const messages = [];
  socket.on('message', (data) => messages.push(Buffer.from(data)));
  return messages;
}

const settle = (ms = 80) => new Promise((resolve) => setTimeout(resolve, ms));

describe('capabilities and connection authentication', () => {
  test('signs and verifies a valid short-lived capability', () => {
    const signed = token();
    const claims = verifyCapability(signed, SECRET);
    assert.equal(claims.siteId, 'site-a');
    assert.equal(claims.role, 'gateway');
  });

  test('rejects a capability whose expiry does not follow its issue time', () => {
    const signed = signCapability({
      v: 1,
      siteId: 'site-a',
      sub: 'device-1',
      role: 'gateway',
      jti: `test-${++serial}`,
      iat: 1000,
      exp: 999,
    }, SECRET);
    assert.throws(() => verifyCapability(signed, SECRET, 990), /invalid lifetime/);
  });

  test('rejects missing, modified, expired and invalid-role capabilities', async () => {
    const { url, relay } = await startRelay();
    await expectRejected(url, { offeredProtocols: [PROTOCOL] });
    const valid = token();
    await expectRejected(url, { capability: `${valid.slice(0, -1)}x` });
    await expectRejected(url, { capability: token({ nowSec: Math.floor(Date.now() / 1000) - 120, lifetimeSec: 30 }) });
    await expectRejected(url, { capability: token({ role: 'admin' }) });
    assert.equal(relay.metrics.acceptedConnections, 0);
    assert.equal(relay.metrics.rejectedConnections, 4);
  });

  test('rejects capability replay even after the first socket disconnects', async () => {
    const { url } = await startRelay();
    const capability = token();
    const first = await connect(url, { capability });
    await new Promise((resolve) => {
      first.once('close', resolve);
      first.close();
    });
    const result = await expectRejected(url, { capability });
    assert.equal(result.status, 401);
  });

  test('requires an allowlisted origin for Command clients', async () => {
    const { url } = await startRelay();
    const command = token({ role: 'command', sub: 'operator-1' });
    const rejected = await expectRejected(url, { capability: command, origin: 'https://evil.example' });
    assert.equal(rejected.status, 403);
    await connect(url, { capability: token({ role: 'command', sub: 'operator-2' }), origin: 'https://command.loc8.test' });
  });

  test('rejects plaintext sockets when production TLS mode is enabled', async () => {
    const { url } = await startRelay({ allowInsecureForTests: false });
    const result = await expectRejected(url);
    assert.equal(result.status, 426);
  });

  test('enforces configured client and used-token bounds', async () => {
    const limitedClients = await startRelay({ maxClients: 1 });
    await connect(limitedClients.url);
    const clientLimit = await expectRejected(limitedClients.url);
    assert.equal(clientLimit.status, 503);

    const limitedTokens = await startRelay({ maxUsedTokens: 1 });
    const first = await connect(limitedTokens.url);
    await new Promise((resolve) => {
      first.once('close', resolve);
      first.close();
    });
    const tokenLimit = await expectRejected(limitedTokens.url);
    assert.equal(tokenLimit.status, 503);
  });
});

describe('site isolation and directional role routing', () => {
  test('delivers only across opposite roles within the same site', async () => {
    const { url } = await startRelay({ framesPerSecond: 1000, burstFrames: 1000 });
    const gatewayA1 = await connect(url, { capability: token({ siteId: 'site-a', sub: 'ga1', role: 'gateway' }) });
    const gatewayA2 = await connect(url, { capability: token({ siteId: 'site-a', sub: 'ga2', role: 'gateway' }) });
    const commandA1 = await connect(url, { capability: token({ siteId: 'site-a', sub: 'ca1', role: 'command' }), origin: 'https://command.loc8.test' });
    const commandA2 = await connect(url, { capability: token({ siteId: 'site-a', sub: 'ca2', role: 'command' }), origin: 'https://command.loc8.test' });
    const commandB = await connect(url, { capability: token({ siteId: 'site-b', sub: 'cb', role: 'command' }), origin: 'https://command.loc8.test' });
    const received = new Map([
      [gatewayA1, collect(gatewayA1)],
      [gatewayA2, collect(gatewayA2)],
      [commandA1, collect(commandA1)],
      [commandA2, collect(commandA2)],
      [commandB, collect(commandB)],
    ]);

    gatewayA1.send(frame(7));
    await settle();
    assert.equal(received.get(commandA1).length, 1);
    assert.equal(received.get(commandA2).length, 1);
    assert.equal(received.get(gatewayA2).length, 0);
    assert.equal(received.get(commandB).length, 0);

    commandA1.send(frame(8));
    await settle();
    assert.equal(received.get(gatewayA1).length, 1);
    assert.equal(received.get(gatewayA2).length, 1);
    assert.equal(received.get(commandA2).length, 1);
    assert.equal(received.get(commandB).length, 0);
  });

  test('leaks zero of 1,000 valid-size frames across sites', async () => {
    const { url, relay } = await startRelay({ framesPerSecond: 100000, burstFrames: 2000, auditMaxEntries: 128 });
    const gatewayA = await connect(url, { capability: token({ siteId: 'site-a', sub: 'ga', role: 'gateway' }) });
    const commandB = await connect(url, { capability: token({ siteId: 'site-b', sub: 'cb', role: 'command' }), origin: 'https://command.loc8.test' });
    const receivedB = collect(commandB);
    for (let i = 0; i < 1000; i++) gatewayA.send(frame(i & 0xff));
    await settle(150);
    assert.equal(receivedB.length, 0);
    assert.equal(relay.metrics.acceptedFrames, 1000);
    assert.equal(relay.metrics.deliveredFrames, 0);
  });
});

describe('frame validation, limits and audit', () => {
  test('drops text and wrong-size messages', async () => {
    const { url, relay } = await startRelay();
    const gateway = await connect(url, { capability: token({ sub: 'g' }) });
    const command = await connect(url, { capability: token({ sub: 'c', role: 'command' }), origin: 'https://command.loc8.test' });
    const received = collect(command);
    gateway.send('not binary');
    gateway.send(Buffer.alloc(FRAME_SIZE - 1));
    await settle();
    assert.equal(received.length, 0);
    assert.equal(relay.metrics.droppedFrames, 2);
  });

  test('rejects an oversized message in the WebSocket parser', async () => {
    const { url, relay } = await startRelay();
    const gateway = await connect(url, { capability: token({ sub: 'g' }) });
    const command = await connect(url, { capability: token({ sub: 'c', role: 'command' }), origin: 'https://command.loc8.test' });
    const received = collect(command);
    const closed = new Promise((resolve) => gateway.once('close', (code) => resolve(code)));
    gateway.send(Buffer.alloc(FRAME_SIZE + 1));
    assert.equal(await closed, 1009);
    assert.equal(received.length, 0);
    assert.equal(relay.metrics.acceptedFrames, 0);
  });

  test('drops delivery to a slow consumer instead of growing its send queue', async () => {
    const { url, relay } = await startRelay({ maxBufferedBytes: FRAME_SIZE });
    const gateway = await connect(url, { capability: token({ sub: 'g' }) });
    const command = await connect(url, { capability: token({ sub: 'c', role: 'command' }), origin: 'https://command.loc8.test' });
    const received = collect(command);
    const serverCommand = [...relay.clients.entries()].find(([, meta]) => meta.sub === 'c')[0];
    Object.defineProperty(serverCommand, 'bufferedAmount', { configurable: true, value: 1 });
    gateway.send(frame());
    await settle();
    assert.equal(received.length, 0);
    assert.equal(relay.metrics.acceptedFrames, 1);
    assert.equal(relay.metrics.deliveredFrames, 0);
    assert.equal(relay.metrics.droppedDeliveries, 1);
  });

  test('enforces configured burst rate', async () => {
    const { url, relay } = await startRelay({ framesPerSecond: 0, burstFrames: 2, maxRateViolations: 100 });
    const gateway = await connect(url, { capability: token({ sub: 'g' }) });
    const command = await connect(url, { capability: token({ sub: 'c', role: 'command' }), origin: 'https://command.loc8.test' });
    const received = collect(command);
    for (let i = 0; i < 10; i++) gateway.send(frame(i));
    await settle();
    assert.equal(received.length, 2);
    assert.equal(relay.metrics.acceptedFrames, 2);
    assert.equal(relay.metrics.droppedFrames, 8);
  });

  test('maintains a bounded verifiable audit chain and detects mutation or anchored tail truncation', () => {
    let now = 1000;
    const audit = new AuditChain({ maxEntries: 3, nowMs: () => now++ });
    audit.append('one');
    audit.append('two');
    audit.append('three');
    audit.append('four');
    const bundle = audit.exportBundle();
    const anchor = { count: bundle.count, head: bundle.head };
    assert.equal(bundle.entries.length, 3);
    assert.equal(bundle.baseCount, 1);
    assert.equal(verifyAuditBundle(bundle, anchor), true);

    const mutated = structuredClone(bundle);
    mutated.entries[1].event = 'changed';
    assert.equal(verifyAuditBundle(mutated, anchor), false);

    const deleted = structuredClone(bundle);
    deleted.entries.splice(1, 1);
    assert.equal(verifyAuditBundle(deleted, anchor), false);

    const truncated = structuredClone(bundle);
    truncated.entries.pop();
    truncated.count--;
    truncated.head = truncated.entries.at(-1).hash;
    assert.equal(verifyAuditBundle(truncated), true);
    assert.equal(verifyAuditBundle(truncated, anchor), false);
  });
});
