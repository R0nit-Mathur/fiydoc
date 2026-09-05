import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { ArrowLeft, Check, Banknote, Smartphone } from 'lucide-react-native';

export default function BookingPaymentScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { bookingDraft, addAppointment } = useAppointmentStore();
  const doctor = bookingDraft.doctor;
  const fee = doctor?.consultationFee || 750;

  const [paymentMode, setPaymentMode] = useState<'CLINIC' | 'UPI'>('CLINIC');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const appointmentId = `apt_${Date.now()}`;
      const tokenNum = `Token #${Math.floor(Math.random() * 12) + 1}`;

      addAppointment({
        id: appointmentId,
        doctorId: doctor?.id || 'doc_1',
        doctorName: doctor?.name || 'Dr. Specialist',
        doctorSpecialty: doctor?.specialty || 'General OPD',
        doctorAvatar: doctor?.avatar || '',
        patientId: user?.id || 'pat_1',
        patientName: user?.name || 'Patient',
        patientAvatar: user?.avatar,
        hospital: doctor?.hospital || 'FiYDoc Clinic',
        date: bookingDraft.date || new Date().toISOString().split('T')[0],
        time: bookingDraft.timeSlot || '10:00 AM',
        mode: 'clinic',
        status: 'upcoming',
        fee,
        symptoms: bookingDraft.symptoms || ['General OPD Consultation'],
        notes: `OPD ${tokenNum}`,
      });

      if (doctor?.id) {
        useNotificationStore.getState().addNotification({
          recipientId: doctor.id,
          recipientRole: 'doctor',
          title: 'New Patient Booking',
          message: `${user?.name || 'A patient'} confirmed a clinic appointment.`,
          type: 'appointment',
          link: '/(doctor)/(tabs)/appointments',
        });
      }

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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        {/* Simple Consultation Fee Card */}
        <View style={styles.feeCard}>
          <Text style={styles.feeLabel}>Consultation Fee</Text>
          <Text style={styles.feeAmount}>₹{fee}</Text>
          <Text style={styles.feeSub}>Direct in-clinic OPD visit with {doctor?.name || 'Doctor'}</Text>
        </View>

        {/* Payment Options (Simple 2 Choices) */}
        <View style={styles.optionsSection}>
          <Text style={styles.sectionTitle}>Payment method</Text>

          <TouchableOpacity
            onPress={() => setPaymentMode('CLINIC')}
            activeOpacity={0.8}
            style={[styles.optionCard, paymentMode === 'CLINIC' && styles.optionCardActive]}
          >
            <Banknote size={22} color={paymentMode === 'CLINIC' ? '#00B39B' : '#64748B'} />
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Pay at Clinic</Text>
              <Text style={styles.optionSubtitle}>Pay at front desk upon your visit</Text>
            </View>
            <View style={[styles.checkCircle, paymentMode === 'CLINIC' && styles.checkCircleActive]}>
              {paymentMode === 'CLINIC' && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPaymentMode('UPI')}
            activeOpacity={0.8}
            style={[styles.optionCard, paymentMode === 'UPI' && styles.optionCardActive]}
          >
            <Smartphone size={22} color={paymentMode === 'UPI' ? '#00B39B' : '#64748B'} />
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>Instant UPI</Text>
              <Text style={styles.optionSubtitle}>Google Pay, PhonePe or Paytm</Text>
            </View>
            <View style={[styles.checkCircle, paymentMode === 'UPI' && styles.checkCircleActive]}>
              {paymentMode === 'UPI' && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Single Pill Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handleConfirm}
          activeOpacity={0.88}
          disabled={loading}
          style={styles.confirmButton}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.confirmText}>
              {paymentMode === 'CLINIC' ? 'Confirm Appointment' : `Pay ₹${fee} via UPI`}
            </Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 28,
  },
  feeCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  feeLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  feeAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 4,
  },
  feeSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  optionsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  optionCardActive: {
    borderColor: '#00B39B',
    backgroundColor: '#F0FDFA',
  },
  optionInfo: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: '#00B39B',
    borderColor: '#00B39B',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  confirmButton: {
    width: '100%',
    backgroundColor: '#0F172A',
    height: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
