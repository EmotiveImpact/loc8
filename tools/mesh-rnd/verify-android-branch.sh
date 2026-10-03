#!/bin/sh
set -eu

# Match Expo SDK 57's documented Java 17 / Kotlin 2.1.20 / Android API 36.
# KOTLINC_BIN may be a normal compiler executable or a local cache wrapper.
: "${KOTLINC_BIN:?Set KOTLINC_BIN to the Kotlin 2.1.20 compiler executable}"
: "${KOTLIN_STDLIB_JAR:?Set KOTLIN_STDLIB_JAR to kotlin-stdlib-2.1.20.jar}"
: "${ANDROID_JAR:?Set ANDROID_JAR to Android SDK API 36 android.jar}"
: "${JAVA_HOME:?Set JAVA_HOME to a Java 17 JDK}"

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_root=$(CDPATH= cd -- "$script_dir/../.." && pwd)
production_dir="$repo_root/modules/loc8-mesh/android/src/main/java/expo/modules/loc8mesh"
output_dir=$(mktemp -d "${TMPDIR:-/tmp}/loc8-android-branch.XXXXXX")
trap 'find "$output_dir" -depth -delete' EXIT

# This avoids a second implementation under test and does not change the
# Android module's source discovery or Expo build configuration.
python3 - "$production_dir/MeshBleService.kt" "$output_dir/branch-state.kt" <<'PY'
import pathlib
import sys
source = pathlib.Path(sys.argv[1]).read_text()
start, end = '// BEGIN PURE BRANCH RELAY STATE', '// END PURE BRANCH RELAY STATE'
assert source.count(start) == 1 and source.count(end) == 1, 'pure-state marker mismatch'
body = source.split(start, 1)[1].split(end, 1)[0]
pathlib.Path(sys.argv[2]).write_text('package expo.modules.loc8mesh\n' + body)

# Narrow static integration contracts complement pure executable checks.
# These establish source wiring; they do not execute an Android Handler.
timer = source.split('private fun scheduleBranchRelay(', 1)[1].split('// MARK: - Status', 1)[0]
ordered = [
    'if (pendingRelays[key] !== relayRunnable) return@Runnable',
    'pendingRelays.remove(key)',
    'val forward = branchRelays.take(key, pending.token) ?: return@Runnable',
    'if (forward.expired)',
    'if (centralLinks.isEmpty() && subscribers.isEmpty())',
    'if (!MeshBranchRelayState.hasUnwitnessedEgress(',
    '"relay-forwarded"',
]
positions = [timer.index(token) for token in ordered]
assert positions == sorted(positions), 'timer cleanup/expiry/egress guards must precede forward evidence'
egress = source.split('private fun sendFrame(', 1)[1].split('private fun recordBranchEgressSkip', 1)[0]
assert egress.count('if (address in excludedLinkIds)') == 2, 'both write and notify roles must suppress witness MACs'
ingress = source.split('private fun handleIngress(', 1)[1].split('private fun scheduleBranchRelay(', 1)[0]
assert ingress.index('"application-delivery"') < ingress.index('scheduleBranchRelay('), 'capacity drop must preserve first application delivery'
assert 'if (relayMode == MeshRelayMode.CURRENT) pendingRelays.remove(key)' in ingress, 'baseline retains whole cancellation only in current mode'
pending_duplicate = ingress.split('if (relayMode == MeshRelayMode.BRANCH && branchRelays.hasPending(key))', 1)[1].split('if (dedup.isDuplicate(key)', 1)[0]
assert 'branchRelays.observeDuplicate(key, frame, linkId)' in pending_duplicate and 'return' in pending_duplicate, 'any pending short key vetoes application admission; full identity alone can witness'
assert 'MeshBranchRelayState(nowMs = android.os.SystemClock::elapsedRealtime)' in source, 'runtime deadline must use Android monotonic clock'
assert source.count('branchRelays.forgetLink(address)') == 5, 'both role connect/disconnect paths must invalidate old witnesses'
radio_drop = source.split('private fun dropRadioState()', 1)[1].split('// MARK: -', 1)[0]
stop = source.split('fun stop()', 1)[1].split('// MARK: - Adapter state', 1)[0]
assert 'dedup.reset()' not in radio_drop and 'dedup.reset()' in stop, 'radio off preserves application dedup; explicit stop resets it'
configuration = source.split('fun configureRelayMode(', 1)[1].split('/** Idempotent: repeated calls', 1)[0]
assert 'enqueueRelayMode(mode, onConfigured, onFailure, retriesLeft = 2)' in configuration, 'configuration requeue must have two-retry initial budget'
assert configuration.count('if (retriesLeft > 0)') == 2 and configuration.count('retriesLeft - 1') == 2, 'only handler churn and rejected posts retry, each consumes budget'
assert configuration.index('MeshRelayMode.configurationFailure(mode, running, relayMode)') < configuration.index('relayMode = selected'), 'mode selection must validate against the current mode on the owning handler'
reattach = configuration.split('if (selected == relayMode)', 1)[1].split('relayMode = selected', 1)[0]
assert 'emitStatusIfChanged(force = true)' in reattach and 'onConfigured(selected)' in reattach and 'return@post' in reattach, 'same-mode reattachment must report actual status and resolve without changing state'
for destructive in ['clear(', 'reset(', 'stop(', 'start(', 'dropRadioState(']:
    assert destructive not in reattach, 'same-mode reattachment must preserve live mesh state'
