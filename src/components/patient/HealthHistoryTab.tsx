import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Timeline } from '@/components/ui/Timeline';
import { MedicalRecord, Prescription } from '@/types/index';
import { Palette, Typography, BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface HealthHistoryTabProps {
  records: MedicalRecord[];
  prescriptions: Prescription[];
}

export function HealthHistoryTab({ records, prescriptions }: HealthHistoryTabProps) {
  const router = useRouter();
  const { colors } = useAppTheme();
  const styles = useStyles(colors);

  return (
    <View style={{ gap: Spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.sectionHeaderTitle}>
          Your Health History
        </Text>
        <Text style={styles.recordCountText}>
          {records.length} Event(s)
        </Text>
      </View>

      <Timeline
        records={records}
        onRecordPress={(rec) => {
          if (rec.sourceId) {
            const match = prescriptions.find((p) => p.id === rec.sourceId);
            if (match) {
              router.push(`/(patient)/health/prescription/${match.id}`);
            }
          }
        }}
      />
    </View>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  sectionHeaderTitle: {
    ...Typography.h3,
    color: Palette.primaryDark,
  },
  recordCountText: {
    ...Typography.label,
    fontSize: 10,
    backgroundColor: colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
});
