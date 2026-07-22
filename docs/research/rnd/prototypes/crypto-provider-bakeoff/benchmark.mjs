import { performance } from "node:perf_hooks";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CELL_BODY_BYTES,
  PROTOCOL_SHAPES,
  PROVIDER_CANDIDATES,
  assignPrekey,
  benchmarkDigest,
  consumePrekey,
  createPrekeyState,
  encodeCredentialShape,
  evaluateProvider,
  frameCost,
  sha256Hex,
  validateCredentialShape,
} from "./crypto-provider-bakeoff.mjs";

const payloads = [0, 16, 32, 64, 128, 512, 1024];
const shapeIds = Object.keys(PROTOCOL_SHAPES);

export function runBenchmark({ iterationsPerCohort = 12_500 } = {}) {
  if (!Number.isSafeInteger(iterationsPerCohort) || iterationsPerCohort < 1) {
    throw new Error("iterationsPerCohort must be a positive safe integer");
  }
  const started = performance.now();

  let credentialByteChecksum = 0;
  let credentialCellChecksum = 0;
  let credentialFingerprint = null;
  for (let index = 0; index < iterationsPerCohort; index += 1) {
    const encoded = encodeCredentialShape({
      claimsVariant: "extended",
      tagMode: "cwt-cose",
    });
    validateCredentialShape(encoded, {
      claimsVariant: "extended",
      tagMode: "cwt-cose",
    });
    credentialByteChecksum += encoded.length;
    credentialCellChecksum += Math.ceil(encoded.length / CELL_BODY_BYTES);
    if (credentialFingerprint === null) credentialFingerprint = sha256Hex(encoded);
  }

  let protocolByteChecksum = 0;
  let protocolCellChecksum = 0;
  let protocolAcceptedCount = 0;
  for (let index = 0; index < iterationsPerCohort; index += 1) {
    const cost = frameCost(
      shapeIds[index % shapeIds.length],
      payloads[index % payloads.length],
      { logicalHeader: index % 2 === 0 },
    );
    protocolByteChecksum += cost.frameBytes;
    protocolCellChecksum += cost.cells;
    if (cost.accepted) protocolAcceptedCount += 1;
  }

  const providerDecisions = { PROMOTE: 0, REPEAT: 0, HOLD: 0, STOP: 0 };
  let providerUnknownGateChecksum = 0;
  let providerFailedGateChecksum = 0;
  for (let index = 0; index < iterationsPerCohort; index += 1) {
    const result = evaluateProvider(
      PROVIDER_CANDIDATES[index % PROVIDER_CANDIDATES.length],
    );
    providerDecisions[result.decision] += 1;
    providerUnknownGateChecksum += result.unknown.length;
    providerFailedGateChecksum += result.failed.length;
  }

  let lifecycleIdChecksum = 0;
  let lifecycleRevisionChecksum = 0;
  for (let index = 0; index < iterationsPerCohort; index += 1) {
    const nowMs = 1_800_000_000_000 + index;
    const initial = createPrekeyState({
      generatedAtMs: nowMs,
      startId: index % 10_000,
      count: 1,
    });
    const assigned = assignPrekey(initial, {
      messageId: `message-${index}`,
      digest: benchmarkDigest(index),
      nowMs,
    });
    const consumed = consumePrekey(assigned.state, {
      id: assigned.assignment.id,
      messageId: `message-${index}`,
      digest: benchmarkDigest(index),
      nowMs: nowMs + 1,
    });
    lifecycleIdChecksum += assigned.assignment.id;
    lifecycleRevisionChecksum += consumed.state.revision;
  }

  const deterministic = {
    schema: "loc8-sec-05-benchmark/v1",
    operationCount: iterationsPerCohort * 4,
    iterationsPerCohort,
    credential: {
      byteChecksum: credentialByteChecksum,
      cellChecksum: credentialCellChecksum,
      fingerprint: credentialFingerprint,
    },
    protocol: {
      byteChecksum: protocolByteChecksum,
      cellChecksum: protocolCellChecksum,
      acceptedCount: protocolAcceptedCount,
    },
    providers: {
      decisions: providerDecisions,
      unknownGateChecksum: providerUnknownGateChecksum,
      failedGateChecksum: providerFailedGateChecksum,
    },
    lifecycle: {
      idChecksum: lifecycleIdChecksum,
      revisionChecksum: lifecycleRevisionChecksum,
    },
  };
  const elapsedMs = performance.now() - started;
  return {
    ...deterministic,
    deterministicSha256: sha256Hex(Buffer.from(JSON.stringify(deterministic))),
    runtime: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    elapsedMs: Number(elapsedMs.toFixed(3)),
    underFiveSeconds: elapsedMs < 5_000,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${JSON.stringify(runBenchmark(), null, 2)}\n`);
}
