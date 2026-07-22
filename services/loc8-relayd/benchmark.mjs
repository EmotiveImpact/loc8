import { performance } from 'node:perf_hooks';
import { FRAME_BYTES } from './src/contracts.mjs';
import { connect, makeCore, principal } from './test/support.mjs';

const RUNS = 10_000;
const sortedSummary = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const pick = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  return {
    runs: values.length,
    medianMs: Number(pick(0.5).toFixed(4)),
    p95Ms: Number(pick(0.95).toFixed(4)),
    maxMs: Number(sorted.at(-1).toFixed(4)),
  };
};

const { core, tokens, audit, replay } = makeCore({
  limits: { framesPerSecond: 0, burstFrames: RUNS + 10 },
});
const gateway = await connect(core, tokens, 'bench-g', principal({ tokenId: 'bench-g', subjectId: 'bench-g' }));
const command = await connect(core, tokens, 'bench-c', principal({ tokenId: 'bench-c', subjectId: 'bench-c', role: 'command' }));
const payload = new Uint8Array(FRAME_BYTES);
const samples = [];
const memoryBefore = process.memoryUsage();
for (let i = 0; i < RUNS; i++) {
  payload[0] = i & 255;
  const started = performance.now();
  await core.receive(gateway.handle.id, payload);
  samples.push(performance.now() - started);
}

const routing = sortedSummary(samples);
const memoryAfter = process.memoryUsage();
const result = {
  scope: 'dependency-free in-process contract regression; not venue latency',
  node: process.version,
  routing,
  delivered: command.sink.frames.length,
  boundedState: {
    connections: core.snapshot().connectionCount,
    replayEntries: replay.used.size,
    retainedAuditEntries: audit.entries.length,
  },
  processMemory: {
    heapUsedBytesBefore: memoryBefore.heapUsed,
    heapUsedBytesAfter: memoryAfter.heapUsed,
    heapDeltaBytes: memoryAfter.heapUsed - memoryBefore.heapUsed,
    rssBytesAfter: memoryAfter.rss,
  },
  gates: {
    deliveredAll: command.sink.frames.length === RUNS,
    routingP95Below2Ms: routing.p95Ms < 2,
    connectionsBounded: core.snapshot().connectionCount === 2,
    replayBounded: replay.used.size === 2,
    auditBounded: audit.entries.length <= 128,
  },
};
console.log(JSON.stringify(result, null, 2));
if (!Object.values(result.gates).every(Boolean)) process.exitCode = 1;
