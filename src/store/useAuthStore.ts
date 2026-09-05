import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSession } from '@/services/authService';

interface AuthState {
  user: UserSession | null;
  role: 'patient' | 'doctor' | 'admin';
  isAuthenticated: boolean;
  onboardingCompleted: boolean;
  verificationStatus: 'registered' | 'pending' | 'verified' | 'rejected' | 'info_required';

  // Actions
  setSession: (session: UserSession) => void;
  setRole: (role: 'patient' | 'doctor' | 'admin') => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setVerificationStatus: (status: 'registered' | 'pending' | 'verified' | 'rejected' | 'info_required') => void;
  updateUser: (fields: Partial<UserSession>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      role: 'patient',
      isAuthenticated: false,
      onboardingCompleted: false,
      verificationStatus: 'registered',

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

      logout: () =>
        set({
          user: null,
          role: 'patient',
          isAuthenticated: false,
          onboardingCompleted: false,
          verificationStatus: 'registered',
        }),
    }),
    {
      name: 'fiydoc-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
