import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Stethoscope, FileText, User } from 'lucide-react-native';

export default function PatientLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00B39B',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 16,
          right: 16,
          height: 64,
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderRadius: 28,
          borderWidth: 1.5,
          borderColor: 'rgba(255, 255, 255, 0.95)',
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#0F2454',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
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
