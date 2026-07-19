// src/services/liveBridge.ts — Command's LIVE mode.
//
// Connects the console to a mesh-bridge relay (tools/mesh-bridge) and renders
// REAL mesh frames: a Guard gateway phone mirrors its BLE/sim mesh up the
// socket, and every 25-byte frame lands here, is decoded with the engine
// codec, and drives the same store the sim drives. Outbound dispatch frames
// travel the reverse path — the field demo is: kill the wifi, watch it work.
//
// Enable with ?bridge=ws://<host>:8787 (or ?bridge=1 for localhost).

import { BridgedTransport, TextReassembler, DURESS_CODE, parseOpsMessage, type Packet } from '../engine';
import { setFrameSink, useCommandStore } from '../store/commandStore';

let bridge: BridgedTransport | null = null;

/** The bridge URL from the query string, or null when running pure-sim. */
export function bridgeUrlFromLocation(search = globalThis.location?.search ?? ''): string | null {
  const raw = new URLSearchParams(search).get('bridge');
  if (!raw) return null;
  if (raw === '1' || raw === 'true') return 'ws://localhost:8787';
  return raw;
}

/** Connect the console to the relay and start rendering live frames. */
export function connectLiveBridge(url: string): void {
  if (bridge) return;
  const t = new BridgedTransport(null, { url });
  bridge = t;

  const inbox = new TextReassembler();
  t.onPacket((p: Packet) => {
    const store = useCommandStore.getState();
    switch (p.type) {
      case 'position':
        store.applyLivePosition(p.senderId, { latitude: p.latitude, longitude: p.longitude }, p.timestampSec);
        break;
      case 'sos':
        store.raiseLiveSos(p.senderId, { latitude: p.latitude, longitude: p.longitude }, p.timestampSec);
        break;
      case 'quickReply': {
        // The covert channel: DURESS_CODE looks like any status tap on the
        // wire — only the console decodes its meaning, and it NEVER replies.
        if (p.quickReplyCode === DURESS_CODE) {
          store.raiseDuress(p.senderId, p.timestampSec);
          break;
        }
        // Route the status to the sender's open SOS if there is one.
        const open = store.incidents.find(
          (i) => i.kind === 'sos' && i.status !== 'resolved',
        );
        store.applyGuardStatus(p.senderId, p.quickReplyCode ?? 0, open?.id);
        break;
      }
      case 'text': {
        const done = inbox.add(p);
        if (!done) break;
        // Ops-grammar messages become structured state (muster check-ins,
        // field reports, stand-downs); plain chat stays a toast + timeline.
        const ev = parseOpsMessage(done.text);
        if (ev) store.applyOpsEvent(done.senderId, ev);
        store.receiveTeamText(done.senderId, done.text);
        break;
      }
      default:
        break; // pings/rally/profile: consumer semantics, not surfaced here yet
    }
  });

  t.onMeshStatus((s) => {
    useCommandStore.getState().setLiveConnected(s.connected);
    setFrameSink(s.connected ? (frames) => frames.forEach((f) => t.sendFrame(f)) : null);
  });

  t.start();
}

export function disconnectLiveBridge(): void {
  bridge?.stop();
  bridge = null;
  setFrameSink(null);
  useCommandStore.getState().setLiveConnected(false);
}
