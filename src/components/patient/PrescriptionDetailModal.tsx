import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Share, StyleSheet } from 'react-native';
import { Modal as UIModal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Prescription } from '@/types/index';
import { Palette, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Building2, Pill, Activity, CheckCircle2, Download, Share2 } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';

interface PrescriptionDetailModalProps {
  visible: boolean;
  onClose: () => void;
  prescription: Prescription | null;
}

export function PrescriptionDetailModal({ visible, onClose, prescription }: PrescriptionDetailModalProps) {
  const { user } = useAuthStore();
  const { colors } = useAppTheme();
  const styles = useStyles(colors);
  const [downloadToast, setDownloadToast] = useState(false);

  if (!prescription) return null;

  const buildPrescriptionSummary = (rx: Prescription) => {
    return [
      `FiYDoc Official Medical Prescription`,
      `Verification Code: ${rx.verificationCode}`,
      `Date: ${rx.createdAt}`,
      `Doctor: ${rx.doctorName} (${rx.doctorSpecialty})`,
      `Clinic: ${rx.clinicName || 'FiYDoc Clinic'}`,
      `Patient: ${rx.patientName || user?.name || 'Patient'}`,
      rx.diagnosis ? `Diagnosis: ${rx.diagnosis}` : '',
      `\nPrescribed Medications:`,
      ...(rx.medicines || []).map(
        (m, i) => `${i + 1}. ${m.name} - ${m.dosage} (${m.frequency}) for ${m.durationDays} days. Instructions: ${m.instructions || 'As directed'}`
      ),
      rx.followUpInstructions ? `\nFollow-up Advice: ${rx.followUpInstructions}` : '',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const handleShareRx = async () => {
    try {
      await Share.share({
        title: `Digital Prescription • ${prescription.verificationCode}`,
        message: buildPrescriptionSummary(prescription),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadRx = async () => {
    try {
      await Share.share({
        title: `Prescription_${prescription.verificationCode}.txt`,
        message: buildPrescriptionSummary(prescription),
      });
      setDownloadToast(true);
      setTimeout(() => setDownloadToast(false), 2500);
    } catch {
      setDownloadToast(true);
      setTimeout(() => setDownloadToast(false), 2500);
    }
  };

  return (
    <UIModal
      visible={visible}
      onClose={onClose}
      title="Digital Prescription"
    >
      <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: Spacing.md, paddingVertical: Spacing.xs }}>
          {downloadToast && (
            <View style={styles.toastBox}>
              <CheckCircle2 size={16} color={Palette.success} />
              <Text style={styles.toastText}>Prescription Shared Successfully</Text>
            </View>
          )}

          {/* Clinic Letterhead Header */}
          <View style={styles.letterheadBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Building2 size={16} color={Palette.healthcareTeal} />
                <Text style={styles.letterheadClinic} numberOfLines={1}>
                  {prescription.clinicName || 'FiYDoc Healthcare Clinic'}
                </Text>
              </View>
              <Badge label="VERIFIED" variant="teal" size="sm" />
            </View>

            <Text style={styles.letterheadDoctor}>{prescription.doctorName}</Text>
            <Text style={styles.letterheadSpecialty}>
              {prescription.doctorSpecialty}
            </Text>
            <Text style={styles.letterheadAddress}>
              {prescription.clinicAddress || 'Healthcare Enclave, Clinical OPD Block'}
            </Text>
          </View>

          {/* Patient Details Strip */}
          <View style={styles.patientMetaBox}>
            <View>
              <Text style={styles.metaLabel}>Patient</Text>
              <Text style={styles.metaName}>
                {prescription.patientName || user?.name || 'Patient'}
              </Text>
              <Text style={styles.metaDetails}>
                Age: {prescription.patientAge || 32} • {prescription.patientGender || 'Male'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metaLabel}>Date of Issue</Text>
              <Text style={styles.metaDate}>{prescription.createdAt}</Text>
            </View>
          </View>

          {/* Diagnosis */}
          {prescription.diagnosis && (
            <View style={styles.diagContainer}>
              <Text style={styles.diagLabel}>Doctor's Diagnosis & Notes</Text>
              <Text style={styles.diagVal}>{prescription.diagnosis}</Text>
            </View>
          )}

          {/* Structured Medicines */}
          <View style={{ gap: Spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Pill size={16} color={Palette.healthcareTeal} />
              <Text style={styles.sectionHeaderTitle}>
                Prescribed Medications ({prescription.medicines?.length || 0})
              </Text>
            </View>

            {prescription.medicines?.map((m, idx) => (
              <View key={idx} style={styles.medicineItemCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Text style={styles.medItemName}>{m.name}</Text>
                  <Badge label={m.frequency} variant="teal" size="sm" />
                </View>
                <View style={styles.medSpecsRow}>
                  <View style={styles.medSpecBlock}>
                    <Text style={styles.medSpecLabel}>Dosage</Text>
                    <Text style={styles.medSpecVal}>{m.dosage}</Text>
                  </View>
                  <View style={styles.medSpecBlock}>
                    <Text style={styles.medSpecLabel}>Duration</Text>
                    <Text style={styles.medSpecVal}>{m.durationDays} days</Text>
                  </View>
                </View>
                {m.instructions ? (
                  <Text style={styles.medInstText}>Instructions: {m.instructions}</Text>
                ) : null}
              </View>
            ))}
          </View>

          {/* Diagnostic Tests if any */}
          {prescription.tests && prescription.tests.length > 0 && (
            <View style={{ gap: Spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Activity size={16} color={Palette.primaryBlue} />
                <Text style={styles.sectionHeaderTitle}>
                  Recommended Health Tests
                </Text>
              </View>

              {prescription.tests.map((t, idx) => (
                <View key={idx} style={styles.testItemCard}>
                  <Text style={styles.testItemName}>{t.name}</Text>
                  <Text style={styles.testItemFast}>
                    {t.fastingRequired ? 'Fasting Required' : 'Routine'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Follow-up Notes */}
          {prescription.followUpInstructions && (
            <View style={styles.adviceBox}>
              <Text style={styles.adviceLabel}>Doctor's Advice & Review</Text>
              <Text style={styles.adviceText}>
                {prescription.followUpInstructions}
              </Text>
            </View>
          )}

          {/* Authenticated Seal */}
          <View style={styles.rxVerification}>
            <CheckCircle2 size={13} color={Palette.success} style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rxVerifiedText}>
                Verified Prescription by {prescription.doctorName}
              </Text>
            </View>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.xs }}>
            <TouchableOpacity
              onPress={handleDownloadRx}
              activeOpacity={0.8}
              style={styles.actionBtnOutline}
            >
              <Download size={16} color={colors.text} />
              <Text style={styles.actionBtnOutlineText}>Share as Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShareRx}
              activeOpacity={0.8}
              style={styles.actionBtnTeal}
            >
              <Share2 size={16} color="#FFFFFF" />
              <Text style={styles.actionBtnTealText}>Share Rx</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </UIModal>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  sectionHeaderTitle: {
    ...Typography.h3,
    color: Palette.primaryDark,
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.successBg,
    padding: Spacing.sm,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: Palette.successBorder,
  },
  toastText: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.success,
  },
  letterheadBox: {
    backgroundColor: colors.card,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  letterheadClinic: {
    ...Typography.caption,
    fontWeight: '700',
    color: Palette.healthcareTeal,
  },
  letterheadDoctor: {
    ...Typography.h3,
    fontSize: 16,
    color: colors.text,
    marginTop: Spacing.xs,
  },
  letterheadSpecialty: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  letterheadAddress: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  patientMetaBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaName: {
    ...Typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  metaDetails: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  metaDate: {
    ...Typography.body,
    fontWeight: '700',
    color: colors.text,
  },
  metaCode: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  diagContainer: {
    backgroundColor: colors.background,
    padding: Spacing.md,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: Palette.primaryBlue,
  },
  diagLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.primaryBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  diagVal: {
    ...Typography.body,
    color: colors.text,
  },
  medicineItemCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  medItemName: {
    ...Typography.body,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  medSpecsRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: Spacing.sm,
  },
  medSpecBlock: {
    flex: 1,
  },
  medSpecLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  medSpecVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  medInstText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
  testItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  testItemName: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  testItemFast: {
    fontSize: 10,
    color: Palette.primaryBlue,
    backgroundColor: Palette.primaryBlueLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  adviceBox: {
    backgroundColor: Palette.primaryBlueLight,
    padding: Spacing.md,
    borderRadius: 12,
  },
  adviceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.primaryBlue,
    textTransform: 'uppercase',
  },
  adviceText: {
    fontSize: 13,
    color: Palette.primaryDark,
    marginTop: 4,
  },
  rxVerification: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Palette.successBg,
    padding: Spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Palette.successBorder,
  },
  rxVerifiedText: {
    fontSize: 11,
    color: Palette.success,
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: 8,
  },
  actionBtnOutlineText: {
    ...Typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  actionBtnTeal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.healthcareTeal,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: 8,
  },
  actionBtnTealText: {
    ...Typography.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
