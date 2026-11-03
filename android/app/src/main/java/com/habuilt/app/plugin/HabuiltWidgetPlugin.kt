package com.habuilt.app.plugin

import android.content.Context
import com.getcapacitor.JSObject
import org.json.JSONArray
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.habuilt.app.widget.HabitReminderScheduler
import com.habuilt.app.widget.HabuiltDueNowWidget
import com.habuilt.app.widget.LaravelCheckInClient

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
            val accessToken = call.getString("accessToken", "") ?: ""
            val habitsJson = call.getString("habitsJson", "[]") ?: "[]"
            val scheduleJson = call.getString("scheduleJson", "{}") ?: "{}"
            val streak = call.getInt("streak", 0) ?: 0
            val todayPoints = call.getInt("todayPoints", 0) ?: 0
            val prefs = context.getSharedPreferences("habuilt_widget_prefs", Context.MODE_PRIVATE)
            val editor = prefs.edit()
                .putString("user_id", userId)
                .putString("habits_json", habitsJson)
                .putString("schedule_json", scheduleJson)
                .putInt("streak", streak)
                .putInt("today_points", todayPoints)
                .remove("adherence_rate")
                .remove("compliance_status")
                .remove("clinical_directive")
                .remove("zoeticoach_api_url")
                .remove("zoeticoach_token")
            editor.remove("supabase_access_token")
            if (userId == "guest" || userId.isEmpty() || accessToken.isBlank()) {
                editor.remove(LaravelCheckInClient.TOKEN_KEY)
            } else {
                editor.putString(LaravelCheckInClient.TOKEN_KEY, accessToken)
            }
            editor.commit()

            // The habits snapshot is only for the home-screen display. Completions go to Laravel.
            Thread { LaravelCheckInClient.flush(context) }.start()
            HabuiltDueNowWidget.updateAllWidgets(context)
            HabitReminderScheduler.scheduleNext(context)

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
            ret.put("adherenceRate", 0)
            ret.put("complianceStatus", "")
            ret.put("clinicalDirective", "")
            val deadCount = jsonLength(prefs.getString(LaravelCheckInClient.DEAD_LETTER_KEY, "[]"))
            ret.put("lastSyncSuccessAt", prefs.getString(LaravelCheckInClient.LAST_SUCCESS_KEY, "") ?: "")
            ret.put("deadLetterCount", deadCount)
            ret.put("pendingSyncCount", jsonLength(prefs.getString(LaravelCheckInClient.QUEUE_KEY, "[]")))
            ret.put("syncFailed", deadCount > 0)
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to get widget data: ${e.message}", e)
        }
    }

    @PluginMethod
    fun clearWidgetSession(call: PluginCall) {
        try {
            val context = context ?: run {
                call.reject("Context is null")
                return
            }
            LaravelCheckInClient.clearSession(context, call.getBoolean("wipeDisplay", false) ?: false)
            call.resolve()
        } catch (e: Exception) {
            call.reject("Failed to clear widget session: ${e.message}", e)
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
            prefs.edit()
                .remove("zoeticoach_token")
                .remove("zoeticoach_api_url")
                .putString("zoeticoach_native_offline_queue", "[]")
                .apply()

            val ret = JSObject()
            ret.put("eventsJson", "[]")
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to drain native ZoetiCoach queue: ${e.message}", e)
        }
    }

    private fun jsonLength(raw: String?): Int {
        return try {
            JSONArray(raw ?: "[]").length()
        } catch (_: Exception) {
            0
        }
    }
}
