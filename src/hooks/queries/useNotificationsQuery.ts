import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { NotificationItem } from '@/types/index';

export function useNotificationsQuery() {
  const user = useAuthStore((s) => s.user);
  const storeNotifications = useNotificationStore((s) => s.notifications);

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        const serverItems = await notificationService.getMyNotifications();
        if (Array.isArray(serverItems) && serverItems.length > 0) {
          // Normalize server notification to NotificationItem
          const normalized: NotificationItem[] = serverItems.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            timestamp: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
            time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
            read: Boolean(n.read),
            type: (n.type || 'system').toLowerCase() as any,
            link: n.payload?.appointmentId
              ? `/appointments/${n.payload.appointmentId}`
              : n.payload?.prescriptionId
              ? `/health/prescription/${n.payload.prescriptionId}`
              : undefined,
            recipientId: n.userId || user.id,
          }));

          // Sync into notification store to merge
          const existingIds = new Set(storeNotifications.map((sn) => sn.id));
          normalized.forEach((item) => {
            if (!existingIds.has(item.id)) {
              useNotificationStore.getState().addNotification(item);
            }
          });

          return normalized;
        }
      } catch (err) {
        console.warn('[useNotificationsQuery] Failed to fetch server notifications:', err);
      }
      return storeNotifications;
    },
    enabled: Boolean(user?.id),
    staleTime: 0,
    refetchInterval: 8000,
    refetchOnMount: 'always',
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  const markAsRead = useNotificationStore((s) => s.markAsRead);

  return useMutation({
    mutationFn: async (id: string) => {
      await notificationService.markAsRead(id);
    },
    onSuccess: (_, id) => {
      markAsRead(id);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  return useMutation({
    mutationFn: async () => {
      await notificationService.markMyAllAsRead();
    },
    onSuccess: () => {
      markAllAsRead();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
