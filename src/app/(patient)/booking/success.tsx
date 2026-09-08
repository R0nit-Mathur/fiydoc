/**
 * Booking Success Screen — Stitch Clinical Clarity
 *
 * Features:
 * - Animated confirmation (ConfirmationAnimation component)
 * - Clinic digital token pass card (visit pass)
 * - Appointment details
 * - Action buttons: View Appointment, Get Directions, Cancel
 * - Return to Home button
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useAppointmentDetailQuery } from '@/hooks/queries/useAppointmentsQuery';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { ConfirmationAnimation } from '@/components/ui/ConfirmationAnimation';
import {
  StitchColors,
  Palette,
  Typography,
  BorderRadius,
  Shadows,
  Spacing,
} from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatHumanDate, formatTimeSlot, formatCurrency } from '@/utils/formatters';
import {
  Calendar,
  Clock,
  QrCode,
  Building2,
  Share2,
  MapPin,
  XCircle,
} from 'lucide-react-native';

export default function BookingSuccessScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const params = useLocalSearchParams<{ appointmentId?: string; tokenNumber?: string }>();

  const { appointments, cancelAppointment } = useAppointmentStore();
  const targetId = params.appointmentId || 'apt_101';
  const { data: remoteApt } = useAppointmentDetailQuery(targetId);
  const localApt = appointments.find((a) => a.id === targetId);
  const apt = localApt || remoteApt;

  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const tokenNumber = params.tokenNumber || 'Token #04';
  const isPending = !apt || apt.status === 'pending';

  const handleSharePass = async () => {
    try {
      await Share.share({
        title: `FiYDoc Clinic Pass • ${tokenNumber}`,
        message: `FiYDoc ${isPending ? 'Queued Appointment Request' : 'Confirmed Appointment Pass'}\nDoctor: ${apt?.doctorName || 'Dr. Specialist'}\nSpecialty: ${apt?.doctorSpecialty || 'Specialist'}\nDate: ${apt?.date || 'Today'} at ${apt?.time || '10:00 AM'}\nClinic: ${apt?.hospital || 'FiYDoc Healthcare Clinic'}\nQueue Token: ${tokenNumber}\nStatus: ${isPending ? 'Awaiting Doctor Approval' : 'Confirmed'}`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleGetDirections = () => {
    const address = encodeURIComponent(apt?.hospital || 'FiYDoc Healthcare Clinic');
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${address}`);
  };

  const handleConfirmCancel = () => {
    setCancelDialogVisible(false);
    if (apt?.id) {
      cancelAppointment(apt.id);
    }
    router.replace('/(patient)/(tabs)/home');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Confirmation */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.animationContainer}>
          <ConfirmationAnimation
            title="Booking Confirmed!"
            subtitle="Your clinic consultation pass has been generated. Show your token at the OPD reception."
            color={StitchColors.secondaryContainer}
            size={72}
          />
        </Animated.View>

        {/* Clinic Token Pass Card */}
        <Animated.View entering={FadeInUp.delay(120).duration(400)}>
          <View style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Letterhead */}
            <View style={styles.ticketLetterhead}>
              <FiYLogo size="sm" />
              <Badge
                label={isPending ? 'QUEUED FOR APPROVAL' : 'IN-CLINIC PASS'}
                variant={isPending ? 'warning' : 'teal'}
                size="sm"
              />
            </View>

            {/* Token Banner */}
            <View
              style={[
                styles.tokenBanner,
                { backgroundColor: isPending ? '#0f172a' : StitchColors.primary },
                !isPending && styles.tokenBannerConfirmed,
              ]}
            >
              <View>
                <Text style={styles.tokenLabel}>Queue Token Number</Text>
                <Text style={styles.tokenNumber}>{tokenNumber}</Text>
              </View>
              <View style={styles.priorityPill}>
                <Text style={styles.priorityPillText}>
                  {isPending ? 'OPD Queue' : 'Priority OPD'}
                </Text>
              </View>
            </View>

            {/* Doctor Info */}
            <View style={{ gap: 2 }}>
              <Text style={[styles.doctorName, { color: colors.text }]}>
                {apt?.doctorName || 'Dr. Specialist'}
              </Text>
              <Text style={[styles.doctorSpecialty, { color: StitchColors.secondaryContainer }]}>
                {apt?.doctorSpecialty || 'Specialist Consultant'}
              </Text>
              <View style={styles.clinicRow}>
                <Building2 size={13} color={colors.textMuted} />
                <Text style={[styles.clinicName, { color: colors.textSecondary }]} numberOfLines={1}>
                  {apt?.hospital || 'FiYDoc Healthcare Clinic'}
                </Text>
              </View>
            </View>

            {/* Date & Time Strip */}
            <View
              style={[
                styles.dateTimeStrip,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : Palette.surfaceTrack },
              ]}
            >
              <View style={styles.dateTimeItem}>
                <Calendar size={15} color={StitchColors.primaryContainer} />
                <Text style={[styles.dateTimeVal, { color: colors.text }]}>
                  {formatHumanDate(apt?.date)}
                </Text>
              </View>
              <View style={styles.dateTimeItem}>
                <Clock size={15} color={StitchColors.primaryContainer} />
                <Text style={[styles.dateTimeVal, { color: colors.text }]}>
                  {formatTimeSlot(apt?.time)}
                </Text>
              </View>
            </View>

            {/* Symptoms */}
            {apt?.symptoms && apt.symptoms.length > 0 && (
              <View
                style={[
                  styles.symptomsBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(45, 212, 191, 0.1)'
                      : Palette.healthcareTealLight,
                  },
                ]}
              >
                <Text style={[styles.symptomsLabel, { color: StitchColors.secondary }]}>
                  Reported Symptoms:
                </Text>
                <Text style={[styles.symptomsVal, { color: colors.text }]}>
                  {apt.symptoms.join(', ')}
                </Text>
              </View>
            )}

            {/* Fee */}
            <View style={[styles.feeRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.feeLabel, { color: colors.textSecondary }]}>
                Consultation Fee (Pay at Clinic)
              </Text>
              <Text style={[styles.feeVal, { color: colors.text }]}>
                {formatCurrency(apt?.fee || 750)}
              </Text>
            </View>

            {/* QR or Queue Info */}
            {isPending ? (
              <View style={styles.queueInfoBox}>
                <View style={styles.queueInfoRow}>
                  <Clock size={16} color={Palette.warning} />
                  <Text style={styles.queueInfoTitle}>Awaiting Doctor Slot Review</Text>
                </View>
                <Text style={styles.queueInfoText}>
                  Dr. {apt?.doctorName || 'Doctor'} has been notified in their OPD Queue. Once confirmed, this pass activates with your verified QR code.
                </Text>
              </View>
            ) : (
              <View style={styles.qrContainer}>
                <View style={[styles.qrBox, { backgroundColor: colors.card }]}>
                  <QrCode size={90} color={StitchColors.primary} />
                </View>
                <Text style={[styles.qrInstruction, { color: colors.textMuted }]}>
                  Show this QR or {tokenNumber} at the clinic reception desk
                </Text>
              </View>
            )}

            {/* Share */}
            <TouchableOpacity
              onPress={handleSharePass}
              activeOpacity={0.8}
              style={[styles.shareBtn, { backgroundColor: Palette.healthcareTealLight, borderColor: Palette.healthcareTealBorder }]}
            >
              <Share2 size={15} color={StitchColors.secondary} />
              <Text style={styles.shareBtnText}>
                {isPending ? 'Share Request Details' : 'Share Clinic Pass'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeInUp.delay(240).duration(400)} style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => router.replace(`/(patient)/appointments/${targetId}`)}
            activeOpacity={0.85}
            style={[styles.primaryActionBtn, { backgroundColor: StitchColors.primary }]}
          >
            <Text style={styles.primaryActionBtnText}>View Appointment Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGetDirections}
            activeOpacity={0.85}
            style={[styles.secondaryActionBtn, { backgroundColor: Palette.primaryBlueLight, borderColor: Palette.primaryBlueBorder }]}
          >
            <MapPin size={16} color={StitchColors.primaryContainer} />
            <Text style={styles.secondaryActionBtnText}>Get Directions to Clinic</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setCancelDialogVisible(true)}
            activeOpacity={0.8}
            style={styles.cancelLinkBtn}
          >
            <XCircle size={15} color={StitchColors.error} />
            <Text style={styles.cancelLinkText}>Cancel Appointment</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <Button
          title="Return to Home"
          onPress={() => router.replace('/(patient)/(tabs)/home')}
          variant="secondary"
          size="lg"
          fullWidth
        />
      </View>

      <ConfirmationDialog
        visible={cancelDialogVisible}
        title="Cancel appointment?"
        message={`Are you sure you want to cancel your appointment with ${apt?.doctorName || 'your doctor'}?`}
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
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: 24,
  },
  animationContainer: { alignItems: 'center', marginVertical: Spacing.lg },

  /* --- Ticket Card --- */
  ticketCard: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1,
    gap: 16,
  },
  ticketLetterhead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenBanner: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenBannerConfirmed: {
    shadowColor: StitchColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  tokenLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: StitchColors.primaryFixedDim,
  },
  tokenNumber: {
    ...Typography.h1,
    color: '#fff',
    fontSize: 30,
    lineHeight: 36,
    marginTop: 2,
  },
  priorityPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },

  doctorName: {
    ...Typography.h3,
    fontSize: 19,
  },
  doctorSpecialty: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  clinicName: {
    fontSize: 12,
    flex: 1,
  },

  dateTimeStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeVal: {
    fontSize: 13,
    fontWeight: '800',
  },

  symptomsBox: {
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
  },
  symptomsLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  symptomsVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },

  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  feeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  feeVal: {
    fontSize: 15,
    fontWeight: '900',
  },

  /* --- QR --- */
  qrContainer: { alignItems: 'center', gap: 8 },
  qrBox: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: StitchColors.outlineVariant,
  },
  qrInstruction: {
    fontSize: 11,
    textAlign: 'center',
  },

  /* --- Queue Info --- */
  queueInfoBox: {
    backgroundColor: Palette.warningBg,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Palette.warningBorder,
    gap: 4,
  },
  queueInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  queueInfoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.warning,
  },
  queueInfoText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#78350F',
  },

  /* --- Share --- */
  shareBtn: {
    paddingVertical: Spacing.md - 2,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  shareBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: StitchColors.secondary,
  },

  /* --- Actions --- */
  actionsContainer: {
    width: '100%',
    gap: Spacing.sm,
  },
  primaryActionBtn: {
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  secondaryActionBtn: {
    borderWidth: 1,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: StitchColors.primaryContainer,
  },
  cancelLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    gap: 6,
  },
  cancelLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: StitchColors.error,
  },

  /* --- Bottom --- */
  bottomBar: {
    padding: Spacing.lg,
    paddingBottom: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
