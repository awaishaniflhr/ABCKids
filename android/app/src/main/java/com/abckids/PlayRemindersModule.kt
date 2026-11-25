package com.abckids

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import androidx.core.app.NotificationManagerCompat

/**
 * Play reminders: at most one local notification waiting at a time.
 * Works fully offline (Android alarms) and survives a phone restart.
 * The JavaScript side (src/services/reminders.js) decides what to remind.
 */
class PlayRemindersModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {

  override fun getName() = "PlayReminders"

  /** Replaces any waiting reminder with this one, shown at [at] (ms since epoch). */
  @ReactMethod
  fun schedule(at: Double, title: String, body: String, data: String, promise: Promise) {
    try {
      PlayReminders.schedule(context, at.toLong(), title.take(80), body.take(200), data.take(500))
      promise.resolve(true)
    } catch (error: Exception) {
      promise.reject("E_REMINDER", "Could not schedule the reminder.", error)
    }
  }

  /** Cancels the waiting reminder (and removes one already on screen). */
  @ReactMethod
  fun cancel(promise: Promise) {
    PlayReminders.cancel(context)
    promise.resolve(true)
  }

  /** The waiting reminder's data, or null when nothing is waiting. */
  @ReactMethod
  fun getPending(promise: Promise) {
    promise.resolve(PlayReminders.pendingData(context))
  }

  /** True when the phone lets this app show notifications. */
  @ReactMethod
  fun canNotify(promise: Promise) {
    promise.resolve(NotificationManagerCompat.from(context).areNotificationsEnabled())
  }

  /**
   * The data of the reminder the app was just opened from, or null.
   * Each tap is handed out only once.
   */
  @ReactMethod
  fun consumeOpened(promise: Promise) {
    val intent = context.currentActivity?.intent
    val data = intent?.getStringExtra(PlayReminders.EXTRA_DATA)
    intent?.removeExtra(PlayReminders.EXTRA_DATA)
    promise.resolve(data)
  }
}
