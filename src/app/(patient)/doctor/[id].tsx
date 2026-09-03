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
      <View className="px-5 py-3.5 flex-row items-center justify-between border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
          <ArrowLeft size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text className="text-base font-black text-slate-900">Doctor Profile</Text>
        <View className="w-6" />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Identity Header */}
        <View className="flex-row items-start" style={{ gap: 16 }}>
          <View className="relative">
            <Avatar uri={doctor.avatar} name={doctor.name} size="xl" className="w-24 h-24" />
            <View className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
              <CheckCircle2 size={18} color="#00B39B" fill="#E0F7F4" />
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-xl font-black text-slate-900">{doctor.name}</Text>
            <Text className="text-sm font-bold text-[#00B39B] mt-0.5">{doctor.specialty}</Text>
            <Text className="text-xs text-slate-500 mt-1 font-medium">{doctor.qualification}</Text>

            <View className="flex-row items-center mt-2" style={{ gap: 8 }}>
              <View className="flex-row items-center bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text className="text-xs font-bold text-amber-800 ml-1">
                  {doctor.rating || 4.9} ({doctor.reviewCount || 120} reviews)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Stats Strip */}
        <View className="flex-row justify-around bg-slate-50 p-4 rounded-3xl border border-slate-200/80">
          <View className="items-center">
            <Text className="text-[11px] text-slate-400 font-semibold uppercase">Experience</Text>
            <Text className="text-base font-black text-slate-900 mt-0.5">
              {doctor.experienceYears || 12}+ Yrs
            </Text>
          </View>
          <View className="w-px h-8 bg-slate-200 self-center" />
          <View className="items-center">
            <Text className="text-[11px] text-slate-400 font-semibold uppercase">Consultation Fee</Text>
            <Text className="text-base font-black text-[#1E58C8] mt-0.5">
              ₹{doctor.consultationFee}
            </Text>
          </View>
          <View className="w-px h-8 bg-slate-200 self-center" />
          <View className="items-center">
            <Text className="text-[11px] text-slate-400 font-semibold uppercase">Verification</Text>
            <View className="flex-row items-center mt-1 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
              <ShieldCheck size={11} color="#00B39B" />
              <Text className="text-xs font-bold text-teal-800 ml-1">Verified</Text>
            </View>
          </View>
        </View>

        {/* Practice Clinic Location */}
        <View className="bg-slate-50 p-4.5 rounded-3xl border border-slate-200/80 flex-row items-center" style={{ gap: 14 }}>
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
