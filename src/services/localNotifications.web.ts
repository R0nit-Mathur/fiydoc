export interface LocalNotification {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/** Local OS banners are native-only; web retains the normal in-app notification store. */
export async function scheduleLocalNotification(_content: LocalNotification): Promise<void> {}
