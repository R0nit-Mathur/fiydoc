import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MedicalRecord, Prescription } from '@/types/index';

interface HealthState {
  records: MedicalRecord[];
  prescriptions: Prescription[];
  activeFilter: string;
  addRecord: (record: MedicalRecord) => void;
  addPrescription: (prescription: Prescription) => void;
  setActiveFilter: (filter: string) => void;
  getPrescriptionsForDoctor: (doctorId: string, doctorName?: string) => Prescription[];
  getPrescriptionsForPatient: (patientId: string, patientName?: string) => Prescription[];
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      records: [],
      prescriptions: [],
      activeFilter: 'All',

      addRecord: (record) =>
        set((state) => ({
          records: [record, ...state.records],
        })),

      addPrescription: (prescription) =>
        set((state) => {
          // Also automatically add a timeline MedicalRecord for this prescription
          const recordItem: MedicalRecord = {
            id: `rec_${prescription.id}`,
            patientId: prescription.patientId,
            title: `Digital Prescription (Rx) • ${prescription.doctorName || 'Specialist Doctor'}`,
            type: 'Prescription',
            sourceId: prescription.id,
            createdAt: 'Just now',
            doctorName: prescription.doctorName,
            summary: prescription.diagnosis
              ? prescription.medicines && prescription.medicines.length > 0
                ? `Diagnosis: ${prescription.diagnosis}. Prescribed ${prescription.medicines.length} medication(s).`
                : `Diagnosis: ${prescription.diagnosis}. Clinical Assessment & Advice (No medications required).`
              : prescription.medicines && prescription.medicines.length > 0
                ? `Official prescription with ${prescription.medicines.length} medication(s).`
                : `Official clinical assessment & consultation advice.`,
            tags: ['DIGITAL_RX', 'MCI_VERIFIED'],
          };

          return {
            prescriptions: [prescription, ...state.prescriptions.filter((p) => p.id !== prescription.id)],
            records: [recordItem, ...state.records.filter((r) => r.sourceId !== prescription.id)],
          };
        }),

      setActiveFilter: (activeFilter) => set({ activeFilter }),

      getPrescriptionsForDoctor: (doctorId: string, doctorName?: string) => {
        const state = get();
        return state.prescriptions.filter((p) => {
          if (p.doctorId && doctorId && p.doctorId === doctorId) return true;
          if (doctorName && p.doctorName && p.doctorName.trim().toLowerCase() === doctorName.trim().toLowerCase()) {
            return true;
          }
          return false;
        });
      },

      getPrescriptionsForPatient: (patientId: string, patientName?: string) => {
        const state = get();
        return state.prescriptions.filter((p) => {
          if (p.patientId && patientId && p.patientId === patientId) return true;
          if (patientName && p.patientName && p.patientName.trim().toLowerCase() === patientName.trim().toLowerCase()) {
            return true;
          }
          return false;
        });
      },
    }),
    {
      name: 'fiydoc-health-storage-v4',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
