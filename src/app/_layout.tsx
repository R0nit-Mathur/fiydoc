import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Colors } from '@/constants/theme';
import '../global.css';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationPermissionModal } from '@/components/location/LocationPermissionModal';
import { useLocationStore } from '@/store/useLocationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { notificationService } from '@/services/notificationService';

function GlobalLocationGate() {
  const { latitude, longitude, permissionStatus, isGenuineDeviceLocation } = useLocationStore();
  const isLocationResolved = Boolean(
    latitude && longitude && permissionStatus === 'granted' && isGenuineDeviceLocation
  );

  return (
    <LocationPermissionModal
      visible={!isLocationResolved}
      onClose={() => {}}
    />
  );
}

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

  useEffect(() => {
    async function checkAutoUpdate() {
      if (!Updates.isEnabled) return;
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
    // Non-blocking server warmup to eliminate cloud cold start latency
    fetch('https://fiydoc.onrender.com/health').catch(() => {});
    checkAutoUpdate();

    // App launch notification & server notification synchronization
    try {
      const auth = useAuthStore.getState();
      if (auth.isAuthenticated && auth.user) {
        const lastAppOpenKey = 'fiydoc_last_app_open_notif';
        AsyncStorage.getItem(lastAppOpenKey).then((lastTime) => {
          const now = Date.now();
          // Trigger once every 30 minutes on app open
          if (!lastTime || now - parseInt(lastTime, 10) > 30 * 60 * 1000) {
            AsyncStorage.setItem(lastAppOpenKey, String(now)).catch(() => {});
            const displayName = auth.role === 'doctor'
              ? (auth.user?.name?.startsWith('Dr.') ? auth.user?.name : `Dr. ${auth.user?.name || 'Doctor'}`)
              : (auth.user?.name || 'User');
            useNotificationStore.getState().addNotification({
              title: `Welcome back, ${displayName}`,
              message: 'Your health dashboard, consultations, and OPD schedule are synchronized with the live server.',
              type: 'app_open',
              recipientId: auth.user?.id,
              recipientRole: auth.role === 'doctor' ? 'doctor' : 'patient',
            });
          }
        }).catch(() => {});

        // Fetch and merge remote server notifications
        if (auth.user.id) {
          notificationService.getNotifications(auth.user.id).then((serverNotifs) => {
            if (Array.isArray(serverNotifs) && serverNotifs.length > 0) {
              const currentIds = new Set(useNotificationStore.getState().notifications.map((n) => n.id));
              for (const sn of serverNotifs) {
                if (!currentIds.has(sn.id)) {
                  useNotificationStore.getState().addNotification({
                    id: sn.id,
                    title: sn.title,
                    message: sn.message,
                    type: sn.type,
                    link: sn.link,
                    read: sn.read,
                    recipientId: auth.user?.id,
                    recipientRole: auth.role === 'doctor' ? 'doctor' : 'patient',
                  });
                }
              }
            }
          }).catch(() => {});
        }
      }
    } catch {}
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <GlobalLocationGate />
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
            <Stack.Screen name="(admin)" />
          </Stack>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
