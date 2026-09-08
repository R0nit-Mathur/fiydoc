/**
 * FiYDOC - Doctor Schedule & Slot Management (1:1 Stitch Design)
 *
 * Features:
 * - Top Month & Navigation Controls (October 2026, Today, +Leave)
 * - Horizontal weekly calendar strip (M 16 .. S 22) with active indicators & appointment counts
 * - Upcoming Holiday Notice Pill (Diwali Break)
 * - OPD Session Selector (Morning: 10:30 AM - 01:30 PM vs Evening: 05:00 PM - 08:00 PM)
 * - Live Slot Timeline with interactive booking, blocking, and unblocking
 * - Session Operations: Emergency Delay (+15m / +30m), Modify Capacity modal, Interactive Leave manager
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Bell,
  Sun,
  Moon,
  Clock,
  CheckCircle2,
  MoreVertical,
  Ban,
  AlertTriangle,
  Sliders,
  CalendarX,
  X,
  Umbrella,
  Info,
  Check,
  Calendar as CalendarIcon,
  RotateCcw,
  FastForward,
} from 'lucide-react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { useNotificationStore } from '@/store/useNotificationStore';
import { BorderRadius, Shadows, StitchColors, DEFAULT_DOCTOR_AVATAR } from '@/constants/theme';

const DOCTOR_AVATAR = DEFAULT_DOCTOR_AVATAR;

export interface ScheduleSlot {
  id: string;
  patientId?: string;
  patientName?: string;
  token: string;
  time: string;
  meridiem: string;
  reason?: string;
  status: 'booked' | 'available' | 'blocked';
  delayMins?: number;
  consultationId?: string;
}

function shiftTime(timeStr: string, meridiem: string, shiftMins: number): { time: string; meridiem: string } {
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10);
  if (isNaN(h)) h = 10;
  if (isNaN(m)) m = 0;

  if (meridiem === 'PM' && h < 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;

  const totalMins = h * 60 + m + shiftMins;
  const wrappedMins = ((totalMins % 1440) + 1440) % 1440;

  let newH = Math.floor(wrappedMins / 60);
  const newM = wrappedMins % 60;
  const newMeridiem = newH >= 12 ? 'PM' : 'AM';

  if (newH > 12) newH -= 12;
  if (newH === 0) newH = 12;

  const formattedTime = `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
  return { time: formattedTime, meridiem: newMeridiem };
}

const WEEK_DAYS = [
  { day: 'M', date: '16', dot: 'gray', fullDate: 'Mon, 16 Oct' },
  { day: 'T', date: '17', dot: 'teal', fullDate: 'Tue, 17 Oct' },
  { day: 'W', date: '18', dot: 'active', fullDate: 'Wed, 18 Oct' },
  { day: 'T', date: '19', dot: 'teal', fullDate: 'Thu, 19 Oct' },
  { day: 'F', date: '20', dot: 'gray', fullDate: 'Fri, 20 Oct' },
  { day: 'S', date: '21', dot: 'teal', fullDate: 'Sat, 21 Oct' },
  { day: 'S', date: '22', dot: 'off', fullDate: 'Sun, 22 Oct' },
];

export default function DoctorScheduleScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const [selectedDay, setSelectedDay] = useState('18');
  const [selectedSession, setSelectedSession] = useState<'morning' | 'evening'>('morning');
  const [leaveDates, setLeaveDates] = useState<string[]>(['22']);

  // Dynamic Session Slots
  const [morningSlots, setMorningSlots] = useState<ScheduleSlot[]>([
    {
      id: 's1',
      patientId: 'pat_1',
      patientName: 'Aarav Mehta',
      token: '#01',
      time: '10:30',
      meridiem: 'AM',
      reason: 'Follow-up • Hypertension Review',
      status: 'booked',
      consultationId: 'apt_1',
    },
    {
      id: 's2',
      patientId: 'pat_2',
      patientName: 'Priya Nair',
      token: '#02',
      time: '10:45',
      meridiem: 'AM',
      reason: 'New Visit • Chest Pain Assessment',
      status: 'booked',
      consultationId: 'apt_2',
    },
    {
      id: 's3',
      patientId: 'pat_3',
      patientName: 'Vikram Malhotra',
      token: '#03',
      time: '11:00',
      meridiem: 'AM',
      reason: 'Routine Checkup • ECG Reading',
      status: 'booked',
      consultationId: 'apt_3',
    },
    {
      id: 's4',
      patientId: '',
      patientName: '',
      token: '#04',
      time: '11:15',
      meridiem: 'AM',
      reason: 'Slot reserved for hospital rounds',
      status: 'available',
    },
    {
      id: 's5',
      patientId: '',
      patientName: 'Tea Break & Ward Rounds',
      token: '',
      time: '11:30',
      meridiem: 'AM',
      reason: 'Internal schedule • Online booking paused',
      status: 'blocked',
    },
  ]);

  const [eveningSlots, setEveningSlots] = useState<ScheduleSlot[]>([
    {
      id: 'e1',
      patientId: 'pat_4',
      patientName: 'Ananya Sharma',
      token: '#01',
      time: '05:00',
      meridiem: 'PM',
      reason: 'Follow-up • Thyroid Profile',
      status: 'booked',
      consultationId: 'apt_1',
    },
    {
      id: 'e2',
      patientId: 'pat_5',
      patientName: 'Kunal Verma',
      token: '#02',
      time: '05:20',
      meridiem: 'PM',
      reason: 'Consultation • Blood Pressure',
      status: 'booked',
      consultationId: 'apt_2',
    },
    {
      id: 'e3',
      patientId: '',
      patientName: '',
      token: '#03',
      time: '05:40',
      meridiem: 'PM',
      reason: 'Open for evening walk-in',
      status: 'available',
    },
    {
      id: 'e4',
      patientId: '',
      patientName: 'Clinical Admin & Review',
      token: '',
      time: '06:00',
      meridiem: 'PM',
      reason: 'Reports review and chart sign-offs',
      status: 'blocked',
    },
  ]);

  // Modals & Notifications
  const [capacityModalVisible, setCapacityModalVisible] = useState(false);
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [bookModalVisible, setBookModalVisible] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [rescheduleSlot, setRescheduleSlot] = useState<ScheduleSlot | null>(null);

  const [slotDuration, setSlotDuration] = useState('15');
  const [maxPatients, setMaxPatients] = useState(12);
  const [delayNotice, setDelayNotice] = useState<string | null>(null);

  // Leave Form
  const [leaveReason, setLeaveReason] = useState('Diwali Break (31 Oct - 02 Nov)');
  const [leaveDays, setLeaveDays] = useState('3 Days');

  const handleSelectDay = (date: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedDay(date);
  };

  // 1. EMERGENCY DELAY: Shifts all slot times & alerts scheduled patients
  const handleEmergencyDelay = (mins: number) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    const updater = (prev: ScheduleSlot[]) =>
      prev.map((s) => {
        const shifted = shiftTime(s.time, s.meridiem, mins);
        return {
          ...s,
          time: shifted.time,
          meridiem: shifted.meridiem,
          delayMins: (s.delayMins || 0) + mins,
        };
      });

    if (selectedSession === 'morning') {
      setMorningSlots(updater);
    } else {
      setEveningSlots(updater);
    }

    useNotificationStore.getState().addNotification({
      title: `OPD Emergency Delay (+${mins}m)`,
      message: `Dr. Rajesh Sharma is running ~${mins} minutes behind schedule due to an in-clinic medical emergency. Your slot time has been adjusted.`,
      type: 'schedule_delay',
      recipientRole: 'patient',
    });

    setDelayNotice(`+${mins}m emergency delay applied. Slots shifted & patients notified.`);
    setTimeout(() => setDelayNotice(null), 3500);
  };

  // 2. LEAVE MANAGEMENT: Marks date as leave & notifies scheduled patients
  const handleApplyLeave = () => {
    setLeaveModalVisible(false);
    if (!leaveDates.includes(selectedDay)) {
      setLeaveDates([...leaveDates, selectedDay]);
    }

    useNotificationStore.getState().addNotification({
      title: 'OPD Schedule Update — Doctor On Leave',
      message: `Dr. Rajesh Sharma will be on leave on ${selectedDay} Oct for ${leaveReason}. Your booked appointment is being rescheduled.`,
      type: 'schedule_alert',
      recipientRole: 'patient',
    });

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDelayNotice(`Leave marked for ${selectedDay} Oct (${leaveReason}). Patients notified.`);
    setTimeout(() => setDelayNotice(null), 4000);
  };

  // 3. POSTPONE / PREPONE RESCHEDULING: Shifts single slot earlier or later
  const handleReschedule = (mins: number) => {
    if (!rescheduleSlot) return;
    const isPostpone = mins > 0;
    const shifted = shiftTime(rescheduleSlot.time, rescheduleSlot.meridiem, mins);

    const updateSlot = (s: ScheduleSlot) => {
      if (s.id !== rescheduleSlot.id) return s;
      return {
        ...s,
        time: shifted.time,
        meridiem: shifted.meridiem,
        delayMins: (s.delayMins || 0) + mins,
      };
    };

    if (selectedSession === 'morning') {
      setMorningSlots((prev) => prev.map(updateSlot));
    } else {
      setEveningSlots((prev) => prev.map(updateSlot));
    }

    if (rescheduleSlot.patientName) {
      useNotificationStore.getState().addNotification({
        title: `Appointment ${isPostpone ? 'Postponed' : 'Preponed'}`,
        message: `Your appointment with Dr. Rajesh Sharma has been ${isPostpone ? 'postponed' : 'preponed'} by ${Math.abs(mins)} mins. New estimated time: ${shifted.time} ${shifted.meridiem}.`,
        type: 'appointment_update',
        recipientRole: 'patient',
      });
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setDelayNotice(
      `Slot for ${rescheduleSlot.patientName || rescheduleSlot.token} ${isPostpone ? 'postponed' : 'preponed'} to ${shifted.time} ${shifted.meridiem}`
    );
    setTimeout(() => setDelayNotice(null), 3500);
    setRescheduleSlot(null);
  };

  const handleBookWalkin = () => {
    if (walkinName.trim()) {
      const newSlot: ScheduleSlot = {
        id: `walkin_${Date.now()}`,
        patientName: walkinName.trim(),
        token: `#0${morningSlots.filter((s) => s.status === 'booked').length + 1}`,
        time: '11:15',
        meridiem: 'AM',
        reason: 'Walk-in Consultation Assigned',
        status: 'booked',
      };

      setMorningSlots((prev) =>
        prev.map((s) => (s.id === 's4' ? newSlot : s))
      );
      setWalkinName('');
      setBookModalVisible(false);
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDelayNotice(`Walk-in booked for ${walkinName.trim()} at 11:15 AM`);
      setTimeout(() => setDelayNotice(null), 3200);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 1. Top Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.headerLeft}>
          <View style={styles.pulseDot} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Schedule Calendar</Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            onPress={() => router.push('/(doctor)/notifications' as any)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.iconButton, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          >
            <Bell size={18} color={colors.text} />
          </Pressable>

          <Pressable onPress={() => router.push('/(doctor)/(tabs)/profile')} style={styles.avatarBtn}>
            <Image source={{ uri: DOCTOR_AVATAR }} style={styles.avatarImg} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Delay Toast Notification */}
        {delayNotice && (
          <View style={[styles.delayBanner, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}>
            <AlertTriangle size={16} color="#D97706" />
            <Text style={styles.delayBannerText}>{delayNotice}</Text>
          </View>
        )}

        {/* 2. Top Controls & Month Navigator */}
        <View style={styles.monthControlRow}>
          <View style={[styles.monthPill, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Pressable hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.navArrow}>
              <ChevronLeft size={16} color={colors.text} />
            </Pressable>
            <Text style={[styles.monthText, { color: colors.text }]}>October 2026</Text>
            <Pressable hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.navArrow}>
              <ChevronRight size={16} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.monthActionsRow}>
            <Pressable
              onPress={() => setSelectedDay('18')}
              style={[styles.todayBtn, { backgroundColor: colors.backgroundElement }]}
            >
              <Text style={[styles.todayBtnText, { color: StitchColors.primaryContainer }]}>Today</Text>
            </Pressable>

            <Pressable
              onPress={() => setLeaveModalVisible(true)}
              style={[styles.leaveBtn, { backgroundColor: StitchColors.primaryContainer }]}
            >
              <Plus size={14} color="#FFFFFF" />
              <Text style={styles.leaveBtnText}>Leave</Text>
            </Pressable>
          </View>
        </View>

        {/* 3. Horizontal Weekly Calendar Strip */}
        <View style={styles.weekSection}>
          <View style={styles.weekHeaderRow}>
            <Text style={[styles.weekLabel, { color: colors.textSecondary }]}>SCHEDULE WEEK 42</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={styles.pingDot} />
              <Text style={[styles.activeApptText, { color: StitchColors.secondaryContainer }]}>
                14 Appointments Today
              </Text>
            </View>
          </View>

          <View style={[styles.weekGrid, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {WEEK_DAYS.map((w) => {
              const isSelected = selectedDay === w.date;
              const isLeave = leaveDates.includes(w.date);
              const isOff = w.dot === 'off' && !isLeave;

              return (
                <Pressable
                  key={w.date}
                  onPress={() => handleSelectDay(w.date)}
                  style={[
                    styles.dayCol,
                    isSelected && [styles.dayColActive, { backgroundColor: StitchColors.primaryContainer }],
                    isLeave && !isSelected && { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
                    isOff && styles.dayColOff,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayLetter,
                      { color: isSelected ? '#FFFFFF' : isLeave ? StitchColors.error : colors.textSecondary },
                      isOff && { color: colors.textMuted },
                    ]}
                  >
                    {w.day}
                  </Text>
                  <Text
                    style={[
                      styles.dayNum,
                      { color: isSelected ? '#FFFFFF' : isLeave ? StitchColors.error : colors.text },
                      isSelected && { fontWeight: '800' },
                      isOff && { color: colors.textMuted },
                    ]}
                  >
                    {w.date}
                  </Text>
                  {isLeave ? (
                    <Umbrella size={11} color={isSelected ? '#FFFFFF' : StitchColors.error} />
                  ) : (
                    <View
                      style={[
                        styles.dotIndicator,
                        w.dot === 'teal' && { backgroundColor: StitchColors.secondaryContainer },
                        w.dot === 'gray' && { backgroundColor: colors.border },
                        w.dot === 'active' && !isSelected && { backgroundColor: StitchColors.primaryContainer },
                        isSelected && { backgroundColor: '#FFFFFF' },
                        isOff && { backgroundColor: 'transparent' },
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 4. Upcoming Holiday Notice Pill */}
        <Pressable
          onPress={() => setLeaveModalVisible(true)}
          style={[styles.holidayCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
        >
          <View style={[styles.holidayIconWrap, { backgroundColor: '#CCFBF1' }]}>
            <Umbrella size={16} color={StitchColors.secondary} />
          </View>

          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.holidayTitle, { color: colors.text }]}>{leaveReason}</Text>
              <View style={[styles.holidayBadge, { backgroundColor: colors.card }]}>
                <Text style={[styles.holidayBadgeText, { color: colors.textSecondary }]}>{leaveDays}</Text>
              </View>
            </View>
            <Text style={[styles.holidayDesc, { color: colors.textSecondary }]}>
              OPD Closed • Online reservations halted
            </Text>
          </View>

          <Info size={16} color={colors.textMuted} />
        </Pressable>

        {/* 5. OPD Session Selector (Morning vs Evening) */}
        <View style={styles.sessionSection}>
          <View style={[styles.sessionToggleGrid, { backgroundColor: colors.backgroundElement }]}>
            {/* Morning Session */}
            <Pressable
              onPress={() => setSelectedSession('morning')}
              style={[
                styles.sessionCard,
                selectedSession === 'morning' && [styles.sessionCardActive, { backgroundColor: colors.card }],
              ]}
            >
              <View style={styles.sessionCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sun size={16} color={selectedSession === 'morning' ? StitchColors.primaryContainer : colors.textSecondary} />
                  <Text
                    style={[
                      styles.sessionTitle,
                      { color: selectedSession === 'morning' ? StitchColors.primaryContainer : colors.text },
                    ]}
                  >
                    Morning
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: StitchColors.secondaryContainer }]} />
              </View>
              <Text style={[styles.sessionTiming, { color: colors.textSecondary }]}>10:30 AM - 01:30 PM</Text>
              <Text style={[styles.sessionStats, { color: StitchColors.secondaryContainer }]}>9 of 12 Filled</Text>
            </Pressable>

            {/* Evening Session */}
            <Pressable
              onPress={() => setSelectedSession('evening')}
              style={[
                styles.sessionCard,
                selectedSession === 'evening' && [styles.sessionCardActive, { backgroundColor: colors.card }],
              ]}
            >
              <View style={styles.sessionCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Moon size={16} color={selectedSession === 'evening' ? StitchColors.primaryContainer : colors.textSecondary} />
                  <Text
                    style={[
                      styles.sessionTitle,
                      { color: selectedSession === 'evening' ? StitchColors.primaryContainer : colors.text },
                    ]}
                  >
                    Evening
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: colors.border }]} />
              </View>
              <Text style={[styles.sessionTiming, { color: colors.textSecondary }]}>05:00 PM - 08:00 PM</Text>
              <Text style={[styles.sessionStats, { color: colors.textSecondary }]}>4 of 12 Filled</Text>
            </Pressable>
          </View>

          {/* Quick Metrics Bar */}
          <View style={[styles.metricsStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color={StitchColors.secondaryContainer} />
              <Text style={[styles.metricText, { color: colors.text }]}>{slotDuration} min slot duration</Text>
              <Text style={styles.metricDot}>•</Text>
              <Text style={[styles.metricSub, { color: colors.textSecondary }]}>4 slots/hr cadence</Text>
            </View>
            <View style={[styles.regularOpdBadge, { backgroundColor: colors.backgroundElement }]}>
              <Text style={[styles.regularOpdText, { color: colors.textSecondary }]}>Regular OPD</Text>
            </View>
          </View>
        </View>

        {/* 6. Slot Timeline Visual Grid */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeaderRow}>
            <Text style={[styles.timelineSectionTitle, { color: colors.textSecondary }]}>
              {selectedSession === 'morning' ? 'MORNING SLOTS TIMELINE' : 'EVENING SLOTS TIMELINE'}
            </Text>
            <Text style={[styles.timelineDateText, { color: colors.textSecondary }]}>
              {WEEK_DAYS.find((w) => w.date === selectedDay)?.fullDate || `${selectedDay} Oct`}
            </Text>
          </View>

          {/* DOCTOR ON LEAVE BANNER IF DATE IS MARKED */}
          {leaveDates.includes(selectedDay) ? (
            <View style={[styles.onLeaveTimelineCard, { backgroundColor: colors.card, borderColor: '#FCA5A5' }]}>
              <View style={[styles.onLeaveIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Umbrella size={24} color={StitchColors.error} />
              </View>
              <Text style={[styles.onLeaveTitle, { color: colors.text }]}>Doctor Is On Scheduled Leave</Text>
              <Text style={[styles.onLeaveReason, { color: StitchColors.error }]}>
                {leaveReason || 'Clinic OPD Suspended'}
              </Text>
              <Text style={[styles.onLeaveDesc, { color: colors.textSecondary }]}>
                OPD sessions, walk-ins, and online bookings are suspended for this day. Scheduled patients have been automatically queued for rescheduling.
              </Text>
              <Pressable
                onPress={() => {
                  setLeaveDates(leaveDates.filter((d) => d !== selectedDay));
                  if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setDelayNotice(`Leave cancelled for ${selectedDay} Oct. OPD reopened.`);
                  setTimeout(() => setDelayNotice(null), 3000);
                }}
                style={[styles.resumeOpdBtn, { backgroundColor: StitchColors.primaryContainer }]}
                accessibilityRole="button"
                accessibilityLabel="Cancel leave and reopen OPD"
              >
                <RotateCcw size={15} color="#FFFFFF" />
                <Text style={styles.resumeOpdBtnText}>Cancel Leave & Reopen OPD</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.slotsList}>
              {(selectedSession === 'morning' ? morningSlots : eveningSlots).map((slot) => {
                const isBooked = slot.status === 'booked';
                const isAvailable = slot.status === 'available';
                const isBlocked = slot.status === 'blocked';

                return (
                  <View
                    key={slot.id}
                    style={[
                      styles.slotCard,
                      {
                        backgroundColor: isBlocked ? colors.backgroundElement : colors.card,
                        borderColor: colors.border,
                        opacity: isBlocked ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Pressable
                      onPress={() => {
                        if (isBooked && slot.consultationId) {
                          router.push(`/(doctor)/consultation/${slot.consultationId}` as any);
                        }
                      }}
                      style={styles.slotLeft}
                    >
                      <View style={[styles.timeBox, { backgroundColor: isBlocked ? colors.card : colors.backgroundElement }]}>
                        <Text
                          style={[
                            styles.timeDigit,
                            {
                              color: isBooked
                                ? StitchColors.primaryContainer
                                : isAvailable
                                ? colors.textSecondary
                                : colors.textMuted,
                            },
                          ]}
                        >
                          {slot.time}
                        </Text>
                        <Text style={[styles.timeMeridiem, { color: colors.textSecondary }]}>{slot.meridiem}</Text>
                      </View>

                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text
                            style={[
                              styles.slotPatientName,
                              {
                                color: isBooked
                                  ? colors.text
                                  : isAvailable
                                  ? StitchColors.secondary
                                  : colors.textSecondary,
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {isBooked ? slot.patientName : isAvailable ? 'Available Slot' : slot.patientName}
                          </Text>
                          {slot.token ? (
                            <View style={[styles.tokenBadge, { backgroundColor: '#CCFBF1' }]}>
                              <Text style={styles.tokenText}>{slot.token}</Text>
                            </View>
                          ) : null}
                          {slot.delayMins ? (
                            <View
                              style={[
                                styles.delayShiftBadge,
                                { backgroundColor: slot.delayMins > 0 ? '#FEF3C7' : '#DCFCE7' },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.delayShiftText,
                                  { color: slot.delayMins > 0 ? '#B45309' : '#15803D' },
                                ]}
                              >
                                {slot.delayMins > 0 ? `+${slot.delayMins}m` : `${slot.delayMins}m`}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={[styles.slotPatientReason, { color: colors.textSecondary }]} numberOfLines={1}>
                          {slot.reason || (isAvailable ? 'Open for patient allocation' : 'Internal reserved slot')}
                        </Text>
                      </View>
                    </Pressable>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {isBooked ? (
                        <>
                          <Pressable
                            onPress={() => setRescheduleSlot(slot)}
                            style={[styles.rescheduleTriggerBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                            accessibilityRole="button"
                            accessibilityLabel="Postpone or prepone slot"
                          >
                            <Clock size={11} color={StitchColors.primaryContainer} />
                            <Text style={[styles.rescheduleTriggerText, { color: StitchColors.primaryContainer }]}>
                              Reschedule
                            </Text>
                          </Pressable>

                          <View style={[styles.confirmedPill, { backgroundColor: '#CCFBF1' }]}>
                            <CheckCircle2 size={13} color={StitchColors.secondary} />
                            <Text style={styles.confirmedPillText}>Confirmed</Text>
                          </View>
                        </>
                      ) : isAvailable ? (
                        <>
                          <Pressable
                            onPress={() => setBookModalVisible(true)}
                            style={[styles.bookPillBtn, { backgroundColor: '#CCFBF1' }]}
                          >
                            <Text style={styles.bookPillBtnText}>+ Book</Text>
                          </Pressable>

                          <Pressable
                            onPress={() => {
                              const toggler = (prev: ScheduleSlot[]) =>
                                prev.map((s) => (s.id === slot.id ? { ...s, status: 'blocked' as const } : s));
                              if (selectedSession === 'morning') setMorningSlots(toggler);
                              else setEveningSlots(toggler);
                              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                            style={[styles.blockIconBtn, { backgroundColor: colors.backgroundElement }]}
                          >
                            <Ban size={14} color={colors.textSecondary} />
                          </Pressable>
                        </>
                      ) : (
                        <Pressable
                          onPress={() => {
                            const toggler = (prev: ScheduleSlot[]) =>
                              prev.map((s) => (s.id === slot.id ? { ...s, status: 'available' as const } : s));
                            if (selectedSession === 'morning') setMorningSlots(toggler);
                            else setEveningSlots(toggler);
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                          style={[styles.unblockBtn, { backgroundColor: colors.card }]}
                        >
                          <Text style={[styles.unblockBtnText, { color: StitchColors.primaryContainer }]}>Unblock</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* 7. Session Operations */}
        <View style={styles.opsSection}>
          <Text style={[styles.opsLabel, { color: colors.textSecondary }]}>SESSION OPERATIONS</Text>

          {/* Emergency Delay Card (Fixed UI: flex-safe text wrapping & no clipping) */}
          <View style={[styles.opsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.opsCardLeft}>
              <View style={[styles.opsIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Bell size={18} color={StitchColors.primaryContainer} />
              </View>
              <View style={styles.opsTextWrap}>
                <Text style={[styles.opsTitle, { color: colors.text }]} numberOfLines={1}>
                  Emergency Delay
                </Text>
                <Text style={[styles.opsSub, { color: colors.textSecondary }]} numberOfLines={1}>
                  Shift all slots & alert patients
                </Text>
              </View>
            </View>

            <View style={styles.delayBtnGroup}>
              <Pressable
                onPress={() => handleEmergencyDelay(15)}
                style={[styles.delayBtn, { backgroundColor: colors.backgroundElement }]}
                accessibilityRole="button"
                accessibilityLabel="Delay all slots by 15 minutes"
              >
                <Text style={[styles.delayBtnText, { color: StitchColors.primaryContainer }]}>+15m</Text>
              </Pressable>
              <Pressable
                onPress={() => handleEmergencyDelay(30)}
                style={[styles.delayBtn, { backgroundColor: colors.backgroundElement }]}
                accessibilityRole="button"
                accessibilityLabel="Delay all slots by 30 minutes"
              >
                <Text style={[styles.delayBtnText, { color: StitchColors.primaryContainer }]}>+30m</Text>
              </Pressable>
            </View>
          </View>

          {/* Modify Capacity */}
          <Pressable
            onPress={() => setCapacityModalVisible(true)}
            style={[styles.opsRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.opsCardLeft}>
              <View style={[styles.opsIconBox, { backgroundColor: '#CCFBF1' }]}>
                <Sliders size={18} color={StitchColors.secondary} />
              </View>
              <View>
                <Text style={[styles.opsTitle, { color: colors.text }]}>Modify Slot Capacity</Text>
                <Text style={[styles.opsSub, { color: colors.textSecondary }]}>Intervals (10/15/20m) & windows</Text>
              </View>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </Pressable>

          {/* Mark Leave */}
          <Pressable
            onPress={() => setLeaveModalVisible(true)}
            style={[styles.opsRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.opsCardLeft}>
              <View style={[styles.opsIconBox, { backgroundColor: '#FEE2E2' }]}>
                <CalendarX size={18} color={StitchColors.error} />
              </View>
              <View>
                <Text style={[styles.opsTitle, { color: StitchColors.error }]}>Mark Date as Leave / Holiday</Text>
                <Text style={[styles.opsSub, { color: colors.textSecondary }]}>Reschedule booked appointments</Text>
              </View>
            </View>
            <ChevronRight size={18} color={StitchColors.error} />
          </Pressable>
        </View>
      </ScrollView>

      {/* MODAL: Modify Capacity */}
      <Modal visible={capacityModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Modify Slot Settings</Text>
              <Pressable onPress={() => setCapacityModalVisible(false)}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>SLOT DURATION</Text>
            <View style={styles.durationRow}>
              {['10', '15', '20'].map((mins) => (
                <Pressable
                  key={mins}
                  onPress={() => setSlotDuration(mins)}
                  style={[
                    styles.durationBtn,
                    slotDuration === mins
                      ? [styles.durationBtnActive, { backgroundColor: StitchColors.primaryContainer }]
                      : { backgroundColor: colors.backgroundElement },
                  ]}
                >
                  <Text
                    style={[
                      styles.durationBtnText,
                      { color: slotDuration === mins ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {mins} mins
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.counterRow}>
              <Text style={[styles.counterLabel, { color: colors.text }]}>Max Patients / Window</Text>
              <View style={[styles.counterControl, { backgroundColor: colors.backgroundElement }]}>
                <Pressable
                  onPress={() => setMaxPatients(Math.max(4, maxPatients - 1))}
                  style={[styles.counterBtn, { backgroundColor: colors.card }]}
                >
                  <Text style={[styles.counterBtnText, { color: StitchColors.primaryContainer }]}>-</Text>
                </Pressable>
                <Text style={[styles.counterNumber, { color: colors.text }]}>{maxPatients}</Text>
                <Pressable
                  onPress={() => setMaxPatients(Math.min(25, maxPatients + 1))}
                  style={[styles.counterBtn, { backgroundColor: colors.card }]}
                >
                  <Text style={[styles.counterBtnText, { color: StitchColors.primaryContainer }]}>+</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={() => {
                setCapacityModalVisible(false);
                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setDelayNotice(`Capacity updated: ${slotDuration}m intervals, max ${maxPatients} patients/session.`);
                setTimeout(() => setDelayNotice(null), 3200);
              }}
              style={[styles.applySettingsBtn, { backgroundColor: StitchColors.primaryContainer }]}
            >
              <Text style={styles.applySettingsBtnText}>Apply to Wednesday OPD</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL: Leave Manager */}
      <Modal visible={leaveModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Doctor Holiday & Leave Scheduler</Text>
              <Pressable onPress={() => setLeaveModalVisible(false)}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>LEAVE REASON / EVENT</Text>
            <View style={styles.leaveChipsRow}>
              {['Diwali Festival Break', 'Medical Conference', 'Personal Leave', 'Emergency Absence'].map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setLeaveReason(r)}
                  style={[
                    styles.leaveChip,
                    leaveReason.includes(r)
                      ? [styles.leaveChipActive, { backgroundColor: StitchColors.primaryContainer }]
                      : { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                  ]}
                >
                  <Text style={[styles.leaveChipText, { color: leaveReason.includes(r) ? '#FFFFFF' : colors.text }]}>
                    {r}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>DURATION / DATES</Text>
              <TextInput
                value={leaveDays}
                onChangeText={setLeaveDays}
                placeholder="e.g. 3 Days (31 Oct - 02 Nov)"
                placeholderTextColor={colors.textMuted}
                style={[styles.textInputFull, { color: colors.text, borderColor: colors.border }]}
              />
            </View>

            <View style={[styles.autoNoticeBox, { backgroundColor: colors.backgroundElement }]}>
              <CheckCircle2 size={16} color={StitchColors.secondary} />
              <Text style={[styles.autoNoticeBoxText, { color: colors.textSecondary }]}>
                14 booked appointments will be automatically notified with rescheduling options.
              </Text>
            </View>

            <Pressable
              onPress={handleApplyLeave}
              style={[styles.applySettingsBtn, { backgroundColor: StitchColors.primaryContainer, marginTop: 14 }]}
            >
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.applySettingsBtnText}>Confirm Leave & Notify Patients</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL: Book Walk-in Slot */}
      <Modal visible={bookModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Book Slot for Walk-in Patient</Text>
              <Pressable onPress={() => setBookModalVisible(false)}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>SLOT TIME: 11:15 AM (15 MINS)</Text>
            <TextInput
              value={walkinName}
              onChangeText={setWalkinName}
              placeholder="Enter patient full name (e.g. Sunita Rao)..."
              placeholderTextColor={colors.textMuted}
              style={[styles.textInputFull, { color: colors.text, borderColor: colors.border }]}
            />

            <Pressable
              onPress={handleBookWalkin}
              style={[styles.applySettingsBtn, { backgroundColor: StitchColors.primaryContainer, marginTop: 14 }]}
            >
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.applySettingsBtnText}>Confirm Appointment Token</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL: Reschedule Appointment (Postpone / Prepone) */}
      {rescheduleSlot && (
        <Modal visible={!!rescheduleSlot} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={18} color={StitchColors.primaryContainer} />
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Reschedule Slot</Text>
                </View>
                <Pressable onPress={() => setRescheduleSlot(null)}>
                  <X size={18} color={colors.text} />
                </Pressable>
              </View>

              <View style={[styles.rescheduleTargetBox, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.reschedulePatientName, { color: colors.text }]}>
                  {rescheduleSlot.patientName || 'Booked Patient'}
                </Text>
                <Text style={[styles.rescheduleCurrentTime, { color: StitchColors.primaryContainer }]}>
                  Current Slot: {rescheduleSlot.time} {rescheduleSlot.meridiem} ({rescheduleSlot.token})
                </Text>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 12 }]}>
                PREPONE APPOINTMENT (EARLIER)
              </Text>
              <View style={styles.rescheduleActionsRow}>
                {[-15, -30].map((mins) => (
                  <Pressable
                    key={mins}
                    onPress={() => handleReschedule(mins)}
                    style={[styles.rescheduleOptionBtn, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Prepone by ${Math.abs(mins)} minutes`}
                  >
                    <Text style={[styles.rescheduleOptionText, { color: '#15803D' }]}>{mins}m earlier</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginTop: 12 }]}>
                POSTPONE APPOINTMENT (LATER)
              </Text>
              <View style={styles.rescheduleActionsRow}>
                {[15, 30, 60].map((mins) => (
                  <Pressable
                    key={mins}
                    onPress={() => handleReschedule(mins)}
                    style={[styles.rescheduleOptionBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Postpone by ${mins} minutes`}
                  >
                    <Text style={[styles.rescheduleOptionText, { color: '#1D4ED8' }]}>+{mins}m later</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.rescheduleNote, { color: colors.textMuted }]}>
                Shifting this slot updates patient token timing and dispatches an instant SMS & in-app notification to the patient.
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
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
    borderRadius: BorderRadius.full,
    backgroundColor: StitchColors.secondaryContainer,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarBtn: {
    padding: 1,
  },
  avatarImg: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
    gap: 16,
  },
  delayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  delayBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  monthControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
  },
  navArrow: {
    padding: 4,
  },
  monthText: {
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 6,
  },
  monthActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  todayBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    ...Shadows.subtle,
  },
  leaveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weekSection: {
    gap: 8,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  weekLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  pingDot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: StitchColors.secondaryContainer,
  },
  activeApptText: {
    fontSize: 12,
    fontWeight: '600',
  },
  weekGrid: {
    flexDirection: 'row',
    borderRadius: BorderRadius['2xl'],
    padding: 6,
    borderWidth: 1,
    ...Shadows.subtle,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    gap: 4,
  },
  dayColActive: {
    ...Shadows.subtle,
  },
  dayColOff: {
    opacity: 0.45,
  },
  dayLetter: {
    fontSize: 11,
    fontWeight: '600',
  },
  dayNum: {
    fontSize: 15,
    fontWeight: '600',
  },
  dotIndicator: {
    width: 5,
    height: 5,
    borderRadius: BorderRadius.full,
  },
  holidayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  holidayIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  holidayTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  holidayBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  holidayBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  holidayDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  sessionSection: {
    gap: 8,
  },
  sessionToggleGrid: {
    flexDirection: 'row',
    borderRadius: BorderRadius['2xl'],
    padding: 4,
    gap: 6,
  },
  sessionCard: {
    flex: 1,
    padding: 12,
    borderRadius: BorderRadius.xl,
    gap: 2,
  },
  sessionCardActive: {
    ...Shadows.subtle,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: BorderRadius.full,
  },
  sessionTiming: {
    fontSize: 11,
  },
  sessionStats: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    ...Shadows.subtle,
  },
  metricText: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricDot: {
    fontSize: 12,
    color: '#94A3B8',
  },
  metricSub: {
    fontSize: 11,
  },
  regularOpdBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  regularOpdText: {
    fontSize: 11,
    fontWeight: '500',
  },
  timelineSection: {
    gap: 8,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  timelineSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timelineDateText: {
    fontSize: 11,
  },
  slotsList: {
    gap: 8,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    ...Shadows.subtle,
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  timeBox: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeDigit: {
    fontSize: 13,
    fontWeight: '700',
  },
  timeMeridiem: {
    fontSize: 9,
    fontWeight: '600',
  },
  slotPatientName: {
    fontSize: 14,
    fontWeight: '700',
  },
  tokenBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  tokenText: {
    fontSize: 10,
    fontWeight: '700',
    color: StitchColors.secondary,
  },
  slotPatientReason: {
    fontSize: 11,
    marginTop: 2,
  },
  confirmedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  confirmedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.secondary,
  },
  bookPillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  bookPillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: StitchColors.secondary,
  },
  blockIconBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unblockBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  unblockBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  opsSection: {
    gap: 8,
  },
  opsLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  opsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    ...Shadows.subtle,
  },
  opsCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  opsIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opsTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  opsSub: {
    fontSize: 11,
    marginTop: 1,
  },
  delayBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  delayBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  opsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    ...Shadows.subtle,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: 20,
    borderWidth: 1,
    gap: 14,
    ...Shadows.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
  },
  durationBtnActive: {
    ...Shadows.subtle,
  },
  durationBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  counterLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  counterControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    padding: 4,
    gap: 10,
  },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    fontSize: 16,
    fontWeight: '700',
  },
  counterNumber: {
    fontSize: 15,
    fontWeight: '800',
  },
  applySettingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: 6,
    ...Shadows.subtle,
  },
  applySettingsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  leaveChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  leaveChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  leaveChipActive: {
    ...Shadows.subtle,
  },
  leaveChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textInputFull: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  autoNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: BorderRadius.lg,
    marginTop: 4,
  },
  autoNoticeBoxText: {
    fontSize: 11,
    flex: 1,
  },
  onLeaveTimelineCard: {
    padding: 24,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    ...Shadows.subtle,
  },
  onLeaveIconCircle: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  onLeaveTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  onLeaveReason: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  onLeaveDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 320,
  },
  resumeOpdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    marginTop: 6,
  },
  resumeOpdBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  delayShiftBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  delayShiftText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rescheduleTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  rescheduleTriggerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  opsTextWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  delayBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  rescheduleTargetBox: {
    padding: 12,
    borderRadius: BorderRadius.lg,
    marginVertical: 8,
    gap: 4,
  },
  reschedulePatientName: {
    fontSize: 14,
    fontWeight: '700',
  },
  rescheduleCurrentTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  rescheduleActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  rescheduleOptionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rescheduleOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  rescheduleNote: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 8,
  },
});
