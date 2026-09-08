import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { User, Mail, Lock, Eye, EyeOff, UserCheck } from 'lucide-react-native';
import { UniversalTopBar } from '@/components/ui/UniversalTopBar';
import { SegmentedRoleSelector } from '@/components/ui/SegmentedRoleSelector';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { DoctorRegistrationView } from '@/components/doctor/DoctorRegistrationView';
import { authService } from '@/services/authService';
import { googleAuthService } from '@/services/googleAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { StitchColors } from '@/constants/theme';

export default function SignUpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();
  const setSession = useAuthStore((s) => s.setSession);

  const [role, setRole] = useState<'patient' | 'doctor'>(
    params.role === 'doctor' ? 'doctor' : 'patient'
  );
  const [fullName, setFullName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (selected: 'patient' | 'doctor') => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setRole(selected);
    setError('');
  };

  const handleSignUp = async () => {
    setError('');
    if (!fullName.trim() || !contactInfo.trim() || !password.trim()) {
      setError('Please fill in all fields to create your account.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const session = await authService.registerWithEmail(
        contactInfo.trim(),
        password,
        'patient',
        fullName.trim()
      );

      setIsSuccess(true);
      setSession(session);

      setTimeout(() => {
        router.replace('/(patient)/(tabs)/home');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const session = await googleAuthService.signInWithGoogle();
      if (session) {
        setSession(session);
        router.replace('/(patient)/(tabs)/home');
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-up failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Soft Ambient Medical Glow Header Background */}
      <View style={styles.ambientGlowContainer} pointerEvents="none">
        <View style={styles.glowSecondary} />
        <View style={styles.glowPrimary} />
        <View style={styles.glowTertiary} />
      </View>

      {/* Universal Top Navigation Bar */}
      <UniversalTopBar
        onBackPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(auth)/welcome');
          }
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.innerContent}>
          {/* Segmented Role Selector — perfectly consistent across Patient & Doctor */}
          <View style={styles.segmentedControlWrap}>
            <SegmentedRoleSelector
              selectedRole={role}
              onSelectRole={handleRoleSelect}
              patientLabel="Patient"
              doctorLabel="Doctor"
              showIcons
            />
          </View>

          {/* Render based on selected role */}
          {role === 'doctor' ? (
            /* Doctor 3-Step Registration Flow */
            <DoctorRegistrationView showRoleSelector={false} />
          ) : (
            /* Patient Quick Register Flow */
            <>
              {/* Screen Title & Reassuring Intro */}
              <View style={styles.headerTitleWrap}>
                <Text style={styles.headlineTitle}>Create Patient Account</Text>
                <Text style={styles.headlineSubtitle}>
                  One quick step to access instant appointments and your digital health records.
                </Text>
              </View>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Quick Sign-up Form */}
              <View style={styles.formContainer}>
                {/* Full Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <User size={20} color="#737783" style={styles.inputIcon} />
                    <TextInput
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="e.g. Sarah Jenkins"
                      placeholderTextColor="#737783"
                      style={styles.textInput}
                      autoCapitalize="words"
                    />
                  </View>
                </View>

                {/* Mobile Number or Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mobile Number or Email</Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={20} color="#737783" style={styles.inputIcon} />
                    <TextInput
                      value={contactInfo}
                      onChangeText={setContactInfo}
                      placeholder="name@domain.com or phone"
                      placeholderTextColor="#737783"
                      style={styles.textInput}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                {/* Set Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Set Password</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={20} color="#737783" style={styles.inputIcon} />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="At least 8 characters"
                      placeholderTextColor="#737783"
                      style={styles.textInput}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={styles.eyeButton}
                      accessibilityLabel="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff size={20} color="#737783" />
                      ) : (
                        <Eye size={20} color="#737783" />
                      )}
                    </Pressable>
                  </View>
                </View>

                {/* Action Button */}
                <Pressable
                  onPress={handleSignUp}
                  disabled={loading || isSuccess}
                  style={({ pressed }) => [
                    styles.submitButton,
                    isSuccess && styles.submitButtonSuccess,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Create Account"
                >
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.submitButtonText}>Setting up health vault...</Text>
                    </View>
                  ) : isSuccess ? (
                    <View style={styles.loadingRow}>
                      <UserCheck size={20} color="#ffffff" />
                      <Text style={styles.submitButtonText}>Account Ready ✓</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitButtonText}>Create Account</Text>
                  )}
                </Pressable>
              </View>

              {/* Visual Divider & Already Have Account */}
              <View style={styles.signInPromptRow}>
                <Text style={styles.promptText}>Already have an account?</Text>
                <Pressable
                  onPress={() => router.push('/(auth)/login')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.signInLinkText}>Sign In</Text>
                </Pressable>
              </View>

              <View style={styles.fastTrackDivider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or fast track</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Sign In Option */}
              <Pressable
                onPress={handleGoogleSignUp}
                disabled={googleLoading}
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color={StitchColors.primary} />
                ) : (
                  <>
                    <GoogleLogo size={20} />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </Pressable>

              {/* Footer Privacy and Sign-In Link */}
              <View style={styles.footerWrap}>
                <Text style={styles.footerLegalText}>
                  By creating an account, you agree to FiYDOC's{' '}
                  <Text style={styles.legalHighlight}>Terms</Text> &{' '}
                  <Text style={styles.legalHighlight}>Privacy</Text>.
                </Text>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: StitchColors.surface,
  },
  ambientGlowContainer: {
    ...StyleSheet.absoluteFill,
    height: 380,
    overflow: 'hidden',
    zIndex: -1,
  },
  glowSecondary: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(118, 244, 224, 0.25)',
    ...Platform.select({
      web: { filter: 'blur(64px)' },
    }),
  },
  glowPrimary: {
    position: 'absolute',
    top: -70,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(216, 226, 255, 0.35)',
    ...Platform.select({
      web: { filter: 'blur(64px)' },
    }),
  },
  glowTertiary: {
    position: 'absolute',
    top: 50,
    left: '25%',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(196, 231, 255, 0.25)',
    ...Platform.select({
      web: { filter: 'blur(48px)' },
    }),
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 36,
  },
  innerContent: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  segmentedControlWrap: {
    marginBottom: 16,
  },
  headerTitleWrap: {
    marginBottom: 20,
  },
  headlineTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: StitchColors.onSurface,
    letterSpacing: -0.5,
  },
  headlineSubtitle: {
    fontSize: 14,
    color: StitchColors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 20,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    textAlign: 'center',
  },
  formContainer: {
    gap: 14,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: StitchColors.onSurfaceVariant,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#002350',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0, 35, 80, 0.04)',
      },
    }),
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: StitchColors.onSurface,
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  submitButton: {
    marginTop: 8,
    width: '100%',
    height: 54,
    borderRadius: 9999,
    backgroundColor: StitchColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: StitchColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 14px rgba(0, 57, 126, 0.32)',
      },
    }),
  },
  submitButtonSuccess: {
    backgroundColor: StitchColors.secondary,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signInPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 6,
    gap: 4,
  },
  promptText: {
    fontSize: 14,
    color: StitchColors.onSurfaceVariant,
  },
  signInLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  fastTrackDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: StitchColors.surfaceContainerHighest,
  },
  dividerText: {
    paddingHorizontal: 12,
    fontSize: 11,
    fontWeight: '600',
    color: StitchColors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  googleButton: {
    width: '100%',
    height: 54,
    borderRadius: 9999,
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: StitchColors.onSurface,
  },
  footerWrap: {
    marginTop: 26,
    alignItems: 'center',
  },
  footerLegalText: {
    fontSize: 12,
    color: StitchColors.onSurfaceVariant,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  legalHighlight: {
    color: StitchColors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});