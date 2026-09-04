import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Stethoscope, FileText, User } from 'lucide-react-native';

export default function PatientLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 16 : 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00B39B',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: 52 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discovery"
        options={{
          title: 'Doctors',
          tabBarIcon: ({ color, size }) => <Stethoscope size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="health/index"
        options={{
          title: 'Records',
          tabBarIcon: ({ color, size }) => <FileText size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size - 2} color={color} />,
        }}
      />

      {/* Hidden detail sub-routes */}
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="doctor/[id]" options={{ href: null }} />
      <Tabs.Screen name="booking/slot-select" options={{ href: null }} />
      <Tabs.Screen name="booking/confirm" options={{ href: null }} />
      <Tabs.Screen name="booking/success" options={{ href: null }} />
      <Tabs.Screen name="appointments/[id]" options={{ href: null }} />
      <Tabs.Screen name="health/[id]" options={{ href: null }} />
    </Tabs>
  );
}
