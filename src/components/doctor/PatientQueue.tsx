/**
 * PatientQueue Component
 * Displays a list of patients waiting for consultation
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Palette, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  Clock,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Video,
  MapPin,
} from 'lucide-react-native';

export interface QueuePatient {
  id: string;
  patientId: string;
  patientName: string;
  patientAvatar?: string;
  date: string;
  time: string;
  status: 'upcoming' | 'confirmed' | 'in_progress' | 'pending' | 'completed';
  symptoms: string[];
  mode: 'video' | 'clinic' | 'in_person';
  notes?: string;
}

interface PatientQueueProps {
  patients: QueuePatient[];
  onPatientPress?: (patient: QueuePatient) => void;
  onStartConsultation?: (patient: QueuePatient) => void;
  emptyMessage?: string;
  showActions?: boolean;
}

export function PatientQueue({
  patients,
  onPatientPress,
  onStartConsultation,
  emptyMessage = 'No patients in queue',
  showActions = true,
}: PatientQueueProps) {
  const { colors, isDark } = useAppTheme();

  const getStatusConfig = (status: QueuePatient['status']) => {
    switch (status) {
      case 'in_progress':
        return { label: 'In Progress', variant: 'blue' as const, color: colors.primary };
      case 'confirmed':
        return { label: 'Confirmed', variant: 'teal' as const, color: colors.teal };
      case 'pending':
        return { label: 'Pending', variant: 'warning' as const, color: colors.warning };
      case 'completed':
        return { label: 'Done', variant: 'success' as const, color: colors.success };
      default:
        return { label: 'Upcoming', variant: 'slate' as const, color: colors.textMuted };
    }
  };

  if (patients.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.emptyIconWrap, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F2F2F7' }]}>
          <Clock size={24} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.queueContainer}>
      {patients.map((patient, index) => {
        const statusConfig = getStatusConfig(patient.status);
        const isNext = index === 0 && patient.status !== 'completed';

        return (
          <Animated.View
            key={patient.id}
            entering={FadeIn.delay(index * 60).duration(300)}
          >
            <Pressable
              onPress={() => onPatientPress?.(patient)}
              style={({ pressed }) => [
                styles.queueCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isNext ? colors.teal : colors.border,
                  borderWidth: isNext ? 2 : 1,
                },
                pressed && { opacity: 0.9 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${patient.patientName}, ${statusConfig.label}`}
            >
              {isNext && (
                <View style={[styles.nextBadge, { backgroundColor: colors.teal }]}>
                  <Text style={styles.nextBadgeText}>NEXT</Text>
                </View>
              )}

              <View style={styles.cardHeader}>
                <View style={styles.patientInfo}>
                  <Avatar
                    uri={patient.patientAvatar}
                    name={patient.patientName}
                    size="md"
                  />
                  <View style={styles.patientDetails}>
                    <Text style={styles.patientName}>{patient.patientName}</Text>
                    <View style={styles.metaRow}>
                      <Calendar size={12} color={colors.textMuted} />
                      <Text style={styles.metaText}>{patient.date}</Text>
                      <Clock size={12} color={colors.textMuted} style={{ marginLeft: 8 }} />
                      <Text style={styles.metaText}>{patient.time}</Text>
                    </View>
                  </View>
                </View>
                <Badge
                  label={statusConfig.label}
                  variant={statusConfig.variant}
                  size="sm"
                />
              </View>

              <View style={styles.cardBody}>
                <View style={styles.symptomsRow}>
                  <AlertCircle size={14} color={colors.primary} />
                  <Text style={styles.symptomsText} numberOfLines={1}>
                    {patient.symptoms.join(', ') || 'General consultation'}
                  </Text>
                </View>
                <View style={styles.modeTag}>
                  {patient.mode === 'video' ? (
                    <Video size={12} color={colors.teal} />
                  ) : (
                    <MapPin size={12} color={colors.primary} />
                  )}
                  <Text style={styles.modeText}>
                    {patient.mode === 'video' ? 'Video Consult' : 'In-Clinic'}
                  </Text>
                </View>
              </View>

              {showActions && patient.status !== 'completed' && (
                <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                  {onStartConsultation && (
                    <Pressable
                      onPress={() => onStartConsultation(patient)}
                      style={({ pressed }) => [
                        styles.startBtn,
                        { backgroundColor: colors.primary },
                        pressed && { opacity: 0.8 },
                      ]}
                    >
                      <CheckCircle2 size={14} color="#FFFFFF" />
                      <Text style={styles.startBtnText}>
                        {patient.status === 'in_progress' ? 'Continue' : 'Start'} Consultation
                      </Text>
                    </Pressable>
                  )}
                  <ChevronRight size={18} color={colors.textMuted} />
                </View>
              )}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  queueContainer: {
    gap: 10,
  },
  queueCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  nextBadge: {
    position: 'absolute',
    top: 0,
    left: 16,
    zIndex: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  nextBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 20,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  symptomsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  symptomsText: {
    fontSize: 13,
    color: Palette.textSecondary,
    flex: 1,
  },
  modeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.primaryBlueLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.primaryBlue,
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
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    flex: 1,
  },
  startBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: 24,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textMuted,
  },
});
