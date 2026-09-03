import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { Button } from '@/components/ui/Button';
import { UserCheck, Stethoscope, CheckCircle2, ArrowRight } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';

export default function RoleSelectScreen() {
  const router = useRouter();
  const { setRole } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor'>('patient');

  const handleContinue = () => {
    setRole(selectedRole);
    if (selectedRole === 'patient') {
      router.push('/(onboarding)/patient-setup');
    } else {
      router.push('/(onboarding)/doctor-setup');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6 py-4 justify-between">
      <View>
        <View className="items-center py-4">
          <FiYLogo size="xl" />
        </View>

        <Text className="text-2xl font-black text-slate-900 text-center mt-2">
          Choose Your Account Role
        </Text>
        <Text className="text-sm text-slate-500 text-center mt-1 mb-8">
          Select how you will be using FiYDoc. Your dashboard and clinical tools will be tailored accordingly.
        </Text>

        <View className="space-y-4">
          {/* Patient Card */}
          <TouchableOpacity
            onPress={() => setSelectedRole('patient')}
            activeOpacity={0.9}
            className={`p-5 rounded-3xl border-2 flex-row items-center space-x-4 ${
              selectedRole === 'patient'
                ? 'border-[#00B39B] bg-teal-50/60 shadow-md'
                : 'border-slate-200 bg-white'
            }`}
          >
            <View className="w-14 h-14 rounded-2xl bg-teal-100 items-center justify-center">
              <UserCheck size={28} color="#00B39B" />
            </View>

            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-slate-900">I am a Patient</Text>
                {selectedRole === 'patient' && <CheckCircle2 size={20} color="#00B39B" fill="#00B39B" />}
              </View>
              <Text className="text-xs text-slate-500 mt-1">
                Book consultations, order medicines, access OCR health reports, and manage family health history.
              </Text>
            </View>
          </TouchableOpacity>

          {/* Doctor Card */}
          <TouchableOpacity
            onPress={() => setSelectedRole('doctor')}
            activeOpacity={0.9}
            className={`p-5 rounded-3xl border-2 flex-row items-center space-x-4 ${
              selectedRole === 'doctor'
                ? 'border-[#1E58C8] bg-blue-50/60 shadow-md'
                : 'border-slate-200 bg-white'
            }`}
          >
            <View className="w-14 h-14 rounded-2xl bg-blue-100 items-center justify-center">
              <Stethoscope size={28} color="#1E58C8" />
            </View>

            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-slate-900">I am a Doctor / Practitioner</Text>
                {selectedRole === 'doctor' && <CheckCircle2 size={20} color="#1E58C8" fill="#1E58C8" />}
              </View>
              <Text className="text-xs text-slate-500 mt-1">
                Manage appointment queues, write digital prescriptions, 3D anatomical region annotations, & verification setup.
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View className="pb-4">
        <Button
          title={`Continue as ${selectedRole === 'patient' ? 'Patient' : 'Doctor'}`}
          onPress={handleContinue}
          variant={selectedRole === 'patient' ? 'teal' : 'primary'}
          size="lg"
          icon={<ArrowRight size={20} color="#FFFFFF" />}
        />
      </View>
    </SafeAreaView>
  );
}
