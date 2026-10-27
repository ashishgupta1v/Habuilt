package com.habuilt.app.plugin

import android.content.Context
import com.getcapacitor.JSObject
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
            val streak = call.getInt("streak", 0) ?: 0
            val todayPoints = call.getInt("todayPoints", 0) ?: 0
            val adherenceRate = call.getInt("adherenceRate", 0) ?: 0
            val complianceStatus = call.getString("complianceStatus", "Active Protocol") ?: "Active Protocol"
            val clinicalDirective = call.getString("clinicalDirective", "") ?: ""
            val zoetiUrl = call.getString("zoeticoachUrl", "https://zoeticoach.com") ?: "https://zoeticoach.com"
            val zoetiToken = call.getString("zoeticoachToken", "1|kgJJYPqqpt5XXolV1vJ2enUgrAPDgrpNbOVTu8W011c87abe") ?: "1|kgJJYPqqpt5XXolV1vJ2enUgrAPDgrpNbOVTu8W011c87abe"

            val prefs = context.getSharedPreferences("habuilt_widget_prefs", Context.MODE_PRIVATE)
            prefs.edit()
                .putString("user_id", userId)
                .putString("habits_json", habitsJson)
                .putString("schedule_json", scheduleJson)
                .putInt("streak", streak)
                .putInt("today_points", todayPoints)
                .putInt("adherence_rate", adherenceRate)
                .putString("compliance_status", complianceStatus)
                .putString("clinical_directive", clinicalDirective)
                .putString("zoeticoach_api_url", zoetiUrl)
                .putString("zoeticoach_token", zoetiToken)
                .apply()

            // Refresh all widgets on the home screen immediately
            HabuiltDueNowWidget.updateAllWidgets(context)

            call.resolve()
        } catch (e: Exception) {
            call.reject("Failed to sync widget data: ${e.message}", e)
        }
    }

    @PluginMethod
    fun getWidgetData(call: PluginCall) {
        try {
            val context = context ?: run {
                call.reject("Context is null")
                return
            }
            val prefs = context.getSharedPreferences("habuilt_widget_prefs", Context.MODE_PRIVATE)
            val ret = JSObject()
            ret.put("userId", prefs.getString("user_id", "guest"))
            ret.put("habitsJson", prefs.getString("habits_json", "[]"))
            ret.put("scheduleJson", prefs.getString("schedule_json", "{}"))
            ret.put("streak", prefs.getInt("streak", 0))
            ret.put("todayPoints", prefs.getInt("today_points", 0))
            ret.put("adherenceRate", prefs.getInt("adherence_rate", 0))
            ret.put("complianceStatus", prefs.getString("compliance_status", "Active Protocol"))
            ret.put("clinicalDirective", prefs.getString("clinical_directive", ""))
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to get widget data: ${e.message}", e)
        }
    }

    @PluginMethod
    fun drainNativeZoetiQueue(call: PluginCall) {
        try {
            val context = context ?: run {
                call.reject("Context is null")
                return
            }
            val prefs = context.getSharedPreferences("habuilt_widget_prefs", Context.MODE_PRIVATE)
            val rawQueue = prefs.getString("zoeticoach_native_offline_queue", "[]") ?: "[]"
            prefs.edit().putString("zoeticoach_native_offline_queue", "[]").apply()

            val ret = JSObject()
            ret.put("eventsJson", rawQueue)
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to drain native ZoetiCoach queue: ${e.message}", e)
        }
    }
}
