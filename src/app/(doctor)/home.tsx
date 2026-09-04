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
  Settings,
} from 'lucide-react-native';
import { BackHandler } from 'react-native';

export default function DoctorHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: appointments } = useAppointmentsQuery(undefined, user?.id);

  // Consume hardware back on doctor home so React Navigation never throws GO_BACK unhandled
  React.useEffect(() => {
    const onBackPress = () => {
      // Stay on doctor home or exit app safely
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  const nextPatient = appointments?.[0];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Doctor Header */}
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
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            minWidth: 0,
            marginRight: 10,
            gap: 10,
          }}
        >
          <Avatar uri={user?.avatar} name={user?.name || 'Dr. Specialist'} size="md" />
          <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text
                style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', flexShrink: 1 }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {user?.name || 'Dr. Priya Sharma'}
              </Text>
              <CheckCircle2 size={15} color="#00B39B" fill="#E0F7F4" style={{ flexShrink: 0 }} />
            </View>
            <Text
              style={{ fontSize: 11, fontWeight: '700', color: '#00B39B', marginTop: 1 }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              Senior Consultant Cardiologist
            </Text>
          </View>
        </View>

        {/* Portal Tag & Settings Shortcut */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <View className="bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
            <Text className="text-[10px] font-black text-[#1E58C8] tracking-wider">PORTAL</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(doctor)/settings')}
            activeOpacity={0.8}
            className="w-8 h-8 rounded-xl bg-slate-100 items-center justify-center border border-slate-200/80"
          >
            <Settings size={16} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Status Banner */}
        <View className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200/90 flex-row items-center justify-between shadow-sm">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              minWidth: 0,
              marginRight: 8,
              gap: 10,
            }}
          >
            <View className="bg-[#1E58C8] p-2 rounded-xl" style={{ flexShrink: 0 }}>
              <ShieldCheck size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text className="text-xs font-black text-slate-900" numberOfLines={1}>
                MCI Verified Practitioner
              </Text>
              <Text className="text-[11px] text-slate-600 font-medium mt-0.5" numberOfLines={1}>
                Reg: MCI-847291 • Active for Consultations
              </Text>
            </View>
          </View>
          <View style={{ flexShrink: 0 }}>
            <Badge label="ACTIVE" variant="blue" size="sm" />
          </View>
        </View>

        {/* Daily Queue Stats Strip */}
        <View className="flex-row items-center bg-white py-3.5 px-2 rounded-2xl border border-slate-200/80 shadow-sm">
          <View className="flex-1 items-center justify-center">
            <Text className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
              Total Today
            </Text>
            <Text className="text-lg font-black text-slate-900 mt-0.5" numberOfLines={1}>
              {appointments?.length ? `${appointments.length}` : '2'}
            </Text>
          </View>
          <View className="w-px h-7 bg-slate-200" />
          <View className="flex-1 items-center justify-center">
            <Text className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
              Completed
            </Text>
            <Text className="text-lg font-black text-emerald-600 mt-0.5" numberOfLines={1}>
              3
            </Text>
          </View>
          <View className="w-px h-7 bg-slate-200" />
          <View className="flex-1 items-center justify-center">
            <Text className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
              Next Slot
            </Text>
            <Text className="text-sm font-black text-[#1E58C8] mt-0.5" numberOfLines={1}>
              {nextPatient?.time || '10:30 AM'}
            </Text>
          </View>
        </View>

        {/* Next Patient Card */}
        <View className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm" style={{ gap: 12 }}>
          <View className="flex-row justify-between items-center pb-2.5 border-b border-slate-100">
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
                minWidth: 0,
                marginRight: 8,
                gap: 6,
              }}
            >
              <Clock size={15} color="#1E58C8" style={{ flexShrink: 0 }} />
              <Text
                className="text-xs font-black text-slate-900 uppercase tracking-wide flex-1"
                numberOfLines={1}
              >
                Next Patient in Queue
              </Text>
            </View>
            <View style={{ flexShrink: 0 }}>
              <Badge label={nextPatient?.time || '10:30 AM'} variant="teal" size="sm" />
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar
              uri={nextPatient?.patientAvatar}
              name={nextPatient?.patientName || 'Aarav Mehta'}
              size="md"
            />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text className="text-base font-black text-slate-900" numberOfLines={1}>
                {nextPatient?.patientName || 'Aarav Mehta'}
              </Text>
              <Text className="text-xs text-slate-500 font-medium mt-0.5" numberOfLines={1}>
                Male • 32 Yrs • Blood Group: O+
              </Text>
            </View>
          </View>

          <View className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Chief Reported Symptoms
            </Text>
            <Text className="text-xs font-bold text-slate-800" numberOfLines={2}>
              {nextPatient?.symptoms?.join(' • ') || 'Chest Discomfort'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push(`/(doctor)/consultation/${nextPatient?.id || 'apt_live'}`)}
            activeOpacity={0.85}
            className="bg-[#1E58C8] py-3 px-4 rounded-xl flex-row justify-center items-center shadow-sm"
            style={{ gap: 8 }}
          >
            <Sparkles size={16} color="#FFFFFF" style={{ flexShrink: 0 }} />
            <Text className="text-xs font-black text-white" numberOfLines={1}>
              Launch In-Clinic Consultation Workspace
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live OPD Queue Timeline (Indian Clinic Queue) */}
        <View style={{ gap: 10 }}>
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Clock size={16} color="#1E58C8" />
              <Text className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Today's OPD Queue Timeline
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(doctor)/appointments')}>
              <Text className="text-xs font-bold text-[#1E58C8]">View All →</Text>
            </TouchableOpacity>
          </View>

          {/* Timeline Nodes */}
          <View className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm" style={{ gap: 10 }}>
            {[
              {
                token: 'Token #01',
                time: '09:30 AM',
                name: 'Rohit Joshi',
                age: '45 M',
                symptoms: 'Mild Angina Checkup',
                status: 'COMPLETED',
                badgeVariant: 'teal',
              },
              {
                token: 'Token #02',
                time: '10:00 AM',
                name: nextPatient?.patientName || 'Aarav Mehta',
                age: '32 M',
                symptoms: nextPatient?.symptoms?.join(', ') || 'Chest Discomfort',
                status: 'IN PROGRESS',
                badgeVariant: 'blue',
                isCurrent: true,
              },
              {
                token: 'Token #03',
                time: '10:30 AM',
                name: 'Kavita Rao',
                age: '58 F',
                symptoms: 'Hypertension & Dizziness',
                status: 'WAITING',
                badgeVariant: 'warning',
              },
              {
                token: 'Token #04',
                time: '11:00 AM',
                name: 'Rajesh Verma',
                age: '50 M',
                symptoms: 'Lipid Profile Review',
                status: 'SCHEDULED',
                badgeVariant: 'slate',
              },
            ].map((q, idx) => (
              <View
                key={idx}
                className={`p-3 rounded-2xl border flex-row items-center justify-between ${
                  q.isCurrent
                    ? 'bg-blue-50/80 border-[#1E58C8]'
                    : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <View style={{ gap: 2 }}>
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Text className="text-xs font-black text-[#1E58C8]">{q.token}</Text>
                    <Text className="text-[11px] text-slate-400 font-bold">• {q.time}</Text>
                  </View>
                  <Text className="text-sm font-black text-slate-900">{q.name} ({q.age})</Text>
                  <Text className="text-[11px] text-slate-500">{q.symptoms}</Text>
                </View>

                <View className="items-end" style={{ gap: 6 }}>
                  <Badge label={q.status} variant={q.badgeVariant as any} size="sm" />
                  {q.isCurrent ? (
                    <TouchableOpacity
                      onPress={() => router.push(`/(doctor)/consultation/${nextPatient?.id || 'apt_live'}`)}
                      className="bg-[#1E58C8] px-3 py-1 rounded-lg"
                    >
                      <Text className="text-[11px] font-bold text-white">Consult</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text className="text-[10px] text-slate-400 font-medium">OPD Room 4</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Clinical Suite Shortcuts */}
        <View style={{ gap: 10 }}>
          <Text className="text-sm font-black text-slate-900">Clinical Suite</Text>

          <TouchableOpacity
            onPress={() => router.push(`/(doctor)/consultation/${nextPatient?.id || 'apt_live'}`)}
            activeOpacity={0.85}
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex-row items-center justify-between shadow-sm"
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
                minWidth: 0,
                marginRight: 8,
                gap: 10,
              }}
            >
              <View
                className="bg-teal-50 p-2 rounded-xl border border-teal-100"
                style={{ flexShrink: 0 }}
              >
                <Activity size={18} color="#00B39B" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text className="text-xs font-black text-slate-900" numberOfLines={1}>
                  3D Body Region Visualizer
                </Text>
                <Text
                  className="text-[11px] text-slate-500 font-medium mt-0.5"
                  numberOfLines={1}
                >
                  Interactive pain & symptom annotation
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(doctor)/appointments')}
            activeOpacity={0.85}
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex-row items-center justify-between shadow-sm"
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
                minWidth: 0,
                marginRight: 8,
                gap: 10,
              }}
            >
              <View
                className="bg-blue-50 p-2 rounded-xl border border-blue-100"
                style={{ flexShrink: 0 }}
              >
                <Calendar size={18} color="#1E58C8" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text className="text-xs font-black text-slate-900" numberOfLines={1}>
                  Patient Queue & Schedule
                </Text>
                <Text
                  className="text-[11px] text-slate-500 font-medium mt-0.5"
                  numberOfLines={1}
                >
                  View full roster & in-clinic bookings
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
