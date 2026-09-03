import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';

export default function OtpScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(['1', '2', '3', '4']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 4) {
      setError('Please enter the complete 4-digit OTP.');
      return;
    }

    try {
      setLoading(true);
      await authService.verifyOtp(code);
      const { role, onboardingCompleted } = useAuthStore.getState();
      if (!onboardingCompleted) {
        router.replace('/(onboarding)/role-select');
      } else if (role === 'doctor') {
        router.replace('/(doctor)/home');
      } else {
        router.replace('/(patient)/home');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6 py-4 justify-between">
      <View>
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mb-4 self-start">
          <ArrowLeft size={24} color="#0F172A" />
        </TouchableOpacity>

        <FiYLogo size="lg" />
        <Text className="text-2xl font-black text-slate-900 mt-4">Security Verification</Text>
        <Text className="text-sm text-slate-500 mt-1 mb-6">
          Enter the 4-digit code sent to your registered mobile number / email. Demo code: <Text className="font-bold text-[#00B39B]">1234</Text>
        </Text>

        {error ? (
          <View className="bg-red-50 p-3 rounded-xl border border-red-200 mb-4">
            <Text className="text-xs font-bold text-red-600">{error}</Text>
          </View>
        ) : null}

        <View className="flex-row justify-between" style={{ gap: 12, marginVertical: 24 }}>
          {[0, 1, 2, 3].map((index) => (
            <TextInput
              key={index}
              className="border-2 border-slate-200 focus:border-[#00B39B] rounded-2xl font-black text-slate-900 bg-slate-50"
              style={{
                width: 68,
                height: 68,
                textAlign: 'center',
                textAlignVertical: 'center',
                includeFontPadding: false,
                paddingVertical: 0,
                fontSize: 26,
              }}
              keyboardType="number-pad"
              maxLength={1}
              value={otp[index]}
              onChangeText={(val) => {
                const next = [...otp];
                next[index] = val;
                setOtp(next);
              }}
            />
          ))}
        </View>

        <View className="flex-row justify-center items-center">
          <Text className="text-xs text-slate-500">Didn't receive code? </Text>
          <TouchableOpacity onPress={() => setOtp(['1', '2', '3', '4'])}>
            <Text className="text-xs font-bold text-[#1E58C8]">Resend OTP</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="pb-4">
        <Button
          title="Verify & Continue"
          onPress={handleVerify}
          loading={loading}
          variant="primary"
          size="lg"
          icon={<ShieldCheck size={20} color="#FFFFFF" />}
        />
      </View>
    </SafeAreaView>
  );
}
