import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Pill, CheckCircle2 } from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { Prescription } from '@/types/index';
import { Palette, Typography, BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface PrescriptionsTabProps {
  prescriptions: Prescription[];
}

export function PrescriptionsTab({ prescriptions }: PrescriptionsTabProps) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useStyles(colors);

  return (
    <View style={{ gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.sectionHeaderTitle}>Your Prescriptions</Text>
      </View>

      {prescriptions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Pill size={32} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Prescriptions Issued Yet</Text>
          <Text style={styles.emptySubtitle}>
            Once your doctor completes a consultation and signs your prescription, it will appear here electronically.
          </Text>
        </View>
      ) : (
        prescriptions.map((rx) => (
          <TouchableOpacity
            key={rx.id}
            onPress={() => router.push(`/(patient)/health/prescription/${rx.id}`)}
            activeOpacity={0.88}
            style={styles.prescriptionCard}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: Spacing.sm }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.rxDoctorName} numberOfLines={1}>
                    {rx.doctorName || 'Dr. Specialist'}
                  </Text>
                  <CheckCircle2 size={15} color={Palette.healthcareTeal} fill={Palette.healthcareTealLight} />
                </View>
                <Text style={styles.rxSpecialty} numberOfLines={1}>
                  {rx.doctorSpecialty || 'Specialist Consultant'}
                </Text>
                <Text style={styles.rxClinic} numberOfLines={1}>
                  {rx.clinicName || 'FiYDoc Healthcare Clinic'}
                </Text>
              </View>
              <Badge label={rx.createdAt || 'Today'} variant="blue" size="sm" />
            </View>

            {/* Diagnosis Tag */}
            {rx.diagnosis && (
              <View style={styles.diagnosisBox}>
                <Text style={styles.diagnosisLabel}>Diagnosis</Text>
                <Text style={styles.diagnosisText}>{rx.diagnosis}</Text>
              </View>
            )}

            {/* Medicines Summary */}
            <View style={styles.rxSummaryRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Pill size={15} color={Palette.healthcareTeal} />
                <Text style={styles.rxSummaryText}>
                  {rx.medicines?.length || 0} Prescribed Medication(s)
                </Text>
              </View>
              <Text style={styles.viewPassLink}>View Prescription Details →</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  sectionHeaderTitle: {
    ...Typography.h3,
    color: Palette.primaryDark,
  },
  emptyCard: {
    backgroundColor: colors.card,
    padding: Spacing['2xl'],
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.h3,
    color: colors.text,
  },
  emptySubtitle: {
    ...Typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  prescriptionCard: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: Spacing.md,
    ...Shadows.subtle,
  },
  rxDoctorName: {
    ...Typography.h3,
    color: colors.text,
  },
  rxSpecialty: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.healthcareTeal,
    marginTop: 2,
  },
  rxClinic: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  diagnosisBox: {
    backgroundColor: Palette.primaryBlueLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Palette.primaryBlueBorder,
  },
  diagnosisLabel: {
    ...Typography.label,
    fontSize: 10,
    color: Palette.primaryBlue,
  },
  diagnosisText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  rxSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rxSummaryText: {
    ...Typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  viewPassLink: {
    ...Typography.caption,
    color: Palette.primaryBlue,
    fontWeight: '700',
  },
});
