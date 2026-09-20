import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationItem } from '@/types/index';

interface NotificationState {
  notifications: NotificationItem[];
  addNotification: (notification: {
    title: string;
    message: string;
    type: string;
    link?: string;
    read?: boolean;
    id?: string;
    time?: string;
    recipientId?: string;
    recipientRole?: 'patient' | 'doctor' | 'all';
    isAlert?: boolean;
    silent?: boolean;
  }) => void;
  syncServerNotifications: (items: NotificationItem[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (userId?: string, role?: 'patient' | 'doctor') => void;
  clearNotifications: () => void;
  reset: () => void;
  getNotificationsForUser: (userId?: string, role?: 'patient' | 'doctor') => NotificationItem[];
  getUnreadCount: (userId?: string, role?: 'patient' | 'doctor') => number;
}

// Critical clinical notification types that warrant an OS push banner popup
const CRITICAL_NOTIFICATION_TYPES = new Set([
  'appointment',
  'appointment_confirmed',
  'appointment_cancelled',
  'appointment_rescheduled',
  'slot_rescheduled',
  'schedule_delay',
  'schedule_leave',
  'arrival_confirmed',
  'prescription_issued',
  'emergency',
]);

// No pre-seeded notifications. All notifications are pushed dynamically by real events.
const initialNotifications: NotificationItem[] = [];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: initialNotifications,

      addNotification: (notif) => {
        const typeNorm = (notif.type || '').toLowerCase();
        const shouldShowBanner =
          !notif.silent &&
          (notif.isAlert === true || CRITICAL_NOTIFICATION_TYPES.has(typeNorm));

        if (Platform.OS !== 'web' && shouldShowBanner) {
          Notifications.scheduleNotificationAsync({
            content: {
              title: notif.title,
              body: notif.message,
              sound: 'default',
              data: { type: notif.type, link: notif.link, recipientId: notif.recipientId },
            },
            trigger: null,
          }).catch((err) => {
            console.warn('[useNotificationStore] Local push banner notice:', err?.message);
          });
        }

        set((state) => {
          const newNotif: NotificationItem = {
            id: notif.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            recipientId: notif.recipientId,
            recipientRole: notif.recipientRole || 'all',
            title: notif.title,
            message: notif.message,
            time: notif.time || 'Just now',
            timestamp: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            read: notif.read ?? false,
            type: notif.type,
            link: notif.link,
          };
          // Deduplicate by ID
          const existing = state.notifications.filter((n) => n.id !== newNotif.id);
          return { notifications: [newNotif, ...existing] };
        });
      },

      syncServerNotifications: (items: NotificationItem[]) => {
        if (!Array.isArray(items) || items.length === 0) return;
        set((state) => {
          const existingMap = new Map(state.notifications.map((n) => [n.id, n]));
          for (const item of items) {
            existingMap.set(item.id, {
              ...item,
              read: existingMap.get(item.id)?.read ?? item.read ?? false,
            });
          }
          return { notifications: Array.from(existingMap.values()) };
        });
      },

      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),

      markAllAsRead: (userId, role) =>
        set((state) => ({
          notifications: state.notifications.map((n) => {
            const matchesUser = !userId || !n.recipientId || n.recipientId === userId;
            const matchesRole = !role || !n.recipientRole || n.recipientRole === 'all' || n.recipientRole === role;
            return matchesUser && matchesRole ? { ...n, read: true } : n;
          }),
        })),

      clearNotifications: () => set({ notifications: [] }),
      reset: () => set({ notifications: [] }),

      getNotificationsForUser: (userId, role) => {
        const state = get();
        return state.notifications.filter((n) => {
          // If notification has a specific recipientId, it must match
          if (n.recipientId && userId && n.recipientId !== userId) {
            return false;
          }
          // If notification has a specific recipientRole, it must match
          if (n.recipientRole && n.recipientRole !== 'all' && role && n.recipientRole !== role) {
            return false;
          }
          return true;
        });
      },

      getUnreadCount: (userId, role) => {
        const userNotifs = get().getNotificationsForUser(userId, role);
        return userNotifs.filter((n) => !n.read).length;
      },
    }),
    {
      name: 'fiydoc-notifications-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

