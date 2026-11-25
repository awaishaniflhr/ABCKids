package com.abckids

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

/**
 * The one waiting play reminder. It is saved in the app's own storage
 * (cleared by "Clear storage" or uninstalling) so it can be set again
 * after the phone restarts.
 */
object PlayReminders {
  const val EXTRA_DATA = "playReminder"
  private const val PREFS = "play_reminders"
  private const val CHANNEL_ID = "play_reminders"
  private const val NOTIFICATION_ID = 4701
  private const val ACTION_SHOW = "com.abckids.SHOW_PLAY_REMINDER"

  private fun prefs(context: Context) =
      context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun schedule(context: Context, at: Long, title: String, body: String, data: String) {
    prefs(context).edit()
        .putLong("at", at)
        .putString("title", title)
        .putString("body", body)
        .putString("data", data)
        .apply()
    setAlarm(context, at)
  }

  fun cancel(context: Context) {
    prefs(context).edit().clear().apply()
    alarmManager(context).cancel(alarmIntent(context))
    NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
  }

  fun pendingData(context: Context): String? = prefs(context).getString("data", null)

  /** After a restart (alarms are wiped), set the waiting reminder again. */
  fun restore(context: Context) {
    val at = prefs(context).getLong("at", 0L)
    if (pendingData(context) == null || at == 0L) return
    // If it came due while the phone was off, show it shortly instead.
    setAlarm(context, maxOf(at, System.currentTimeMillis() + 60_000L))
  }

  private fun alarmManager(context: Context) =
      context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  private fun alarmIntent(context: Context): PendingIntent =
      PendingIntent.getBroadcast(
          context,
          0,
          Intent(context, PlayReminderReceiver::class.java).setAction(ACTION_SHOW),
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

  // An inexact alarm is fine for "about 24 hours later" and needs no
  // special permission. It still goes off while the phone is idle.
  private fun setAlarm(context: Context, at: Long) {
    alarmManager(context).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, alarmIntent(context))
  }

  /** Shows the waiting reminder now (called by the alarm). */
  fun show(context: Context) {
    val store = prefs(context)
    val data = store.getString("data", null) ?: return
    val title = store.getString("title", null) ?: "Ready to trace again?"
    val body = store.getString("body", null) ?: ""
    store.edit().clear().apply()

    val manager = NotificationManagerCompat.from(context)
    if (!manager.areNotificationsEnabled()) return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
          CHANNEL_ID, "Play reminders", NotificationManager.IMPORTANCE_DEFAULT,
      ).apply { description = "A gentle reminder to finish a game" }
      context.getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }
    val open = Intent(context, MainActivity::class.java)
        .setFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
        .putExtra(EXTRA_DATA, data)
    val tap = PendingIntent.getActivity(
        context, 1, open, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_stat_play_reminder)
        .setColor(ContextCompat.getColor(context, R.color.play_reminder))
        .setContentTitle(title)
        .setContentText(body)
        .setContentIntent(tap)
        .setAutoCancel(true)
        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
        .build()
    try {
      manager.notify(NOTIFICATION_ID, notification)
    } catch (_: SecurityException) {
      // Notifications were turned off in the meantime.
    }
  }
}

/** Shows the reminder when its alarm goes off, and sets it again after a restart. */
class PlayReminderReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    when (intent.action) {
      Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_MY_PACKAGE_REPLACED -> PlayReminders.restore(context)
      else -> PlayReminders.show(context)
    }
  }
}
