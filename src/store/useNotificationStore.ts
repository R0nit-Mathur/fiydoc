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
  }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
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
  },
  {
    id: 'notif_rx_sample',
    title: 'Digital Prescription (Rx) Issued',
    message: 'Dr. Priya Sharma issued prescription #FYD-RX-84729 with 3 medications. Tap to review your dosage schedule.',
    time: '2 hours ago',
    timestamp: 'Today',
    read: false,
    type: 'prescription',
    link: '/(patient)/health',
  },
  {
    id: 'notif_apt_confirmed',
    title: 'Appointment Confirmed • Token #12',
    message: 'Your in-clinic visit with Dr. Priya Sharma at HeartCare Specialty Clinic is confirmed for today at 10:30 AM.',
    time: '4 hours ago',
    timestamp: 'Today',
    read: true,
    type: 'appointment',
    link: '/(patient)/appointments/apt_101',
  },
  {
    id: 'notif_lab_ready',
    title: 'OCR Lab Biomarkers Processed',
    message: 'Your Comprehensive Lipid Panel has been verified by FiYDoc OCR Engine with 98.4% clinical confidence.',
    time: 'Yesterday',
    timestamp: 'Yesterday',
    read: true,
    type: 'verification',
    link: '/(patient)/health',
  },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: initialNotifications,

      addNotification: (notif) =>
        set((state) => {
          const newNotif: NotificationItem = {
            id: notif.id || `notif_${Date.now()}`,
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

      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'fiydoc-notifications-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
