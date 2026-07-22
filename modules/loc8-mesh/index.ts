// modules/loc8-mesh/index.ts
// Typed JS API for the Loc8Mesh native module (BLE GATT mesh — spike brief §2).
// Native side owns framing/dedup/TTL/relay; JS sees clean 25-byte payloads only.
//
// IMPORTANT: the native module is resolved LAZILY. Importing this file in a runtime
// where the native module isn't installed (jest, Expo Go, a build without prebuild)
// must never throw — the error surfaces only when start()/broadcast()/listeners are
// actually used, so SimulatedTransport-based runs stay unaffected.
import { requireNativeModule, type NativeModule, type EventSubscription } from 'expo-modules-core';

export interface MeshPacketEvent {
  /** Post-dedup/TTL-guard ingress: the raw 25-byte Loc8 packet (framing stripped natively). */
  data: Uint8Array;
  /**
   * Present when the packet arrived via at least one relay hop. Currently the
   * literal string "mesh" — the relaying hop's identity is unavailable
   * without announce packets (the frame's senderID is the originator).
   */
  relayVia?: string;
}

export interface MeshStatusEvent {
  /** Distinct live GATT peer links (a dual-role peer counts once). */
  nearbyCount: number;
  connected: boolean;
  /** Android only: chipset can't advertise — scan-only degraded mode (absent on iOS). */
  degraded?: boolean;
}

export type MeshFieldRole = 'A' | 'B' | 'C';

export type MeshFieldAction =
  | 'diagnostics-started'
  | 'link-up'
  | 'link-down'
  | 'origin'
  | 'ingress'
  | 'duplicate-drop'
  | 'stale-drop'
  | 'future-drop'
  | 'malformed-drop'
  | 'relay-scheduled'
  | 'relay-cancelled'
  | 'relay-forwarded'
  | 'application-delivery'
  | 'egress-skipped'
  | 'diagnostics-stopped';

/** Exact native event shape consumed by the frozen MESH-01 evaluator. */
export interface MeshFieldDiagnosticEvent {
  schema: 'loc8.mesh-field-evidence.v1';
  runId: string;
  cohortId: string;
  blockId: string;
  deviceRole: MeshFieldRole;
  eventIndex: number;
  monotonicNs: string;
  wallTimeMs: number;
  action: MeshFieldAction;
  frameId: string | null;
  sequence: number | null;
  originRole: MeshFieldRole | null;
  ttlBefore: number | null;
  ttlAfter: number | null;
  linkHandle: string | null;
  reason: string | null;
  payloadBytes: 25 | null;
  wireBytes: 47 | null;
}

export interface MeshFieldDiagnosticsSnapshot {
  events: MeshFieldDiagnosticEvent[];
  overflowCount: number;
  active: boolean;
}

type Loc8MeshModuleEvents = {
  onPacket(event: MeshPacketEvent): void;
  onMeshStatus(event: MeshStatusEvent): void;
};

declare class Loc8MeshNativeModule extends NativeModule<Loc8MeshModuleEvents> {
  start(): Promise<void>;
  stop(): Promise<void>;
  broadcast(packet: Uint8Array): Promise<void>;
  startFieldDiagnostics(
    runId: string,
    cohortId: string,
    blockId: string,
    deviceRole: MeshFieldRole,
    originRole: MeshFieldRole,
  ): Promise<void>;
  stopFieldDiagnostics(): Promise<void>;
  getFieldDiagnostics(): Promise<MeshFieldDiagnosticsSnapshot>;
  releaseFieldDiagnostics(): Promise<void>;
  broadcastFieldTest(packet: Uint8Array, sequence: number): Promise<void>;
}

let cached: Loc8MeshNativeModule | null = null;

function getModule(): Loc8MeshNativeModule {
  if (!cached) {
    try {
      cached = requireNativeModule<Loc8MeshNativeModule>('Loc8Mesh');
    } catch (e) {
      throw new Error(
        'Loc8Mesh native module is not installed in this runtime (jest / Expo Go / build ' +
          'without `npx expo prebuild`). Use EXPO_PUBLIC_TRANSPORT=sim, or rebuild the dev ' +
          `client. Underlying error: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
  return cached;
}

/** Start scanning/advertising + the GATT server. Idempotent on the native side. */
export async function start(): Promise<void> {
  await getModule().start();
}

/** Tear down all links, scanning and advertising. Idempotent on the native side. */
export async function stop(): Promise<void> {
  await getModule().stop();
}

/** Broadcast one encoded 25-byte Loc8 packet; native wraps it in bitchat v1 framing. */
export async function broadcast(packet: Uint8Array): Promise<void> {
  await getModule().broadcast(packet);
}

/** Start one bounded device/block recorder; rejects while any active or closed snapshot is pending. */
export async function startFieldDiagnostics(
  runId: string,
  cohortId: string,
  blockId: string,
  deviceRole: MeshFieldRole,
  originRole: MeshFieldRole,
): Promise<void> {
  await getModule().startFieldDiagnostics(runId, cohortId, blockId, deviceRole, originRole);
}

/** Close the active device/block export by appending its required terminal event. */
export async function stopFieldDiagnostics(): Promise<void> {
  await getModule().stopFieldDiagnostics();
}

/** Return the closed (or in-progress) evidence buffer without raw BLE identifiers or packet bytes. */
export async function getFieldDiagnostics(): Promise<MeshFieldDiagnosticsSnapshot> {
  return getModule().getFieldDiagnostics();
}

/** Release a closed snapshot only after its external file has been secured and hashed. */
export async function releaseFieldDiagnostics(): Promise<void> {
  await getModule().releaseFieldDiagnostics();
}

/** Originate one numbered synthetic field attempt; rejected unless this device is the configured source. */
export async function broadcastFieldTest(packet: Uint8Array, sequence: number): Promise<void> {
  await getModule().broadcastFieldTest(packet, sequence);
}

export function addPacketListener(cb: (event: MeshPacketEvent) => void): EventSubscription {
  return getModule().addListener('onPacket', cb);
}

export function addStatusListener(cb: (event: MeshStatusEvent) => void): EventSubscription {
  return getModule().addListener('onMeshStatus', cb);
}
