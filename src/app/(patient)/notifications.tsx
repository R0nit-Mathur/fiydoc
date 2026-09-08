/**
 * Patient Notifications Screen — Stitch Clinical Clarity
 *
 * Features:
 * - Header with back, mark all read
 * - Category filter chips (All, Appointments, Prescriptions, System)
 * - Notification cards with icon, title, body, time, action footer
 */
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useNotificationStore } from '@/store/useNotificationStore';
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
} from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { StitchColors, BorderRadius, Shadows, Spacing, Palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'appointment', label: 'Appointments' },
  { key: 'prescription', label: 'Prescriptions' },
  { key: 'system', label: 'System' },
];

export default function PatientNotificationsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const [activeFilter, setActiveFilter] = useState<string>('all');

  const patientNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (n.recipientId && user?.id && n.recipientId !== user.id) return false;
      if (n.recipientRole && n.recipientRole !== 'all' && n.recipientRole !== 'patient') return false;
      return true;
    });
  }, [notifications, user?.id]);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return patientNotifications;
    if (activeFilter === 'system') {
      return patientNotifications.filter((n) => !['appointment', 'prescription'].includes(n.type));
    }
    return patientNotifications.filter((n) => n.type === activeFilter);
  }, [patientNotifications, activeFilter]);

  const unreadCount = useMemo(() => {
    return patientNotifications.filter((n) => !n.read).length;
  }, [patientNotifications]);

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'appointment':
        return <Calendar size={18} color={StitchColors.primaryContainer} />;
      case 'prescription':
      case 'pharmacy':
        return <Pill size={18} color={StitchColors.secondaryContainer} />;
      case 'verification':
        return <ShieldCheck size={18} color={StitchColors.secondaryContainer} />;
      default:
        return <Bell size={18} color={StitchColors.primaryContainer} />;
    }
  };

  const getIconBg = (type: NotificationItem['type'], read: boolean) => {
    if (read) return isDark ? 'rgba(255, 255, 255, 0.05)' : Palette.surfaceTrack;
    if (type === 'prescription') return isDark ? 'rgba(45, 212, 191, 0.18)' : Palette.healthcareTealLight;
    if (type === 'appointment') return isDark ? 'rgba(20, 80, 163, 0.18)' : Palette.primaryBlueLight;
    return isDark ? 'rgba(20, 80, 163, 0.18)' : Palette.primaryBlueLight;
  };

  const getCardBorder = (type: NotificationItem['type'], read: boolean) => {
    if (read) return colors.border;
    if (type === 'prescription') return isDark ? 'rgba(45, 212, 191, 0.3)' : Palette.healthcareTealBorder;
    return isDark ? 'rgba(20, 80, 163, 0.3)' : Palette.primaryBlueBorder;
  };

  const handleNotificationPress = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.type === 'prescription' || item.link === '/(patient)/health' || item.link === '/(patient)/(tabs)/health') {
      router.push('/(patient)/(tabs)/health');
    } else if (item.link) {
      router.push(item.link as any);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.back()}
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
            onPress={() => markAllAsRead(user?.id, 'patient')}
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
                ? patientNotifications.length
                : f.key === 'system'
                ? patientNotifications.filter((n) => !['appointment', 'prescription'].includes(n.type)).length
                : patientNotifications.filter((n) => n.type === f.key).length;
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
      >
        {filteredNotifications.length === 0 ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Inbox size={32} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              You will receive instant alerts here when doctors confirm appointments or issue prescriptions.
            </Text>
          </Animated.View>
        ) : (
          filteredNotifications.map((item, i) => {
            const isPrescription = item.type === 'prescription';
            return (
              <Animated.View key={item.id} entering={FadeInDown.delay(i * 50).duration(360)}>
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
                        <Badge label="DIGITAL RX" variant="teal" size="sm" />
                      )}
                      {!item.read && <View style={styles.unreadDot} />}
                    </View>
                  </View>

                  <Text style={[styles.itemMessage, { color: colors.textSecondary }]}>
                    {item.message}
                  </Text>

                  <View style={[styles.actionFooter, { borderTopColor: colors.border }]}>
                    <Text style={[styles.actionText, { color: StitchColors.primaryContainer }]}>
                      {isPrescription ? 'View Prescription & Medicines' : 'View Details'}
                    </Text>
                    <ChevronRight size={14} color={colors.textMuted} />
                  </View>
                </Pressable>
              </Animated.View>
            );
          })
        )}
        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  unreadSubtext: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  markAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },

  /* --- Filter --- */
  filterSection: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
  },

  scrollContent: {
    padding: Spacing.md,
    gap: 10,
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  notificationCard: {
    padding: 16,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1.5,
    gap: 10,
    ...Shadows.subtle,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: { flex: 1 },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  itemTime: {
    fontSize: 11,
    marginTop: 2,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: StitchColors.primaryContainer,
  },
  itemMessage: {
    fontSize: 13,
    lineHeight: 19,
  },
  actionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
