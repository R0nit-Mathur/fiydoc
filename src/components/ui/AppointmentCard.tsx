import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Appointment } from '@/types/index';
import { Calendar, Clock, Building2, ChevronRight } from 'lucide-react-native';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { Palette, BorderRadius, Shadows } from '@/constants/theme';

interface AppointmentCardProps {
  appointment: Appointment;
  onPress: () => void;
  onCancel?: () => void;
}

export function AppointmentCard({ appointment, onPress, onCancel }: AppointmentCardProps) {
  const statusBadge = {
    upcoming: { label: 'Upcoming', variant: 'blue' as const },
    confirmed: { label: 'Confirmed', variant: 'teal' as const },
    checked_in: { label: 'Checked In', variant: 'teal' as const },
    completed: { label: 'Completed', variant: 'success' as const },
    cancelled: { label: 'Cancelled', variant: 'danger' as const },
    rejected: { label: 'Rejected', variant: 'danger' as const },
    in_progress: { label: 'In Consultation', variant: 'teal' as const },
    pending: { label: 'Pending', variant: 'warning' as const },
  }[appointment.status] || { label: 'Confirmed', variant: 'teal' as const };

  const isCancellable = ['upcoming', 'confirmed', 'pending', 'checked_in'].includes(appointment.status);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        Shadows.card,
        pressed && styles.cardPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Appointment with ${appointment.doctorName} on ${appointment.date} at ${appointment.time}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.typeBadge}>
          <View style={styles.buildingIconWrapper}>
            <Building2 size={13} color={Palette.primaryBlue} />
          </View>
          <Text style={styles.consultationTypeText} numberOfLines={1}>
            In-Clinic Consultation
          </Text>
        </View>
        <Badge label={statusBadge.label} variant={statusBadge.variant} size="sm" />
      </View>

      <View style={styles.doctorInfoRow}>
        <Avatar uri={appointment.doctorAvatar} name={appointment.doctorName} size="md" />

        <View style={styles.doctorDetails}>
          <Text style={styles.doctorName} numberOfLines={1}>
            {appointment.doctorName}
          </Text>
          <Text style={styles.doctorSpecialty} numberOfLines={1}>
            {appointment.doctorSpecialty}
          </Text>
          <Text style={styles.hospitalText} numberOfLines={1}>
            {appointment.hospital}
          </Text>
        </View>

        <ChevronRight size={18} color={Palette.textMuted} style={styles.chevron} />
      </View>

      <View style={styles.footerRow}>
        <View style={styles.timeTag}>
          <Calendar size={13} color={Palette.textSecondary} />
          <Text style={styles.timeTagText}>{appointment.date}</Text>
        </View>
        <View style={styles.timeTag}>
          <Clock size={13} color={Palette.textSecondary} />
          <Text style={styles.timeTagText}>{appointment.time}</Text>
        </View>
        <Text style={styles.feeText}>₹{appointment.fee}</Text>

        {onCancel && isCancellable && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            hitSlop={8}
            style={({ pressed }) => [styles.cancelBtn, pressed && styles.cancelBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Cancel appointment"
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Palette.card,
    borderRadius: BorderRadius.lg,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  cardPressed: {
    opacity: 0.9,
    backgroundColor: Palette.cardBorderLight,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorderLight,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  buildingIconWrapper: {
    backgroundColor: Palette.primaryBlueLight,
    padding: 5,
    borderRadius: BorderRadius.sm,
    flexShrink: 0,
  },
  consultationTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textPrimary,
    flex: 1,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doctorDetails: {
    flex: 1,
    minWidth: 0,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  doctorSpecialty: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.healthcareTeal,
    marginTop: 1,
  },
  hospitalText: {
    fontSize: 12,
    fontWeight: '500',
    color: Palette.textSecondary,
    marginTop: 2,
  },
  chevron: {
    flexShrink: 0,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    backgroundColor: Palette.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Palette.cardBorderLight,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  timeTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  feeText: {
    fontSize: 13,
    fontWeight: '800',
    color: Palette.primaryBlue,
  },
  cancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  cancelBtnPressed: {
    opacity: 0.8,
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
});
