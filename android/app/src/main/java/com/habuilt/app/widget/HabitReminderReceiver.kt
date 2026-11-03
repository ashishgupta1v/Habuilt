package com.habuilt.app.widget

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.habuilt.app.MainActivity

/**
 * Shows the habit name and start time, then opens the app when tapped.
 */
class HabitReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != HabitReminderScheduler.ACTION_HABIT_REMINDER) return
        val name = intent.getStringExtra("habit_name")?.ifBlank { "Habit" } ?: "Habit"
        val time = intent.getStringExtra("habit_time").orEmpty()
        val title = if (time.isNotBlank()) "$name · $time" else name

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Habit reminders",
                NotificationManager.IMPORTANCE_HIGH
            )
            channel.description = "A reminder when a saved habit starts"
            manager.createNotificationChannel(channel)
        }

        val open = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val content = PendingIntent.getActivity(
            context,
            77021,
            open,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(title)
            .setContentText("Starts now.")
            .setAutoCancel(true)
            .setContentIntent(content)
            .build()

        try {
            manager.notify(title.hashCode(), notification)
        } catch (_: Exception) {
            // Permission may still be off. The next open can schedule again.
        }

        HabitReminderScheduler.scheduleNext(context)
    }

    companion object {
        private const val CHANNEL_ID = "habuilt_reminders"
    }
}
