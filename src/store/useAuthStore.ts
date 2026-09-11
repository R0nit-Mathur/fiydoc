import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSession } from '@/services/authService';
import { useAppointmentStore } from './useAppointmentStore';
import { useHealthStore } from './useHealthStore';
import { useNotificationStore } from './useNotificationStore';

interface AuthState {
  user: UserSession | null;
  role: 'patient' | 'doctor' | 'admin';
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  verificationStatus: 'registered' | 'pending' | 'verified' | 'rejected' | 'info_required';
  hasHydrated: boolean;

  // Actions
  setSession: (session: UserSession) => void;
  setRole: (role: 'patient' | 'doctor' | 'admin') => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setVerificationStatus: (status: 'registered' | 'pending' | 'verified' | 'rejected' | 'info_required') => void;
  setHasHydrated: (hydrated: boolean) => void;
  updateUser: (fields: Partial<UserSession>) => void;
  logout: () => void;
  signOutAll: (reason?: 'USER_ACTION' | 'SESSION_EXPIRED') => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: 'patient',
      isAuthenticated: false,
      onboardingCompleted: false,
      verificationStatus: 'registered',
      hasHydrated: false,

      setSession: (session) =>
        set({
          user: session,
          role: session.role,
          isAuthenticated: true,
          onboardingCompleted: session.onboardingCompleted,
          verificationStatus: session.verificationStatus || 'registered',
        }),

      updateUser: (fields) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...fields } : null,
        })),

      setRole: (role) =>
        set((state) => ({
          role,
          user: state.user ? { ...state.user, role } : null,
        })),

      setOnboardingCompleted: (completed) =>
        set((state) => ({
          onboardingCompleted: completed,
          user: state.user ? { ...state.user, onboardingCompleted: completed } : null,
        })),

      setVerificationStatus: (verificationStatus) =>
        set((state) => ({
          verificationStatus,
          user: state.user ? { ...state.user, verificationStatus } : null,
        })),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      logout: () => {
        set({
          user: null,
          role: 'patient',
          isAuthenticated: false,
          onboardingCompleted: false,
          verificationStatus: 'registered',
        });
        useAppointmentStore.getState().reset();
        useHealthStore.getState().reset();
        useNotificationStore.getState().reset();
        AsyncStorage.multiRemove([
          'fiydoc-auth-storage',
          'fiydoc-appointment-storage-v2',
          'fiydoc-health-storage-v5',
          'fiydoc-notifications-storage-v2',
        ]).catch((err) => console.warn('[useAuthStore] multiRemove error:', err));
      },

      signOutAll: async (reason?: 'USER_ACTION' | 'SESSION_EXPIRED') => {
        set({
          user: null,
          role: 'patient',
          isAuthenticated: false,
          onboardingCompleted: false,
          verificationStatus: 'registered',
        });
        useAppointmentStore.getState().reset();
        useHealthStore.getState().reset();
        useNotificationStore.getState().reset();
        try {
          await AsyncStorage.multiRemove([
            'fiydoc-auth-storage',
            'fiydoc-appointment-storage-v2',
            'fiydoc-health-storage-v5',
            'fiydoc-notifications-storage-v2',
          ]);
        } catch (err) {
          console.warn('[useAuthStore] signOutAll multiRemove error:', err);
        }
      },
    }),
    {
      name: 'fiydoc-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
