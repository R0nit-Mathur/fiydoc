import { apiClient } from './apiClient';
import { DEFAULT_DOCTOR_AVATAR, DEFAULT_PATIENT_AVATAR } from '@/constants/theme';
import { calculateAgeFromDOB } from '@/utils/formatters';

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
  dob?: string;
  address?: string;
  age?: number | string;
  bloodGroup?: string;
  gender?: string;
  allergies?: string;
  chronicConditions?: string;
  emergencyContact?: string;
}

export const authService = {
  async loginWithEmail(email: string, password: string): Promise<UserSession> {
    const response = await apiClient<{ accessToken?: string; access_token?: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const token = response.accessToken || response.access_token;
    const role = (response.user.role || 'PATIENT').toLowerCase() as 'patient' | 'doctor' | 'admin';
    const defaultAvatar = role === 'doctor' ? DEFAULT_DOCTOR_AVATAR : DEFAULT_PATIENT_AVATAR;
    const pat = response.user.patient;
    const doc = response.user.doctor;
    const calculatedAge = pat?.dob ? calculateAgeFromDOB(pat.dob) ?? undefined : undefined;

    return {
      id: response.user.id,
      name: pat?.fullName || doc?.fullName || 'User',
      email: response.user.email,
      role,
      avatar: pat?.profilePhoto || doc?.profilePhoto || defaultAvatar,
      phone: response.user.phone || '',
      dob: pat?.dob,
      address: pat?.address,
      age: calculatedAge,
      bloodGroup: pat?.bloodGroup,
      gender: pat?.gender,
      allergies: Array.isArray(pat?.allergies) ? pat.allergies.join(', ') : pat?.allergies,
      isLoggedIn: true,
      onboardingCompleted: true,
      verificationStatus: doc?.verification?.status?.toLowerCase() || 'registered',
      accessToken: token,
    };
  },

  async registerWithEmail(
    email: string,
    password: string,
    role: string,
    fullName: string,
    phone?: string,
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
        ...(phone?.trim() ? { phone: phone.trim() } : {}),
        ...(extraDoctorFields || {}),
      }),
    });

    const token = response.accessToken || response.access_token;
    const userRole = (response.user.role || role).toLowerCase() as 'patient' | 'doctor' | 'admin';
    const defaultAvatar = userRole === 'doctor' ? DEFAULT_DOCTOR_AVATAR : DEFAULT_PATIENT_AVATAR;
    return {
      id: response.user.id,
      name: response.user.patient?.fullName || response.user.doctor?.fullName || fullName,
      email: response.user.email,
      role: userRole,
      avatar: response.user.patient?.profilePhoto || response.user.doctor?.profilePhoto || defaultAvatar,
      phone: response.user.phone || '',
      dob: response.user.patient?.dob,
      address: response.user.patient?.address,
      isLoggedIn: true,
      onboardingCompleted: true,
      verificationStatus: response.user.doctor?.verification?.status?.toLowerCase() || 'pending',
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
      const hasPatientProfile = Boolean(response.user.patient && (response.user.patient.age || response.user.patient.gender || response.user.patient.dob));
      const isProfileConfigured = hasDoctorProfile || hasPatientProfile;

      const userRole = hasDoctorProfile ? 'doctor' : (response.user.role || 'PATIENT').toLowerCase() as 'patient' | 'doctor';
      const defaultAvatar = userRole === 'doctor' ? DEFAULT_DOCTOR_AVATAR : DEFAULT_PATIENT_AVATAR;
      const pat = response.user.patient;
      const doc = response.user.doctor;
      const calculatedAge = pat?.dob ? calculateAgeFromDOB(pat.dob) ?? undefined : undefined;

      return {
        id: response.user.id,
        name: pat?.fullName || doc?.fullName || name,
        email: response.user.email,
        role: userRole,
        avatar: pat?.profilePhoto || doc?.profilePhoto || avatarUrl || defaultAvatar,
        phone: response.user.phone || '',
        dob: pat?.dob,
        address: pat?.address,
        age: calculatedAge,
        bloodGroup: pat?.bloodGroup,
        gender: pat?.gender,
        allergies: Array.isArray(pat?.allergies) ? pat.allergies.join(', ') : pat?.allergies,
        isLoggedIn: true,
        onboardingCompleted: isProfileConfigured,
        verificationStatus: hasDoctorProfile ? 'verified' : 'registered',
        accessToken: token,
      };
    } catch (err: any) {
      console.error('[authService] Google login failed:', err);
      throw new Error(
        err?.message || 'Google authentication was not completed. Please try again.'
      );
    }
  },

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await apiClient.post<{ success: boolean; message: string }>('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
      return {
        success: true,
        message: res.message || `Password recovery link dispatched to ${email}. Check your inbox.`,
      };
    } catch (err: any) {
      const msg = err?.message || 'Failed to send password recovery link. Please verify your email and try again.';
      throw new Error(msg);
    }
  },
};
