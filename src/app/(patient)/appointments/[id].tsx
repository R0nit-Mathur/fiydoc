/**
 * Appointment Detail Screen — Stitch Clinical Clarity
 *
 * Features:
 * - Status badge, doctor info card
 * - Visit pass (large token number)
 * - Clinic address, symptoms, fee
 * - Action buttons: Get Directions, Cancel
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Linking,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppointmentDetailQuery } from '@/hooks/queries/useAppointmentsQuery';
import { useQueryClient } from '@tanstack/react-query';
import { appointmentService } from '@/services/appointmentService';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { AppointmentSkeleton } from '@/components/ui/Skeleton';
import { StitchColors, Palette, BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatHumanDate, formatTimeSlot, formatCurrency } from '@/utils/formatters';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Building2,
  MapPin,
  CheckCircle2,
  FileText,
  Navigation,
} from 'lucide-react-native';

export default function AppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: apt, isLoading } = useAppointmentDetailQuery(id as string);
  const queryClient = useQueryClient();
  const cancelAppointment = useAppointmentStore((s) => s.cancelAppointment);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const { colors, isDark } = useAppTheme();

  const handleSafeBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(patient)/(tabs)/home');
  };

  if (isLoading || !apt) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Pressable onPress={handleSafeBack} style={[styles.backBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Go back">
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Appointment Details</Text>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <AppointmentSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isCancelled = apt.status === 'cancelled' || apt.status === 'completed';
  const statusVariant = apt.status === 'confirmed' || apt.status === 'upcoming'
    ? 'teal'
    : apt.status === 'pending'
    ? 'warning'
    : apt.status === 'cancelled'
    ? 'danger'
    : 'blue';

  const handleConfirmCancel = async () => {
    setCancelDialogVisible(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    cancelAppointment(apt.id);
    try {
      await appointmentService.cancelAppointment(apt.id);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointment', apt.id] });
    } catch (err: any) {
      console.warn('[AppointmentDetail] Server cancellation warning:', err?.message);
    }

    useNotificationStore.getState().addNotification({
      recipientId: apt.patientId,
      recipientRole: 'patient',
      title: 'Appointment Cancelled',
      message: `Your appointment with ${apt.doctorName} on ${formatHumanDate(apt.date)} has been cancelled.`,
      type: 'appointment',
    });
    useNotificationStore.getState().addNotification({
      recipientId: apt.doctorId,
      recipientRole: 'doctor',
      title: `Appointment Cancelled • ${apt.patientName}`,
      message: `${apt.patientName} has cancelled their ${formatTimeSlot(apt.time)} appointment.`,
      type: 'appointment',
      link: '/(doctor)/(tabs)/appointments',
    });
    router.back();
  };

  const handleDirections = () => {
    const address = encodeURIComponent(apt.hospital || 'FiYDoc Healthcare Clinic');
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={handleSafeBack}
          style={[styles.backBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.2} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Appointment Details
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Delay Notice Banner */}
        {Boolean(apt.delayMinutes && apt.delayMinutes > 0 && apt.status !== 'cancelled') && (
          <View style={{ backgroundColor: '#FEF3C7', borderColor: '#FCD34D', borderWidth: 1, padding: 14, borderRadius: 14, marginBottom: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Clock size={18} color="#D97706" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13.5, fontWeight: '700', color: '#92400E' }}>
                Consultation Delayed (+{apt.delayMinutes} mins)
              </Text>
              <Text style={{ fontSize: 12.5, color: '#78350F', marginTop: 2, lineHeight: 17 }}>
                Dr. {apt.doctorName} is running behind schedule. Your adjusted expected consultation time is{' '}
                <Text style={{ fontWeight: '700' }}>{apt.expectedTime || apt.time}</Text> (was {apt.time}).
                {apt.delayReason ? ` Reason: ${apt.delayReason}.` : ''}
              </Text>
            </View>
          </View>
        )}

        {/* Doctor Leave Cancellation Notice Banner */}
        {Boolean(apt.status === 'cancelled' && apt.isDoctorOnLeave) && (
          <View style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, padding: 14, borderRadius: 14, marginBottom: 14 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#B91C1C', marginBottom: 2 }}>
              Cancelled: Doctor On Leave
            </Text>
            <Text style={{ fontSize: 12.5, color: '#7F1D1D', lineHeight: 18 }}>
              {apt.cancelReason || 'Dr. ' + apt.doctorName + ' is on leave on this date. Your appointment has been cancelled and a full refund has been initiated.'}
            </Text>
          </View>
        )}

        {/* Doctor Card */}
        <Animated.View entering={FadeIn.duration(380)}>
          <View style={[styles.doctorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Avatar uri={apt.doctorAvatar} name={apt.doctorName} size="lg" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.doctorNameRow}>
                <Text style={[styles.doctorName, { color: colors.text }]} numberOfLines={1}>
                  {apt.doctorName}
                </Text>
                <CheckCircle2 size={16} color={StitchColors.primaryContainer} />
              </View>
              <Text style={[styles.doctorSpecialty, { color: StitchColors.primaryContainer }]}>
                {apt.doctorSpecialty}
              </Text>
              <Text style={[styles.hospitalName, { color: colors.textSecondary }]} numberOfLines={1}>
                {apt.hospital}
              </Text>
            </View>
            <Badge label={apt.isDoctorOnLeave ? 'DOC ON LEAVE' : apt.status.toUpperCase()} variant={statusVariant} size="sm" />
          </View>
        </Animated.View>

        {/* Schedule Grid */}
        <Animated.View entering={FadeInDown.delay(60).duration(380)}>
          <View style={[styles.scheduleStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.scheduleItem}>
              <Calendar size={18} color={StitchColors.primaryContainer} />
              <View>
                <Text style={[styles.scheduleLabel, { color: colors.textMuted }]}>DATE</Text>
                <Text style={[styles.scheduleValue, { color: colors.text }]}>{formatHumanDate(apt.date)}</Text>
              </View>
            </View>
            <View style={[styles.vDivider, { backgroundColor: colors.border }]} />
            <View style={styles.scheduleItem}>
              <Clock size={18} color={apt.delayMinutes ? '#D97706' : StitchColors.secondaryContainer} />
              <View>
                <Text style={[styles.scheduleLabel, { color: apt.delayMinutes ? '#D97706' : colors.textMuted }]}>
                  {apt.delayMinutes ? 'EXPECTED' : 'SLOT TIME'}
                </Text>
                <Text style={[styles.scheduleValue, { color: apt.delayMinutes ? '#D97706' : colors.text, fontWeight: apt.delayMinutes ? '700' : '600' }]}>
                  {apt.expectedTime || formatTimeSlot(apt.time)}
                </Text>
              </View>
            </View>
            <View style={[styles.vDivider, { backgroundColor: colors.border }]} />
            <View style={styles.scheduleItem}>
              <Building2 size={18} color={StitchColors.primaryContainer} />
              <View>
                <Text style={[styles.scheduleLabel, { color: colors.textMuted }]}>MODE</Text>
                <Text style={[styles.scheduleValue, { color: colors.text }]}>In-Clinic</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Clinic Address */}
        <Animated.View entering={FadeInDown.delay(100).duration(380)}>
          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoHeader}>
              <MapPin size={18} color={StitchColors.primaryContainer} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>Clinic Address</Text>
            </View>
            <Text style={[styles.clinicAddressText, { color: colors.text }]}>{apt.hospital}</Text>
            <Text style={[styles.clinicInstructionText, { color: colors.textSecondary }]}>
              Please arrive 10 minutes prior to your scheduled time slot. Show this confirmation at the reception desk.
            </Text>
          </View>
        </Animated.View>

        {/* Symptoms */}
        {apt.symptoms && apt.symptoms.length > 0 && (
          <Animated.View entering={FadeInDown.delay(140).duration(380)}>
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Reported Symptoms</Text>
              <View style={styles.symptomsRow}>
                {apt.symptoms.map((s: string, i: number) => (
                  <View
                    key={i}
                    style={[
                      styles.symptomChip,
                      {
                        backgroundColor: isDark ? 'rgba(45, 212, 191, 0.12)' : Palette.healthcareTealLight,
                        borderColor: isDark ? 'rgba(45, 212, 191, 0.25)' : Palette.healthcareTealBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.symptomChipText, { color: StitchColors.secondary }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {/* Digital Rx Card */}
        <Animated.View entering={FadeInDown.delay(180).duration(380)}>
          <View style={[styles.rxCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.rxHeader}>
              <View style={[styles.rxIconBox, { backgroundColor: StitchColors.secondaryContainer }]}>
                <FileText size={16} color="#fff" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.rxCardTitle, { color: colors.text }]}>Digital Prescription (Rx)</Text>
                <Text style={[styles.rxCardSub, { color: colors.textSecondary }]}>Official Consultation Record</Text>
              </View>
              <Badge label="VERIFIED Rx" variant="teal" size="sm" />
            </View>
            <Text style={[styles.rxCardDesc, { color: colors.textSecondary }]}>
              Prescribed medications and lab investigations are recorded in your profile after consultation.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(patient)/(tabs)/health')}
              style={[styles.rxViewButton, { backgroundColor: StitchColors.secondaryContainer }]}
              accessibilityRole="button"
            >
              <Text style={styles.rxViewButtonText}>View Full Rx & Lab Orders</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Fee */}
        <Animated.View entering={FadeInDown.delay(220).duration(380)}>
          <View style={[styles.paymentRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.paymentLabel, { color: colors.text }]}>Consultation Fee</Text>
            <View style={styles.paymentRight}>
              <Badge label="PAY AT CLINIC" variant="blue" size="sm" />
              <Text style={[styles.paymentAmount, { color: colors.text }]}>
                {formatCurrency(apt.fee)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        {!isCancelled && (
          <Animated.View entering={FadeInDown.delay(260).duration(380)} style={styles.actionSection}>
            <TouchableOpacity
              onPress={handleDirections}
              style={[styles.directionsBtn, { backgroundColor: Palette.primaryBlueLight, borderColor: Palette.primaryBlueBorder }]}
            >
              <Navigation size={16} color={StitchColors.primaryContainer} />
              <Text style={styles.directionsBtnText}>Get Directions</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Cancel Bar */}
      {!isCancelled && (
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <Button
            title="Cancel Appointment"
            onPress={() => setCancelDialogVisible(true)}
            variant="danger"
            size="lg"
            fullWidth
          />
        </View>
      )}

      <ConfirmationDialog
        visible={cancelDialogVisible}
        title="Cancel appointment?"
        message={`Are you sure you want to cancel your appointment with ${apt.doctorName} on ${formatHumanDate(apt.date)} at ${formatTimeSlot(apt.time)}?`}
        confirmText="Cancel appointment"
        cancelText="Keep appointment"
        confirmVariant="danger"
        iconVariant="danger"
        onConfirm={handleConfirmCancel}
        onCancel={() => setCancelDialogVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: 14,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    gap: 12,
    ...Shadows.subtle,
  },
  doctorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  doctorSpecialty: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  hospitalName: {
    fontSize: 13,
    marginTop: 2,
  },
  scheduleStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    ...Shadows.subtle,
  },
  scheduleItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  vDivider: {
    width: 1,
    height: 28,
  },
  scheduleLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  scheduleValue: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  infoCard: {
    padding: 16,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 8,
    ...Shadows.subtle,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  clinicAddressText: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  clinicInstructionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionWrap: { gap: 10 },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
  },
  symptomsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  symptomChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rxCard: {
    padding: 16,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 12,
    ...Shadows.subtle,
  },
  rxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rxIconBox: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  rxCardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  rxCardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  rxViewButton: {
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minHeight: 46,
  },
  rxViewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    ...Shadows.subtle,
  },
  paymentLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  paymentRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  actionSection: { gap: 10 },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  directionsBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },
  bottomBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    paddingBottom: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
