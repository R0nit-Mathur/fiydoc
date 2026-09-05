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
  Stethoscope,
  Building2,
  Award,
  MapPin,
  CheckCircle2,
  Navigation,
  Sparkles,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import { authService } from '@/services/authService';
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

  // Step 1: Basic Info
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

  // Step 3: Doctor Clinic Info
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
      setError('Please enter your MCI / State Council Registration Number.');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!clinicName.trim()) {
      setError('Please enter your Clinic or Practice Hospital name.');
      return false;
    }
    if (!clinicAddress.trim()) {
      setError('Please provide your clinic location or address.');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError('');
    if (doctorStep === 1) {
      if (validateStep1()) setDoctorStep(2);
    } else if (doctorStep === 2) {
      if (validateStep2()) setDoctorStep(3);
    }
  };

  const handleSignup = async () => {
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
        {/* Optically Centered Header */}
        <View style={styles.topSection}>
          <FiYLogo size="lg" />

          <View style={styles.badgePill}>
            <Sparkles size={11} color="#00B39B" />
            <Text style={styles.badgeText}>
              {selectedRole === 'doctor' ? 'VERIFIED SPECIALIST NETWORK' : 'DIRECT OPD ACCESS'}
            </Text>
          </View>

          <Text style={styles.title}>
            {selectedRole === 'doctor' ? 'Doctor Registration' : 'Create Patient Account'}
          </Text>
          <Text style={styles.subtitle}>
            {selectedRole === 'doctor'
              ? 'Connect directly with your patients and manage OPD queue effortlessly'
              : 'Direct connection with verified doctors & digital prescriptions on your app'}
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
                Patient
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
                Doctor / Specialist
              </Text>
            </TouchableOpacity>
          </View>

          {/* Doctor 3-Step Wizard Indicator */}
          {selectedRole === 'doctor' && (
            <View style={styles.stepIndicatorCard}>
              <View style={styles.stepHeaderRow}>
                <Text style={styles.stepTitle}>
                  {doctorStep === 1 && 'Step 1: Account & Contact'}
                  {doctorStep === 2 && 'Step 2: Qualifications & NMC'}
                  {doctorStep === 3 && 'Step 3: Practice Clinic'}
                </Text>
                <Text style={styles.stepNumber}>{doctorStep} of 3</Text>
              </View>

              <View style={styles.progressBarBg}>
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
        </View>

        {/* Error Banner */}
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <View style={styles.formContainer}>
          {/* STEP 1: Basic Information (Patient or Doctor Step 1) */}
          {(selectedRole === 'patient' || (selectedRole === 'doctor' && doctorStep === 1)) && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Legal Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={18} color="#94A3B8" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder={selectedRole === 'doctor' ? 'Dr. Sarah Smith' : 'Rohan Sharma'}
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={18} color="#94A3B8" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@domain.com"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={18} color="#94A3B8" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="9876543210"
                    placeholderTextColor="#94A3B8"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Create Password (min 6 characters)</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={18} color="#94A3B8" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Create a strong password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
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
              </View>

              {/* Gender Pills */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.genderRow}>
                  {(['Male', 'Female', 'Other'] as const).map((g) => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setGender(g)}
                      style={[
                        styles.genderPill,
                        gender === g && styles.genderPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          gender === g && styles.genderTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* DOCTOR STEP 2: Credentials & Degree */}
          {selectedRole === 'doctor' && doctorStep === 2 && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Primary Medical Degree</Text>
                <View style={styles.pillsScrollRow}>
                  {DEGREES.map((deg) => (
                    <TouchableOpacity
                      key={deg}
                      onPress={() => setDegree(deg)}
                      style={[
                        styles.selectPill,
                        degree === deg && styles.selectPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectPillText,
                          degree === deg && styles.selectPillTextActive,
                        ]}
                      >
                        {deg}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Medical Specialty</Text>
                <View style={styles.pillsWrapRow}>
                  {SPECIALTIES.map((spec) => (
                    <TouchableOpacity
                      key={spec}
                      onPress={() => setSpecialty(spec)}
                      style={[
                        styles.selectPill,
                        specialty === spec && styles.selectPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectPillText,
                          specialty === spec && styles.selectPillTextActive,
                        ]}
                      >
                        {spec}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>NMC / MCI Registration Number</Text>
                <View style={styles.inputWrapper}>
                  <Award size={18} color="#94A3B8" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="MCI-2015-849201"
                    placeholderTextColor="#94A3B8"
                    value={licenseNumber}
                    onChangeText={setLicenseNumber}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Clinical Experience (Years)</Text>
                <View style={styles.inputWrapper}>
                  <Stethoscope size={18} color="#94A3B8" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="8"
                    placeholderTextColor="#94A3B8"
                    value={experienceYears}
                    onChangeText={setExperienceYears}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </>
          )}

          {/* DOCTOR STEP 3: Clinic & Slot Capacity */}
          {selectedRole === 'doctor' && doctorStep === 3 && (
            <>
              <View style={styles.capacityBadge}>
                <CheckCircle2 size={16} color="#00B39B" />
                <Text style={styles.capacityBadgeText}>
                  Default Slot Policy: Max 5 Patients per 30-min OPD slot
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Clinic / Practice Hospital Name</Text>
                <View style={styles.inputWrapper}>
                  <Building2 size={18} color="#94A3B8" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Apollo Medical Centre, Indiranagar"
                    placeholderTextColor="#94A3B8"
                    value={clinicName}
                    onChangeText={setClinicName}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Clinic Address & Locality</Text>
                  <TouchableOpacity
                    onPress={handleDetectClinicLocation}
                    activeOpacity={0.8}
                    style={styles.detectLocationBtn}
                  >
                    {isLocatingClinic ? (
                      <ActivityIndicator size="small" color="#0B3064" />
                    ) : (
                      <>
                        <Navigation size={12} color="#0B3064" />
                        <Text style={styles.detectLocationText}>GPS Auto-Detect</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
                <View style={styles.inputWrapper}>
                  <MapPin size={18} color="#94A3B8" style={styles.inputLeftIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="100 Feet Rd, Indiranagar, Bengaluru"
                    placeholderTextColor="#94A3B8"
                    value={clinicAddress}
                    onChangeText={setClinicAddress}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Standard Consultation Fee (₹)</Text>
                <View style={styles.inputWrapper}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A', marginRight: 6 }}>
                    ₹
                  </Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="750"
                    placeholderTextColor="#94A3B8"
                    value={consultationFee}
                    onChangeText={setConsultationFee}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
            </>
          )}

          {/* Action Buttons */}
          {selectedRole === 'doctor' && doctorStep < 3 ? (
            <View style={styles.stepBtnRow}>
              {doctorStep > 1 && (
                <TouchableOpacity
                  onPress={() => setDoctorStep((s) => (s - 1) as 1 | 2)}
                  style={styles.backStepBtn}
                >
                  <ArrowLeft size={16} color="#0B3064" />
                  <Text style={styles.backStepText}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleNextStep}
                style={[styles.nextStepBtn, doctorStep === 1 && { flex: 1 }]}
              >
                <Text style={styles.nextStepText}>Continue</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleSignup}
              activeOpacity={0.88}
              disabled={loading}
              style={styles.primaryPillBtn}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryPillBtnText}>
                  {selectedRole === 'doctor'
                    ? 'Complete Doctor Registration'
                    : 'Create Patient Account'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* Patient Google OAuth */}
          {selectedRole === 'patient' && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or register with</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                onPress={handleGooglePress}
                activeOpacity={0.85}
                disabled={googleLoading}
                style={styles.googleBtn}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#0B3064" />
                ) : (
                  <View style={styles.googleBtnContent}>
                    <GoogleLogo size={18} />
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </View>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Footer Link */}
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
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 8,
    marginBottom: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00B39B',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    padding: 3,
  },
  sliderTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTabActive: {
    backgroundColor: '#0B3064',
    shadowColor: '#0B3064',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
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
  stepIndicatorCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 12,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00B39B',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00B39B',
    borderRadius: 3,
  },
  errorCard: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 10,
    marginVertical: 8,
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
    marginTop: 4,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
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
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  genderPillActive: {
    borderColor: '#0B3064',
    backgroundColor: '#EFF6FF',
  },
  genderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  genderTextActive: {
    color: '#0B3064',
    fontWeight: '800',
  },
  pillsScrollRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pillsWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  selectPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  selectPillActive: {
    borderColor: '#0B3064',
    backgroundColor: '#EFF6FF',
  },
  selectPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  selectPillTextActive: {
    color: '#0B3064',
    fontWeight: '800',
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 10,
    gap: 8,
  },
  capacityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
    flex: 1,
  },
  detectLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detectLocationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B3064',
  },
  stepBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  backStepBtn: {
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backStepText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B3064',
  },
  nextStepBtn: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0A2540',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  nextStepText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  primaryPillBtn: {
    width: '100%',
    backgroundColor: '#0A2540',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryPillBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 8,
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
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
    paddingTop: 12,
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
