import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { User, Mail, Lock, Phone, ArrowLeft, UserCheck, Stethoscope, ShieldCheck, Building2, Award, FileCheck, AlertCircle, ArrowRight } from 'lucide-react-native';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { GoogleAccountPickerModal } from '@/components/auth/GoogleAccountPickerModal';
import { googleAuthService } from '@/services/googleAuth';

const MEDICAL_COUNCILS = [
  'National Medical Commission (NMC) / MCI',
  'Maharashtra Medical Council (MMC)',
  'Delhi Medical Council (DMC)',
  'Karnataka Medical Council (KMC)',
  'Tamil Nadu Medical Council (TNMC)',
  'West Bengal Medical Council',
  'Uttar Pradesh Medical Council',
];

const SPECIALTIES = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Gynecology & Obstetrics',
  'ENT & Head-Neck',
  'Ophthalmology',
  'Psychiatry',
];

export default function SignupScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [role, setRole] = useState<'PATIENT' | 'DOCTOR'>('PATIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEmailCollision, setIsEmailCollision] = useState(false);

  // Doctor Specific Credentials
  const [licenseNumber, setLicenseNumber] = useState('');
  const [registrationAuthority, setRegistrationAuthority] = useState(MEDICAL_COUNCILS[0]);
  const [specialization, setSpecialization] = useState('Cardiology');
  const [qualifications, setQualifications] = useState('');
  const [experienceYears, setExperienceYears] = useState('10');
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [consultationFee, setConsultationFee] = useState('800');

  const handleSafeBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/welcome');
    }
  };

  const handleSignup = async () => {
    setError('');
    setIsEmailCollision(false);

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in your full name, email address, and password.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long for clinical data security.');
      return;
    }

    if (role === 'DOCTOR') {
      if (!licenseNumber.trim()) {
        setError('Please enter your Medical Council Registration / License Number (e.g. MCI-847291).');
        return;
      }
      if (!qualifications.trim()) {
        setError('Please enter your medical qualifications (e.g. MBBS, MD).');
        return;
      }
      if (!clinicName.trim()) {
        setError('Please enter your practice hospital or clinic name.');
        return;
      }
    }

    try {
      setLoading(true);
      const formattedName = role === 'DOCTOR' && !name.trim().toLowerCase().startsWith('dr.')
        ? `Dr. ${name.trim()}`
        : name.trim();

      const doctorFields = role === 'DOCTOR' ? {
        licenseNumber: licenseNumber.trim(),
        registrationAuthority,
        specialization,
        qualifications: qualifications.trim(),
        experienceYears: Number(experienceYears) || 10,
        clinicName: clinicName.trim(),
        clinicAddress: clinicAddress.trim() || 'Medical Enclave, Mumbai',
        consultationFee: Number(consultationFee) || 800,
      } : undefined;

      const session = await authService.registerWithEmail(
        email.trim(),
        password,
        role,
        formattedName,
        doctorFields
      );
      session.phone = phone.trim() || '+91 98765 43210';
      setSession(session);
      router.push('/(auth)/otp');
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (errMsg.toLowerCase().includes('already registered') || err?.code === 'EMAIL_ALREADY_REGISTERED') {
        setIsEmailCollision(true);
        setError('This email is already registered with FiYDoc.');
      } else {
        setError(errMsg || 'Registration failed. Please verify credentials.');
      }
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
        return;
      }
      setGoogleModalVisible(true);
    } catch {
      setGoogleModalVisible(true);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSelectGoogleAccount = async (account: { email: string; name: string }) => {
    setError('');
    const session = await authService.loginWithGoogle(account.email, account.name);
    setSession(session);

    if (session.role === 'doctor') {
      router.replace('/(doctor)/(tabs)/home');
    } else {
      router.replace('/(patient)/(tabs)/home');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: 'space-between' }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <TouchableOpacity
            onPress={handleSafeBack}
            className="w-10 h-10 rounded-2xl bg-slate-100 items-center justify-center -ml-1 mb-3"
          >
            <ArrowLeft size={20} color="#0F172A" />
          </TouchableOpacity>

          <FiYLogo size="lg" />
          <Text className="text-2xl font-black text-slate-900 mt-3">Create Account</Text>
          <Text className="text-xs text-slate-500 font-medium mt-1 mb-4">
            Join FiYDoc to book clinic appointments or manage your verified practice.
          </Text>

          {/* Account Role Selector Tabs */}
          <View className="flex-row bg-slate-100 p-1 rounded-2xl mb-4" style={{ gap: 4 }}>
            <TouchableOpacity
              onPress={() => setRole('PATIENT')}
              activeOpacity={0.8}
              className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${
                role === 'PATIENT' ? 'bg-white shadow-xs' : 'bg-transparent'
              }`}
              style={{ gap: 6 }}
            >
              <UserCheck size={16} color={role === 'PATIENT' ? '#00B39B' : '#64748B'} />
              <Text
                className={`text-xs font-black ${
                  role === 'PATIENT' ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                I'm a Patient
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRole('DOCTOR')}
              activeOpacity={0.8}
              className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${
                role === 'DOCTOR' ? 'bg-white shadow-xs' : 'bg-transparent'
              }`}
              style={{ gap: 6 }}
            >
              <Stethoscope size={16} color={role === 'DOCTOR' ? '#1E58C8' : '#64748B'} />
              <Text
                className={`text-xs font-black ${
                  role === 'DOCTOR' ? 'text-slate-900' : 'text-slate-500'
                }`}
              >
                I'm a Doctor
              </Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View className="bg-red-50 p-3.5 rounded-2xl border border-red-200 mb-4" style={{ gap: 8 }}>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <AlertCircle size={16} color="#DC2626" />
                <Text className="text-xs font-bold text-red-700 flex-1">{error}</Text>
              </View>
              {isEmailCollision && (
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/login')}
                  activeOpacity={0.85}
                  className="bg-red-100 py-2 px-3 rounded-xl flex-row items-center justify-center self-start"
                  style={{ gap: 6 }}
                >
                  <Text className="text-xs font-extrabold text-red-900">Sign In with this email</Text>
                  <ArrowRight size={13} color="#7F1D1D" />
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          {/* Account Basics */}
          <View style={{ gap: 12 }}>
            <Input
              label={role === 'DOCTOR' ? 'Doctor Full Name' : 'Full Name'}
              placeholder={role === 'DOCTOR' ? 'e.g. Dr. Priya Sharma' : 'e.g. Aarav Mehta'}
              value={name}
              onChangeText={setName}
              leftIcon={<User size={16} color="#94A3B8" />}
            />

            <Input
              label="Email Address"
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              leftIcon={<Mail size={16} color="#94A3B8" />}
            />

            <Input
              label="Mobile Number (Optional)"
              placeholder="+91 98765 43210"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              leftIcon={<Phone size={16} color="#94A3B8" />}
            />

            <Input
              label="Password"
              placeholder="At least 8 characters"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              leftIcon={<Lock size={16} color="#94A3B8" />}
            />

            {/* Doctor Credentials Fields */}
            {role === 'DOCTOR' && (
              <View
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: '#E2E8F0',
                  padding: 14,
                  gap: 12,
                  marginTop: 6,
                }}
              >
                <View className="flex-row items-center justify-between pb-1 border-b border-slate-200">
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <ShieldCheck size={16} color="#1E58C8" />
                    <Text className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Medical License & Practice
                    </Text>
                  </View>
                  <View className="bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    <Text className="text-[10px] font-extrabold text-[#1E58C8]">MCI Required</Text>
                  </View>
                </View>

                <Input
                  label="MCI / State Council Registration No."
                  placeholder="e.g. MCI-847291 or MMC/2018/1482"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                  leftIcon={<FileCheck size={16} color="#1E58C8" />}
                />

                {/* Medical Council Picker Chips */}
                <View>
                  <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    State Medical Council / Registry
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row" style={{ gap: 6 }}>
                      {MEDICAL_COUNCILS.map((council) => {
                        const isSel = registrationAuthority === council;
                        return (
                          <TouchableOpacity
                            key={council}
                            onPress={() => setRegistrationAuthority(council)}
                            activeOpacity={0.8}
                            className={`px-3 py-1.5 rounded-xl border ${
                              isSel ? 'bg-[#1E58C8] border-[#1E58C8]' : 'bg-white border-slate-200'
                            }`}
                          >
                            <Text className={`text-xs font-bold ${isSel ? 'text-white' : 'text-slate-700'}`}>
                              {council.split('(')[0].trim()}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                {/* Medical Specialty Carousel */}
                <View>
                  <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Medical Specialization
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row" style={{ gap: 6 }}>
                      {SPECIALTIES.map((spec) => {
                        const isSel = specialization === spec;
                        return (
                          <TouchableOpacity
                            key={spec}
                            onPress={() => setSpecialization(spec)}
                            activeOpacity={0.8}
                            className={`px-3 py-1.5 rounded-xl border ${
                              isSel ? 'bg-[#00B39B] border-[#00B39B]' : 'bg-white border-slate-200'
                            }`}
                          >
                            <Text className={`text-xs font-bold ${isSel ? 'text-white' : 'text-slate-700'}`}>
                              {spec}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>

                <View className="flex-row" style={{ gap: 10 }}>
                  <View className="flex-1">
                    <Input
                      label="Qualifications"
                      placeholder="e.g. MBBS, MD"
                      value={qualifications}
                      onChangeText={setQualifications}
                      leftIcon={<Award size={16} color="#94A3B8" />}
                    />
                  </View>
                  <View style={{ width: 110 }}>
                    <Input
                      label="Exp. (Yrs)"
                      placeholder="12"
                      keyboardType="number-pad"
                      value={experienceYears}
                      onChangeText={setExperienceYears}
                    />
                  </View>
                </View>

                <Input
                  label="Clinic / Practice Name"
                  placeholder="e.g. HeartCare Specialty Clinic"
                  value={clinicName}
                  onChangeText={setClinicName}
                  leftIcon={<Building2 size={16} color="#94A3B8" />}
                />

                <View className="flex-row" style={{ gap: 10 }}>
                  <View className="flex-1">
                    <Input
                      label="Clinic City & Location"
                      placeholder="e.g. Bandra West, Mumbai"
                      value={clinicAddress}
                      onChangeText={setClinicAddress}
                    />
                  </View>
                  <View style={{ width: 130 }}>
                    <Input
                      label="OPD Fee (₹)"
                      placeholder="800"
                      keyboardType="number-pad"
                      value={consultationFee}
                      onChangeText={setConsultationFee}
                    />
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={{ gap: 12, paddingTop: 20, paddingBottom: 6 }}>
          <Button
            title={role === 'DOCTOR' ? 'Verify License & Create Doctor Account' : 'Create Account & Verify'}
            onPress={handleSignup}
            loading={loading}
            variant={role === 'DOCTOR' ? 'primary' : 'teal'}
            size="lg"
            icon={<ShieldCheck size={20} color="#FFFFFF" />}
          />

          {/* Google Sign In Button */}
          <TouchableOpacity
            onPress={handleGooglePress}
            activeOpacity={0.85}
            disabled={googleLoading}
            className="flex-row items-center justify-center bg-white py-3 px-4 rounded-2xl border border-slate-200 shadow-sm"
            style={{ gap: 10 }}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#1E58C8" />
            ) : (
              <GoogleLogo size={18} />
            )}
            <Text className="text-sm font-bold text-slate-800">
              {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center pt-1">
            <Text className="text-xs text-slate-500">Already registered? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text className="text-xs font-bold text-[#1E58C8]">Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Google Account Picker Modal */}
      <GoogleAccountPickerModal
        visible={googleModalVisible}
        onClose={() => setGoogleModalVisible(false)}
        onSelectAccount={handleSelectGoogleAccount}
      />
    </SafeAreaView>
  );
}
