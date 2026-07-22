import { sha256Hex } from "./mesh-field-kit.mjs";

const RUN_ID = "mesh01-synthetic-pass-001";
const COHORT_ID = "synthetic-ios-ios-ios";
const SERVICE_UUID = "4C4F4338-4D45-5348-B1E5-4C4F43384D01";
const LINK_HANDLES = Object.freeze({ A: "aaaaaaaaaaaaaaaa", B: "bbbbbbbbbbbbbbbb", C: "cccccccccccccccc" });

function block(blockId, kind, sourceRole, destinationRole, expectedAttempts) {
  return {
    blockId,
    cohortId: COHORT_ID,
    kind,
    direction: `${sourceRole}-${destinationRole}`,
    sourceRole,
    destinationRole,
    relayRole: kind === "relay" ? "B" : null,
    expectedAttempts,
    intervalMs: 1_000,
    deliveryDeadlineMs: 10_000,
  };
}

export function canonicalManifest({ evidenceClass = "synthetic" } = {}) {
  return {
    schema: "loc8.mesh-field-manifest.v1",
    protocol: "mesh-01.e01.v1",
    runId: RUN_ID,
    evidenceClass,
    createdAt: "2026-07-22T12:00:00.000Z",
    build: {
      gitCommit: "29938c4999999999999999999999999999999999",
      appVersion: "1.0.0-field.1",
      expoVersion: "57.0.2",
      reactNativeVersion: "0.86.0",
      diagnosticSchema: "loc8.mesh-field-evidence.v1",
      wireVersion: "loc8-bitchat-v1-raw47",
      serviceUuid: SERVICE_UUID,
      identicalOnAllDevices: true,
    },
    devices: [
      ["A", 0x4c3800a1],
      ["B", 0x4c3800b1],
      ["C", 0x4c3800c1],
    ].map(([role, syntheticSenderId]) => ({
      role,
      model: `synthetic-${role}`,
      osName: "synthetic",
      osVersion: "1",
      nativeBuildId: "synthetic-build-001",
      syntheticSenderId,
      batteryStartPct: 100,
      permissions: { bluetooth: true, location: true, foregroundService: true },
    })),
    cohorts: [{ cohortId: COHORT_ID, composition: "synthetic iOS iOS iOS", foregroundOnly: true }],
    blocks: [
      block("near-a-b", "near", "A", "B", 10),
      block("near-b-a", "near", "B", "A", 10),
      block("near-b-c", "near", "B", "C", 10),
      block("near-c-b", "near", "C", "B", 10),
      block("near-a-c", "near", "A", "C", 10),
      block("near-c-a", "near", "C", "A", 10),
      block("isolation-pre-a-c", "isolation-pre", "A", "C", 50),
      block("isolation-pre-c-a", "isolation-pre", "C", "A", 50),
      block("relay-a-c-1", "relay", "A", "C", 100),
      block("relay-c-a-1", "relay", "C", "A", 100),
      block("relay-a-c-2", "relay", "A", "C", 100),
      block("relay-c-a-2", "relay", "C", "A", 100),
      block("isolation-post-a-c", "isolation-post", "A", "C", 50),
      block("isolation-post-c-a", "isolation-post", "C", "A", 50),
    ],
    clockSync: ["A", "B", "C"].map((role) => ({ role, offsetNs: "0", uncertaintyNs: "20000000" })),
    geometry: {
      aToBM: 30,
      bToCM: 30,
      aToCM: 60,
      heightM: 1.2,
      orientation: "screens north",
      barrier: "synthetic isolation boundary",
      isolationMethod: "synthetic fixture only",
      fixedAcrossBlocks: true,
    },
    privacy: {
      siteAuthorised: true,
      operatorAuthorised: true,
      syntheticPayloadsOnly: true,
      gpsCaptured: false,
      personalNamesCaptured: false,
      rawRadioIdentifiersCaptured: false,
      rawBundleUri: "research://mesh-01/synthetic-pass-001",
      encryptedAtRest: true,
      accessLogged: true,
      retentionDays: 30,
      deletionOwner: "Principal R&D Lead",
    },
    diagnostics: {
      maxEventsPerDevice: 20_000,
      overflowCounts: { A: 0, B: 0, C: 0 },
      linkHandlesRunScoped: true,
      rawIdentifiersExported: false,
    },
  };
}

function frameId(runId, blockId, sequence) {
  return sha256Hex(`${runId}\0${blockId}\0${sequence}`);
}

