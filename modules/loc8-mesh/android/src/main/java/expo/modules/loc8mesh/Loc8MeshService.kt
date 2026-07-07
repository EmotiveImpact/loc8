// Loc8MeshService.kt
// Loc8Mesh
//
// Minimal connectedDevice foreground service (spike brief §2): keeps the
// process — and therefore MeshBleService's links, GATT server and relay
// timers — alive while the app is backgrounded. connectedDevice has no
// Android 15/16 FGS timeout.
//
// Lifecycle: started by Loc8MeshModule.start() (must be called while the app
// is foregrounded — background FGS starts are restricted since API 31) and
// stopped by Loc8MeshModule.stop(). All mesh logic lives in MeshBleService;
// this class only pins the process.
//
// Notification notes (verified against current Android docs):
//   - POST_NOTIFICATIONS (API 33+) is NOT required for the service to run;
//     without it the notification may stay hidden, but the FGS still appears
//     in the Task Manager and keeps running.
//   - On API 34+ an FGS of type connectedDevice must hold at least one
//     qualifying runtime permission (e.g. BLUETOOTH_CONNECT / BLUETOOTH_SCAN);
//     Loc8MeshModule.start() verifies those before starting this service.

package expo.modules.loc8mesh

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder

class Loc8MeshService : Service() {

    companion object {
        private const val CHANNEL_ID = "loc8_mesh"
        private const val CHANNEL_NAME = "Loc8 mesh"
        private const val NOTIFICATION_ID = 0x4C38 // "L8"

        fun start(context: Context) {
            val intent = Intent(context, Loc8MeshService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, Loc8MeshService::class.java))
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
        // The module owns the lifecycle; if the system kills us the mesh state
        // is gone anyway, so don't auto-restart with a dead mesh.
        return START_NOT_STICKY
    }

    private fun buildNotification(): Notification {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (manager.getNotificationChannel(CHANNEL_ID) == null) {
                manager.createNotificationChannel(
                    NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_LOW)
                )
            }
            return Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("Loc8 mesh active")
                .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
                .setCategory(Notification.CATEGORY_SERVICE)
                .setOngoing(true)
                .build()
        }
        @Suppress("DEPRECATION")
        return Notification.Builder(this)
            .setContentTitle("Loc8 mesh active")
            .setSmallIcon(android.R.drawable.stat_sys_data_bluetooth)
            .setOngoing(true)
            .build()
    }
}
