import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDoctorsQuery } from '@/hooks/queries/useDoctorsQuery';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Avatar } from '@/components/ui/Avatar';
import { ArrowLeft, Star, CheckCircle2 } from 'lucide-react-native';

const QUICK_SYMPTOMS = [
  'I have a fever',
  'I have a headache',
  'I have a sore throat',
  'I feel dizzy',
];

const TIME_SLOTS = ['8:00 am', '10:00 am', '01:00 pm', '02:30 pm', '05:00 pm'];

export default function AppointmentBookingScreen() {
  const router = useRouter();
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const { data: doctors } = useDoctorsQuery();
  const { user } = useAuthStore();
  const { bookingDraft, addAppointment } = useAppointmentStore();

  const matchedDoctor = doctors?.find((d) => d.id === doctorId);
  const doctor = bookingDraft.doctor || matchedDoctor || (doctors && doctors[0]);

  useEffect(() => {
    if (matchedDoctor && (!bookingDraft.doctor || bookingDraft.doctor.id !== matchedDoctor.id)) {
      useAppointmentStore.getState().setBookingDoctor(matchedDoctor);
    }
  }, [matchedDoctor]);

  // Next 6 days
  const dates = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(Date.now() + 86400000 * i);
      const iso = d.toISOString().split('T')[0];
      const day = d.toLocaleDateString('en-US', { weekday: 'short' });
      const num = d.getDate();
      return { iso, day, num };
    });
  }, []);

  const [selectedDate, setSelectedDate] = useState(dates[0].iso);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[1]);
  const [selectedSymptom, setSelectedSymptom] = useState(QUICK_SYMPTOMS[0]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBookNow = async () => {
    if (!doctor) return;
    setLoading(true);

    try {
      const appointmentId = `apt_${Date.now()}`;
      const tokenNum = `Token #${Math.floor(Math.random() * 12) + 1}`;
      const symptoms = [customSymptom.trim() || selectedSymptom];

      // Save to store
      addAppointment({
        id: appointmentId,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        doctorAvatar: doctor.avatar,
        patientId: user?.id || 'pat_1',
        patientName: user?.name || 'Patient',
        patientAvatar: user?.avatar,
        hospital: doctor.hospital || 'FiYDoc Healthcare Clinic',
        date: selectedDate,
        time: selectedSlot,
        mode: 'clinic',
        status: 'upcoming',
        fee: doctor.consultationFee || 750,
        symptoms,
        notes: `OPD ${tokenNum}`,
      });

      // Notify Doctor
      useNotificationStore.getState().addNotification({
        recipientId: doctor.id,
        recipientRole: 'doctor',
        title: 'New Patient Booking',
        message: `${user?.name || 'A patient'} booked ${selectedSlot} on ${selectedDate}.`,
        type: 'appointment',
        link: '/(doctor)/(tabs)/appointments',
      });

      // Immediate success OPD pass
      router.replace(
        `/(patient)/booking/success?appointmentId=${appointmentId}&tokenNumber=${encodeURIComponent(
          tokenNum
        )}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Clean Minimal Header (Reference Images 2 & 3) */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(patient)/(tabs)/home'))}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Summary Card */}
        {doctor && (
          <View style={styles.doctorCard}>
            <Avatar uri={doctor.avatar} name={doctor.name} size="md" />
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
              <Text style={styles.doctorHours}>8:00 am – 5:00 pm</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>4.9</Text>
            </View>
          </View>
        )}

        {/* Section: Appointment Slot */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appointment slot</Text>

          {/* Horizontal Date Bubbles */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScroll}
          >
            {dates.map((d) => {
              const active = selectedDate === d.iso;
              return (
                <TouchableOpacity
                  key={d.iso}
                  onPress={() => setSelectedDate(d.iso)}
                  activeOpacity={0.8}
                  style={[styles.dateBubble, active && styles.dateBubbleActive]}
                >
                  <Text style={[styles.dateDay, active && styles.dateDayActive]}>
                    {d.day}
                  </Text>
                  <Text style={[styles.dateNum, active && styles.dateNumActive]}>
                    {d.num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Time Slot Chips */}
          <View style={styles.timeSlotsRow}>
            {TIME_SLOTS.map((slot) => {
              const active = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={slot}
                  onPress={() => setSelectedSlot(slot)}
                  activeOpacity={0.8}
                  style={[styles.timeChip, active && styles.timeChipActive]}
                >
                  <Text style={[styles.timeChipText, active && styles.timeChipTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Describe Your Symptoms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Describe your symptoms</Text>

          {/* Clean Input */}
          <View style={styles.symptomInputContainer}>
            <TextInput
              style={styles.symptomInput}
              placeholder="Type your symptoms"
              placeholderTextColor="#94A3B8"
              value={customSymptom}
              onChangeText={setCustomSymptom}
            />
          </View>

          {/* 4 Clean Quick Chips */}
          <View style={styles.symptomChipsRow}>
            {QUICK_SYMPTOMS.map((sym) => {
              const active = !customSymptom && selectedSymptom === sym;
              return (
                <TouchableOpacity
                  key={sym}
                  onPress={() => {
                    setSelectedSymptom(sym);
                    setCustomSymptom('');
                  }}
                  activeOpacity={0.8}
                  style={[styles.symptomChip, active && styles.symptomChipActive]}
                >
                  <Text style={[styles.symptomChipText, active && styles.symptomChipTextActive]}>
                    {sym}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Single Pill Button CTA at Bottom (Reference Images 1, 2, 3) */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handleBookNow}
          activeOpacity={0.88}
          disabled={loading}
          style={styles.bookNowButton}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.bookNowText}>Book now</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 24,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  doctorSpecialty: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  doctorHours: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#D97706',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateScroll: {
    gap: 10,
    paddingVertical: 2,
  },
  dateBubble: {
    width: 58,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 4,
  },
  dateBubbleActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  dateDay: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  dateDayActive: {
    color: '#94A3B8',
  },
  dateNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateNumActive: {
    color: '#FFFFFF',
  },
  timeSlotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timeChipActive: {
    backgroundColor: '#00B39B',
    borderColor: '#00B39B',
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  timeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  symptomInputContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    height: 50,
    justifyContent: 'center',
  },
  symptomInput: {
    fontSize: 14,
    color: '#0F172A',
  },
  symptomChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  symptomChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  symptomChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  symptomChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  symptomChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  bookNowButton: {
    width: '100%',
    backgroundColor: '#0F172A',
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookNowText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
