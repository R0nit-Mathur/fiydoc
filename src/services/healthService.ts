import { apiClient } from './apiClient';
import { MedicalRecord } from '@/types/index';

export const healthService = {
  async getMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
    return apiClient<MedicalRecord[]>(`/records/patient/${patientId}`);
  },

  async createPrescription(payload: {

    consultationId?: string;
    patientId?: string;
    doctorId?: string;
    doctorNotes?: string;
    followUpInstructions?: string;
    medicines?: Array<{
      name: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      instructions?: string;
    }>;
    tests?: Array<{
      name: string;
      category?: string;
    }>;
  }): Promise<any> {
    return apiClient<any>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getPrescriptions(patientId: string): Promise<any[]> {
    return apiClient<any[]>(`/prescriptions/patient/${patientId}`);
  },
};
