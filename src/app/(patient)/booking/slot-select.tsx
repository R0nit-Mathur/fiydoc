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
  const { bookingDraft, setBookingSlot, isSlotBooked } = useAppointmentStore();
  const doctor = bookingDraft.doctor;

  const [date, setDate] = useState(bookingDraft.date || DATES[0].full);
  const [slot, setSlot] = useState(bookingDraft.timeSlot || '10:30 AM');
  const [slotError, setSlotError] = useState('');

  const handleSafeBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(patient)/(tabs)/discovery');
    }
  };

  const handleNext = () => {
    if (!slot) {
      setSlotError('Please select a time slot.');
      return;
    }
    if (doctor && isSlotBooked(doctor.id, date, slot)) {
      setSlotError('This slot is already reserved. Please select another slot.');
      return;
    }
    setSlotError('');
    setBookingSlot(date, slot, 'clinic');
    router.push('/(patient)/booking/confirm');
  };

  return (
    <SafeAreaView className="flex-1 bg-white justify-between" edges={['top']}>
      <View>
        <View className="px-5 py-3.5 flex-row items-center justify-between border-b border-slate-100">
          <TouchableOpacity onPress={handleSafeBack} className="p-1 -ml-1">
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
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      alignItems: 'center',
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: isSelected ? '#00B39B' : '#E2E8F0',
                      backgroundColor: isSelected ? '#F0FDFA' : '#FFFFFF',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: isSelected ? '#00B39B' : '#64748B',
                      }}
                    >
                      {item.day}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '900',
                        marginTop: 2,
                        color: isSelected ? '#00B39B' : '#0F172A',
                      }}
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
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-black text-slate-900">Available Clinic Slots</Text>
              <Text className="text-xs text-slate-500 font-semibold">15 mins consultation</Text>
            </View>

            {slotError ? (
              <View className="bg-rose-50 border border-rose-200 p-3 rounded-2xl mb-3">
                <Text className="text-xs font-bold text-rose-700">{slotError}</Text>
              </View>
            ) : null}

            <View className="flex-row flex-wrap gap-2.5">
              {SLOTS.map((s) => {
                const isBooked = Boolean(doctor && isSlotBooked(doctor.id, date, s));
                const isSelected = slot === s && !isBooked;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => {
                      if (!isBooked) {
                        setSlot(s);
                        setSlotError('');
                      }
                    }}
                    activeOpacity={0.8}
                    disabled={isBooked}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 16,
                      borderWidth: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: isBooked ? '#F1F5F9' : isSelected ? '#00B39B' : '#F8FAFC',
                      borderColor: isBooked ? '#E2E8F0' : isSelected ? '#00B39B' : '#E2E8F0',
                      opacity: isBooked ? 0.6 : 1,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: isBooked ? '#94A3B8' : isSelected ? '#FFFFFF' : '#1E293B',
                        textDecorationLine: isBooked ? 'line-through' : 'none',
                      }}
                    >
                      {s}
                    </Text>
                    {isBooked && (
                      <Text style={{ fontSize: 9, fontWeight: '900', color: '#F43F5E', textTransform: 'uppercase' }}>
                        Booked
                      </Text>
                    )}
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
