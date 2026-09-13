import { useQuery } from '@tanstack/react-query';
import { healthService } from '@/services/healthService';
import { useHealthStore } from '@/store/useHealthStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Prescription } from '@/types/index';

export function usePrescriptionsQuery(patientId?: string) {
  const { user } = useAuthStore();
  const setPrescriptions = useHealthStore((s) => s.setPrescriptions);
  const storePrescriptions = useHealthStore((s) => s.prescriptions);

  const effectivePatientId = patientId || (user?.role === 'patient' ? user.id : 'me');

  return useQuery<Prescription[]>({
    queryKey: ['prescriptions', effectivePatientId, storePrescriptions.length],
    queryFn: async () => {
      try {
        const rawList = await healthService.getPrescriptions(effectivePatientId);
        if (!Array.isArray(rawList)) return storePrescriptions;

        const mapped: Prescription[] = rawList.map((rx: any) => ({
          id: rx.id,
          consultationId: rx.consultationId,
          patientId: rx.patientId,
          doctorId: rx.doctorId,
          doctorName: rx.doctor?.fullName
            ? rx.doctor.fullName.startsWith('Dr.')
              ? rx.doctor.fullName
              : `Dr. ${rx.doctor.fullName}`
            : 'Licensed Doctor',
          doctorSpecialty: rx.doctor?.specialization || 'Specialist',
          doctorMciNumber: rx.doctor?.verification?.registrationNumber || undefined,
          clinicName: rx.doctor?.clinic?.name || 'FiYDoc Partner Clinic',
          clinicAddress: rx.doctor?.clinic?.address || undefined,
          patientName: rx.patient?.fullName || user?.name || 'Patient',
          doctorNotes: rx.doctorNotes || 'Follow prescribed regimen.',
          followUpInstructions: rx.followUpInstructions || 'Review in clinic as advised.',
          verificationCode: rx.verificationCode,
          pdfUrl: rx.pdfUrl || undefined,
          signedAt: rx.issuedAt || rx.signedAt || rx.createdAt,
          createdAt: rx.createdAt
            ? new Date(rx.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : '',
          medicines: (rx.medicines || []).map((m: any) => ({
            id: m.id || `${rx.id}-${m.name}`,
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            durationDays: m.durationDays,
            instructions: m.instructions || '',
          })),
        }));

        setPrescriptions(mapped);
        return mapped;
      } catch (err) {
        console.warn('[usePrescriptionsQuery] Server fetch failed, falling back to store:', err);
        return storePrescriptions;
      }
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}
