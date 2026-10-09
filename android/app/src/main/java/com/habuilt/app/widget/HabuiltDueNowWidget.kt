package com.habuilt.app.widget

import android.app.AlarmManager
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import android.view.View
import android.widget.RemoteViews
import com.habuilt.app.MainActivity
import com.habuilt.app.R
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

class HabuiltDueNowWidget : AppWidgetProvider() {

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
        scheduleNextAlarm(context, 15)
    }

    override fun onReceive(context: Context, intent: Intent?) {
        super.onReceive(context, intent)
        val action = intent?.action ?: return
        when (action) {
            ACTION_SCHEDULE_TICK,
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_TIME_SET,
            Intent.ACTION_TIMEZONE_CHANGED,
            AppWidgetManager.ACTION_APPWIDGET_UPDATE -> {
                updateAllWidgets(context)
            }
        }
    }

    data class HabitSchedule(val startMins: Int, val endMins: Int, val label: String)

    companion object {
        const val ACTION_MARK_DONE = "com.habuilt.app.ACTION_MARK_DONE"
        const val ACTION_SCHEDULE_TICK = "com.habuilt.app.ACTION_SCHEDULE_TICK"
        private const val TAG = "HabuiltDueNowWidget"

        fun parseMinutes(timeStr: String?): Int? {
            if (timeStr.isNullOrBlank()) return null
            try {
                val clean = timeStr.trim().replace("⏰", "").trim()
                val parts = clean.split(":")
                if (parts.size >= 2) {
                    val h = parts[0].trim().toIntOrNull() ?: return null
                    val mClean = parts[1].trim().take(2).toIntOrNull() ?: return null
                    val isPm = clean.uppercase().contains("PM") && h < 12
                    val isAm = clean.uppercase().contains("AM") && h == 12
                    val finalH = if (isPm) h + 12 else if (isAm) 0 else h
                    return (finalH * 60 + mClean) % 1440
                }
            } catch (_: Exception) {}
            return null
        }

        fun getScheduleForHabit(habit: JSONObject, scheduleObj: JSONObject): HabitSchedule? {
            val id = habit.optString("id")

            // 1. Check scheduleObj passed from JavaScript
            if (scheduleObj.has(id)) {
                val sched = scheduleObj.optJSONObject(id)
                if (sched != null) {
                    val sStr = sched.optString("start")
                    val eStr = sched.optString("end")
                    val sM = parseMinutes(sStr)
                    val eM = parseMinutes(eStr)
                    if (sM != null && eM != null) {
                        return HabitSchedule(sM, eM, "⏰ $sStr – $eStr")
                    }
                }
            }

            // 2. Check habit's own startTime / endTime properties
            val directStart = habit.optString("startTime", "")
            val directEnd = habit.optString("endTime", "")
            val dsM = parseMinutes(directStart)
            val deM = parseMinutes(directEnd)
            if (dsM != null && deM != null) {
                return HabitSchedule(dsM, deM, "⏰ $directStart – $directEnd")
            }

            // 3. Fallback: Parse start time and optional duration from habit name (e.g. "04:45 Bed Spinal Mobility (10 min)")
            val name = habit.optString("name", "")
            val timeMatch = Regex("^(\\d{1,2}:\\d{2})").find(name.trim())
            if (timeMatch != null) {
                val startStr = timeMatch.groupValues[1]
                val sM = parseMinutes(startStr)
                if (sM != null) {
                    val durMatch = Regex("\\((\\d+)\\s*min", RegexOption.IGNORE_CASE).find(name)
                    val durationMins = durMatch?.groupValues?.get(1)?.toIntOrNull() ?: 30
                    val eM = (sM + durationMins) % 1440
                    val eh = String.format("%02d", eM / 60)
                    val em = String.format("%02d", eM % 60)
                    return HabitSchedule(sM, eM, "⏰ $startStr – $eh:$em")
                }
            }

            return null
        }

        fun scheduleNextAlarm(context: Context, delayMinutes: Int) {
            try {
                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
                val intent = Intent(context, HabuiltDueNowWidget::class.java).apply {
                    action = ACTION_SCHEDULE_TICK
                }
                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    999,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )

                val clampedMins = delayMinutes.coerceIn(1, 15)
                val triggerTime = System.currentTimeMillis() + (clampedMins * 60 * 1000L)

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (alarmManager.canScheduleExactAlarms()) {
                        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
                    } else {
                        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
                    }
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
                } else {
                    alarmManager.set(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
                }
            } catch (e: Exception) {
                Log.w(TAG, "scheduleNextAlarm warning: ${e.message}")
            }
        }

        fun updateAllWidgets(context: Context) {
            try {
                val appWidgetManager = AppWidgetManager.getInstance(context)
                val componentName = ComponentName(context, HabuiltDueNowWidget::class.java)
                val appWidgetIds = appWidgetManager.getAppWidgetIds(componentName)
                for (id in appWidgetIds) {
                    updateAppWidget(context, appWidgetManager, id)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error updating all widgets: ${e.message}", e)
            }
        }

        fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
            try {
                val views = RemoteViews(context.packageName, R.layout.widget_due_now_layout)
                val prefs = context.getSharedPreferences("habuilt_widget_prefs", Context.MODE_PRIVATE)

                val rawHabits = prefs.getString("habits_json", null)
                val rawSchedule = prefs.getString("schedule_json", null)
                val streak = prefs.getInt("streak", 0)
                val todayPoints = prefs.getInt("today_points", 0)

                // Current day & time
                val cal = Calendar.getInstance()
                val currentDay = cal.get(Calendar.DAY_OF_MONTH)
                val currentMinutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)

                views.setTextViewText(R.id.tv_widget_streak, "🔥 ${streak}d")
                views.setTextViewText(R.id.tv_widget_today_pts, "⭐ ${todayPoints} pts")

                // Default fallback if no habits synced yet
                var targetHabitId = "focus_block"
                var targetHabitName = "🎯 Morning Focus Block (90 min)"
                var targetTimeLabel = "⏰ 08:30 – 10:00"
                var targetPoints = 3
                var targetInstruction = "Feet on the floor by 05:00 sharp. No snooze button. Sit up → stand → drink water → start moving immediately."
                var isDueNow = true
                var allDone = false
                var nextTransitionMinutes = 15

                if (!rawHabits.isNullOrEmpty()) {
                    try {
                        val habitsArr = JSONArray(rawHabits)
                        val scheduleObj = if (!rawSchedule.isNullOrEmpty()) JSONObject(rawSchedule) else JSONObject()

                        var foundDue: JSONObject? = null
                        var foundDueSchedule: HabitSchedule? = null

                        var foundUpcoming: JSONObject? = null
                        var foundUpcomingSchedule: HabitSchedule? = null
                        var minUpcomingDiff = Int.MAX_VALUE

                        var earliestUncompleted: JSONObject? = null
                        var earliestUncompletedSchedule: HabitSchedule? = null
                        var minStartMins = Int.MAX_VALUE

                        var uncompletedCount = 0

                        for (i in 0 until habitsArr.length()) {
                            val h = habitsArr.getJSONObject(i)
                            val cd = h.optJSONArray("completed_days") ?: JSONArray()

                            var isCompletedToday = false
                            for (j in 0 until cd.length()) {
                                if (cd.getInt(j) == currentDay) {
                                    isCompletedToday = true
                                    break
                                }
                            }
                            if (isCompletedToday) continue
                            uncompletedCount++

                            val sched = getScheduleForHabit(h, scheduleObj)
                            if (sched != null) {
                                if (sched.startMins < minStartMins) {
                                    minStartMins = sched.startMins
                                    earliestUncompleted = h
                                    earliestUncompletedSchedule = sched
                                }

                                val isDue = if (sched.startMins <= sched.endMins) {
                                    currentMinutes in sched.startMins..sched.endMins
                                } else {
                                    currentMinutes >= sched.startMins || currentMinutes <= sched.endMins
                                }

                                if (isDue && foundDue == null) {
                                    foundDue = h
                                    foundDueSchedule = sched
                                } else if (sched.startMins > currentMinutes) {
                                    val diff = sched.startMins - currentMinutes
                                    if (diff < minUpcomingDiff) {
                                        minUpcomingDiff = diff
                                        foundUpcoming = h
                                        foundUpcomingSchedule = sched
                                    }
                                }
                            } else {
                                if (earliestUncompleted == null) {
                                    earliestUncompleted = h
                                }
                            }
                        }

                        if (uncompletedCount == 0) {
                            allDone = true
                        } else {
                            val chosen = foundDue ?: foundUpcoming ?: earliestUncompleted
                            val chosenSchedule = foundDueSchedule ?: foundUpcomingSchedule ?: earliestUncompletedSchedule

                            if (chosen != null) {
                                targetHabitId = chosen.optString("id", "habit_1")
                                targetHabitName = chosen.optString("name", "Habit")
                                targetPoints = chosen.optInt("points", 1)
                                isDueNow = (foundDue != null)

                                val explicitHint = chosen.optString("hint", "")
                                targetInstruction = if (explicitHint.isNotBlank()) {
                                    explicitHint
                                } else {
                                    targetHabitName
                                }

                                targetTimeLabel = chosenSchedule?.label ?: "⏰ Scheduled for Today"

                                // Calculate the next scheduled transition minute
                                if (foundDue != null && foundDueSchedule != null) {
                                    val diff = foundDueSchedule.endMins - currentMinutes
                                    if (diff > 0) nextTransitionMinutes = diff
                                } else if (foundUpcoming != null && foundUpcomingSchedule != null) {
                                    val diff = foundUpcomingSchedule.startMins - currentMinutes
                                    if (diff > 0) nextTransitionMinutes = diff
                                }
                            } else {
                                allDone = true
                            }
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Parsing habits JSON warning: ${e.message}")
                    }
                }

                if (allDone) {
                    views.setTextViewText(R.id.tv_widget_status_pill, "COMPLETED")
                    views.setTextViewText(R.id.tv_widget_habit_name, "🎉 All Habits Crushed Today!")
                    views.setTextViewText(R.id.tv_widget_schedule, "🌟 ${todayPoints} pts secured")
                    views.setTextViewText(R.id.tv_widget_guidance, "Target Protocol achieved! Outstanding daily consistency.")
                    views.setViewVisibility(R.id.tv_widget_points, View.GONE)
                    views.setViewVisibility(R.id.btn_widget_mark_done, View.GONE)
                } else {
                    views.setViewVisibility(R.id.tv_widget_points, View.VISIBLE)
                    views.setViewVisibility(R.id.btn_widget_mark_done, View.VISIBLE)
                    views.setTextViewText(R.id.tv_widget_status_pill, if (isDueNow) "DUE NOW" else "UP NEXT")
                    views.setTextViewText(R.id.tv_widget_habit_name, targetHabitName)
                    views.setTextViewText(R.id.tv_widget_schedule, targetTimeLabel)
                    views.setTextViewText(R.id.tv_widget_points, "+$targetPoints pts")
                    views.setTextViewText(R.id.tv_widget_guidance, targetInstruction)
                }

                // 1. Mark Done PendingIntent
                if (!allDone) {
                    val markIntent = Intent(context, HabitActionReceiver::class.java).apply {
                        action = ACTION_MARK_DONE
                        putExtra("habit_id", targetHabitId)
                        putExtra("habit_name", targetHabitName)
                        putExtra("day", currentDay)
                        putExtra("points", targetPoints)
                    }
                    val markPending = PendingIntent.getBroadcast(
                        context,
                        appWidgetId,
                        markIntent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                    )
                    views.setOnClickPendingIntent(R.id.btn_widget_mark_done, markPending)
                }

                // 2. Open App PendingIntent
                val openIntent = Intent(context, MainActivity::class.java).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                }
                val openPending = PendingIntent.getActivity(
                    context,
                    appWidgetId + 1000,
                    openIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.btn_widget_open_app, openPending)
                views.setOnClickPendingIntent(R.id.widget_root, openPending)

                appWidgetManager.updateAppWidget(appWidgetId, views)

                // Schedule next alarm to flip widget on next habit transition
                scheduleNextAlarm(context, nextTransitionMinutes)
            } catch (e: Exception) {
                Log.e(TAG, "Critical error updating widget $appWidgetId: ${e.message}", e)
            }
        }
    }
}
