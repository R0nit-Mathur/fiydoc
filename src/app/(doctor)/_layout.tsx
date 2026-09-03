import React from 'react';
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
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F1F5F9',
          height: 62,
          paddingBottom: 8,
          paddingTop: 8,
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
          title: 'Queue Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          title: 'Patients',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Slots',
          tabBarIcon: ({ color, size }) => <Clock size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Verification',
          tabBarIcon: ({ color, size }) => <Stethoscope size={size} color={color} />,
        }}
      />

      {/* Hidden detail sub-routes */}
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="consultation/[id]" options={{ href: null }} />
    </Tabs>
  );
}
