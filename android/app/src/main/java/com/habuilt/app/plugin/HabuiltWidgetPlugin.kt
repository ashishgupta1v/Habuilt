package com.habuilt.app.plugin

import android.content.Context
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.habuilt.app.widget.HabuiltDueNowWidget

@CapacitorPlugin(name = "HabuiltWidget")
class HabuiltWidgetPlugin : Plugin() {

    @PluginMethod
    fun syncWidgetData(call: PluginCall) {
        try {
            val context = context ?: run {
                call.reject("Context is null")
                return
            }

            val userId = call.getString("userId", "guest") ?: "guest"
            val habitsJson = call.getString("habitsJson", "[]") ?: "[]"
            val scheduleJson = call.getString("scheduleJson", "{}") ?: "{}"
            val streak = call.getInt("streak", 14) ?: 14
            val todayPoints = call.getInt("todayPoints", 0) ?: 0

            val prefs = context.getSharedPreferences("habuilt_widget_prefs", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("user_id", userId)
                .putString("habits_json", habitsJson)
                .putString("schedule_json", scheduleJson)
                .putInt("streak", streak)
                .putInt("today_points", todayPoints)
                .apply()

            // Refresh all widgets on the home screen immediately
            HabuiltDueNowWidget.updateAllWidgets(context)

            call.resolve()
        } catch (e: Exception) {
            call.reject("Failed to sync widget data: ${e.message}", e)
        }
    }
}
