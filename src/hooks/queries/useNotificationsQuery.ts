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
          const isDoctor = user?.role === 'doctor';
          // Normalize server notification to NotificationItem
          const normalized: NotificationItem[] = serverItems.map((n: any) => {
            const aptId = n.payload?.appointmentId || n.payload?.consultationId;
            const rxId = n.payload?.prescriptionId;
            let link: string | undefined;

            if (isDoctor) {
              if (aptId) {
                link = `/(doctor)/consultation/${aptId}`;
              } else {
                link = '/(doctor)/(tabs)/appointments';
              }
            } else {
              if (rxId) {
                link = `/(patient)/health/prescription/${rxId}`;
              } else if (aptId) {
                link = `/(patient)/appointments/${aptId}`;
              } else if (n.type?.toLowerCase().includes('prescription')) {
                link = '/(patient)/(tabs)/health';
              } else if (n.type?.toLowerCase().includes('appointment')) {
                link = '/(patient)/(tabs)/appointments';
              }
            }

            return {
              id: n.id,
              title: n.title,
              message: n.message,
              timestamp: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
              time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
              read: Boolean(n.read),
              type: (n.type || 'system').toLowerCase() as any,
              link,
              recipientId: n.userId || user.id,
              recipientRole: isDoctor ? 'doctor' : 'patient',
            };
          });

          // Silently sync server notifications into store without triggering push banners
          useNotificationStore.getState().syncServerNotifications(normalized);

          return normalized;
        }
      } catch (err) {
        console.warn('[useNotificationsQuery] Failed to fetch server notifications:', err);
      }
      return storeNotifications;
    },
    enabled: Boolean(user?.id),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  const markAsRead = useNotificationStore((s) => s.markAsRead);

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await notificationService.markAsRead(id);
      } catch (err: any) {
        console.warn('[useMarkNotificationReadMutation] Server mark-read notice:', err?.message);
      }
    },
    onMutate: async (id: string) => {
      // Immediate local state update
      markAsRead(id);
      // Cancel queries to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      // Optimistically update React Query cache
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((item: NotificationItem) =>
          item.id === id ? { ...item, read: true } : item
        );
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async () => {
      try {
        await notificationService.markMyAllAsRead();
      } catch (err: any) {
        console.warn('[useMarkAllNotificationsReadMutation] Server mark-all notice:', err?.message);
      }
    },
    onMutate: async () => {
      // Immediate local state update
      markAllAsRead(user?.id, user?.role as any);
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      // Optimistically update React Query cache
      queryClient.setQueriesData({ queryKey: ['notifications'] }, (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((item: NotificationItem) => ({ ...item, read: true }));
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
