import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';

export default function OtpScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const setOnboardingCompleted = useAuthStore((s) => s.setOnboardingCompleted);

  const handleOtpChange = (val: string, index: number) => {
    setError('');

    // Handle paste of full 4-digit code
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, 4).split('');
      const nextOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 4) nextOtp[i] = d;
      });
      setOtp(nextOtp);
      const nextFocus = Math.min(digits.length, 3);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const next = [...otp];
    next[index] = val;
    setOtp(next);

    // Auto-advance to next box
    if (val && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleAutoFill = () => {
    setOtp(['1', '2', '3', '4']);
    setError('');
    inputRefs.current[3]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 4) {
      setError('Please enter the full 4-digit verification code.');
      return;
    }

    try {
      setLoading(true);
      await authService.verifyOtp(code);
      setOnboardingCompleted(true);

      const { role } = useAuthStore.getState();
      if (role === 'doctor') {
        router.replace('/(doctor)/home');
      } else {
        router.replace('/(patient)/home');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Use demo code 1234.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6 py-4 justify-between" edges={['top']}>
      <View>
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-slate-100 items-center justify-center -ml-1 mb-4"
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>

        <FiYLogo size="lg" />
        <Text className="text-2xl font-black text-slate-900 mt-4">Security Verification</Text>
        <Text className="text-xs text-slate-500 font-medium mt-1 mb-6 leading-5">
          Enter the 4-digit code sent to your mobile or email. Demo code:{' '}
          <Text className="font-extrabold text-[#00B39B]">1234</Text>
        </Text>

        {error ? (
          <View className="bg-red-50 p-3 rounded-2xl border border-red-200 mb-4">
            <Text className="text-xs font-bold text-red-600">{error}</Text>
          </View>
        ) : null}

        {/* 4-Box OTP Input Array */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginVertical: 20 }}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = Boolean(otp[index]);
            const isCurrent = focusedIndex === index;

            return (
              <View
                key={index}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  maxWidth: 68,
                  backgroundColor: isCurrent ? '#FFFFFF' : 'rgba(248, 250, 252, 0.95)',
                  borderWidth: 2,
                  borderColor: isCurrent ? '#00B39B' : isFilled ? '#A7F3D0' : '#E2E8F0',
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#00B39B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isCurrent ? 0.15 : 0,
                  shadowRadius: 8,
                }}
              >
                <TextInput
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  keyboardType="number-pad"
                  maxLength={Platform.OS === 'ios' ? 4 : 1}
                  selectTextOnFocus
                  value={otp[index]}
                  onChangeText={(val) => handleOtpChange(val, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  onFocus={() => setFocusedIndex(index)}
                  style={{
                    width: '100%',
                    height: '100%',
                    textAlign: 'center',
                    textAlignVertical: 'center',
                    includeFontPadding: false,
                    paddingVertical: 0,
                    margin: 0,
                    fontSize: 24,
                    fontWeight: '900',
                    color: '#0F172A',
                  }}
                />
              </View>
            );
          })}
        </View>

        {/* Quick Auto-Fill Chip */}
        <View className="flex-row justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-200/80 mb-4">
          <View className="flex-row items-center" style={{ gap: 6 }}>
            <Sparkles size={16} color="#00B39B" />
            <Text className="text-xs font-bold text-slate-700">Quick Test Code: 1234</Text>
          </View>
          <TouchableOpacity
            onPress={handleAutoFill}
            activeOpacity={0.8}
            className="bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200"
          >
            <Text className="text-xs font-black text-[#00B39B]">Auto-Fill</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center items-center pt-2">
          <Text className="text-xs text-slate-500">Didn't receive code? </Text>
          <TouchableOpacity onPress={handleAutoFill}>
            <Text className="text-xs font-bold text-[#1E58C8]">Resend OTP</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="pb-4">
        <Button
          title="Verify & Continue"
          onPress={handleVerify}
          loading={loading}
          variant="teal"
          size="lg"
          icon={<ShieldCheck size={20} color="#FFFFFF" />}
        />
      </View>
    </SafeAreaView>
  );
}
