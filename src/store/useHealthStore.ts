import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MedicalRecord } from '@/types/index';

interface HealthState {
  records: MedicalRecord[];
  activeFilter: string;
  addRecord: (record: MedicalRecord) => void;
  setActiveFilter: (filter: string) => void;
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set) => ({
      records: [],
      activeFilter: 'All',

      addRecord: (record) =>
        set((state) => ({
          records: [record, ...state.records],
        })),

      setActiveFilter: (activeFilter) => set({ activeFilter }),
    }),
    {
      name: 'fiydoc-health-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
