package com.habuilt.app.widget

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import org.json.JSONArray

class HabitActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == HabuiltDueNowWidget.ACTION_MARK_DONE) {
            val habitId = intent.getStringExtra("habit_id") ?: return
            val habitName = intent.getStringExtra("habit_name") ?: "Habit"
            val day = intent.getIntExtra("day", -1)
            val points = intent.getIntExtra("points", 1)

            if (day <= 0) return

            Log.d("HabuiltWidget", "1-Tap [Mark Done] received for '$habitName' (ID: $habitId, Day: $day, Points: +$points)")

            // 1. Subtle Haptic Feedback on widget tap
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                    vibratorManager?.defaultVibrator?.vibrate(
                        VibrationEffect.createWaveform(longArrayOf(0, 20, 50, 30), intArrayOf(0, 180, 0, 255), -1)
                    )
                } else {
                    @Suppress("DEPRECATION")
                    val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator?.vibrate(VibrationEffect.createOneShot(35, VibrationEffect.DEFAULT_AMPLITUDE))
                    } else {
                        @Suppress("DEPRECATION")
                        vibrator?.vibrate(35)
                    }
                }
            } catch (e: Exception) {
                // Vibration fallback
            }

            // 2. Immediately update local widget preferences
            val prefs = context.getSharedPreferences("habuilt_widget_prefs", Context.MODE_PRIVATE)
            val rawHabits = prefs.getString("habits_json", null)
            var currentPoints = prefs.getInt("today_points", 0)

            if (!rawHabits.isNullOrEmpty()) {
                try {
                    val habitsArr = JSONArray(rawHabits)
                    var habitUpdated = false

                    for (i in 0 until habitsArr.length()) {
                        val h = habitsArr.getJSONObject(i)
                        if (h.optString("id") == habitId) {
                            val cd = h.optJSONArray("completed_days") ?: JSONArray()
                            var alreadyDone = false
                            for (j in 0 until cd.length()) {
                                if (cd.getInt(j) == day) {
                                    alreadyDone = true
                                    break
                                }
                            }
                            if (!alreadyDone) {
                                cd.put(day)
                                h.put("completed_days", cd)
                                habitUpdated = true
                            }
                        }
                    }

                    if (habitUpdated) {
                        currentPoints += points
                        prefs.edit()
                            .putString("habits_json", habitsArr.toString())
                            .putInt("today_points", currentPoints)
                            .apply()
                    }
                } catch (e: Exception) {
                    Log.e("HabuiltWidget", "Failed to update local widget prefs: ${e.message}")
                }
            }

            // 3. Immediately refresh all Home Screen Widgets (0ms UI lag!)
            HabuiltDueNowWidget.updateAllWidgets(context)

            // 4. Background sync to Supabase without opening app
            SupabaseSyncClient.syncCompletionToSupabase(context, habitId, day)
        }
    }
}
