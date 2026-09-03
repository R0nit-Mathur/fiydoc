import React from 'react';
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
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F1F5F9',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discovery"
        options={{
          title: 'Find Doctors',
          tabBarIcon: ({ color, size }) => <Stethoscope size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="health/index"
        options={{
          title: 'Medical Records',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
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
