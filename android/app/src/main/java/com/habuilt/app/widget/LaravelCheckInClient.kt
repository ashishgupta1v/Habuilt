package com.habuilt.app.widget

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Widget completions use the same Laravel check-in route as the website.
 * The signed-in user's id comes from the Bearer token on the server.
 * A failed request stays in a local queue and is sent to Laravel later.
 */
object LaravelCheckInClient {
    private const val TAG = "HabuiltLaravelCheckIn"
    const val APP_ORIGIN = "https://habuilt.com"
    const val PREFS = "habuilt_widget_prefs"
    const val TOKEN_KEY = "session_access_token"
    private const val QUEUE_KEY = "pending_laravel_check_ins"

    fun syncCompletion(
        context: Context,
        habitId: String,
        habitName: String,
        day: Int,
        points: Int,
        onComplete: (() -> Unit)? = null,
    ) {
        Thread {
            try {
                val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                val now = Date()
                val item = JSONObject().apply {
                    put("habit_id", habitId)
                    put("habit_name", habitName)
                    put("month_key", SimpleDateFormat("yyyy-MM", Locale.US).format(now))
                    put("day", day)
                    put("completed_on", SimpleDateFormat("yyyy-MM-dd", Locale.US).format(now))
                    put("points", points)
                    put("source", "android_widget")
                }
                enqueue(prefs, item)
                flush(context)
            } catch (e: Exception) {
                Log.w(TAG, "Widget completion stayed on device: ${e.message}")
            } finally {
                onComplete?.invoke()
            }
        }.start()
    }

    fun flush(context: Context) {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        val token = prefs.getString(TOKEN_KEY, "") ?: ""
        val queue = readQueue(prefs)
        if (token.isBlank() || queue.length() == 0) {
            return
        }

        val remaining = JSONArray()
        for (index in 0 until queue.length()) {
            val row = queue.optJSONObject(index) ?: continue
            if (!postCheckIn(token, row)) {
                remaining.put(row)
            }
        }
        prefs.edit().putString(QUEUE_KEY, remaining.toString()).apply()
    }

    fun clearSession(context: Context, wipeDisplay: Boolean) {
        val editor = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .remove(TOKEN_KEY)
            .remove("supabase_access_token")
        if (wipeDisplay) {
            editor
                .remove("user_id")
                .remove("habits_json")
                .remove("schedule_json")
                .remove(QUEUE_KEY)
                .putInt("today_points", 0)
                .putInt("streak", 0)
        }
        editor.apply()
        HabuiltDueNowWidget.updateAllWidgets(context)
    }

    private fun enqueue(prefs: SharedPreferences, item: JSONObject) {
        val queue = readQueue(prefs)
        val habitId = item.optString("habit_id")
        val day = item.optInt("day")
        val monthKey = item.optString("month_key")
        for (index in 0 until queue.length()) {
            val existing = queue.optJSONObject(index) ?: continue
            if (existing.optString("habit_id") == habitId
                && existing.optInt("day") == day
                && existing.optString("month_key") == monthKey
            ) {
                return
            }
        }
        queue.put(item)
        prefs.edit().putString(QUEUE_KEY, queue.toString()).apply()
    }

    private fun readQueue(prefs: SharedPreferences): JSONArray {
        val raw = prefs.getString(QUEUE_KEY, "[]") ?: "[]"
        return try {
            JSONArray(raw)
        } catch (_: Exception) {
            JSONArray()
        }
    }

    private fun postCheckIn(token: String, item: JSONObject): Boolean {
        var connection: HttpURLConnection? = null
        return try {
            connection = (URL("$APP_ORIGIN/api/habits/check-ins").openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 10000
                readTimeout = 10000
                doOutput = true
                setRequestProperty("Accept", "application/json")
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Authorization", "Bearer $token")
            }
            val payload = JSONObject().apply {
                put("habit_id", item.optString("habit_id"))
                put("habit_name", item.optString("habit_name"))
                put("month_key", item.optString("month_key"))
                put("day", item.optInt("day"))
                put("completed_on", item.optString("completed_on"))
                put("points", item.optInt("points", 1))
                put("source", "android_widget")
            }
            OutputStreamWriter(connection.outputStream).use { writer ->
                writer.write(payload.toString())
            }
            val code = connection.responseCode
            code in 200..299
        } catch (e: Exception) {
            Log.w(TAG, "Laravel check-in was not reachable")
            false
        } finally {
            connection?.disconnect()
        }
    }
}
