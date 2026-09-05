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
    if (!rootNavigationState?.key) return;

    const timer = setTimeout(() => {
      if (!isAuthenticated) {
        router.replace('/(auth)/welcome');
      } else if (!onboardingCompleted) {
        router.replace('/(onboarding)/role-select');
      } else if (role === 'doctor') {
        router.replace('/(doctor)/(tabs)/home');
      } else {
        router.replace('/(patient)/(tabs)/home');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [isAuthenticated, role, onboardingCompleted, rootNavigationState?.key]);

  return (
    <View className="flex-1 bg-white items-center justify-center space-y-4">
      <FiYLogo size="xl" />
      <ActivityIndicator size="large" color="#00B39B" className="mt-8" />
    </View>
  );
}
