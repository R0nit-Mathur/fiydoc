import React, { useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Colors } from '@/constants/theme';
import '../global.css';

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              contentStyle: { backgroundColor: Colors.light.background },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen
              name="(auth)"
              options={{
                animation: 'fade',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen
              name="(onboarding)"
              options={{
                animation: 'slide_from_bottom',
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="(patient)" />
            <Stack.Screen name="(doctor)" />
          </Stack>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
