import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { healthService } from '@/services/healthService';
import { useHealthStore } from '@/store/useHealthStore';
import { MedicalRecord } from '@/types/index';

export function useHealthRecordsQuery(patientId: string) {
  return useQuery({
    queryKey: ['health-records', patientId],
    queryFn: async () => {
      return healthService.getMedicalRecords(patientId);
    },
  });
}

