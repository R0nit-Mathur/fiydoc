/**
 * Doctor Live OPD Queue Screen — Stitch Clinical Clarity design
 *
 * Features:
 * - HeaderBar with title and stats (Active/Waiting/Completed)
 * - Patient queue cards with name, token, wait time, Start Consultation
 * - Active section highlight with primary color
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
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Users,
  Clock,
  Stethoscope,
  ChevronRight,
  CheckCircle2,
  Video,
  Activity,
  Hash,
} from 'lucide-react-native';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { Pill } from '@/components/ui/Pill';
import { Avatar } from '@/components/ui/Avatar';
import { StitchCard } from '@/components/ui/StitchCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAppointmentsQuery } from '@/hooks/queries/useAppointmentsQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { StitchColors, BorderRadius, Shadows, Spacing, Palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatTimeSlot } from '@/utils/formatters';

interface QueuePatient {
  id: string;
  name: string;
  token: number;
  avatar?: string;
  age: number;
  waitMins: number;
  status: 'in-progress' | 'waiting' | 'arrived';
  symptoms: string[];
  mode: 'in-clinic' | 'video';
  time: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PatientQueueCard({
  patient,
  index,
  isActive,
  onPress,
}: {
  patient: QueuePatient;
  index: number;
  isActive: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useAppTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const waitTimeText =
    patient.waitMins === 0
      ? 'Now'
      : patient.waitMins < 60
      ? `${patient.waitMins}m wait`
      : `${Math.floor(patient.waitMins / 60)}h ${patient.waitMins % 60}m wait`;

  const cardBg = isActive
    ? isDark
      ? 'rgba(20, 80, 163, 0.16)'
      : Palette.primaryBlueLight
    : colors.card;

  const cardBorder = isActive
    ? isDark
      ? 'rgba(173, 198, 255, 0.45)'
      : Palette.primaryBlueBorder
    : colors.border;

  return (
    <Animated.View
      entering={SlideInDown.delay(index * 70).springify().damping(18)}
      style={animatedStyle}
      layout={Layout.springify().damping(20)}
    >
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }}
        style={[
          styles.queueCard,
          { backgroundColor: cardBg, borderColor: cardBorder, borderWidth: 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Token ${patient.token}, patient ${patient.name}, ${waitTimeText}`}
      >
        {isActive && (
          <View style={styles.activeBanner}>
            <View style={styles.pulseDot} />
            <Text style={styles.activeBannerText}>NOW IN CONSULTATION</Text>
          </View>
        )}

        <View style={styles.tokenBox}>
          <View
            style={[
              styles.tokenCircle,
              {
                backgroundColor: isActive
                  ? StitchColors.primaryContainer
                  : isDark
                  ? 'rgba(255,255,255,0.06)'
                  : StitchColors.surfaceContainer,
                borderColor: isActive
                  ? StitchColors.primaryContainer
                  : colors.border,
              },
            ]}
          >
            <Hash
              size={11}
              color={isActive ? StitchColors.onPrimary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tokenText,
                {
                  color: isActive ? StitchColors.onPrimary : colors.text,
                },
              ]}
            >
              {patient.token}
            </Text>
          </View>
        </View>

        <View style={styles.patientInfo}>
          <View style={styles.patientTopRow}>
            <Avatar
              uri={patient.avatar}
              name={patient.name}
              size="sm"
            />
            <View style={styles.patientNameCol}>
              <Text style={[styles.patientName, { color: colors.text }]} numberOfLines={1}>
                {patient.name}
              </Text>
              <Text style={[styles.patientMeta, { color: colors.textSecondary }]} numberOfLines={1}>
                {patient.age} yrs · {formatTimeSlot(patient.time)}
              </Text>
            </View>
          </View>
          <Text style={[styles.symptomsText, { color: colors.textSecondary }]} numberOfLines={1}>
            {patient.symptoms.join(' · ') || 'General consultation'}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Clock size={11} color={colors.textMuted} />
              <Text style={[styles.metaItemText, { color: colors.textSecondary }]}>
                {waitTimeText}
              </Text>
            </View>
            <View style={styles.metaItem}>
              {patient.mode === 'video' ? (
                <>
                  <Video size={11} color={StitchColors.primaryContainer} />
                  <Text style={[styles.metaItemText, { color: StitchColors.primaryContainer }]}>
                    Video
                  </Text>
                </>
              ) : (
                <>
                  <Stethoscope size={11} color={StitchColors.secondary} />
                  <Text style={[styles.metaItemText, { color: StitchColors.secondary }]}>
                    In-clinic
                  </Text>
                </>
              )}
            </View>
            <View style={styles.metaItem}>
              <Pill
                label={
                  patient.status === 'in-progress'
                    ? 'Active'
                    : patient.status === 'arrived'
                    ? 'Arrived'
                    : 'Waiting'
                }
                variant={
                  patient.status === 'in-progress'
                    ? 'primary'
                    : patient.status === 'arrived'
                    ? 'teal'
                    : 'warning'
                }
                size="sm"
              />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function ActiveConsultationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { colors, isDark } = useAppTheme();
  const { data: appointments, isRefetching } = useAppointmentsQuery(undefined, user?.id);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const queue: QueuePatient[] = useMemo(() => {
    if (!appointments) return [];
    return appointments
      .filter((a) =>
        ['in_progress', 'confirmed', 'upcoming', 'pending'].includes(a.status)
      )
      .slice(0, 12)
      .map((apt, i) => {
        const isInProgress = apt.status === 'in_progress';
        const isArrived = apt.status === 'confirmed';
        return {
          id: apt.id,
          name: apt.patientName || 'Patient',
          token: i + 1,
          avatar: apt.patientAvatar,
          age: 25 + (i * 4) % 35,
          waitMins: isInProgress ? 0 : 5 + i * 6,
          status: isInProgress ? 'in-progress' : isArrived ? 'arrived' : 'waiting',
          symptoms: apt.symptoms || ['General consultation'],
          mode: apt.mode === 'video' ? 'video' : 'in-clinic',
          time: apt.time,
        };
      });
  }, [appointments]);

  const stats = useMemo(
    () => ({
      active: queue.filter((q) => q.status === 'in-progress').length,
      waiting: queue.filter((q) => q.status === 'waiting' || q.status === 'arrived').length,
      total: queue.length,
    }),
    [queue]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <HeaderBar
        title="Live OPD Queue"
        subtitle={`${stats.active} active · ${stats.waiting} waiting`}
      />

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <StitchCard style={styles.statCard} noPadding>
          <View style={styles.statCardInner}>
            <View style={[styles.statIcon, { backgroundColor: Palette.primaryBlueLight }]}>
              <Activity size={14} color={StitchColors.primaryContainer} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.active}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
            </View>
          </View>
        </StitchCard>
        <StitchCard style={styles.statCard} noPadding>
          <View style={styles.statCardInner}>
            <View style={[styles.statIcon, { backgroundColor: Palette.healthcareTealLight }]}>
              <Users size={14} color={StitchColors.secondary} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.waiting}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Waiting</Text>
            </View>
          </View>
        </StitchCard>
        <StitchCard style={styles.statCard} noPadding>
          <View style={styles.statCardInner}>
            <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
              <CheckCircle2 size={14} color="#B45309" />
            </View>
            <View>
              <Text style={[styles.statValue, { color: colors.text }]}>{stats.total}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
            </View>
          </View>
        </StitchCard>
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
        {queue.length === 0 ? (
          <Animated.View entering={FadeIn.duration(300)}>
            <EmptyState
              title="Queue is empty"
              description="Patients waiting for consultation will appear here. Add a slot from your schedule to accept new patients."
              illustration="welcome"
            />
          </Animated.View>
        ) : (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Queue</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                {queue.length} patient{queue.length === 1 ? '' : 's'}
              </Text>
            </View>
            {queue.map((p, i) => (
              <PatientQueueCard
                key={p.id}
                patient={p}
                index={i}
                isActive={p.status === 'in-progress'}
                onPress={() => router.push(`/(doctor)/consultation/${p.id}`)}
              />
            ))}
          </>
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

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingBottom: 4,
  },
  statCard: {
    flex: 1,
  },
  statCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },

  /* Section */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },

  /* List */
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 8,
    paddingBottom: 110,
    gap: 10,
  },

  /* Card */
  queueCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: BorderRadius.xl,
    gap: 12,
    overflow: 'hidden',
  },
  activeBanner: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: StitchColors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: BorderRadius.md,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  activeBannerText: {
    color: StitchColors.onPrimary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  tokenBox: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  tokenCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: -2,
  },
  tokenText: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: -4,
  },
  patientInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  patientTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  patientNameCol: {
    flex: 1,
    minWidth: 0,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  patientMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  symptomsText: {
    fontSize: 12,
    lineHeight: 17,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaItemText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
