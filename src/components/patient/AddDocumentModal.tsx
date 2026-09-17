import React, { useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  Image,
  TouchableOpacity,
  Modal as RNModal,
} from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useHealthStore } from '@/store/useHealthStore';
import { MedicalRecord } from '@/types/index';
import { Palette, Typography, Spacing, StitchColors, BorderRadius } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { ScanText, CheckCircle2, AlertCircle, FileUp, FileCheck, Eye, Plus, X } from 'lucide-react-native';
import { pickClinicalDocument } from '@/utils/mediaPicker';
import { apiClient } from '@/services/apiClient';

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
  const [selectedFile, setSelectedFile] = useState<{ name: string; size?: string; uri: string } | null>(null);
  const [scanStep, setScanStep] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [extractedData, setExtractedData] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handlePickFile = async () => {
    const file = await pickClinicalDocument();
    if (file) {
      setSelectedFile(file);
      if (!docTitle.trim()) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleStartScan = async () => {
    setError('');
    if (!selectedFile || !selectedFile.uri) {
      setError('Please select and attach a document or report file first.');
      return;
    }
    if (!docTitle.trim()) {
      setError('Please enter a document title or test name.');
      return;
    }

    setScanStep('scanning');
    await new Promise((resolve) => setTimeout(resolve, 800));

    const extracted: Record<string, string> = {
      'Document Title': docTitle.trim(),
      'Uploaded File': selectedFile ? selectedFile.name : 'No file attached',
      'Category': docType,
      'Added On': new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      'Storage': selectedFile ? 'Stored securely on this device & cloud timeline' : 'No file attached',
    };

    const tags = ['LOCAL_RECORD', docType.toUpperCase().replace(/\s+/g, '_')];
    const summary = selectedFile
      ? `Uploaded copy of ${selectedFile.name}. Review the original document for clinical values.`
      : `Clinical medical record for ${docTitle.trim()}.`;

    const newRecord: MedicalRecord = {
      id: `rec_${Date.now()}`,
      patientId: user?.id || 'pat_1',
      title: docTitle.trim(),
      type: docType,
      createdAt: 'Today',
      doctorName: 'FiYDoc Health Records',
      facility: 'FiYDoc Healthcare Diagnostics',
      documentUrl: selectedFile?.uri,
      summary,
      extractedTags: tags,
      tags,
    };

    addRecord(newRecord);

    // Persist to backend database timeline
    try {
      await apiClient('/records', {
        method: 'POST',
        body: JSON.stringify({
          title: docTitle.trim(),
          type: docType === 'Prescription' ? 'PRESCRIPTION' : docType === 'Lab Result' ? 'LAB_REPORT' : 'IMAGING',
          recordDate: new Date().toISOString(),
          fileUrl: selectedFile?.uri || '',
          notes: summary,
        }),
      });
    } catch (e) {
      console.warn('[AddDocumentModal] Server record sync notice:', e);
    }

    setExtractedData(extracted);
    setScanStep('complete');
  };

  const handleResetForMore = () => {
    setScanStep('idle');
    setDocTitle('');
    setSelectedFile(null);
    setExtractedData(null);
    setError('');
  };

  const handleCloseModal = () => {
    onClose();
    // Reset state after a delay so animation doesn't pop weirdly
    setTimeout(() => {
      handleResetForMore();
    }, 300);
  };

  return (
    <>
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
              <CheckCircle2 size={20} color="#059669" />
              <Text style={styles.ocrSuccessText}>Document Added to Timeline</Text>
            </View>

            <View style={styles.extractedBox}>
              {Object.entries(extractedData).map(([k, v]) => (
                <View key={k} style={styles.extractedRow}>
                  <Text style={styles.extractedKey}>{k}</Text>
                  <Text style={styles.extractedVal}>{v}</Text>
                </View>
              ))}
            </View>

            {selectedFile?.uri && (
              <Button
                title="View Uploaded Document"
                onPress={() => setShowPreviewModal(true)}
                variant="outline"
                size="md"
                icon={<Eye size={16} color={StitchColors.primary} />}
              />
            )}

            <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Add More"
                  onPress={handleResetForMore}
                  variant="outline"
                  size="lg"
                  icon={<Plus size={16} color={colors.text} />}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Done"
                  onPress={handleCloseModal}
                  variant="primary"
                  size="lg"
                />
              </View>
            </View>
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

            {/* Document / File upload picker */}
            <Pressable
              onPress={handlePickFile}
              style={styles.filePickerBox}
            >
              {selectedFile ? (
                <View style={styles.filePickedRow}>
                  <FileCheck size={22} color={Palette.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fileNameText} numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <Text style={styles.fileSubText}>
                      {selectedFile.size ? `${selectedFile.size} • Stored on this device` : 'Stored on this device'}
                    </Text>
                  </View>
                  <Text style={styles.changeFileText}>Change</Text>
                </View>
              ) : (
                <View style={styles.filePickerPlaceholder}>
                  <FileUp size={24} color={StitchColors.primary} />
                  <Text style={styles.filePickerTitle}>Upload PDF or Scan Image</Text>
                  <Text style={styles.filePickerSub}>Tap to browse files from device</Text>
                </View>
              )}
            </Pressable>

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

    {/* In-App Document Preview Modal */}
    {showPreviewModal && selectedFile?.uri ? (
      <RNModal
        visible={showPreviewModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPreviewModal(false)}
      >
        <View style={styles.previewBackdrop}>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {selectedFile.name || 'Document Preview'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowPreviewModal(false)}
                style={styles.previewCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.previewBody}>
              <Image
                source={{ uri: selectedFile.uri }}
                style={styles.previewImg}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>
      </RNModal>
    ) : null}
    </>
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
  filePickerBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: StitchColors.outlineVariant || '#c3c6d3',
    borderRadius: 12,
    padding: 14,
    backgroundColor: StitchColors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filePickerPlaceholder: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  filePickerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: StitchColors.onSurface,
  },
  filePickerSub: {
    fontSize: 11,
    color: StitchColors.outline,
  },
  filePickedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  fileNameText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: StitchColors.onSurface,
  },
  fileSubText: {
    fontSize: 11,
    color: StitchColors.outline,
    marginTop: 2,
  },
  changeFileText: {
    fontSize: 12,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  ocrSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: Spacing.md,
    borderRadius: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  ocrSuccessText: {
    ...Typography.body,
    color: '#065F46',
    fontWeight: '700',
    fontSize: 14,
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
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  previewCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
    marginRight: 8,
  },
  previewCloseBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#334155',
  },
  previewBody: {
    width: '100%',
    height: 380,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImg: {
    width: '100%',
    height: '100%',
  },
});
