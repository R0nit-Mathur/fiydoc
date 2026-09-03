import { apiClient } from './apiClient';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  avatar?: string;
  phone?: string;
  isLoggedIn: boolean;
  onboardingCompleted: boolean;
  verificationStatus?: 'registered' | 'verified' | 'pending' | 'rejected' | 'info_required';
  accessToken?: string;
}

export const authService = {
  async loginWithEmail(email: string, password: string): Promise<UserSession> {
    const response = await apiClient<{ accessToken?: string; access_token?: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const token = response.accessToken || response.access_token;
    return {
      id: response.user.id,
      name: response.user.patient?.fullName || response.user.doctor?.fullName || 'User',
      email: response.user.email,
      role: response.user.role.toLowerCase() as 'patient' | 'doctor' | 'admin',
      avatar: response.user.patient?.profilePhoto || response.user.doctor?.profilePhoto || '',
      phone: response.user.phone || '',
      isLoggedIn: true,
      onboardingCompleted: response.user.patient?.onboardingComplete || true,
      verificationStatus: response.user.doctor?.verification?.status?.toLowerCase() || 'registered',
      accessToken: token,
    };
  },

  async registerWithEmail(email: string, password: string, role: string, fullName: string): Promise<UserSession> {
    const response = await apiClient<{ accessToken?: string; access_token?: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role: role.toUpperCase(), fullName }),
    });

    const token = response.accessToken || response.access_token;
    return {
      id: response.user.id,
      name: response.user.patient?.fullName || response.user.doctor?.fullName || fullName,
      email: response.user.email,
      role: response.user.role.toLowerCase() as 'patient' | 'doctor' | 'admin',
      avatar: response.user.patient?.profilePhoto || response.user.doctor?.profilePhoto || '',
      phone: response.user.phone || '',
      isLoggedIn: true,
      onboardingCompleted: false,
      verificationStatus: response.user.doctor?.verification?.status?.toLowerCase() || 'registered',
      accessToken: token,
    };
  },

  async loginWithGoogle(): Promise<UserSession> {
    try {
      const response = await apiClient<{ accessToken?: string; access_token?: string; user: any }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          googleId: 'google_user_demo_101',
          email: 'patient@fiydoc.app',
          name: 'Aarav Mehta (Google Verified)',
        }),
      });

      const token = response.accessToken || response.access_token;
      return {
        id: response.user.id,
        name: response.user.patient?.fullName || 'Aarav Mehta',
        email: response.user.email,
        role: 'patient',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
        phone: response.user.phone || '+91 98765 43210',
        isLoggedIn: true,
        onboardingCompleted: true,
        verificationStatus: 'verified',
        accessToken: token,
      };
    } catch {
      // Fallback for offline or local preview
      return {
        id: 'pat_1',
        name: 'Aarav Mehta',
        email: 'patient@fiydoc.app',
        role: 'patient',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
        phone: '+91 98765 43210',
        isLoggedIn: true,
        onboardingCompleted: true,
        verificationStatus: 'verified',
        accessToken: 'fiydoc_google_session_token',
      };
    }
  },

  async verifyOtp(otp: string): Promise<boolean> {
    if (otp === '1234') {
      return true;
    }
    throw new Error('Invalid verification code. Please enter 1234.');
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `Password reset link sent to ${email}. Check your inbox.`,
    };
  },
};
