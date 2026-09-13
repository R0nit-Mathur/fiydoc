import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { authService } from '@/services/authService';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing, Typography } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    try {
      setError('');
      setLoading(true);
      const res = await authService.requestPasswordReset(email);
      setSuccessMessage(res.message);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to send password recovery instructions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>

          {/* Title */}
          <View style={styles.header}>
            <Text style={[styles.title, Typography.h2, { color: colors.text }]}>Reset password</Text>
            <Text style={[styles.subtitle, Typography.body, { color: colors.textSecondary }]}>
              Enter your registered email address and we will send you official password reset instructions.
            </Text>
          </View>

          {submitted ? (
            <View style={{ backgroundColor: colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
              <Text style={{ color: colors.teal, fontWeight: '600', fontSize: 16, marginBottom: 8 }}>Recovery Instructions Dispatched</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20 }}>{successMessage}</Text>
            </View>
          ) : (
            <>
              {/* Email Input */}
              <Input
                label="Email Address"
                placeholder="name@example.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
                error={error}
                autoCapitalize="none"
                keyboardType="email-address"
                leftIcon={<Mail size={18} color={colors.textMuted} />}
              />

              {error ? (
                <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footerWrap}>
        <Button
          title={submitted ? "Resend Instructions" : "Send Recovery Instructions"}
          onPress={handleReset}
          loading={loading}
          variant="primary"
          size="lg"
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  container: {
    width: '100%',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    letterSpacing: -0.02,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    lineHeight: 22,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footerWrap: {
    width: '100%',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
});