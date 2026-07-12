# Haptics — the touch vocabulary

Loc8 is used eyes-down in loud, dark, crowded places. Touch is a first-class
output channel: a lot of the app can be *felt* without looking. This doc is the
source of truth for what each buzz means.

All haptics go through **one module** — `src/services/haptics.ts` — which exports
a `haptics` object of **semantic** methods (`haptics.success()`,
`haptics.pingReceived()`, …). Call sites never touch `expo-haptics` directly.

Three invariants are enforced once, in that module, so no call site has to
remember them:

1. **Respect the toggle** — every method no-ops when `hapticsEnabled === false`.
2. **Web has no engine** — every method no-ops when `Platform.OS === 'web'`.
3. **A buzz never crashes a handler** — async primitives are `.catch(() => {})`,
   sequences are wrapped so a throw can't bubble.

Methods are fire-and-forget: synchronous to call, they schedule the feedback and
return `void`. The zustand store **never imports** the haptics module (UI/services
call it, not the store) — that keeps the dependency graph acyclic.

---

## Vocabulary

| Event | Semantic method | iOS primitive | Why |
| --- | --- | --- | --- |
| Tab switch, segmented control, accent swatch, privacy-mode change, Settings toggle | `select()` | `selectionAsync()` | Dry, light tick for discrete selection. |
| Generic button / CTA, open a sheet, "Find" | `tap()` | `impactAsync(Light)` | A light confirm that a press registered. |
| Crew created / joined, session started, profile saved, QR-scan join | `success()` | `notificationAsync(Success)` | The system "it worked" chime. |
| Go dark, session expired | `warning()` | `notificationAsync(Warning)` | "You've changed something consequential." |
| Invalid / empty crew code, permission denied, failed action | `error()` | `notificationAsync(Error)` | Distinct "that didn't work." |
| You ping someone | `pingSent()` | `impactAsync(Medium)` | One firm outbound nudge. |
| Someone pings **you** | `pingReceived()` | `impactAsync(Rigid)` → **+90ms** → `impactAsync(Rigid)` | A **double knock** — deliberately unlike `success()` so an incoming ping is recognisable without looking. |
| You plant a rally pin | `rallyDrop()` | `impactAsync(Heavy)` | The heaviest single thunk — a deliberate, weighty act. |
| A rally lands from someone else | `rallyReceived()` | `impactAsync(Medium)` → **+120ms** → `impactAsync(Light)` | A "here → settle" two-beat that decays, unlike your own `Heavy` drop. |
| Proximity heartbeat (per pulse) | `proximityPulse(closeness)` | `impactAsync(Light \| Medium \| Heavy)` | One graded pulse; strength steps up by band (see below). |
| You found each other | `found()` | `impactAsync(Heavy)` → **+120ms** → `notificationAsync(Success)` → **+260ms** → `impactAsync(Rigid)` | A three-beat celebration — thunk, chime, sparkle. |

`pingReceived`, `rallyReceived` and `found` use `setTimeout` for their later
beats; each late callback is re-guarded (toggle re-checked, throw swallowed).

---

## The proximity heartbeat

On the compass (`app/compass/[id].tsx`) the app pulses faster and harder as you
close the last stretch — a Geiger-counter for a person. **The caller owns the
rhythm**; `haptics.proximityPulse(closeness)` just fires one graded pulse.

### The zone

The heartbeat runs while you're within `HEARTBEAT_START_M` (**150 m**) of your
friend and haven't yet found them (`found` at < 15 m ends it, and the
celebration takes over). Leaving the zone, unmounting, or finding stops and
cleans up the timer.

### Closeness → strength (band)

`closeness ∈ 0..1` is distance measured against the **proximity threshold**
(`proximityAt = max(25, accuracy × 1.5)`):

```
closeness = clamp01( (HEARTBEAT_START_M − dist) / (HEARTBEAT_START_M − proximityAt) )
```

`proximityPulse` picks the impact style by band:

| closeness | impact style |
| --- | --- |
| `< 0.40` | Light |
| `< 0.75` | Medium |
| `≥ 0.75` | Heavy |

### Closeness → period (escalation)

The period lerps from slow-and-far to fast-and-on-top:

```
period = HEARTBEAT_MAX_MS − (HEARTBEAT_MAX_MS − HEARTBEAT_MIN_MS) × closeness
       = 1100ms  (far edge, closeness 0)  →  300ms  (on top, closeness 1)
```

Implementation is a **self-rescheduling `setTimeout`**, not a fixed
`setInterval`: each beat reads the *latest* distance from a ref and schedules the
next beat, so the rhythm tightens smoothly as GPS updates arrive without tearing
the timer down on every packet.

### The found sequence

When distance drops below 15 m the celebration fires **once** (guarded by the
store's `celebrated` flag + a local `celebrationShown`): `found()` plays
`Heavy → (+120ms) Success → (+260ms) Rigid`.

---

## Accessibility toggle

`hapticsEnabled` (default **on**) lives in `src/state/crewStore.ts` alongside
`notificationsEnabled` / `units`: persisted to `AsyncStorage`, hydrated with a
type guard, reset via `reset()`, and flipped by `setHapticsEnabled()`.

**Settings → Haptics** ("Vibration feedback") toggles it. Turning it **on** fires
`haptics.select()` so the user feels it confirm. Every haptic method checks this
flag, so one switch silences the entire vocabulary app-wide.

---

## Wiring map — every call site

| File | Trigger | Call |
| --- | --- | --- |
| `app/settings.tsx` | Haptics toggle → on | `select()` |
| `src/ui/TabBar.tsx` | tab navigate | `select()` |
| `src/ui/TabBar.tsx` | raised Rally button | `tap()` |
| `src/ui/RadarCrewSheet.tsx` | open the roster peek | `tap()` |
| `src/ui/CrewSheet.tsx` | ping "Where are you?" / "Come find me" | `pingSent()` |
| `src/ui/CrewSheet.tsx` | "Find" | `tap()` |
| `app/(tabs)/index.tsx` | session CTA press | `success()` |
| `app/(tabs)/index.tsx` | incoming ping banner (`banner.friendId`) | `pingReceived()` |
| `app/(tabs)/index.tsx` | incoming rally (`rallyPin.droppedById !== myId`) | `rallyReceived()` |
| `app/(tabs)/crew.tsx` | create crew | `success()` |
| `app/(tabs)/crew.tsx` | join crew / QR-scan join | `success()` |
| `app/(tabs)/crew.tsx` | empty/invalid join code | `error()` |
| `app/(tabs)/crew.tsx` | leave crew | `tap()` |
| `app/(tabs)/crew.tsx` | session 4/6/12h buttons | `success()` |
| `app/(tabs)/me.tsx` | privacy segmented change | `select()` |
| `app/(tabs)/me.tsx` | Go dark | `warning()` |
| `app/(tabs)/me.tsx` | profile save | `success()` |
| `app/(tabs)/me.tsx` | accent swatch | `select()` |
| `app/(tabs)/me.tsx` | photo picked | `tap()` |
| `app/onboarding.tsx` | Continue / Enable location / Create crew CTAs | `tap()` |
| `app/onboarding.tsx` | finish onboarding (`setProfile`) | `success()` |
| `app/rally.tsx` | drop rally here | `rallyDrop()` |
| `app/compass/[id].tsx` | proximity heartbeat (per pulse) | `proximityPulse(closeness)` |
| `app/compass/[id].tsx` | found each other (once) | `found()` |
