import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppointmentsQuery } from '@/hooks/queries/useAppointmentsQuery';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle2,
  Calendar,
  Clock,
  Building2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Activity,
  User,
  Users,
} from 'lucide-react-native';

export default function DoctorHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: appointments } = useAppointmentsQuery(undefined, user?.id);

  const nextPatient = appointments?.[0];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Doctor Header */}
      <View className="px-6 py-3.5 bg-white flex-row items-center justify-between border-b border-slate-100 shadow-sm">
        <View className="flex-row items-center space-x-3">
          <Avatar uri={user?.avatar} name={user?.name || 'Dr. Specialist'} size="md" />
          <View>
            <View className="flex-row items-center space-x-1">
              <Text className="text-base font-black text-slate-900">{user?.name || 'Dr. Priya Sharma'}</Text>
              <CheckCircle2 size={16} color="#00B39B" fill="#E0F7F4" />
            </View>
            <Text className="text-xs text-[#00B39B] font-bold">Senior Consultant Cardiologist</Text>
          </View>
        </View>

        <View className="bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
          <Text className="text-[11px] font-black text-[#1E58C8]">CLINIC PORTAL</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Status Banner */}
        <View className="bg-blue-50 p-4.5 rounded-3xl border border-blue-200 flex-row items-center justify-between shadow-sm">
          <View className="flex-row items-center flex-1 mr-2" style={{ gap: 12 }}>
            <View className="bg-[#1E58C8] p-2.5 rounded-2xl">
              <ShieldCheck size={22} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-black text-slate-900">MCI Verified Practitioner</Text>
              <Text className="text-xs text-slate-600 mt-0.5 font-medium">
                Reg: MCI-847291 • Active for Digital Clinical Consultations
              </Text>
            </View>
          </View>
          <Badge label="ACTIVE" variant="blue" size="sm" />
        </View>

        {/* Daily Queue Stats Strip */}
        <View className="flex-row justify-around bg-white p-4.5 rounded-3xl border border-slate-200/80 shadow-sm">
          <View className="items-center">
            <Text className="text-[11px] text-slate-400 font-semibold uppercase">Total Today</Text>
            <Text className="text-xl font-black text-slate-900 mt-0.5">
              {appointments?.length ? `${appointments.length} Patients` : '5 Patients'}
            </Text>
          </View>
          <View className="w-px h-8 bg-slate-200 self-center" />
          <View className="items-center">
            <Text className="text-[11px] text-slate-400 font-semibold uppercase">Completed</Text>
            <Text className="text-xl font-black text-emerald-600 mt-0.5">3</Text>
          </View>
          <View className="w-px h-8 bg-slate-200 self-center" />
          <View className="items-center">
            <Text className="text-[11px] text-slate-400 font-semibold uppercase">Next Slot</Text>
            <Text className="text-xl font-black text-[#1E58C8] mt-0.5">
              {nextPatient?.time || '11:00 AM'}
            </Text>
          </View>
        </View>

        {/* Next Patient Card */}
        <View className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm" style={{ gap: 16 }}>
          <View className="flex-row justify-between items-center pb-3 border-b border-slate-100">
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Clock size={16} color="#1E58C8" />
              <Text className="text-xs font-black text-slate-900 uppercase tracking-wide">
                NEXT PATIENT IN CLINIC QUEUE
              </Text>
            </View>
            <Badge label={nextPatient?.time || '11:00 AM Slot'} variant="teal" size="sm" />
          </View>

          <View className="flex-row items-center" style={{ gap: 14 }}>
            <Avatar
              uri={nextPatient?.patientAvatar}
              name={nextPatient?.patientName || 'Aarav Mehta'}
              size="lg"
            />
            <View className="flex-1">
              <Text className="text-lg font-black text-slate-900">
                {nextPatient?.patientName || 'Aarav Mehta'}
              </Text>
              <Text className="text-xs text-slate-500 font-medium">Male • 32 Yrs • Blood Group: O+</Text>
            </View>
          </View>

          <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Chief Reported Symptoms
            </Text>
            <Text className="text-xs font-bold text-slate-800">
              {nextPatient?.symptoms?.join(' • ') || 'Chest Discomfort • Exertional Shortness of Breath'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push(`/(doctor)/consultation/${nextPatient?.id || 'apt_live'}`)}
            activeOpacity={0.85}
            className="bg-[#1E58C8] py-3.5 px-4 rounded-2xl flex-row justify-center items-center shadow-sm"
            style={{ gap: 8 }}
          >
            <Sparkles size={18} color="#FFFFFF" />
            <Text className="text-sm font-black text-white">
              Launch In-Clinic Consultation Workspace
            </Text>
          </TouchableOpacity>
        </View>

        {/* Clinical Suite Shortcuts */}
        <View style={{ gap: 12 }}>
          <Text className="text-base font-black text-slate-900 mb-1">Clinical Suite</Text>

          <TouchableOpacity
            onPress={() => router.push(`/(doctor)/consultation/${nextPatient?.id || 'apt_live'}`)}
            activeOpacity={0.85}
            className="bg-white p-4.5 rounded-3xl border border-slate-200/80 flex-row items-center justify-between shadow-sm"
          >
            <View className="flex-row items-center flex-1 mr-2" style={{ gap: 12 }}>
              <View className="bg-teal-50 p-2.5 rounded-2xl border border-teal-100">
                <Activity size={22} color="#00B39B" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-black text-slate-900">3D Body Region Visualizer</Text>
                <Text className="text-xs text-slate-500 font-medium">Interactive pain & symptom annotation</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(doctor)/appointments')}
            activeOpacity={0.85}
            className="bg-white p-4.5 rounded-3xl border border-slate-200/80 flex-row items-center justify-between shadow-sm"
          >
            <View className="flex-row items-center flex-1 mr-2" style={{ gap: 12 }}>
              <View className="bg-blue-50 p-2.5 rounded-2xl border border-blue-100">
                <Calendar size={22} color="#1E58C8" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-black text-slate-900">Patient Queue & Schedule</Text>
                <Text className="text-xs text-slate-500 font-medium">View full roster & in-clinic bookings</Text>
              </View>
            </View>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
