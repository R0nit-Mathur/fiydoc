import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { Mail, Lock, Eye, EyeOff, Zap, UserCheck, Stethoscope, Sparkles } from 'lucide-react-native';
import { authService, UserSession } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { PremadeAuthModal } from '@/components/auth/PremadeAuthModal';
import { googleAuthService } from '@/services/googleAuth';

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  // Role Slider: 'patient' or 'doctor'
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor'>('patient');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [quickAuthVisible, setQuickAuthVisible] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setLoading(true);
      const session = await authService.loginWithEmail(email.trim(), password);
      setSession(session);

      if (session.role === 'doctor') {
        router.replace('/(doctor)/(tabs)/home');
      } else {
        router.replace('/(patient)/(tabs)/home');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticated = (session: UserSession) => {
    setSession(session);
    if (!session.onboardingCompleted) {
      router.replace('/(onboarding)/role-select');
    } else if (session.role === 'doctor') {
      router.replace('/(doctor)/(tabs)/home');
    } else {
      router.replace('/(patient)/(tabs)/home');
    }
  };

  const handleGooglePress = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const session = await googleAuthService.signInWithGoogle();
      if (session) {
        handleAuthenticated(session);
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const setTestAccount = (accountEmail: string, role: 'patient' | 'doctor') => {
    setSelectedRole(role);
    setEmail(accountEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header Section - Optically Centered */}
        <View style={styles.topSection}>
          <FiYLogo size="lg" />

          <View style={styles.badgePill}>
            <Sparkles size={11} color="#00B39B" />
            <Text style={styles.badgeText}>HEALTHCARE CONNECTED</Text>
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Sign in to access your direct appointments & digital prescriptions
          </Text>

          {/* Smooth Role Slider Toggle */}
          <View style={styles.sliderContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                setSelectedRole('patient');
                if (email.includes('doctor')) setEmail('patient@fiydoc.app');
              }}
              style={[
                styles.sliderTab,
                selectedRole === 'patient' && styles.sliderTabActive,
              ]}
            >
              <Text
                style={[
                  styles.sliderText,
                  selectedRole === 'patient' && styles.sliderTextActive,
                ]}
              >
                Patient
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                setSelectedRole('doctor');
                if (email === 'patient@fiydoc.app' || !email) setEmail('rakshit.doctor@fiydoc.app');
              }}
              style={[
                styles.sliderTab,
                selectedRole === 'doctor' && styles.sliderTabActive,
              ]}
            >
              <Text
                style={[
                  styles.sliderText,
                  selectedRole === 'doctor' && styles.sliderTextActive,
                ]}
              >
                Doctor / Clinic
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Error Banner */}
        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Input Form Card */}
        <View style={styles.formContainer}>
          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#94A3B8" style={styles.inputLeftIcon} />
              <TextInput
                style={styles.textInput}
                placeholder={
                  selectedRole === 'doctor'
                    ? 'doctor@fiydoc.app'
                    : 'patient@fiydoc.app'
                }
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (error) setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Password</Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/forgot-password')}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPassText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#94A3B8" style={styles.inputLeftIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (error) setError('');
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.inputRightIcon}
              >
                {showPassword ? (
                  <EyeOff size={18} color="#64748B" />
                ) : (
                  <Eye size={18} color="#64748B" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In Primary CTA */}
          <TouchableOpacity
            onPress={handleLogin}
            activeOpacity={0.88}
            disabled={loading}
            style={styles.signInBtn}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.signInBtnText}>
                {selectedRole === 'doctor' ? 'Sign In as Doctor' : 'Sign In as Patient'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google OAuth Button */}
          <TouchableOpacity
            onPress={handleGooglePress}
            activeOpacity={0.85}
            disabled={googleLoading}
            style={styles.googleBtn}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#0B3064" />
            ) : (
              <View style={styles.googleBtnContent}>
                <GoogleLogo size={18} />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Section: Test Demo Accounts & Register Link */}
        <View style={styles.bottomSection}>
          <View style={styles.demoBar}>
            <Text style={styles.demoTitle}>Quick 1-Tap Login Test Personas</Text>
            <View style={styles.demoBtnsRow}>
              <TouchableOpacity
                onPress={() => setTestAccount('patient@fiydoc.app', 'patient')}
                activeOpacity={0.8}
                style={[
                  styles.demoBtn,
                  selectedRole === 'patient' && styles.demoBtnActive,
                ]}
              >
                <UserCheck size={13} color={selectedRole === 'patient' ? '#00B39B' : '#64748B'} />
                <Text
                  style={[
                    styles.demoBtnText,
                    selectedRole === 'patient' && styles.demoBtnTextActive,
                  ]}
                >
                  Patient (Rohan)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTestAccount('rakshit.doctor@fiydoc.app', 'doctor')}
                activeOpacity={0.8}
                style={[
                  styles.demoBtn,
                  selectedRole === 'doctor' && styles.demoBtnActive,
                ]}
              >
                <Stethoscope size={13} color={selectedRole === 'doctor' ? '#00B39B' : '#64748B'} />
                <Text
                  style={[
                    styles.demoBtnText,
                    selectedRole === 'doctor' && styles.demoBtnTextActive,
                  ]}
                >
                  Doctor (Dr. Sharma)
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setQuickAuthVisible(true)}
              activeOpacity={0.8}
              style={styles.otpBypassBtn}
            >
              <Zap size={13} color="#0B3064" />
              <Text style={styles.otpBypassText}>Supabase Passwordless OTP & More Personas</Text>
            </TouchableOpacity>
          </View>

          {/* Registration Link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.registerLink}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Premade Auth Modal */}
      <PremadeAuthModal
        visible={quickAuthVisible}
        onClose={() => setQuickAuthVisible(false)}
        onAuthenticated={handleAuthenticated}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
    paddingBottom: 4,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 8,
    marginBottom: 10,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00B39B',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  sliderContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    padding: 3,
  },
  sliderTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTabActive: {
    backgroundColor: '#0B3064',
    shadowColor: '#0B3064',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  sliderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  sliderTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  errorCard: {
    width: '100%',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 10,
    marginVertical: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    gap: 14,
    marginTop: 6,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  inputLeftIcon: {
    marginRight: 10,
  },
  inputRightIcon: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  forgotPassText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B3064',
  },
  signInBtn: {
    width: '100%',
    backgroundColor: '#0A2540',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  signInBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  googleBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  googleBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  bottomSection: {
    width: '100%',
    marginTop: 16,
    gap: 12,
  },
  demoBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoBtnsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  demoBtnActive: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  demoBtnTextActive: {
    color: '#00B39B',
    fontWeight: '800',
  },
  otpBypassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 6,
    gap: 6,
  },
  otpBypassText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0B3064',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
  },
  registerText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  registerLink: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B3064',
  },
});
