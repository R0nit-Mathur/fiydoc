import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHealthRecordsQuery } from '@/hooks/queries/useHealthRecordsQuery';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft } from 'lucide-react-native';
import { BorderRadius, Shadows, StitchColors, Palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatHumanDate } from '@/utils/formatters';

export default function RecordDetailScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: records } = useHealthRecordsQuery('pat_1');

  const rec = records?.find((r) => r.id === id) || records?.[0];
  const styles = useStyles(colors, isDark);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topHeader}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Health Record Details</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {rec ? (
            <>
              <View style={styles.titleSection}>
                <Badge label={rec.type} variant="teal" size="md" />
                <Text style={styles.recordTitle}>{rec.title}</Text>
                <Text style={styles.recordSubtext}>
                  Indexed by FiYDoc Clinical Records
                </Text>
              </View>

              <View style={styles.metaCard}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Date Processed</Text>
                  <Text style={styles.metaValue}>{formatHumanDate(rec.createdAt)}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Facility / Lab</Text>
                  <Text style={styles.metaValue}>{rec.facility || 'FiYDoc Healthcare'}</Text>
                </View>
                {rec.ocrConfidence ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Confidence Index</Text>
                    <Text style={styles.confidenceValue}>{rec.ocrConfidence}%</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryHeading}>Extracted Summary & Tags</Text>
                <Text style={styles.summaryBody}>{rec.summary}</Text>
                <View style={styles.tagsRow}>
                  {rec.extractedTags?.map((tag, i) => (
                    <View
                      key={i}
                      style={styles.tagBadge}
                    >
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          ) : (
            <View style={styles.notFoundWrap}>
              <Text style={styles.notFoundText}>Record not found.</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const useStyles = (colors: ReturnType<typeof useAppTheme>['colors'], isDark: boolean) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: colors.text,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  titleSection: {
    gap: 6,
    marginBottom: 4,
  },
  recordTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginTop: 4,
    color: colors.text,
  },
  recordSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  metaCard: {
    padding: 16,
    borderRadius: BorderRadius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    ...Shadows.subtle,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  confidenceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: StitchColors.secondaryContainer,
  },
  summaryCard: {
    padding: 16,
    borderRadius: BorderRadius.xl,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  summaryHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  summaryBody: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  notFoundWrap: {
    padding: 40,
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 15,
    color: colors.textMuted,
  },
});
