import { apiClient } from './apiClient';
import { Doctor } from '@/types/index';

export interface DoctorFilters {
  query?: string;
  specialty?: string;
}

export const doctorService = {
  updateMyProfile: async (profile: {
    fullName?: string;
    specialization?: string;
    profilePhoto?: string | null;
    consultationFee?: number;
    clinicName?: string;
    clinicAddress?: string;
    clinicTimings?: string;
  }): Promise<Doctor> => apiClient<Doctor>('/doctors/me', {
    method: 'PATCH',
    body: JSON.stringify(profile),
  }),

  getDoctors: async (filters?: DoctorFilters): Promise<Doctor[]> => {
    const params = new URLSearchParams();
    if (filters?.query) params.append('q', filters.query);
    if (filters?.specialty && filters.specialty !== 'All') params.append('specialty', filters.specialty);

    // Discovery is server-authoritative. Do not hide a failed API call behind a
    // synthetic local doctor or an empty result; the screen can then retry and
    // every registered doctor returned by the database remains visible.
    return apiClient<Doctor[]>(`/doctors?${params.toString()}`);
  },

  getDoctorById: async (id: string): Promise<Doctor | undefined> => {
    return apiClient<Doctor>(`/doctors/${id}`);
  },

  getAvailableSlots: async (doctorId: string, date: string): Promise<string[]> => {
    const res = await apiClient<{ slots: string[] }>(`/doctors/${doctorId}/slots?date=${date}`);
    return res.slots || [];
  },
};
