export type Role = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: Role;
  name: string;
  avatar?: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  fullName: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  emergencyContact?: { name: string; phone: string; relation: string };
  onboardingComplete: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  qualifications?: string;
  qualification?: string;
  title?: string;
  bio?: string;
  location?: string;
  licenseNumber?: string;
  availableDays?: string[];
  isOnlineAvailable?: boolean;
  isInPersonAvailable?: boolean;
  timeSlots?: string[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  hospital: string;
  avatar: string;
  about?: string;
  verificationStatus: 'registered' | 'pending' | 'verified' | 'rejected' | 'info_required';
  languages: string[];
  nextAvailableSlot?: string;
  modes?: ('video' | 'clinic' | 'in_person')[];
  timings?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  paymentStatus?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  hospital: string;
  date: string;
  time: string;
  status: 'upcoming' | 'confirmed' | 'completed' | 'cancelled' | 'in_progress' | 'pending';
  mode: 'video' | 'clinic' | 'in_person';
  fee: number;
  symptoms?: string[];
  notes?: string;
  prescriptionId?: string;
}

export interface ClinicalNote {
  id: string;
  text: string;
  timestamp: string;
}

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  chiefComplaint?: string;
  symptoms: string[];
  observations?: string;
  assessment?: string;
  clinicalNotes: ClinicalNote[];
  prescriptionId?: string;
  followUpDate?: string;
  completedAt?: string;
}

export interface PrescriptionMedicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

export interface Prescription {
  id: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  doctorNotes?: string;
  followUpInstructions?: string;
  pdfUrl?: string;
  signedAt?: string;
  verificationCode: string;
  medicines: PrescriptionMedicine[];
  createdAt: string;
  doctorName?: string;
  doctorSpecialty?: string;
  doctorMciNumber?: string;
  clinicName?: string;
  clinicAddress?: string;
  patientName?: string;
  patientAge?: number;
  patientGender?: string;
  diagnosis?: string;
  tests?: { id: string; name: string; category?: string; turnaroundTime?: string; fastingRequired?: boolean }[];
  vitals?: {
    bp?: string;
    pulse?: string;
    temp?: string;
    spo2?: string;
    weight?: string;
  };
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  title: string;
  type: string;
  sourceId?: string;
  documentUrl?: string;
  summary?: string;
  tags?: string[];
  createdAt: string;
  date?: string;
  facility?: string;
  doctorName?: string;
  ocrConfidence?: number;
  extractedTags?: string[];
}

export interface NotificationItem {
  id: string;
  recipientId?: string;
  recipientRole?: 'patient' | 'doctor' | 'all';
  title: string;
  message: string;
  time: string;
  timestamp?: string;
  read: boolean;
  type: string;
  link?: string;
}

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  avatar?: string;
  lastVisit?: string;
  condition?: string;
  conditions?: string[];
  allergies?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
}
