import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateManifest } from "./mesh-field-kit.mjs";

const FROZEN_BLOCKS = Object.freeze([
  ["near-a-b", "near", "A", "B", null, 10],
  ["near-b-a", "near", "B", "A", null, 10],
  ["near-b-c", "near", "B", "C", null, 10],
  ["near-c-b", "near", "C", "B", null, 10],
  ["near-a-c", "near", "A", "C", null, 10],
  ["near-c-a", "near", "C", "A", null, 10],
  ["isolation-pre-a-c", "isolation-pre", "A", "C", null, 50],
  ["isolation-pre-c-a", "isolation-pre", "C", "A", null, 50],
  ["relay-a-c-1", "relay", "A", "C", "B", 100],
  ["relay-c-a-1", "relay", "C", "A", "B", 100],
  ["relay-a-c-2", "relay", "A", "C", "B", 100],
  ["relay-c-a-2", "relay", "C", "A", "B", 100],
  ["isolation-post-a-c", "isolation-post", "A", "C", null, 50],
  ["isolation-post-c-a", "isolation-post", "C", "A", null, 50],
]);

const METADATA_KEYS = Object.freeze([
  "runId", "createdAt", "build", "devices", "cohort", "geometry", "privacy", "overflowCounts",
]);

function exactKeys(value, expected, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    throw new Error(`${label} keys must be exactly ${wanted.join(", ")}; got ${actual.join(", ")}`);
  }
}

export function createPhysicalManifest(metadata, clockResult) {
  exactKeys(metadata, METADATA_KEYS, "metadata");
  if (clockResult?.schema !== "loc8.mesh-field-clock-sync.v1" || !Array.isArray(clockResult.clockSync)) {
    throw new Error("clock result must come from derive-clock-sync.mjs");
  }
  if (clockResult.within100msGate !== true || clockResult.nearControlsPass !== true) {
    throw new Error("near controls and the 100 ms clock gate must pass before manifest creation");
  }
  const cohortId = metadata.cohort?.cohortId;
  const manifest = {
    schema: "loc8.mesh-field-manifest.v1",
    protocol: "mesh-01.e01.v1",
    runId: metadata.runId,
    evidenceClass: "physical",
    createdAt: metadata.createdAt,
    build: metadata.build,
    devices: metadata.devices,
    cohorts: [metadata.cohort],
    blocks: FROZEN_BLOCKS.map(([blockId, kind, sourceRole, destinationRole, relayRole, expectedAttempts]) => ({
      blockId,
      cohortId,
      kind,
      direction: `${sourceRole}-${destinationRole}`,
      sourceRole,
      destinationRole,
      relayRole,
      expectedAttempts,
      intervalMs: 1_000,
      deliveryDeadlineMs: 10_000,
    })),
    clockSync: clockResult.clockSync,
    geometry: metadata.geometry,
    privacy: metadata.privacy,
    diagnostics: {
      maxEventsPerDevice: 20_000,
      overflowCounts: metadata.overflowCounts,
      linkHandlesRunScoped: true,
      rawIdentifiersExported: false,
    },
  };
  const issues = validateManifest(manifest);
  if (issues.length > 0) {
    throw new Error(`physical manifest is invalid:\n${JSON.stringify(issues, null, 2)}`);
  }
  return manifest;
}

function usage() {
  return [
    "Usage:",
    "  node create-physical-manifest.mjs RUN-METADATA.json CLOCK-SYNC.json > manifest.json",
    "",
    "The command refuses placeholder/invalid metadata, failed near controls,",
    "clock uncertainty over 100 ms, and any drift from the frozen 14-block matrix.",
  ].join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [, , metadataPath, clockPath] = process.argv;
  try {
    if (!metadataPath || !clockPath) throw new Error(usage());
    const metadata = JSON.parse(readFileSync(resolve(metadataPath), "utf8"));
    const clock = JSON.parse(readFileSync(resolve(clockPath), "utf8"));
    process.stdout.write(`${JSON.stringify(createPhysicalManifest(metadata, clock), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
