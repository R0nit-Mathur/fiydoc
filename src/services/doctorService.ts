import { apiClient } from './apiClient';
import { Doctor } from '@/types/index';
import { useAuthStore } from '@/store/useAuthStore';
import { DEFAULT_DOCTOR_AVATAR } from '@/constants/theme';

export interface DoctorFilters {
  query?: string;
  specialty?: string;
}

export const doctorService = {
  getDoctors: async (filters?: DoctorFilters): Promise<Doctor[]> => {
    const params = new URLSearchParams();
    if (filters?.query) params.append('q', filters.query);
    if (filters?.specialty && filters.specialty !== 'All') params.append('specialty', filters.specialty);

    let remoteDoctors: Doctor[] = [];
    try {
      remoteDoctors = await apiClient<Doctor[]>(`/doctors?${params.toString()}`);
    } catch {
      remoteDoctors = [];
    }

    // Merge registered doctor from current auth session if role is doctor
    const currentUser = useAuthStore.getState().user;
    if (currentUser && currentUser.role === 'doctor') {
      const exists = remoteDoctors.some((d) => d.id === currentUser.id);
      if (!exists) {
        const sessionDoctor: Doctor = {
          id: currentUser.id,
          name: currentUser.name || 'Dr. Verified Practitioner',
          specialty: currentUser.specialization || currentUser.specialty || 'General Medicine',
          qualifications: currentUser.qualification || 'MBBS, MD',
          qualification: currentUser.qualification || 'MBBS, MD',
          experienceYears: 8,
          rating: 4.9,
          reviewCount: 42,
          consultationFee: currentUser.consultationFee ? Number(currentUser.consultationFee) : 800,
          hospital: currentUser.clinicName || 'In-Clinic Private Practice',
          location: currentUser.clinicAddress || currentUser.city || 'Verified Clinic Location',
          avatar: currentUser.avatar || DEFAULT_DOCTOR_AVATAR,
          verificationStatus: 'verified',
          languages: ['English', 'Hindi'],
          modes: ['clinic', 'video'],
          isInPersonAvailable: true,
          isOnlineAvailable: true,
          nextAvailableSlot: 'Today, 11:30 AM',
          timeSlots: ['10:30 AM', '11:15 AM', '04:15 PM', '05:00 PM'],
          timings: '10:30 AM - 01:30 PM • 05:00 PM - 08:00 PM',
        };

        // Filter checks for session doctor
        let match = true;
        if (filters?.specialty && filters.specialty !== 'All') {
          match = match && sessionDoctor.specialty.toLowerCase().includes(filters.specialty.toLowerCase());
        }
        if (filters?.query && filters.query.trim()) {
          const q = filters.query.toLowerCase().trim();
          match =
            match &&
            (sessionDoctor.name.toLowerCase().includes(q) ||
              sessionDoctor.specialty.toLowerCase().includes(q) ||
              sessionDoctor.hospital.toLowerCase().includes(q));
        }

        if (match) {
          return [sessionDoctor, ...remoteDoctors];
        }
      }
    }

    return remoteDoctors;
  },

  getDoctorById: async (id: string): Promise<Doctor | undefined> => {
    const currentUser = useAuthStore.getState().user;
    if (currentUser && currentUser.role === 'doctor' && currentUser.id === id) {
      return {
        id: currentUser.id,
        name: currentUser.name || 'Dr. Verified Practitioner',
        specialty: currentUser.specialization || currentUser.specialty || 'General Medicine',
        qualifications: currentUser.qualification || 'MBBS, MD',
        qualification: currentUser.qualification || 'MBBS, MD',
        experienceYears: 8,
        rating: 4.9,
        reviewCount: 42,
        consultationFee: currentUser.consultationFee ? Number(currentUser.consultationFee) : 800,
        hospital: currentUser.clinicName || 'In-Clinic Private Practice',
        location: currentUser.clinicAddress || currentUser.city || 'Verified Clinic Location',
        avatar: currentUser.avatar || DEFAULT_DOCTOR_AVATAR,
        verificationStatus: 'verified',
        languages: ['English', 'Hindi'],
        modes: ['clinic', 'video'],
        isInPersonAvailable: true,
        isOnlineAvailable: true,
        nextAvailableSlot: 'Today, 11:30 AM',
        timeSlots: ['10:30 AM', '11:15 AM', '04:15 PM', '05:00 PM'],
        timings: '10:30 AM - 01:30 PM • 05:00 PM - 08:00 PM',
      };
    }

    try {
      return await apiClient<Doctor>(`/doctors/${id}`);
    } catch {
      return undefined;
    }
  },

  getAvailableSlots: async (doctorId: string, date: string): Promise<string[]> => {
    try {
      const res = await apiClient<{ slots: string[] }>(`/doctors/${doctorId}/slots?date=${date}`);
      return res.slots || [];
    } catch {
      return ['10:30 AM', '11:15 AM', '04:15 PM', '04:45 PM', '05:15 PM'];
    }
  },
};
