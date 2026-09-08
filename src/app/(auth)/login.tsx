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
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Award,
  Check,
} from 'lucide-react-native';
import { UniversalTopBar } from '@/components/ui/UniversalTopBar';
import { SegmentedRoleSelector } from '@/components/ui/SegmentedRoleSelector';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { authService } from '@/services/authService';
import { googleAuthService } from '@/services/googleAuth';
import { useAuthStore } from '@/store/useAuthStore';
import { StitchColors } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [doctorLicense, setDoctorLicense] = useState('');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleChange = (newRole: 'patient' | 'doctor') => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setRole(newRole);
    setError('');
  };

  const toggleAuthMode = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (!isSignUpMode && role === 'doctor') {
      router.push('/(onboarding)/doctor-setup');
    } else if (!isSignUpMode && role === 'patient') {
      router.push('/(auth)/signup');
    } else {
      setIsSignUpMode(!isSignUpMode);
    }
  };

  const handleAuth = async () => {
    setError('');
    if (!identity.trim() || !password.trim()) {
      setError('Please enter both identity and password.');
      return;
    }

    try {
      setLoading(true);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const session = await authService.loginWithEmail(identity.trim(), password);
      setSession(session);

      if (session.role === 'doctor') {
        router.replace('/(doctor)/(tabs)/home');
      } else {
        router.replace('/(patient)/(tabs)/home');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      const session = await googleAuthService.signInWithGoogle();
      if (session) {
        setSession(session);
        if (session.role === 'doctor') {
          router.replace('/(doctor)/(tabs)/home');
        } else {
          router.replace('/(patient)/(tabs)/home');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Universal Top Navigation & Subtle Brand Bar */}
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
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.heading}>
              {isSignUpMode ? 'Join FiYDOC' : 'Welcome Back'}
            </Text>
            <Text style={styles.subheading}>
              {isSignUpMode
                ? 'Connect with top-rated medical specialists in your network today.'
                : 'Sign in to access your consultations, digital prescriptions, and health vault.'}
            </Text>
          </View>

          {/* Apple Native Segmented Control */}
          <View style={styles.segmentedControlWrap}>
            <SegmentedRoleSelector
              selectedRole={role}
              onSelectRole={handleRoleChange}
              patientLabel="Patient"
              doctorLabel="Doctor"
              showIcons
            />
          </View>

          {/* Practitioner Notice Banner (Doctor mode dynamic reveal) */}
          {role === 'doctor' && (
            <View style={styles.doctorBanner}>
              <View style={styles.doctorBannerIconBox}>
                <ShieldCheck size={20} color="#ffffff" strokeWidth={2.2} />
              </View>
              <View style={styles.doctorBannerTextBox}>
                <Text style={styles.doctorBannerTitle}>Verified Medical Portal</Text>
                <Text style={styles.doctorBannerDesc}>
                  Please provide your authorized license identifier or registered provider credentials.
                </Text>
              </View>
            </View>
          )}

          {/* Primary Interactive Card */}
          <View style={styles.interactiveCard}>
            {/* Fast Social Identity CTA */}
            <Pressable
              onPress={handleGoogleAuth}
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

            {/* Subtle Clean Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign in with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Auth Form */}
            <View style={styles.formContainer}>
              {/* Doctor License Registration Field (Shown for Doctor) */}
              {role === 'doctor' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Medical License / NPI Number</Text>
                  <View style={styles.inputWrapper}>
                    <Award size={19} color="#737783" style={styles.inputIcon} />
                    <TextInput
                      value={doctorLicense}
                      onChangeText={setDoctorLicense}
                      placeholder="e.g. MED-849201-US"
                      placeholderTextColor="#737783"
                      style={styles.textInput}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
              )}

              {/* Identity Field (Email or Mobile) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  {role === 'doctor' ? 'Medical Provider Email' : 'Email or Mobile Number'}
                </Text>
                <View style={styles.inputWrapper}>
                  <Mail size={19} color="#737783" style={styles.inputIcon} />
                  <TextInput
                    value={identity}
                    onChangeText={setIdentity}
                    placeholder="name@domain.com"
                    placeholderTextColor="#737783"
                    style={styles.textInput}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Field */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <Pressable
                    onPress={() => router.push('/(auth)/forgot-password')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </Pressable>
                </View>
                <View style={styles.inputWrapper}>
                  <Lock size={19} color="#737783" style={styles.inputIcon} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter secure password"
                    placeholderTextColor="#737783"
                    style={styles.textInput}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.eyeButton}
                  >
                    {showPassword ? (
                      <EyeOff size={19} color="#737783" />
                    ) : (
                      <Eye size={19} color="#737783" />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Preferences & Session row */}
              <Pressable
                onPress={() => setRememberDevice(!rememberDevice)}
                style={styles.rememberRow}
              >
                <View
                  style={[
                    styles.checkbox,
                    rememberDevice && styles.checkboxChecked,
                  ]}
                >
                  {rememberDevice && <Check size={13} color="#ffffff" strokeWidth={3} />}
                </View>
                <Text style={styles.rememberText}>Remember this device</Text>
              </Pressable>

              {/* Action Button */}
              <Pressable
                onPress={handleAuth}
                disabled={loading}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Sign In to Care Portal"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>
                      {isSignUpMode ? 'Create Free Account' : 'Sign In to Care Portal'}
                    </Text>
                    <ArrowRight size={18} color="#ffffff" strokeWidth={2.4} />
                  </>
                )}
              </Pressable>
            </View>
          </View>

          {/* Sign Up Toggle Footer */}
          <View style={styles.footerSection}>
            <View style={styles.togglePromptRow}>
              <Text style={styles.promptText}>
                {isSignUpMode ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <Pressable onPress={toggleAuthMode} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.promptLink}>
                  {isSignUpMode ? 'Sign in' : 'Create an account'}
                </Text>
              </Pressable>
            </View>

            <View style={styles.legalLinksRow}>
              <Text style={styles.legalLinkText}>Privacy Policy</Text>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.legalLinkText}>Terms of Care</Text>
              <Text style={styles.bulletDot}>•</Text>
              <Text style={styles.legalLinkText}>HIPAA Compliance</Text>
            </View>
          </View>
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
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  innerContent: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  headerSection: {
    alignItems: 'center',
    marginVertical: 14,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: StitchColors.onSurface,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    color: StitchColors.onSurfaceVariant,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 20,
  },
  segmentedControlWrap: {
    marginBottom: 16,
  },
  doctorBanner: {
    backgroundColor: StitchColors.surfaceContainerLow,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(218, 226, 253, 0.6)',
  },
  doctorBannerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: StitchColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  doctorBannerTextBox: {
    flex: 1,
  },
  doctorBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  doctorBannerDesc: {
    fontSize: 12,
    color: StitchColors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
  interactiveCard: {
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#002350',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 35, 80, 0.05)',
      },
    }),
  },
  googleButton: {
    width: '100%',
    height: 48,
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 14,
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
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: StitchColors.onSurface,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: StitchColors.surfaceVariant,
  },
  dividerText: {
    paddingHorizontal: 10,
    fontSize: 11,
    fontWeight: '600',
    color: StitchColors.outline,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    textAlign: 'center',
  },
  formContainer: {
    gap: 12,
  },
  inputGroup: {
    gap: 5,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: StitchColors.onSurfaceVariant,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '600',
    color: StitchColors.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: StitchColors.surfaceContainerLow,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputIcon: {
    marginRight: 8,
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
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: StitchColors.secondary,
    borderColor: StitchColors.secondary,
  },
  rememberText: {
    fontSize: 13,
    color: StitchColors.onSurfaceVariant,
  },
  submitButton: {
    marginTop: 6,
    width: '100%',
    height: 50,
    borderRadius: 9999,
    backgroundColor: StitchColors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: StitchColors.primaryContainer,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 14px rgba(20, 80, 163, 0.28)',
      },
    }),
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  footerSection: {
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  togglePromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: {
    fontSize: 14,
    color: StitchColors.onSurfaceVariant,
  },
  promptLink: {
    fontSize: 14,
    fontWeight: '700',
    color: StitchColors.primary,
    marginLeft: 6,
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  legalLinkText: {
    fontSize: 11,
    color: StitchColors.outline,
    fontWeight: '500',
  },
  bulletDot: {
    color: StitchColors.outline,
    fontSize: 11,
  },
});
