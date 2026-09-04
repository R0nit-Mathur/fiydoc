import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Calendar, Users, Stethoscope, Clock } from 'lucide-react-native';

export default function DoctorLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1E58C8',
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
          title: 'Queue',
          tabBarIcon: ({ color, size }) => <Home size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => <Calendar size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color, size }) => <Users size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Slots',
          tabBarIcon: ({ color, size }) => <Clock size={size - 2} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Stethoscope size={size - 2} color={color} />,
        }}
      />

      {/* Hidden detail sub-routes */}
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="consultation/[id]" options={{ href: null }} />
    </Tabs>
  );
}
