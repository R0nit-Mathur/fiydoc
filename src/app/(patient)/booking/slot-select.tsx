import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ArrowLeft, Calendar, Clock, Building2, MapPin } from 'lucide-react-native';

const DATES = [
  { day: 'Today', date: 'Fri', full: new Date().toISOString().split('T')[0] },
  { day: 'Tomorrow', date: 'Sat', full: new Date(Date.now() + 86400000).toISOString().split('T')[0] },
  { day: 'Sun', date: 'Sun', full: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0] },
  { day: 'Mon', date: 'Mon', full: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0] },
];

const SLOTS = ['09:30 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:30 PM', '05:00 PM'];

export default function BookingSlotSelectScreen() {
  const router = useRouter();
  const { bookingDraft, setBookingSlot } = useAppointmentStore();
  const doctor = bookingDraft.doctor;

  const [date, setDate] = useState(bookingDraft.date || DATES[0].full);
  const [slot, setSlot] = useState(bookingDraft.timeSlot || '10:30 AM');

  const handleNext = () => {
    setBookingSlot(date, slot, 'clinic');
    router.push('/(patient)/booking/confirm');
  };

  return (
    <SafeAreaView className="flex-1 bg-white justify-between" edges={['top']}>
      <View>
        <View className="px-5 py-3.5 flex-row items-center justify-between border-b border-slate-100">
          <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
            <ArrowLeft size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-base font-black text-slate-900">Select Date & Time</Text>
          <View className="w-6" />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }} showsVerticalScrollIndicator={false}>
          {/* Selected Doctor Summary */}
          {doctor && (
            <View className="bg-slate-50 p-4 rounded-3xl border border-slate-200/80 flex-row items-center" style={{ gap: 14 }}>
              <Avatar uri={doctor.avatar} name={doctor.name} size="md" />
              <View className="flex-1">
                <Text className="text-base font-black text-slate-900">{doctor.name}</Text>
                <Text className="text-xs font-bold text-[#00B39B]">{doctor.specialty} • ₹{doctor.consultationFee}</Text>
                <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                  {doctor.hospital}
                </Text>
              </View>
            </View>
          )}

          {/* Consultation Type Banner */}
          <View className="bg-blue-50 p-4 rounded-2xl border border-blue-200 flex-row items-center" style={{ gap: 12 }}>
            <Building2 size={20} color="#1E58C8" />
            <View className="flex-1">
              <Text className="text-xs font-black text-[#1E58C8] uppercase tracking-wide">
                In-Clinic Consultation
              </Text>
              <Text className="text-xs text-slate-600 mt-0.5">
                Physical check-up & diagnosis at {doctor?.hospital || 'the clinic'}.
              </Text>
            </View>
          </View>

          {/* Date Selector */}
          <View>
            <Text className="text-base font-black text-slate-900 mb-3">Choose Date</Text>
            <View className="flex-row justify-between" style={{ gap: 8 }}>
              {DATES.map((item) => {
                const isSelected = date === item.full;
                return (
                  <TouchableOpacity
                    key={item.full}
                    onPress={() => setDate(item.full)}
                    activeOpacity={0.8}
                    className={`flex-1 py-3 items-center rounded-2xl border-2 ${
                      isSelected
                        ? 'border-[#00B39B] bg-teal-50'
                        : 'border-slate-200/90 bg-white'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-[#00B39B]' : 'text-slate-500'
                      }`}
                    >
                      {item.day}
                    </Text>
                    <Text
                      className={`text-sm font-black mt-0.5 ${
                        isSelected ? 'text-[#00B39B]' : 'text-slate-900'
                      }`}
                    >
                      {item.date}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Time Slot Picker */}
          <View>
            <Text className="text-base font-black text-slate-900 mb-3">Available Clinic Slots</Text>
            <View className="flex-row flex-wrap gap-2.5">
              {SLOTS.map((s) => {
                const isSelected = slot === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setSlot(s)}
                    activeOpacity={0.8}
                    className={`px-4 py-2.5 rounded-2xl border ${
                      isSelected
                        ? 'bg-[#00B39B] border-[#00B39B] shadow-sm'
                        : 'bg-slate-50 border-slate-200/90'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-white' : 'text-slate-800'
                      }`}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>

      <View className="p-4 bg-white border-t border-slate-100 shadow-lg">
        <Button
          title="Proceed to Review & Payment"
          onPress={handleNext}
          variant="teal"
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}
