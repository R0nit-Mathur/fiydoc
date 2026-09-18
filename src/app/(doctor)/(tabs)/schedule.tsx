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

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  RefreshControl,
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
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useAppointmentsQuery } from '@/hooks/queries/useAppointmentsQuery';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { doctorService } from '@/services/doctorService';
import { BorderRadius, Shadows, StitchColors, DEFAULT_DOCTOR_AVATAR } from '@/constants/theme';
import UndoToast from '@/components/ui/UndoToast';
import { Avatar } from '@/components/ui/Avatar';
import { toLocalDateString } from '@/utils/formatters';

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
  rawTime?: string;
}

type ScheduleUndo =
  | { kind: 'slots'; day: string; session: 'morning' | 'evening'; slots: ScheduleSlot[]; label: string }
  | { kind: 'leave'; day: string; label: string };

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

// Generate dynamic 14 days starting from a given base date using live system clock
function generateDynamicWeek(baseDate?: Date) {
  const days: { day: string; date: string; key: string; dot: string; fullDate: string; isToday: boolean }[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const base = baseDate || now;

  for (let i = 0; i < 14; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dayLetter = dayNames[d.getDay()];
    const dateNum = d.getDate().toString();
    const fullDate = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    days.push({
      day: dayLetter,
      date: dateNum,
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      dot: isToday ? 'active' : d.getDay() === 0 ? 'off' : 'teal',
      fullDate,
      isToday,
    });
  }
  return days;
}

const DYNAMIC_WEEK_DAYS = generateDynamicWeek();

export default function DoctorScheduleScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [weekDays, setWeekDays] = useState(DYNAMIC_WEEK_DAYS);
  const [selectedDay, setSelectedDay] = useState(DYNAMIC_WEEK_DAYS[0]?.key || toLocalDateString(new Date()));
  const [selectedSession, setSelectedSession] = useState<'morning' | 'evening'>('morning');
  const [leaveDates, setLeaveDates] = useState<string[]>([]);
  const [activeDelayMinutes, setActiveDelayMinutes] = useState<number>(0);
  const [activeDelayReason, setActiveDelayReason] = useState<string | null>(null);
  const [isDayOnLeave, setIsDayOnLeave] = useState<boolean>(false);
  const [leaveReasonText, setLeaveReasonText] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Sync server schedule status for the entire week and the selected day
  const syncScheduleStatus = useCallback(async (dayKey: string) => {
    const docId = user?.doctorId || user?.id;
    if (!docId || !dayKey) return;
    try {
      const startKey = weekDays[0]?.key || dayKey;
      const endKey = weekDays[weekDays.length - 1]?.key || dayKey;

      const [weekMap, singleStatus] = await Promise.all([
        doctorService.getScheduleWeek(docId, startKey, endKey).catch(() => ({} as Record<string, any>)),
        doctorService.getScheduleStatus(docId, dayKey).catch(() => null),
      ]);

      const serverLeaveDays = new Set<string>();
      if (weekMap) {
        for (const [dKey, ov] of Object.entries(weekMap)) {
          if (ov?.isOnLeave) serverLeaveDays.add(dKey);
        }
      }
      if (singleStatus?.isOnLeave) {
        serverLeaveDays.add(dayKey);
      }
      setLeaveDates(Array.from(serverLeaveDays));

      const activeStatus = singleStatus || weekMap?.[dayKey] || { delayMinutes: 0, isOnLeave: false };
      setActiveDelayMinutes(activeStatus.delayMinutes || 0);
      setActiveDelayReason(activeStatus.delayReason || null);
      setIsDayOnLeave(Boolean(activeStatus.isOnLeave));
      setLeaveReasonText(activeStatus.leaveReason || null);
    } catch (err) {
      console.warn('[schedule] Failed to sync schedule status:', err);
    }
  }, [user?.doctorId, user?.id, weekDays]);

  useEffect(() => {
    syncScheduleStatus(selectedDay);
  }, [selectedDay, syncScheduleStatus]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        syncScheduleStatus(selectedDay),
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['doctor-slots'] }),
        queryClient.invalidateQueries({ queryKey: ['doctor-schedule-week'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  };
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      const newWeek = generateDynamicWeek(d);
      setWeekDays(newWeek);
      setSelectedDay(newWeek[0]?.key || d.toISOString().slice(0, 10));
      return d;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      const newWeek = generateDynamicWeek(d);
      setWeekDays(newWeek);
      setSelectedDay(newWeek[0]?.key || d.toISOString().slice(0, 10));
      return d;
    });
  };

  // Update dynamic week from live clock on mount
  useEffect(() => {
    const updated = generateDynamicWeek();
    setWeekDays(updated);
    if (updated[0]?.date) {
      setSelectedDay(updated[0].key);
    }
  }, []);

  // Dynamic Session Slots
  const [morningSlots] = useState<ScheduleSlot[]>([
    {
      id: 's1',
      patientId: '',
      patientName: '',
      token: '#01',
      time: '10:30',
      meridiem: 'AM',
      reason: 'Open OPD Consultation',
      status: 'available',
    },
    {
      id: 's2',
      patientId: '',
      patientName: '',
      token: '#02',
      time: '10:45',
      meridiem: 'AM',
      reason: 'Open OPD Consultation',
      status: 'available',
    },
    {
      id: 's3',
      patientId: '',
      patientName: '',
      token: '#03',
      time: '11:00',
      meridiem: 'AM',
      reason: 'Open OPD Consultation',
      status: 'available',
    },
    {
      id: 's4',
      patientId: '',
      patientName: '',
      token: '#04',
      time: '11:15',
      meridiem: 'AM',
      reason: 'Open OPD Consultation',
      status: 'available',
    },
  ]);

  const [eveningSlots] = useState<ScheduleSlot[]>([
    {
      id: 'e1',
      patientId: '',
      patientName: '',
      token: '#01',
      time: '05:00',
      meridiem: 'PM',
      reason: 'Open Evening Slot',
      status: 'available',
    },
    {
      id: 'e2',
      patientId: '',
      patientName: '',
      token: '#02',
      time: '05:20',
      meridiem: 'PM',
      reason: 'Open Evening Slot',
      status: 'available',
    },
    {
      id: 'e3',
      patientId: '',
      patientName: '',
      token: '#03',
      time: '05:40',
      meridiem: 'PM',
      reason: 'Open Evening Slot',
      status: 'available',
    },
  ]);
  const { data: serverAppointments = [] } = useAppointmentsQuery(undefined, user?.id);
  const storeAppointments = useAppointmentStore((s) => s.appointments);

  const allAppointments = useMemo(() => {
    const sIds = new Set(serverAppointments.map((a) => a.id));
    const local = storeAppointments.filter((a) => !sIds.has(a.id));
    return [...serverAppointments, ...local];
  }, [serverAppointments, storeAppointments]);

  const docId = user?.doctorId || user?.id;
  const { data: serverSlotsData, refetch: refetchServerSlots } = useQuery({
    queryKey: ['doctor-slots', docId, selectedDay],
    queryFn: async () => {
      if (!docId || !selectedDay) return null;
      return doctorService.getAvailableSlotsDetailed(docId, selectedDay).catch(() => null);
    },
    enabled: Boolean(docId && selectedDay),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const [slotDuration, setSlotDuration] = useState('15');
  const [slotDurationHours, setSlotDurationHours] = useState('0');
  const [slotDurationMins, setSlotDurationMins] = useState('15');
  const [maxPatients, setMaxPatients] = useState(12);

  useEffect(() => {
    if (serverSlotsData?.slotDurationMinutes) {
      setSlotDuration(String(serverSlotsData.slotDurationMinutes));
      setSlotDurationMins(String(serverSlotsData.slotDurationMinutes % 60));
      setSlotDurationHours(String(Math.floor(serverSlotsData.slotDurationMinutes / 60)));
    }
    if (serverSlotsData?.patientsPerSlot) {
      setMaxPatients(serverSlotsData.patientsPerSlot);
    }
  }, [serverSlotsData]);

  // Operations belong to a calendar date, never to the reusable session template.
  // A delay, block, or reschedule on Tuesday must not alter Wednesday's OPD.
  const [slotsByDate, setSlotsByDate] = useState<Record<string, { morning: ScheduleSlot[]; evening: ScheduleSlot[] }>>({});
  const rawMorningSlots = slotsByDate[selectedDay]?.morning || morningSlots;
  const rawEveningSlots = slotsByDate[selectedDay]?.evening || eveningSlots;

  const normalizeTimeForMatch = (t?: string) => {
    if (!t) return '';
    const match = t.trim().match(/^(\d{1,2}):(\d{2})/);
    return match ? `${match[1].padStart(2, '0')}:${match[2]}` : t.trim();
  };

  const selectedMorningSlots: ScheduleSlot[] = useMemo(() => {
    const dayApts = allAppointments.filter((a) => a.date?.slice(0, 10) === selectedDay);
    if (serverSlotsData?.allGeneratedSlots && serverSlotsData.allGeneratedSlots.length > 0) {
      const morningTimes = serverSlotsData.allGeneratedSlots.filter((t: string) => {
        const [h] = t.split(':').map(Number);
        return h < 13;
      });
      const availSet = new Set(serverSlotsData.slots || []);
      return morningTimes.map((timeStr: string, idx: number): ScheduleSlot => {
        const [h, m] = timeStr.split(':').map(Number);
        const meri = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        const formattedTime = `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const match = dayApts.find(
          (a) => normalizeTimeForMatch(a.time) === timeStr || normalizeTimeForMatch(a.time) === formattedTime
        );
        const isAvail = availSet.has(timeStr);
        if (match) {
          return {
            id: `srv-m-${idx}-${timeStr}`,
            rawTime: timeStr,
            time: formattedTime,
            meridiem: meri,
            token: match.tokenNumber ? String(match.tokenNumber).replace(/^Token\s*/i, '') : `#0${idx + 1}`,
            status: 'booked' as const,
            patientId: match.patientId,
            patientName: match.patientName,
            consultationId: match.id,
            reason: match.symptoms?.join(', ') || match.notes || 'OPD Consultation',
            delayMins: activeDelayMinutes,
          };
        }
        return {
          id: `srv-m-${idx}-${timeStr}`,
          rawTime: timeStr,
          time: formattedTime,
          meridiem: meri,
          token: `#0${idx + 1}`,
          status: isAvail ? ('available' as const) : ('blocked' as const),
          reason: isAvail ? 'Open OPD Consultation' : 'Blocked / Capacity Full',
          delayMins: activeDelayMinutes,
        };
      });
    }

    return rawMorningSlots.map((slot) => {
      const displaySlot = activeDelayMinutes > 0
        ? {
            ...slot,
            ...shiftTime(slot.time, slot.meridiem, activeDelayMinutes),
            delayMins: activeDelayMinutes,
          }
        : slot;

      const match = dayApts.find((a) =>
        normalizeTimeForMatch(a.time) === normalizeTimeForMatch(slot.time) ||
        normalizeTimeForMatch(a.time) === normalizeTimeForMatch(displaySlot.time)
      );
      if (match) {
        return {
          ...displaySlot,
          status: 'booked' as const,
          patientId: match.patientId,
          patientName: match.patientName,
          token: match.tokenNumber ? String(match.tokenNumber).replace(/^Token\s*/i, '') : displaySlot.token,
          reason: match.symptoms?.join(', ') || match.notes || 'OPD Consultation',
        };
      }
      return displaySlot;
    });
  }, [rawMorningSlots, allAppointments, selectedDay, activeDelayMinutes, serverSlotsData]);

  const selectedEveningSlots: ScheduleSlot[] = useMemo(() => {
    const dayApts = allAppointments.filter((a) => a.date?.slice(0, 10) === selectedDay);
    if (serverSlotsData?.allGeneratedSlots && serverSlotsData.allGeneratedSlots.length > 0) {
      const eveningTimes = serverSlotsData.allGeneratedSlots.filter((t: string) => {
        const [h] = t.split(':').map(Number);
        return h >= 13;
      });
      const availSet = new Set(serverSlotsData.slots || []);
      return eveningTimes.map((timeStr: string, idx: number): ScheduleSlot => {
        const [h, m] = timeStr.split(':').map(Number);
        const meri = h >= 12 ? 'PM' : 'AM';
        const displayH = h % 12 === 0 ? 12 : h % 12;
        const formattedTime = `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const match = dayApts.find(
          (a) => normalizeTimeForMatch(a.time) === timeStr || normalizeTimeForMatch(a.time) === formattedTime
        );
        const isAvail = availSet.has(timeStr);
        if (match) {
          return {
            id: `srv-e-${idx}-${timeStr}`,
            rawTime: timeStr,
            time: formattedTime,
            meridiem: meri,
            token: match.tokenNumber ? String(match.tokenNumber).replace(/^Token\s*/i, '') : `#0${idx + 1}`,
            status: 'booked' as const,
            patientId: match.patientId,
            patientName: match.patientName,
            consultationId: match.id,
            reason: match.symptoms?.join(', ') || match.notes || 'OPD Consultation',
            delayMins: activeDelayMinutes,
          };
        }
        return {
          id: `srv-e-${idx}-${timeStr}`,
          rawTime: timeStr,
          time: formattedTime,
          meridiem: meri,
          token: `#0${idx + 1}`,
          status: isAvail ? ('available' as const) : ('blocked' as const),
          reason: isAvail ? 'Open Evening Slot' : 'Blocked / Capacity Full',
          delayMins: activeDelayMinutes,
        };
      });
    }

    return rawEveningSlots.map((slot) => {
      const displaySlot = activeDelayMinutes > 0
        ? {
            ...slot,
            ...shiftTime(slot.time, slot.meridiem, activeDelayMinutes),
            delayMins: activeDelayMinutes,
          }
        : slot;

      const match = dayApts.find((a) =>
        normalizeTimeForMatch(a.time) === normalizeTimeForMatch(slot.time) ||
        normalizeTimeForMatch(a.time) === normalizeTimeForMatch(displaySlot.time)
      );
      if (match) {
        return {
          ...displaySlot,
          status: 'booked' as const,
          patientId: match.patientId,
          patientName: match.patientName,
          token: match.tokenNumber ? String(match.tokenNumber).replace(/^Token\s*/i, '') : displaySlot.token,
          reason: match.symptoms?.join(', ') || match.notes || 'OPD Consultation',
        };
      }
      return displaySlot;
    });
  }, [rawEveningSlots, allAppointments, selectedDay, activeDelayMinutes, serverSlotsData]);

  const updateSelectedSessionSlots = (session: 'morning' | 'evening', updater: (slots: ScheduleSlot[]) => ScheduleSlot[]) => {
    setSlotsByDate((previous) => {
      const current = previous[selectedDay] || {
        morning: morningSlots.map((slot) => ({ ...slot })),
        evening: eveningSlots.map((slot) => ({ ...slot })),
      };
      return {
        ...previous,
        [selectedDay]: {
          ...current,
          [session]: updater(current[session]),
        },
      };
    });
  };

  // Shift Timings State (Editable)
  const [morningStart, setMorningStart] = useState('10:30 AM');
  const [morningEnd, setMorningEnd] = useState('01:30 PM');
  const [eveningStart, setEveningStart] = useState('05:00 PM');
  const [eveningEnd, setEveningEnd] = useState('08:00 PM');

  // Modals & Notifications
  const [capacityModalVisible, setCapacityModalVisible] = useState(false);
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [customDelayModalVisible, setCustomDelayModalVisible] = useState(false);
  const [customDelayMins, setCustomDelayMins] = useState('20');
  const [rescheduleSlot, setRescheduleSlot] = useState<ScheduleSlot | null>(null);

  // Add Custom Slot Modal State
  const [addSlotModalVisible, setAddSlotModalVisible] = useState(false);
  const [customSlotHour, setCustomSlotHour] = useState('11');
  const [customSlotMinute, setCustomSlotMinute] = useState('30');
  const [customSlotMeridiem, setCustomSlotMeridiem] = useState<'AM' | 'PM'>('AM');

  const [delayNotice, setDelayNotice] = useState<string | null>(null);
  const [lastUndo, setLastUndo] = useState<ScheduleUndo | null>(null);
  const [undoDelayMins, setUndoDelayMins] = useState<number>(15);

  const handleToggleSlotBlock = async (slot: ScheduleSlot) => {
    const targetDocId = user?.doctorId || user?.id;
    const timeToToggle = slot.rawTime || `${slot.time} ${slot.meridiem}`;
    const isCurrentlyBlocked = slot.status === 'blocked';
    const action = isCurrentlyBlocked ? 'remove' : 'block';
    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await doctorService.manageCustomSlot({
        doctorId: targetDocId,
        date: selectedDay,
        time: timeToToggle,
        action,
      });
      await refetchServerSlots();
      queryClient.invalidateQueries({ queryKey: ['doctor-slots'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-schedule-week'] });
      setDelayNotice(`Slot ${slot.time} ${slot.meridiem} ${action === 'block' ? 'blocked' : 'unblocked'}.`);
      setTimeout(() => setDelayNotice(null), 2500);
    } catch (err: any) {
      console.warn('[schedule] Toggle slot block error:', err?.message);
    }
  };

  const handleAddCustomSlot = async () => {
    const targetDocId = user?.doctorId || user?.id;
    const timeString = `${customSlotHour}:${customSlotMinute} ${customSlotMeridiem}`;
    try {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await doctorService.manageCustomSlot({
        doctorId: targetDocId,
        date: selectedDay,
        time: timeString,
        action: 'add',
      });
      setAddSlotModalVisible(false);
      await refetchServerSlots();
      queryClient.invalidateQueries({ queryKey: ['doctor-slots'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-schedule-week'] });
      setDelayNotice(`Custom slot ${timeString} added for ${selectedDay}.`);
      setTimeout(() => setDelayNotice(null), 3000);
    } catch (err: any) {
      console.warn('[schedule] Add custom slot error:', err?.message);
    }
  };

  const handleDeleteSlot = async (slot: ScheduleSlot) => {
    const targetDocId = user?.doctorId || user?.id;
    const timeToDelete = slot.rawTime || `${slot.time} ${slot.meridiem}`;
    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await doctorService.manageCustomSlot({
        doctorId: targetDocId,
        date: selectedDay,
        time: timeToDelete,
        action: 'remove',
      });
      await refetchServerSlots();
      queryClient.invalidateQueries({ queryKey: ['doctor-slots'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-schedule-week'] });
      setDelayNotice(`Slot ${slot.time} ${slot.meridiem} removed.`);
      setTimeout(() => setDelayNotice(null), 2500);
    } catch (err: any) {
      console.warn('[schedule] Remove slot error:', err?.message);
    }
  };

  // Leave Form
  const [leaveReason, setLeaveReason] = useState('Personal / Medical Leave');
  const [leaveStartDate, setLeaveStartDate] = useState(selectedDay || toLocalDateString(new Date()));
  const [leaveEndDate, setLeaveEndDate] = useState('');

  const applyLeavePreset = (preset: 'today' | 'tomorrow' | '3days' | '1week') => {
    const base = new Date(selectedDay || Date.now());
    if (preset === 'today') {
      const todayStr = toLocalDateString(new Date());
      setLeaveStartDate(todayStr);
      setLeaveEndDate('');
    } else if (preset === 'tomorrow') {
      const tom = new Date();
      tom.setDate(tom.getDate() + 1);
      setLeaveStartDate(toLocalDateString(tom));
      setLeaveEndDate('');
    } else if (preset === '3days') {
      const s = toLocalDateString(base);
      const e = new Date(base);
      e.setDate(e.getDate() + 2);
      setLeaveStartDate(s);
      setLeaveEndDate(toLocalDateString(e));
    } else if (preset === '1week') {
      const s = toLocalDateString(base);
      const e = new Date(base);
      e.setDate(e.getDate() + 6);
      setLeaveStartDate(s);
      setLeaveEndDate(toLocalDateString(e));
    }
  };

  const doctorName = user?.name ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`) : 'Doctor';

  const handleSelectDay = (date: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setSelectedDay(date);
  };

  // 1. EMERGENCY DELAY: Shifts all slot times for the selected date only & alerts scheduled patients
  const handleEmergencyDelay = (mins: number) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    const originalSlots = (selectedSession === 'morning' ? selectedMorningSlots : selectedEveningSlots).map((slot) => ({ ...slot }));
    setLastUndo({ kind: 'slots', day: selectedDay, session: selectedSession, slots: originalSlots, label: `Undo +${mins}m delay` });
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
      updateSelectedSessionSlots('morning', updater);
    } else {
      updateSelectedSessionSlots('evening', updater);
    }

    const docId = user?.doctorId || user?.id;
    const newDelay = activeDelayMinutes + mins;
    setActiveDelayMinutes(newDelay);
    setActiveDelayReason('OPD Clinical Delay / Emergency');

    const selectedDayLabel = weekDays.find((day) => day.key === selectedDay)?.fullDate || selectedDay;
    useNotificationStore.getState().addNotification({
      title: `OPD Emergency Delay (+${mins}m)`,
      message: `${doctorName} is running ~${mins} minutes behind schedule on ${selectedDayLabel} due to a medical emergency. Your slot time has been adjusted.`,
      type: 'schedule_delay',
      recipientRole: 'patient',
    });

    // Sync delay to server and broadcast
    doctorService
      .applyScheduleDelay({
        doctorId: docId,
        date: selectedDay,
        delayMinutes: newDelay,
        reason: 'OPD Clinical Delay / Emergency',
      })
      .then(async () => {
        await syncScheduleStatus(selectedDay);
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['doctor-slots'] });
        queryClient.invalidateQueries({ queryKey: ['doctor-schedule-week'] });
      })
      .catch((err) => {
        console.warn('[schedule] Server delay sync notice:', err?.message);
      });

    setDelayNotice(`+${mins}m emergency delay applied & synced to server. Patients notified.`);
    setTimeout(() => setDelayNotice(null), 3500);
  };

  // 2. LEAVE MANAGEMENT: Marks date range as leave & cancels appointments on server
  const handleApplyLeave = async () => {
    setLeaveModalVisible(false);
    const start = leaveStartDate.trim() || selectedDay;
    const end = leaveEndDate.trim() || start;
    const docId = user?.doctorId || user?.id;

    // Generate list of affected date strings
    const affected: string[] = [];
    const cur = new Date(start);
    const stop = new Date(end);
    if (!isNaN(cur.getTime()) && !isNaN(stop.getTime()) && cur <= stop) {
      while (cur <= stop) {
        affected.push(toLocalDateString(cur));
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      affected.push(start);
    }

    const mergedLeaves = Array.from(new Set([...leaveDates, ...affected]));
    setLeaveDates(mergedLeaves);
    setLastUndo({ kind: 'leave', day: start, label: 'Undo leave' });

    if (affected.includes(selectedDay)) {
      setIsDayOnLeave(true);
      setLeaveReasonText(leaveReason);
    }

    const rangeLabel = start === end ? start : `${start} to ${end}`;
    useNotificationStore.getState().addNotification({
      title: 'OPD Schedule Update — Doctor On Leave',
      message: `${doctorName} will be on leave (${rangeLabel}) for ${leaveReason}. Booked appointments in this window are being cancelled.`,
      type: 'schedule_alert',
      recipientRole: 'patient',
    });

    try {
      await doctorService.applyScheduleLeave({
        doctorId: docId,
        startDate: start,
        endDate: end,
        reason: leaveReason,
      });
      await syncScheduleStatus(selectedDay);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        queryClient.invalidateQueries({ queryKey: ['doctor-slots'] }),
        queryClient.invalidateQueries({ queryKey: ['doctor-schedule-week'] }),
      ]);
      setDelayNotice(`Leave saved globally for ${rangeLabel} (${leaveReason}). Bookings cancelled.`);
    } catch (err: any) {
      console.warn('[schedule] Server leave sync notice:', err?.message);
      setDelayNotice(`Leave applied locally. Server: ${err?.message || 'Offline'}`);
    }

    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setDelayNotice(null), 4500);
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

    const originalSlots = (selectedSession === 'morning' ? selectedMorningSlots : selectedEveningSlots).map((slot) => ({ ...slot }));
    setLastUndo({ kind: 'slots', day: selectedDay, session: selectedSession, slots: originalSlots, label: 'Undo reschedule' });
    if (selectedSession === 'morning') {
      updateSelectedSessionSlots('morning', (previous) => previous.map(updateSlot));
    } else {
      updateSelectedSessionSlots('evening', (previous) => previous.map(updateSlot));
    }

    if (rescheduleSlot.patientName) {
      useNotificationStore.getState().addNotification({
        title: `Appointment ${isPostpone ? 'Postponed' : 'Preponed'}`,
        message: `Your appointment with ${doctorName} has been ${isPostpone ? 'postponed' : 'preponed'} by ${Math.abs(mins)} mins. New estimated time: ${shifted.time} ${shifted.meridiem}.`,
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

  const handleUndoScheduleChange = () => {
    if (!lastUndo) return;
    const action = lastUndo.kind === 'leave' ? 'leave' : 'delay';
    const docId = user?.doctorId || user?.id;

    if (lastUndo.kind === 'leave') {
      setIsDayOnLeave(false);
      setLeaveDates((dates) => dates.filter((date) => date !== lastUndo.day));
    } else {
      setActiveDelayMinutes(0);
      setActiveDelayReason(null);
      setSlotsByDate((previous) => {
        const current = previous[lastUndo.day] || {
          morning: morningSlots.map((slot) => ({ ...slot })),
          evening: eveningSlots.map((slot) => ({ ...slot })),
        };
        return { ...previous, [lastUndo.day]: { ...current, [lastUndo.session]: lastUndo.slots } };
      });
    }

    // Sync undo to server
    doctorService
      .undoScheduleOverride({
        doctorId: docId,
        date: lastUndo.day,
        action,
      })
      .then(async () => {
        await syncScheduleStatus(selectedDay);
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['doctor-slots'] });
        queryClient.invalidateQueries({ queryKey: ['doctor-schedule-week'] });
      })
      .catch((err) => {
        console.warn('[schedule] Server undo notice:', err?.message);
      });

    setDelayNotice(`${lastUndo.label.replace('Undo ', '')} reverted on server.`);
    setLastUndo(null);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
            <Avatar uri={user?.avatar || null} name={user?.name || 'Doctor'} size="sm" />
          </Pressable>
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
        {/* Active Delay Banner (persistent across refresh) */}
        {activeDelayMinutes > 0 && !isDayOnLeave && (
          <View style={styles.serverDelayCard}>
            <Clock size={16} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={styles.serverDelayTitle}>
                OPD Running +{activeDelayMinutes}m Behind Schedule
              </Text>
              <Text style={styles.serverDelaySubtitle}>
                Slots shifted on server · {activeDelayReason || 'Clinical Delay'}
              </Text>
            </View>
            <Pressable
              style={styles.serverResetBtn}
              onPress={async () => {
                const docId = user?.doctorId || user?.id;
                await doctorService.undoScheduleOverride({ doctorId: docId, date: selectedDay, action: 'delay' });
                setActiveDelayMinutes(0);
                setActiveDelayReason(null);
                await syncScheduleStatus(selectedDay);
                queryClient.invalidateQueries({ queryKey: ['appointments'] });
                queryClient.invalidateQueries({ queryKey: ['doctor-slots'] });
                queryClient.invalidateQueries({ queryKey: ['doctor-schedule-week'] });
              }}
            >
              <RotateCcw size={12} color="#B45309" />
              <Text style={styles.serverResetBtnText}>Reset</Text>
            </Pressable>
          </View>
        )}

        {/* Active Leave Banner (persistent across refresh) */}
        {isDayOnLeave && (
          <View style={styles.serverLeaveCard}>
            <CalendarX size={16} color="#DC2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.serverLeaveTitle}>On Leave — OPD Closed for this Date</Text>
              <Text style={styles.serverLeaveSubtitle}>
                Bookings cancelled & prospective slots disabled · {leaveReasonText || 'Leave'}
              </Text>
            </View>
            <Pressable
              style={styles.serverCancelLeaveBtn}
              onPress={async () => {
                const docId = user?.doctorId || user?.id;
                await doctorService.undoScheduleOverride({ doctorId: docId, date: selectedDay, action: 'leave' });
                setIsDayOnLeave(false);
                setLeaveDates((prev) => prev.filter((d) => d !== selectedDay));
                await syncScheduleStatus(selectedDay);
                queryClient.invalidateQueries({ queryKey: ['appointments'] });
                queryClient.invalidateQueries({ queryKey: ['doctor-slots'] });
                queryClient.invalidateQueries({ queryKey: ['doctor-schedule-week'] });
              }}
            >
              <RotateCcw size={12} color="#B91C1C" />
              <Text style={styles.serverCancelLeaveBtnText}>Resume OPD</Text>
            </Pressable>
          </View>
        )}
        {/* Delay Toast Notification */}
        {delayNotice && (
          <View style={[styles.delayBanner, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}>
            <AlertTriangle size={16} color="#D97706" />
            <Text style={styles.delayBannerText}>{delayNotice}</Text>
            {lastUndo ? (
              <Pressable onPress={handleUndoScheduleChange} style={styles.undoBtn} accessibilityLabel={lastUndo.label}>
                <Text style={styles.undoBtnText}>{lastUndo.label}</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        {/* 2. Top Controls & Month Navigator */}
        <View style={styles.monthControlRow}>
        <View style={[styles.monthPill, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
            <Pressable onPress={handlePrevMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.navArrow}>
              <ChevronLeft size={16} color={colors.text} />
            </Pressable>
            <Text style={[styles.monthText, { color: colors.text }]}>
              {currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </Text>
            <Pressable onPress={handleNextMonth} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.navArrow}>
              <ChevronRight size={16} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.monthActionsRow}>
            <Pressable
              onPress={() => {
                const today = new Date();
                const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                setCurrentMonth(firstOfMonth);
                const todayWeek = generateDynamicWeek();
                setWeekDays(todayWeek);
                setSelectedDay(todayWeek[0]?.key || toLocalDateString(today));
              }}
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
            <Text style={[styles.weekLabel, { color: colors.textSecondary }]}>SCHEDULE 7-DAY OUTLOOK</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={styles.pingDot} />
              <Text style={[styles.activeApptText, { color: StitchColors.secondaryContainer }]}>
                Live In-Clinic Sessions
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
            directionalLockEnabled={true}
            contentContainerStyle={styles.swipableCalendarScroll}
            style={[styles.weekGridScroll, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {weekDays.map((w) => {
              const isSelected = selectedDay === w.key;
              const isLeave = leaveDates.includes(w.key);
              const isOff = w.dot === 'off' && !isLeave;

              return (
                <Pressable
                  key={w.key}
                  onPress={() => handleSelectDay(w.key)}
                  style={[
                    styles.dayColCard,
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
                    <View style={[styles.dotIndicator, { backgroundColor: isSelected ? '#FFFFFF' : StitchColors.error }]} />
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
          </ScrollView>
        </View>

        {/* 4. Upcoming Holiday Notice Pill */}
        <Pressable
          onPress={() => setLeaveModalVisible(true)}
          style={[
            styles.holidayCard,
            {
              backgroundColor: isDayOnLeave || leaveDates.includes(selectedDay) ? '#FEF2F2' : colors.backgroundElement,
              borderColor: isDayOnLeave || leaveDates.includes(selectedDay) ? '#FCA5A5' : colors.border,
            },
          ]}
        >
          <View style={[styles.holidayIconWrap, { backgroundColor: isDayOnLeave || leaveDates.includes(selectedDay) ? '#FEE2E2' : '#CCFBF1' }]}>
            <Umbrella size={16} color={isDayOnLeave || leaveDates.includes(selectedDay) ? StitchColors.error : StitchColors.secondary} />
          </View>

          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.holidayTitle, { color: isDayOnLeave || leaveDates.includes(selectedDay) ? '#991B1B' : colors.text }]}>
                {isDayOnLeave || leaveDates.includes(selectedDay)
                  ? (leaveReasonText || 'OPD Closed — Doctor on Leave')
                  : leaveDates.length > 0
                  ? `Scheduled Leave (${leaveDates.length} day${leaveDates.length > 1 ? 's' : ''} this week)`
                  : 'Doctor Holiday & Leave Scheduler'}
              </Text>
              <View style={[styles.holidayBadge, { backgroundColor: isDayOnLeave || leaveDates.includes(selectedDay) ? '#FEE2E2' : colors.card }]}>
                <Text style={[styles.holidayBadgeText, { color: isDayOnLeave || leaveDates.includes(selectedDay) ? '#DC2626' : colors.textSecondary }]}>
                  {isDayOnLeave || leaveDates.includes(selectedDay) ? 'Active Leave' : leaveDates.length > 0 ? `${leaveDates.length} Days` : '+ Schedule'}
                </Text>
              </View>
            </View>
            <Text style={[styles.holidayDesc, { color: isDayOnLeave || leaveDates.includes(selectedDay) ? '#B91C1C' : colors.textSecondary }]}>
              {isDayOnLeave || leaveDates.includes(selectedDay)
                ? 'OPD Closed • Online reservations halted for this date'
                : leaveDates.length > 0
                ? `Upcoming leaves on: ${leaveDates.join(', ')}`
                : 'Manage doctor holidays, leave days, or conference absences'}
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
              <Text style={[styles.sessionTiming, { color: colors.textSecondary }]}>{morningStart} - {morningEnd}</Text>
              <Text style={[styles.sessionStats, { color: StitchColors.secondaryContainer }]}>
                {selectedMorningSlots.filter((s) => s.status === 'booked').length} of {selectedMorningSlots.length} Booked
              </Text>
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
              <Text style={[styles.sessionTiming, { color: colors.textSecondary }]}>{eveningStart} - {eveningEnd}</Text>
              <Text style={[styles.sessionStats, { color: colors.textSecondary }]}>
                {selectedEveningSlots.filter((s) => s.status === 'booked').length} of {selectedEveningSlots.length} Booked
              </Text>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.timelineDateText, { color: colors.textSecondary }]}>
                {weekDays.find((w) => w.key === selectedDay)?.fullDate || selectedDay}
              </Text>
              <Pressable
                onPress={() => {
                  setCustomSlotMeridiem(selectedSession === 'morning' ? 'AM' : 'PM');
                  setAddSlotModalVisible(true);
                }}
                style={[styles.addSlotBtn, { backgroundColor: StitchColors.primaryContainer }]}
                accessibilityRole="button"
                accessibilityLabel="Add custom slot"
              >
                <Plus size={12} color="#FFFFFF" />
                <Text style={styles.addSlotBtnText}>+ Slot</Text>
              </Pressable>
            </View>
          </View>

          {/* DOCTOR ON LEAVE BANNER IF DATE IS MARKED */}
          {isDayOnLeave || leaveDates.includes(selectedDay) ? (
            <View style={[styles.onLeaveTimelineCard, { backgroundColor: colors.card, borderColor: '#FCA5A5' }]}>
              <View style={[styles.onLeaveIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Umbrella size={24} color={StitchColors.error} />
              </View>
              <Text style={[styles.onLeaveTitle, { color: colors.text }]}>Doctor Is On Scheduled Leave</Text>
              <Text style={[styles.onLeaveReason, { color: StitchColors.error }]}>
                {leaveReasonText || leaveReason || 'Clinic OPD Suspended'}
              </Text>
              <Text style={[styles.onLeaveDesc, { color: colors.textSecondary }]}>
                OPD sessions, walk-ins, and online bookings are suspended for this day. Scheduled patients have been automatically queued for rescheduling.
              </Text>
              <Pressable
                onPress={async () => {
                  const docId = user?.doctorId || user?.id;
                  await doctorService.undoScheduleOverride({ doctorId: docId, date: selectedDay, action: 'leave' });
                  setIsDayOnLeave(false);
                  setLeaveDates(leaveDates.filter((d) => d !== selectedDay));
                  await syncScheduleStatus(selectedDay);
                  queryClient.invalidateQueries({ queryKey: ['appointments'] });
                  queryClient.invalidateQueries({ queryKey: ['doctor-slots'] });
                  queryClient.invalidateQueries({ queryKey: ['doctor-schedule-week'] });
                  if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setDelayNotice(`Leave cancelled on server for ${selectedDay}. OPD reopened.`);
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
              {(selectedSession === 'morning' ? selectedMorningSlots : selectedEveningSlots).map((slot) => {
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
                            onPress={() => handleToggleSlotBlock(slot)}
                            style={[styles.blockIconBtn, { backgroundColor: colors.backgroundElement }]}
                            accessibilityLabel="Block slot"
                          >
                            <Ban size={14} color={colors.textSecondary} />
                          </Pressable>
                        </>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Pressable
                            onPress={() => handleToggleSlotBlock(slot)}
                            style={[styles.unblockBtn, { backgroundColor: colors.card }]}
                          >
                            <Text style={[styles.unblockBtnText, { color: StitchColors.primaryContainer }]}>Unblock</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleDeleteSlot(slot)}
                            style={[styles.blockIconBtn, { backgroundColor: '#FEE2E2' }]}
                            accessibilityLabel="Remove slot"
                          >
                            <X size={13} color="#DC2626" />
                          </Pressable>
                        </View>
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
              {lastUndo && lastUndo.kind === 'slots' && (
                <Pressable
                  onPress={handleUndoScheduleChange}
                  style={[styles.delayBtn, { backgroundColor: '#FEE2E2', borderColor: '#F87171', borderWidth: 1 }]}
                  accessibilityRole="button"
                  accessibilityLabel="Undo last delay"
                >
                  <RotateCcw size={13} color="#DC2626" />
                  <Text style={[styles.delayBtnText, { color: '#DC2626', fontWeight: '700' }]}>Undo</Text>
                </Pressable>
              )}
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
              <Pressable
                onPress={() => setCustomDelayModalVisible(true)}
                style={[styles.delayBtn, { backgroundColor: colors.backgroundElement, minWidth: 54 }]}
                accessibilityRole="button"
                accessibilityLabel="Set custom emergency delay in minutes"
              >
                <Text style={[styles.delayBtnText, { color: StitchColors.primaryContainer }]}>Custom</Text>
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

      {/* MODAL: Modify Capacity & Timings */}
      <Modal visible={capacityModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Modify Shift Timings & Slots</Text>
              <Pressable onPress={() => setCapacityModalVisible(false)}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            {/* Shift Timings */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>MORNING SHIFT TIMINGS</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={morningStart}
                  onChangeText={setMorningStart}
                  placeholder="10:30 AM"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.miniTextInput, { borderColor: colors.border, color: colors.text }]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={morningEnd}
                  onChangeText={setMorningEnd}
                  placeholder="01:30 PM"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.miniTextInput, { borderColor: colors.border, color: colors.text }]}
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>EVENING SHIFT TIMINGS</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={eveningStart}
                  onChangeText={setEveningStart}
                  placeholder="05:00 PM"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.miniTextInput, { borderColor: colors.border, color: colors.text }]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={eveningEnd}
                  onChangeText={setEveningEnd}
                  placeholder="08:00 PM"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.miniTextInput, { borderColor: colors.border, color: colors.text }]}
                />
              </View>
            </View>

            {/* Dynamic Slot Duration Hours and Minutes */}
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>SLOT DURATION (HOURS & MINS)</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Hours</Text>
                <TextInput
                  value={slotDurationHours}
                  onChangeText={setSlotDurationHours}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={[styles.miniTextInput, { textAlign: 'center', borderColor: colors.border, color: colors.text }]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Minutes</Text>
                <TextInput
                  value={slotDurationMins}
                  onChangeText={(val) => {
                    setSlotDurationMins(val);
                    setSlotDuration(val || '15');
                  }}
                  placeholder="15"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  style={[styles.miniTextInput, { textAlign: 'center', borderColor: colors.border, color: colors.text }]}
                />
              </View>
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
              onPress={async () => {
                const totalMins = (parseInt(slotDurationHours, 10) || 0) * 60 + (parseInt(slotDurationMins, 10) || 15);
                setSlotDuration(totalMins.toString());
                setCapacityModalVisible(false);
                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Helper to convert time string like "10:30 AM" to "10:30"
                const to24 = (t: string) => {
                  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
                  if (!m) return t.trim();
                  let h = Number(m[1]);
                  const min = Number(m[2]);
                  const meri = m[3]?.toUpperCase();
                  if (meri === 'PM' && h !== 12) h += 12;
                  if (meri === 'AM' && h === 12) h = 0;
                  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
                };

                const targetDocId = user?.doctorId || user?.id;
                try {
                  const morningStart24 = to24(morningStart);
                  const morningEnd24 = to24(morningEnd);
                  const eveningStart24 = to24(eveningStart);
                  const eveningEnd24 = to24(eveningEnd);

                  await doctorService.updateScheduleSettings({
                    doctorId: targetDocId,
                    date: selectedDay,
                    slotDurationMinutes: totalMins,
                    patientsPerSlot: maxPatients,
                    morningStart,
                    morningEnd,
                    eveningStart,
                    eveningEnd,
                  });

                  const availabilities = [1, 2, 3, 4, 5, 6].flatMap((dayOfWeek) => [
                    { dayOfWeek, startTime: morningStart24, endTime: morningEnd24, slotDurationMinutes: totalMins },
                    { dayOfWeek, startTime: eveningStart24, endTime: eveningEnd24, slotDurationMinutes: totalMins },
                  ]);

                  await doctorService.updateMyAvailability(availabilities);
                  await refetchServerSlots();
                  queryClient.invalidateQueries({ queryKey: ['doctor-slots'] });
                  queryClient.invalidateQueries({ queryKey: ['doctor-schedule-week'] });
                  setDelayNotice(`Shifts & capacity saved to server: ${totalMins}m duration, ${maxPatients} patients/slot.`);
                } catch (err: any) {
                  console.warn('[schedule] Server availability sync error:', err?.message);
                  setDelayNotice(`Shifts updated locally: ${totalMins}m slot duration.`);
                }
                setTimeout(() => setDelayNotice(null), 3500);
              }}
              style={[styles.applySettingsBtn, { backgroundColor: StitchColors.primaryContainer }]}
            >
              <Text style={styles.applySettingsBtnText}>Apply to OPD Schedule</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL: Custom Emergency Delay */}
      <Modal visible={customDelayModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Custom Emergency Delay</Text>
              <Pressable onPress={() => setCustomDelayModalVisible(false)}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>DELAY IN MINUTES (FOR TODAY ONLY)</Text>
            <TextInput
              value={customDelayMins}
              onChangeText={setCustomDelayMins}
              placeholder="e.g. 25"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={[styles.textInputFull, { color: colors.text, borderColor: colors.border }]}
            />

            <Pressable
              onPress={() => {
                const mins = parseInt(customDelayMins, 10) || 15;
                setCustomDelayModalVisible(false);
                handleEmergencyDelay(mins);
              }}
              style={[styles.applySettingsBtn, { backgroundColor: StitchColors.primaryContainer, marginTop: 14 }]}
            >
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.applySettingsBtnText}>Apply Delay & Notify Patients</Text>
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

            <View style={{ marginTop: 12 }}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>QUICK DATE PRESETS</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {[
                  { label: 'Today', key: 'today' as const },
                  { label: 'Tomorrow', key: 'tomorrow' as const },
                  { label: '3 Days', key: '3days' as const },
                  { label: '1 Week', key: '1week' as const },
                ].map((p) => (
                  <Pressable
                    key={p.key}
                    onPress={() => applyLeavePreset(p.key)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: BorderRadius.full,
                      backgroundColor: colors.backgroundElement,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>{p.label}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>START DATE (YYYY-MM-DD)</Text>
                  <TextInput
                    value={leaveStartDate}
                    onChangeText={setLeaveStartDate}
                    placeholder="2026-09-17"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.textInputFull, { color: colors.text, borderColor: colors.border }]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>END DATE (OPTIONAL)</Text>
                  <TextInput
                    value={leaveEndDate}
                    onChangeText={setLeaveEndDate}
                    placeholder="Leave blank for 1 day"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.textInputFull, { color: colors.text, borderColor: colors.border }]}
                  />
                </View>
              </View>
            </View>

            <View style={[styles.autoNoticeBox, { backgroundColor: colors.backgroundElement, marginTop: 10 }]}>
              <CheckCircle2 size={16} color={StitchColors.secondary} />
              <Text style={[styles.autoNoticeBoxText, { color: colors.textSecondary }]}>
                {leaveEndDate && leaveEndDate.trim() && leaveEndDate.trim() !== leaveStartDate.trim()
                  ? `Leave active from ${leaveStartDate} to ${leaveEndDate}. All booked visits in this range will be cancelled and patients notified.`
                  : `Leave active for 1 day on ${leaveStartDate || selectedDay}. Booked visits will be cancelled and patients notified.`}
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

      {/* MODAL: Add Custom Slot */}
      <Modal visible={addSlotModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Plus size={18} color={StitchColors.primaryContainer} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add Custom OPD Slot</Text>
              </View>
              <Pressable onPress={() => setAddSlotModalVisible(false)}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>TARGET DATE</Text>
            <View style={[styles.autoNoticeBox, { backgroundColor: colors.backgroundElement, marginBottom: 12 }]}>
              <CalendarIcon size={16} color={StitchColors.primaryContainer} />
              <Text style={[styles.autoNoticeBoxText, { color: colors.text, fontWeight: '700' }]}>
                {weekDays.find((w) => w.key === selectedDay)?.fullDate || selectedDay}
              </Text>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>SLOT TIMING (HOUR & MINUTE)</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Hour (1-12)</Text>
                <TextInput
                  value={customSlotHour}
                  onChangeText={setCustomSlotHour}
                  placeholder="11"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                  style={[styles.miniTextInput, { textAlign: 'center', borderColor: colors.border, color: colors.text }]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Minute (00-59)</Text>
                <TextInput
                  value={customSlotMinute}
                  onChangeText={setCustomSlotMinute}
                  placeholder="30"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                  style={[styles.miniTextInput, { textAlign: 'center', borderColor: colors.border, color: colors.text }]}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 4 }}>Period</Text>
                <View style={{ flexDirection: 'row', height: 42, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
                  <Pressable
                    onPress={() => setCustomSlotMeridiem('AM')}
                    style={{
                      flex: 1,
                      backgroundColor: customSlotMeridiem === 'AM' ? StitchColors.primaryContainer : colors.backgroundElement,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: customSlotMeridiem === 'AM' ? '#FFFFFF' : colors.text }}>AM</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setCustomSlotMeridiem('PM')}
                    style={{
                      flex: 1,
                      backgroundColor: customSlotMeridiem === 'PM' ? StitchColors.primaryContainer : colors.backgroundElement,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: customSlotMeridiem === 'PM' ? '#FFFFFF' : colors.text }}>PM</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>QUICK PRESETS</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {['10:15 AM', '11:45 AM', '12:30 PM', '04:30 PM', '06:15 PM', '07:45 PM'].map((p) => (
                <Pressable
                  key={p}
                  onPress={() => {
                    const [t, meri] = p.split(' ');
                    const [h, m] = t.split(':');
                    setCustomSlotHour(h);
                    setCustomSlotMinute(m);
                    setCustomSlotMeridiem(meri as 'AM' | 'PM');
                  }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: BorderRadius.full,
                    backgroundColor: colors.backgroundElement,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text }}>{p}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={handleAddCustomSlot}
              style={[styles.applySettingsBtn, { backgroundColor: StitchColors.primaryContainer }]}
            >
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.applySettingsBtnText}>Create Slot & Publish to OPD</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <UndoToast
        visible={Boolean(lastUndo && lastUndo.kind === 'slots')}
        message={delayNotice || (lastUndo ? `${lastUndo.label.replace('Undo ', '')} applied.` : '')}
        onUndo={handleUndoScheduleChange}
        onDismiss={() => setLastUndo(null)}
        durationMs={12000}
      />
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
    paddingBottom: 120,
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
  undoBtn: {
    backgroundColor: '#92400E',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  undoBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
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
  weekGridScroll: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    ...Shadows.subtle,
  },
  swipableCalendarScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    gap: 8,
  },
  dayColCard: {
    width: 54,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    gap: 4,
  },
  addSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    ...Shadows.subtle,
  },
  addSlotBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
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
  miniTextInput: {
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  serverDelayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  serverDelayTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  serverDelaySubtitle: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1,
  },
  serverResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCD34D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  serverResetBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#B45309',
  },
  serverLeaveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  serverLeaveTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#B91C1C',
  },
  serverLeaveSubtitle: {
    fontSize: 11,
    color: '#DC2626',
    marginTop: 1,
  },
  serverCancelLeaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  serverCancelLeaveBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#B91C1C',
  },
});
