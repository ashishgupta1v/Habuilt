package com.habuilt.app.widget

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

object SupabaseSyncClient {
    private const val TAG = "HabuiltSupabase"
    private const val SUPABASE_URL = "https://eefrpxxcztapatyqokpv.supabase.co"
    private const val SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlZnJweHhjenRhcGF0eXFva3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NjQ5MDAsImV4cCI6MjA4OTA0MDkwMH0.1pct7C4PK0q9MicvOOM0CW99cc6pJLsV4jKVMoy9b5c"

    fun syncCompletionToSupabase(context: Context, habitId: String, day: Int) {
        Thread {
            try {
                val prefs = context.getSharedPreferences("habuilt_widget_prefs", Context.MODE_PRIVATE)
                val userId = prefs.getString("user_id", "guest") ?: "guest"
                if (userId == "guest" || userId.isEmpty()) {
                    Log.d(TAG, "Guest user - saved to local widget preferences.")
                    return@Thread
                }

                val now = Date()
                val monthKey = SimpleDateFormat("yyyy-MM", Locale.US).format(now)

                // 1. Fetch current monthly state from Supabase
                val fetchUrl = URL("$SUPABASE_URL/rest/v1/user_monthly_states?user_id=eq.$userId&month_key=eq.$monthKey&select=*")
                val getConn = fetchUrl.openConnection() as HttpURLConnection
                getConn.requestMethod = "GET"
                getConn.setRequestProperty("apikey", SUPABASE_ANON_KEY)
                getConn.setRequestProperty("Authorization", "Bearer $SUPABASE_ANON_KEY")
                getConn.setRequestProperty("Content-Type", "application/json")
                getConn.connectTimeout = 10000
                getConn.readTimeout = 10000

                val getCode = getConn.responseCode
                if (getCode in 200..299) {
                    val reader = BufferedReader(InputStreamReader(getConn.inputStream))
                    val responseStr = reader.readText()
                    reader.close()

                    val jsonArray = JSONArray(responseStr)
                    var stateObj = JSONObject()

                    if (jsonArray.length() > 0) {
                        val record = jsonArray.getJSONObject(0)
                        if (record.has("state_data")) {
                            val rawState = record.get("state_data")
                            stateObj = if (rawState is JSONObject) rawState else JSONObject(rawState.toString())
                        }
                    }

                    // Mutate habits array with the completed day
                    val habitsArr = stateObj.optJSONArray("habits") ?: JSONArray()
                    var updated = false
                    for (i in 0 until habitsArr.length()) {
                        val h = habitsArr.getJSONObject(i)
                        if (h.optString("id") == habitId) {
                            val cd = h.optJSONArray("completed_days") ?: JSONArray()
                            var alreadyHas = false
                            for (j in 0 until cd.length()) {
                                if (cd.getInt(j) == day) {
                                    alreadyHas = true
                                    break
                                }
                            }
                            if (!alreadyHas) {
                                cd.put(day)
                                h.put("completed_days", cd)
                                updated = true
                            }
                        }
                    }

                    if (updated) {
                        stateObj.put("habits", habitsArr)
                        stateObj.put("updated_at", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date()))

                        // Upsert record back to Supabase
                        val upsertUrl = URL("$SUPABASE_URL/rest/v1/user_monthly_states")
                        val postConn = upsertUrl.openConnection() as HttpURLConnection
                        postConn.requestMethod = "POST"
                        postConn.setRequestProperty("apikey", SUPABASE_ANON_KEY)
                        postConn.setRequestProperty("Authorization", "Bearer $SUPABASE_ANON_KEY")
                        postConn.setRequestProperty("Content-Type", "application/json")
                        postConn.setRequestProperty("Prefer", "resolution=merge-duplicates")
                        postConn.doOutput = true

                        val payload = JSONObject().apply {
                            put("user_id", userId)
                            put("month_key", monthKey)
                            put("state_data", stateObj)
                            put("updated_at", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date()))
                        }

                        val writer = OutputStreamWriter(postConn.outputStream)
                        writer.write(payload.toString())
                        writer.flush()
                        writer.close()

                        val postCode = postConn.responseCode
                        Log.d(TAG, "Supabase 1-tap completion sync response: $postCode")
                    }

                    // 2. Also write atomically to normalized habit_check_ins table for instant Realtime sync
                    try {
                        val ledgerUrl = URL("$SUPABASE_URL/rest/v1/habit_check_ins")
                        val ledgerConn = ledgerUrl.openConnection() as HttpURLConnection
                        ledgerConn.requestMethod = "POST"
                        ledgerConn.setRequestProperty("apikey", SUPABASE_ANON_KEY)
                        ledgerConn.setRequestProperty("Authorization", "Bearer $SUPABASE_ANON_KEY")
                        ledgerConn.setRequestProperty("Content-Type", "application/json")
                        ledgerConn.setRequestProperty("Prefer", "resolution=merge-duplicates")
                        ledgerConn.doOutput = true

                        val ledgerPayload = JSONObject().apply {
                            put("user_id", userId)
                            put("habit_id", habitId)
                            put("month_key", monthKey)
                            put("day", day)
                            put("completed_on", SimpleDateFormat("yyyy-MM-dd", Locale.US).format(now))
                            put("points", 1)
                            put("source", "android_widget")
                            put("updated_at", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date()))
                        }

                        val ledgerWriter = OutputStreamWriter(ledgerConn.outputStream)
                        ledgerWriter.write(ledgerPayload.toString())
                        ledgerWriter.flush()
                        ledgerWriter.close()

                        val ledgerCode = ledgerConn.responseCode
                        Log.d(TAG, "Supabase atomic ledger sync response: $ledgerCode")
                    } catch (le: Exception) {
                        Log.w(TAG, "Ledger atomic sync note: ${le.message}")
                    }

                    // 3. Also dispatch non-blocking event to ZoetiCoach WS18 Habit Cloud if configured
                    try {
                        val zoetiUrl = prefs.getString("zoeticoach_api_url", "") ?: ""
                        val zoetiToken = prefs.getString("zoeticoach_token", "") ?: ""
                        if (zoetiUrl.isNotEmpty() && zoetiToken.isNotEmpty()) {
                            val zUrl = URL("${zoetiUrl.trimEnd('/')}/api/v3/habit-cloud/events")
                            val zConn = zUrl.openConnection() as HttpURLConnection
                            zConn.requestMethod = "POST"
                            zConn.setRequestProperty("Authorization", "Bearer $zoetiToken")
                            zConn.setRequestProperty("Content-Type", "application/json")
                            zConn.connectTimeout = 5000
                            zConn.readTimeout = 5000
                            zConn.doOutput = true

                            val zPayload = JSONObject().apply {
                                put("external_participant_id", userId)
                                put("event_type", "habit_completed")
                                put("event_value", habitId)
                                put("occurred_at", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(now))
                                put("payload", JSONObject().apply {
                                    put("habit_id", habitId)
                                    put("points", 1)
                                    put("source", "android_widget")
                                })
                            }
                            val zWriter = OutputStreamWriter(zConn.outputStream)
                            zWriter.write(zPayload.toString())
                            zWriter.flush()
                            zWriter.close()
                            val zCode = zConn.responseCode
                            Log.d(TAG, "ZoetiCoach Habit Cloud response: $zCode")
                            if (zCode !in 200..299) {
                                enqueueNativeZoetiEvent(context, zPayload)
                            }
                        }
                    } catch (ze: Exception) {
                        Log.d(TAG, "ZoetiCoach background sync note (enqueuing): ${ze.message}")
                        try {
                            val zoetiUrl = prefs.getString("zoeticoach_api_url", "") ?: ""
                            val zoetiToken = prefs.getString("zoeticoach_token", "") ?: ""
                            if (zoetiUrl.isNotEmpty() && zoetiToken.isNotEmpty()) {
                                val zPayload = JSONObject().apply {
                                    put("external_participant_id", userId)
                                    put("event_type", "habit_completed")
                                    put("event_value", habitId)
                                    put("occurred_at", SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).format(Date()))
                                    put("payload", JSONObject().apply {
                                        put("habit_id", habitId)
                                        put("points", 1)
                                        put("source", "android_widget")
                                    })
                                }
                                enqueueNativeZoetiEvent(context, zPayload)
                            }
                        } catch (_: Exception) {}
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed background sync to Supabase: ${e.message}")
            }
        }.start()
    }

    private fun enqueueNativeZoetiEvent(context: Context, payload: JSONObject) {
        try {
            val prefs = context.getSharedPreferences("habuilt_widget_prefs", Context.MODE_PRIVATE)
            val rawQueue = prefs.getString("zoeticoach_native_offline_queue", "[]") ?: "[]"
            val queue = JSONArray(rawQueue)
            queue.put(payload)
            prefs.edit().putString("zoeticoach_native_offline_queue", queue.toString()).apply()
            Log.d(TAG, "Enqueued native ZoetiCoach event (queue depth: ${queue.length()})")
        } catch (e: Exception) {
            Log.w(TAG, "Failed to enqueue native ZoetiCoach event: ${e.message}")
        }
    }
}
