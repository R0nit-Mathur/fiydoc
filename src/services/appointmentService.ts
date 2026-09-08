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

function endTimeFor(startTime: string): string {
  const match = startTime.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return startTime;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem) {
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  const totalMinutes = (hours * 60 + minutes + 30) % (24 * 60);
  return `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
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
      body: JSON.stringify({
        patientId: input.patientId,
        doctorId: input.doctorId,
        date: input.date,
        startTime: input.time,
        endTime: endTimeFor(input.time),
        consultationType: input.mode === 'video' ? 'VIDEO' : 'CLINIC',
        fee: input.fee,
        symptoms: input.symptoms,
        notes: input.notes,
      }),
    });
  },

  cancelAppointment: async (id: string): Promise<void> => {
    await apiClient(`/appointments/${id}/cancel`, { method: 'POST' });
  },

  approveAppointment: async (id: string): Promise<Appointment> => {
    return apiClient<Appointment>(`/appointments/${id}/approve`, { method: 'POST' });
  },

  updateAppointmentStatus: async (id: string, status: string): Promise<Appointment> => {
    return apiClient<Appointment>(`/appointments/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },
};
