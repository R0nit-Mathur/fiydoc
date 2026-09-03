import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Appointment } from '@/types/index';
import { Calendar, Clock, Building2, ChevronRight } from 'lucide-react-native';
import { Badge } from './Badge';
import { Avatar } from './Avatar';

interface AppointmentCardProps {
  appointment: Appointment;
  onPress: () => void;
}

export function AppointmentCard({ appointment, onPress }: AppointmentCardProps) {
  const statusBadge = {
    upcoming: { label: 'Upcoming', variant: 'blue' as const },
    confirmed: { label: 'Confirmed', variant: 'teal' as const },
    completed: { label: 'Completed', variant: 'success' as const },
    cancelled: { label: 'Cancelled', variant: 'danger' as const },
    in_progress: { label: 'In Consultation', variant: 'teal' as const },
    pending: { label: 'Pending', variant: 'warning' as const },
  }[appointment.status] || { label: 'Confirmed', variant: 'teal' as const };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      className="bg-white rounded-3xl p-4.5 mb-4 border border-slate-200/90 shadow-sm"
      style={{ marginVertical: 4 }}
    >
      <View className="flex-row items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100">
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <View className="bg-blue-50 p-1.5 rounded-lg">
            <Building2 size={14} color="#1E58C8" />
          </View>
          <Text className="text-xs font-bold text-slate-800">
            In-Clinic Consultation
          </Text>
        </View>
        <Badge label={statusBadge.label} variant={statusBadge.variant} size="sm" />
      </View>

      <View className="flex-row items-center" style={{ gap: 14 }}>
        <Avatar uri={appointment.doctorAvatar} name={appointment.doctorName} size="md" />

        <View className="flex-1">
          <Text className="text-base font-black text-slate-900" numberOfLines={1}>
            {appointment.doctorName}
          </Text>
          <Text className="text-xs font-bold text-[#00B39B] mt-0.5">
            {appointment.doctorSpecialty}
          </Text>
          <Text className="text-xs text-slate-500 font-medium mt-0.5" numberOfLines={1}>
            {appointment.hospital}
          </Text>
        </View>

        <ChevronRight size={18} color="#94A3B8" />
      </View>

      <View
        className="flex-row items-center justify-between mt-3.5 pt-2.5 bg-slate-50 rounded-2xl px-3.5 py-2.5 border border-slate-100"
      >
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <Calendar size={13} color="#64748B" />
          <Text className="text-xs font-bold text-slate-700">
            {appointment.date}
          </Text>
        </View>
        <View className="flex-row items-center" style={{ gap: 6 }}>
          <Clock size={13} color="#64748B" />
          <Text className="text-xs font-bold text-slate-700">
            {appointment.time}
          </Text>
        </View>
        <Text className="text-xs font-black text-[#1E58C8]">
          ₹{appointment.fee}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
