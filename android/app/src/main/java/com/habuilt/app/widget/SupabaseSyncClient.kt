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
    private const val SUPABASE_URL = "https://wixfgckjeyomxydxwhhn.supabase.co"
    private const val SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpeGZnY2tqZXlvbXh5ZHh3aGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NTY3NzEsImV4cCI6MjA4NzIzMjc3MX0.y7Kek12-uGzW-260oKqT865_8N1l-5007w7X0n51zG4"

    fun syncCompletionToSupabase(context: Context, habitId: String, day: Int) {
        Thread {
            try {
                val prefs = context.getSharedPreferences("habuilt_widget_prefs", Context.MODE_PRIVATE)
                val userId = prefs.getString("user_id", "guest") ?: "guest"
                if (userId == "guest" || userId.isEmpty()) {
                    Log.d(TAG, "Guest user or no auth - state saved locally only.")
                    return@Thread
                }

                val now = Date()
                val monthScope = SimpleDateFormat("yyyy-MM", Locale.US).format(now)

                // 1. Fetch current monthly state from Supabase
                val fetchUrl = URL("$SUPABASE_URL/rest/v1/user_monthly_states?user_id=eq.$userId&month_scope=eq.$monthScope&select=*")
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
                    var existingRecordId: String? = null

                    if (jsonArray.length() > 0) {
                        val record = jsonArray.getJSONObject(0)
                        existingRecordId = record.optString("id")
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
                            put("month_scope", monthScope)
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
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed background sync to Supabase: ${e.message}")
            }
        }.start()
    }
}
