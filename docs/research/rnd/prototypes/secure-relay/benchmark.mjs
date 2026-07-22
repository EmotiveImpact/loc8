import { performance } from 'node:perf_hooks';
import WebSocket from 'ws';
import {
  AUTH_PREFIX,
  FRAME_SIZE,
  PROTOCOL,
  capabilityClaims,
  createSecureRelay,
  signCapability,
  verifyCapability,
} from './secure-relay.mjs';

const SECRET = 'research-only-secret-32-bytes-minimum-value';
const RUNS = 10_000;

function percentile(sorted, p) {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

function summary(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    runs: values.length,
    medianMs: Number(percentile(sorted, 0.5).toFixed(4)),
    p95Ms: Number(percentile(sorted, 0.95).toFixed(4)),
    maxMs: Number(sorted.at(-1).toFixed(4)),
  };
}

const nowSec = Math.floor(Date.now() / 1000);
const authSamples = [];
const authTokens = Array.from({ length: RUNS }, (_, i) => signCapability(capabilityClaims({
  siteId: 'bench',
  sub: 'device',
  role: 'gateway',
  jti: `auth-${i}`,
  nowSec,
}), SECRET));

for (const token of authTokens) {
  const started = performance.now();
  verifyCapability(token, SECRET, nowSec);
  authSamples.push(performance.now() - started);
}

const relay = createSecureRelay({
  secret: SECRET,
  allowInsecureForTests: true,
  allowedCommandOrigins: ['https://command.loc8.test'],
  framesPerSecond: 1_000_000,
  burstFrames: RUNS + 10,
  auditMaxEntries: 128,
  maxRateViolations: RUNS + 10,
});
const address = await relay.listen();
const url = `ws://127.0.0.1:${address.port}`;

function makeToken(role, sub, jti) {
  return signCapability(capabilityClaims({ siteId: 'bench', sub, role, jti, nowSec }), SECRET);
}

function open(role, sub, jti, options = {}) {
  const token = makeToken(role, sub, jti);
  const socket = new WebSocket(url, [PROTOCOL, `${AUTH_PREFIX}${token}`], options);
  return new Promise((resolve, reject) => {
    socket.once('open', () => resolve(socket));
    socket.once('error', reject);
  });
}

const gateway = await open('gateway', 'gateway-1', 'gateway-benchmark');
const command = await open('command', 'command-1', 'command-benchmark', { origin: 'https://command.loc8.test' });
const relaySamples = [];

await new Promise((resolve, reject) => {
  let sequence = 0;
  let sentAt = 0;
  const timeout = setTimeout(() => reject(new Error('relay benchmark timed out')), 30_000);
  command.on('message', () => {
    relaySamples.push(performance.now() - sentAt);
    sequence++;
    if (sequence >= RUNS) {
      clearTimeout(timeout);
      resolve();
      return;
    }
    const payload = Buffer.alloc(FRAME_SIZE);
    payload.writeUInt32BE(sequence, 0);
    sentAt = performance.now();
    gateway.send(payload);
  });
  const payload = Buffer.alloc(FRAME_SIZE);
  sentAt = performance.now();
  gateway.send(payload);
});

const authentication = summary(authSamples);
const relayLoopback = summary(relaySamples);
const result = {
  node: process.version,
  authentication,
  relayLoopback,
  metrics: relay.metrics,
  boundedState: {
    clients: relay.clients.size,
    usedTokens: relay.usedTokens.size,
    auditEntries: relay.audit.exportBundle().entries.length,
  },
  gates: {
    authentication: authentication.medianMs < 1 && authentication.p95Ms < 2,
    relay: relayLoopback.p95Ms < 2,
    auditBound: relay.audit.exportBundle().entries.length <= 128,
  },
};

console.log(JSON.stringify(result, null, 2));

gateway.terminate();
command.terminate();
await relay.close();

if (!Object.values(result.gates).every(Boolean)) process.exitCode = 1;
