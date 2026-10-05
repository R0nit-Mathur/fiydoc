import * as Notifications from 'expo-notifications';

export interface LocalNotification {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function scheduleLocalNotification(content: LocalNotification): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { ...content, sound: 'default' },
    trigger: null,
  });
}
