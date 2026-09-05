import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { ShieldCheck, HeartPulse, Stethoscope, ArrowRight, Zap, CheckCircle2, Sparkles } from 'lucide-react-native';
import { authService, UserSession } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { PremadeAuthModal } from '@/components/auth/PremadeAuthModal';
import { googleAuthService } from '@/services/googleAuth';

export default function WelcomeScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [quickAuthVisible, setQuickAuthVisible] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState('');

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
    setAuthError('');
    setGoogleLoading(true);
    try {
      const session = await googleAuthService.signInWithGoogle();
      if (session) {
        handleAuthenticated(session);
        return;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Google Sign-In failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header - Optically Centered Logo */}
        <View style={styles.headerSection}>
          <FiYLogo size="lg" />
          <View style={styles.badgePill}>
            <Sparkles size={12} color="#00B39B" />
            <Text style={styles.badgeText}>CARE MADE SIMPLE</Text>
          </View>
        </View>

        {/* Hero Visual Card (Inspired by Reference Images 1, 2, 3) */}
        <View style={styles.heroCard}>
          <View style={styles.organRow}>
            <View style={[styles.organBubble, { backgroundColor: '#EFF6FF' }]}>
              <Text style={{ fontSize: 24 }}>🧠</Text>
            </View>
            <View style={[styles.organBubble, { backgroundColor: '#FEF2F2' }]}>
              <Text style={{ fontSize: 24 }}>❤️</Text>
            </View>
            <View style={[styles.organBubble, { backgroundColor: '#F0FDF4', transform: [{ scale: 1.15 }] }]}>
              <Text style={{ fontSize: 28 }}>🩺</Text>
            </View>
            <View style={[styles.organBubble, { backgroundColor: '#F5F3FF' }]}>
              <Text style={{ fontSize: 24 }}>🫁</Text>
            </View>
            <View style={[styles.organBubble, { backgroundColor: '#FFFBEB' }]}>
              <Text style={{ fontSize: 24 }}>💊</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Your Health, Connected</Text>
          <Text style={styles.heroSubtitle}>
            Direct electronic connection between patients and verified doctors. Book OPD appointments in seconds and receive your digital prescriptions on your app.
          </Text>

          {/* Feature Highlights */}
          <View style={styles.featureChipsRow}>
            <View style={styles.featureChip}>
              <CheckCircle2 size={13} color="#00B39B" />
              <Text style={styles.featureChipText}>1-Screen Booking</Text>
            </View>
            <View style={styles.featureChip}>
              <CheckCircle2 size={13} color="#00B39B" />
              <Text style={styles.featureChipText}>Digital Rx in App</Text>
            </View>
            <View style={styles.featureChip}>
              <CheckCircle2 size={13} color="#00B39B" />
              <Text style={styles.featureChipText}>No Marketplace Clutter</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons Section */}
        <View style={styles.actionsSection}>
          {authError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          ) : null}

          {/* Primary Pill Button (Inspired by Reference Images 1, 2, 3) */}
          <TouchableOpacity
            style={styles.primaryPillBtn}
            activeOpacity={0.88}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.primaryPillText}>Get Started</Text>
            <View style={styles.arrowCircle}>
              <ArrowRight size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Google 1-Tap OAuth */}
          <TouchableOpacity
            onPress={handleGooglePress}
            activeOpacity={0.85}
            disabled={googleLoading}
            style={styles.googleBtn}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#0B3064" />
            ) : (
              <GoogleLogo size={18} />
            )}
            <Text style={styles.googleBtnText}>
              {googleLoading ? 'Connecting to Google OAuth...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity>

          {/* Quick 1-Tap Personas & Passwordless OTP */}
          <TouchableOpacity
            onPress={() => setQuickAuthVisible(true)}
            activeOpacity={0.85}
            style={styles.demoPersonaBtn}
          >
            <Zap size={14} color="#00B39B" />
            <Text style={styles.demoPersonaText}>
              1-Tap Test Personas & Passwordless OTP
            </Text>
          </TouchableOpacity>

          {/* Footer Link */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to FiYDoc? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.footerLink}>Create an Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Interactive Premade Auth & Supabase OTP Modal */}
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  headerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 10,
    gap: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00B39B',
    letterSpacing: 0.8,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginVertical: 14,
    shadowColor: '#0B3064',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  organRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  organBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  featureChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 5,
  },
  featureChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  actionsSection: {
    gap: 12,
    paddingBottom: 4,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'center',
  },
  primaryPillBtn: {
    width: '100%',
    backgroundColor: '#0A2540',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#0A2540',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryPillText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginRight: 10,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleBtn: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  demoPersonaBtn: {
    width: '100%',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  demoPersonaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0D9488',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0B3064',
  },
});
