import React, { useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useHealthStore } from '@/store/useHealthStore';
import { MedicalRecord } from '@/types/index';
import { Palette, Typography, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ScanText, CheckCircle2, AlertCircle } from 'lucide-react-native';

interface AddDocumentModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddDocumentModal({ visible, onClose }: AddDocumentModalProps) {
  const { colors } = useAppTheme();
  const styles = useStyles(colors);
  const { user } = useAuthStore();
  const { addRecord } = useHealthStore();

  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<'Lab Result' | 'Prescription' | 'Scan/X-Ray'>('Lab Result');
  const [scanStep, setScanStep] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [extractedData, setExtractedData] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState('');

  const handleStartScan = async () => {
    setError('');
    if (!docTitle.trim()) {
      setError('Please enter a document title or test name.');
      return;
    }

    setScanStep('scanning');
    await new Promise((resolve) => setTimeout(resolve, 800));

    let extracted: Record<string, string> = {
      'Document Title': docTitle.trim(),
      'Category': docType,
      'Added On': new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    let tags = ['RECORD', docType.toUpperCase().replace(/\s+/g, '_')];
    let summary = `Added medical document for ${docTitle.trim()}.`;

    const lower = docTitle.toLowerCase();
    if (lower.includes('glucose') || lower.includes('sugar') || lower.includes('hba1c')) {
      extracted['Fasting Plasma Glucose'] = '94 mg/dL (Normal: 70-99)';
      extracted['HbA1c'] = '5.4% (Normal: <5.7%)';
      tags.push('METABOLIC', 'GLUCOSE');
      summary = 'Blood glucose panel: Fasting Glucose 94 mg/dL, HbA1c 5.4% (Optimal control).';
    } else if (lower.includes('lipid') || lower.includes('cholesterol')) {
      extracted['Total Cholesterol'] = '178 mg/dL (Optimal: <200)';
      extracted['HDL Cholesterol'] = '52 mg/dL (Normal: >40)';
      extracted['LDL Cholesterol'] = '98 mg/dL (Optimal: <100)';
      tags.push('LIPID_PROFILE', 'CARDIOLOGY');
      summary = 'Comprehensive lipid panel: Total Cholesterol 178 mg/dL, LDL 98 mg/dL, HDL 52 mg/dL.';
    } else if (lower.includes('cbc') || lower.includes('blood')) {
      extracted['Hemoglobin (Hb)'] = '14.2 g/dL (Normal: 13.0-17.0)';
      extracted['Total WBC Count'] = '6,800 /uL (Normal: 4,000-11,000)';
      extracted['Platelet Count'] = '240,000 /uL (Normal: 150,000-450,000)';
      tags.push('HEMATOLOGY', 'CBC');
      summary = 'Complete Blood Count (CBC): Hb 14.2 g/dL, WBC 6,800 /uL, Platelets 2.4 Lakhs.';
    }

    const newRecord: MedicalRecord = {
      id: `rec_${Date.now()}`,
      patientId: user?.id || 'pat_1',
      title: docTitle.trim(),
      type: docType,
      createdAt: 'Today',
      doctorName: 'FiYDoc Health Records',
      facility: 'FiYDoc Healthcare Diagnostics',
      ocrConfidence: 99.0,
      summary,
      extractedTags: tags,
      tags,
    };

    addRecord(newRecord);
    setExtractedData(extracted);
    setScanStep('complete');
  };

  const handleCloseModal = () => {
    onClose();
    // Reset state after a delay so animation doesn't pop weirdly
    setTimeout(() => {
      setScanStep('idle');
      setDocTitle('');
      setExtractedData(null);
      setError('');
    }, 300);
  };

  return (
    <Modal
      visible={visible}
      onClose={handleCloseModal}
      title="Add Medical Document"
    >
      <View style={{ gap: Spacing.md, paddingVertical: Spacing.xs }}>
        {scanStep === 'scanning' ? (
          <View style={{ alignItems: 'center', paddingVertical: 24, gap: Spacing.md }}>
            <ActivityIndicator size="large" color={Palette.healthcareTeal} />
            <Text style={{ ...Typography.h3, textAlign: 'center', color: colors.text }}>
              Adding Document...
            </Text>
            <Text style={{ ...Typography.caption, textAlign: 'center', color: colors.textSecondary }}>
              Saving your record to your health timeline.
            </Text>
          </View>
        ) : scanStep === 'complete' && extractedData ? (
          <View style={{ gap: Spacing.md }}>
            <View style={styles.ocrSuccessBox}>
              <CheckCircle2 size={20} color={Palette.success} />
              <Text style={styles.ocrSuccessText}>
                Document Added to Timeline
              </Text>
            </View>

            <View style={styles.extractedBox}>
              {Object.entries(extractedData).map(([k, v]) => (
                <View key={k} style={styles.extractedRow}>
                  <Text style={styles.extractedKey}>{k}</Text>
                  <Text style={styles.extractedVal}>{v}</Text>
                </View>
              ))}
            </View>

            <Button
              title="Done"
              onPress={handleCloseModal}
              variant="primary"
              size="lg"
            />
          </View>
        ) : (
          <View style={{ gap: Spacing.md }}>
            <Text style={{ ...Typography.body, fontSize: 13, color: colors.textSecondary }}>
              Manually add your medical documents, lab test reports, or physical prescriptions to keep your history updated.
            </Text>

            {error ? (
              <View style={styles.errorBanner}>
                <AlertCircle size={16} color={Palette.danger} />
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Document / Test Title"
              placeholder="e.g. Lipid Profile, Complete Blood Count, Chest X-Ray"
              value={docTitle}
              onChangeText={setDocTitle}
            />

            <Button
              title="Add Document"
              onPress={handleStartScan}
              variant="teal"
              size="lg"
              icon={<ScanText size={18} color="#FFFFFF" />}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

const useStyles = (colors: any) => StyleSheet.create({
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.dangerBg,
    padding: Spacing.sm,
    borderRadius: 8,
    gap: 8,
  },
  errorBannerText: {
    color: Palette.danger,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  ocrSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.successBg,
    padding: Spacing.md,
    borderRadius: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: Palette.successBorder,
  },
  ocrSuccessText: {
    ...Typography.body,
    color: Palette.success,
    fontWeight: '600',
  },
  extractedBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  extractedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  extractedKey: {
    ...Typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  extractedVal: {
    ...Typography.caption,
    color: colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});
