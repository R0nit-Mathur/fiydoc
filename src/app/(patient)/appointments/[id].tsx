import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppointmentDetailQuery } from '@/hooks/queries/useAppointmentsQuery';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  MapPin,
  FileCheck,
  CheckCircle2,
  FileText,
} from 'lucide-react-native';

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: apt, isLoading } = useAppointmentDetailQuery(id as string);
  const cancelAppointment = useAppointmentStore((s) => s.cancelAppointment);

  if (isLoading || !apt) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
        <Text className="text-sm font-bold text-slate-500">Loading Appointment Details...</Text>
      </SafeAreaView>
    );
  }

  const handleCancel = () => {
    cancelAppointment(apt.id);
    router.back();
  };

  const statusVariant: Record<string, string> = {
    upcoming: 'blue',
    confirmed: 'teal',
    completed: 'success',
    cancelled: 'danger',
    in_progress: 'teal',
    pending: 'warning',
  };

  return (
    <SafeAreaView className="flex-1 bg-white justify-between" edges={['top']}>
      <View>
        <View className="px-5 py-3.5 flex-row items-center justify-between border-b border-slate-100">
          <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
            <ArrowLeft size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-base font-black text-slate-900">Clinic Appointment</Text>
          <View className="w-6" />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18 }} showsVerticalScrollIndicator={false}>
          {/* Doctor Header */}
          <View className="bg-slate-50 p-4 rounded-3xl border border-slate-200/80 flex-row items-center" style={{ gap: 14 }}>
            <Avatar uri={apt.doctorAvatar} name={apt.doctorName} size="lg" />
            <View className="flex-1">
              <Text className="text-lg font-black text-slate-900">{apt.doctorName}</Text>
              <Text className="text-xs font-bold text-[#00B39B]">{apt.doctorSpecialty}</Text>
              <Text className="text-xs text-slate-500 mt-0.5 font-medium">{apt.hospital}</Text>
            </View>
          </View>

          {/* Schedule & Mode Grid */}
          <View className="flex-row justify-between bg-teal-50/60 p-4 rounded-3xl border border-teal-200/80">
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Calendar size={18} color="#00B39B" />
              <View>
                <Text className="text-[10px] text-slate-400 font-semibold uppercase">Date</Text>
                <Text className="text-xs font-black text-slate-800">{apt.date}</Text>
              </View>
            </View>

            <View className="w-px h-8 bg-teal-200 self-center" />

            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Clock size={18} color="#00B39B" />
              <View>
                <Text className="text-[10px] text-slate-400 font-semibold uppercase">Slot Time</Text>
                <Text className="text-xs font-black text-slate-800">{apt.time}</Text>
              </View>
            </View>

            <View className="w-px h-8 bg-teal-200 self-center" />

            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Building2 size={18} color="#1E58C8" />
              <View>
                <Text className="text-[10px] text-slate-400 font-semibold uppercase">Status</Text>
                <Text className="text-xs font-black text-[#1E58C8] uppercase">{apt.status}</Text>
              </View>
            </View>
          </View>

          {/* Clinic Location & Instructions */}
          <View className="bg-slate-50 p-4 rounded-3xl border border-slate-200/80" style={{ gap: 6 }}>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <MapPin size={18} color="#1E58C8" />
              <Text className="text-xs font-black text-slate-900 uppercase">Clinic Address</Text>
            </View>
            <Text className="text-sm font-bold text-slate-800">{apt.hospital}</Text>
            <Text className="text-xs text-slate-500 mt-1 leading-4">
              Please arrive 10 minutes prior to your scheduled time slot. Show this confirmation at the reception desk.
            </Text>
          </View>

          {/* Symptoms List */}
          {apt.symptoms && apt.symptoms.length > 0 && (
            <View>
              <Text className="text-base font-black text-slate-900 mb-2">Reported Symptoms</Text>
              <View className="flex-row flex-wrap gap-2">
                {apt.symptoms.map((s: string, i: number) => (
                  <View key={i} className="bg-teal-50 border border-teal-100 px-3 py-1 rounded-xl">
                    <Text className="text-xs font-bold text-teal-800">{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Digital Prescription (Rx) Section */}
          <View className="bg-emerald-50/70 p-4 rounded-3xl border border-emerald-200/90" style={{ gap: 8 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <View className="bg-[#00B39B] p-2 rounded-xl">
                  <FileText size={16} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Digital Prescription (Rx)
                  </Text>
                  <Text className="text-[11px] text-emerald-800 font-semibold">
                    Direct from {apt.doctorName} (MCI Verified)
                  </Text>
                </View>
              </View>
              <Badge label="VERIFIED Rx" variant="success" size="sm" />
            </View>
            <Text className="text-xs text-slate-600 mt-1">
              Active medicines & prescribed lab investigations are synced to your Medical Records.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(patient)/health/index')}
              className="bg-[#00B39B] py-2.5 px-4 rounded-xl items-center mt-1"
            >
              <Text className="text-xs font-black text-white">View Full Rx & Lab Orders</Text>
            </TouchableOpacity>
          </View>

          {/* Payment Status Box */}
          <View className="flex-row justify-between items-center bg-slate-50 p-4 rounded-3xl border border-slate-200/80">
            <Text className="text-xs font-bold text-slate-600">Consultation Fee</Text>
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Badge label="PAY AT CLINIC" variant="blue" size="sm" />
              <Text className="text-base font-black text-slate-900">₹{apt.fee}</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <View className="p-4 bg-white border-t border-slate-100" style={{ gap: 10 }}>
        {apt.status !== 'cancelled' && apt.status !== 'completed' && (
          <Button
            title="Cancel Appointment"
            onPress={handleCancel}
            variant="outline"
            size="md"
          />
        )}
      </View>
    </SafeAreaView>
  );
}
