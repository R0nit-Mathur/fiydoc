import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Alert,
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
  Stethoscope,
  Building2,
  Award,
  MapPin,
  CheckCircle2,
  Navigation,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { authService, UserSession } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { googleAuthService } from '@/services/googleAuth';

const MEDICAL_COUNCILS = [
  'National Medical Commission (NMC) / MCI',
  'Maharashtra Medical Council (MMC)',
  'Delhi Medical Council (DMC)',
  'Karnataka Medical Council (KMC)',
  'Tamil Nadu Medical Council (TNMC)',
  'West Bengal Medical Council',
  'Uttar Pradesh Medical Council',
  'Other State Medical Council',
];

const SPECIALTIES = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'Gynecology',
  'ENT Specialist',
  'Ophthalmology',
];

const DEGREES = ['MBBS', 'MBBS, MD', 'MBBS, MS', 'MBBS, DNB', 'DM / MCh'];

export default function SignupScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  // Role Slider: 'patient' or 'doctor'
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor'>('patient');

  // Doctor Step: 1, 2, or 3
  const [doctorStep, setDoctorStep] = useState<1 | 2 | 3>(1);

  // Step 1: Basic Info (Patient & Doctor)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');

  // Step 2: Doctor Studies & Credentials
  const [degree, setDegree] = useState(DEGREES[0]);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [registrationCouncil, setRegistrationCouncil] = useState(MEDICAL_COUNCILS[0]);
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [experienceYears, setExperienceYears] = useState('8');

  // Step 3: Doctor Clinic & Hospital Info
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [clinicLatitude, setClinicLatitude] = useState<number | null>(null);
  const [clinicLongitude, setClinicLongitude] = useState<number | null>(null);
  const [isLocatingClinic, setIsLocatingClinic] = useState(false);
  const [consultationFee, setConsultationFee] = useState('750');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDetectClinicLocation = async () => {
    setIsLocatingClinic(true);
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission was denied. Please enter clinic address manually.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setClinicLatitude(loc.coords.latitude);
      setClinicLongitude(loc.coords.longitude);

      const rev = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (rev && rev.length > 0) {
        const p = rev[0];
        const specific = [p.name, p.street, p.subregion || p.district].filter(Boolean)[0];
        const city = p.city || p.subregion || 'City Center';
        const formatted = specific ? `${specific}, ${city}` : city;
        setClinicAddress(formatted);
      }
    } catch {
      setError('Could not auto-detect location. Please enter clinic address manually.');
    } finally {
      setIsLocatingClinic(false);
    }
  };

  const validateStep1 = () => {
    if (!name.trim()) {
      setError('Please enter your full legal name.');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!licenseNumber.trim()) {
      setError('Please enter your Medical Registration Number (MCI / NMC ID).');
      return false;
    }
    if (!experienceYears.trim()) {
      setError('Please enter your years of clinical experience.');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!clinicName.trim()) {
      setError('Please enter your Hospital or Clinic name.');
      return false;
    }
    if (!clinicAddress.trim()) {
      setError('Please enter your Clinic address or tap GPS detect.');
      return false;
    }
    if (!consultationFee.trim()) {
      setError('Please enter your OPD consultation fee.');
      return false;
    }
    return true;
  };

  const handleNextDoctorStep = () => {
    setError('');
    if (doctorStep === 1) {
      if (validateStep1()) setDoctorStep(2);
    } else if (doctorStep === 2) {
      if (validateStep2()) setDoctorStep(3);
    }
  };

  const handlePrevDoctorStep = () => {
    setError('');
    if (doctorStep === 3) setDoctorStep(2);
    else if (doctorStep === 2) setDoctorStep(1);
  };

  const handleRegister = async () => {
    setError('');

    if (selectedRole === 'patient') {
      if (!validateStep1()) return;
    } else {
      if (!validateStep1() || !validateStep2() || !validateStep3()) return;
    }

    try {
      setLoading(true);

      const doctorData =
        selectedRole === 'doctor'
          ? {
              licenseNumber: licenseNumber.trim(),
              specialization: specialty,
              experience: parseInt(experienceYears, 10) || 5,
              clinicName: clinicName.trim(),
              clinicAddress: clinicAddress.trim(),
              consultationFee: parseInt(consultationFee, 10) || 750,
              latitude: clinicLatitude || 12.9716,
              longitude: clinicLongitude || 77.5946,
              city: clinicAddress.split(',')[1]?.trim() || 'Bengaluru',
              qualifications: degree,
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
      setError(err.message || 'Registration failed. Please check your information.');
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
      setError(err.message || 'Google Sign-In failed.');
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
        <View style={styles.topSection}>
          {/* Logo */}
          <View style={styles.logoWrapper}>
            <FiYLogo size="2xl" />
          </View>

          <Text style={styles.title}>
            {selectedRole === 'doctor' ? 'Register as Doctor' : 'Create Patient Account'}
          </Text>
          <Text style={styles.subtitle}>
            {selectedRole === 'doctor'
              ? 'Join our accredited network of medical specialists'
              : 'Sign up to consult top doctors and manage your OPD visits'}
          </Text>

          {/* Role Slider Toggle */}
          <View style={styles.sliderContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                setSelectedRole('patient');
                setError('');
              }}
              style={[
                styles.sliderTab,
                selectedRole === 'patient' && styles.sliderTabActive,
              ]}
            >
              <Text
                style={[
                  styles.sliderText,
                  selectedRole === 'patient' && styles.sliderTextActive,
                ]}
              >
                Patient Signup
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                setSelectedRole('doctor');
                setError('');
              }}
              style={[
                styles.sliderTab,
                selectedRole === 'doctor' && styles.sliderTabActive,
              ]}
            >
              <Text
                style={[
                  styles.sliderText,
                  selectedRole === 'doctor' && styles.sliderTextActive,
                ]}
              >
                Doctor Signup
              </Text>
            </TouchableOpacity>
          </View>

          {/* Doctor Multi-Step Progress Bar (Practo style) */}
          {selectedRole === 'doctor' && (
            <View style={styles.stepIndicatorContainer}>
              <View style={styles.stepHeaderRow}>
                <Text style={styles.stepHeaderTitle}>
                  {doctorStep === 1 && 'Step 1 of 3: Basic Account Info'}
                  {doctorStep === 2 && 'Step 2 of 3: Medical Studies & Council'}
                  {doctorStep === 3 && 'Step 3 of 3: Clinic & Slot Capacity'}
                </Text>
                <Text style={styles.stepHeaderPercent}>
                  {doctorStep === 1 && '33%'}
                  {doctorStep === 2 && '66%'}
                  {doctorStep === 3 && '100%'}
                </Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width:
                        doctorStep === 1 ? '33%' : doctorStep === 2 ? '66%' : '100%',
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form Content */}
          <View style={styles.formContainer}>
            {/* PATIENT SIGNUP OR DOCTOR STEP 1: Basic Info */}
            {(selectedRole === 'patient' || doctorStep === 1) && (
              <>
                <View style={styles.inputWrapper}>
                  <User size={18} color="#0B3064" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder={
                      selectedRole === 'doctor' ? 'Full Name (e.g. Dr. Priya Sharma)' : 'Full Name'
                    }
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Mail size={18} color="#0B3064" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Email Address"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Phone size={18} color="#0B3064" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="10-digit Mobile Number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Lock size={18} color="#0B3064" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Create Password (min 6 characters)"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.inputRightIcon}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#64748B" />
                    ) : (
                      <Eye size={18} color="#64748B" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Gender Selector */}
                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>Gender</Text>
                  <View style={styles.chipRow}>
                    {(['Male', 'Female', 'Other'] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        onPress={() => setGender(g)}
                        style={[styles.chip, gender === g && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                          {g}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* DOCTOR STEP 2: Studies & Medical Council */}
            {selectedRole === 'doctor' && doctorStep === 2 && (
              <>
                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>Primary Medical Degree</Text>
                  <View style={styles.chipRow}>
                    {DEGREES.map((d) => (
                      <TouchableOpacity
                        key={d}
                        onPress={() => setDegree(d)}
                        style={[styles.chip, degree === d && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, degree === d && styles.chipTextActive]}>
                          {d}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputWrapper}>
                  <Award size={18} color="#0B3064" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="MCI / NMC Registration Number"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="characters"
                    value={licenseNumber}
                    onChangeText={setLicenseNumber}
                  />
                </View>

                <View style={{ gap: 6 }}>
                  <Text style={styles.label}>Primary Medical Specialty</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                    <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 4 }}>
                      {SPECIALTIES.map((spec) => (
                        <TouchableOpacity
                          key={spec}
                          onPress={() => setSpecialty(spec)}
                          style={[styles.chip, specialty === spec && styles.chipActive]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              specialty === spec && styles.chipTextActive,
                            ]}
                          >
                            {spec}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View style={styles.inputWrapper}>
                  <Stethoscope size={18} color="#0B3064" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Years of Clinical Experience (e.g. 10)"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    value={experienceYears}
                    onChangeText={setExperienceYears}
                  />
                </View>
              </>
            )}

            {/* DOCTOR STEP 3: Clinic & Hospital Setup */}
            {selectedRole === 'doctor' && doctorStep === 3 && (
              <>
                <View style={styles.inputWrapper}>
                  <Building2 size={18} color="#0B3064" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Hospital or Clinic Name"
                    placeholderTextColor="#94A3B8"
                    value={clinicName}
                    onChangeText={setClinicName}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <MapPin size={18} color="#0B3064" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Clinic Address (Area, City)"
                    placeholderTextColor="#94A3B8"
                    value={clinicAddress}
                    onChangeText={setClinicAddress}
                  />
                </View>

                {/* 1-Tap GPS Detect Button */}
                <TouchableOpacity
                  onPress={handleDetectClinicLocation}
                  disabled={isLocatingClinic}
                  activeOpacity={0.8}
                  style={styles.gpsBtn}
                >
                  {isLocatingClinic ? (
                    <ActivityIndicator size="small" color="#0B3064" />
                  ) : (
                    <Navigation size={15} color="#0B3064" />
                  )}
                  <Text style={styles.gpsBtnText}>
                    {isLocatingClinic ? 'Detecting Clinic GPS...' : 'Auto-Fill Location from GPS'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.inputWrapper}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#0B3064', marginRight: 6 }}>
                    ₹
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Consultation Fee (e.g. 750)"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    value={consultationFee}
                    onChangeText={setConsultationFee}
                  />
                </View>

                <View style={styles.capacityNotice}>
                  <CheckCircle2 size={16} color="#00B39B" />
                  <Text style={styles.capacityText}>
                    Slot Allocation: Configured to max 5 patients per time slot.
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {selectedRole === 'doctor' && doctorStep > 1 && (
              <TouchableOpacity
                onPress={handlePrevDoctorStep}
                style={styles.backStepBtn}
              >
                <ArrowLeft size={18} color="#0B3064" />
                <Text style={styles.backStepText}>Back</Text>
              </TouchableOpacity>
            )}

            {selectedRole === 'doctor' && doctorStep < 3 ? (
              <TouchableOpacity
                onPress={handleNextDoctorStep}
                style={styles.nextStepBtn}
              >
                <Text style={styles.primaryBtnText}>Continue to Step {doctorStep + 1}</Text>
                <ArrowRight size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                style={[styles.primaryBtn, selectedRole === 'doctor' && doctorStep > 1 && { flex: 2 }]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {selectedRole === 'doctor' ? 'Complete Doctor Registration' : 'Create Patient Account'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Google Sign-up (Only on Step 1 / Patient) */}
          {(selectedRole === 'patient' || doctorStep === 1) && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                onPress={handleGooglePress}
                disabled={googleLoading}
                style={styles.googleBtn}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#0B3064" />
                ) : (
                  <View style={styles.googleBtnContent}>
                    <GoogleLogo size={18} />
                    <Text style={styles.googleBtnText}>Sign up with Google</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
  },
  logoWrapper: {
    marginTop: 8,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0A2540',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  sliderContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    padding: 4,
    width: '100%',
    marginBottom: 18,
  },
  sliderTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTabActive: {
    backgroundColor: '#0B3064',
    shadowColor: '#0B3064',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  sliderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  sliderTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  stepIndicatorContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 6,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0B3064',
    textTransform: 'uppercase',
  },
  stepHeaderPercent: {
    fontSize: 11,
    fontWeight: '900',
    color: '#00B39B',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00B39B',
    borderRadius: 999,
  },
  errorCard: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0B3064',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: '#FFFFFF',
  },
  inputLeftIcon: {
    marginRight: 10,
  },
  inputRightIcon: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  chipActive: {
    borderColor: '#0B3064',
    backgroundColor: '#0B3064',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 12,
  },
  gpsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0B3064',
  },
  capacityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FDFA',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  capacityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#008C7A',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginTop: 18,
  },
  backStepBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#0B3064',
    backgroundColor: '#FFFFFF',
  },
  backStepText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0B3064',
  },
  nextStepBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0B3064',
    shadowColor: '#0B3064',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: '#0B3064',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B3064',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  googleBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#0B3064',
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  googleBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B3064',
  },
});
