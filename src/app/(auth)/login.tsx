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
import { Mail, Lock, Eye, EyeOff, Zap, UserCheck, Stethoscope } from 'lucide-react-native';
import { authService, UserSession } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { PremadeAuthModal } from '@/components/auth/PremadeAuthModal';
import { googleAuthService } from '@/services/googleAuth';

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  // Role Slider: 'patient' or 'doctor' (as in Screenshot 2)
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
        <View style={styles.topSection}>
          {/* Official Brand Logo */}
          <View style={styles.logoWrapper}>
            <FiYLogo size="xl" />
          </View>

          {/* Heading & Subtitle */}
          <Text style={styles.title}>Welcome to FIYDOC</Text>
          <Text style={styles.subtitle}>
            Sign in to access your consultations & appointments
          </Text>

          {/* Role Slider Toggle (Screenshot 2) */}
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
                Patient Login
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
                Doctor Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Clean Input Fields with Icons */}
          <View style={styles.formContainer}>
            {/* Email Field */}
            <View style={styles.inputWrapper}>
              <Mail size={18} color="#0B3064" style={styles.inputLeftIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Email Address"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password Field */}
            <View style={styles.inputWrapper}>
              <Lock size={18} color="#0B3064" style={styles.inputLeftIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
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

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPassBtn}
            >
              <Text style={styles.forgotPassText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Main Sign In Button */}
          <TouchableOpacity
            onPress={handleLogin}
            activeOpacity={0.88}
            disabled={loading}
            style={styles.signInBtn}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.signInBtnText}>
                {selectedRole === 'doctor' ? 'Sign In as Doctor' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {/* OR Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Continue with Google */}
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

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Quick Demo Credentials Bar */}
          <View style={styles.demoBar}>
            <Text style={styles.demoTitle}>Quick Test Credentials:</Text>
            <View style={styles.demoBtnsRow}>
              <TouchableOpacity
                onPress={() => setTestAccount('patient@fiydoc.app', 'patient')}
                style={styles.demoBtn}
              >
                <UserCheck size={12} color="#00B39B" />
                <Text style={styles.demoBtnText}>Patient</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setTestAccount('rakshit.doctor@fiydoc.app', 'doctor')}
                style={styles.demoBtn}
              >
                <Stethoscope size={12} color="#0B3064" />
                <Text style={styles.demoBtnText}>Dr. Rakshit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setQuickAuthVisible(true)}
                style={[styles.demoBtn, { backgroundColor: '#EFF6FF' }]}
              >
                <Zap size={12} color="#1E58C8" />
                <Text style={[styles.demoBtnText, { color: '#1E58C8' }]}>Personas</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.registerRow}>
            <Text style={styles.registerText}>New to FIYDOC? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.registerLink}>Register Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Premade Personas & Supabase OTP Modal */}
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
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  topSection: {
    alignItems: 'center',
    width: '100%',
  },
  logoWrapper: {
    marginTop: 12,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0A2540',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  sliderContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    padding: 4,
    width: '100%',
    marginBottom: 22,
  },
  sliderTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderTabActive: {
    backgroundColor: '#0B3064',
    shadowColor: '#0B3064',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
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
    padding: 12,
    marginBottom: 16,
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
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#0B3064',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 54,
    backgroundColor: '#FFFFFF',
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
  forgotPassBtn: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotPassText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0B3064',
  },
  signInBtn: {
    width: '100%',
    backgroundColor: '#0B3064',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    shadowColor: '#0B3064',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
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
    marginVertical: 18,
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
    borderWidth: 1.5,
    borderColor: '#0B3064',
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
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
    marginTop: 20,
    gap: 12,
  },
  demoBar: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  demoTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  demoBtnsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
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
