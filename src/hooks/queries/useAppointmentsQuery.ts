import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService, BookAppointmentInput } from '@/services/appointmentService';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useAuthStore } from '@/store/useAuthStore';

export function useAppointmentsQuery(patientId?: string, doctorId?: string) {
  const storeAppointments = useAppointmentStore((s) => s.appointments);
  const currentUser = useAuthStore((s) => s.user);

  const effectivePatientId = patientId || (currentUser?.role === 'patient' ? currentUser.id : undefined);
  const effectiveDoctorId = doctorId || (currentUser?.role === 'doctor' ? currentUser.id : undefined);

  return useQuery({
    queryKey: ['appointments', effectivePatientId, effectiveDoctorId, storeAppointments.length],
    queryFn: async () => {
      let fetched: any[] = [];
      try {
        if (effectiveDoctorId) {
          fetched = await appointmentService.getDoctorQueue(effectiveDoctorId);
        } else if (effectivePatientId) {
          fetched = await appointmentService.getPatientAppointments(effectivePatientId);
        }
      } catch (err) {
        console.warn('[useAppointmentsQuery] Failed to fetch server appointments, using local state:', err);
      }

      // Combine store appointments with fetched appointments
      const ids = new Set(fetched.map((a) => a.id));
      const custom = storeAppointments.filter((a) => !ids.has(a.id));
      return [...custom, ...fetched];
    },
    enabled: Boolean(effectiveDoctorId || effectivePatientId),
  });
}

export function useAppointmentDetailQuery(id: string) {
  const storeAppointments = useAppointmentStore((s) => s.appointments);

  return useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const custom = storeAppointments.find((a) => a.id === id);
      if (custom) return custom;
      return appointmentService.getAppointmentById(id);
    },
    enabled: Boolean(id),
  });
}

export function useBookAppointmentMutation() {
  const queryClient = useQueryClient();
  const addAppointment = useAppointmentStore((s) => s.addAppointment);

  return useMutation({
    mutationFn: (input: BookAppointmentInput) => appointmentService.bookAppointment(input),
    onSuccess: (newApt) => {
      addAppointment(newApt);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
