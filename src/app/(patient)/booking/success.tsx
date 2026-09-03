import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppointmentDetailQuery } from '@/hooks/queries/useAppointmentsQuery';
import { Button } from '@/components/ui/Button';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { CheckCircle2, Video, Calendar, Clock, QrCode, Sparkles } from 'lucide-react-native';

export default function BookingSuccessScreen() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId: string }>();
  const { data: apt } = useAppointmentDetailQuery(appointmentId as string);

  return (
    <SafeAreaView className="flex-1 bg-white justify-between p-6">
      <ScrollView contentContainerClassName="items-center py-6 space-y-6">
        {/* Animated Check Icon */}
        <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center border-4 border-emerald-50">
          <CheckCircle2 size={48} color="#10B981" />
        </View>

        <View className="items-center">
          <Text className="text-2xl font-black text-slate-900 text-center">Appointment Confirmed!</Text>
          <Text className="text-xs text-slate-500 text-center mt-1">
            Booking Token ID: <Text className="font-mono font-bold text-slate-800">{appointmentId || 'apt_101'}</Text>
          </Text>
        </View>

        {/* Ticket Digital Pass */}
        <View className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
          <View className="flex-row justify-between items-center pb-3 border-b border-slate-200">
            <FiYLogo size="sm" />
            <View className="bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              <Text className="text-[11px] font-bold text-teal-700">CONFIRMED PASS</Text>
            </View>
          </View>

          <View className="space-y-1">
            <Text className="text-lg font-black text-slate-900">{apt?.doctorName || 'Dr. Ananya Roy'}</Text>
            <Text className="text-xs font-semibold text-[#00B39B]">{apt?.doctorSpecialty || 'Cardiology'}</Text>
            <Text className="text-xs text-slate-500">{apt?.hospital || 'Metro Heart Institute'}</Text>
          </View>

          <View className="flex-row justify-between bg-white p-3 rounded-2xl border border-slate-100">
            <View className="flex-row items-center space-x-1.5">
              <Calendar size={14} color="#1E58C8" />
              <Text className="text-xs font-bold text-slate-800">{apt?.date || '2026-09-02'}</Text>
            </View>
            <View className="flex-row items-center space-x-1.5">
              <Clock size={14} color="#1E58C8" />
              <Text className="text-xs font-bold text-slate-800">{apt?.time || '10:30 AM'}</Text>
            </View>
          </View>

          {/* QR Code Ticket Mock */}
          <View className="items-center pt-2">
            <View className="p-3 bg-white rounded-2xl border border-slate-200 items-center justify-center">
              <QrCode size={110} color="#0F172A" />
            </View>
            <Text className="text-[10px] text-slate-400 font-mono mt-1.5">Scan at clinic counter or video check-in</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.replace(`/(patient)/appointments/${appointmentId}`)}
          activeOpacity={0.85}
          className="w-full bg-blue-50 border border-blue-200 p-4 rounded-2xl flex-row items-center justify-center space-x-2 shadow-sm"
        >
          <Text className="text-sm font-black text-[#1E58C8]">View Clinic Directions & Details</Text>
        </TouchableOpacity>
      </ScrollView>

      <View className="space-y-2 pt-2">
        <Button
          title="Go to Patient Dashboard"
          onPress={() => router.replace('/(patient)/home')}
          variant="primary"
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}
