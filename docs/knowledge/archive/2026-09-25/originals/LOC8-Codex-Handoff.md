# Codex handoff: integrate the approved LOC8 Command interface

## Objective

Use this package to integrate the approved matte-black desktop design into `EmotiveImpact/loc8`, retaining the real Command engine, store, privacy rules and transport. The deliverable here is an isolated interactive design build, not a replacement communications system.

Keep the dominant venue map, compact navigation, right-side incident desk, bottom cameras/comms/activity and the dedicated glasses field view. Keep typography as HTML/SVG text. Do not substitute a generated screenshot for the UI. Do not replace this layout with a generic dashboard or remove the glasses panel.

Begin by opening `dist/index.html`, then compare the actual rendered screenshots in `previews/` with `design-reference/approved-screen.png`. The reference is the user's approved generated concept, not a current live application screenshot.

## What has actually been delivered

The UI is a framework-neutral TypeScript DOM/SVG renderer. `react/Loc8Command.tsx` is a small mounting wrapper, not an iframe and not a full React rewrite. All controls are real DOM elements or SVG objects. Art is kept separately in `src/assets` and embedded only for the standalone distribution.

`src/domain/model.ts` and `src/adapters/demo.ts` are **demo-only**. They must never become a second operational source of truth beside `useCommandStore`. The supplied build refuses live snapshots. The production integration must deliberately replace the fictional map assumptions, complete the view contract and validate authorisation before removing that guard.

## Repository observations at handoff

These observations come from reading the repository, not from building or executing it. Re-read the current files before making a patch, because the default branch may have changed.

| File inspected | Observed contract / content |
| --- | --- |
| `apps/command/package.json` | Existing Vite application with React 19.2.3, TypeScript, Zustand and `@loc8/engine`. Blob `8c87fd5a9c3a09b47da91cbadff45f3d0d52e37f`. |
| `apps/command/src/store/commandStore.ts` | Inspected state/actions and incident/dispatch implementation. Blob `c7278da80b47d148c6babfad998ef38f4b942578`. |

The inspected store exposes `setActiveIncident`, `noteReveal`, `acknowledge`, `escalate`, `resolve`, `dispatch`, `applyGuardStatus`, `callMuster`, `endMuster`, `standDownMuster`, `checkIn`, `runAssistedSearch`, live connection methods and the existing audit/export helpers. Its staff are keyed by numeric engine IDs; its incidents carry consent-related fields. Its command delivery uses the shared engine codec.

Related files already identified in the conversation and requiring a fresh read during integration include `src/engine.ts`, `src/domain/types.ts`, `src/services/liveBridge.ts`, the existing dashboards and the shared engine. Do not assume this design package contains all of their cases or tests.

## Integration sequence

### 1. Preserve the existing application

Read the repository's current `AGENTS.md`, package/workspace configuration and relevant docs first. Record the baseline build/typecheck/test results. Keep existing live functionality available behind the current route while reviewing the new screen.

Do not overwrite the root manifest, engine or packet codec with anything from this package. The isolated package uses TypeScript 5.8.3 only to reproduce this delivered build; retain the host's supported compiler and React versions.

Work in a new feature branch under the user's normal repository workflow. Do not push to main or deploy automatically. A suitable proposed branch name is `codex/loc8-command-matte-desktop`. This package has not created that branch or a PR.

### 2. Mount a demo-only visual review surface

A low-risk first integration is a separate, explicitly labelled preview route or feature flag. These routes/flags are proposals, not claims that they already exist.

Copy `src/` and `react/` into an isolated feature directory. Keep the relative structure or adjust imports. Leave the demo guard and labels intact. The checked-in `src/assets.generated.ts` contains the embedded art; alternatively adapt the host bundler to load the separate WebP files. Do not introduce runtime CDN dependencies.

Example mounting component, after adjusting the import path:

```tsx
import { Loc8Command } from './command-design/react/Loc8Command';

export function CommandDesignPreview() {
  return (
    <div style={{ width: '100%', height: '100dvh' }}>
      <Loc8Command />
    </div>
  );
}
```

No adapter supplied means an isolated demo is created and cleaned up by the view. An injected adapter is owned by the host; the view unsubscribes but does not destroy that host adapter. Keep its identity stable between React renders. Validate mount/unmount and Strict Mode behaviour within the actual repository. Only one Command surface per document is currently intended; SVG definition IDs and document keyboard handlers are not designed for multiple concurrent mounts.

The React wrapper has not been compiled or run against the repository in this delivery. That is an explicit next validation step, not a completed result.

### 3. Complete a typed host projection

Do not cast `useCommandStore` wholesale to this package's `Snapshot`. There are important differences:

| View concern | Required host treatment |
| --- | --- |
| Staff IDs | Keep the engine's numeric ID distinct from a displayed callsign such as `S-17`. Use an explicit mapping. |
| Locations | Host coordinates are not the demo's local SVG points. Introduce a verified map transform, floor association and missing-position state. Never fabricate an accurate location from a zone label. |
| Missing data | The demo always supplies position and battery values. Production must handle absent, stale, invalid and unavailable values without substituting fixture defaults. |
| Incident types | Preserve all real kinds, including SOS, duress and suspected man-down. Do not collapse emergencies into the demo's three ordinary incident examples. |
| Incident states | The demo omits `escalated`. Extend the view contract without downgrading or hiding the host's state. |
| Priority | Demo priority labels are presentation fixtures. The inspected store does not establish a complete formal severity policy. Do not derive clinical or operational priority merely from the incident title. |
| Consent and visibility | Honour the host's permitted subject pool and revoke visibility when the basis expires. Never add a searchable map of all attendees. |
| Crowd / radio coverage | Anonymous crowd counts, staff deployment and measured radio coverage are different things. The view's Coverage drawer is not a radio-propagation model. |
| Time | Carry observation/source timestamps separately from arrival time and render age from an appropriate clock. A reconnect must not refresh a position without a new observation. |
| Cameras / glasses | The inspected Command store does not establish a complete streaming contract. Add a separately authorised media adapter only when the transport and policy exist. |

