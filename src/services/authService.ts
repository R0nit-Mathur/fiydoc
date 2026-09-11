import { apiClient } from './apiClient';
import { DEFAULT_DOCTOR_AVATAR, DEFAULT_PATIENT_AVATAR } from '@/constants/theme';
import { calculateAgeFromDOB } from '@/utils/formatters';
import { useAuthStore } from '@/store/useAuthStore';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  authProvider?: 'database' | 'google';
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
  specialization?: string;
  qualification?: string;
  dob?: string;
  address?: string;
  age?: number | string;
  bloodGroup?: string;
  gender?: string;
  allergies?: string;
  chronicConditions?: string;
  emergencyContact?: string;
  consultationFee?: string | number;
}

export async function signOutAll(reason?: 'USER_ACTION' | 'SESSION_EXPIRED'): Promise<void> {
  if (Platform.OS !== 'web') {
    try {
      await WebBrowser.dismissAuthSession();
    } catch {}
  }
  await useAuthStore.getState().signOutAll(reason);
}

export const authService = {
  signOutAll,

  async loginWithEmail(email: string, password: string): Promise<UserSession> {
    try {
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

      const docVerificationStatus = doc?.verification?.status
        ? (doc.verification.status.toLowerCase() as UserSession['verificationStatus'])
        : (role === 'doctor' ? 'pending' : 'registered');

      return {
        id: response.user.id,
        name: pat?.fullName || doc?.fullName || 'User',
        email: response.user.email,
        role,
        authProvider: 'database',
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
        verificationStatus: role === 'doctor' ? docVerificationStatus : 'registered',
        specialization: doc?.specialization || doc?.specialty,
        specialty: doc?.specialization || doc?.specialty,
        clinicName: doc?.clinic?.name,
        clinicAddress: doc?.clinic?.address,
        licenseNumber: doc?.verification?.registrationNumber,
        registrationNumber: doc?.verification?.registrationNumber,
        consultationFee: doc?.consultationFee,
        accessToken: token,
      };
    } catch (err: any) {
      if (err?.message?.includes('Invalid') || err?.message?.includes('401')) {
        throw new Error('[Email/Password Auth] Invalid email or password. Please check your credentials and try again.');
      }
      throw new Error(`[Email/Password Auth] ${err?.message || 'Login failed.'}`);
    }
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
      qualifications?: string[] | string;
      experienceYears?: number;
      clinicName?: string;
      clinicAddress?: string;
      clinicLatitude?: number;
      clinicLongitude?: number;
      consultationFee?: number;
    }
  ): Promise<UserSession> {
    try {
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
      const pat = response.user.patient;
      const doc = response.user.doctor;
      const docVerificationStatus = doc?.verification?.status
        ? (doc.verification.status.toLowerCase() as UserSession['verificationStatus'])
        : (userRole === 'doctor' ? 'pending' : 'registered');

      return {
        id: response.user.id,
        name: pat?.fullName || doc?.fullName || fullName,
        email: response.user.email,
        role: userRole,
        authProvider: 'database',
        avatar: pat?.profilePhoto || doc?.profilePhoto || defaultAvatar,
        phone: response.user.phone || '',
        dob: pat?.dob,
        address: pat?.address,
        isLoggedIn: true,
        onboardingCompleted: true,
        verificationStatus: userRole === 'doctor' ? docVerificationStatus : 'registered',
        specialization: doc?.specialization || extraDoctorFields?.specialization,
        specialty: doc?.specialization || extraDoctorFields?.specialization,
        clinicName: doc?.clinic?.name || extraDoctorFields?.clinicName,
        clinicAddress: doc?.clinic?.address || extraDoctorFields?.clinicAddress,
        licenseNumber: doc?.verification?.registrationNumber || extraDoctorFields?.licenseNumber,
        registrationNumber: doc?.verification?.registrationNumber || extraDoctorFields?.licenseNumber,
        consultationFee: doc?.consultationFee || extraDoctorFields?.consultationFee,
        accessToken: token,
      };
    } catch (err: any) {
      if (err?.message?.includes('EMAIL_ALREADY_REGISTERED') || err?.message?.toLowerCase().includes('email is already registered')) {
        throw new Error('[Email/Password Auth] This email is already registered. Please sign in or use password recovery.');
      }
      if (err?.message?.includes('PHONE_ALREADY_REGISTERED') || err?.message?.toLowerCase().includes('phone number is already registered')) {
        throw new Error('[Email/Password Auth] This phone number is already registered. Please sign in with your phone.');
      }
      throw new Error(`[Email/Password Auth] ${err?.message || 'Registration failed.'}`);
    }
  },

  async loginWithGoogle(
    customEmail: string,
    customName: string,
    customGoogleId?: string,
    avatarUrl?: string,
    requestedRole?: 'patient' | 'doctor'
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
          ...(requestedRole ? { role: requestedRole.toUpperCase() } : {}),
        }),
      });

      const token = response.accessToken || response.access_token;
      const pat = response.user.patient;
      const doc = response.user.doctor;
      const hasDoctorProfile = Boolean(doc && (doc.specialization || doc.specialty || doc.id));
      const hasPatientProfile = Boolean(pat && (pat.gender || pat.dob || pat.address || pat.onboardingComplete));
      const isProfileConfigured = hasDoctorProfile || hasPatientProfile;

      const userRole = (response.user.role || (hasDoctorProfile ? 'DOCTOR' : 'PATIENT')).toLowerCase() as 'patient' | 'doctor' | 'admin';
      const defaultAvatar = userRole === 'doctor' ? DEFAULT_DOCTOR_AVATAR : DEFAULT_PATIENT_AVATAR;
      const calculatedAge = pat?.dob ? calculateAgeFromDOB(pat.dob) ?? undefined : undefined;

      const docVerificationStatus = doc?.verification?.status
        ? (doc.verification.status.toLowerCase() as UserSession['verificationStatus'])
        : (hasDoctorProfile ? 'pending' : 'registered');

      return {
        id: response.user.id,
        name: pat?.fullName || doc?.fullName || name,
        email: response.user.email,
        role: userRole,
        authProvider: 'google',
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
        verificationStatus: userRole === 'doctor' ? docVerificationStatus : 'registered',
        specialization: doc?.specialization || doc?.specialty,
        specialty: doc?.specialization || doc?.specialty,
        clinicName: doc?.clinic?.name,
        clinicAddress: doc?.clinic?.address,
        licenseNumber: doc?.verification?.registrationNumber,
        registrationNumber: doc?.verification?.registrationNumber,
        consultationFee: doc?.consultationFee,
        accessToken: token,
      };
    } catch (err: any) {
      console.error('[authService] Google login failed:', err);
      throw new Error(
        `[Google Sign-In] ${err?.message || 'Google authentication was not completed. Please try again.'}`
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
      throw new Error(`[Password Recovery] ${msg}`);
    }
  },
};
