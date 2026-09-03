import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { healthService } from '@/services/healthService';
import { useHealthStore } from '@/store/useHealthStore';
import { MedicalRecord } from '@/types/index';

export function useHealthRecordsQuery(patientId: string) {
  const customRecords = useHealthStore((s) => s.records);

  return useQuery({
    queryKey: ['health-records', patientId, customRecords.length],
    queryFn: async () => {
      const fetched = await healthService.getMedicalRecords(patientId);
      const ids = new Set(fetched.map((r) => r.id));
      const custom = customRecords.filter((r) => !ids.has(r.id));
      return [...custom, ...fetched];
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
      type,
    }: {
      patientId: string;
      title: string;
      type: MedicalRecord['type'];
    }) => healthService.uploadAndProcessDocument(patientId, title, type),
    onSuccess: (result) => {
      addRecord(result.record);
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
    },
  });
}
