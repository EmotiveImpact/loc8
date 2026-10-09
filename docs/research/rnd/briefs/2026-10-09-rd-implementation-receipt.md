# R5 research verification receipt | 9 October 2026

Base: draft PR #5 `09932ccb49a2deb67db924ee54c622b7a6302b3f`.
Built: independent research-only shared-engine schedule overlap proxy, CLI scenarios, Node and Jest contracts.

Local host Node v22.16.0: `node --test tools/mesh-rnd/gatt-schedule.node.cjs` passed 10/10 checks.
Standalone `tsc --noEmit --strict --target es2020` passed.
The local test used an equivalent source-loader stub since the full repo could not be cloned.
Full npm/Jest/Expo/native/mobile suites were not executed locally. Judge any new PR CI separately.

Synthetic outputs (overlapping events / generated events): separated 0/4800;
drift 1600/4801 (800 overlapping pairs); dense 278/9602; churn 0/400.
They do not represent received packets, true radio collisions, power or coverage.

No third-party code copied; no dependency, production export, packet format or native change.
Keep current relay default, opt-in branch mode, draft PR #5, frozen 5,400-trial history and MESH-01 physical gate.
