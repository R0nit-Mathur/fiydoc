import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment, Doctor } from '@/types/index';

export interface BookingDraft {
  doctor: Doctor | null;
  date: string;
  timeSlot: string;
  mode: 'in_person' | 'video' | 'clinic';
  symptoms: string[];
  patientNotes?: string;
  fee: number;
}

interface AppointmentState {
  appointments: Appointment[];
  bookingDraft: BookingDraft;
  setBookingDoctor: (doctor: Doctor) => void;
  setBookingSlot: (date: string, timeSlot: string, mode?: 'in_person' | 'video' | 'clinic') => void;
  setBookingSymptoms: (symptoms: string[], notes?: string) => void;
  resetBookingDraft: () => void;
  addAppointment: (appointment: Appointment) => void;
  cancelAppointment: (id: string) => void;
}

const initialDraft: BookingDraft = {
  doctor: null,
  date: '',
  timeSlot: '',
  mode: 'video',
  symptoms: [],
  patientNotes: '',
  fee: 0,
};

export const useAppointmentStore = create<AppointmentState>()(
  persist(
    (set) => ({
      appointments: [],
      bookingDraft: initialDraft,

      setBookingDoctor: (doctor) =>
        set((state) => ({
          bookingDraft: {
            ...state.bookingDraft,
            doctor,
            fee: doctor.consultationFee,
          },
        })),

      setBookingSlot: (date, timeSlot, mode = 'clinic') =>
        set((state) => ({
          bookingDraft: {
            ...state.bookingDraft,
            date,
            timeSlot,
            mode: mode || 'clinic',
          },
        })),

      setBookingSymptoms: (symptoms, patientNotes) =>
        set((state) => ({
          bookingDraft: {
            ...state.bookingDraft,
            symptoms,
            patientNotes,
          },
        })),

      resetBookingDraft: () => set({ bookingDraft: initialDraft }),

      addAppointment: (appointment) =>
        set((state) => ({
          appointments: [appointment, ...state.appointments],
        })),

      cancelAppointment: (id) =>
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, status: 'cancelled' } : a
          ),
        })),
    }),
    {
      name: 'fiydoc-appointment-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
