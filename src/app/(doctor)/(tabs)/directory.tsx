/**
 * FiYDOC - Doctor View Patients (1:1 Stitch Patient Directory)
 *
 * Implements the active clinical roster & care summaries:
 * - Header with live pulse, notifications & doctor avatar
 * - Title "My Patients" with "1,280 Total" counter
 * - Quick segmented filter pills (All Patients, Recent OPD, Chronic Care, Follow-up Due)
 * - Live search & filter bar with clear button
 * - 2 Minimalist Stats cards (Seen Today: 14, Pending Reports: 3)
 * - Detailed clinical patient cards (Aarav Mehta, Priya Nair, Vikram Malhotra, Sunita Rao)
 * - Clinical tags, UHID, blood group, last visit summary & action buttons
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  Image,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Bell,
  Search,
  X,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Clock,
  History,
  Phone,
  FileText,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  ShieldCheck,
  User,
} from 'lucide-react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { BorderRadius, Shadows, Spacing, StitchColors, Palette, DEFAULT_DOCTOR_AVATAR } from '@/constants/theme';

const DOCTOR_AVATAR = DEFAULT_DOCTOR_AVATAR;

interface PatientRecord {
  id: string;
  initials: string;
  bloodGroup: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  uhid: string;
  lastVisit: string;
  lastVisitReason: string;
  category: 'recent' | 'chronic' | 'followup';
  tags: { label: string; variant: 'blue' | 'teal' | 'red' | 'gray' }[];
  statusLabel: string;
  statusVariant: 'teal' | 'red' | 'blue';
  actionPrimary: string;
  actionSecondary: string;
}

const PATIENT_ROSTER: PatientRecord[] = [
  {
    id: 'apt_1',
    initials: 'AM',
    bloodGroup: 'B+',
    name: 'Aarav Mehta',
    age: 38,
    gender: 'Male',
    uhid: '#9042',
    lastVisit: 'Today, 10:30 AM',
    lastVisitReason: 'Hypertension follow-up',
    category: 'recent',
    tags: [
      { label: 'Active Rx', variant: 'teal' },
      { label: 'Hypertension (I10)', variant: 'gray' },
    ],
    statusLabel: 'Prescription Sent',
    statusVariant: 'teal',
    actionSecondary: 'View History',
    actionPrimary: 'Quick Rx',
  },
  {
    id: 'apt_2',
    initials: 'PN',
    bloodGroup: 'O+',
    name: 'Priya Nair',
    age: 29,
    gender: 'Female',
    uhid: '#8812',
    lastVisit: 'Yesterday',
    lastVisitReason: 'Routine Checkup',
    category: 'recent',
    tags: [
      { label: 'Lab Pending (CBC)', variant: 'red' },
      { label: 'Allergic to Sulfa', variant: 'gray' },
    ],
    statusLabel: 'Review Required',
    statusVariant: 'red',
    actionSecondary: 'Chart View',
    actionPrimary: 'Open Labs',
  },
  {
    id: 'apt_3',
    initials: 'VM',
    bloodGroup: 'A-',
    name: 'Vikram Malhotra',
    age: 54,
    gender: 'Male',
    uhid: '#7420',
    lastVisit: '12 Oct 2024',
    lastVisitReason: 'Cardiac Consult',
    category: 'followup',
    tags: [
      { label: 'Post-Stent Care', variant: 'blue' },
      { label: 'High Risk', variant: 'red' },
    ],
    statusLabel: 'Follow-up in 3 days',
    statusVariant: 'blue',
    actionSecondary: 'Call Patient',
    actionPrimary: 'Consult',
  },
  {
    id: 'apt_4',
    initials: 'SR',
    bloodGroup: 'B+',
    name: 'Sunita Rao',
    age: 45,
    gender: 'Female',
    uhid: '#6109',
    lastVisit: '05 Oct 2024',
    lastVisitReason: 'Diabetes T2',
    category: 'chronic',
    tags: [
      { label: 'HbA1c: 7.2%', variant: 'teal' },
      { label: 'Metformin 500mg', variant: 'gray' },
    ],
    statusLabel: 'Stable',
    statusVariant: 'teal',
    actionSecondary: 'Full Chart',
    actionPrimary: 'Plan Care',
  },
];

const FILTER_TABS = [
  { key: 'all', label: 'All Patients' },
  { key: 'recent', label: 'Recent OPD' },
  { key: 'chronic', label: 'Chronic Care' },
  { key: 'followup', label: 'Follow-up Due' },
];

export default function DoctorPatientsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = useMemo(() => {
    return PATIENT_ROSTER.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.uhid.toLowerCase().includes(q) ||
        p.lastVisitReason.toLowerCase().includes(q);

      const matchFilter = activeFilter === 'all' || p.category === activeFilter;

      return matchSearch && matchFilter;
    });
  }, [activeFilter, searchQuery]);

  const handlePatientAction = (patientId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/(doctor)/consultation/${patientId}` as any);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 1. Header with live green dot & Doctor Avatar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.headerLeft}>
          <View style={styles.pulseDot} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Patient Directory</Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            onPress={() => router.push('/(doctor)/notifications' as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.iconButton, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          >
            <Bell size={18} color={colors.text} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(doctor)/(tabs)/profile')}
            style={styles.avatarButton}
          >
            <Image source={{ uri: DOCTOR_AVATAR }} style={styles.avatarImg} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 2. Top Title & Total Roster Count */}
        <View style={styles.titleSection}>
          <View>
            <Text style={[styles.pageHeading, { color: colors.text }]}>My Patients</Text>
            <Text style={[styles.pageSubheading, { color: colors.textSecondary }]}>
              Active Clinical Roster & Care Summaries
            </Text>
          </View>

          <View style={[styles.totalPill, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={styles.tealDot} />
            <Text style={styles.totalPillText}>1,280 Total</Text>
          </View>
        </View>

        {/* 3. Filter Pills Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsStrip}
        >
          {FILTER_TABS.map((tab) => {
            const isSelected = activeFilter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.selectionAsync();
                  }
                  setActiveFilter(tab.key);
                }}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? StitchColors.primaryContainer : colors.card,
                    borderColor: isSelected ? StitchColors.primaryContainer : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* 4. Search & Filter Bar */}
        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Search size={18} color={colors.textMuted} />
            <TextInput
              placeholder="Search patient name, UHID, phone..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          <Pressable style={[styles.tuneButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SlidersHorizontal size={18} color={colors.text} />
          </Pressable>
        </View>

        {/* 5. Quick Stats Row (2 minimalist cards) */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statTop}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Seen Today</Text>
              <View style={[styles.statIconWrap, { backgroundColor: '#DCFCE7' }]}>
                <CheckCircle2 size={16} color={StitchColors.secondaryContainer} />
              </View>
            </View>
            <View style={styles.statBottom}>
              <Text style={[styles.statNumber, { color: colors.text }]}>14</Text>
              <Text style={[styles.statDelta, { color: StitchColors.secondaryContainer }]}>+3 vs yesterday</Text>
            </View>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.statTop}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending Reports</Text>
              <View style={[styles.statIconWrap, { backgroundColor: '#FEE2E2' }]}>
                <AlertCircle size={16} color={StitchColors.error} />
              </View>
            </View>
            <View style={styles.statBottom}>
              <Text style={[styles.statNumber, { color: colors.text }]}>3</Text>
              <Text style={[styles.statDelta, { color: StitchColors.error }]}>Review needed</Text>
            </View>
          </View>
        </View>

        {/* 6. Patient Cards List */}
        <View style={styles.patientListContainer}>
          {filteredPatients.map((patient, idx) => (
            <Animated.View
              key={patient.id}
              entering={FadeInUp.delay(idx * 50).duration(300)}
              style={[styles.patientCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {/* Card Header: Avatar, Name, UHID, Blood Group */}
              <View style={styles.patientCardHeader}>
                <View style={styles.avatarWithBlood}>
                  <View style={[styles.initialsCircle, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={styles.initialsText}>{patient.initials}</Text>
                  </View>
                  <View style={[styles.bloodBadge, { backgroundColor: colors.backgroundElement }]}>
                    <Text style={[styles.bloodText, { color: colors.text }]}>{patient.bloodGroup}</Text>
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.patientCardName, { color: colors.text }]}>{patient.name}</Text>
                    <ShieldCheck size={14} color={StitchColors.primaryContainer} />
                  </View>
                  <Text style={[styles.patientCardDemog, { color: colors.textSecondary }]}>
                    {patient.age} Yrs, {patient.gender} • <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: colors.textMuted }}>UHID: {patient.uhid}</Text>
                  </Text>
                </View>

                <Pressable
                  onPress={() => handlePatientAction(patient.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronRight size={18} color={colors.textMuted} />
                </Pressable>
              </View>

              {/* Visit Summary Strip */}
              <View style={[styles.visitSummaryStrip, { backgroundColor: colors.backgroundElement }]}>
                <Clock size={14} color={StitchColors.secondaryContainer} />
                <Text style={[styles.visitSummaryText, { color: colors.textSecondary }]}>
                  Last Visit: <Text style={{ color: colors.text, fontWeight: '700' }}>{patient.lastVisit}</Text> ({patient.lastVisitReason})
                </Text>
              </View>

              {/* Clinical Tags */}
              <View style={styles.tagsRow}>
                {patient.tags.map((t) => (
                  <View
                    key={t.label}
                    style={[
                      styles.clinicalTag,
                      t.variant === 'teal' && { backgroundColor: '#DCFCE7' },
                      t.variant === 'red' && { backgroundColor: '#FEE2E2' },
                      t.variant === 'blue' && { backgroundColor: '#DBEAFE' },
                      t.variant === 'gray' && { backgroundColor: colors.backgroundElement },
                    ]}
                  >
                    <Text
                      style={[
                        styles.clinicalTagText,
                        t.variant === 'teal' && { color: '#15803D' },
                        t.variant === 'red' && { color: '#B91C1C' },
                        t.variant === 'blue' && { color: StitchColors.primaryContainer },
                        t.variant === 'gray' && { color: colors.textSecondary },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Footer: Status Pill & Action Buttons */}
              <View style={styles.patientCardFooter}>
                <View style={styles.statusIndicatorRow}>
                  <View
                    style={[
                      styles.miniDot,
                      {
                        backgroundColor:
                          patient.statusVariant === 'teal'
                            ? StitchColors.secondaryContainer
                            : patient.statusVariant === 'red'
                            ? StitchColors.error
                            : StitchColors.primaryContainer,
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusIndicatorText,
                      {
                        color:
                          patient.statusVariant === 'teal'
                            ? StitchColors.secondaryContainer
                            : patient.statusVariant === 'red'
                            ? StitchColors.error
                            : StitchColors.primaryContainer,
                      },
                    ]}
                  >
                    {patient.statusLabel}
                  </Text>
                </View>

                <View style={styles.cardBtnRow}>
                  <Pressable
                    onPress={() => handlePatientAction(patient.id)}
                    style={[styles.secondaryActionBtn, { backgroundColor: colors.backgroundElement }]}
                  >
                    <Text style={[styles.secondaryActionText, { color: colors.text }]}>
                      {patient.actionSecondary}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handlePatientAction(patient.id)}
                    style={[styles.primaryActionBtn, { backgroundColor: StitchColors.primaryContainer }]}
                  >
                    <Text style={styles.primaryActionText}>{patient.actionPrimary}</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: StitchColors.secondaryContainer,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },

  scrollContent: {
    padding: 16,
    gap: 18,
    paddingBottom: 110,
  },

  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageHeading: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageSubheading: {
    fontSize: 12,
    marginTop: 2,
  },
  totalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tealDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: StitchColors.secondaryContainer,
  },
  totalPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },

  filterPillsStrip: {
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    ...Shadows.subtle,
  },
  filterPillText: {
    fontSize: 12,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 8,
    ...Shadows.subtle,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  tuneButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...Shadows.subtle,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 84,
    ...Shadows.subtle,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  statIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBottom: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 6,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
  },
  statDelta: {
    fontSize: 10,
    fontWeight: '600',
  },

  patientListContainer: {
    gap: 14,
  },
  patientCard: {
    padding: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 10,
    ...Shadows.subtle,
  },
  patientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWithBlood: {
    position: 'relative',
  },
  initialsCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 15,
    fontWeight: '800',
    color: StitchColors.primaryContainer,
  },
  bloodBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bloodText: {
    fontSize: 9,
    fontWeight: '800',
  },
  patientCardName: {
    fontSize: 15,
    fontWeight: '700',
  },
  patientCardDemog: {
    fontSize: 11,
    marginTop: 2,
  },

  visitSummaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
  },
  visitSummaryText: {
    fontSize: 11,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  clinicalTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  clinicalTagText: {
    fontSize: 10,
    fontWeight: '700',
  },

  patientCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  miniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusIndicatorText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  cardBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  secondaryActionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  primaryActionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  primaryActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
