import { apiClient } from './apiClient';
import { MedicalRecord } from '@/types/index';

export interface OCRResult {
  record: MedicalRecord;
  confidence: number;
  extractedFields: Record<string, string>;
}

export const healthService = {
  async getMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
    return apiClient<MedicalRecord[]>(`/records/patient/${patientId}`);
  },

  async uploadAndProcessDocument(patientId: string, title: string, type: MedicalRecord['type']): Promise<OCRResult> {
    // This endpoint should handle document uploading and OCR processing via backend.
    // For now, we simulate sending a POST request to backend with form data if it were a real file.
    // Since we don't have real files uploaded yet in the UI, we just send a mock payload.
    return apiClient<OCRResult>('/records/process', {
      method: 'POST',
      body: JSON.stringify({ patientId, title, type }),
    });
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
