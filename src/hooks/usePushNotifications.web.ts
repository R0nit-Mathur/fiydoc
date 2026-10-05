/** Expo native push notifications are unavailable on web. Do not import the native module. */
export function usePushNotifications(): { expoPushToken: string | null } {
  return { expoPushToken: null };
}
