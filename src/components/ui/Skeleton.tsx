/**
 * Skeleton - Apple HIG-style loading skeleton components
 * Provides shimmer-ready skeleton variations for common UI patterns
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Shimmer, ShimmerProps } from './Shimmer';
import { BorderRadius, Spacing } from '@/constants/theme';

export interface SkeletonProps extends Omit<ShimmerProps, 'width' | 'height'> {
  width?: number | string | 'auto';
  height?: number | 'auto';
}

export function Skeleton({ width = '100%', height = 20, style, ...shimmerProps }: SkeletonProps) {
  return (
    <Shimmer
      width={width === 'auto' ? undefined : width}
      height={height === 'auto' ? 20 : height}
      style={style}
      {...shimmerProps}
    />
  );
}

// Card Skeleton
export function CardSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.cardSkeleton, style]}>
      <View style={styles.cardHeader}>
        <Shimmer width={48} height={48} borderRadius={24} />
        <View style={styles.cardHeaderText}>
          <Shimmer width="60%" height={16} style={styles.mb4} />
          <Shimmer width="40%" height={12} />
        </View>
      </View>
      <Shimmer width="100%" height={12} style={styles.mt12} />
      <Shimmer width="85%" height={12} style={styles.mt8} />
      <Shimmer width="70%" height={12} style={styles.mt8} />
    </View>
  );
}

// List Item Skeleton
export function ListItemSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.listItemSkeleton, style]}>
      <Shimmer width={44} height={44} borderRadius={22} />
      <View style={styles.listItemContent}>
        <Shimmer width="50%" height={14} style={styles.mb6} />
        <Shimmer width="75%" height={12} />
      </View>
      <Shimmer width={60} height={28} borderRadius={14} />
    </View>
  );
}

// Text Block Skeleton
export function TextBlockSkeleton({ lines = 3, style }: { lines?: number; style?: ViewStyle }) {
  return (
    <View style={[styles.textBlock, style]}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={14}
          style={i > 0 ? styles.mt8 : undefined}
        />
      ))}
    </View>
  );
}

// Avatar Skeleton
export function AvatarSkeleton({ size = 48, style }: { size?: number; style?: ViewStyle }) {
  return (
    <Shimmer
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.statsCardSkeleton, style]}>
      <Shimmer width={32} height={32} borderRadius={8} />
      <Shimmer width="50%" height={28} style={styles.mt12} />
      <Shimmer width="70%" height={12} style={styles.mt8} />
    </View>
  );
}

// Doctor Card Skeleton
export function DoctorCardSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.doctorCardSkeleton, style]}>
      <Shimmer width={64} height={64} borderRadius={32} />
      <Shimmer width="60%" height={16} style={styles.mt12} />
      <Shimmer width="40%" height={12} style={styles.mt8} />
      <View style={styles.doctorCardTags}>
        <Shimmer width={60} height={24} borderRadius={12} style={styles.tagMargin} />
        <Shimmer width={50} height={24} borderRadius={12} />
      </View>
    </View>
  );
}

// Appointment Skeleton
export function AppointmentSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.appointmentSkeleton, style]}>
      <View style={styles.appointmentHeader}>
        <Shimmer width={40} height={40} borderRadius={20} />
        <View style={styles.appointmentContent}>
          <Shimmer width="55%" height={14} style={styles.mb6} />
          <Shimmer width="40%" height={12} />
        </View>
      </View>
      <View style={styles.appointmentFooter}>
        <Shimmer width={80} height={28} borderRadius={14} />
        <Shimmer width={70} height={28} borderRadius={14} />
      </View>
    </View>
  );
}

// Visit Card Skeleton (for home screen next visit card)
export function VisitCardSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.visitCardSkeleton, style]}>
      <View style={styles.visitCardHeader}>
        <Shimmer width={14} height={14} borderRadius={3} />
        <Shimmer width="40%" height={10} style={styles.ml2} />
        <View style={styles.visitCardBadge}>
          <Shimmer width={60} height={18} borderRadius={9} />
        </View>
      </View>
      <Shimmer width="60%" height={18} style={styles.mt12} />
      <Shimmer width="80%" height={14} style={styles.mt8} />
      <View style={styles.visitCardFooter}>
        <Shimmer width={16} height={16} borderRadius={4} />
        <Shimmer width="50%" height={13} style={styles.ml2} />
      </View>
    </View>
  );
}

// Tab Bar Skeleton
export function TabBarSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.tabBarSkeleton, style]}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Shimmer key={i} width={32} height={32} borderRadius={16} />
      ))}
    </View>
  );
}

// Header Skeleton
export function HeaderSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.headerSkeleton, style]}>
      <Shimmer width={120} height={24} />
      <Shimmer width={44} height={44} borderRadius={22} />
    </View>
  );
}

// Empty State Skeleton
export function EmptyStateSkeleton({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.emptyStateSkeleton, style]}>
      <Shimmer width={80} height={80} borderRadius={40} />
      <Shimmer width="60%" height={18} style={styles.mt16} />
      <Shimmer width="80%" height={14} style={styles.mt8} />
      <Shimmer width="40%" height={44} borderRadius={22} style={styles.mt20} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Card
  cardSkeleton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    marginLeft: Spacing.md,
    flex: 1,
  },

  // List Item
  listItemSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  listItemContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },

  // Text Block
  textBlock: {
    flex: 1,
  },

  // Stats Card
  statsCardSkeleton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },

  // Doctor Card
  doctorCardSkeleton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  doctorCardTags: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  tagMargin: {
    marginRight: Spacing.sm,
  },

  // Appointment
  appointmentSkeleton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  appointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appointmentContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },

  // Visit Card (Home screen)
  visitCardSkeleton: {
    padding: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: 'rgba(19, 27, 46, 0.06)',
  },
  visitCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  visitCardBadge: {
    marginLeft: 'auto',
  },
  visitCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(19, 27, 46, 0.06)',
  },

  // Tab Bar
  tabBarSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },

  // Header
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  // Empty State
  emptyStateSkeleton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
  },

  // Shared spacing utilities
  mt8: { marginTop: 8 },
  mt12: { marginTop: 12 },
  mt16: { marginTop: 16 },
  mt20: { marginTop: 20 },
  mb4: { marginBottom: 4 },
  ml2: { marginLeft: 2 },
  mb6: { marginBottom: 6 },
});
