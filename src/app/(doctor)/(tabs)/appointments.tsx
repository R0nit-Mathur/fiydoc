/**
 * Doctor Appointments Screen — Stitch Clinical Clarity design
 *
 * Features:
 * - HeaderBar with title
 * - Filter tabs: Today / Upcoming / Completed
 * - Appointment cards with patient info, status, time
 * - Approve/Postpone/Start Consultation actions
 * - Empty state
 *
 * Part of FiYDoc Clinical Clarity design system
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import Animated, {
  FadeIn,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Clock3,
  CheckCircle2,
  XCircle,
  Stethoscope,
  Video,
  Calendar,
  ChevronRight,
  UserCheck,
  AlertCircle,
  PlayCircle,
} from 'lucide-react-native';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { Pill } from '@/components/ui/Pill';
import { Avatar } from '@/components/ui/Avatar';
import { StitchCard } from '@/components/ui/StitchCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppointmentsQuery } from '@/hooks/queries/useAppointmentsQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { StitchColors, BorderRadius, Shadows, Spacing, Palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatHumanDate, formatTimeSlot } from '@/utils/formatters';

type FilterKey = 'today' | 'upcoming' | 'completed';

interface FilterConfig {
  key: FilterKey;
  label: string;
}

const FILTERS: FilterConfig[] = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AppointmentCard({
  item,
  index,
  onStart,
  onApprove,
  onPostpone,
  onConfirmArrival,
  onCancel,
}: {
  item: any;
  index: number;
  onStart: () => void;
  onApprove: () => void;
  onPostpone: () => void;
  onConfirmArrival: () => void;
  onCancel: () => void;
}) {
  const { colors, isDark } = useAppTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const statusConfig = (() => {
    switch (item.status) {
      case 'in_progress':
        return { label: 'In Progress', variant: 'primary' as const, icon: PlayCircle, tint: StitchColors.primaryContainer };
      case 'confirmed':
        return { label: 'Confirmed', variant: 'teal' as const, icon: CheckCircle2, tint: StitchColors.secondary };
      case 'checked_in':
        return { label: 'Checked In', variant: 'teal' as const, icon: UserCheck, tint: StitchColors.secondary };
      case 'upcoming':
        return { label: 'Upcoming', variant: 'default' as const, icon: Clock3, tint: StitchColors.outline };
      case 'pending':
        return { label: 'Pending', variant: 'warning' as const, icon: AlertCircle, tint: '#B45309' };
      case 'completed':
        return { label: 'Completed', variant: 'default' as const, icon: CheckCircle2, tint: StitchColors.secondary };
      case 'cancelled':
        return { label: 'Cancelled', variant: 'danger' as const, icon: XCircle, tint: StitchColors.error };
      default:
        return { label: item.status, variant: 'default' as const, icon: Clock3, tint: StitchColors.outline };
    }
  })();
  const StatusIcon = statusConfig.icon;

  return (
    <Animated.View
      entering={SlideInDown.delay(index * 50).springify().damping(18)}
      style={animatedStyle}
    >
      <StitchCard style={styles.appointmentCard} noPadding>
        <View style={styles.cardTopline}>
          <View style={styles.dateGroup}>
            <Calendar size={13} color={StitchColors.primaryContainer} />
            <Text style={[styles.dateText, { color: StitchColors.primaryContainer }]}>
              {formatHumanDate(item.date)} · {formatTimeSlot(item.time)}
            </Text>
          </View>
          <Pill
            label={statusConfig.label}
            variant={statusConfig.variant}
            size="sm"
            icon={<StatusIcon size={10} color={statusConfig.tint} />}
          />
        </View>

        <View style={styles.patientRow}>
          <Avatar uri={item.patientAvatar} name={item.patientName} size="md" />
          <View style={styles.patientDetails}>
            <Text style={[styles.patientName, { color: colors.text }]} numberOfLines={1}>
              {item.patientName || 'Patient'}
            </Text>
            <Text style={[styles.symptomsText, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.symptoms?.join(' · ') || 'General consultation'}
            </Text>
            <View style={styles.modeRow}>
              {item.mode === 'video' ? (
                <>
                  <Video size={11} color={StitchColors.primaryContainer} />
                  <Text style={[styles.modeText, { color: StitchColors.primaryContainer }]}>
                    Video consult
                  </Text>
                </>
              ) : (
                <>
                  <Stethoscope size={11} color={StitchColors.secondary} />
                  <Text style={[styles.modeText, { color: StitchColors.secondary }]}>
                    In-clinic visit
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {['upcoming', 'confirmed', 'pending', 'in_progress'].includes(item.status) && (
          <View style={[styles.actionsBlock, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onStart();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: StitchColors.primaryContainer, opacity: pressed ? 0.85 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Start consultation"
            >
              <Stethoscope size={14} color={StitchColors.onPrimary} />
              <Text style={[styles.primaryBtnText, { color: StitchColors.onPrimary }]}>
                Start Consultation
              </Text>
            </Pressable>

            <View style={styles.secondaryRow}>
              {item.status !== 'confirmed' && (
                <Pressable
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    onApprove();
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(0,168,150,0.16)'
                        : Palette.healthcareTealLight,
                      borderColor: Palette.successBorder,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                >
                  <CheckCircle2 size={12} color={StitchColors.secondary} />
                  <Text style={[styles.secondaryBtnText, { color: StitchColors.secondary }]}>
                    Approve
                  </Text>
                </Pressable>
              )}

              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  onConfirmArrival();
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(20,80,163,0.16)'
                      : Palette.primaryBlueLight,
                    borderColor: Palette.primaryBlueBorder,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                accessibilityRole="button"
              >
                <UserCheck size={12} color={StitchColors.primaryContainer} />
                <Text style={[styles.secondaryBtnText, { color: StitchColors.primaryContainer }]}>
                  Arrived
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  onPostpone();
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(180,83,9,0.18)'
                      : Palette.warningBg,
                    borderColor: Palette.warningBorder,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                accessibilityRole="button"
              >
                <Clock3 size={12} color="#B45309" />
                <Text style={[styles.secondaryBtnText, { color: '#B45309' }]}>
                  Postpone
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  onCancel();
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  {
                    backgroundColor: isDark ? 'rgba(220,38,38,0.14)' : '#FEE2E2',
                    borderColor: '#FECACA',
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
                accessibilityRole="button"
              >
                <XCircle size={12} color="#DC2626" />
                <Text style={[styles.secondaryBtnText, { color: '#DC2626' }]}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {item.status === 'completed' && (
          <Pressable
            onPress={onStart}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.viewSummaryBtn}
            accessibilityRole="button"
          >
            <Text style={[styles.viewSummaryText, { color: StitchColors.primaryContainer }]}>
              View consultation summary
            </Text>
            <ChevronRight size={14} color={StitchColors.primaryContainer} />
          </Pressable>
        )}
      </StitchCard>
    </Animated.View>
  );
}

export default function DoctorAppointmentsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { colors, isDark } = useAppTheme();
  const { data: appointments, isRefetching, refetch } = useAppointmentsQuery(undefined, user?.id);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('today');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        refetch(),
      ]);
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, refetch]);

  const counts = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      today:
        appointments?.filter(
          (a) =>
            a.date?.slice(0, 10) === today &&
            ['upcoming', 'confirmed', 'checked_in', 'in_progress', 'pending'].includes(a.status)
        ).length || 0,
      upcoming:
        appointments?.filter((a) =>
          ['upcoming', 'confirmed', 'checked_in', 'pending'].includes(a.status)
        ).length || 0,
      completed:
        appointments?.filter((a) => a.status === 'completed').length || 0,
    };
  }, [appointments]);

  const filtered = useMemo(() => {
    if (!appointments) return [];
    const today = new Date().toISOString().slice(0, 10);
    if (activeFilter === 'today') {
      return appointments.filter(
        (a) =>
          a.date?.slice(0, 10) === today &&
          ['upcoming', 'confirmed', 'checked_in', 'in_progress', 'pending'].includes(a.status)
      );
    }
    if (activeFilter === 'upcoming') {
      return appointments.filter((a) =>
        ['upcoming', 'confirmed', 'checked_in', 'pending'].includes(a.status)
      );
    }
    return appointments.filter((a) => a.status === 'completed');
  }, [appointments, activeFilter]);

  const handleApprove = (apt: any) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    useNotificationStore.getState().addNotification({
      recipientId: apt.patientId,
      recipientRole: 'patient',
      title: 'Slot Approved',
      message: `Dr. ${user?.name || 'Doctor'} has approved your appointment slot.`,
      type: 'appointment',
      link: '/(patient)/appointments',
    });
  };

  const handlePostpone = (apt: any) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    useNotificationStore.getState().addNotification({
      recipientId: apt.patientId,
      recipientRole: 'patient',
      title: '📅 Appointment Rescheduled',
      message: `Dr. ${user?.name || 'Doctor'} has postponed your appointment. Please check for the new available slot.`,
      type: 'appointment',
      link: '/(patient)/(tabs)/appointments',
    });
  };

  const handleCancel = (apt: any) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    // Update local store to cancelled
    useAppointmentStore.getState().cancelAppointment(apt.id);
    // Notify patient with refund message
    useNotificationStore.getState().addNotification({
      recipientId: apt.patientId,
      recipientRole: 'patient',
      title: '❌ Appointment Cancelled',
      message: `Dr. ${user?.name || 'Doctor'} has cancelled your appointment on ${apt.date} at ${apt.time}. A full refund will be processed to your original payment method within 3–5 business days.`,
      type: 'appointment',
      link: '/(patient)/(tabs)/appointments',
    });
  };

  const handleConfirmArrival = (apt: any) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // Update status to checked_in
    useAppointmentStore.getState().updateAppointment(apt.id, { status: 'checked_in' });
    useNotificationStore.getState().addNotification({
      recipientId: apt.patientId,
      recipientRole: 'patient',
      title: '✅ Arrival Confirmed',
      message: `Dr. ${user?.name || 'Doctor'} confirmed your arrival. Please proceed to the consultation room.`,
      type: 'appointment',
      link: '/(patient)/(tabs)/appointments',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <HeaderBar
        title="Appointments"
        subtitle="Manage your patient queue"
      />

      {/* Filter Tabs */}
      <View style={styles.tabsWrap}>
        <View
          style={[
            styles.tabsContainer,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : StitchColors.surfaceContainer },
          ]}
        >
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.key;
            const count = counts[f.key];
            return (
              <Pressable
                key={f.key}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveFilter(f.key);
                }}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={[
                  styles.tabButton,
                  isActive && { backgroundColor: colors.card },
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? colors.text : colors.textSecondary },
                  ]}
                >
                  {f.label}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.tabBadge,
                      {
                        backgroundColor: isActive
                          ? StitchColors.primaryContainer
                          : isDark
                          ? 'rgba(255,255,255,0.08)'
                          : StitchColors.surfaceContainerHigh,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabBadgeText,
                        {
                          color: isActive
                            ? StitchColors.onPrimary
                            : colors.textSecondary,
                        },
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={handleRefresh}
            tintColor={StitchColors.primaryContainer}
            colors={[StitchColors.primaryContainer]}
          />
        }
      >
        {filtered.length === 0 ? (
          <Animated.View entering={FadeIn.duration(300)} style={styles.emptyWrap}>
            <EmptyState
              title={`No ${activeFilter} appointments`}
              description={
                activeFilter === 'today'
                  ? "Your day is clear. New patient bookings will appear here."
                  : activeFilter === 'upcoming'
                  ? "No upcoming appointments scheduled."
                  : "Completed consultations will appear here."
              }
              illustration="calendar"
            />
          </Animated.View>
        ) : (
          filtered.map((apt, i) => (
            <AppointmentCard
              key={apt.id}
              item={apt}
              index={i}
              onStart={() => router.push(`/(doctor)/consultation/${apt.id}`)}
              onApprove={() => handleApprove(apt)}
              onPostpone={() => handlePostpone(apt)}
              onConfirmArrival={() => handleConfirmArrival(apt)}
              onCancel={() => handleCancel(apt)}
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

  /* Tabs */
  tabsWrap: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  /* List */
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 4,
    paddingBottom: 110,
    gap: 12,
  },
  appointmentCard: {
    padding: 14,
  },
  cardTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  patientDetails: {
    flex: 1,
    minWidth: 0,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  symptomsText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  /* Actions */
  actionsBlock: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: BorderRadius.full,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 6,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  viewSummaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: StitchColors.outlineVariant,
  },
  viewSummaryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyWrap: {
    marginTop: 16,
  },
});
