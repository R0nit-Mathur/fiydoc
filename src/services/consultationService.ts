import { apiClient } from './apiClient';

export interface ConsultationRecord {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  chiefComplaint: string | null;
  symptoms: string[];
  observations: string | null;
  assessment: string | null;
  clinicalNotes: any[];
  followUpDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

export const consultationService = {
  /**
   * Upsert a consultation record for an appointment.
   * Pass completeNow=true to finalize it, which transitions the appointment to COMPLETED.
   * The server returns the created/updated consultation, including the real `id`.
   */
  async upsert(dto: {
    appointmentId: string;
    chiefComplaint?: string;
    symptoms?: string[];
    observations?: string;
    assessment?: string;
    clinicalNotes?: any[];
    followUpDate?: string;
    completeNow?: boolean;
  }): Promise<ConsultationRecord> {
    return apiClient<ConsultationRecord>('/consultations', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  /**
   * Retrieve the consultation record for a specific appointment.
   */
  async getByAppointmentId(appointmentId: string): Promise<ConsultationRecord | null> {
    try {
      return await apiClient<ConsultationRecord>(`/consultations/appointment/${appointmentId}`);
    } catch {
      return null;
    }
  },
};
