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
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { authService, UserSession } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { PremadeAuthModal } from '@/components/auth/PremadeAuthModal';
import { googleAuthService } from '@/services/googleAuth';

export default function LoginScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

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
      setError(err.message || 'Login failed. Please check your credentials.');
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header - Centered Logo & Breathing Room */}
        <View style={styles.header}>
          <FiYLogo size="lg" />
          <Text style={styles.title}>Welcome back</Text>

          {/* Minimalist Role Toggle */}
          <View style={styles.roleToggle}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedRole('patient');
                if (email.includes('doctor')) setEmail('');
              }}
              style={[
                styles.roleTab,
                selectedRole === 'patient' && styles.roleTabActive,
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  selectedRole === 'patient' && styles.roleTextActive,
                ]}
              >
                Patient
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setSelectedRole('doctor');
                if (email.includes('patient')) setEmail('');
              }}
              style={[
                styles.roleTab,
                selectedRole === 'doctor' && styles.roleTabActive,
              ]}
            >
              <Text
                style={[
                  styles.roleText,
                  selectedRole === 'doctor' && styles.roleTextActive,
                ]}
              >
                Doctor
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

        {/* Form Inputs */}
        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Mail size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={
                selectedRole === 'doctor' ? 'doctor@fiydoc.app' : 'patient@fiydoc.app'
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

          <View style={styles.inputWrapper}>
            <Lock size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
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
            >
              {showPassword ? (
                <EyeOff size={18} color="#94A3B8" />
              ) : (
                <Eye size={18} color="#94A3B8" />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotBtn}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Primary Action Button */}
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
                Sign In as {selectedRole === 'doctor' ? 'Doctor' : 'Patient'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Google Sign-In */}
          <TouchableOpacity
            onPress={handleGooglePress}
            activeOpacity={0.85}
            disabled={googleLoading}
            style={styles.googleBtn}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#0F172A" />
            ) : (
              <>
                <GoogleLogo size={18} />
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Discreet 1-tap persona testing helper */}
          <TouchableOpacity
            onPress={() => setQuickAuthVisible(true)}
            style={styles.devLink}
          >
            <Text style={styles.devLinkText}>Test Accounts & OTP</Text>
          </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 18,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  roleToggle: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    padding: 3,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTabActive: {
    backgroundColor: '#0F172A',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  roleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '600',
  },
  form: {
    width: '100%',
    gap: 14,
    marginVertical: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#FAFAFA',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0F172A',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  signInBtn: {
    width: '100%',
    backgroundColor: '#0F172A',
    height: 54,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  signInBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  googleBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 52,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  footer: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 16,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  devLink: {
    paddingVertical: 4,
  },
  devLinkText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
});
