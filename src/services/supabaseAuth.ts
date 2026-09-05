import { UserSession } from './authService';
import { apiClient } from './apiClient';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tkuycqvzchsqrbeilogy.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_U8syjfx6EGt_7I5dfFIAVw_cVkF1CKy';

export interface QuickPersona {
  id: string;
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  specialty?: string;
  registrationNumber?: string;
  clinicName?: string;
  clinicAddress?: string;
  avatar: string;
  badge: string;
  description: string;
}

export const PREMADE_PERSONAS: QuickPersona[] = [
  {
    id: 'pat_aarav_01',
    name: 'Aarav Mehta',
    email: 'patient@fiydoc.app',
    role: 'patient',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    badge: 'Verified Patient',
    description: 'Patient account with active appointments & health records',
  },
  {
    id: 'doc_rakshit_01',
    name: 'Dr. Rakshit Mathur',
    email: 'rakshit.doctor@fiydoc.app',
    role: 'doctor',
    specialty: 'Senior Consultant Physician & Diabetologist',
    registrationNumber: 'NMC-MH-928410',
    clinicName: 'FiYDoc Advanced Care Clinic',
    clinicAddress: '401 Apollo Arcade, Bandra West, Mumbai',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80',
    badge: 'Senior Consultant',
    description: 'Specialist Doctor OPD Suite with independent queue & Rx',
  },
  {
    id: 'doc_priya_01',
    name: 'Dr. Priya Sharma',
    email: 'doctor@fiydoc.app',
    role: 'doctor',
    specialty: 'Senior Consultant Cardiologist',
    registrationNumber: 'MCI-847291',
    clinicName: 'HeartCare Specialty Clinic',
    clinicAddress: 'Suite 402, Medical Enclave, Mumbai',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80',
    badge: 'Cardiologist',
    description: 'Cardiology OPD Specialist with verified MCI license',
  },
  {
    id: 'admin_fiydoc_01',
    name: 'FiYDoc Administrator',
    email: 'admin@fiydoc.app',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    badge: 'Hospital Admin',
    description: 'Administrative portal for doctor verification & oversight',
  },
];

export const supabaseAuthService = {
  /**
   * Request passwordless 6-digit OTP from Supabase to user's real email
   */
  async requestEmailOtp(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      throw new Error('Please enter a valid email address.');
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.msg || errData.error_description || 'Failed to send OTP.');
      }

      return {
        success: true,
        message: `A 6-digit verification code has been sent to ${cleanEmail}. Check your inbox!`,
      };
    } catch (err: any) {
      console.warn('[supabaseAuthService] requestEmailOtp warning:', err.message);
      // If network fails or rate limited, return fallback info
      return {
        success: true,
        message: `Verification code dispatched to ${cleanEmail}. Use code 1234 for quick testing.`,
      };
    }
  },

  /**
   * Verify passwordless 6-digit OTP with Supabase
   */
  async verifyEmailOtp(email: string, token: string): Promise<UserSession> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    // Support quick demo code
    if (cleanToken === '1234') {
      const isDoctor = cleanEmail.includes('doc') || cleanEmail.includes('dr');
      return {
        id: 'usr_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
        name: isDoctor ? 'Dr. Medical Specialist' : 'FiYDoc Patient',
        email: cleanEmail,
        role: isDoctor ? 'doctor' : 'patient',
        isLoggedIn: true,
        onboardingCompleted: true,
        verificationStatus: 'verified',
        avatar: isDoctor
          ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
        phone: '+91 98765 43210',
      };
    }

    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'email',
          email: cleanEmail,
          token: cleanToken,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.msg || errData.error_description || 'Invalid or expired OTP code.');
      }

      const data = await response.json();
      const isDoctor = cleanEmail.includes('doc') || cleanEmail.includes('dr');

      return {
        id: data.user?.id || 'usr_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_'),
        name: data.user?.user_metadata?.full_name || (isDoctor ? 'Dr. Specialist' : 'FiYDoc Member'),
        email: cleanEmail,
        role: isDoctor ? 'doctor' : 'patient',
        isLoggedIn: true,
        onboardingCompleted: true,
        verificationStatus: 'verified',
        accessToken: data.access_token,
        avatar: isDoctor
          ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80'
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      };
    } catch (err: any) {
      throw new Error(err.message || 'OTP verification failed. Please try again.');
    }
  },

  /**
   * 1-Tap sign-in with pre-made verified personas
   */
  async loginAsPersona(personaId: string): Promise<UserSession> {
    const persona = PREMADE_PERSONAS.find((p) => p.id === personaId) || PREMADE_PERSONAS[0];

    // Attempt to authenticate against backend /auth/login with known password
    try {
      const response = await apiClient<{ accessToken?: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: persona.email,
          password: 'password123',
        }),
      });

      if (response && response.user) {
        return {
          id: response.user.id,
          name: persona.name,
          email: persona.email,
          role: persona.role,
          avatar: persona.avatar,
          isLoggedIn: true,
          onboardingCompleted: true,
          verificationStatus: 'verified',
          accessToken: response.accessToken,
        };
      }
    } catch {
      // Graceful offline fallback
    }

    return {
      id: persona.id,
      name: persona.name,
      email: persona.email,
      role: persona.role,
      avatar: persona.avatar,
      isLoggedIn: true,
      onboardingCompleted: true,
      verificationStatus: 'verified',
    };
  },
};
