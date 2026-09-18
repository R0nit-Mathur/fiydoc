/**
 * Appointments Screen — Stitch Clinical Clarity
 *
 * Features:
 * - Segmented filter tabs (All / Upcoming / Completed / Cancelled)
 * - Appointment cards in grouped sections
 * - Floating "Book New" action when all appointments shown
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppointmentsQuery } from '@/hooks/queries/useAppointmentsQuery';
import { Appointment } from '@/types/index';
import { AppointmentCard } from '@/components/ui/AppointmentCard';
import { AppointmentSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import {
  ArrowLeft,
  Calendar,
  Plus,
} from 'lucide-react-native';
import {
  StitchColors,
  BorderRadius,
  Shadows,
  Spacing,
  Palette,
} from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { appointmentService } from '@/services/appointmentService';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { Alert } from 'react-native';

type FilterTab = 'all' | 'upcoming' | 'completed' | 'cancelled';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

function AppointmentGroup({
  label,
  appointments,
  onPress,
  onCancel,
  delay = 0,
}: {
  label: string;
  appointments: Appointment[];
  onPress: (apt: Appointment) => void;
  onCancel?: (apt: Appointment) => void;
  delay?: number;
}) {
  const { colors } = useAppTheme();
  if (appointments.length === 0) return null;

  return (
    <Animated.View entering={FadeIn.delay(delay)} style={styles.groupWrap}>
      <Text style={[styles.groupLabel, { color: colors.textSecondary }]}>{label}</Text>
      {appointments.map((apt, i) => (
        <Animated.View key={apt.id} entering={FadeInDown.delay(delay + i * 50).duration(360)}>
          <AppointmentCard
            appointment={apt}
            onPress={() => onPress(apt)}
            onCancel={onCancel ? () => onCancel(apt) : undefined}
          />
        </Animated.View>
      ))}
    </Animated.View>
  );
}

export default function AppointmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { colors, isDark } = useAppTheme();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [cancelTargetApt, setCancelTargetApt] = useState<Appointment | null>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { data: appointments = [], isLoading, isRefetching, refetch } = useAppointmentsQuery(user?.id);

  const handleInitiateCancel = (apt: Appointment) => {
    setCancelTargetApt(apt);
    setCancelModalVisible(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetApt) return;
    setCancelling(true);
    try {
      await appointmentService.cancelAppointment(cancelTargetApt.id);
      useAppointmentStore.getState().cancelAppointment(cancelTargetApt.id);
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      await queryClient.invalidateQueries({ queryKey: ['appointment', cancelTargetApt.id] });
      Alert.alert('Appointment Cancelled', 'Your appointment has been cancelled successfully.');
    } catch (error: any) {
      console.error('Failed to cancel appointment on server:', error);
      useAppointmentStore.getState().cancelAppointment(cancelTargetApt.id);
      Alert.alert('Notice', error?.message || 'Appointment cancelled.');
    } finally {
      setCancelling(false);
      setCancelModalVisible(false);
      setCancelTargetApt(null);
    }
  };

  const groupedAppointments = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const upcoming = appointments.filter(
      (apt) =>
        ['upcoming', 'confirmed', 'in_progress', 'pending'].includes(apt.status) && apt.date >= today
    );
    const past = appointments.filter(
      (apt) => apt.date < today || apt.status === 'completed'
    );
    const cancelled = appointments.filter((apt) => apt.status === 'cancelled');
    return { upcoming, past, cancelled };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    switch (activeFilter) {
      case 'upcoming': return { upcoming: groupedAppointments.upcoming, past: [], cancelled: [] };
      case 'completed': return { upcoming: [], past: groupedAppointments.past, cancelled: [] };
      case 'cancelled': return { upcoming: [], past: [], cancelled: groupedAppointments.cancelled };
      default: return groupedAppointments;
    }
  }, [activeFilter, groupedAppointments]);

  const totalCount = appointments.length;
  const upcomingCount = groupedAppointments.upcoming.length;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, refetch]);

  const handleAppointmentPress = (apt: Appointment) => {
    router.push(`/(patient)/appointments/${apt.id}`);
  };

  const handleBookAppointment = () => router.push('/(patient)/(tabs)/discovery');
  const handleSafeBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(patient)/(tabs)/home');
  };

  const hasAnyAppointments = appointments.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleSafeBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.backBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={18} color={colors.text} strokeWidth={2.2} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>My Appointments</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
              {upcomingCount > 0 ? `${upcomingCount} upcoming visit${upcomingCount === 1 ? '' : 's'}` : 'No upcoming appointments'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleBookAppointment}
            style={[styles.addBtn, { backgroundColor: StitchColors.primaryContainer }]}
            accessibilityRole="button"
            accessibilityLabel="Book new appointment"
          >
            <Plus size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {FILTER_TABS.map((option) => {
            const isActive = activeFilter === option.key;
            const count =
              option.key === 'all' ? totalCount
              : option.key === 'upcoming' ? upcomingCount
              : option.key === 'completed' ? groupedAppointments.past.length
              : groupedAppointments.cancelled.length;
            return (
              <TouchableOpacity
                key={option.key}
                onPress={() => setActiveFilter(option.key)}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                style={[
                  styles.filterTab,
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
                    styles.filterTabText,
                    { color: isActive ? '#fff' : colors.textSecondary },
                  ]}
                >
                  {option.label}{count > 0 ? ` (${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={handleRefresh}
            colors={[StitchColors.primaryContainer]}
            tintColor={StitchColors.primaryContainer}
          />
        }
      >
        {isLoading ? (
          <>
            <AppointmentSkeleton style={{ marginBottom: 12 }} />
            <AppointmentSkeleton style={{ marginBottom: 12 }} />
          </>
        ) : !hasAnyAppointments ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.emptyWrap}>
            <EmptyState
              title="No appointments yet"
              description="Book your first consultation with a verified doctor."
              actionTitle="Find a Doctor"
              onAction={handleBookAppointment}
              icon={<Calendar size={32} color={StitchColors.primaryContainer} />}
            />
          </Animated.View>
        ) : (
          <>
            <AppointmentGroup
              label="Upcoming Visits"
              appointments={filteredAppointments.upcoming}
              onPress={handleAppointmentPress}
              onCancel={handleInitiateCancel}
              delay={80}
            />
            <AppointmentGroup
              label="Past Visits"
              appointments={filteredAppointments.past}
              onPress={handleAppointmentPress}
              delay={160}
            />
            <AppointmentGroup
              label="Cancelled"
              appointments={filteredAppointments.cancelled}
              onPress={handleAppointmentPress}
              delay={240}
            />
            <View style={{ height: 80 }} />
          </>
        )}
      </ScrollView>

      {/* Floating Book Button */}
      {activeFilter === 'all' && hasAnyAppointments && (
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={[styles.floatingBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Button
            title="Book New Appointment"
            onPress={handleBookAppointment}
            variant="primary"
            size="lg"
            icon={<Plus size={18} color="#fff" />}
          />
        </Animated.View>
      )}

      {/* Cancel Appointment Dialog */}
      <ConfirmationDialog
        visible={cancelModalVisible}
        title="Cancel Appointment"
        message={`Are you sure you want to cancel your appointment with ${cancelTargetApt?.doctorName || 'the doctor'} on ${cancelTargetApt?.date} at ${cancelTargetApt?.time}?`}
        confirmText="Yes, Cancel"
        cancelText="Keep Appointment"
        confirmVariant="danger"
        iconVariant="danger"
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => {
          setCancelModalVisible(false);
          setCancelTargetApt(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Shadows.subtle,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerText: { flex: 1 },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSub: { fontSize: 12, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterScroll: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },
  emptyWrap: { marginTop: Spacing['3xl'] },
  groupWrap: { marginBottom: 8 },
  groupLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 16,
  },
  floatingBtn: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.md,
    right: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    ...Shadows.card,
  },
});
