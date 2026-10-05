import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useHealthStore } from '@/store/useHealthStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Prescription } from '@/types/index';
import { mapPrescription } from '@/utils/prescriptionMapper';

export function usePrescriptionsQuery(patientId?: string) {
  const { user } = useAuthStore();
  const setPrescriptions = useHealthStore((s) => s.setPrescriptions);

  const effectivePatientId = patientId || (user?.role === 'patient' ? user.id : 'me');

  return useQuery<Prescription[]>({
    queryKey: ['prescriptions', user?.id, user?.role, effectivePatientId],
    enabled: Boolean(user?.id),
    queryFn: async ({ signal }) => {
      const isCurrentAccount = () => {
        const currentUser = useAuthStore.getState().user;
        return !signal.aborted && Boolean(user?.id) && currentUser?.id === user?.id
          && currentUser?.role === user?.role && currentUser?.accessToken === user?.accessToken;
      };
      if (!isCurrentAccount()) throw new Error('Prescription request cancelled.');
      // Consume React Query's cancellation signal so old account/target requests
      // cannot repopulate the shared store after their observer is removed.
      const rawList = await apiClient<unknown>(`/prescriptions/patient/${encodeURIComponent(effectivePatientId)}`, { signal });
      if (!isCurrentAccount()) throw new Error('Prescription request cancelled.');
      if (!Array.isArray(rawList)) throw new Error('Invalid prescription list response.');
      const mapped = rawList.map(mapPrescription);
      setPrescriptions(mapped);
      return mapped;
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}
