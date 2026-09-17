/**
 * FiYDOC - Doctor Home (Clean & Minimal 1:1 Stitch)
 *
 * Implements the doctor companion dashboard:
 * - Header with hamburger menu, notification bell, doctor avatar & role switcher
 * - Greeting ("Good morning, Dr. Rajesh") & "Ready for clinic" status badge
 * - Today's Clinic card with live "Aarav Mehta" next patient & "Start Consultation" CTA
 * - 2-Column Metrics (Completed: 6 / 14 with progress bar, OPD Window: 10:30 - 1:30)
 * - 4-Column Quick Actions (Schedule, Patients, Rx Pad, Leave)
 * - "Upcoming Today" patient list (10:30 AM, 11:00 AM, 11:30 AM) with direct consultation links
 * - Slide-out drawer with Patient Mode switcher
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Menu,
  Bell,
  Calendar,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Clock,
  CalendarDays,
  Users,
  FileText,
  CalendarX,
  X,
  LogOut,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react-native';

import { useAuthStore } from '@/store/useAuthStore';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useAppointmentsQuery } from '@/hooks/queries/useAppointmentsQuery';
import { signOutAll } from '@/services/authService';
import { doctorService } from '@/services/doctorService';
import { useAppTheme } from '@/hooks/useAppTheme';
import { BorderRadius, Shadows, Spacing, StitchColors, Palette, DEFAULT_DOCTOR_AVATAR } from '@/constants/theme';
import { AppUpdateModal } from '@/components/ui/AppUpdateModal';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { Avatar } from '@/components/ui/Avatar';

const DOCTOR_AVATAR = DEFAULT_DOCTOR_AVATAR;

// No mock data — all patient data comes from real appointment store

export default function DoctorHomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user, updateUser, setVerificationStatus } = useAuthStore();
  const { appointments: storeAppointments } = useAppointmentStore();
  const { data: serverAppointments = [] } = useAppointmentsQuery(undefined, user?.id);
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [verificationCheckMsg, setVerificationCheckMsg] = useState<string | null>(null);

  const isVerified = user?.verificationStatus === 'verified';

  const handleCheckStatus = async () => {
    setCheckingVerification(true);
    setVerificationCheckMsg(null);
    try {
      const profile = await doctorService.getMyProfile();
      if (profile?.verificationStatus) {
        const status = profile.verificationStatus.toLowerCase();
        updateUser({ verificationStatus: status });
        setVerificationStatus(status);
        if (status === 'verified') {
          setVerificationCheckMsg('Credentials verified! Welcome to FiYDoc.');
        } else {
          setVerificationCheckMsg('Your profile is currently queued under review by the medical board.');
        }
      } else {
        setVerificationCheckMsg('Your application remains queued under review.');
      }
    } catch {
      setVerificationCheckMsg('Unable to refresh verification status right now. Please try again.');
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['notifications'] }),
      ]);
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setRefreshing(false);
    }
  };

  // Combine server queue with local appointments, honoring completed status
  const combinedAppointments = useMemo(() => {
    const storeMap = new Map((storeAppointments as any[]).map((a: any) => [a.id, a]));
    const mergedServer = (serverAppointments as any[]).map((sa: any) => {
      const la = storeMap.get(sa.id);
      if (la && la.status === 'completed' && sa.status !== 'completed') {
        return { ...sa, status: 'completed' };
      }
      return sa;
    });
    const serverIds = new Set(mergedServer.map((a: any) => a.id));
    const localRemaining = (storeAppointments as any[]).filter((a: any) => !serverIds.has(a.id));
    return [...mergedServer, ...localRemaining];
  }, [serverAppointments, storeAppointments]);

  // Derive today's queue dynamically using both ISO and local time
  const now = new Date();
  const todayIso = now.toISOString().slice(0, 10);
  const localYear = now.getFullYear();
  const localMonth = String(now.getMonth() + 1).padStart(2, '0');
  const localDay = String(now.getDate()).padStart(2, '0');
  const todayLocal = `${localYear}-${localMonth}-${localDay}`;

  const cleanDocName = (s?: string) => s?.toLowerCase().replace(/^dr\.?\s*/i, '').trim() || '';
  const currentDocName = cleanDocName(user?.name);

  const todayApts = useMemo(() => {
    return combinedAppointments.filter((a) => {
      const isToday = a.date?.slice(0, 10) === todayIso || a.date?.slice(0, 10) === todayLocal;
      if (!isToday) return false;
      if (a.doctorId === user?.id) return true;
      if (currentDocName) {
        const aDocName = cleanDocName(a.doctorName);
        if (aDocName && (aDocName === currentDocName || aDocName.includes(currentDocName) || currentDocName.includes(aDocName))) {
          return true;
        }
      }
      return user?.role === 'doctor';
    }).sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [combinedAppointments, todayIso, todayLocal, user?.id, currentDocName, user?.role]);

  // Completed count includes any appointment completed today or marked completed
  const completedToday = useMemo(() => {
    return combinedAppointments.filter((a) => a.status === 'completed').length;
  }, [combinedAppointments]);

  const activeStatuses = ['confirmed', 'checked_in', 'upcoming', 'in_progress', 'pending'];
  const nextPatient = todayApts.find((a) => activeStatuses.includes(a.status) && a.status !== 'completed') || null;
  const upcomingPatients = todayApts.filter((a) => activeStatuses.includes(a.status) && a.status !== 'completed').slice(0, 5);

  // Get first name for greeting
  const firstName = user?.name?.split(' ')[0] || 'Doctor';
  // Time-aware greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,';

  const handleStartConsultation = (appointmentId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push(`/(doctor)/consultation/${appointmentId}` as any);
  };

  if (!isVerified) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Top Header */}
        <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <View style={styles.headerLeftLogoRow}>
            <FiYLogo size="md" />
            <Text style={[styles.headerBrandText, { color: colors.text }]}>FiYDoc Pro</Text>
          </View>
          <Pressable
            onPress={() => signOutAll('USER_ACTION')}
            style={[styles.pendingLogoutBtn, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2' }]}
            hitSlop={8}
          >
            <LogOut size={15} color={StitchColors.error} />
            <Text style={styles.pendingLogoutText}>Sign Out</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.pendingScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                try {
                  await handleCheckStatus();
                } finally {
                  setRefreshing(false);
                }
              }}
              colors={[StitchColors.primaryContainer]}
              tintColor={StitchColors.primaryContainer}
            />
          }
        >
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={[styles.pendingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.pendingIconCircle}>
              <Clock size={36} color="#D97706" />
            </View>

            <View style={styles.pendingBadgeRow}>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>QUEUED FOR VERIFICATION</Text>
              </View>
            </View>

            <Text style={[styles.pendingTitle, { color: colors.text }]}>
              Application Under Review
            </Text>

            <Text style={[styles.pendingDoctorName, { color: colors.textSecondary }]}>
              Welcome, {user?.name ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`) : 'Doctor'}
            </Text>

            <Text style={[styles.pendingBodyText, { color: colors.textSecondary }]}>
              Your clinical profile and registration credentials have been submitted and are currently queued for verification by the medical verification board.
            </Text>

            {verificationCheckMsg && (
              <View style={[styles.feedbackMsgBox, { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#FFFBEB', borderColor: '#FDE68A' }]}>
                <Text style={[styles.feedbackMsgText, { color: isDark ? '#FCD34D' : '#92400E' }]}>
                  {verificationCheckMsg}
                </Text>
              </View>
            )}

            {/* Stages Checklist */}
            <View style={styles.stagesContainer}>
              <View style={styles.stageItem}>
                <View style={[styles.stageIconWrap, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                  <CheckCircle2 size={16} color="#059669" />
                </View>
                <View style={styles.stageTextWrap}>
                  <Text style={[styles.stageTitle, { color: colors.text }]}>Profile & Credentials Submitted</Text>
                  <Text style={[styles.stageSub, { color: colors.textSecondary }]}>Registration details recorded</Text>
                </View>
              </View>

              <View style={styles.stageConnector} />

              <View style={styles.stageItem}>
                <View style={[styles.stageIconWrap, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                  <Clock size={16} color="#D97706" />
                </View>
                <View style={styles.stageTextWrap}>
                  <Text style={[styles.stageTitle, { color: colors.text }]}>Council & License Verification</Text>
                  <Text style={[styles.stageSub, { color: colors.textSecondary }]}>Medical authority cross-referencing in progress</Text>
                </View>
              </View>

              <View style={styles.stageConnector} />

              <View style={styles.stageItem}>
                <View style={[styles.stageIconWrap, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <ShieldCheck size={16} color="#94A3B8" />
                </View>
                <View style={styles.stageTextWrap}>
                  <Text style={[styles.stageTitle, { color: '#94A3B8' }]}>OPD Queue & Clinic Activation</Text>
                  <Text style={[styles.stageSub, { color: colors.textSecondary }]}>Enabled immediately upon verification</Text>
                </View>
              </View>
            </View>

            {/* Credential Details Snapshot */}
            <View style={[styles.detailsSnapshotBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <View style={styles.snapshotRow}>
                <Text style={[styles.snapshotLabel, { color: colors.textSecondary }]}>Doctor Account</Text>
                <Text style={[styles.snapshotValue, { color: colors.text }]} numberOfLines={1}>
                  {user?.email || 'Registered'}
                </Text>
              </View>
              <View style={styles.snapshotRow}>
                <Text style={[styles.snapshotLabel, { color: colors.textSecondary }]}>Council License</Text>
                <Text style={[styles.snapshotValue, { color: colors.text }]}>
                  {user?.licenseNumber || user?.registrationNumber || 'Under Review'}
                </Text>
              </View>
              <View style={styles.snapshotRow}>
                <Text style={[styles.snapshotLabel, { color: colors.textSecondary }]}>Specialty</Text>
                <Text style={[styles.snapshotValue, { color: colors.text }]}>
                  {user?.specialization || user?.specialty || 'General Medicine'}
                </Text>
              </View>
              <View style={styles.snapshotRow}>
                <Text style={[styles.snapshotLabel, { color: colors.textSecondary }]}>Current Status</Text>
                <Text style={[styles.snapshotValue, { color: '#D97706', fontWeight: '700' }]}>
                  Pending Admin Approval
                </Text>
              </View>
            </View>

            {/* Check Status Button */}
            <Pressable
              onPress={handleCheckStatus}
              disabled={checkingVerification}
              style={({ pressed }) => [
                styles.refreshStatusBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              {checkingVerification ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <RefreshCw size={16} color="#ffffff" />
                  <Text style={styles.refreshStatusBtnText}>Check Verification Status</Text>
                </>
              )}
            </Pressable>

            {/* Explanatory notice */}
            <Text style={[styles.pendingNotice, { color: colors.textSecondary }]}>
              National Medical Commission (NMC) compliance requires credential verification to protect patients and ensure verified practitioners on the FiYDoc network.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* 1. Header with Hamburger Menu, Notifications & Doctor Avatar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable
          onPress={() => setDrawerOpen(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.iconButton, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          accessibilityLabel="Open Navigation Menu"
        >
          <Menu size={20} color={colors.text} />
        </Pressable>

        <View style={styles.headerRightRow}>
          <Pressable
            onPress={() => router.push('/(doctor)/notifications' as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.iconButton, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            accessibilityLabel="Notifications"
          >
            <Bell size={20} color={colors.text} />
            <View style={styles.notifDot} />
          </Pressable>

          <Pressable
            onPress={() => router.push('/(doctor)/(tabs)/profile')}
            style={styles.avatarButton}
            accessibilityLabel="Profile"
          >
            <Avatar uri={user?.avatar || null} name={user?.name || 'Doctor'} size="sm" />
          </Pressable>
        </View>
      </View>

      {/* Main Content ScrollView with comfortable gaps */}
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
        {/* 2. Greeting & Status Row */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={[styles.greetingSmall, { color: colors.textSecondary }]}>{greeting}</Text>
            <Text style={[styles.greetingBig, { color: colors.text }]}>Dr. {firstName}</Text>
          </View>

          <View style={[styles.statusPill, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <View style={styles.statusDot} />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>Ready for clinic</Text>
          </View>
        </View>

        {/* 3. Today's Clinic Card */}
        <Animated.View
          entering={FadeInUp.delay(60).duration(350)}
          style={[styles.todayCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.todayCardHeader}>
            <View style={styles.todayTitleRow}>
              <Calendar size={16} color={StitchColors.primaryContainer} />
              <Text style={styles.todayHeaderTitle}>TODAY'S CLINIC</Text>
            </View>
            <Text style={styles.todayApptCount}>{todayApts.length} Appointment{todayApts.length !== 1 ? 's' : ''}</Text>
          </View>

          {nextPatient ? (
            /* Next Patient Sub-Card */
            <Pressable
              onPress={() => handleStartConsultation(nextPatient.id)}
              style={({ pressed }) => [
                styles.nextPatientCard,
                { backgroundColor: colors.backgroundElement },
                pressed && { opacity: 0.88 },
              ]}
            >
              <View style={styles.nextPatientLeft}>
                <View style={[styles.nextPatientInitials, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={styles.initialsText}>
                    {nextPatient.patientName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                  </Text>
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.patientNameText, { color: colors.text }]} numberOfLines={1}>
                      {nextPatient.patientName}
                    </Text>
                    <View style={[styles.nextBadge, { backgroundColor: colors.card }]}>
                      <Text style={[styles.nextBadgeText, { color: colors.textSecondary }]}>Next</Text>
                    </View>
                  </View>
                  <Text style={[styles.patientMetaText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {nextPatient.time} • {nextPatient.symptoms?.join(', ') || 'Consultation'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </Pressable>
          ) : (
            <View style={[styles.nextPatientCard, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.patientMetaText, { color: colors.textSecondary, textAlign: 'center', flex: 1 }]}>
                No more patients in queue for today
              </Text>
            </View>
          )}

          {/* Card Footer */}
          <View style={styles.todayCardFooter}>
            <Text style={[styles.timingNoticeText, { color: colors.textSecondary }]}>
              {nextPatient ? `Next patient waiting` : 'Queue complete'}
            </Text>

            {nextPatient && (
              <Pressable
                onPress={() => handleStartConsultation(nextPatient.id)}
                style={styles.startConsultBtn}
              >
                <Text style={styles.startConsultText}>Start Consultation</Text>
                <ArrowRight size={14} color={StitchColors.primaryContainer} strokeWidth={2.4} />
              </Pressable>
            )}
          </View>
        </Animated.View>

        {/* 4. Two Metrics Cards (Grid of 2) */}
        <Animated.View entering={FadeInUp.delay(100).duration(350)} style={styles.metricsGrid}>
          {/* Completed Card */}
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.metricHeaderRow}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Completed</Text>
              <CheckCircle2 size={16} color={StitchColors.secondaryContainer} />
            </View>
            <View style={styles.metricValueRow}>
              <Text style={[styles.metricMainNumber, { color: colors.text }]}>{completedToday}</Text>
              <Text style={[styles.metricTotalNumber, { color: colors.textSecondary }]}>/ {todayApts.length}</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: colors.backgroundElement }]}>
              <View style={[styles.progressBarFill, { width: todayApts.length > 0 ? `${Math.round((completedToday / todayApts.length) * 100)}%` : '0%', backgroundColor: StitchColors.secondaryContainer }]} />
            </View>
          </View>

          {/* OPD Window Card */}
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.metricHeaderRow}>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>OPD Window</Text>
              <Clock size={16} color={StitchColors.primaryContainer} />
            </View>
            <Text style={[styles.metricWindowTime, { color: colors.text }]}>{user?.clinicTimings || '09:00 - 17:00'}</Text>
            <Text style={[styles.metricWindowSub, { color: colors.textSecondary }]}>Clinical Hours</Text>
          </View>
        </Animated.View>

        {/* 5. Quick Action Buttons (Grid of 3) */}
        <Animated.View entering={FadeInUp.delay(140).duration(350)} style={styles.actionsGrid}>
          <Pressable
            onPress={() => router.push('/(doctor)/(tabs)/schedule')}
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
              <CalendarDays size={20} color={StitchColors.primaryContainer} />
            </View>
            <Text style={[styles.actionBtnLabel, { color: colors.text }]}>Schedule</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(doctor)/(tabs)/directory')}
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Users size={20} color={StitchColors.primaryContainer} />
            </View>
            <Text style={[styles.actionBtnLabel, { color: colors.text }]}>Patients</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(doctor)/(tabs)/appointments')}
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
              <FileText size={20} color={StitchColors.primaryContainer} />
            </View>
            <Text style={[styles.actionBtnLabel, { color: colors.text }]}>Queue</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(doctor)/(tabs)/schedule')}
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#EFF6FF' }]}>
              <CalendarX size={20} color={StitchColors.primaryContainer} />
            </View>
            <Text style={[styles.actionBtnLabel, { color: colors.text }]}>Leave</Text>
          </Pressable>
        </Animated.View>

        {/* 6. Upcoming Today Section */}
        <Animated.View entering={FadeInUp.delay(180).duration(350)} style={styles.upcomingSection}>
          <View style={styles.upcomingHeaderRow}>
            <Text style={[styles.upcomingSectionTitle, { color: colors.text }]}>Upcoming Today</Text>
            <Pressable
              onPress={() => router.push('/(doctor)/(tabs)/schedule')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight size={14} color={StitchColors.primaryContainer} />
            </Pressable>
          </View>

          <View style={[styles.upcomingListCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {upcomingPatients.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={[styles.patientRowReason, { color: colors.textSecondary }]}>
                  No upcoming appointments for today.
                </Text>
              </View>
            ) : (
              upcomingPatients.map((p, index) => (
                <Pressable
                  key={p.id}
                  onPress={() => handleStartConsultation(p.id)}
                  style={({ pressed }) => [
                    styles.patientItemRow,
                    index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                    pressed && { backgroundColor: colors.backgroundElement },
                  ]}
                >
                  <View style={styles.patientItemLeft}>
                    <Text style={[styles.patientTimeCol, { color: StitchColors.primaryContainer }]}>{p.time}</Text>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.patientRowName, { color: colors.text }]} numberOfLines={1}>
                        {p.patientName}
                      </Text>
                      <Text style={[styles.patientRowReason, { color: colors.textSecondary }]} numberOfLines={1}>
                        {p.symptoms?.join(', ') || 'Consultation'}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} />
                </Pressable>
              ))
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Slide-out Navigation Drawer with Role Switcher */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDrawerOpen(false)}
      >
        <View style={styles.drawerBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setDrawerOpen(false)} />

          <View style={[styles.drawerPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <FiYLogo size="sm" />
              </View>
              <Pressable
                onPress={() => setDrawerOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={[styles.closeDrawerBtn, { backgroundColor: colors.backgroundElement }]}
              >
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            {/* Doctor Profile Banner */}
            <View style={[styles.drawerProfileBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <Avatar uri={user?.avatar || null} name={user?.name || 'Doctor'} size="md" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.drawerDoctorName, { color: colors.text }]}>{user?.name || 'Doctor'}</Text>
                <Text style={[styles.drawerDoctorSpec, { color: StitchColors.primaryContainer }]}>FiYDoc Doctor Account</Text>
              </View>
            </View>

            {/* Menu Links */}
            <View style={styles.drawerMenuList}>
              <Pressable
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/(doctor)/(tabs)/schedule');
                }}
                style={styles.drawerMenuItem}
              >
                <Calendar size={18} color={colors.text} />
                <Text style={[styles.drawerMenuLabel, { color: colors.text }]}>Schedule & Shifts</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/(doctor)/(tabs)/directory');
                }}
                style={styles.drawerMenuItem}
              >
                <Users size={18} color={colors.text} />
                <Text style={[styles.drawerMenuLabel, { color: colors.text }]}>Patient Roster</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/(doctor)/(tabs)/profile');
                }}
                style={styles.drawerMenuItem}
              >
                <ShieldCheck size={18} color={colors.text} />
                <Text style={[styles.drawerMenuLabel, { color: colors.text }]}>Payout & Credentials</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setDrawerOpen(false);
                  setUpdateModalVisible(true);
                }}
                style={styles.drawerMenuItem}
              >
                <RefreshCw size={18} color={StitchColors.primaryContainer} />
                <Text style={[styles.drawerMenuLabel, { color: colors.text }]}>App Updates (OTA)</Text>
              </Pressable>
            </View>

            {/* Log Out */}
            <View style={styles.drawerFooter}>
              <Pressable
                onPress={async () => {
                  setDrawerOpen(false);
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  await signOutAll();
                  router.replace('/(auth)/welcome');
                }}
                style={styles.logoutRow}
              >
                <LogOut size={16} color={StitchColors.error} />
                <Text style={styles.logoutText}>Log Out</Text>
              </Pressable>
              <Text style={[styles.buildVersionText, { color: colors.textMuted }]}>v2.1.0</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* App Updates (OTA) Modal */}
      <AppUpdateModal
        visible={updateModalVisible}
        onClose={() => setUpdateModalVisible(false)}
      />
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
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: StitchColors.secondaryContainer,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    overflow: 'hidden',
  },
  doctorAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },

  scrollContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 110,
  },

  /* Greeting */
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingSmall: {
    fontSize: 13,
    fontWeight: '500',
  },
  greetingBig: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: StitchColors.secondaryContainer,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Today Card */
  todayCard: {
    padding: 16,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    gap: 12,
    ...Shadows.subtle,
  },
  todayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: StitchColors.primaryContainer,
  },
  todayApptCount: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.secondaryContainer,
  },

  nextPatientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BorderRadius.xl,
  },
  nextPatientLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nextPatientInitials: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontSize: 14,
    fontWeight: '800',
    color: StitchColors.primaryContainer,
  },
  patientNameText: {
    fontSize: 14,
    fontWeight: '700',
  },
  nextBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: BorderRadius.full,
  },
  nextBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  patientMetaText: {
    fontSize: 11,
    marginTop: 2,
  },

  todayCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  timingNoticeText: {
    fontSize: 11,
  },
  startConsultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  startConsultText: {
    fontSize: 12,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },

  /* Metrics */
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 96,
    ...Shadows.subtle,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 6,
  },
  metricMainNumber: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metricTotalNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  metricWindowTime: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
  metricWindowSub: {
    fontSize: 11,
    marginTop: 2,
  },

  /* Actions */
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    ...Shadows.subtle,
  },
  actionIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Upcoming */
  upcomingSection: {
    gap: 10,
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upcomingSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },
  upcomingListCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  patientItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  patientItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  patientTimeCol: {
    width: 64,
    fontSize: 12,
    fontWeight: '800',
  },
  patientRowName: {
    fontSize: 14,
    fontWeight: '700',
  },
  patientRowReason: {
    fontSize: 11,
    marginTop: 2,
  },

  /* Drawer Modal */
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerPanel: {
    width: 300,
    height: '100%',
    padding: 20,
    paddingTop: 54,
    borderRightWidth: 1,
    ...Shadows.modal,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  drawerBrandText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  closeDrawerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerProfileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 14,
  },
  drawerAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  drawerDoctorName: {
    fontSize: 14,
    fontWeight: '700',
  },
  drawerDoctorSpec: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  drawerRegText: {
    fontSize: 9.5,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 20,
  },
  switchModeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },
  switchModeSub: {
    fontSize: 10,
    color: '#0369A1',
    marginTop: 1,
  },
  drawerMenuList: {
    gap: 6,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.lg,
  },
  drawerMenuLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  drawerFooter: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: StitchColors.error,
  },
  buildVersionText: {
    fontSize: 10,
  },
  headerLeftLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerBrandText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pendingLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pendingLogoutText: {
    fontSize: 12,
    fontWeight: '700',
    color: StitchColors.error,
  },
  pendingScrollContent: {
    padding: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  pendingCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    ...Shadows.subtle,
  },
  pendingIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pendingBadgeRow: {
    marginBottom: 12,
  },
  pendingBadge: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  pendingDoctorName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  pendingBodyText: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  feedbackMsgBox: {
    width: '100%',
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: 16,
  },
  feedbackMsgText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  stagesContainer: {
    width: '100%',
    paddingVertical: 8,
    marginBottom: 20,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stageIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageTextWrap: {
    flex: 1,
  },
  stageTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  stageSub: {
    fontSize: 11,
    marginTop: 1,
  },
  stageConnector: {
    width: 2,
    height: 18,
    backgroundColor: '#E2E8F0',
    marginLeft: 15,
    marginVertical: 2,
  },
  detailsSnapshotBox: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginBottom: 20,
  },
  snapshotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snapshotLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  snapshotValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  refreshStatusBtn: {
    width: '100%',
    height: 48,
    borderRadius: BorderRadius.xl,
    backgroundColor: StitchColors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    ...Shadows.subtle,
  },
  refreshStatusBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  pendingNotice: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
