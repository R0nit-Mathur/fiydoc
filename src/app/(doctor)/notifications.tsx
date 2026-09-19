/**
 * Doctor Notifications Screen — Stitch Clinical Clarity
 *
 * Aligned with Patient Notifications design:
 * - Custom header with back button, title, unread count subtext, and "Mark all read" button
 * - Category filter chips (All, Appointments, Prescriptions, System) with counts
 * - Notification cards with icon, title, message, time, action footer
 * - Unread highlight with blue tint and accent dot
 * - Empty state with Inbox circle icon
 * - Pull-to-refresh support
 */
import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAuthStore } from '@/store/useAuthStore';
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '@/hooks/queries/useNotificationsQuery';
import { NotificationItem } from '@/types/index';
import { Badge } from '@/components/ui/Badge';
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
import { StitchColors, BorderRadius, Shadows, Spacing, Palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'appointment', label: 'Appointments' },
  { key: 'prescription', label: 'Prescriptions' },
  { key: 'system', label: 'System' },
];

export default function DoctorNotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const { data: serverNotifications, refetch } = useNotificationsQuery();
  const markReadMut = useMarkNotificationReadMutation();
  const markAllMut = useMarkAllNotificationsReadMutation();

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const activeNotificationList = useMemo(() => {
    if (serverNotifications && serverNotifications.length > 0) {
      return serverNotifications;
    }
    return notifications;
  }, [serverNotifications, notifications]);

  const doctorNotifications = useMemo(() => {
    return activeNotificationList.filter((n) => {
      if (n.recipientId && user?.id && n.recipientId !== user.id) return false;
      if (n.recipientRole && n.recipientRole !== 'all' && n.recipientRole !== 'doctor') return false;
      return true;
    });
  }, [activeNotificationList, user?.id]);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return doctorNotifications;
    if (activeFilter === 'system') {
      return doctorNotifications.filter((n) => !['appointment', 'prescription'].includes(n.type));
    }
    return doctorNotifications.filter((n) => n.type === activeFilter);
  }, [doctorNotifications, activeFilter]);

  const unreadCount = useMemo(() => {
    return doctorNotifications.filter((n) => !n.read).length;
  }, [doctorNotifications]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, refetch]);

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'appointment':
        return <Calendar size={18} color={StitchColors.primaryContainer} />;
      case 'prescription':
        return <Pill size={18} color={StitchColors.secondaryContainer} />;
      case 'verification':
        return <ShieldCheck size={18} color={StitchColors.secondaryContainer} />;
      default:
        return <Bell size={18} color={StitchColors.primaryContainer} />;
    }
  };

  const getIconBg = (type: NotificationItem['type'], read: boolean) => {
    if (read) return isDark ? 'rgba(255, 255, 255, 0.05)' : Palette.surfaceTrack;
    if (type === 'prescription' || type === 'verification') {
      return isDark ? 'rgba(45, 212, 191, 0.18)' : Palette.healthcareTealLight;
    }
    return isDark ? 'rgba(20, 80, 163, 0.18)' : Palette.primaryBlueLight;
  };

  const getCardBorder = (type: NotificationItem['type'], read: boolean) => {
    if (read) return colors.border;
    if (type === 'prescription' || type === 'verification') {
      return isDark ? 'rgba(45, 212, 191, 0.3)' : Palette.healthcareTealBorder;
    }
    return isDark ? 'rgba(20, 80, 163, 0.3)' : Palette.primaryBlueBorder;
  };

  const handleNotificationPress = (item: NotificationItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    markReadMut.mutate(item.id);
    markAsRead(item.id);
    if (item.link) {
      router.push(item.link as any);
    } else if (item.type === 'appointment') {
      router.push('/(doctor)/(tabs)/appointments');
    }
  };

  const handleMarkAllRead = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    markAllMut.mutate();
    markAllAsRead(user?.id, 'doctor');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(doctor)/(tabs)/home');
              }
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.backButton, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={colors.text} strokeWidth={2.2} />
          </Pressable>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={[styles.unreadSubtext, { color: StitchColors.primaryContainer }]}>
                {unreadCount} unread update{unreadCount > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>

        {unreadCount > 0 && (
          <Pressable
            onPress={handleMarkAllRead}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.markAllBtn, { backgroundColor: Palette.primaryBlueLight, borderColor: Palette.primaryBlueBorder }]}
            accessibilityRole="button"
            accessibilityLabel="Mark all notifications as read"
          >
            <CheckCheck size={13} color={StitchColors.primaryContainer} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {/* Filter Chips */}
      <View style={[styles.filterSection, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            const count =
              f.key === 'all'
                ? doctorNotifications.length
                : f.key === 'system'
                ? doctorNotifications.filter((n) => !['appointment', 'prescription'].includes(n.type)).length
                : doctorNotifications.filter((n) => n.type === f.key).length;
            return (
              <Pressable
                key={f.key}
                onPress={() => setActiveFilter(f.key)}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? StitchColors.primaryContainer : colors.backgroundElement,
                    borderColor: isActive ? StitchColors.primaryContainer : colors.border,
                  },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isActive ? '#fff' : colors.textSecondary },
                  ]}
                >
                  {f.label} {count > 0 && `(${count})`}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[StitchColors.primaryContainer]}
            tintColor={StitchColors.primaryContainer}
          />
        }
      >
        {filteredNotifications.length === 0 ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Inbox size={32} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              You will receive alerts here when patients book appointment slots, check in, or request follow-ups.
            </Text>
          </Animated.View>
        ) : (
          filteredNotifications.map((item, i) => {
            const isPrescription = item.type === 'prescription';
            const isAppointment = item.type === 'appointment';
            return (
              <Animated.View key={item.id} entering={FadeInDown.delay(i * 45).duration(320)}>
                <Pressable
                  onPress={() => handleNotificationPress(item)}
                  style={({ pressed }) => [
                    styles.notificationCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: getCardBorder(item.type, item.read),
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.iconAndTitle}>
                      <View
                        style={[
                          styles.iconWrap,
                          { backgroundColor: getIconBg(item.type, item.read) },
                        ]}
                      >
                        {getIcon(item.type)}
                      </View>
                      <View style={styles.titleColumn}>
                        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={[styles.itemTime, { color: colors.textMuted }]}>
                          {item.time || item.timestamp || 'Today'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.badgeWrap}>
                      {isPrescription && (
                        <Badge label="RX ISSUED" variant="teal" size="sm" />
                      )}
                      {isAppointment && (
                        <Badge label="CLINIC" variant="blue" size="sm" />
                      )}
                      {!item.read && <View style={styles.unreadDot} />}
                    </View>
                  </View>

                  <Text style={[styles.itemMessage, { color: colors.textSecondary }]}>
                    {item.message}
                  </Text>

                  {item.link && (
                    <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                      <Text style={styles.actionText}>View Details</Text>
                      <ChevronRight size={14} color={StitchColors.primaryContainer} />
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  unreadSubtext: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: StitchColors.primaryContainer,
  },
  filterSection: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  notificationCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 14,
    ...Shadows.subtle,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemTime: {
    fontSize: 11,
    marginTop: 1,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: StitchColors.primaryContainer,
  },
  itemMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: StitchColors.primaryContainer,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
