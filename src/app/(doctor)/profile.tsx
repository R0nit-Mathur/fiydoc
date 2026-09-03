import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  Stethoscope,
  ShieldCheck,
  Building2,
  MapPin,
  Clock,
  LogOut,
  ChevronRight,
  FileCheck,
} from 'lucide-react-native';

export default function DoctorProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Top Header */}
      <View className="px-6 py-3.5 bg-white border-b border-slate-100 shadow-sm flex-row items-center justify-between">
        <Text className="text-lg font-black text-slate-900">Doctor Profile</Text>
        <View className="bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
          <Text className="text-[11px] font-bold text-[#1E58C8]">Practitioner Workspace</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Identity Card */}
        <View className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex-row items-center" style={{ gap: 16 }}>
          <Avatar uri={user?.avatar} name={user?.name || 'Dr. Specialist'} size="lg" />
          <View className="flex-1">
            <Text className="text-lg font-black text-slate-900">{user?.name || 'Dr. Priya Sharma'}</Text>
            <Text className="text-xs font-bold text-[#00B39B]">Senior Consultant Cardiologist</Text>
            <Text className="text-xs text-slate-500 font-medium mt-0.5">{user?.email || 'doctor@fiydoc.app'}</Text>
            <View className="mt-2 flex-row items-center">
              <Badge label="MCI VERIFIED PRACTITIONER" variant="success" size="sm" />
            </View>
          </View>
        </View>

        {/* Clinical Registration & Credentials */}
        <View className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm" style={{ gap: 14 }}>
          <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Clinical Credentials & Registration
          </Text>

          <View className="bg-blue-50 p-4 rounded-2xl border border-blue-200 flex-row items-center" style={{ gap: 12 }}>
            <View className="bg-[#1E58C8] p-2 rounded-xl">
              <ShieldCheck size={20} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-[#1E58C8] uppercase">Medical Council Registration</Text>
              <Text className="text-sm font-black text-slate-900 mt-0.5">MCI-847291 (Maharashtra)</Text>
              <Text className="text-[11px] text-slate-500 mt-0.5">Status: Active & Authorized for Digital Rx</Text>
            </View>
          </View>
        </View>

        {/* Practice Clinic Information */}
        <View className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm" style={{ gap: 14 }}>
          <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Clinic Practice Location
          </Text>

          <View className="flex-row items-start pt-1" style={{ gap: 12 }}>
            <Building2 size={18} color="#00B39B" className="mt-0.5" />
            <View className="flex-1">
              <Text className="text-sm font-black text-slate-900">HeartCare Specialty Clinic</Text>
              <Text className="text-xs text-slate-600 mt-0.5 font-medium">Suite 402, Medical Enclave, Bandra West, Mumbai</Text>
              <Text className="text-[11px] text-slate-400 mt-1">Consultation Hours: 09:00 AM - 05:00 PM</Text>
            </View>
          </View>
        </View>

        {/* Sign Out Section */}
        <View className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            className="flex-row items-center justify-between py-1"
          >
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View className="bg-red-50 p-2.5 rounded-2xl border border-red-100">
                <LogOut size={18} color="#EF4444" />
              </View>
              <View>
                <Text className="text-sm font-bold text-red-600">Sign Out of Doctor Account</Text>
                <Text className="text-[10px] text-slate-400">Exit clinical session safely</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
