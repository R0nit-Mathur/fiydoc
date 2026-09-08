/**
 * Doctor Notifications Screen — Stitch Clinical Clarity design
 *
 * Features:
 * - HeaderBar with title and unread count
 * - Mark all as read button
 * - Notification cards with type icon, title, message, timestamp
 * - Unread highlighting with primary tint
 * - Empty state
 *
 * Part of FiYDoc Clinical Clarity design system
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  SlideInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Bell,
  Calendar,
  Pill,
  ShieldCheck,
  CheckCheck,
  ChevronRight,
  Inbox,
  Stethoscope,
} from 'lucide-react-native';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { Pill as PillBadge } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import { NotificationItem } from '@/types/index';
import { StitchColors, BorderRadius, Shadows, Spacing, Palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getNotificationIcon(type: NotificationItem['type'], colors: ReturnType<typeof useAppTheme>['colors']) {
  const iconProps = { size: 18, strokeWidth: 2 } as const;
  switch (type) {
    case 'appointment':
      return <Calendar {...iconProps} color={StitchColors.primaryContainer} />;
    case 'prescription':
      return <Pill {...iconProps} color={StitchColors.secondary} />;
    case 'verification':
      return <ShieldCheck {...iconProps} color={StitchColors.secondary} />;
    default:
      return <Bell {...iconProps} color={StitchColors.primaryContainer} />;
  }
}

function NotificationCard({
  item,
  index,
  onPress,
}: {
  item: NotificationItem;
  index: number;
  onPress: () => void;
}) {
  const { colors, isDark } = useAppTheme();
  const scale = useSharedValue(1);
  const isUnread = !item.read;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardBg = isUnread
    ? isDark
      ? 'rgba(20, 80, 163, 0.14)'
      : Palette.primaryBlueLight
    : colors.card;
  const cardBorder = isUnread
    ? isDark
      ? 'rgba(173, 198, 255, 0.3)'
      : Palette.primaryBlueBorder
    : colors.border;

  return (
    <Animated.View
      entering={SlideInDown.delay(index * 40).springify().damping(18)}
      style={animatedStyle}
    >
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        style={[
          styles.notifCard,
          { backgroundColor: cardBg, borderColor: cardBorder },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}: ${item.message}`}
      >
        {/* Header row */}
        <View style={styles.notifHeader}>
          <View style={styles.notifHeaderLeft}>
            <View
              style={[
                styles.notifIconWrap,
                {
                  backgroundColor: isDark
                    ? 'rgba(20,80,163,0.2)'
                    : Palette.primaryBlueLight,
                  borderColor: isUnread
                    ? Palette.primaryBlueBorder
                    : colors.border,
                },
              ]}
            >
              {getNotificationIcon(item.type, colors)}
            </View>
            <PillBadge
              label={
                item.type === 'appointment'
                  ? 'Consultation'
                  : item.type === 'prescription'
                  ? 'Rx Issued'
                  : item.type === 'verification'
                  ? 'Registry'
                  : 'Alert'
              }
              variant={item.type === 'appointment' ? 'primary' : 'teal'}
              size="sm"
            />
          </View>
          <View style={styles.notifTimeRow}>
            <Text style={[styles.notifTime, { color: colors.textMuted }]}>
              {item.timestamp}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
        </View>

        {/* Body */}
        <View style={styles.notifBody}>
          <Text
            style={[
              styles.notifTitle,
              {
                color: colors.text,
                fontWeight: isUnread ? '700' : '600',
              },
            ]}
          >
            {item.title}
          </Text>
          <Text style={[styles.notifMessage, { color: colors.textSecondary }]}>
            {item.message}
          </Text>
        </View>

        {/* Footer */}
        {item.link && (
          <View style={[styles.notifFooter, { borderTopColor: colors.border }]}>
            <Text style={[styles.notifActionText, { color: StitchColors.primaryContainer }]}>
              View Details
            </Text>
            <ChevronRight size={14} color={StitchColors.primaryContainer} />
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function DoctorNotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const doctorNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (n.recipientId && user?.id && n.recipientId !== user.id) return false;
      if (n.recipientRole && n.recipientRole !== 'all' && n.recipientRole !== 'doctor') return false;
      return true;
    });
  }, [notifications, user?.id]);

  const unreadCount = useMemo(
    () => doctorNotifications.filter((n) => !n.read).length,
    [doctorNotifications]
  );

  const handleNotificationPress = (item: NotificationItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    markAsRead(item.id);
    if (item.link) {
      router.push(item.link as any);
    }
  };

  const handleMarkAllRead = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    markAllAsRead(user?.id, 'doctor');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <HeaderBar
        title="Notifications"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread`
            : 'All caught up'
        }
        showBackButton
        onBackPress={() => router.back()}
        rightAction={
          unreadCount > 0 ? (
            <Pressable
              onPress={handleMarkAllRead}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[
                styles.markAllBtn,
                {
                  backgroundColor: isDark
                    ? 'rgba(20,80,163,0.2)'
                    : Palette.primaryBlueLight,
                  borderColor: colors.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Mark all as read"
            >
              <CheckCheck size={13} color={StitchColors.primaryContainer} />
              <Text
                style={[
                  styles.markAllBtnText,
                  { color: StitchColors.primaryContainer },
                ]}
              >
                Mark all read
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {doctorNotifications.length === 0 ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.emptyWrap}>
            <EmptyState
              title="No notifications"
              description="You're all caught up. Consultation bookings and clinical updates will appear here."
              illustration="welcome"
            />
          </Animated.View>
        ) : (
          doctorNotifications.map((item, i) => (
            <NotificationCard
              key={item.id}
              item={item}
              index={i}
              onPress={() => handleNotificationPress(item)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: StitchColors.background,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  markAllBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 40,
    gap: 10,
  },
  emptyWrap: {
    marginTop: 24,
  },
  notifCard: {
    padding: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    ...Shadows.subtle,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  notifHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notifIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  notifTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notifTime: {
    fontSize: 11,
    fontWeight: '600',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: StitchColors.primaryContainer,
  },
  notifBody: {
    gap: 4,
  },
  notifTitle: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
  notifMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  notifFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  notifActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
