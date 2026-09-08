import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Spacing, BorderRadius } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Stethoscope } from 'lucide-react-native';
import { COMMON_DIAGNOSIS_SHORTCUTS } from '@/constants/prescriptionShorthands';

interface DiagnosisSectionProps {
  diagnosis: string;
  setDiagnosis: (val: string) => void;
  clinicalNotes: string;
  setClinicalNotes: (val: string) => void;
}

export function DiagnosisSection({
  diagnosis,
  setDiagnosis,
  clinicalNotes,
  setClinicalNotes,
}: DiagnosisSectionProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.sectionHeaderRow}>
        <Stethoscope size={16} color={colors.primary} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Diagnosis & Assessment</Text>
      </View>

      <View style={{ gap: Spacing.xs }}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Primary Clinical Diagnosis</Text>
        <View style={styles.diagnosisChips}>
          {COMMON_DIAGNOSIS_SHORTCUTS.map((s) => (
            <TouchableOpacity
              key={s.label}
              onPress={() => setDiagnosis(s.value)}
              activeOpacity={0.75}
              style={[
                styles.diagnosisChip,
                {
                  backgroundColor: isDark ? 'rgba(20, 80, 163, 0.2)' : '#EBF5FF',
                  borderColor: isDark ? colors.border : '#ADC6FF',
                },
              ]}
            >
              <Text style={[styles.diagnosisChipLabel, { color: colors.primary }]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          placeholder="e.g. Acute Viral Bronchitis, Essential Hypertension"
          placeholderTextColor={colors.textMuted}
          value={diagnosis}
          onChangeText={setDiagnosis}
          style={[
            styles.inputField,
            { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
          ]}
        />
      </View>

      <View style={{ gap: Spacing.xs, marginTop: Spacing.sm }}>
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Clinical Examination Notes</Text>
        <TextInput
          placeholder="Record clinical findings, chest auscultation, or observations..."
          placeholderTextColor={colors.textMuted}
          value={clinicalNotes}
          onChangeText={setClinicalNotes}
          multiline
          numberOfLines={3}
          style={[
            styles.inputField,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
              height: 80,
              textAlignVertical: 'top',
              paddingTop: Spacing.sm,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: 15,
  },
  diagnosisChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  diagnosisChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  diagnosisChipLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
