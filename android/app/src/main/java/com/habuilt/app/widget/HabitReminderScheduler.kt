package com.habuilt.app.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

/**
 * Schedules one local notification at the next saved habit start.
 * Tapping the notification opens the app. It does not write a check-in.
 */
object HabitReminderScheduler {
    private const val TAG = "HabitReminderScheduler"
    private const val REQUEST_CODE = 88021
    const val ACTION_HABIT_REMINDER = "com.habuilt.app.ACTION_HABIT_REMINDER"

    fun scheduleNext(context: Context) {
        try {
            val prefs = context.getSharedPreferences(LaravelCheckInClient.PREFS, Context.MODE_PRIVATE)
            val habits = JSONArray(prefs.getString("habits_json", "[]") ?: "[]")
            val schedule = JSONObject(prefs.getString("schedule_json", "{}") ?: "{}")
            val next = nextStart(habits, schedule) ?: run {
                cancel(context)
                return
            }

            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
            val intent = Intent(context, HabitReminderReceiver::class.java).apply {
                action = ACTION_HABIT_REMINDER
                putExtra("habit_name", next.name)
                putExtra("habit_time", next.time)
            }
            val pending = PendingIntent.getBroadcast(
                context,
                REQUEST_CODE,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.atMillis, pending)
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.atMillis, pending)
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, next.atMillis, pending)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Could not schedule the next habit reminder")
        }
    }

    private fun cancel(context: Context) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val intent = Intent(context, HabitReminderReceiver::class.java).apply {
            action = ACTION_HABIT_REMINDER
        }
        val pending = PendingIntent.getBroadcast(
            context,
            REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        alarmManager.cancel(pending)
    }

    private data class NextStart(val name: String, val time: String, val atMillis: Long)

    private fun nextStart(habits: JSONArray, schedule: JSONObject): NextStart? {
        val now = Calendar.getInstance()
        var best: NextStart? = null
        for (offset in 0..1) {
            val day = Calendar.getInstance()
            day.add(Calendar.DAY_OF_YEAR, offset)
            val dayNumber = day.get(Calendar.DAY_OF_MONTH)
            for (index in 0 until habits.length()) {
                val habit = habits.optJSONObject(index) ?: continue
                if (offset == 0 && completedToday(habit, dayNumber)) continue
                val window = HabuiltDueNowWidget.getScheduleForHabit(habit, schedule) ?: continue
                val at = Calendar.getInstance()
                at.timeInMillis = day.timeInMillis
                at.set(Calendar.HOUR_OF_DAY, window.startMins / 60)
                at.set(Calendar.MINUTE, window.startMins % 60)
                at.set(Calendar.SECOND, 0)
                at.set(Calendar.MILLISECOND, 0)
                if (at.timeInMillis <= now.timeInMillis + 15000) continue
                if (best == null || at.timeInMillis < best.atMillis) {
                    val hour = window.startMins / 60
                    val minute = window.startMins % 60
                    val time = String.format("%02d:%02d", hour, minute)
                    val rawName = habit.optString("name", "Habit")
                    val name = rawName.replace(Regex("^\\d{1,2}:\\d{2}\\s*"), "").ifBlank { "Habit" }
                    best = NextStart(name, time, at.timeInMillis)
                }
            }
        }
        return best
    }

    private fun completedToday(habit: JSONObject, day: Int): Boolean {
        val completed = habit.optJSONArray("completed_days") ?: return false
        for (index in 0 until completed.length()) {
            if (completed.optInt(index) == day) return true
        }
        return false
    }
}
