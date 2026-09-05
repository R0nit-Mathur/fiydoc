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
  }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (userId?: string, role?: 'patient' | 'doctor') => void;
  clearNotifications: () => void;
  getNotificationsForUser: (userId?: string, role?: 'patient' | 'doctor') => NotificationItem[];
  getUnreadCount: (userId?: string, role?: 'patient' | 'doctor') => number;
}

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif_welcome',
    title: 'Welcome to FiYDoc Health Network',
    message: 'Your unified healthcare profile is active. Book consultations and access verified medical records anytime.',
    time: 'Just now',
    timestamp: 'Today',
    read: false,
    type: 'system',
    recipientRole: 'all',
  },
  {
    id: 'notif_system_security',
    title: 'ABDM Medical Standards Connected',
    message: 'All clinical interactions are secured with 256-bit HIPAA and Ayushman Bharat Digital Mission compliance.',
    time: '1 hour ago',
    timestamp: 'Today',
    read: true,
    type: 'verification',
    recipientRole: 'all',
  },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: initialNotifications,

      addNotification: (notif) =>
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
          return { notifications: [newNotif, ...state.notifications] };
        }),

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

