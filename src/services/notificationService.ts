import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { apiClient } from './apiClient';
import { NotificationItem } from '@/types/index';

export const notificationService = {
  getMyNotifications: async (): Promise<NotificationItem[]> => {
    return apiClient<NotificationItem[]>('/notifications/me');
  },

  getNotifications: async (userId: string): Promise<NotificationItem[]> => {
    return apiClient<NotificationItem[]>(`/notifications/user/${userId}`);
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient(`/notifications/${id}/read`, { method: 'POST' });
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    await apiClient(`/notifications/user/${userId}/read-all`, { method: 'POST' });
  },

  markMyAllAsRead: async (): Promise<void> => {
    await apiClient('/notifications/me/read-all', { method: 'POST' });
  },

  registerPushToken: async (pushToken: string): Promise<void> => {
    if (!pushToken) return;
    await apiClient('/notifications/push-token', {
      method: 'POST',
      body: JSON.stringify({ pushToken, token: pushToken }),
    });
  },

  sendLocalNotification: async (params: {
    title: string;
    message: string;
    type?: string;
    link?: string;
    payload?: any;
  }): Promise<void> => {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: params.title,
          body: params.message,
          sound: 'default',
          data: { type: params.type || 'alert', link: params.link, ...params.payload },
        },
        trigger: null,
      });
    } catch (err: any) {
      console.warn('[notificationService] Failed to schedule local notification:', err?.message);
    }
  },
};
