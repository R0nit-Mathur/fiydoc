import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService, BookAppointmentInput } from '@/services/appointmentService';
import { useAppointmentStore } from '@/store/useAppointmentStore';

export function useAppointmentsQuery(patientId?: string, doctorId?: string) {
  const storeAppointments = useAppointmentStore((s) => s.appointments);

  return useQuery({
    queryKey: ['appointments', patientId, doctorId, storeAppointments.length],
    queryFn: async () => {
      const fetched = doctorId
        ? await appointmentService.getDoctorQueue(doctorId)
        : await appointmentService.getPatientAppointments(patientId || 'pat_1');
      // Combine store appointments with mock seed appointments
      const ids = new Set(fetched.map((a) => a.id));
      const custom = storeAppointments.filter((a) => !ids.has(a.id));
      return [...custom, ...fetched];
    },
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
