import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShieldCheck } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function VerifyOtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; from?: string }>();
  const { colors } = useAppTheme();

  const email = params.email || 'your email';
  const from = params.from || 'signup';

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const inputRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const focusInput = (idx: number) => {
    if (idx >= 0 && idx < OTP_LENGTH) {
      inputRefs.current[idx]?.focus();
    }
  };

  const handleChange = (text: string, idx: number) => {
    const digits = text.replace(/\D/g, '');
    if (digits.length === 0) {
      const next = [...otp];
      next[idx] = '';
      setOtp(next);
      return;
    }
    const next = [...otp];
    next[idx] = digits[digits.length - 1];
    setOtp(next);
    setError('');
    if (idx < OTP_LENGTH - 1) {
      focusInput(idx + 1);
    }
  };

  const handleKeyPress = (key: string, idx: number) => {
    if (key === 'Backspace' && otp[idx] === '' && idx > 0) {
      const next = [...otp];
      next[idx - 1] = '';
      setOtp(next);
      focusInput(idx - 1);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setError('Please enter the 6-digit code.');
      return;
    }

    setVerifying(true);
    setError('');
    await new Promise((r) => setTimeout(r, 600));
    setVerifying(false);

    if (from === 'reset') {
      router.replace({ pathname: '/(auth)/reset-password', params: { email, code } });
    } else {
      router.replace('/(onboarding)/role-select');
    }
  };

  const handleResend = () => {
    if (seconds > 0) return;
    setSeconds(RESEND_SECONDS);
    setOtp(Array(OTP_LENGTH).fill(''));
    setError('');
    focusInput(0);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <View style={styles.centerContainer}>
            {/* Shield Icon */}
            <View style={[styles.iconWrap, { backgroundColor: colors.backgroundElement }]}>
              <ShieldCheck size={28} color={colors.primary} />
            </View>

            <Text style={[styles.title, Typography.h2, { color: colors.text }]}>Verify your email</Text>
            <Text style={[styles.subhead, Typography.body, { color: colors.textSecondary }]}>
              Enter the 6-digit code we sent to {email}.
            </Text>

            {/* OTP Boxes */}
            <View style={styles.otpRow}>
              {otp.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(ref) => {
                    inputRefs.current[idx] = ref;
                  }}
                  value={digit}
                  onChangeText={(text) => handleChange(text, idx)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, idx)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textContentType="oneTimeCode"
                  style={[
                    styles.otpBox,
                    {
                      borderColor: error ? colors.danger : digit ? colors.primary : colors.border,
                      backgroundColor: colors.card,
                      color: colors.text,
                    },
                  ]}
                  accessibilityLabel={`Digit ${idx + 1}`}
                />
              ))}
            </View>

            {error ? (
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            ) : null}

            <Button
              title={verifying ? 'Verifying...' : 'Verify'}
              onPress={handleVerify}
              loading={verifying}
              variant="primary"
              size="lg"
              fullWidth
            />

            {/* Resend */}
            <View style={styles.resendRow}>
              {seconds > 0 ? (
                <Text style={[styles.resendText, { color: colors.textMuted }]}>
                  Resend code in {seconds}s
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                >
                  <Text style={[styles.resendAction, { color: colors.primary }]}>Resend code</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    letterSpacing: -0.02,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subhead: {
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing['2xl'],
    maxWidth: 300,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  otpBox: {
    width: 48,
    height: 60,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: Spacing.md,
  },
  resendRow: {
    marginTop: Spacing.xl,
  },
  resendText: {
    fontSize: 14,
  },
  resendAction: {
    fontSize: 14,
    fontWeight: '700',
  },
});