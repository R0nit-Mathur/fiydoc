import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import {
  User,
  Mail,
  Lock,
  Phone,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Building2,
  Award,
  MapPin,
} from 'lucide-react-native';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { googleAuthService } from '@/services/googleAuth';

const SPECIALTIES = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Gynecology',
  'ENT Specialist',
];

export default function SignupScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor'>('patient');
  const [doctorStep, setDoctorStep] = useState<1 | 2 | 3>(1);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Doctor Fields
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [consultationFee, setConsultationFee] = useState('750');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const validateStep1 = () => {
    if (!name.trim()) {
      setError('Please enter your full name.');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email.');
      return false;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError('');
    if (doctorStep === 1) {
      if (validateStep1()) setDoctorStep(2);
    } else if (doctorStep === 2) {
      if (!licenseNumber.trim()) {
        setError('Please enter your MCI / NMC registration number.');
        return;
      }
      setDoctorStep(3);
    }
  };

  const handleSignup = async () => {
    setError('');
    if (selectedRole === 'patient') {
      if (!validateStep1()) return;
    } else {
      if (!validateStep1()) return;
      if (!licenseNumber.trim()) {
        setError('Please enter your license number.');
        return;
      }
      if (!clinicName.trim() || !clinicAddress.trim()) {
        setError('Please enter clinic details.');
        return;
      }
    }

    try {
      setLoading(true);
      const doctorData =
        selectedRole === 'doctor'
          ? {
              licenseNumber: licenseNumber.trim(),
              specialization: specialty,
              experience: 5,
              clinicName: clinicName.trim(),
              clinicAddress: clinicAddress.trim(),
              consultationFee: parseInt(consultationFee, 10) || 750,
              city: clinicAddress.split(',')[1]?.trim() || 'Bengaluru',
            }
          : undefined;

      const session = await authService.registerWithEmail(
        email.trim(),
        password,
        name.trim(),
        selectedRole === 'doctor' ? 'doctor' : 'patient',
        doctorData
      );

      setSession(session);
      if (session.role === 'doctor') {
        router.replace('/(doctor)/(tabs)/home');
      } else {
        router.replace('/(patient)/(tabs)/home');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const session = await googleAuthService.signInWithGoogle();
      if (session) {
        setSession(session);
        if (session.role === 'doctor') {
          router.replace('/(doctor)/(tabs)/home');
        } else {
          router.replace('/(patient)/(tabs)/home');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-Up failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <FiYLogo size="lg" />
          <Text style={styles.title}>
            {selectedRole === 'doctor' ? 'Doctor Registration' : 'Create account'}
          </Text>

          {/* Role Toggle */}
          <View style={styles.roleToggle}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedRole('patient');
                setError('');
              }}
              style={[
                styles.roleTab,
                selectedRole === 'patient' && styles.roleTabActive,
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  selectedRole === 'patient' && styles.roleTextActive,
                ]}
              >
                Patient
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedRole('doctor');
                setError('');
              }}
              style={[
                styles.roleTab,
                selectedRole === 'doctor' && styles.roleTabActive,
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  selectedRole === 'doctor' && styles.roleTextActive,
                ]}
              >
                Doctor
              </Text>
            </TouchableOpacity>
          </View>

          {selectedRole === 'doctor' && (
            <View style={styles.stepDots}>
              {[1, 2, 3].map((step) => (
                <View
                  key={step}
                  style={[
                    styles.stepDot,
                    doctorStep >= step && styles.stepDotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Error */}
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form */}
        <View style={styles.form}>
          {(selectedRole === 'patient' || (selectedRole === 'doctor' && doctorStep === 1)) && (
            <>
              <View style={styles.inputWrapper}>
                <User size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={selectedRole === 'doctor' ? 'Dr. Full Name' : 'Full Name'}
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Phone size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone number"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password (min 6 characters)"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={18} color="#94A3B8" />
                  ) : (
                    <Eye size={18} color="#94A3B8" />
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}

          {selectedRole === 'doctor' && doctorStep === 2 && (
            <>
              <Text style={styles.sectionLabel}>Select Specialty</Text>
              <View style={styles.chipsWrap}>
                {SPECIALTIES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSpecialty(s)}
                    style={[
                      styles.chip,
                      specialty === s && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        specialty === s && styles.chipTextActive,
                      ]}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputWrapper}>
                <Award size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="MCI / NMC Registration Number"
                  placeholderTextColor="#94A3B8"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                  autoCapitalize="characters"
                />
              </View>
            </>
          )}

          {selectedRole === 'doctor' && doctorStep === 3 && (
            <>
              <View style={styles.inputWrapper}>
                <Building2 size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Clinic / Hospital Name"
                  placeholderTextColor="#94A3B8"
                  value={clinicName}
                  onChangeText={setClinicName}
                />
              </View>

              <View style={styles.inputWrapper}>
                <MapPin size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Clinic Locality (e.g. Indiranagar, Bengaluru)"
                  placeholderTextColor="#94A3B8"
                  value={clinicAddress}
                  onChangeText={setClinicAddress}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginRight: 8 }}>
                  ₹
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Consultation Fee (e.g. 750)"
                  placeholderTextColor="#94A3B8"
                  value={consultationFee}
                  onChangeText={setConsultationFee}
                  keyboardType="number-pad"
                />
              </View>
            </>
          )}

          {/* Action Buttons */}
          {selectedRole === 'doctor' && doctorStep < 3 ? (
            <View style={styles.stepBtnRow}>
              {doctorStep > 1 && (
                <TouchableOpacity
                  onPress={() => setDoctorStep((s) => (s - 1) as 1 | 2)}
                  style={styles.backBtn}
                >
                  <ArrowLeft size={18} color="#0F172A" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleNextStep}
                style={styles.continueBtn}
              >
                <Text style={styles.continueBtnText}>Continue</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleSignup}
              activeOpacity={0.88}
              disabled={loading}
              style={styles.primaryBtn}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {selectedRole === 'doctor'
                    ? 'Complete Registration'
                    : 'Create Account'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Google for Patient */}
          {selectedRole === 'patient' && (
            <TouchableOpacity
              onPress={handleGooglePress}
              activeOpacity={0.85}
              disabled={googleLoading}
              style={styles.googleBtn}
            >
              {googleLoading ? (
                <ActivityIndicator size="small" color="#0F172A" />
              ) : (
                <>
                  <GoogleLogo size={18} />
                  <Text style={styles.googleBtnText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 18,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  roleToggle: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    padding: 3,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTabActive: {
    backgroundColor: '#0F172A',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  roleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stepDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  stepDot: {
    width: 24,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  stepDotActive: {
    backgroundColor: '#0F172A',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '600',
  },
  form: {
    width: '100%',
    gap: 14,
    marginVertical: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: -4,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  chipActive: {
    backgroundColor: '#0F172A',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  stepBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  backBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    height: 54,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: '#0F172A',
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  googleBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 52,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
});
