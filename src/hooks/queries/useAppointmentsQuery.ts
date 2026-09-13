import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentService, BookAppointmentInput } from '@/services/appointmentService';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useAuthStore } from '@/store/useAuthStore';

export function useAppointmentsQuery(patientId?: string, doctorId?: string) {
  const storeAppointments = useAppointmentStore((s) => s.appointments);
  const currentUser = useAuthStore((s) => s.user);

  const effectivePatientId = patientId || (currentUser?.role === 'patient' ? currentUser.id : undefined);
  const effectiveDoctorId = doctorId || (currentUser?.role === 'doctor' ? currentUser.id : undefined);

  const storeSignature = storeAppointments.map((a) => `${a.id}:${a.status}`).join(',');

  return useQuery({
    queryKey: ['appointments', effectivePatientId, effectiveDoctorId, storeSignature],
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
      const cleanName = (s?: string) => s?.toLowerCase().replace(/^dr\.?\s*/i, '').trim() || '';

      let relevantStoreAppointments = storeAppointments;
      if (effectiveDoctorId) {
        const curDocName = cleanName(currentUser?.name);
        relevantStoreAppointments = storeAppointments.filter((a) => {
          if (a.doctorId === effectiveDoctorId) return true;
          if (curDocName) {
            const aDocName = cleanName(a.doctorName);
            if (aDocName && (aDocName === curDocName || aDocName.includes(curDocName) || curDocName.includes(aDocName))) {
              return true;
            }
          }
          return currentUser?.role === 'doctor';
        });
      } else if (effectivePatientId) {
        const curPatName = cleanName(currentUser?.name);
        relevantStoreAppointments = storeAppointments.filter((a) => {
          if (a.patientId === effectivePatientId) return true;
          if (curPatName) {
            const aPatName = cleanName(a.patientName);
            if (aPatName && (aPatName === curPatName || aPatName.includes(curPatName) || curPatName.includes(aPatName))) {
              return true;
            }
          }
          return false;
        });
      }

      // Merge: if local store marked an appointment completed, preserve completed status
      const storeMap = new Map(relevantStoreAppointments.map((a) => [a.id, a]));
      const mergedFetched = fetched.map((serverApt) => {
        const localApt = storeMap.get(serverApt.id);
        if (localApt && localApt.status === 'completed' && serverApt.status !== 'completed') {
          return { ...serverApt, status: 'completed' };
        }
        return serverApt;
      });

      const ids = new Set(mergedFetched.map((a) => a.id));
      const custom = relevantStoreAppointments.filter((a) => !ids.has(a.id));
      return [...custom, ...mergedFetched];
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