capacity = timer.split('if (pending == null)', 1)[1].split('"relay-scheduled"', 1)[0]
assert 'MeshDiagnostics.recordFrame' not in capacity.split('return', 1)[0], 'capacity must use OS log/counter; frozen contract has no truthful drop reason'
expired = timer.split('if (forward.expired)', 1)[1].split('if (centralLinks.isEmpty()', 1)[0]
no_peers = timer.split('if (centralLinks.isEmpty()', 1)[1].split('if (!MeshBranchRelayState.hasUnwitnessedEgress(', 1)[0]
for cancellation in [expired, no_peers]:
    assert '"relay-cancelled"' in cancellation and 'reason = "scheduled-relay-cancelled"' in cancellation, 'expiry/no-peer timer cancellation needs a valid frozen-contract reason'
fully_witnessed = timer.split('if (!MeshBranchRelayState.hasUnwitnessedEgress(', 1)[1].split('"relay-forwarded"', 1)[0]
assert '"egress-skipped"' in fully_witnessed and 'reason = "duplicate"' in fully_witnessed, 'witness suppression uses existing duplicate reason'
print('Android branch source integration contracts: PASS (11 static contracts; Android Handler not executed)')
PY

"$KOTLINC_BIN" -no-stdlib -no-reflect -jvm-target 17 \
  -classpath "$KOTLIN_STDLIB_JAR" \
  "$production_dir/MeshConstants.kt" "$production_dir/MeshFrameCodec.kt" "$production_dir/MeshDeduplicator.kt" \
  "$output_dir/branch-state.kt" "$script_dir/android-branch-harness.kt" \
  -d "$output_dir/branch-harness.jar"
"$JAVA_HOME/bin/java" -cp "$output_dir/branch-harness.jar:$KOTLIN_STDLIB_JAR" \
  expo.modules.loc8mesh.Android_branch_harnessKt

"$KOTLINC_BIN" -no-stdlib -no-reflect -jvm-target 17 \
  -classpath "$KOTLIN_STDLIB_JAR:$ANDROID_JAR" \
  "$production_dir/MeshConstants.kt" "$production_dir/MeshFrameCodec.kt" \
  "$production_dir/MeshDeduplicator.kt" "$production_dir/MeshDiagnostics.kt" \
  "$production_dir/MeshRelayController.kt" "$production_dir/MeshBleService.kt" \
  -d "$output_dir/service-source-check.jar"
echo "Android branch full service source compile against API 36: PASS"
echo "Source compilation does not prove an Expo/Gradle app build or BLE hardware behavior."
