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
      className="bg-white/95 rounded-2xl p-3.5 mb-3 border border-slate-200/80 shadow-sm"
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, marginRight: 8 }}>
          <View style={{ backgroundColor: '#EFF6FF', padding: 5, borderRadius: 8, flexShrink: 0 }}>
            <Building2 size={13} color="#1E58C8" />
          </View>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E293B', flex: 1 }} numberOfLines={1}>
            In-Clinic Consultation
          </Text>
        </View>
        <View style={{ flexShrink: 0 }}>
          <Badge label={statusBadge.label} variant={statusBadge.variant} size="sm" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Avatar uri={appointment.doctorAvatar} name={appointment.doctorName} size="md" />

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
            {appointment.doctorName}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#00B39B', marginTop: 1 }} numberOfLines={1}>
            {appointment.doctorSpecialty}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 1 }} numberOfLines={1}>
            {appointment.hospital}
          </Text>
        </View>

        <ChevronRight size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 10,
          backgroundColor: '#F8FAFC',
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: '#F1F5F9',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Calendar size={12} color="#64748B" />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>
            {appointment.date}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Clock size={12} color="#64748B" />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>
            {appointment.time}
          </Text>
        </View>
        <Text style={{ fontSize: 12, fontWeight: '800', color: '#1E58C8' }}>
          ₹{appointment.fee}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
