import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { apiClient } from '@/services/apiClient';

// Ensure foreground notifications present an alert banner, sound, and badge
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function registerForPushNotificationsAsync() {
      if (Platform.OS === 'web') {
        return null;
      }

      // Android Notification Channel is mandatory for Android 8.0+ (API 26+)
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Appointments & Clinical Updates',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#1A56DB',
            sound: 'default',
            showBadge: true,
            enableVibrate: true,
          });
        } catch (err: any) {
          console.warn('[PushNotifications] Failed to create Android notification channel:', err?.message);
        }
      }

      if (!Device.isDevice) {
        console.log('[PushNotifications] Push notifications require a physical device.');
        return null;
      }

      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('[PushNotifications] Notification permission not granted.');
          return null;
        }

        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ||
          Constants?.easConfig?.projectId ||
          '24aa4a10-9492-4cf0-842b-efdd9d32804d';

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId,
        });

        return tokenData.data;
      } catch (error: any) {
        console.warn('[PushNotifications] Error obtaining push token:', error?.message);
        return null;
      }
    }

    registerForPushNotificationsAsync().then((token) => {
      if (isMounted && token) {
        setExpoPushToken(token);
      }
    });

    if (Platform.OS !== 'web') {
      // Listen for incoming notifications when app is foregrounded
      notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
        const { title, body, data } = notification.request.content;
        console.log('[PushNotifications] Notification received in foreground:', title, body);

        // Mirror into local notification store so user sees it in notification center
        useNotificationStore.getState().addNotification({
          title: title || 'Clinical Alert',
          message: body || '',
          type: (data?.type as string) || 'appointment',
          link: (data?.link as string) || (data?.appointmentId ? `/appointments/${data.appointmentId}` : undefined),
          recipientId: user?.id,
        });
      });

      // Listen for user interactions / taps on the phone notification panel
      responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        console.log('[PushNotifications] Notification response tapped:', data);

        if (data?.link && typeof data.link === 'string') {
          try {
            router.push(data.link as any);
          } catch (e: any) {
            console.warn('[PushNotifications] Failed navigating to link:', data.link, e?.message);
          }
        } else if (data?.appointmentId) {
          const role = useAuthStore.getState().role;
          const target = role === 'doctor'
            ? `/(doctor)/(tabs)/appointments`
            : `/(patient)/(tabs)/appointments`;
          router.push(target as any);
        }
      });
    }

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  // Whenever user signs in or token is refreshed, sync token with backend
  useEffect(() => {
    if (!expoPushToken || !user?.id) return;

    let isSubscribed = true;

    async function syncPushToken() {
      try {
        await apiClient('/notifications/push-token', {
          method: 'POST',
          body: JSON.stringify({ pushToken: expoPushToken, token: expoPushToken }),
        });
        console.log('[PushNotifications] Registered push token with server for user:', user?.id);
      } catch (err: any) {
        if (isSubscribed) {
          console.warn('[PushNotifications] Failed to sync push token to server:', err?.message);
        }
      }
    }

    syncPushToken();

    return () => {
      isSubscribed = false;
    };
  }, [expoPushToken, user?.id]);

  return { expoPushToken };
}
