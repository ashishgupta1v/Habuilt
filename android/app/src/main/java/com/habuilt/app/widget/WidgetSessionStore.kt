package com.habuilt.app.widget

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

/**
 * The widget access token lives in its own encrypted prefs file.
 * That file is excluded from Android backup. The token is never logged.
 */
object WidgetSessionStore {
    const val FILE_NAME = "habuilt_widget_session"
    private const val TAG = "HabuiltWidgetSession"

    fun readToken(context: Context): String {
        return try {
            prefs(context).getString(LaravelCheckInClient.TOKEN_KEY, "") ?: ""
        } catch (e: Exception) {
            Log.w(TAG, "Widget session could not be read")
            ""
        }
    }

    fun writeToken(context: Context, token: String) {
        try {
            val editor = prefs(context).edit()
            if (token.isBlank()) {
                editor.remove(LaravelCheckInClient.TOKEN_KEY)
            } else {
                editor.putString(LaravelCheckInClient.TOKEN_KEY, token)
            }
            editor.apply()
            context.getSharedPreferences(LaravelCheckInClient.PREFS, Context.MODE_PRIVATE)
                .edit()
                .remove(LaravelCheckInClient.TOKEN_KEY)
                .remove("supabase_access_token")
                .apply()
        } catch (e: Exception) {
            Log.w(TAG, "Widget session could not be stored")
        }
    }

    fun clearToken(context: Context) {
        writeToken(context, "")
    }

    private fun prefs(context: Context): SharedPreferences {
        val alias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
        return EncryptedSharedPreferences.create(
            FILE_NAME,
            alias,
            context,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }
}
