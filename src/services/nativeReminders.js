import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

// The phone side of play reminders (android/.../PlayRemindersModule.kt).
// Null where it doesn't exist (iOS, or an older build).
export function getPlayReminders() {
  return Platform.OS === 'android' ? NativeModules.PlayReminders ?? null : null;
}

// Asks to show notifications (Android 13+ shows a system prompt).
// Returns 'granted', 'denied' (may ask again) or 'blocked' (only the phone's
// settings can turn them back on).
export async function requestNotificationPermission() {
  const native = getPlayReminders();
  if (!native) return 'denied';
  if (Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      return result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
        ? 'blocked'
        : 'denied';
    }
  }
  // Older phones (or notifications switched off later) are checked directly.
  return (await native.canNotify()) ? 'granted' : 'blocked';
}
