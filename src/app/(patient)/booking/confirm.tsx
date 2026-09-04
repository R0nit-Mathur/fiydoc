import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useBookAppointmentMutation } from '@/hooks/queries/useAppointmentsQuery';
import { ArrowLeft, CheckCircle2, ShieldCheck, Building2, MapPin, AlertCircle } from 'lucide-react-native';

const COMMON_SYMPTOMS = ['Chest Discomfort', 'Breathlessness', 'Headache', 'Fever', 'Skin Rash', 'Fatigue'];

export default function BookingConfirmScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { bookingDraft, setBookingSymptoms, resetBookingDraft } = useAppointmentStore();
  const doctor = bookingDraft.doctor;
  const bookMutation = useBookAppointmentMutation();

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['Chest Discomfort']);
  const [patientNotes, setPatientNotes] = useState('');
  const [error, setError] = useState('');

  const toggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const handleConfirmBooking = async () => {
    if (!doctor) return;
    setError('');

    const patientId = user?.id || 'me';
    const patientName = user?.name || 'Patient';

    setBookingSymptoms(selectedSymptoms, patientNotes);

    try {
      const result = await bookMutation.mutateAsync({
        patientId,
        patientName,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        doctorAvatar: doctor.avatar,
        date: bookingDraft.date || new Date().toISOString().split('T')[0],
        time: bookingDraft.timeSlot || '10:30 AM',
        mode: 'clinic',
        fee: doctor.consultationFee,
        hospital: doctor.hospital,
        symptoms: selectedSymptoms,
        notes: patientNotes || 'General consultation follow-up',
      });

      resetBookingDraft();
      router.replace({
        pathname: '/(patient)/booking/success',
        params: { appointmentId: (result as any)?.id || 'apt_confirmed' },
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to confirm appointment. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white justify-between" edges={['top']}>
      <View>
        <View className="px-5 py-3.5 flex-row items-center justify-between border-b border-slate-100">
          <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
            <ArrowLeft size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-base font-black text-slate-900">Review & Confirm Visit</Text>
          <View className="w-6" />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18 }} showsVerticalScrollIndicator={false}>
          {error ? (
            <View className="bg-red-50 p-3.5 rounded-2xl border border-red-200 flex-row items-center" style={{ gap: 8 }}>
              <AlertCircle size={18} color="#EF4444" />
              <Text className="text-xs font-bold text-red-700 flex-1">{error}</Text>
            </View>
          ) : null}

          {/* Appointment Clinic Summary */}
          <View className="bg-slate-50 p-4 rounded-3xl border border-slate-200/80">
            <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Appointment Summary
            </Text>
            <Text className="text-base font-black text-slate-900">{doctor?.name}</Text>
            <Text className="text-xs text-slate-600 font-semibold mt-0.5">{doctor?.specialty}</Text>

            <View className="flex-row items-center mt-2" style={{ gap: 6 }}>
              <Building2 size={13} color="#1E58C8" />
              <Text className="text-xs font-bold text-[#1E58C8]">
                {doctor?.hospital}
              </Text>
            </View>

            <View className="mt-3 pt-3 border-t border-slate-200 flex-row justify-between items-center">
              <Text className="text-xs font-black text-[#00B39B]">
                {bookingDraft.date} at {bookingDraft.timeSlot}
              </Text>
              <View className="bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-200">
                <Text className="text-[11px] font-bold text-[#00B39B]">In-Clinic Visit</Text>
              </View>
            </View>
          </View>

          {/* Symptom Tag Selector */}
          <View>
            <Text className="text-base font-black text-slate-900 mb-2">Select Primary Symptoms</Text>
            <View className="flex-row flex-wrap gap-2">
              {COMMON_SYMPTOMS.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym);
                return (
                  <TouchableOpacity
                    key={sym}
                    onPress={() => toggleSymptom(sym)}
                    activeOpacity={0.8}
                    className={`px-3.5 py-2 rounded-2xl border ${
                      isSelected
                        ? 'bg-teal-50 border-[#00B39B]'
                        : 'bg-slate-50 border-slate-200/90'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-[#00B39B]' : 'text-slate-700'
                      }`}
                    >
                      {sym}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Notes for Doctor */}
          <View>
            <Input
              label="Additional Notes for Doctor (Optional)"
              placeholder="Mention symptoms duration, current medications, etc."
              multiline
              numberOfLines={3}
              value={patientNotes}
              onChangeText={setPatientNotes}
            />
          </View>

          {/* Price Breakdown */}
          <View className="bg-slate-50 p-4 rounded-3xl border border-slate-200/80" style={{ gap: 8 }}>
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500 font-medium">Consultation Fee</Text>
              <Text className="text-xs font-bold text-slate-900">₹{doctor?.consultationFee}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-slate-500 font-medium">Hospital Facility Charge</Text>
              <Text className="text-xs font-bold text-emerald-600">INCLUDED</Text>
            </View>
            <View className="flex-row justify-between pt-2 border-t border-slate-200">
              <Text className="text-sm font-black text-slate-900">Total Payable at Clinic</Text>
              <Text className="text-base font-black text-[#1E58C8]">₹{doctor?.consultationFee}</Text>
            </View>
          </View>
        </ScrollView>
      </View>

      <View className="p-4 bg-white border-t border-slate-100 shadow-lg">
        <Button
          title={`Confirm Appointment (₹${doctor?.consultationFee || 0})`}
          onPress={handleConfirmBooking}
          loading={bookMutation.isPending}
          variant="primary"
          size="lg"
          icon={<ShieldCheck size={20} color="#FFFFFF" />}
        />
      </View>
    </SafeAreaView>
  );
}
