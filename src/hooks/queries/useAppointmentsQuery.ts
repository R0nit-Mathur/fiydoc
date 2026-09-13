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

      // Combine store appointments with fetched appointments, filtering by effective user
      let relevantStoreAppointments = storeAppointments;
      if (effectiveDoctorId) {
        relevantStoreAppointments = storeAppointments.filter(
          (a) =>
            a.doctorId === effectiveDoctorId ||
            (currentUser?.name && a.doctorName?.toLowerCase() === currentUser.name.toLowerCase())
        );
      } else if (effectivePatientId) {
        relevantStoreAppointments = storeAppointments.filter(
          (a) =>
            a.patientId === effectivePatientId ||
            (currentUser?.name && a.patientName?.toLowerCase() === currentUser.name.toLowerCase())
        );
      }

      const ids = new Set(fetched.map((a) => a.id));
      const custom = relevantStoreAppointments.filter((a) => !ids.has(a.id));
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

export function useApproveAppointmentMutation() {
  const queryClient = useQueryClient();
  const updateAppointmentStatus = useAppointmentStore((s) => s.updateAppointmentStatus);

  return useMutation({
    mutationFn: async (id: string) => {
      return await appointmentService.approveAppointment(id);
    },
    onSuccess: (_, id) => {
      updateAppointmentStatus(id, 'confirmed');
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
    },
  });
}

export function useCancelAppointmentMutation() {
  const queryClient = useQueryClient();
  const cancelAppointment = useAppointmentStore((s) => s.cancelAppointment);

  return useMutation({
    mutationFn: async (id: string) => {
      return await appointmentService.cancelAppointment(id);
    },
    onSuccess: (_, id) => {
      cancelAppointment(id);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
    },
  });
}

export function useUpdateAppointmentStatusMutation() {
  const queryClient = useQueryClient();
  const updateAppointmentStatus = useAppointmentStore((s) => s.updateAppointmentStatus);

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: any }) => {
      return await appointmentService.updateAppointmentStatus(id, status);
    },
    onSuccess: (_, { id, status }) => {
      updateAppointmentStatus(id, status.toLowerCase());
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
    },
  });
}

