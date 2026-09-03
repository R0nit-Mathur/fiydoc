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
      <View className="px-5 py-3.5 bg-white border-b border-slate-100 shadow-sm" style={{ gap: 12 }}>
        <Text className="text-xl font-black text-slate-900">Appointments Schedule</Text>

        {/* Tab Filters */}
        <View className="flex-row" style={{ gap: 8 }}>
          {(['upcoming', 'completed', 'cancelled'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl border items-center capitalize ${
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

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 14 }}>
        {filtered?.map((apt) => (
          <TouchableOpacity
            key={apt.id}
            onPress={() => router.push(`/(doctor)/consultation/${apt.id}`)}
            activeOpacity={0.88}
            className="bg-white p-4.5 rounded-3xl border border-slate-200/90 shadow-sm"
            style={{ gap: 12 }}
          >
            <View className="flex-row items-center justify-between pb-2.5 border-b border-slate-100">
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Clock size={14} color="#1E58C8" />
                <Text className="text-xs font-bold text-slate-800">{apt.date} at {apt.time}</Text>
              </View>
              <Badge label="In-Clinic" variant="blue" size="sm" />
            </View>

            <View className="flex-row items-center" style={{ gap: 14 }}>
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
