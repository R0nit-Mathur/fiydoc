import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, HeartPulse, Stethoscope, Sparkles } from 'lucide-react-native';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';

export default function WelcomeScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [loading, setLoading] = React.useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const session = await authService.loginWithGoogle();
      setSession(session);
      router.replace('/(patient)/home');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white justify-between px-6 py-6">
      {/* Header Logo */}
      <View className="items-center pt-4">
        <FiYLogo size="xl" />
        <View className="flex-row items-center bg-teal-50 px-3 py-1 rounded-full mt-3 border border-teal-100">
          <Sparkles size={12} color="#00B39B" />
          <Text className="text-xs font-bold text-[#00B39B] ml-1.5 uppercase tracking-wider">
            Next-Gen Healthcare Platform
          </Text>
        </View>
      </View>

      {/* Hero Illustration / Feature Cards */}
      <View style={{ marginVertical: 24, gap: 14 }}>
        <View className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex-row items-center shadow-sm" style={{ gap: 14 }}>
          <View className="bg-teal-100 p-3 rounded-2xl">
            <Stethoscope size={24} color="#00B39B" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-900">In-Clinic Consultations</Text>
            <Text className="text-xs text-slate-500">Book physical visits with verified top-rated specialists</Text>
          </View>
        </View>

        <View className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex-row items-center shadow-sm" style={{ gap: 14 }}>
          <View className="bg-blue-100 p-3 rounded-2xl">
            <HeartPulse size={24} color="#1E58C8" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-900">AI Health Records & Timeline</Text>
            <Text className="text-xs text-slate-500">Automated document scanning & OCR extraction</Text>
          </View>
        </View>

        <View className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex-row items-center shadow-sm" style={{ gap: 14 }}>
          <View className="bg-emerald-100 p-3 rounded-2xl">
            <ShieldCheck size={24} color="#10B981" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-slate-900">Verified Medical Specialists</Text>
            <Text className="text-xs text-slate-500">100% MCI-accredited doctors across major specialties</Text>
          </View>
        </View>
      </View>

      {/* Auth Actions */}
      <View style={{ gap: 12, paddingBottom: 8 }}>
        <Button
          title="Sign In with Email"
          onPress={() => router.push('/(auth)/login')}
          variant="primary"
          size="lg"
        />

        <TouchableOpacity
          onPress={handleGoogleLogin}
          disabled={loading}
          className="flex-row items-center justify-center bg-slate-100 py-3.5 px-6 rounded-2xl border border-slate-200 active:bg-slate-200"
          style={{ gap: 10 }}
        >
          <Text className="text-base font-bold text-slate-800">
            {loading ? 'Signing in with Google...' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center items-center pt-2">
          <Text className="text-sm text-slate-500">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text className="text-sm font-bold text-[#00B39B]">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
