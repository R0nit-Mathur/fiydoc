import { useQuery } from '@tanstack/react-query';
import { DoctorFilters, doctorService } from '@/services/doctorService';
import { useLocationStore } from '@/store/useLocationStore';

export function useDoctorsQuery(filters?: DoctorFilters) {
  const latitude = useLocationStore((s) => s.latitude);
  const longitude = useLocationStore((s) => s.longitude);

  const mergedFilters: DoctorFilters = {
    lat: filters?.lat ?? (latitude ?? undefined),
    lng: filters?.lng ?? (longitude ?? undefined),
    ...filters,
  };

  return useQuery({
    queryKey: ['doctors', mergedFilters],
    queryFn: () => doctorService.getDoctors(mergedFilters),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useDoctorDetailQuery(id: string) {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorService.getDoctorById(id),
    enabled: Boolean(id),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
