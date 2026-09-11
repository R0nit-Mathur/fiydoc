import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function Index() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { isAuthenticated, role, onboardingCompleted, hasHydrated } = useAuthStore();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key || !hasHydrated) return;

    // Use requestAnimationFrame / microtask to ensure navigation tree is mounted
    const frame = requestAnimationFrame(() => {
      if (!isAuthenticated) {
        router.replace('/(auth)/welcome');
      } else if (!onboardingCompleted) {
        router.replace('/(onboarding)/role-select');
      } else if (role === 'doctor') {
        router.replace('/(doctor)/(tabs)/home');
      } else {
        router.replace('/(patient)/(tabs)/home');
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [isAuthenticated, role, onboardingCompleted, hasHydrated, rootNavigationState?.key]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FiYLogo size="2xl" />
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginTop: 28,
  },
});
