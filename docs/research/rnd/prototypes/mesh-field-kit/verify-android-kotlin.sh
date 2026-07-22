#!/bin/sh
set -eu

: "${KOTLINC_BIN:?Set KOTLINC_BIN to the Expo SDK 57 Kotlin 2.1.20 compiler executable}"
: "${ANDROID_JAR:?Set ANDROID_JAR to Android SDK API 36 android.jar}"
: "${JAVA_HOME:?Set JAVA_HOME to a Java 17 JDK}"

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_root=$(CDPATH= cd -- "$script_dir/../../../../.." && pwd)
output_dir=$(mktemp -d "${TMPDIR:-/tmp}/loc8-mesh-android-kotlin.XXXXXX")
trap 'find "$output_dir" -depth -delete' EXIT

production_dir="$repo_root/modules/loc8-mesh/android/src/main/java/expo/modules/loc8mesh"

"$KOTLINC_BIN" \
  "$production_dir/MeshConstants.kt" \
  "$production_dir/MeshFrameCodec.kt" \
  "$production_dir/MeshDiagnostics.kt" \
  "$script_dir/android-system-clock-stub.kt" \
  "$script_dir/android-diagnostics-harness.kt" \
  -include-runtime -d "$output_dir/diagnostics-harness.jar"
"$JAVA_HOME/bin/java" -jar "$output_dir/diagnostics-harness.jar"

"$KOTLINC_BIN" \
  "$production_dir/MeshConstants.kt" \
  "$production_dir/MeshFrameCodec.kt" \
  "$production_dir/MeshDeduplicator.kt" \
  "$production_dir/MeshDiagnostics.kt" \
  "$production_dir/MeshRelayController.kt" \
  "$production_dir/MeshBleService.kt" \
  "$production_dir/Loc8MeshService.kt" \
  "$production_dir/Loc8MeshModule.kt" \
  "$script_dir/android-expo-stubs.kt" \
  "$script_dir/android-expo-exception-stubs.kt" \
  -classpath "$ANDROID_JAR" -d "$output_dir/source-check.jar"

echo "MESH-01 Android Kotlin 2.1.20 + API 36 source compile: PASS"
