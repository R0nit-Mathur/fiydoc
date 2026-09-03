import { useQuery } from '@tanstack/react-query';
import { DoctorFilters, doctorService } from '@/services/doctorService';

export function useDoctorsQuery(filters?: DoctorFilters) {
  return useQuery({
    queryKey: ['doctors', filters],
    queryFn: () => doctorService.getDoctors(filters),
  });
}

export function useDoctorDetailQuery(id: string) {
  return useQuery({
    queryKey: ['doctor', id],
    queryFn: () => doctorService.getDoctorById(id),
    enabled: Boolean(id),
  });
}
