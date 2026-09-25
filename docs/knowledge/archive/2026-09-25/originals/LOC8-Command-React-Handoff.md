# Integrating with the existing EmotiveImpact/loc8 application

## This repository is a new local implementation, not the existing GitHub repository

Do not force-push it over `EmotiveImpact/loc8`, replace its history or overwrite its package manifest. The host package inspected during this task used React 19.2.3, React DOM 19.2.3, Zustand 5, TypeScript 6 and Vite 7. This standalone preview's vendored React 18.2.0 is not permission to downgrade that host.

Read the current host files again before integrating. Source anchors inspected in this conversation were:

- `apps/command/README.md`
- `apps/command/src/App.tsx`
- `apps/command/src/engine.ts`
- `apps/command/src/domain/types.ts`
- `apps/command/src/store/commandStore.ts`
- `apps/command/src/services/liveBridge.ts`
- `tools/mesh-bridge/index.mjs`

The earlier handoff is retained as background in `PREVIOUS_HANDOFF.md`; its historical test counts and implementation claims do not substitute for this build's evidence.

## Preserve the actual engine boundary

The host's `engine.ts` imports pure modules and `BridgedTransport` from `@loc8/engine`. Keep the shared packet codec, 25-byte frame format, text fragmentation/reassembly, status codes and transport. Do not recreate radio framing in this view, import a React-Native-dependent barrel into the web target, or mistake a browser canvas for a BLE transport.

The source inspected used numeric engine staff IDs. This preview's string callsigns such as S-08 are display fixture IDs, not packet sender IDs or destination tags. A proper adapter must carry both display and transport identity explicitly.

## Integration sequence

1. Create a new branch in the actual host. Capture its own typecheck/tests/build before edits. Mount the approved components behind a review route, retaining the old console until equivalent behaviour is proven.
2. Replace the preview's vendored-runtime aliases with the host's actual React/React DOM and a reviewed Pixi package. Remove the narrow local runtime declaration facades and compile with the host's official type packages. Do not run two independent React copies in one root.
3. Introduce a dedicated view-state contract for live data. `State.mode` and `Simulation` are intentionally simulation-only here. Do not coerce a live host snapshot into them or persist operational data using the demo localStorage key. Keep simulation/live state, credentials, storage and rendering sessions separate.
4. Build a host adapter that exposes authorised snapshots and command outcomes. Keep engine IDs, incident IDs, observation source, observed time, received time, uncertainty, consent basis and expiry. Reject malformed/out-of-order/replayed inputs under host policy; those live validation rules are not implemented by this demo.
5. Map operator commands to host actions with truthful states. A local command queued while disconnected is not a sent frame. A sent frame is not a radio delivery receipt. A receipt is not a field operator acknowledgement. Preserve the original command/incident correlation through view changes and reconnection.
6. Connect authenticated media separately from the small mesh payload. Show disconnected, buffering, playing, paused and ended states honestly. Do not call a still "live". Do not add face recognition or automatic target labels to the glasses overlay.
7. Test on native macOS/Windows/Linux and physical iPad/Android targets, including sleep/resume, visibility changes, storage failure, lost graphics context and lost local gateway connection.

## Specific inspected host issues to verify, not silently gloss over

The inspected `resolve` signature accepted only an incident ID. This UI requires a reason. Add an appropriate host command/audit change and tests rather than dropping the reason at integration.

The inspected dispatch path called an optional frame sink. Its local log must not be treated as proof of delivery when no sink is attached. Add explicit transport and acknowledgement outcomes; do not re-label this preview's `acknowledged_demo` as a live receipt.

The host types/privacy policy intentionally exclude a browsable attendee identity map. Preserve anonymous crowd aggregates and the narrowly permitted consent-based pool. Compile-time types are not a substitute for server/transport authorisation, expiry enforcement or production auditing.

The inspected development relay accepted correctly sized frames and listened on all interfaces; no connection authentication was visible in that file. Treat it as a development relay, not a hardened production service. Establish authenticated pairing, endpoint trust, authorisation, origin rules, replay protection and rate limits before a physical trial.

Duress must not generate an outbound acknowledgement to its source. Local acknowledgement and the separately authorised response workflow must remain distinct. This preview never implements an automatic message back to a duress source.

## Coordinate gate

The artwork and stored x/y fixture coordinates are illustrative. Do not put real GPS or indoor observations on top until the map projection/floor calibration, origin, units, source and uncertainty are established. Uploaded plans are images, not calibration. Do not infer indoor precision from Bluetooth signal strength or relay hop count.

## First credible hardware exercise

Use authorised test staff only, one Command workstation, a local gateway and a bounded set of Guard devices. Demonstrate a real status/message round trip with correlated evidence, then remove public internet while retaining the necessary local gateway link. Verify stale observations, reconnect behaviour and actual receipt semantics separately from any indoor-positioning experiment. Record raw permitted traces, timing, losses and the test conditions. Keep the mock data disabled throughout the live exercise.