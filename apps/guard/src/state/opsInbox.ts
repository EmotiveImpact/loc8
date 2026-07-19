// apps/guard/src/state/opsInbox.ts — Guard's ops-event inbox.
//
// One listener on the engine's completed-message stream, parsed through the
// shared ops grammar (engine core/opsMessages). Plain chat stays chat; ops
// verbs drive the app: a dispatch order arms the RESPOND flow, a muster call
// takes the whole team into muster mode, a stand-down releases it.
//
// Registered ONCE per process (module flag) — useGuardBoot may mount many
// times across duty sessions, but the engine keeps listeners across
// start/stop, so re-registering would double-handle every event.
import { getMeshService, haptics, parseOpsMessage } from '@loc8/engine';
import { useGuardStore } from './guardStore';

let registered = false;

export function bootOpsInbox(): void {
  if (registered) return;
  registered = true;

  getMeshService().onMessage((_senderId, text) => {
    const ev = parseOpsMessage(text);
    if (!ev) return; // plain crew chat — Activity feed already shows it

    const g = useGuardStore.getState();
    switch (ev.kind) {
      case 'dispatch':
        // Command's order: label the incident and knock hard. The rally frame
        // (converge target) arrives separately and lights the RESPOND bar.
        g.setDispatch(ev.label);
        haptics.dispatch();
        break;
      case 'muster_call':
        if (!g.musterActive) {
          g.callMuster();
          haptics.warning();
        }
        break;
      case 'muster_clear':
        if (g.musterActive) g.endMuster();
        break;
      case 'sos_clear':
        // A teammate stood their SOS down — nothing to change locally; the
        // Activity feed carries the message.
        break;
      default:
        // sos_text / incident / muster_safe / lone_overdue are control-room
        // signals; on the field device the Activity feed is enough.
        break;
    }
  });
}
