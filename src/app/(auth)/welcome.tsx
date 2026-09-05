import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { Stethoscope, ArrowRight } from 'lucide-react-native';
import { UserSession } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { PremadeAuthModal } from '@/components/auth/PremadeAuthModal';

export default function WelcomeScreen() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [quickAuthVisible, setQuickAuthVisible] = useState(false);

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        {/* Top Centered Brand Logo */}
        <View style={styles.header}>
          <FiYLogo size="lg" />
        </View>

        {/* Center Minimalist Hero (Inspired by Reference Images 2 & 3) */}
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Stethoscope size={44} color="#00B39B" strokeWidth={2.2} />
          </View>

          <Text style={styles.title}>Care Made Simple</Text>
          <Text style={styles.subtitle}>
            Directly connect with experienced doctors, schedule appointments in seconds, and receive prescriptions on your app.
          </Text>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.pillButton}
            activeOpacity={0.88}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.pillButtonText}>Get started</Text>
            <View style={styles.arrowCircle}>
              <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.5} />
            </View>
          </TouchableOpacity>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Discreet Developer / Testing Helper */}
          <TouchableOpacity
            onPress={() => setQuickAuthVisible(true)}
            style={styles.demoLink}
            activeOpacity={0.7}
          >
            <Text style={styles.demoLinkText}>Demo Persona Login</Text>
          </TouchableOpacity>
        </View>
      </View>

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
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingVertical: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    paddingTop: 16,
    alignItems: 'center',
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  iconCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
    color: '#64748B',
    textAlign: 'center',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    gap: 14,
    paddingBottom: 8,
  },
  pillButton: {
    width: '100%',
    backgroundColor: '#0F172A',
    height: 56,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pillButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginRight: 10,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  demoLink: {
    paddingVertical: 4,
  },
  demoLinkText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
