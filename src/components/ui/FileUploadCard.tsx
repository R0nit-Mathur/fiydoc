import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { FileText, Trash2, UploadCloud, CheckCircle2 } from 'lucide-react-native';
import { StitchColors } from '@/constants/theme';

export interface FileUploadCardProps {
  label?: string;
  isUploaded?: boolean;
  fileName?: string;
  fileSize?: string;
  subtitle?: string;
  uploadPrompt?: string;
  uploadSubtitle?: string;
  onUpload?: () => void;
  onRemove?: () => void;
  style?: any;
}

export function FileUploadCard({
  label,
  isUploaded = false,
  fileName = 'Document.pdf',
  fileSize = '2.1 MB',
  subtitle = 'Verified File',
  uploadPrompt = 'Tap to upload certificate',
  uploadSubtitle = 'PDF, JPG, PNG (Max 15MB)',
  onUpload,
  onRemove,
  style,
}: FileUploadCardProps) {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.labelText}>{label}</Text>
          {isUploaded && (
            <View style={styles.verifiedBadge}>
              <CheckCircle2 size={12} color="#059669" />
              <Text style={styles.verifiedText}>Uploaded</Text>
            </View>
          )}
        </View>
      )}

      {isUploaded ? (
        <View style={styles.uploadedCard}>
          <View style={styles.fileInfoRow}>
            <View style={styles.fileIconBox}>
              <FileText size={18} color={StitchColors.primary} />
            </View>
            <View style={styles.textColumn}>
              <Text numberOfLines={1} style={styles.fileName}>
                {fileName}
              </Text>
              <Text style={styles.fileMeta}>
                {fileSize} • {subtitle}
              </Text>
            </View>
          </View>

          {onRemove && (
            <Pressable
              onPress={onRemove}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.deleteButton}
              accessibilityLabel="Remove file"
            >
              <Trash2 size={16} color="#94a3b8" />
            </Pressable>
          )}
        </View>
      ) : (
        <Pressable
          onPress={onUpload}
          style={styles.uploadPlaceholder}
          accessibilityLabel={uploadPrompt}
        >
          <View style={styles.uploadIconCircle}>
            <UploadCloud size={18} color={StitchColors.primary} />
          </View>
          <Text style={styles.uploadPromptText}>{uploadPrompt}</Text>
          <Text style={styles.uploadSubtitleText}>{uploadSubtitle}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  uploadedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    borderRadius: 12,
    padding: 10,
  },
  fileInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    overflow: 'hidden',
  },
  fileIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  fileMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  deleteButton: {
    padding: 6,
    marginLeft: 6,
  },
  uploadPlaceholder: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  uploadPromptText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  uploadSubtitleText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
});
