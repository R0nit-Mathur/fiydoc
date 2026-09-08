import { apiClient } from './apiClient';

export interface UpdatePatientProfilePayload {
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

  async updateProfile(idOrUserId: string, payload: UpdatePatientProfilePayload) {
    return apiClient.patch<any>(`/patients/${idOrUserId}`, payload);
  },
};
