import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDoctorDetailQuery } from '@/hooks/queries/useDoctorsQuery';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { Avatar } from '@/components/ui/Avatar';
import {
  ArrowLeft,
  Star,
  MapPin,
  CheckCircle2,
  Calendar,
  Clock,
  Building2,
  Award,
  ShieldCheck,
} from 'lucide-react-native';

const SLOTS = ['09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'];

export default function DoctorProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: doctor, isLoading } = useDoctorDetailQuery(id as string);
  const setBookingDoctor = useAppointmentStore((s) => s.setBookingDoctor);
  const setBookingSlot = useAppointmentStore((s) => s.setBookingSlot);

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState('10:30 AM');

  if (isLoading || !doctor) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-6">
        <Text className="text-sm font-bold text-slate-500">Loading Doctor Profile...</Text>
      </SafeAreaView>
    );
  }

  const handleBookNow = () => {
    setBookingDoctor(doctor);
    setBookingSlot(selectedDate, selectedSlot, 'clinic');
    router.push('/(patient)/booking/slot-select');
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header Bar */}
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
        <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>Doctor Profile</Text>
        <View className="w-6" />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Identity Header */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
          <View style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar uri={doctor.avatar} name={doctor.name} size="lg" />
            <View
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                backgroundColor: '#FFFFFF',
                borderRadius: 99,
                padding: 2,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 2,
              }}
            >
              <CheckCircle2 size={15} color="#00B39B" fill="#E0F7F4" />
            </View>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
              {doctor.name}
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#00B39B', marginTop: 2 }} numberOfLines={1}>
              {doctor.specialty}
            </Text>
            <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 2 }} numberOfLines={1}>
              {doctor.qualification}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FEF3C7',
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 8,
                  gap: 3,
                  flexShrink: 0,
                }}
              >
                <Star size={11} color="#F59E0B" fill="#F59E0B" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400E' }}>
                  {doctor.rating || 4.9} ({doctor.reviewCount || 120})
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats Strip */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F8FAFC',
            paddingVertical: 12,
            paddingHorizontal: 8,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E2E8F0',
          }}
        >
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Experience
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 2 }}>
              {doctor.experienceYears || 12}+ Yrs
            </Text>
          </View>
          <View style={{ width: 1, height: 28, backgroundColor: '#CBD5E1' }} />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Fee
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#1E58C8', marginTop: 2 }}>
              ₹{doctor.consultationFee}
            </Text>
          </View>
          <View style={{ width: 1, height: 28, backgroundColor: '#CBD5E1' }} />
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Status
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#ECFDF5',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
                borderWidth: 1,
                borderColor: '#A7F3D0',
                marginTop: 2,
              }}
            >
              <ShieldCheck size={11} color="#00B39B" />
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#047857', marginLeft: 3 }}>
                Verified
              </Text>
            </View>
          </View>
        </View>

        {/* Practice Clinic Location */}
        <View className="bg-slate-50 p-4 rounded-3xl border border-slate-200/80 flex-row items-center" style={{ gap: 14 }}>
          <View className="bg-blue-100 p-3 rounded-2xl">
            <Building2 size={22} color="#1E58C8" />
          </View>
          <View className="flex-1">
            <Text className="text-sm font-black text-slate-900">{doctor.hospital}</Text>
            <Text className="text-xs text-slate-600 mt-0.5 font-medium">{doctor.location}</Text>
            <Text className="text-[11px] text-slate-400 mt-1">Timings: {doctor.timings || '09:00 AM - 05:00 PM'}</Text>
          </View>
        </View>

        {/* In-Clinic Appointment Slot Picker */}
        <View>
          <Text className="text-base font-black text-slate-900 mb-2.5">Select In-Clinic Slot</Text>
          <View className="flex-row flex-wrap gap-2.5">
            {SLOTS.map((slot: string) => {
              const isSelected = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.8}
                  className={`px-4 py-2.5 rounded-2xl border ${
                    isSelected
                      ? 'bg-[#00B39B] border-[#00B39B] shadow-sm'
                      : 'bg-slate-50 border-slate-200/90'
                  }`}
                >
                  <Text
                    className={`text-xs font-extrabold ${
                      isSelected ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Booking Bar */}
      <View className="p-4 bg-white border-t border-slate-100 flex-row items-center justify-between shadow-lg">
        <View>
          <Text className="text-[11px] text-slate-400 font-semibold uppercase">In-Clinic Consultation</Text>
          <Text className="text-xl font-black text-slate-900">₹{doctor.consultationFee}</Text>
        </View>

        <TouchableOpacity
          onPress={handleBookNow}
          activeOpacity={0.85}
          className="bg-[#00B39B] px-6 py-3.5 rounded-2xl shadow-sm"
        >
          <Text className="text-sm font-black text-white">Book Clinic Visit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
