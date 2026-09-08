/**
 * AppScreen - Clinical Clarity design system screen wrapper
 */
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  RefreshControlProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { Spacing, StitchColors } from '@/constants/theme';

export function AppScreen({
  children,
  scroll = false,
  style,
  fixedHeader,
  refreshControl,
  edges = ['top'],
}: {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  fixedHeader?: React.ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}) {
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scroll, style]}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, style]}>{children}</View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {fixedHeader}
      {content}
    </SafeAreaView>
  );
}

export function PageHeader({ title, subtitle, onBack, right }: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.header}>
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={styles.back}>
          <ChevronLeft size={22} color={StitchColors.onSurface} />
        </Pressable>
      ) : null}
      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.headerRight}>{right}</View> : null}
    </View>
  );
}

export function Section({ title, action, children }: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      {(title || action) ? (
        <View style={styles.sectionHeader}>
          {title ? <Text style={styles.sectionTitle}>{title}</Text> : <View />}
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

export const appStyles = StyleSheet.create({
  card: {
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderColor: StitchColors.outlineVariant,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: StitchColors.outlineVariant },
  actionText: { fontSize: 14, fontWeight: '600', color: StitchColors.primaryContainer },
  eyebrow: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: StitchColors.onSurfaceVariant },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: StitchColors.background },
  fill: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.md, paddingBottom: 40 },
  header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, gap: 12 },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 22,
    lineHeight: 27,
    letterSpacing: -0.45,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  headerSubtitle: { marginTop: 2, fontSize: 13, color: StitchColors.onSurfaceVariant },
  headerRight: { flexShrink: 0 },
  section: { marginTop: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: StitchColors.onSurface,
  },
});