function baseEvent(manifest, block, role, action, monotonicNs, frame, extras = {}) {
  const frameRelated = frame !== null;
  return {
    schema: "loc8.mesh-field-evidence.v1",
    runId: manifest.runId,
    cohortId: block.cohortId,
    blockId: block.blockId,
    deviceRole: role,
    eventIndex: 0,
    monotonicNs: String(monotonicNs),
    wallTimeMs: 1_800_000_000_000 + Number(monotonicNs / 1_000_000n),
    action,
    frameId: frameRelated ? frame.id : null,
    sequence: action === "origin" ? frame.sequence : null,
    originRole: frameRelated ? block.sourceRole : null,
    ttlBefore: frameRelated ? 7 : null,
    ttlAfter: frameRelated ? 7 : null,
    linkHandle: null,
    reason: null,
    payloadBytes: frameRelated ? 25 : null,
    wireBytes: frameRelated ? 47 : null,
    ...extras,
  };
}

export function canonicalEvents({ relayDeliveryCount = 200, directLeak = false, duplicate = false, omitRelayProof = false } = {}) {
  const manifest = canonicalManifest();
  const perRole = { A: [], B: [], C: [] };
  let baseNs = 1_000_000_000n;

  function add(role, event) {
    perRole[role].push(event);
  }

  for (const block of manifest.blocks) {
    baseNs += 1_000_000_000n;
    const participatingRoles = block.kind === "relay"
      ? [block.sourceRole, "B", block.destinationRole]
      : [block.sourceRole, block.destinationRole];
    for (const role of participatingRoles) {
      add(role, baseEvent(manifest, block, role, "diagnostics-started", baseNs, null));
    }
    for (let sequence = 0; sequence < block.expectedAttempts; sequence += 1) {
      const originNs = baseNs + 100_000_000n + BigInt(sequence) * 1_000_000_000n;
      const frame = { id: frameId(manifest.runId, block.blockId, sequence), sequence };
      add(block.sourceRole, baseEvent(manifest, block, block.sourceRole, "origin", originNs, frame));

      if (block.kind === "near") {
        add(block.destinationRole, baseEvent(manifest, block, block.destinationRole, "ingress", originNs + 25_000_000n, frame, {
          linkHandle: LINK_HANDLES[block.sourceRole],
        }));
        add(block.destinationRole, baseEvent(manifest, block, block.destinationRole, "application-delivery", originNs + 30_000_000n, frame, {
          linkHandle: LINK_HANDLES[block.sourceRole],
        }));
      } else if (block.kind === "relay" && sequence < relayDeliveryCount / 2) {
        add("B", baseEvent(manifest, block, "B", "ingress", originNs + 20_000_000n, frame, {
          linkHandle: LINK_HANDLES[block.sourceRole],
        }));
        if (!omitRelayProof) {
          add("B", baseEvent(manifest, block, "B", "relay-forwarded", originNs + 60_000_000n, frame, {
            ttlBefore: 7,
            ttlAfter: 6,
          }));
        }
        add(block.destinationRole, baseEvent(manifest, block, block.destinationRole, "ingress", originNs + 85_000_000n, frame, {
          ttlBefore: 6,
          ttlAfter: 6,
          linkHandle: LINK_HANDLES.B,
        }));
        add(block.destinationRole, baseEvent(manifest, block, block.destinationRole, "application-delivery", originNs + 90_000_000n, frame, {
          ttlBefore: 6,
          ttlAfter: 6,
          linkHandle: LINK_HANDLES.B,
        }));
        if (duplicate && block.blockId === "relay-a-c-1" && sequence === 0) {
          add(block.destinationRole, baseEvent(manifest, block, block.destinationRole, "application-delivery", originNs + 95_000_000n, frame, {
            ttlBefore: 6,
            ttlAfter: 6,
            linkHandle: LINK_HANDLES.B,
          }));
        }
      } else if (block.kind.startsWith("isolation") && directLeak && sequence === 0 && block.blockId === "isolation-post-a-c") {
        add(block.destinationRole, baseEvent(manifest, block, block.destinationRole, "ingress", originNs + 20_000_000n, frame, {
          linkHandle: LINK_HANDLES.A,
        }));
        add(block.destinationRole, baseEvent(manifest, block, block.destinationRole, "application-delivery", originNs + 25_000_000n, frame, {
          linkHandle: LINK_HANDLES.A,
        }));
      }
    }
    const stoppedNs = baseNs + BigInt(block.expectedAttempts + 1) * 1_000_000_000n;
    for (const role of participatingRoles) {
      add(role, baseEvent(manifest, block, role, "diagnostics-stopped", stoppedNs, null));
    }
    baseNs += BigInt(block.expectedAttempts + 1) * 1_000_000_000n;
  }

  const output = [];
  for (const role of ["A", "B", "C"]) {
    const nextIndexByBlock = new Map();
    perRole[role]
      .sort((left, right) => BigInt(left.monotonicNs) < BigInt(right.monotonicNs) ? -1 : 1)
      .forEach((event) => {
        const eventIndex = nextIndexByBlock.get(event.blockId) ?? 0;
        nextIndexByBlock.set(event.blockId, eventIndex + 1);
        output.push({ ...event, eventIndex });
      });
  }
  return output;
}

export function clone(value) {
  return structuredClone(value);
}
