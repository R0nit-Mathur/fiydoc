/**
 * Doctor Workspace Screen
 * Clinical tools, prescription writer, notes, and quick actions
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppointmentsQuery } from '@/hooks/queries/useAppointmentsQuery';
import { CardSkeleton, ListItemSkeleton, StatsCardSkeleton } from '@/components/ui/Skeleton';
import { FadeInView, SlideInCard, slideInCard, fadeInItem } from '@/components/ui';
import {
  Stethoscope,
  FileText,
  Pill,
  Activity,
  Plus,
  Search,
  Clock,
  AlertTriangle,
  ClipboardList,
  Heart,
  Thermometer,
  Wind,
  TrendingUp,
  ArrowRight,
  Calculator,
  Users,
  Calendar,
  ChevronRight,
} from 'lucide-react-native';
import { Palette, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  badge?: string;
  onPress: () => void;
}

interface ClinicalTool {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
}

export default function DoctorWorkspaceScreen() {
  const { colors, isDark } = useAppTheme();
  const styles = workspaceStyles(colors);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { data: appointments, isRefetching } = useAppointmentsQuery(undefined, user?.id);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);

  const todayAppointments = appointments?.filter((a) =>
    ['upcoming', 'confirmed', 'in_progress', 'pending'].includes(a.status)
  ) || [];

  const pendingCount = appointments?.filter((a) => a.status === 'pending').length || 0;
  const completedToday = appointments?.filter((a) => a.status === 'completed').length || 0;

  const quickActions: QuickAction[] = [
    {
      id: 'prescribe',
      icon: <Pill size={24} color="#FFFFFF" />,
      label: 'New Prescription',
      description: 'Write digital Rx',
      color: colors.primary,
      onPress: () => router.push('/(doctor)/consultation/new'),
    },
    {
      id: 'consult',
      icon: <Stethoscope size={24} color="#FFFFFF" />,
      label: 'Start Consultation',
      description: `${todayAppointments.length} in queue`,
      color: colors.teal,
      badge: todayAppointments.length > 0 ? `${todayAppointments.length}` : undefined,
      onPress: () => router.push('/(doctor)/(tabs)/appointments'),
    },
    {
      id: 'notes',
      icon: <FileText size={24} color="#FFFFFF" />,
      label: 'Clinical Notes',
      description: 'Document encounter',
      color: '#6366F1',
      onPress: () => router.push('/(doctor)/consultation/notes'),
    },
    {
      id: 'vitals',
      icon: <Activity size={24} color="#FFFFFF" />,
      label: 'Record Vitals',
      description: 'BP, Pulse, Temp',
      color: '#F59E0B',
      onPress: () => router.push('/(doctor)/consultation/vitals'),
    },
  ];

  const clinicalTools: ClinicalTool[] = [
    {
      id: 'calculator',
      icon: <Calculator size={20} color={colors.primary} />,
      label: 'BMI Calculator',
      description: 'Body mass index',
      color: colors.primary,
      onPress: () => Alert.alert('BMI Calculator', 'Coming soon'),
    },
    {
      id: 'dosage',
      icon: <Pill size={20} color={colors.teal} />,
      label: 'Dosage Guide',
      description: 'Medication reference',
      color: colors.teal,
      onPress: () => Alert.alert('Dosage Guide', 'Coming soon'),
    },
    {
      id: 'interactions',
      icon: <AlertTriangle size={20} color="#F59E0B" />,
      label: 'Drug Interactions',
      description: 'Check conflicts',
      color: '#F59E0B',
      onPress: () => Alert.alert('Drug Interactions', 'Coming soon'),
    },
    {
      id: 'icu',
      icon: <Heart size={20} color="#EF4444" />,
      label: 'ICU Scoring',
      description: 'APACHE, GCS tools',
      color: '#EF4444',
      onPress: () => Alert.alert('ICU Scoring', 'Coming soon'),
    },
  ];

  const recentPatients = todayAppointments.slice(0, 5).map((apt) => ({
    id: apt.patientId,
    name: apt.patientName || 'Patient',
    symptoms: apt.symptoms || [],
    time: apt.time,
    status: apt.status,
  }));

  if (isRefetching && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>Clinical Workspace</Text>
        </View>
        <View style={styles.scrollContent}>
          <CardSkeleton style={{ marginBottom: 16 }} />
          <StatsCardSkeleton style={{ marginBottom: 16 }} />
          <ListItemSkeleton style={{ marginBottom: 12 }} />
          <ListItemSkeleton style={{ marginBottom: 12 }} />
          <ListItemSkeleton style={{ marginBottom: 12 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>Clinical Workspace</Text>
          <Text style={styles.headerSubtitle}>
            {user?.name?.split(' ')[0] || 'Doctor'}'s Tools & Quick Actions
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/(doctor)/(tabs)/profile')}
          style={({ pressed }) => [
            styles.profileBtn,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#F2F3FF' },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Stethoscope size={18} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Daily Stats Banner */}
        <FadeInView delay={0}>
          <View style={styles.statsBanner}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayAppointments.length}</Text>
              <Text style={styles.statLabel}>TODAY</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.warning }]}>{pendingCount}</Text>
              <Text style={styles.statLabel}>PENDING</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.teal }]}>{completedToday}</Text>
              <Text style={styles.statLabel}>DONE</Text>
            </View>
          </View>
        </FadeInView>

        {/* Quick Actions Grid */}
        <FadeInView delay={100}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <Animated.View
                key={action.id}
                entering={FadeIn.delay(100 + index * 50).duration(300)}
                style={{ flex: 1 }}
              >
                <Pressable
                  onPress={action.onPress}
                  style={({ pressed }) => [
                    styles.quickActionCard,
                    { backgroundColor: action.color },
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                >
                  <View style={styles.quickActionIcon}>{action.icon}</View>
                  <View style={styles.quickActionContent}>
                    <View style={styles.quickActionHeader}>
                      <Text style={styles.quickActionLabel}>{action.label}</Text>
                      {action.badge && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{action.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.quickActionDesc}>{action.description}</Text>
                  </View>
                  <ArrowRight size={16} color="rgba(255,255,255,0.7)" />
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </FadeInView>

        {/* Clinical Tools */}
        <FadeInView delay={200}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Clinical Tools</Text>
            <Pressable>
              <Text style={styles.seeAllText}>See All</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toolsScrollContent}
          >
            {clinicalTools.map((tool, index) => (
              <Animated.View
                key={tool.id}
                entering={FadeIn.delay(200 + index * 60).duration(250)}
              >
                <Pressable
                  onPress={tool.onPress}
                  style={({ pressed }) => [
                    styles.toolCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                    pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                  ]}
                  accessibilityRole="button"
                >
                  <View
                    style={[
                      styles.toolIconWrap,
                      { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : `${tool.color}15` },
                    ]}
                  >
                    {tool.icon}
                  </View>
                  <Text style={styles.toolLabel}>{tool.label}</Text>
                  <Text style={styles.toolDesc}>{tool.description}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        </FadeInView>

        {/* Recent Patients */}
        <FadeInView delay={300}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Patient Queue</Text>
            <Pressable onPress={() => router.push('/(doctor)/(tabs)/appointments')}>
              <Text style={styles.seeAllText}>View All</Text>
            </Pressable>
          </View>

          {recentPatients.length === 0 ? (
            <View style={[styles.emptyQueue, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ClipboardList size={28} color={colors.textMuted} />
              <Text style={styles.emptyQueueTitle}>No patients in queue</Text>
              <Text style={styles.emptyQueueSub}>
                Patients will appear here when they book appointments.
              </Text>
            </View>
          ) : (
            <View style={styles.queueList}>
              {recentPatients.map((patient, index) => (
                <Animated.View
                  key={patient.id}
                  entering={slideInCard(300, index)}
                >
                  <Pressable
                    onPress={() => router.push(`/(doctor)/consultation/${patient.id}`)}
                    style={({ pressed }) => [
                      styles.queueItem,
                      { backgroundColor: colors.card, borderColor: colors.border },
                      pressed && { opacity: 0.9 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`View consultation with ${patient.name}`}
                  >
                    <View style={styles.queueItemLeft}>
                      <View
                        style={[
                          styles.queueItemAvatar,
                          { backgroundColor: isDark ? 'rgba(0,168,150,0.2)' : '#E0F7F5' },
                        ]}
                      >
                        <Text style={styles.queueItemInitials}>
                          {patient.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.queueItemInfo}>
                        <Text style={styles.queueItemName}>{patient.name}</Text>
                        <Text style={styles.queueItemSymptoms} numberOfLines={1}>
                          {patient.symptoms.join(', ') || 'General consultation'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.queueItemRight}>
                      <View
                        style={[
                          styles.queueItemStatus,
                          {
                            backgroundColor:
                              patient.status === 'confirmed' ? colors.teal + '20' :
                              patient.status === 'pending' ? colors.warning + '20' :
                              colors.primary + '20',
                          },
                        ]}
                      >
                        <Clock size={12} color={
                          patient.status === 'confirmed' ? colors.teal :
                          patient.status === 'pending' ? colors.warning :
                          colors.primary
                        } />
                        <Text
                          style={[
                            styles.queueItemTime,
                            {
                              color:
                                patient.status === 'confirmed' ? colors.teal :
                                patient.status === 'pending' ? colors.warning :
                                colors.primary,
                            },
                          ]}
                        >
                          {patient.time}
                        </Text>
                      </View>
                      <ChevronRight size={16} color={colors.textMuted} />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}
        </FadeInView>

        {/* Common Symptoms Shortcuts */}
        <FadeInView delay={400}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Common Prescriptions</Text>
          </View>
          <View style={styles.symptomsRow}>
            {['Paracetamol 650mg', 'Amoxicillin 500mg', 'Omeprazole 20mg', 'Metformin 500mg', 'Amlodipine 5mg'].map((med, i) => (
              <Pressable
                key={i}
                onPress={() => router.push('/(doctor)/consultation/new')}
                style={({ pressed }) => [
                  styles.symptomChip,
                  { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.backgroundElement, borderColor: colors.border },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Pill size={12} color={colors.primary} />
                <Text style={styles.symptomChipText}>{med}</Text>
              </Pressable>
            ))}
          </View>
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}

const workspaceStyles = (colors: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 20,
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-around',
    ...Shadows.subtle,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  quickActionsGrid: {
    gap: 10,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: BorderRadius.xl,
    gap: 14,
    ...Shadows.card,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickActionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  quickActionDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  toolsScrollContent: {
    gap: 10,
    paddingRight: 16,
  },
  toolCard: {
    width: 110,
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  toolIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  toolDesc: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  queueList: {
    gap: 10,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  queueItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  queueItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueItemInitials: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.teal,
  },
  queueItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  queueItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  queueItemSymptoms: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  queueItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  queueItemStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  queueItemTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyQueue: {
    padding: 24,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  emptyQueueTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  emptyQueueSub: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  symptomsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  symptomChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
});
