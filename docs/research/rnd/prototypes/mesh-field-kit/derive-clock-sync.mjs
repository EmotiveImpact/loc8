import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  decodeJsonLines,
  maxPairClockUncertaintyNs,
  MAX_CLOCK_UNCERTAINTY_NS,
} from "./mesh-field-kit.mjs";

function eventNs(event) {
  if (typeof event?.monotonicNs !== "string" || !/^(0|[1-9][0-9]{0,19})$/u.test(event.monotonicNs)) {
    throw new Error("clock derivation requires decimal monotonicNs on every used event");
  }
  return BigInt(event.monotonicNs);
}

function directedSamples(events, sourceRole, destinationRole) {
  const blockId = `near-${sourceRole.toLowerCase()}-${destinationRole.toLowerCase()}`;
  const origins = events.filter((event) =>
    event.blockId === blockId && event.deviceRole === sourceRole && event.action === "origin",
  );
  if (origins.length !== 10) {
    throw new Error(`${blockId} must contain exactly 10 source origins, got ${origins.length}`);
  }
  const seenSequences = new Set(origins.map((event) => event.sequence));
  if (seenSequences.size !== 10 || [...seenSequences].some((sequence) => !Number.isInteger(sequence) || sequence < 0 || sequence > 9)) {
    throw new Error(`${blockId} origin sequences must be exactly 0 through 9`);
  }
  return origins.map((origin) => {
    const ingresses = events.filter((event) =>
      event.blockId === blockId &&
      event.deviceRole === destinationRole &&
      event.action === "ingress" &&
      event.frameId === origin.frameId,
    );
    if (ingresses.length < 1) {
      throw new Error(`${blockId} sequence ${origin.sequence} lacks a joined destination ingress`);
    }
    const earliestIngress = ingresses.reduce((earliest, candidate) =>
      eventNs(candidate) < eventNs(earliest) ? candidate : earliest,
    );
    return eventNs(earliestIngress) - eventNs(origin);
  });
}

/**
 * Bounds destinationClockOffset - sourceClockOffset. For source→destination,
 * receive-source = delta + nonNegativeTransit, so the minimum is an upper
 * bound on delta. The reverse direction supplies its lower bound.
 */
export function derivePairBound(events, sourceRole, destinationRole) {
  const forward = directedSamples(events, sourceRole, destinationRole);
  const reverse = directedSamples(events, destinationRole, sourceRole);
  const upperNs = forward.reduce((minimum, value) => value < minimum ? value : minimum);
  const lowerNs = reverse
    .map((value) => -value)
    .reduce((maximum, value) => value > maximum ? value : maximum);
  if (lowerNs > upperNs) {
    throw new Error(`${sourceRole}-${destinationRole} clock bounds are inconsistent (${lowerNs} > ${upperNs})`);
  }
  const offsetNs = (lowerNs + upperNs) / 2n;
  const uncertaintyNs = (upperNs - lowerNs + 1n) / 2n;
  return {
    sourceRole,
    destinationRole,
    lowerNs,
    upperNs,
    offsetNs,
    uncertaintyNs,
    forwardSamples: forward.length,
    reverseSamples: reverse.length,
  };
}