For live work, replace the current synchronous demo `execute(): CommandResult` assumption with appropriate asynchronous command acceptance, pending, failure and observed-response states. A rejected or unsupported command must fail visibly, not return success because a toast was shown.

### 4. Connect actions without changing their meaning

**Incident selection and viewing:** connect selection to `setActiveIncident`. Preserve `noteReveal` when an incident view reveals an individual's name or location. The design's local selection alone is not an operational audit event.

**Local acknowledgement:** the inspected `acknowledge(id)` updates the control-room record. Do not label this as a field-device receipt or send an unsolicited acknowledgement to a duress device. Preserve the existing covert-duress rules.

**Dispatch:** the inspected signature is `dispatch(text, { incidentId?, toTag? })`. `toTag` is not a displayed callsign or automatically a numeric staff ID. Resolve the actual destination/team tag using the existing engine contract. Do not pass `S-17` or an arbitrary UI ID into the codec. Preserve the real message ID/fragmentation mechanisms.

The inspected implementation can record a dispatch even when no frame sink is attached. Therefore a dispatch-log entry is not proof of transmission or receipt. Add explicit admission/failure handling for the actual transport. Mark a recipient en route only following the appropriate inbound response, with the correct incident correlation. Never apply a late response to whichever incident happens to be selected on screen.

**Resolution reason:** the inspected store accepts `resolve(id)`, not `resolve(id, reason)`. This view collects a required reason. Extend the real command/audit contract and its tests before enabling that form on operational state; do not silently discard the reason. Do not stand down units just because an incident closes unless the real workflow explicitly authorises and records that action.

**Escalation:** the inspected implementation has an opinionated police/law-enforcement escalation entry. Do not silently turn it into a generic severity increase. Preserve the meaning or review that product decision explicitly.

**Muster:** keep existing `callMuster`, `checkIn` and stand-down/end semantics. Demonstration manual check-ins are not proof of field acknowledgements. Preserve outstanding staff visibility and record the basis for each operational check-in.

**Assisted search:** general navigation search must not bypass the existing reason-gated `runAssistedSearch` flow. The preview search uses only its limited demo staff, incidents and cameras. It is not a substitute for the host's audited individual-reveal workflow.

**Audit:** keep the host's accountability path. The inspected store uses browser storage and a bounded audit history; do not describe it as a tamper-proof server ledger. The preview's JSON session export is deliberately labelled demonstration and is not an operational retention solution.

### 5. Replace illustration with validated sources

The retained raster gives visual continuity with the approved screen, but has no geographic truth. The SVG route is decorative guidance for the design, not computed routing. The 1200 × 740 plan is not measured in metres. Before live enablement, provide a real site map, floor transforms, coordinate provenance, uncertainty treatment and correct layer alignment. Verify selecting and zooming never changes the underlying geographic meaning.

Camera and glasses media need an independently specified transport, access check and lifecycle. They must not be represented as flowing through the existing small mesh-message channel. Source loading, offline, stalled, ended, permission-denied and reconnect states need real implementation. Show last-frame age and source status; never leave a green live label on a frozen image. Local file preview must remain visibly distinct from device media.

Keep the glasses pane and its separately rendered HUD. Do not add invented bearings, distances, face identification or precision claims to that HUD.

### 6. Acceptance gate before switching the main screen

Run the real repository's typecheck, build and tests, plus equivalent interaction coverage for the host integration. Compare 1920 × 1080, 1672 × 941, 1440 × 900, 1280 × 800 and 1100 × 800. Ensure dispatch and incident resolution remain reachable at shorter heights. Test keyboard navigation and reduced motion; undertake a full accessibility review rather than interpreting the supplied focus tests as certification.

Exercise at least: authorised and unauthorised data; missing coordinates; out-of-order observations; stale locations; link loss; reconnect before a new sample; duplicate dispatch clicks; rejected sends; delayed responses; wrong-incident responses; duress; escalation; resolution reason retention; concurrent operator edits; partial muster; expired visibility; camera stalls and revoked media access.

Keep simulation isolated from live data. Remove neither the `mode: 'live'` guard nor the `DEMO` labels until a real, tested data/permissions/map path exists. Do not ship the pure demo reducer as the operational state machine.

The final PR should include the real build/test evidence, visual comparisons, changed contracts, unresolved risks and a rollback path. A native desktop wrapper and platform signing remain separate work; this delivery contains no compiled installer.

## Evidence and limits of this package

The supplied TypeScript build passed strict checking. Its isolated model has 40 passing tests. Its actual standalone document has 65 passing Chromium browser checks. Details and raw outputs are in `docs/TEST_REPORT.md`, `docs/model-test-output.txt` and `docs/browser-test-results.json`.

This does not claim that the existing repository, React wrapper, real bridge, operating-system Bluetooth or camera/glasses hardware was built or tested. No repository changes, branch, commit or PR were made during this delivery.