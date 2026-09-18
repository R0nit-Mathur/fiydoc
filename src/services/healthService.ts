import { apiClient } from './apiClient';
import { MedicalRecord } from '@/types/index';

export const healthService = {
  async getMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
    return apiClient<MedicalRecord[]>(`/records/patient/${patientId}`);
  },

  async createRecord(payload: {
    patientId?: string;
    title: string;
    type?: string;
    documentUrl?: string;
    fileUrl?: string;
    summary?: string;
    notes?: string;
    tags?: string[];
    category?: string;
  }): Promise<MedicalRecord> {
    return apiClient<MedicalRecord>('/records', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async createPrescription(payload: {
    consultationId?: string;
    patientId?: string;
    doctorId?: string;
    diagnosis?: string;
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
    labTests?: any[];
    lifestyleInstructions?: string[];
    vitals?: any;
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
