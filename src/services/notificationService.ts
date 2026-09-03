import { apiClient } from './apiClient';
import { NotificationItem } from '@/types/index';

export const notificationService = {
  getNotifications: async (userId: string): Promise<NotificationItem[]> => {
    return apiClient<NotificationItem[]>(`/notifications/user/${userId}`);
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient(`/notifications/${id}/read`, { method: 'POST' });
  },

  markAllAsRead: async (userId: string): Promise<void> => {
    await apiClient(`/notifications/user/${userId}/read-all`, { method: 'POST' });
  },
};
