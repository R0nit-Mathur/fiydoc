import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppointmentsQuery } from '@/hooks/queries/useAppointmentsQuery';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Calendar, Clock, Video, Building2, ChevronRight, ArrowLeft } from 'lucide-react-native';

export default function DoctorAppointmentsQueueScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const { data: appointments } = useAppointmentsQuery(undefined, 'doc_1');

  const filtered = appointments?.filter((a) => a.status === activeTab);

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-4 py-3 bg-white/95 border-b border-slate-100 shadow-sm" style={{ gap: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Appointments Schedule</Text>

        {/* Tab Filters */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(['upcoming', 'completed', 'cancelled'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl border items-center capitalize ${
                activeTab === tab ? 'bg-[#1E58C8] border-[#1E58C8]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <Text className={`text-xs font-bold ${activeTab === tab ? 'text-white' : 'text-slate-700'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 12 }}>
        {filtered?.map((apt) => (
          <TouchableOpacity
            key={apt.id}
            onPress={() => router.push(`/(doctor)/consultation/${apt.id}`)}
            activeOpacity={0.88}
            className="bg-white/95 p-3.5 rounded-2xl border border-slate-200/80 shadow-sm"
            style={{ gap: 10 }}
          >
            <View className="flex-row items-center justify-between pb-2 border-b border-slate-100">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Clock size={13} color="#1E58C8" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E293B' }}>{apt.date} at {apt.time}</Text>
              </View>
              <Badge label="In-Clinic" variant="blue" size="sm" />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar
                uri={apt.patientAvatar}
                name={apt.patientName}
                size="md"
              />
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-900">{apt.patientName}</Text>
                <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                  Symptoms: {apt.symptoms?.join(', ') || 'Regular checkup'}
                </Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </View>

            {apt.status === 'upcoming' && (
              <TouchableOpacity
                onPress={() => router.push(`/(doctor)/consultation/${apt.id}`)}
                className="bg-blue-50 py-2.5 rounded-xl border border-blue-200 items-center mt-1"
              >
                <Text className="text-xs font-bold text-[#1E58C8]">Open Consultation Suite</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
