import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { FiYLogo } from '@/components/ui/FiYLogo';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, role, onboardingCompleted } = useAuthStore();

  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    // Wait until the root layout is fully mounted
    if (!rootNavigationState?.key) return;

    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace('/(auth)/welcome');
      } else if (!onboardingCompleted) {
        router.replace('/(onboarding)/role-select');
      } else if (role === 'doctor') {
        router.replace('/(doctor)/home');
      } else {
        router.replace('/(patient)/home');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [isAuthenticated, role, onboardingCompleted, rootNavigationState?.key]);

  return (
    <View className="flex-1 bg-white items-center justify-center space-y-4">
      <FiYLogo size="xl" />
      <ActivityIndicator size="large" color="#00B39B" className="mt-8" />
    </View>
  );
}
