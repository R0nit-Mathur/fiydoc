import { apiClient } from './apiClient';

export interface UpdatePatientProfilePayload {
  email?: string;
  phone?: string;
  fullName?: string;
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  profilePhoto?: string;
  bloodGroup?: string;
  allergies?: string[];
  conditions?: string[];
  medications?: string[];
  address?: string;
  city?: string;
  emergencyContact?: any;
  onboardingComplete?: boolean;
}

export const patientService = {
  async getProfile(idOrUserId: string) {
    return apiClient.get<any>(`/patients/${idOrUserId}`);
  },

  async updateProfile(_idOrUserId: string, payload: UpdatePatientProfilePayload) {
    return apiClient.patch<any>('/patients/me/profile', payload);
  },
};
