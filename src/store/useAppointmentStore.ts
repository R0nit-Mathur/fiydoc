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

export const MAX_PATIENTS_PER_SLOT = 5;

interface AppointmentState {
  appointments: Appointment[];
  bookingDraft: BookingDraft;
  bookedSlots: Record<string, string[]>;
  setBookingDoctor: (doctor: Doctor) => void;
  setBookingSlot: (date: string, timeSlot: string, mode?: 'in_person' | 'video' | 'clinic') => void;
  setBookingSymptoms: (symptoms: string[], notes?: string) => void;
  resetBookingDraft: () => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  cancelAppointment: (id: string) => void;
  // Concurrency & Slot Locking Methods with 5-patient capacity
  getSlotBookedCount: (doctorId: string, date: string, timeSlot: string) => number;
  isSlotBooked: (doctorId: string, date: string, timeSlot: string) => boolean;
  isSlotFull: (doctorId: string, date: string, timeSlot: string) => boolean;
  bookSlot: (doctorId: string, date: string, timeSlot: string) => void;
  releaseSlot: (doctorId: string, date: string, timeSlot: string) => void;
}

const initialDraft: BookingDraft = {
  doctor: null,
  date: '',
  timeSlot: '',
  mode: 'clinic',
  symptoms: [],
  patientNotes: '',
  fee: 0,
};

// Pre-seeded booked slots for demonstration of realistic clinical calendars
const initialBookedSlots: Record<string, string[]> = {
  'doc_1_2026-09-04': ['09:30 AM', '02:00 PM'],
  'doc_1_2026-09-05': ['11:30 AM'],
  'doc_2_2026-09-04': ['10:30 AM'],
};

export const useAppointmentStore = create<AppointmentState>()(
  persist(
    (set, get) => ({
      appointments: [],
      bookingDraft: initialDraft,
      bookedSlots: initialBookedSlots,

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

      addAppointment: (appointment) => {
        // Automatically reserve and block the time slot
        const doctorId = appointment.doctorId;
        const date = appointment.date;
        const timeSlot = appointment.time;
        const key = `${doctorId}_${date}`;

        set((state) => {
          const currentSlots = state.bookedSlots[key] || [];
          const updatedSlots = currentSlots.includes(timeSlot)
            ? currentSlots
            : [...currentSlots, timeSlot];

          return {
            appointments: [appointment, ...state.appointments.filter((a) => a.id !== appointment.id)],
            bookedSlots: {
              ...state.bookedSlots,
              [key]: updatedSlots,
            },
          };
        });
      },

      updateAppointmentStatus: (id, status) =>
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, status } : a
          ),
        })),

      cancelAppointment: (id) =>
        set((state) => {
          const target = state.appointments.find((a) => a.id === id);
          if (!target) return state;

          const key = `${target.doctorId}_${target.date}`;
          const currentSlots = state.bookedSlots[key] || [];
          const updatedSlots = currentSlots.filter((s) => s !== target.time);

          return {
            appointments: state.appointments.map((a) =>
              a.id === id ? { ...a, status: 'cancelled' } : a
            ),
            bookedSlots: {
              ...state.bookedSlots,
              [key]: updatedSlots,
            },
          };
        }),

      getSlotBookedCount: (doctorId, date, timeSlot) => {
        if (!doctorId || !date || !timeSlot) return 0;
        const state = get();
        // Count active non-cancelled appointments for this exact doctor, date, and slot
        const matchingApts = state.appointments.filter(
          (a) =>
            a.doctorId === doctorId &&
            a.date === date &&
            a.time === timeSlot &&
            a.status !== 'cancelled'
        );

        // Pre-seeded slots can count as 1 booked spot
        const key = `${doctorId}_${date}`;
        const hasPreseed = state.bookedSlots[key]?.includes(timeSlot) ? 1 : 0;
        return Math.min(MAX_PATIENTS_PER_SLOT, Math.max(matchingApts.length, hasPreseed));
      },

      isSlotFull: (doctorId, date, timeSlot) => {
        const count = get().getSlotBookedCount(doctorId, date, timeSlot);
        return count >= MAX_PATIENTS_PER_SLOT;
      },

      isSlotBooked: (doctorId, date, timeSlot) => {
        return get().isSlotFull(doctorId, date, timeSlot);
      },

      bookSlot: (doctorId, date, timeSlot) => {
        if (!doctorId || !date || !timeSlot) return;
        const key = `${doctorId}_${date}`;
        set((state) => {
          const current = state.bookedSlots[key] || [];
          if (current.includes(timeSlot)) return state;
          return {
            bookedSlots: {
              ...state.bookedSlots,
              [key]: [...current, timeSlot],
            },
          };
        });
      },

      releaseSlot: (doctorId, date, timeSlot) => {
        if (!doctorId || !date || !timeSlot) return;
        const key = `${doctorId}_${date}`;
        set((state) => {
          const current = state.bookedSlots[key] || [];
          return {
            bookedSlots: {
              ...state.bookedSlots,
              [key]: current.filter((s) => s !== timeSlot),
            },
          };
        });
      },
    }),
    {
      name: 'fiydoc-appointment-storage-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

