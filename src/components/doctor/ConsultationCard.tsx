/**
 * ConsultationCard Component
 * Displays a summary card for a consultation session
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Palette, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  Clock,
  Calendar,
  FileText,
  Stethoscope,
  ChevronRight,
  Activity,
  Video,
  MapPin,
} from 'lucide-react-native';

export interface ConsultationSummary {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  date: string;
  time: string;
  status: 'upcoming' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'pending';
  mode: 'video' | 'clinic' | 'in_person';
  symptoms: string[];
  diagnosis?: string;
  prescriptionCount?: number;
  notes?: string;
}

interface ConsultationCardProps {
  consultation: ConsultationSummary;
  onPress?: () => void;
  compact?: boolean;
  showDiagnosis?: boolean;
}

export function ConsultationCard({
  consultation,
  onPress,
  compact = false,
  showDiagnosis = true,
}: ConsultationCardProps) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const getStatusConfig = (status: ConsultationSummary['status']) => {
    switch (status) {
      case 'in_progress':
        return { label: 'In Progress', variant: 'blue' as const, color: colors.primary };
      case 'confirmed':
        return { label: 'Confirmed', variant: 'teal' as const, color: colors.teal };
      case 'pending':
        return { label: 'Pending', variant: 'warning' as const, color: colors.warning };
      case 'completed':
        return { label: 'Completed', variant: 'success' as const, color: colors.success };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'danger' as const, color: colors.danger };
      default:
        return { label: 'Upcoming', variant: 'slate' as const, color: colors.textMuted };
    }
  };

  const statusConfig = getStatusConfig(consultation.status);
  const isClickable = onPress !== undefined || consultation.status !== 'completed';

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (isClickable) {
      router.push(`/(doctor)/consultation/${consultation.id}`);
    }
  };

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        compact && styles.cardCompact,
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.patientInfo}>
          <Avatar
            uri={consultation.patientAvatar}
            name={consultation.patientName}
            size={compact ? 'sm' : 'md'}
          />
          <View style={styles.patientDetails}>
            <Text style={styles.patientName} numberOfLines={1}>
              {consultation.patientName}
            </Text>
            {!compact && (
              <View style={styles.metaRow}>
                <Calendar size={12} color={colors.textMuted} />
                <Text style={styles.metaText}>{consultation.date}</Text>
                <Clock size={12} color={colors.textMuted} style={{ marginLeft: 8 }} />
                <Text style={styles.metaText}>{consultation.time}</Text>
              </View>
            )}
          </View>
        </View>
        <Badge
          label={statusConfig.label}
          variant={statusConfig.variant}
          size="sm"
        />
      </View>

      <View style={[styles.cardBody, { borderTopColor: colors.border }]}>
        <View style={styles.infoRow}>
          {consultation.mode === 'video' ? (
            <Video size={14} color={colors.teal} />
          ) : (
            <MapPin size={14} color={colors.primary} />
          )}
          <Text style={styles.modeText}>
            {consultation.mode === 'video' ? 'Video Consultation' : 'In-Clinic Visit'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <FileText size={14} color={colors.primary} />
          <Text style={styles.symptomsText} numberOfLines={1}>
            {consultation.symptoms.join(', ') || 'General consultation'}
          </Text>
        </View>

        {showDiagnosis && consultation.diagnosis && (
          <View style={styles.infoRow}>
            <Stethoscope size={14} color={colors.teal} />
            <Text style={styles.diagnosisText} numberOfLines={1}>
              {consultation.diagnosis}
            </Text>
          </View>
        )}

        {consultation.prescriptionCount !== undefined && consultation.prescriptionCount > 0 && (
          <View style={styles.rxTag}>
            <Activity size={12} color={colors.teal} />
            <Text style={styles.rxTagText}>
              {consultation.prescriptionCount} medication(s) prescribed
            </Text>
          </View>
        )}
      </View>

      {isClickable && (
        <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
          <Text style={styles.actionText}>
            {consultation.status === 'completed' ? 'View Summary' : 'Open Consultation'}
          </Text>
          <ChevronRight size={16} color={colors.primary} />
        </View>
      )}
    </View>
  );

  if (isClickable) {
    return (
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
        accessibilityRole="button"
        accessibilityLabel={`Consultation with ${consultation.patientName}`}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  cardCompact: {
    padding: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  patientDetails: {
    flex: 1,
    minWidth: 0,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: Palette.textMuted,
    marginLeft: 4,
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeText: {
    fontSize: 13,
    color: Palette.textSecondary,
    fontWeight: '500',
  },
  symptomsText: {
    fontSize: 13,
    color: '#131B2E',
    flex: 1,
  },
  diagnosisText: {
    fontSize: 13,
    color: Palette.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
  rxTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Palette.healthcareTealLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  rxTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.healthcareTeal,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.primaryBlue,
  },
});
