import { apiClient } from './apiClient';
import { Appointment } from '@/types/index';

export interface BookAppointmentInput {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  mode: 'video' | 'clinic';
  fee: number;
  symptoms?: string[];
  notes?: string;
  patientName?: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorAvatar?: string;
  hospital?: string;
  patientAvatar?: string;
}

export const appointmentService = {
  getPatientAppointments: async (patientId: string): Promise<Appointment[]> => {
    return apiClient<Appointment[]>(`/appointments/patient/${patientId}`);
  },

  getAppointments: async (patientId: string): Promise<Appointment[]> => {
    return appointmentService.getPatientAppointments(patientId);
  },

  getDoctorQueue: async (doctorId: string): Promise<Appointment[]> => {
    return apiClient<Appointment[]>(`/appointments/doctor/${doctorId}`);
  },

  getAppointmentById: async (id: string): Promise<Appointment | undefined> => {
    return apiClient<Appointment>(`/appointments/${id}`);
  },

  createAppointment: async (payload: Partial<Appointment>): Promise<Appointment> => {
    return apiClient<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  bookAppointment: async (input: BookAppointmentInput): Promise<Appointment> => {
    return apiClient<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  cancelAppointment: async (id: string): Promise<void> => {
    await apiClient(`/appointments/${id}/cancel`, { method: 'POST' });
  },
};
