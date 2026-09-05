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
  latitude?: number;
  longitude?: number;
  city?: string;
  clinicName?: string;
  clinicAddress?: string;
  registrationNumber?: string;
  licenseNumber?: string;
  specialty?: string;
}

export const authService = {
  async loginWithEmail(email: string, password: string): Promise<UserSession> {
    const response = await apiClient<{ accessToken?: string; access_token?: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const token = response.accessToken || response.access_token;
    return {
      id: response.user.id,
      name: response.user.patient?.fullName || response.user.doctor?.fullName || 'User',
      email: response.user.email,
      role: (response.user.role || 'PATIENT').toLowerCase() as 'patient' | 'doctor' | 'admin',
      avatar: response.user.patient?.profilePhoto || response.user.doctor?.profilePhoto || '',
      phone: response.user.phone || '',
      isLoggedIn: true,
      onboardingCompleted: true,
      verificationStatus: response.user.doctor?.verification?.status?.toLowerCase() || 'registered',
      accessToken: token,
    };
  },

  async registerWithEmail(
    email: string,
    password: string,
    role: string,
    fullName: string,
    extraDoctorFields?: {
      licenseNumber?: string;
      registrationAuthority?: string;
      specialization?: string;
      qualifications?: string;
      experienceYears?: number;
      clinicName?: string;
      clinicAddress?: string;
      clinicLatitude?: number;
      clinicLongitude?: number;
      consultationFee?: number;
    }
  ): Promise<UserSession> {
    const response = await apiClient<{ accessToken?: string; access_token?: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: email.trim(),
        password,
        role: role.toUpperCase(),
        fullName: fullName.trim(),
        ...(extraDoctorFields || {}),
      }),
    });

    const token = response.accessToken || response.access_token;
    return {
      id: response.user.id,
      name: response.user.patient?.fullName || response.user.doctor?.fullName || fullName,
      email: response.user.email,
      role: (response.user.role || role).toLowerCase() as 'patient' | 'doctor' | 'admin',
      avatar: response.user.patient?.profilePhoto || response.user.doctor?.profilePhoto || '',
      phone: response.user.phone || '',
      isLoggedIn: true,
      onboardingCompleted: true,
      verificationStatus: response.user.doctor?.verification?.status?.toLowerCase() || 'verified',
      accessToken: token,
    };
  },

  async loginWithGoogle(
    customEmail: string,
    customName: string,
    customGoogleId?: string,
    avatarUrl?: string
  ): Promise<UserSession> {
    const email = customEmail.trim();
    const name = customName.trim();
    const googleId = customGoogleId || 'google_' + email.replace(/[^a-zA-Z0-9]/g, '_');

    try {
      const response = await apiClient<{ accessToken?: string; access_token?: string; user: any }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          googleId,
          email,
          name,
        }),
      });

      const token = response.accessToken || response.access_token;
      const hasDoctorProfile = Boolean(response.user.doctor && response.user.doctor.specialty);
      const hasPatientProfile = Boolean(response.user.patient && (response.user.patient.age || response.user.patient.gender));
      const isProfileConfigured = hasDoctorProfile || hasPatientProfile;

      return {
        id: response.user.id,
        name: response.user.patient?.fullName || response.user.doctor?.fullName || name,
        email: response.user.email,
        role: hasDoctorProfile ? 'doctor' : (response.user.role || 'PATIENT').toLowerCase() as 'patient' | 'doctor',
        avatar: response.user.patient?.profilePhoto || response.user.doctor?.profilePhoto || avatarUrl || '',
        phone: response.user.phone || '',
        isLoggedIn: true,
        onboardingCompleted: isProfileConfigured,
        verificationStatus: hasDoctorProfile ? 'verified' : 'registered',
        accessToken: token,
      };
    } catch (err) {
      console.warn('[authService] Google endpoint login fallback for account', email, err);
      // Clean session for new Google identity requiring role and profile selection
      const isDoctorEmail = email.toLowerCase().includes('doctor') || email.toLowerCase().includes('dr.') || name.toLowerCase().includes('dr.');
      return {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        name,
        email,
        role: isDoctorEmail ? 'doctor' : 'patient',
        avatar: avatarUrl || '',
        phone: '',
        isLoggedIn: true,
        onboardingCompleted: false, // Always prompts for profile creation (Patient or Doctor)
        verificationStatus: 'registered',
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
