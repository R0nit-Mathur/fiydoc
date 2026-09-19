import { apiClient } from './apiClient';
import { Doctor } from '@/types/index';

export interface DoctorFilters {
  query?: string;
  specialty?: string;
  lat?: number;
  lng?: number;
}

export interface SlotDetails {
  slots: string[];
  allGeneratedSlots?: string[];
  breaks?: { id: string; title: string; startTime: string; endTime: string }[];
  slotDurationMinutes?: number;
  patientsPerSlot?: number;
  delayMinutes?: number;
  delayReason?: string | null;
  isOnLeave?: boolean;
  leaveReason?: string | null;
}

export const doctorService = {
  getMyProfile: async (): Promise<any> => apiClient<any>('/doctors/me'),

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

  updateMyAvailability: async (availabilities: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    slotDurationMinutes?: number;
  }[]): Promise<{ count: number }> => apiClient<{ count: number }>('/doctors/me/availability', {
    method: 'PATCH',
    body: JSON.stringify({ availabilities }),
  }),

  getDoctors: async (filters?: DoctorFilters): Promise<Doctor[]> => {
    const params = new URLSearchParams();
    if (filters?.query) params.append('q', filters.query);
    if (filters?.specialty && filters.specialty !== 'All') params.append('specialty', filters.specialty);
    if (filters?.lat != null) params.append('lat', String(filters.lat));
    if (filters?.lng != null) params.append('lng', String(filters.lng));

    // Discovery is server-authoritative. Do not hide a failed API call behind a
    // synthetic local doctor or an empty result; the screen can then retry and
    // every registered doctor returned by the database remains visible.
    return apiClient<Doctor[]>(`/doctors?${params.toString()}`);
  },

  getDoctorById: async (id: string): Promise<Doctor | undefined> => {
    return apiClient<Doctor>(`/doctors/${id}`);
  },

  getAvailableSlots: async (doctorId: string, date: string): Promise<string[]> => {
    const res = await apiClient<SlotDetails>(`/doctors/${doctorId}/slots?date=${date}`);
    return res.slots || [];
  },

  getAvailableSlotsDetailed: async (doctorId: string, date: string): Promise<SlotDetails> => {
    const res = await apiClient<SlotDetails>(`/doctors/${doctorId}/slots?date=${date}`);
    return {
      slots: res.slots || [],
      allGeneratedSlots: res.allGeneratedSlots || res.slots || [],
      slotDurationMinutes: res.slotDurationMinutes || 15,
      patientsPerSlot: res.patientsPerSlot || 1,
      delayMinutes: res.delayMinutes || 0,
      delayReason: res.delayReason || null,
      isOnLeave: Boolean(res.isOnLeave),
      leaveReason: res.leaveReason || null,
    };
  },

  applyScheduleDelay: async (payload: { doctorId?: string; date: string; delayMinutes: number; reason?: string }) => {
    return apiClient<{ success: boolean; delayMinutes: number; reason?: string }>('/doctors/schedule/delay', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  applyScheduleLeave: async (payload: { doctorId?: string; date?: string; startDate?: string; endDate?: string; reason?: string }) => {
    return apiClient<{ success: boolean; isOnLeave: boolean; reason?: string; affectedDates?: string[] }>('/doctors/schedule/leave', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  undoScheduleOverride: async (payload: { doctorId?: string; date: string; action: 'delay' | 'leave' }) => {
    return apiClient<{ success: boolean; action: string; reverted: boolean }>('/doctors/schedule/undo', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getScheduleStatus: async (doctorId: string, date?: string): Promise<SlotDetails> => {
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const d = date || localDate;
    return apiClient<SlotDetails>(`/doctors/${doctorId}/schedule/status?date=${d}`);
  },

  getScheduleWeek: async (
    doctorId: string,
    startDate?: string,
    endDate?: string
  ): Promise<Record<string, SlotDetails>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiClient<Record<string, SlotDetails>>(`/doctors/${doctorId}/schedule/week${qs}`);
  },

  manageCustomSlot: async (data: {
    doctorId?: string;
    date: string;
    time: string;
    action: 'add' | 'remove' | 'block';
  }): Promise<SlotDetails> => {
    return apiClient<SlotDetails>('/doctors/schedule/custom-slot', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateScheduleSettings: async (data: {
    doctorId?: string;
    date?: string;
    slotDurationMinutes?: number;
    patientsPerSlot?: number;
    morningStart?: string;
    morningEnd?: string;
    eveningStart?: string;
    eveningEnd?: string;
  }): Promise<any> => {
    return apiClient('/doctors/schedule/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  manageBreak: async (data: {
    doctorId?: string;
    date: string;
    break?: { id?: string; title?: string; startTime?: string; endTime?: string };
    breakId?: string;
    action: 'add' | 'remove';
  }): Promise<SlotDetails> => {
    return apiClient<SlotDetails>('/doctors/schedule/break', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPatientPastConsultations: async (patientId: string): Promise<any[]> => {
    return apiClient<any[]>(`/doctors/patient/${patientId}/consultations`);
  },

  applyEarlyDeparture: async (data: {
    doctorId?: string;
    date: string;
    cutoffTime: string;
    reason?: string;
  }): Promise<any> => {
    return apiClient('/doctors/schedule/early-departure', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};


