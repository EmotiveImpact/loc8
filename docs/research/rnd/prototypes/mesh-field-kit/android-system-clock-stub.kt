package android.os

/** JVM-only clock seam for the recorder harness; never packaged in the app. */
object SystemClock {
    fun elapsedRealtimeNanos(): Long = System.nanoTime()
}
