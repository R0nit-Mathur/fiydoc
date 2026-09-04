import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { Button } from '@/components/ui/Button';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { ShieldCheck, HeartPulse, Stethoscope, Sparkles } from 'lucide-react-native';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { GoogleAccountPickerModal } from '@/components/auth/GoogleAccountPickerModal';

export default function WelcomeScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [googleModalVisible, setGoogleModalVisible] = useState(false);

  const handleSelectGoogleAccount = async (account: { email: string; name: string }) => {
    const session = await authService.loginWithGoogle(account.email, account.name);
    setSession(session);
    if (session.role === 'doctor') {
      router.replace('/(doctor)/home');
    } else {
      router.replace('/(patient)/home');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: 'space-between' }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Logo */}
        <View className="items-center pt-2">
          <FiYLogo size="xl" />
          <View className="flex-row items-center bg-teal-50 px-3 py-1 rounded-full mt-3 border border-teal-100">
            <Sparkles size={12} color="#00B39B" />
            <Text className="text-[11px] font-extrabold text-[#00B39B] ml-1.5 uppercase tracking-wider">
              Next-Gen Healthcare Platform
            </Text>
          </View>
        </View>

        {/* Hero Feature Cards */}
        <View style={{ marginVertical: 20, gap: 12 }}>
          <View className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-100 flex-row items-center shadow-xs" style={{ gap: 12 }}>
            <View className="bg-teal-100 p-2.5 rounded-xl">
              <Stethoscope size={22} color="#00B39B" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-black text-slate-900">In-Clinic Consultations</Text>
              <Text className="text-xs text-slate-500 font-medium mt-0.5">
                Book physical visits with verified top-rated specialists
              </Text>
            </View>
          </View>

          <View className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-100 flex-row items-center shadow-xs" style={{ gap: 12 }}>
            <View className="bg-blue-100 p-2.5 rounded-xl">
              <HeartPulse size={22} color="#1E58C8" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-black text-slate-900">AI Health Records & Timeline</Text>
              <Text className="text-xs text-slate-500 font-medium mt-0.5">
                Automated document scanning & OCR extraction
              </Text>
            </View>
          </View>

          <View className="bg-slate-50/90 p-3.5 rounded-2xl border border-slate-100 flex-row items-center shadow-xs" style={{ gap: 12 }}>
            <View className="bg-emerald-100 p-2.5 rounded-xl">
              <ShieldCheck size={22} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-black text-slate-900">Verified Medical Specialists</Text>
              <Text className="text-xs text-slate-500 font-medium mt-0.5">
                100% MCI-accredited doctors across major specialties
              </Text>
            </View>
          </View>
        </View>

        {/* Auth Actions */}
        <View style={{ gap: 12, paddingBottom: 6 }}>
          <Button
            title="Sign In with Email"
            onPress={() => router.push('/(auth)/login')}
            variant="primary"
            size="lg"
          />

          <TouchableOpacity
            onPress={() => setGoogleModalVisible(true)}
            activeOpacity={0.85}
            className="flex-row items-center justify-center bg-white py-3 px-4 rounded-2xl border border-slate-200 shadow-sm"
            style={{ gap: 10 }}
          >
            <GoogleLogo size={18} />
            <Text className="text-sm font-bold text-slate-800">
              Continue with Google
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center pt-1">
            <Text className="text-xs text-slate-500">Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text className="text-xs font-bold text-[#00B39B]">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Interactive Google Account Picker Modal */}
      <GoogleAccountPickerModal
        visible={googleModalVisible}
        onClose={() => setGoogleModalVisible(false)}
        onSelectAccount={handleSelectGoogleAccount}
      />
    </SafeAreaView>
  );
}
