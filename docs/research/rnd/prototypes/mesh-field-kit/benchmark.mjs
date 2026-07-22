import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalEvents, canonicalManifest } from "./fixtures.mjs";
import { evaluateMeshRun, sha256Hex } from "./mesh-field-kit.mjs";

export function runBenchmark({ iterations = 25 } = {}) {
  if (!Number.isSafeInteger(iterations) || iterations < 1 || iterations > 1_000) {
    throw new RangeError("iterations must be an integer within 1..1000");
  }
  const manifest = canonicalManifest();
  const events = canonicalEvents();
  const started = performance.now();
  let result = null;
  const fingerprints = new Set();
  for (let index = 0; index < iterations; index += 1) {
    result = evaluateMeshRun(manifest, events);
    fingerprints.add(result.resultFingerprintSha256);
  }
  const elapsedMs = performance.now() - started;
  const deterministic = {
    schema: "loc8-mesh-01-kit-benchmark/v1",
    iterations,
    eventsPerIteration: events.length,
    totalEventEvaluations: events.length * iterations,
    decision: result.decision,
    counterfactualDecision: result.counterfactualDecision,
    resultFingerprintSha256: result.resultFingerprintSha256,
    uniqueResultFingerprints: fingerprints.size,
    relayDirections: result.relayDirections,
  };
  return {
    ...deterministic,
    deterministicSha256: sha256Hex(deterministic),
    runtime: { node: process.version, platform: process.platform, arch: process.arch },
    elapsedMs: Number(elapsedMs.toFixed(3)),
    underFiveSeconds: elapsedMs < 5_000,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(runBenchmark(), null, 2)}\n`);
}
