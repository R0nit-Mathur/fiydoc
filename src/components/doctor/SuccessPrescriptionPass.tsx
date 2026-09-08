import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Badge } from '@/components/ui/Badge';
import { ConfirmationAnimation } from '@/components/ui/ConfirmationAnimation';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { CheckCircle2, Share2 } from 'lucide-react-native';
import { PrescribedMedicine } from './EPrescriptionBuilder';

interface SuccessPrescriptionPassProps {
  issuedPrescription: any;
  patientName: string;
  doctorName: string;
  doctorSpecialty: string;
  clinicName: string;
  prescribedMeds: PrescribedMedicine[];
}

export function SuccessPrescriptionPass({
  issuedPrescription,
  patientName,
  doctorName,
  doctorSpecialty,
  clinicName,
  prescribedMeds,
}: SuccessPrescriptionPassProps) {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useStyles(colors, isDark);

  const handleShareIssuedRx = async () => {
    if (!issuedPrescription) return;
    try {
      await Share.share({
        title: `Digital Prescription (Rx) • ${doctorName}`,
        message: `FiYDoc Medical Prescription\nDoctor: ${doctorName}\nClinic: ${clinicName}\nPatient: ${patientName}\nDiagnosis: ${issuedPrescription.diagnosis}\nMedications:\n${prescribedMeds.map((m, i) => `${i + 1}. ${m.name} - ${m.dosage} [${m.frequency}] x ${m.duration} (${m.instructions})`).join('\n')}\nVerification Code: ${issuedPrescription.verificationCode}`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.successScroll} showsVerticalScrollIndicator={false}>
      <View style={[styles.successIconBox, { backgroundColor: isDark ? 'rgba(48,209,88,0.15)' : '#E8F5E9', borderColor: isDark ? 'rgba(48,209,88,0.3)' : '#C8E6C9' }]}>
        <CheckCircle2 size={36} color={colors.success} />
      </View>

      <Text style={styles.successTitle}>Consultation Completed</Text>
      <Text style={styles.successSubtitle}>
        Digital prescription signed and saved to {patientName}'s medical records.
      </Text>

      {/* Prescription Pass Card */}
      <View style={styles.rxPassCard}>
        <View style={[styles.rxPassHeader, { backgroundColor: isDark ? 'rgba(10,132,255,0.12)' : '#EFF6FF', borderBottomColor: isDark ? 'rgba(10,132,255,0.2)' : '#BFDBFE' }]}>
          <View>
            <Text style={[styles.rxPassClinic, { color: colors.primary }]}>{clinicName}</Text>
            <Text style={styles.rxPassDoctor}>{doctorName}</Text>
            <Text style={styles.rxPassSub}>{doctorSpecialty}</Text>
          </View>
          <Badge label="DIGITAL Rx" variant="teal" size="sm" />
        </View>

        <View style={styles.rxPassPatientRow}>
          <View>
            <Text style={styles.rxPassLabel}>Patient</Text>
            <Text style={styles.rxPassVal}>{patientName}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.rxPassLabel}>Verification Code</Text>
            <Text style={[styles.rxPassCode, { color: colors.primary }]}>{issuedPrescription.verificationCode}</Text>
          </View>
        </View>

        <View style={styles.rxPassDiagBox}>
          <Text style={styles.rxPassLabel}>Diagnosis</Text>
          <Text style={styles.rxPassDiagText}>{issuedPrescription.diagnosis}</Text>
        </View>

        <View style={{ gap: Spacing.xs, paddingBottom: 14 }}>
          <Text style={[styles.rxPassLabel, { paddingHorizontal: Spacing.lg, paddingTop: 10 }]}>Prescribed Medicines ({prescribedMeds.length})</Text>
          {prescribedMeds.map((m, i) => (
            <View key={i} style={[styles.rxPassMedItem, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={styles.rxPassMedName}>{m.name}</Text>
              <Text style={styles.rxPassMedMeta}>
                {m.dosage} • {m.frequency} • {m.duration}
              </Text>
              {m.instructions ? (
                <Text style={styles.rxPassMedInst}>{m.instructions}</Text>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      {/* Action Row */}
      <View style={styles.successActions}>
        <TouchableOpacity
          onPress={handleShareIssuedRx}
          activeOpacity={0.7}
          style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Share2 size={16} color={colors.primary} />
          <Text style={[styles.shareBtnText, { color: colors.primary }]}>Share Rx</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(doctor)/(tabs)/home')}
          activeOpacity={0.85}
          style={[styles.returnBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.returnBtnText}>Return to Home</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const useStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    successScroll: {
      padding: Spacing.xl,
      paddingBottom: 60,
      alignItems: 'center',
    },
    successIconBox: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      marginBottom: Spacing.md,
    },
    successTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      letterSpacing: -0.4,
    },
    successSubtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 6,
      marginBottom: Spacing.xl,
      maxWidth: 300,
    },
    rxPassCard: {
      width: '100%',
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    rxPassHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: Spacing.lg,
      borderBottomWidth: 1,
    },
    rxPassClinic: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    rxPassDoctor: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginTop: 3,
    },
    rxPassSub: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    rxPassPatientRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: Spacing.lg,
      backgroundColor: colors.background,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rxPassLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 3,
    },
    rxPassVal: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    rxPassCode: {
      fontSize: 13,
      fontWeight: '700',
    },
    rxPassDiagBox: {
      padding: Spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rxPassDiagText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    rxPassMedItem: {
      padding: Spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: Spacing.xs,
      marginHorizontal: Spacing.lg,
    },
    rxPassMedName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    rxPassMedMeta: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 3,
    },
    rxPassMedInst: {
      fontSize: 11,
      color: colors.textMuted,
      fontStyle: 'italic',
      marginTop: 3,
    },
    successActions: {
      width: '100%',
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.xl,
    },
    shareBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      paddingVertical: 13,
      borderRadius: BorderRadius.xl,
      gap: 8,
      minHeight: 48,
    },
    shareBtnText: {
      fontSize: 14,
      fontWeight: '700',
    },
    returnBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
      borderRadius: BorderRadius.xl,
      minHeight: 48,
    },
    returnBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
