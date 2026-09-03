import { apiClient } from './apiClient';
import { Doctor } from '@/types/index';

export interface DoctorFilters {
  query?: string;
  specialty?: string;
}

export const doctorService = {
  getDoctors: async (filters?: DoctorFilters): Promise<Doctor[]> => {
    const params = new URLSearchParams();
    if (filters?.query) params.append('q', filters.query);
    if (filters?.specialty && filters.specialty !== 'All') params.append('specialty', filters.specialty);

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
