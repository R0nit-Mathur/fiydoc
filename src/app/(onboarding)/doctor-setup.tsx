import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Stethoscope, Award, FileCheck, CheckCircle2 } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';

export default function DoctorSetupScreen() {
  const router = useRouter();
  const { user, setSession, setOnboardingCompleted, setVerificationStatus } = useAuthStore();

  const [specialty, setSpecialty] = useState('Cardiology');
  const [qualification, setQualification] = useState('MD, DM (Cardiology)');
  const [licenseNumber, setLicenseNumber] = useState('MCI-884920-A');
  const [hospital, setHospital] = useState('Metro Heart Institute');
  const [fee, setFee] = useState('750');

  const handleFinish = () => {
    if (user) {
      setSession({
        ...user,
        name: user.name?.startsWith('Dr.') ? user.name : `Dr. ${user.name}`,
        role: 'doctor',
        onboardingCompleted: true,
        verificationStatus: 'verified',
        specialty,
        qualification,
        licenseNumber,
        hospital,
        consultationFee: fee,
      } as any);
    } else {
      setOnboardingCompleted(true);
      setVerificationStatus('verified');
    }
    router.replace('/(doctor)/(tabs)/home');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="px-6 py-4 flex-grow justify-between">
        <View>
          <View className="flex-row items-center justify-between mb-2">
            <View className="bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              <Text className="text-xs font-bold text-[#1E58C8]">Step 2 of 2: Medical Credentials</Text>
            </View>
          </View>

          <Text className="text-2xl font-black text-slate-900 mt-2">Clinical Verification Setup</Text>
          <Text className="text-sm text-slate-500 mt-1 mb-6">
            Enter your medical registration details to activate your consultation workspace.
          </Text>

          <View className="space-y-4">
            <Input
              label="Medical Registration / License Number"
              placeholder="e.g. MCI-884920-A"
              value={licenseNumber}
              onChangeText={setLicenseNumber}
              leftIcon={<FileCheck size={18} color="#94A3B8" />}
            />

            <Input
              label="Primary Specialty"
              placeholder="e.g. Cardiology, Dermatology, Pediatrics"
              value={specialty}
              onChangeText={setSpecialty}
              leftIcon={<Stethoscope size={18} color="#94A3B8" />}
            />

            <Input
              label="Qualifications & Degrees"
              placeholder="e.g. MD, DM, FACC"
              value={qualification}
              onChangeText={setQualification}
              leftIcon={<Award size={18} color="#94A3B8" />}
            />

            <Input
              label="Affiliated Hospital / Clinic Name"
              placeholder="e.g. Metro Heart Institute"
              value={hospital}
              onChangeText={setHospital}
            />

            <Input
              label="Default Consultation Fee (₹)"
              placeholder="750"
              keyboardType="number-pad"
              value={fee}
              onChangeText={setFee}
            />
          </View>
        </View>

        <View className="pt-6 pb-4">
          <Button
            title="Submit Credentials & Launch Workspace"
            onPress={handleFinish}
            variant="primary"
            size="lg"
            icon={<CheckCircle2 size={20} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