export function deriveClockSync(events) {
  if (!Array.isArray(events)) throw new TypeError("events must be an array");
  // Use B as the zero-offset reference because B is the measured relay.
  const aToB = derivePairBound(events, "A", "B"); // oB - oA = normalization offset for A
  const cToB = derivePairBound(events, "C", "B"); // oB - oC = normalization offset for C
  const aToC = derivePairBound(events, "A", "C"); // independent consistency check
  const predictedCMinusA = aToB.offsetNs - cToB.offsetNs;
  if (predictedCMinusA < aToC.lowerNs || predictedCMinusA > aToC.upperNs) {
    throw new Error(
      `A-C cross-check failed: predicted ${predictedCMinusA} is outside [${aToC.lowerNs}, ${aToC.upperNs}]`,
    );
  }

  const clockSync = [
    { role: "A", offsetNs: String(aToB.offsetNs), uncertaintyNs: String(aToB.uncertaintyNs) },
    { role: "B", offsetNs: "0", uncertaintyNs: "0" },
    { role: "C", offsetNs: String(cToB.offsetNs), uncertaintyNs: String(cToB.uncertaintyNs) },
  ];
  const clockOffsets = new Map(clockSync.map((clock) => [clock.role, BigInt(clock.offsetNs)]));
  const nearBlocks = [
    ["A", "B"], ["B", "A"], ["B", "C"],
    ["C", "B"], ["A", "C"], ["C", "A"],
  ];
  const nearMetrics = nearBlocks.map(([sourceRole, destinationRole]) => {
    const blockId = `near-${sourceRole.toLowerCase()}-${destinationRole.toLowerCase()}`;
    const blockEvents = events.filter((event) => event.blockId === blockId);
    const starts = blockEvents.filter((event) => event.action === "diagnostics-started");
    const stops = blockEvents.filter((event) => event.action === "diagnostics-stopped");
    const origins = blockEvents.filter((event) => event.action === "origin" && event.deviceRole === sourceRole);
    const latenciesMs = origins.map((origin) => {
      const deliveries = blockEvents.filter((event) =>
        event.action === "application-delivery" &&
        event.deviceRole === destinationRole &&
        event.frameId === origin.frameId,
      );
      if (deliveries.length !== 1) {
        throw new Error(`${blockId} sequence ${origin.sequence} requires exactly one destination delivery, got ${deliveries.length}`);
      }
      const originNs = eventNs(origin) + clockOffsets.get(sourceRole);
      const deliveryNs = eventNs(deliveries[0]) + clockOffsets.get(destinationRole);
      const latencyNs = deliveryNs - originNs;
      if (latencyNs < 0n || latencyNs > 10_000_000_000n) {
        throw new Error(`${blockId} sequence ${origin.sequence} delivery is outside the frozen 10-second deadline`);
      }
      return Number(latencyNs) / 1_000_000;
    });
    const expectedRoles = new Set([sourceRole, destinationRole]);
    if (starts.length !== 2 || stops.length !== 2 ||
        starts.some((event) => !expectedRoles.has(event.deviceRole)) ||
        stops.some((event) => !expectedRoles.has(event.deviceRole))) {
      throw new Error(`${blockId} requires one diagnostic start and stop from each endpoint`);
    }
    return {
      blockId,
      attempted: origins.length,
      deliveredExactlyOnce: latenciesMs.length,
      maxLatencyMs: Math.max(...latenciesMs),
    };
  });
  const pairUncertaintyNs = maxPairClockUncertaintyNs(clockSync);
  const withinGate = pairUncertaintyNs <= MAX_CLOCK_UNCERTAINTY_NS;
  return {
    schema: "loc8.mesh-field-clock-sync.v1",
    method: "bidirectional-near-control-nonnegative-transit-bound",
    referenceRole: "B",
    clockSync,
    maxPairClockUncertaintyNs: String(pairUncertaintyNs),
    within100msGate: withinGate,
    nearControlsPass: withinGate && nearMetrics.every((block) => block.attempted === 10 && block.deliveredExactlyOnce === 10),
    nearControls: nearMetrics,
    bounds: [aToB, cToB, aToC].map((bound) => ({
      pair: `${bound.sourceRole}-${bound.destinationRole}`,
      lowerNs: String(bound.lowerNs),
      upperNs: String(bound.upperNs),
      midpointNs: String(bound.offsetNs),
      uncertaintyNs: String(bound.uncertaintyNs),
      forwardSamples: bound.forwardSamples,
      reverseSamples: bound.reverseSamples,
    })),
  };
}

function usage() {
  return [
    "Usage:",
    "  node derive-clock-sync.mjs NEAR_BLOCK_EXPORT.jsonl [MORE.jsonl ...]",
    "",
    "Provide all A/B/C exports for the six frozen bidirectional near blocks.",
    "The command is read-only and prints clockSync values for the physical manifest.",
  ].join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const eventPaths = process.argv.slice(2);
  try {
    if (eventPaths.length < 1) throw new Error(usage());
    const events = eventPaths.flatMap((eventPath) =>
      decodeJsonLines(readFileSync(resolve(eventPath), "utf8")),
    );
    process.stdout.write(`${JSON.stringify(deriveClockSync(events), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
