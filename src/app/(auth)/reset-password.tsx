import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing, Typography } from '@/constants/theme';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; code?: string }>();
  const { colors } = useAppTheme();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setLoading(false);
    setSuccess(true);
    setTimeout(() => router.replace('/(auth)/login'), 1200);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            {success ? (
              <View style={styles.successWrap}>
                <View style={[styles.iconWrap, { backgroundColor: colors.backgroundElement }]}>
                  <CheckCircle2 size={28} color={colors.teal} />
                </View>
                <Text style={[styles.successTitle, Typography.h2, { color: colors.text }]}>
                  Password updated
                </Text>
                <Text style={[styles.successSub, Typography.body, { color: colors.textSecondary }]}>
                  Redirecting you to sign in.
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.title, Typography.h2, { color: colors.text }]}>Set new password</Text>
                <Text style={[styles.subhead, Typography.body, { color: colors.textSecondary }]}>
                  Choose a strong password you have not used on FiYDOC before.
                </Text>

                <View style={styles.formStack}>
                  <Input
                    label="New password"
                    value={password}
                    onChangeText={(t) => { setPassword(t); setError(''); }}
                    placeholder="At least 6 characters"
                    secureTextEntry={!showPassword}
                    autoComplete="password-new"
                    leftIcon={<Lock size={18} color={colors.textMuted} />}
                    rightIcon={
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <EyeOff size={18} color={colors.textMuted} />
                        ) : (
                          <Eye size={18} color={colors.textMuted} />
                        )}
                      </TouchableOpacity>
                    }
                  />

                  <Input
                    label="Confirm password"
                    value={confirm}
                    onChangeText={(t) => { setConfirm(t); setError(''); }}
                    placeholder="Re-enter your password"
                    secureTextEntry={!showPassword}
                    leftIcon={<Lock size={18} color={colors.textMuted} />}
                  />

                  {error ? (
                    <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
                  ) : null}

                  <Button
                    title={loading ? 'Updating...' : 'Update password'}
                    onPress={handleReset}
                    loading={loading}
                    variant="primary"
                    size="lg"
                    fullWidth
                  />
                </View>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  container: {
    width: '100%',
  },
  title: {
    letterSpacing: -0.02,
    marginBottom: Spacing.xs,
  },
  subhead: {
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  formStack: {
    gap: Spacing.md,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  successWrap: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  successTitle: {
    letterSpacing: -0.02,
    marginBottom: Spacing.sm,
  },
  successSub: {
    lineHeight: 22,
  },
});