import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FileText, Activity, Pill, Stethoscope, CheckCircle2, ChevronRight } from 'lucide-react-native';
import { MedicalRecord } from '@/types/index';
import { Palette, Typography, BorderRadius, Shadows, Spacing } from '@/constants/theme';

interface TimelineProps {
  records: MedicalRecord[];
  onRecordPress?: (record: MedicalRecord) => void;
}

export function Timeline({ records, onRecordPress }: TimelineProps) {
  const getIcon = (type: MedicalRecord['type']) => {
    switch (type) {
      case 'Lab Result':
        return <Activity size={16} color={Palette.healthcareTeal} />;
      case 'Prescription':
        return <Pill size={16} color={Palette.primaryBlue} />;
      case 'Scan/X-Ray':
        return <FileText size={16} color="#8B5CF6" />;
      default:
        return <Stethoscope size={16} color={Palette.warning} />;
    }
  };

  return (
    <View style={styles.container}>
      {records.map((item, index) => {
        const isLast = index === records.length - 1;
        const cleanSummary = (item.summary || '').replace(
          /Prescribed 0 medication\(s\)\.?/gi,
          'Clinical Assessment & Advice (No medications required).'
        );

        return (
          <View key={item.id} style={styles.timelineRow}>
            {/* Timeline Bar & Node */}
            <View style={styles.nodeColumn}>
              <View style={styles.iconNode}>{getIcon(item.type)}</View>
              {!isLast && <View style={styles.verticalBar} />}
            </View>

            {/* Record Card */}
            <TouchableOpacity
              activeOpacity={onRecordPress ? 0.82 : 1}
              onPress={() => onRecordPress?.(item)}
              disabled={!onRecordPress}
              style={styles.card}
            >
              <View style={styles.cardTopline}>
                <Text style={styles.typeText} numberOfLines={1}>
                  {item.type} • {item.createdAt}
                </Text>
                {item.ocrConfidence && (
                  <View style={styles.ocrPill}>
                    <CheckCircle2 size={10} color={Palette.success} />
                    <Text style={styles.ocrText}>{item.ocrConfidence}% OCR</Text>
                  </View>
                )}
              </View>

              <View style={styles.titleRow}>
                <Text style={styles.recordTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {onRecordPress && item.sourceId && (
                  <ChevronRight size={16} color={Palette.textMuted} style={{ flexShrink: 0 }} />
                )}
              </View>

              <Text style={styles.facilityText} numberOfLines={1}>
                {item.facility || 'FiYDoc Health Records'}{' '}
                {item.doctorName ? `• ${item.doctorName}` : ''}
              </Text>

              {cleanSummary ? (
                <Text style={styles.summaryBox}>{cleanSummary}</Text>
              ) : null}

              {/* Tag Chips */}
              {item.extractedTags && item.extractedTags.length > 0 && (
                <View style={styles.tagsRow}>
                  {item.extractedTags.slice(0, 4).map((tag, i) => (
                    <View key={i} style={styles.tagChip}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xs,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  nodeColumn: {
    alignItems: 'center',
    width: 32,
  },
  iconNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Palette.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    zIndex: 2,
    ...Shadows.subtle,
  },
  verticalBar: {
    width: 2,
    flex: 1,
    backgroundColor: Palette.cardBorder,
    marginVertical: 3,
  },
  card: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Palette.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md + 2,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    ...Shadows.subtle,
  },
  cardTopline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.healthcareTeal,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    flex: 1,
  },
  ocrPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.successBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 3,
    borderWidth: 0.5,
    borderColor: Palette.successBorder,
  },
  ocrText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.success,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  recordTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Palette.textPrimary,
    flex: 1,
  },
  facilityText: {
    ...Typography.caption,
    color: Palette.textSecondary,
    marginTop: 2,
  },
  summaryBox: {
    fontSize: 12,
    lineHeight: 18,
    color: Palette.textSecondary,
    marginTop: 8,
    backgroundColor: Palette.background,
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.cardBorderLight,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagChip: {
    backgroundColor: Palette.healthcareTealLight,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: BorderRadius.sm,
    borderWidth: 0.5,
    borderColor: Palette.healthcareTealBorder,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.healthcareTeal,
  },
});
