import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MedicalRecord, Prescription, LabReport } from '@/types/index';

// No sample/mock lab reports — all data comes from real prescriptions and backend

interface HealthState {
  records: MedicalRecord[];
  prescriptions: Prescription[];
  labReports: LabReport[];
  activeFilter: string;
  addRecord: (record: MedicalRecord) => void;
  addPrescription: (prescription: Prescription) => void;
  setPrescriptions: (prescriptions: Prescription[]) => void;
  addLabReport: (report: LabReport) => void;
  setActiveFilter: (filter: string) => void;
  getPrescriptionsForDoctor: (doctorId: string, doctorName?: string) => Prescription[];
  getPrescriptionsForPatient: (patientId: string, patientName?: string) => Prescription[];
  getLabReportsForPatient: (patientId?: string, patientName?: string) => LabReport[];
  reset: () => void;
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      records: [],
      prescriptions: [],
      labReports: [],
      activeFilter: 'All',

      reset: () =>
        set({
          records: [],
          prescriptions: [],
          labReports: [],
          activeFilter: 'All',
        }),

      addRecord: (record) =>
        set((state) => ({
          records: [record, ...state.records],
        })),

      addLabReport: (report) =>
        set((state) => ({
          labReports: [report, ...state.labReports.filter((r) => r.id !== report.id)],
        })),

      addPrescription: (prescription) =>
        set((state) => ({
          prescriptions: [prescription, ...state.prescriptions.filter((p) => p.id !== prescription.id)],
        })),

      setPrescriptions: (newPrescriptions) =>
        set((state) => {
          const newMap = new Map(newPrescriptions.map((p) => [p.id, p]));
          const merged = [
            ...newPrescriptions,
            ...state.prescriptions.filter((p) => !newMap.has(p.id)),
          ];
          return { prescriptions: merged };
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

      getLabReportsForPatient: (patientId?: string, patientName?: string) => {
        const state = get();
        if (!patientId && !patientName) return state.labReports;
        return state.labReports.filter((r) => {
          if (patientId && r.patientId === patientId) return true;
          if (patientName && r.patientName && r.patientName.trim().toLowerCase() === patientName.trim().toLowerCase()) {
            return true;
          }
          return false;
        });
      },
    }),
    {
      name: 'fiydoc-health-storage-v5',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
