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

export function useUploadDocumentMutation() {
  const queryClient = useQueryClient();
  const addRecord = useHealthStore((s) => s.addRecord);

  return useMutation({
    mutationFn: ({
      patientId,
      title,
      documentUrl,
      summary,
      tags,
    }: {
      patientId: string;
      title: string;
      documentUrl: string;
      summary?: string;
      tags?: string[];
    }) => healthService.uploadRecord({ patientId, title, documentUrl, summary, tags }),
    onSuccess: (record) => {
      addRecord(record);
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
    },
  });
}
