import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useReducedMotion } from 'react-native-reanimated';
import { useAppTheme } from '@/hooks/useAppTheme';
import '../global.css';

import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { notificationService } from '@/services/notificationService';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export default function RootLayout() {
  usePushNotifications();
  const { width: viewportWidth } = useWindowDimensions();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.user?.id);
  const authRole = useAuthStore((state) => state.role);
  const reducedMotion = useReducedMotion();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 30,
            retry: 1,
            refetchOnWindowFocus: false, // Prevent thrashing on mobile refocus
            refetchOnReconnect: true,
          },
        },
      })
  );

  useEffect(() => {
    // Do not allow a signed-out user to see cached private query data after the
    // auth store has finished clearing its persisted session.
    const unsubscribe = useAuthStore.subscribe((state, previousState) => {
      if (previousState.user?.id !== state.user?.id || (previousState.isAuthenticated && !state.isAuthenticated)) {
        queryClient.clear();
      }
    });

    async function checkAutoUpdate() {
      if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled) return;
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          console.log('[OTA] Downloaded latest update bundle.');
        }
      } catch (e: any) {
        console.warn('[OTA] Background update check error:', e?.message);
      }
    }
    checkAutoUpdate();

    return unsubscribe;
  }, [queryClient]);

  // Wait for persisted auth hydration before syncing private notifications. A
  // one-shot mount effect can otherwise run while the store still looks signed
  // out and permanently skip this synchronization on cold start.
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !userId) return;
    let active = true;

    notificationService.getNotifications(userId).then((serverNotifs) => {
      if (!active || useAuthStore.getState().user?.id !== userId) return;
      if (!Array.isArray(serverNotifs) || serverNotifs.length === 0) return;
      const normalized = serverNotifs.map((sn: any) => ({
        id: sn.id,
        title: sn.title,
        message: sn.message,
        type: sn.type,
        link: sn.link,
        read: sn.read,
        recipientId: userId,
        recipientRole: authRole === 'doctor' ? ('doctor' as const) : ('patient' as const),
        time: sn.createdAt ? new Date(sn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        timestamp: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      }));
      useNotificationStore.getState().syncServerNotifications(normalized);
    }).catch(() => {
      // Notifications are non-blocking; the dedicated screen owns retries.
    });
    return () => { active = false; };
  }, [authRole, hasHydrated, isAuthenticated, userId]);

  const { isDark, colors } = useAppTheme();

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <View style={[styles.rootWrapper, Platform.OS === 'web' && { backgroundColor: isDark ? '#090D16' : '#F1F5F9' }]}>
            <View
              style={[
                styles.appContainer,
                Platform.OS === 'web' && styles.webResponsiveContainer,
                Platform.OS === 'web' && {
                  maxWidth: viewportWidth >= 1100 ? 1180 : viewportWidth >= 768 ? 860 : 640,
                },
              ]}
            >
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: reducedMotion ? 'fade' : 'default',
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                  contentStyle: { backgroundColor: colors.background },
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
                    animation: reducedMotion ? 'fade' : 'slide_from_bottom',
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen name="(patient)" />
                <Stack.Screen name="(doctor)" />
                <Stack.Screen name="(admin)" />
              </Stack>
            </View>
          </View>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  rootWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appContainer: {
    flex: 1,
    width: '100%',
  },
  webResponsiveContainer: {
    maxWidth: 640,
    width: '100%',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
});
