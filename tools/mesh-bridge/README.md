# loc8 mesh-bridge

A deliberately dumb WebSocket relay: every 25-byte mesh frame from one client
is forwarded verbatim to every other client. Guard gateway phones and the
Command console meet here — the relay never parses a frame, so it can never
drift from the engine's wire format.

## The "wifi-off" field demo

1. **Laptop** (control room):
   ```bash
   node tools/mesh-bridge/index.mjs          # relay on :8787
   npm --prefix apps/command run dev          # console on :5182
   ```
   Open `http://localhost:5182/?bridge=1` — the console is now in LIVE mode
   (sim script disabled; BRIDGE row appears in the comms strip when connected).

2. **Gateway phone** (any guard on shift, on the laptop's hotspot):
   ```bash
   cd apps/guard
   EXPO_PUBLIC_TRANSPORT=ble EXPO_PUBLIC_BRIDGE_URL=ws://<laptop-ip>:8787 npx expo start
   ```
   The phone stays on the BLE mesh AND mirrors every frame to the console.

3. **Other phones**: run Guard with `EXPO_PUBLIC_TRANSPORT=ble` only — they
   need no network at all; their packets reach Command hop-by-hop through the
   mesh, then through the gateway.

4. **The moment**: kill the venue wifi/cell. Positions keep flowing, an SOS
   raised on a phone with **no connectivity** lands on the console via the
   gateway, dispatch orders typed in Command arrive on phones as dispatch
   takeovers, and status replies ("En route") come back. Nothing in this loop
   touches the internet.

Sim rehearsal (no phones): same as above but start Guard without
`EXPO_PUBLIC_TRANSPORT` — the simulated mesh is bridged instead of BLE.
