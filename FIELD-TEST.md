# Native field procedure

Protocol and acceptance remain `mesh-01.e01.v1`, MESH-01 E01. The authoritative
[14-block runbook](docs/research/rnd/prototypes/mesh-field-kit/runbook.md),
[preregistration](docs/research/rnd/results/MESH-01/2026-07-22-three-phone-relay-kit/pre-registration.md),
strict schemas, evaluator and synthetic fixtures are unchanged. Existing run
IDs/raw files must not be renamed or overwritten. This document adds build and
cohort instructions; it does not loosen a gate.

## Prove offline cold start before measuring RF

1. Build/install the labelled internal public `current` app from [BUILD.md](BUILD.md).
   Record the exact commit, package ID, APK/IPA hash, phone model, OS, permissions
   and start battery. Repeat later with `branch` under a new run ID.
2. Force-stop other Loc8/Guard variants and disable optional bridges. Stop Metro
   and disconnect development Wi-Fi/cellular. Enable Airplane mode, then manually
   re-enable Bluetooth. Confirm that Wi-Fi/cellular remain off; record the state.
3. Force-stop this app and launch from its icon while still disconnected. The
   field screen must open with the bundled fonts/JS, without a launcher or server.
   A failed cold start is a build/device failure, not evidence about BLE range.
4. Select run/cohort/role, then start diagnostics. Record **native relay mode**
   from the status/getter, not just the app name or requested environment flag.
   The harness refuses a mismatch when configuring. Stop if the mode is unknown,
   mismatched, the module is missing, or a scan-only degraded device is being
   treated as a full relay. Secure interrupted evidence as INCOMPLETE.
5. Reboot and repeat the disconnected launch as a separate restart observation.
   Rejoin permissions where required; do not infer background operation from it.

## Frozen three-phone control, then branch comparison

Use three permissioned phones A/B/C, approved site geometry and the runbook's
evidence handling. The frozen matrix has six near-pair blocks (10 attempts
each), pre/post A↔C isolation blocks with B absent (50 attempts each), and two
independent 100-attempt relay blocks per direction. Send at 1/s and allow the
existing 10-second deadline. Stop/restart between blocks and secure/hash every
export before starting the next. Record mode externally because the frozen
JSONL schema intentionally has no mode field.

The GO gate stays **at least 190/200 deliveries per direction within 10 seconds**,
exact A/C origin → B ingress → one B forwarding event with TTL decrement →
destination ingress/delivery, zero application duplicates, near controls 10/10,
zero A/C links/deliveries without B, fixed geometry/build/cohort integrity,
zero recorder overflow and measured pairwise clock uncertainty ≤100 ms.
LIMITED/NO-GO/CONFOUNDED/INCOMPLETE retain the original evaluator meanings.
Even GO applies only to that static foreground three-phone cohort.

Repeat the entire matrix with `branch`, keeping geometry, devices, source rate
and OS/power states the same. Use new unique IDs such as `mesh01-current-001`
and `mesh01-branch-001`; retain any already allocated IDs. Repeat mixed-OS
cohorts independently. An Android result cannot promote iOS or vice versa.

## Additional cohorts: retain their own experiment IDs and evidence

Register device count, geometry, offered load, duration, ordering and comparison
before each repeat. Keep MESH-02/MESH-03 E02 and R3 / SEC-01 E06 identifiers.
Do not feed a changed matrix into the frozen MESH-01 evaluator as a full run.

| Cohort | Repeatable procedure and what to retain |
|---|---|
| Duplicate / uncovered branch | In addition to A/B/C use a fourth controlled peer or suitable native test rig so B hears a same-frame duplicate from an already-covered branch before its timer, while C is still uncovered. Keep A/C isolated. Preserve ingress/timer/forward/arrival evidence in current and branch. Three phones alone may not establish this topology or timing; do not manufacture the duplicate condition by originating a different frame. |
| Density | Use the available 5/10/25/50+ cohort, record actual connected degree as well as population, same source/rate/geometry and independent repeats. Retain unique delivery, duplicates, latency including losses, queue pressure and battery. A smaller available cohort stays labelled with its actual count. |
| Asymmetric loss | Use fixed measured obstructions/attenuation and test both directions independently, bracketed by near and isolation controls. Report erased first transmissions and disconnected components; the candidate does not repair every one-shot loss. |
| Churn / load | At declared times disable/re-enable B radio, reconnect/restart B and vary named source counts/rates. Capture bounded queue admission/drop, expiry, reconnect and retained-token behavior with OS logs as well as application evidence. Stop a failed block and retain its trace; do not silently retry under its ID. |
| Screen-off / background | Keep A foreground for the frozen JS attempt loop; lock/background B or C for a separate E02 cohort. The harness deliberately aborts a backgrounded source loop. Testing the public app's background source requires its ordinary session producer and a separately registered method, not removal of that guard. |
| Low power | Repeat each named phone state with OS low-power/battery saver on/off, recorded start charge/temperature and equal workload. Treat changed advertising/scan behavior as a measured outcome. |
| Restart | Restart app, radio and device as distinct interventions; record reattachment, actual mode, permissions, link generation, exports and recovery. Test returning from a debug harness to the ordinary app with the same mode separately; internal field variants are dedicated to the harness. |
| Battery / shift | Use matched duration, traffic, charge/temperature and OS/device cohorts for current and branch. Record foreground/background and any instrumentation cost. Prefer an external meter; otherwise label OS battery estimates. Directed software attempts are not measured RF airtime or joules. |

Capture OS logs separately: the unchanged field JSONL contract cannot represent
every capacity drop or equivalent per-link send cost on both platforms. Preserve
failed/excluded runs and uncertainty. No physical observations have been created
by this build work. Raw phone evidence belongs in the approved private encrypted
bundle; source, metadata method, hashes and redacted decision receipts belong in Git.
