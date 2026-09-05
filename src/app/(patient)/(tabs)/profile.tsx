import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { updateService } from '@/services/updateService';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  User,
  Heart,
  Activity,
  AlertCircle,
  Phone,
  Mail,
  LogOut,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';

export default function PatientProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
      ]);
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Patient Profile</Text>
        <View className="bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200">
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#00B39B' }}>Patient Portal</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#00B39B']}
            tintColor="#00B39B"
          />
        }
      >
        {/* User Card */}
        <View className="bg-white/95 p-4 rounded-2xl border border-slate-200/80 shadow-sm flex-row items-center" style={{ gap: 14 }}>
          <Avatar uri={user?.avatar} name={user?.name || 'Patient'} size="lg" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
              {user?.name || 'Patient User'}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 1 }} numberOfLines={1}>
              {user?.email || (user?.phone ? `Phone: ${user.phone}` : 'Verified Account')}
            </Text>
            <View className="flex-row items-center mt-2">
              <Badge label="VERIFIED PATIENT" variant="teal" size="sm" />
            </View>
          </View>
        </View>

        {/* Health Vitals Summary */}
        <View className="bg-white/95 p-4 rounded-2xl border border-slate-200/80 shadow-sm" style={{ gap: 12 }}>
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Health Profile Summary
          </Text>

          <View className="flex-row justify-around py-3 bg-slate-50 rounded-2xl border border-slate-100">
            <View className="items-center">
              <Text className="text-[11px] text-slate-400 font-semibold uppercase">Age</Text>
              <Text className="text-base font-black text-slate-900 mt-0.5">32 Yrs</Text>
            </View>
            <View className="w-px h-8 bg-slate-200 self-center" />
            <View className="items-center">
              <Text className="text-[11px] text-slate-400 font-semibold uppercase">Blood Group</Text>
              <Text className="text-base font-black text-[#00B39B] mt-0.5">O+</Text>
            </View>
            <View className="w-px h-8 bg-slate-200 self-center" />
            <View className="items-center">
              <Text className="text-[11px] text-slate-400 font-semibold uppercase">Gender</Text>
              <Text className="text-base font-black text-slate-900 mt-0.5">Male</Text>
            </View>
          </View>

          <View style={{ gap: 10, paddingTop: 4 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-slate-500 font-medium">Known Allergies</Text>
              <Text className="text-xs font-bold text-red-600">Penicillin, Dust Mites</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-slate-500 font-medium">Chronic Conditions</Text>
              <Text className="text-xs font-bold text-slate-800">Mild Hypertension</Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-slate-500 font-medium">Emergency Contact</Text>
              <Text className="text-xs font-bold text-[#1E58C8]">+91 98765 12345</Text>
            </View>
          </View>
        </View>

        {/* App Version & OTA Updates Section */}
        <View className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm" style={{ gap: 12 }}>
          <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            App Version & OTA Updates
          </Text>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-bold text-slate-900">FiYDoc Healthcare Client</Text>
              <Text className="text-[11px] text-slate-500">v1.0.0 • Runtime: appVersion</Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                const res = await updateService.checkForUpdate();
                Alert.alert('OTA Updates', res.message);
              }}
              activeOpacity={0.8}
              className="bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200"
            >
              <Text className="text-xs font-bold text-[#00B39B]">Check Updates</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Security & Sign Out Section */}
        <View className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm" style={{ gap: 12 }}>
          <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Account Management
          </Text>

          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.8}
            className="flex-row items-center justify-between py-2"
          >
            <View className="flex-row items-center" style={{ gap: 12 }}>
              <View className="bg-red-50 p-2.5 rounded-2xl border border-red-100">
                <LogOut size={18} color="#EF4444" />
              </View>
              <View>
                <Text className="text-sm font-bold text-red-600">Sign Out</Text>
                <Text className="text-[10px] text-slate-400">Log out of FiYDoc on this device</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
