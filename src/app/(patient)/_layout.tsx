import React from 'react';
import { Stack } from 'expo-router';

export default function PatientLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="doctor/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="booking/slot-select" options={{ headerShown: false }} />
      <Stack.Screen name="booking/confirm" options={{ headerShown: false }} />
      <Stack.Screen name="booking/success" options={{ headerShown: false }} />
      <Stack.Screen name="appointments/index" options={{ headerShown: false }} />
      <Stack.Screen name="appointments/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="health/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="health/prescription/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ headerShown: false, animation: 'fade' }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
    </Stack>
  );
}
