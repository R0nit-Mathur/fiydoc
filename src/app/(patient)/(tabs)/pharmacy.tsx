/**
 * Pharmacy Screen — Stitch Clinical Clarity
 *
 * Features:
 * - Header with title and add button
 * - Tab switcher (Medications / Orders)
 * - Medicine cards with active prescriptions
 * - Reminder, instructions, time schedule
 * - Order history cards
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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useHealthStore } from '@/store/useHealthStore';
import { Prescription } from '@/types/index';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { StitchColors, BorderRadius, Shadows, Spacing, Palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  Pill,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Calendar,
  RefreshCw,
  Plus,
  Search,
} from 'lucide-react-native';

// No mock medications or orders — data comes only from real prescriptions

function MedicationCard({ medication, index, onReminderPress }: any) {
  const { colors } = useAppTheme();
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(380)} style={[styles.medicationCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.medicationHeader}>
        <View style={[styles.medicationIconWrap, { backgroundColor: `${medication.color}15` }]}>
          <Pill size={20} color={medication.color} />
        </View>
        <View style={styles.medicationInfo}>
          <Text style={[styles.medicationName, { color: colors.text }]}>{medication.name}</Text>
          <Text style={[styles.medicationDosage, { color: colors.textSecondary }]}>
            {medication.dosage} • {medication.frequency}
          </Text>
        </View>
        <Badge label="Active" variant="teal" size="sm" />
      </View>

      <View style={[styles.medicationTimes, { borderTopColor: colors.border }]}>
        {medication.time.map((t: string, i: number) => (
          <View key={i} style={[styles.timePill, { backgroundColor: colors.backgroundElement }]}>
            <Clock size={12} color={colors.textMuted} />
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>{t}</Text>
          </View>
        ))}
      </View>

      <View style={styles.medicationFooter}>
        <View style={styles.dateInfo}>
          <Calendar size={12} color={colors.textMuted} />
          <Text style={[styles.dateText, { color: colors.textMuted }]}>
            Started {medication.startDate}
            {medication.endDate && ` · Ends ${medication.endDate}`}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onReminderPress}
          style={[styles.reminderBtn, { backgroundColor: Palette.primaryBlueLight }]}
          accessibilityRole="button"
        >
          <Bell size={13} color={StitchColors.primaryContainer} />
          <Text style={[styles.reminderText, { color: StitchColors.primaryContainer }]}>Remind</Text>
        </TouchableOpacity>
      </View>

      {medication.instructions && (
        <View style={[styles.instructionsWrap, { backgroundColor: colors.backgroundElement }]}>
          <AlertCircle size={12} color={colors.textMuted} />
          <Text style={[styles.instructionsText, { color: colors.textSecondary }]}>{medication.instructions}</Text>
        </View>
      )}
    </Animated.View>
  );
}

function OrderCard({ order, index }: any) {
  const { colors } = useAppTheme();
  return (
    <Animated.View entering={FadeInDown.delay(200 + index * 50).duration(360)}>
      <TouchableOpacity
        activeOpacity={0.88}
        style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        accessibilityRole="button"
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={[styles.orderMedicine, { color: colors.text }]}>{order.medicine}</Text>
            <Text style={[styles.orderDetails, { color: colors.textSecondary }]}>
              Qty: {order.quantity} · {order.pharmacy}
            </Text>
          </View>
          <Badge label={order.status.charAt(0).toUpperCase() + order.status.slice(1)} variant="teal" size="sm" />
        </View>
        <View style={[styles.orderFooter, { borderTopColor: colors.border }]}>
          <Text style={[styles.orderDate, { color: colors.textMuted }]}>{order.date}</Text>
          <ChevronRight size={16} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PharmacyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { prescriptions } = useHealthStore();
  const { colors } = useAppTheme();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'medications' | 'orders'>('medications');
  const [refreshing, setRefreshing] = useState(false);

  const patientPrescriptions = useMemo(() => {
    return prescriptions.filter((p) => {
      if (!user) return true;
      if (user.role === 'patient') {
        return !p.patientId || p.patientId === user.id ||
          (p.patientName && user.name && p.patientName.toLowerCase() === user.name.toLowerCase());
      }
      return true;
    });
  }, [prescriptions, user]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const handleReminderPress = () => {
    Alert.alert('Set Reminder', 'Medication reminder will be set for this medicine.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Set Reminder', onPress: () => {} },
    ]);
  };

  const handleViewPrescription = (rx: Prescription) => {
    router.push(`/(patient)/health/prescription/${rx.id}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Pharmacy</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Manage medications & orders
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/(patient)/(tabs)/health')}
          style={[styles.addBtn, { backgroundColor: StitchColors.primaryContainer }]}
          accessibilityRole="button"
          accessibilityLabel="Add medication"
        >
          <Plus size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={16} color={colors.textMuted} />
          <Text style={[styles.searchPlaceholder, { color: colors.textMuted }]}>Search medicines</Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <View style={[styles.tabBg, { backgroundColor: colors.backgroundElement }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('medications')}
            style={[
              styles.tabBtn,
              activeTab === 'medications' && [styles.tabBtnActive, { backgroundColor: StitchColors.primaryContainer }],
            ]}
            accessibilityRole="tab"
          >
            <Pill size={14} color={activeTab === 'medications' ? '#fff' : colors.textSecondary} />
            <Text style={[styles.tabText, { color: activeTab === 'medications' ? '#fff' : colors.textSecondary }]}>
              My Medications
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('orders')}
            style={[
              styles.tabBtn,
              activeTab === 'orders' && [styles.tabBtnActive, { backgroundColor: StitchColors.primaryContainer }],
            ]}
            accessibilityRole="tab"
          >
            <RefreshCw size={14} color={activeTab === 'orders' ? '#fff' : colors.textSecondary} />
            <Text style={[styles.tabText, { color: activeTab === 'orders' ? '#fff' : colors.textSecondary }]}>
              Order History
            </Text>
          </TouchableOpacity>
        </View>
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
        {activeTab === 'medications' ? (
          <>
            {/* Prescriptions */}
            {patientPrescriptions.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Prescriptions</Text>
                {patientPrescriptions.map((rx, i) => (
                  <Animated.View key={rx.id} entering={FadeInDown.delay(i * 50).duration(360)}>
                    <TouchableOpacity
                      onPress={() => handleViewPrescription(rx)}
                      activeOpacity={0.88}
                      style={[styles.rxCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <View style={[styles.rxIconWrap, { backgroundColor: Palette.primaryBlueLight }]}>
                        <Pill size={18} color={StitchColors.primaryContainer} />
                      </View>
                      <View style={styles.rxInfo}>
                        <Text style={[styles.rxTitle, { color: colors.text }]} numberOfLines={1}>
                          {rx.medicines?.[0]?.name || 'Prescription'}
                        </Text>
                        <Text style={[styles.rxSub, { color: colors.textSecondary }]} numberOfLines={1}>
                          Dr. {rx.doctorName || 'Doctor'} · {rx.medicines?.length || 0} medicine(s)
                        </Text>
                      </View>
                      <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* Active Medications section — derived from real prescriptions */}
            {patientPrescriptions.length === 0 && (
              <EmptyState
                title="No medications yet"
                description="Your prescriptions and medication reminders will appear here once a doctor issues one."
                actionTitle="View Health Records"
                onAction={() => router.push('/(patient)/(tabs)/health')}
                icon={<Pill size={32} color={StitchColors.primaryContainer} />}
              />
            )}
          </>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Orders</Text>
              <EmptyState
                title="No orders yet"
                description="When medicines are ordered from your prescriptions, they will appear here."
                icon={<RefreshCw size={32} color={StitchColors.primaryContainer} />}
              />
            </View>
          </>
        )}
        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerContent: { flex: 1 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  searchPlaceholder: {
    fontSize: 14,
    flex: 1,
  },

  tabContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 12,
  },
  tabBg: {
    flexDirection: 'row',
    borderRadius: BorderRadius.full,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  tabBtnActive: {
    ...Shadows.subtle,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },

  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 12,
  },

  medicationCard: {
    padding: 16,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    marginBottom: 12,
    ...Shadows.subtle,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  medicationIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationInfo: { flex: 1 },
  medicationName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  medicationDosage: {
    fontSize: 13,
    marginTop: 2,
  },
  medicationTimes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  medicationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  dateText: {
    fontSize: 12,
  },
  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  reminderText: {
    fontSize: 12,
    fontWeight: '700',
  },
  instructionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  instructionsText: {
    fontSize: 12,
    flex: 1,
  },

  rxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
    ...Shadows.subtle,
  },
  rxIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxInfo: { flex: 1 },
  rxTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  rxSub: {
    fontSize: 12,
    marginTop: 2,
  },

  orderCard: {
    padding: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 8,
    ...Shadows.subtle,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderInfo: { flex: 1 },
  orderMedicine: {
    fontSize: 15,
    fontWeight: '700',
  },
  orderDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  orderDate: {
    fontSize: 12,
  },
  reorderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    ...Shadows.subtle,
  },
  reorderIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderInfo: { flex: 1 },
  reorderTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  reorderSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
