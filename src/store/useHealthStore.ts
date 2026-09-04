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
}

const initialPrescriptions: Prescription[] = [
  {
    id: 'rx_seed_101',
    consultationId: 'apt_101',
    patientId: 'pat_1',
    doctorId: 'doc_1',
    doctorName: 'Dr. Priya Sharma',
    doctorSpecialty: 'Senior Consultant Cardiologist',
    doctorMciNumber: 'MCI-847291',
    clinicName: 'HeartCare Specialty Clinic',
    clinicAddress: 'Suite 402, Medical Enclave, Bandra West, Mumbai',
    patientName: 'Aarav Mehta',
    patientAge: 32,
    patientGender: 'Male',
    diagnosis: 'Essential Stage-1 Hypertension & Tachycardia',
    doctorNotes: 'Patient presented with mild morning headaches and exertional fatigue. Vitals evaluated in clinic.',
    followUpInstructions: 'Follow low sodium diet (<2g/day), 30 mins brisk walking. Review in clinic after 4 weeks with BP chart.',
    verificationCode: 'FYD-RX-847291-MH',
    signedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    vitals: {
      bp: '138/88 mmHg',
      pulse: '82 bpm',
      temp: '98.4°F',
      spo2: '99%',
      weight: '74 kg',
    },
    medicines: [
      {
        id: 'med_1',
        name: 'Telmisartan 40mg',
        dosage: '1 Tab',
        frequency: '1-0-0 (Morning)',
        durationDays: 30,
        instructions: 'Take once daily after breakfast',
      },
      {
        id: 'med_2',
        name: 'Metoprolol Succinate 25mg',
        dosage: '1 Tab',
        frequency: '0-0-1 (Night)',
        durationDays: 30,
        instructions: 'Take after dinner',
      },
      {
        id: 'med_3',
        name: 'Atorvastatin 10mg',
        dosage: '1 Tab',
        frequency: '0-0-1 (Night)',
        durationDays: 30,
        instructions: 'Take at bedtime',
      },
    ],
    tests: [
      { id: 'test_1', name: 'Comprehensive Lipid Profile', category: 'Biochemistry', fastingRequired: true },
      { id: 'test_2', name: '12-Lead Resting Electrocardiogram (ECG)', category: 'Cardiology', fastingRequired: false },
    ],
  },
];

const initialRecords: MedicalRecord[] = [
  {
    id: 'rec_seed_1',
    patientId: 'pat_1',
    title: 'Digital Prescription (Rx) • Dr. Priya Sharma',
    type: 'Prescription',
    sourceId: 'rx_seed_101',
    createdAt: 'Today',
    doctorName: 'Dr. Priya Sharma (Cardiology)',
    facility: 'HeartCare Specialty Clinic',
    summary: 'Rx for Essential Stage-1 Hypertension. Prescribed Telmisartan 40mg, Metoprolol 25mg, Atorvastatin 10mg.',
    extractedTags: ['HYPERTENSION', 'CARDIOLOGY', 'MCI_VERIFIED'],
    tags: ['HYPERTENSION', 'CARDIOLOGY', 'MCI_VERIFIED'],
  },
  {
    id: 'rec_seed_2',
    patientId: 'pat_1',
    title: 'Comprehensive Lipid Panel',
    type: 'Lab Result',
    createdAt: 'Yesterday',
    doctorName: 'Dr. Priya Sharma',
    facility: 'Metropolis Healthcare Diagnostics',
    ocrConfidence: 98.4,
    summary: 'Total Cholesterol: 178 mg/dL, HDL: 52 mg/dL, LDL: 98 mg/dL. All cardiac lipid fractions within optimal range.',
    extractedTags: ['LIPID_PROFILE', 'OCR_VERIFIED', 'BIOCHEMISTRY'],
    tags: ['LIPID_PROFILE', 'OCR_VERIFIED', 'BIOCHEMISTRY'],
  },
  {
    id: 'rec_seed_3',
    patientId: 'pat_1',
    title: 'Glycated Hemoglobin (HbA1c) & Glucose',
    type: 'Lab Result',
    createdAt: '2 weeks ago',
    doctorName: 'Dr. Ananya Roy',
    facility: 'Dr. Lal PathLabs',
    ocrConfidence: 99.1,
    summary: 'HbA1c: 5.4% (Optimal glycemic control). Fasting Plasma Glucose: 94 mg/dL (Normal reference: 70-99 mg/dL).',
    extractedTags: ['GLUCOSE', 'METABOLIC', 'NORMAL'],
    tags: ['GLUCOSE', 'METABOLIC', 'NORMAL'],
  },
];

export const useHealthStore = create<HealthState>()(
  persist(
    (set) => ({
      records: initialRecords,
      prescriptions: initialPrescriptions,
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
            facility: prescription.clinicName || 'FiYDoc Health Clinic',
            summary: prescription.diagnosis
              ? `Diagnosis: ${prescription.diagnosis}. Prescribed ${prescription.medicines.length} medication(s).`
              : `Official prescription with ${prescription.medicines.length} medication(s).`,
            extractedTags: ['DIGITAL_RX', 'MCI_VERIFIED', 'TELE_HEALTH'],
            tags: ['DIGITAL_RX', 'MCI_VERIFIED'],
          };

          return {
            prescriptions: [prescription, ...state.prescriptions.filter((p) => p.id !== prescription.id)],
            records: [recordItem, ...state.records.filter((r) => r.sourceId !== prescription.id)],
          };
        }),

      setActiveFilter: (activeFilter) => set({ activeFilter }),
    }),
    {
      name: 'fiydoc-health-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
