import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDoctorsQuery } from '@/hooks/queries/useDoctorsQuery';
import { useAppointmentStore, MAX_PATIENTS_PER_SLOT } from '@/store/useAppointmentStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useLocationStore } from '@/store/useLocationStore';
import { calculateDistanceKm } from '@/utils/distance';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  MapPin,
  CheckCircle2,
  Navigation,
  Banknote,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Users,
  Star,
} from 'lucide-react-native';

const SYMPTOM_CHIPS = [
  'I have a fever',
  'I have a headache',
  'I have a sore throat',
  'I feel dizzy',
  'Abdominal pain',
  'General checkup',
  'Body ache & chills',
];

const MORNING_SLOTS = ['09:30 AM', '10:30 AM', '11:30 AM'];
const EVENING_SLOTS = ['02:00 PM', '04:00 PM', '05:30 PM'];

export default function UnifiedBookingScreen() {
  const router = useRouter();
  const { doctorId } = useLocalSearchParams<{ doctorId?: string }>();
  const { data: doctors, isLoading: isDoctorsLoading } = useDoctorsQuery();
  const { user } = useAuthStore();
  const {
    bookingDraft,
    addAppointment,
    getSlotBookedCount,
    isSlotFull,
  } = useAppointmentStore();

  const matchedDoctor = doctors?.find((d) => d.id === doctorId);
  const doctor = bookingDraft.doctor || matchedDoctor;

  useEffect(() => {
    if (matchedDoctor && (!bookingDraft.doctor || bookingDraft.doctor.id !== matchedDoctor.id)) {
      useAppointmentStore.getState().setBookingDoctor(matchedDoctor);
    }
  }, [matchedDoctor]);

  // Generate next 6 dates
  const dates = React.useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(Date.now() + 86400000 * i);
      const iso = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateNum = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      return { iso, dayName, dateNum };
    });
  }, []);

  const [selectedDate, setSelectedDate] = useState(dates[0].iso);
  const [selectedSlot, setSelectedSlot] = useState(MORNING_SLOTS[0]);
  const [selectedReason, setSelectedReason] = useState(SYMPTOM_CHIPS[0]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'AT_CLINIC' | 'ONLINE'>('AT_CLINIC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Location Proximity
  const {
    latitude: userLat,
    longitude: userLng,
    permissionStatus,
    detectDeviceLocation,
  } = useLocationStore();

  useEffect(() => {
    if (permissionStatus !== 'granted') {
      detectDeviceLocation();
    }
  }, []);

  const distanceKm = React.useMemo(() => {
    if (userLat && userLng && doctor?.latitude && doctor?.longitude) {
      return calculateDistanceKm(userLat, userLng, doctor.latitude, doctor.longitude);
    }
    return null;
  }, [userLat, userLng, doctor]);

  const handleSafeBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(patient)/(tabs)/discovery');
    }
  };

  const handleConfirmBooking = async () => {
    setError('');
    if (!doctor) {
      setError('Doctor information missing. Please choose a specialist from directory.');
      return;
    }

    if (isSlotFull(doctor.id, selectedDate, selectedSlot)) {
      setError('This time slot has reached its maximum capacity of 5 patients. Please choose another slot.');
      return;
    }

    setLoading(true);
    try {
      const appointmentId = `apt_${Date.now()}`;
      const tokenNum = `Token #${Math.floor(Math.random() * 18) + 1}`;
      const fee = doctor.consultationFee || 750;

      // 1. Create appointment in store
      addAppointment({
        id: appointmentId,
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        doctorAvatar: doctor.avatar,
        patientId: user?.id || 'pat_1',
        patientName: user?.name || 'Patient',
        patientAvatar: user?.avatar,
        hospital: doctor.hospital || 'FiYDoc Healthcare OPD',
        date: selectedDate,
        time: selectedSlot,
        mode: 'clinic',
        status: 'upcoming',
        fee,
        symptoms: [selectedReason],
        notes: `OPD Queue Token: ${tokenNum} • Payment: ${paymentMethod === 'AT_CLINIC' ? 'Pay at Clinic' : 'Online Paid'}`,
      });

      // 2. Alert Doctor
      useNotificationStore.getState().addNotification({
        recipientId: doctor.id,
        recipientRole: 'doctor',
        title: 'New Patient Booking',
        message: `${user?.name || 'A patient'} reserved ${selectedSlot} on ${selectedDate} (${selectedReason}).`,
        type: 'appointment',
        link: '/(doctor)/(tabs)/appointments',
      });

      // 3. Alert Patient
      useNotificationStore.getState().addNotification({
        recipientId: user?.id || 'pat_1',
        recipientRole: 'patient',
        title: 'Appointment Reserved!',
        message: `Your visit with ${doctor.name} on ${selectedDate} at ${selectedSlot} is confirmed. ${tokenNum}.`,
        type: 'appointment',
        link: `/(patient)/appointments/${appointmentId}`,
      });

      // 4. Smooth transition straight to success pass!
      router.replace(
        `/(patient)/booking/success?appointmentId=${appointmentId}&tokenNumber=${encodeURIComponent(
          tokenNum
        )}&paymentStatus=${paymentMethod === 'AT_CLINIC' ? 'PAY_AT_CLINIC' : 'PAID'}&paymentMethod=${paymentMethod}`
      );
    } catch (err: any) {
      setError(err?.message || 'Could not complete booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={handleSafeBack} style={styles.backBtn}>
          <ArrowLeft size={22} color="#0B3064" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book OPD Visit</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Summary Card */}
        {doctor ? (
          <View style={styles.doctorCard}>
            <Avatar uri={doctor.avatar} name={doctor.name} size="lg" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.doctorNameRow}>
                <Text style={styles.doctorName} numberOfLines={1}>
                  {doctor.name}
                </Text>
                <CheckCircle2 size={16} color="#00B39B" fill="#E0F7F4" style={{ flexShrink: 0 }} />
              </View>
              <View style={styles.specRatingRow}>
                <Text style={styles.doctorSpec}>{doctor.specialty}</Text>
                <View style={styles.ratingBadge}>
                  <Star size={11} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.ratingText}>4.9</Text>
                </View>
              </View>
              <Text style={styles.doctorHospital} numberOfLines={1}>
                {doctor.hospital || 'FiYDoc Specialty Clinic'}
              </Text>

              {distanceKm !== null ? (
                <View style={styles.distanceBadge}>
                  <MapPin size={12} color="#008C7A" />
                  <Text style={styles.distanceText}>{distanceKm} km from your location</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={detectDeviceLocation}
                  style={styles.enableLocBtn}
                  activeOpacity={0.8}
                >
                  <Navigation size={11} color="#0B3064" />
                  <Text style={styles.enableLocText}>Tap to show clinic distance</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorCard}>
            <AlertCircle size={16} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* 1. Date Selector */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Calendar size={16} color="#0B3064" />
            <Text style={styles.sectionTitle}>1. Choose Consultation Date</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateScrollContainer}
          >
            {dates.map((d) => {
              const isSelected = selectedDate === d.iso;
              return (
                <TouchableOpacity
                  key={d.iso}
                  onPress={() => setSelectedDate(d.iso)}
                  activeOpacity={0.8}
                  style={[styles.dateCard, isSelected && styles.dateCardActive]}
                >
                  <Text style={[styles.dateDayName, isSelected && styles.dateDayNameActive]}>
                    {d.dayName}
                  </Text>
                  <Text style={[styles.dateNumber, isSelected && styles.dateNumberActive]}>
                    {d.dateNum}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2. Slot Selector with 5-Patient Capacity */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <Clock size={16} color="#0B3064" />
            <Text style={styles.sectionTitle}>2. Choose Time Slot (Max 5 Patients/Slot)</Text>
          </View>

          {/* Morning Slots */}
          <Text style={styles.subSectionTitle}>Morning Session</Text>
          <View style={styles.slotsGrid}>
            {MORNING_SLOTS.map((s) => {
              const bookedCount = doctor ? getSlotBookedCount(doctor.id, selectedDate, s) : 0;
              const isFull = bookedCount >= MAX_PATIENTS_PER_SLOT;
              const isSelected = selectedSlot === s && !isFull;

              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => !isFull && setSelectedSlot(s)}
                  disabled={isFull}
                  activeOpacity={0.8}
                  style={[
                    styles.slotPill,
                    isSelected && styles.slotPillActive,
                    isFull && styles.slotPillFull,
                  ]}
                >
                  <Text style={[styles.slotTimeText, isSelected && styles.slotTimeTextActive]}>
                    {s}
                  </Text>

                  {/* Capacity Indicator */}
                  <View
                    style={[
                      styles.capacityTag,
                      isFull
                        ? styles.capacityTagFull
                        : bookedCount >= 4
                        ? styles.capacityTagWarning
                        : styles.capacityTagAvailable,
                    ]}
                  >
                    <Text
                      style={[
                        styles.capacityTagText,
                        isFull
                          ? styles.capacityTextFull
                          : bookedCount >= 4
                          ? styles.capacityTextWarning
                          : styles.capacityTextAvailable,
                      ]}
                    >
                      {isFull ? 'FULL' : `${bookedCount}/5 Booked`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Evening Slots */}
          <Text style={[styles.subSectionTitle, { marginTop: 12 }]}>Evening Session</Text>
          <View style={styles.slotsGrid}>
            {EVENING_SLOTS.map((s) => {
              const bookedCount = doctor ? getSlotBookedCount(doctor.id, selectedDate, s) : 0;
              const isFull = bookedCount >= MAX_PATIENTS_PER_SLOT;
              const isSelected = selectedSlot === s && !isFull;

              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => !isFull && setSelectedSlot(s)}
                  disabled={isFull}
                  activeOpacity={0.8}
                  style={[
                    styles.slotPill,
                    isSelected && styles.slotPillActive,
                    isFull && styles.slotPillFull,
                  ]}
                >
                  <Text style={[styles.slotTimeText, isSelected && styles.slotTimeTextActive]}>
                    {s}
                  </Text>

                  {/* Capacity Indicator */}
                  <View
                    style={[
                      styles.capacityTag,
                      isFull
                        ? styles.capacityTagFull
                        : bookedCount >= 4
                        ? styles.capacityTagWarning
                        : styles.capacityTagAvailable,
                    ]}
                  >
                    <Text
                      style={[
                        styles.capacityTagText,
                        isFull
                          ? styles.capacityTextFull
                          : bookedCount >= 4
                          ? styles.capacityTextWarning
                          : styles.capacityTextAvailable,
                      ]}
                    >
                      {isFull ? 'FULL' : `${bookedCount}/5 Booked`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Describe your symptoms (Inspired by Reference Images 2 & 3) */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>3. Describe your symptoms</Text>
          <View style={styles.symptomInputWrapper}>
            <TextInput
              style={styles.symptomInput}
              placeholder="Type your symptoms or select a chip below..."
              placeholderTextColor="#94A3B8"
              value={customSymptom}
              onChangeText={(text) => {
                setCustomSymptom(text);
                if (text.trim()) setSelectedReason(text.trim());
              }}
            />
          </View>
          <View style={styles.reasonsGrid}>
            {SYMPTOM_CHIPS.map((r) => {
              const isSel = selectedReason === r;
              return (
                <TouchableOpacity
                  key={r}
                  onPress={() => {
                    setSelectedReason(r);
                    setCustomSymptom('');
                  }}
                  activeOpacity={0.8}
                  style={[styles.reasonChip, isSel && styles.reasonChipActive]}
                >
                  <Text style={[styles.reasonText, isSel && styles.reasonTextActive]}>{r}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Payment Preference */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>4. Payment Method</Text>
          <View style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={() => setPaymentMethod('AT_CLINIC')}
              style={[
                styles.payOption,
                paymentMethod === 'AT_CLINIC' && styles.payOptionActive,
              ]}
            >
              <Banknote size={20} color={paymentMethod === 'AT_CLINIC' ? '#00B39B' : '#64748B'} />
              <View style={{ flex: 1 }}>
                <Text style={styles.payOptionTitle}>Pay at Hospital Reception</Text>
                <Text style={styles.payOptionDesc}>
                  Pay ₹{doctor?.consultationFee || 750} in cash or UPI at the front desk upon arrival.
                </Text>
              </View>
              <View style={[styles.radioCircle, paymentMethod === 'AT_CLINIC' && styles.radioCircleActive]}>
                {paymentMethod === 'AT_CLINIC' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPaymentMethod('ONLINE')}
              style={[
                styles.payOption,
                paymentMethod === 'ONLINE' && styles.payOptionActive,
              ]}
            >
              <Smartphone size={20} color={paymentMethod === 'ONLINE' ? '#0B3064' : '#64748B'} />
              <View style={{ flex: 1 }}>
                <Text style={styles.payOptionTitle}>Instant UPI / Card Payment</Text>
                <Text style={styles.payOptionDesc}>
                  Zero queue payment. Generates express digital fast-track pass.
                </Text>
              </View>
              <View style={[styles.radioCircle, paymentMethod === 'ONLINE' && styles.radioCircleActive]}>
                {paymentMethod === 'ONLINE' && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Single-Tap Confirmation Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomMeta}>
          <Text style={styles.bottomFeeLabel}>Total Consultation Fee</Text>
          <Text style={styles.bottomFeeAmount}>₹{doctor?.consultationFee || 750}</Text>
        </View>

        <TouchableOpacity
          onPress={handleConfirmBooking}
          disabled={loading}
          activeOpacity={0.88}
          style={styles.confirmBtn}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <ShieldCheck size={18} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>Confirm Visit & Get Token</Text>
            </>
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0A2540',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 18,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  doctorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    flex: 1,
  },
  specRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  doctorSpec: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B39B',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  doctorHospital: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E6F9F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#008C7A',
  },
  enableLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    marginTop: 4,
  },
  enableLocText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0B3064',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    flex: 1,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0A2540',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dateScrollContainer: {
    gap: 8,
    paddingVertical: 4,
  },
  dateCard: {
    width: 74,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  dateCardActive: {
    borderColor: '#0B3064',
    backgroundColor: '#0B3064',
  },
  dateDayName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  dateDayNameActive: {
    color: '#93C5FD',
  },
  dateNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 3,
  },
  dateNumberActive: {
    color: '#FFFFFF',
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  slotPill: {
    flex: 1,
    minWidth: '47%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotPillActive: {
    borderColor: '#00B39B',
    backgroundColor: '#F0FDFA',
  },
  slotPillFull: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.6,
  },
  slotTimeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  slotTimeTextActive: {
    color: '#008C7A',
  },
  capacityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  capacityTagAvailable: {
    backgroundColor: '#ECFDF5',
  },
  capacityTagWarning: {
    backgroundColor: '#FFFBEB',
  },
  capacityTagFull: {
    backgroundColor: '#FEF2F2',
  },
  capacityTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  capacityTextAvailable: {
    color: '#047857',
  },
  capacityTextWarning: {
    color: '#B45309',
  },
  capacityTextFull: {
    color: '#B91C1C',
  },
  symptomInputWrapper: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 44,
    justifyContent: 'center',
    marginBottom: 8,
  },
  symptomInput: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  reasonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  reasonChipActive: {
    borderColor: '#0B3064',
    backgroundColor: '#0B3064',
  },
  reasonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  reasonTextActive: {
    color: '#FFFFFF',
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  payOptionActive: {
    borderColor: '#00B39B',
    backgroundColor: '#F0FDFA',
  },
  payOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  payOptionDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: '#00B39B',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00B39B',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomMeta: {
    flex: 1,
  },
  bottomFeeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  bottomFeeAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 1,
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: '#0B3064',
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0B3064',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
