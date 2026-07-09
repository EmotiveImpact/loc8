#!/usr/bin/env node
// loc8 mesh-bridge — a deliberately dumb relay.
//
// Guard gateway phones and the Command console all connect here; every binary
// frame from one client is forwarded verbatim to every other client. The
// payload is the engine's 25-byte mesh frame — the relay never parses it, so
// there is nothing here to get out of sync with the wire format.
//
//   node tools/mesh-bridge/index.mjs        # listens on 0.0.0.0:8787
//   PORT=9000 node tools/mesh-bridge/index.mjs
//
// Field demo: laptop runs this + the Command console; the gateway phone joins
// the laptop's hotspot and Guard connects with EXPO_PUBLIC_BRIDGE_URL.
import { WebSocketServer } from 'ws';

const PORT = Number(process.env.PORT ?? 8787);
const FRAME_SIZE = 25;

const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' });
let seq = 0;

wss.on('connection', (ws, req) => {
  const id = ++seq;
  const from = req.socket.remoteAddress;
  log(`client #${id} connected (${from}) · ${wss.clients.size} online`);

  ws.on('message', (data, isBinary) => {
    if (!isBinary || data.length !== FRAME_SIZE) return; // mesh frames only
    for (const peer of wss.clients) {
      if (peer !== ws && peer.readyState === peer.OPEN) peer.send(data);
    }
  });

  ws.on('close', () => log(`client #${id} disconnected · ${wss.clients.size} online`));
  ws.on('error', () => {});
});

function log(msg) {
  console.log(`[mesh-bridge ${new Date().toISOString().slice(11, 19)}] ${msg}`);
}

log(`relaying 25-byte mesh frames on ws://0.0.0.0:${PORT}`);
