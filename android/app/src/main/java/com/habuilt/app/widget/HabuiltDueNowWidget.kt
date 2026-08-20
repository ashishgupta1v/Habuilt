package com.habuilt.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
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
    }

    companion object {
        const val ACTION_MARK_DONE = "com.habuilt.app.ACTION_MARK_DONE"
        private const val TAG = "HabuiltDueNowWidget"

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
                val streak = prefs.getInt("streak", 14)
                val todayPoints = prefs.getInt("today_points", 0)

                // Current day & time
                val cal = Calendar.getInstance()
                val currentDay = cal.get(Calendar.DAY_OF_MONTH)
                val currentMinutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)

                views.setTextViewText(R.id.tv_widget_streak, "🔥 ${streak}d")

                // Default fallback if no habits synced yet
                var targetHabitId = "focus_block"
                var targetHabitName = "🎯 Morning Focus Block (90 min)"
                var targetTimeLabel = "⏰ 08:30 AM – 10:00 AM"
                var targetPoints = 3
                var isDueNow = true
                var allDone = false

                if (!rawHabits.isNullOrEmpty()) {
                    try {
                        val habitsArr = JSONArray(rawHabits)
                        val scheduleObj = if (!rawSchedule.isNullOrEmpty()) JSONObject(rawSchedule) else JSONObject()

                        var foundDue: JSONObject? = null
                        var foundUpcoming: JSONObject? = null
                        var minUpcomingDiff = Int.MAX_VALUE

                        for (i in 0 until habitsArr.length()) {
                            val h = habitsArr.getJSONObject(i)
                            val id = h.optString("id")
                            val cd = h.optJSONArray("completed_days") ?: JSONArray()

                            var isCompletedToday = false
                            for (j in 0 until cd.length()) {
                                if (cd.getInt(j) == currentDay) {
                                    isCompletedToday = true
                                    break
                                }
                            }
                            if (isCompletedToday) continue

                            if (scheduleObj.has(id)) {
                                val sched = scheduleObj.getJSONObject(id)
                                val startParts = sched.optString("start", "00:00").split(":")
                                val endParts = sched.optString("end", "23:59").split(":")
                                val startMins = startParts[0].toInt() * 60 + startParts[1].toInt()
                                val endMins = endParts[0].toInt() * 60 + endParts[1].toInt()

                                if (currentMinutes in startMins..endMins) {
                                    foundDue = h
                                    break
                                } else if (startMins > currentMinutes) {
                                    val diff = startMins - currentMinutes
                                    if (diff < minUpcomingDiff) {
                                        minUpcomingDiff = diff
                                        foundUpcoming = h
                                    }
                                }
                            } else if (foundUpcoming == null) {
                                foundUpcoming = h
                            }
                        }

                        val chosen = foundDue ?: foundUpcoming
                        if (chosen != null) {
                            targetHabitId = chosen.optString("id", "habit_1")
                            targetHabitName = chosen.optString("name", "Habit")
                            targetPoints = chosen.optInt("points", 1)
                            isDueNow = (foundDue != null)

                            if (scheduleObj.has(targetHabitId)) {
                                val sched = scheduleObj.getJSONObject(targetHabitId)
                                val sStr = sched.optString("start", "")
                                val eStr = sched.optString("end", "")
                                targetTimeLabel = "⏰ $sStr – $eStr"
                            } else {
                                targetTimeLabel = "⏰ Scheduled for Today"
                            }
                        } else {
                            allDone = true
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Parsing habits JSON warning: ${e.message}")
                    }
                }

                if (allDone) {
                    views.setTextViewText(R.id.tv_widget_status_pill, "COMPLETED")
                    views.setTextViewText(R.id.tv_widget_habit_name, "🎉 All Habits Crushed Today!")
                    views.setTextViewText(R.id.tv_widget_schedule, "🌟 $todayPoints pts secured • Champion Mindset")
                    views.setViewVisibility(R.id.tv_widget_points, View.GONE)
                    views.setViewVisibility(R.id.btn_widget_mark_done, View.GONE)
                } else {
                    views.setViewVisibility(R.id.tv_widget_points, View.VISIBLE)
                    views.setViewVisibility(R.id.btn_widget_mark_done, View.VISIBLE)
                    views.setTextViewText(R.id.tv_widget_status_pill, if (isDueNow) "DUE NOW" else "UP NEXT")
                    views.setTextViewText(R.id.tv_widget_habit_name, targetHabitName)
                    views.setTextViewText(R.id.tv_widget_schedule, targetTimeLabel)
                    views.setTextViewText(R.id.tv_widget_points, "+$targetPoints pts")
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
            } catch (e: Exception) {
                Log.e(TAG, "Critical error updating widget $appWidgetId: ${e.message}", e)
            }
        }
    }
}
