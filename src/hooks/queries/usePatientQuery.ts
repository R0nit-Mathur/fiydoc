import { useQuery } from '@tanstack/react-query';
import { patientService } from '@/services/patientService';
import type { PatientProfile } from '@/types';

export function usePatientProfileQuery(patientId: string | undefined) {
  return useQuery<PatientProfile | null>({
    queryKey: ['patient-profile', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      // Preserve a real error so the profile can distinguish unavailable data
      // from a successfully loaded profile with no optional fields.
      return patientService.getProfile(patientId);
    },
    enabled: Boolean(patientId),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}
