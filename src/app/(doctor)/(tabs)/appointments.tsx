import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useAppointmentsQuery } from '@/hooks/queries/useAppointmentsQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationAnimation } from '@/components/ui/ConfirmationAnimation';
import {
  Calendar,
  Clock,
  Video,
  Building2,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Clock3,
  CheckCircle2,
  UserCheck,
} from 'lucide-react-native';

function addMinutesToTimeString(timeStr: string, minutesToAdd: number): string {
  try {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) return timeStr;
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const meridian = (match[3] || 'AM').toUpperCase();

    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    const totalMins = hours * 60 + mins + minutesToAdd;
    let newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    const newMeridian = newHours >= 12 ? 'PM' : 'AM';
    if (newHours > 12) newHours -= 12;
    if (newHours === 0) newHours = 12;

    const formattedMins = newMins < 10 ? `0${newMins}` : `${newMins}`;
    return `${newHours}:${formattedMins} ${newMeridian}`;
  } catch {
    return timeStr;
  }
}

const POSTPONE_PRESETS = [
  { label: '+15m', minutes: 15 },
  { label: '+30m', minutes: 30 },
  { label: '+45m', minutes: 45 },
  { label: '+1h', minutes: 60 },
];

const REASON_PRESETS = [
  'OPD running behind schedule',
  'Attending emergency clinical case',
  'Inpatient hospital rounds extension',
  'Emergency surgical review',
];

export default function DoctorAppointmentsQueueScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const { data: appointments, isRefetching, refetch } = useAppointmentsQuery(undefined, user?.id);
  const [refreshing, setRefreshing] = useState(false);

  // Postpone State
  const [selectedApt, setSelectedApt] = useState<any | null>(null);
  const [selectedMinutes, setSelectedMinutes] = useState<number>(30);
  const [selectedReason, setSelectedReason] = useState<string>(REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState<string>('');
  const [postponeModalVisible, setPostponeModalVisible] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  // Confirm Arrival State
  const [confirmedApt, setConfirmedApt] = useState<any | null>(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

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

  const handleConfirmArrival = (apt: any) => {
    setConfirmedApt(apt);
    setConfirmModalVisible(true);

    // Alert Patient via Notification
    useNotificationStore.getState().addNotification({
      recipientId: apt.patientId || 'pat_1',
      recipientRole: 'patient',
      title: 'Doctor Confirmed Arrival',
      message: `${user?.name || apt.doctorName || 'Your doctor'} has confirmed your OPD arrival. Please proceed to Consultation Room.`,
      type: 'appointment',
      link: `/(patient)/appointments/${apt.id}`,
    });
  };

  const filtered = appointments?.filter((a) => a.status === activeTab);

  const handleOpenPostpone = (apt: any) => {
    setSelectedApt(apt);
    setSelectedMinutes(30);
    setSelectedReason(REASON_PRESETS[0]);
    setCustomReason('');
    setPostponeModalVisible(true);
  };

  const handleConfirmPostpone = () => {
    if (!selectedApt) return;

    const oldTime = selectedApt.time || '10:30 AM';
    const newTime = addMinutesToTimeString(oldTime, selectedMinutes);
    const finalReason = customReason.trim() || selectedReason;

    // 1. Update appointment locally
    const aptStore = useAppointmentStore.getState();
    const existing = aptStore.appointments.find((a) => a.id === selectedApt.id) || selectedApt;
    const updatedApt = {
      ...existing,
      time: newTime,
      notes: finalReason ? `[Postponed: ${finalReason}] ${existing.notes || ''}` : existing.notes,
    };
    aptStore.addAppointment(updatedApt);

    // 2. Alert Patient via Notification
    useNotificationStore.getState().addNotification({
      recipientId: selectedApt.patientId || 'pat_1',
      recipientRole: 'patient',
      title: 'Appointment Rescheduled by Doctor',
      message: `${user?.name || selectedApt.doctorName || 'Your doctor'} has rescheduled your appointment to ${newTime}. Reason: ${finalReason}.`,
      type: 'appointment',
      link: `/(patient)/appointments/${selectedApt.id}`,
    });

    // 3. Confirm to Doctor
    useNotificationStore.getState().addNotification({
      recipientId: user?.id || selectedApt.doctorId || 'doc_live',
      recipientRole: 'doctor',
      title: 'Schedule Updated',
      message: `Patient ${selectedApt.patientName} was notified of postponement to ${newTime}.`,
      type: 'appointment',
      link: '/(doctor)/(tabs)/appointments',
    });

    setPostponeModalVisible(false);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3000);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-4 py-3 bg-white/95 border-b border-slate-100 shadow-sm" style={{ gap: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Appointments Schedule</Text>

        {/* Tab Filters */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {(['upcoming', 'completed', 'cancelled'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl border items-center capitalize ${
                activeTab === tab ? 'bg-[#1E58C8] border-[#1E58C8]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <Text className={`text-xs font-bold ${activeTab === tab ? 'text-white' : 'text-slate-700'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Success Notification Banner */}
      {successToast && (
        <View className="mx-4 mt-3 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex-row items-center" style={{ gap: 8 }}>
          <CheckCircle2 size={18} color="#059669" />
          <Text className="text-xs font-bold text-emerald-800 flex-1">
            Appointment rescheduled successfully. The patient has been notified.
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={handleRefresh}
            colors={['#1E58C8']}
            tintColor="#1E58C8"
          />
        }
      >
        {filtered?.length === 0 ? (
          <View className="bg-white p-8 rounded-3xl border border-slate-200 items-center justify-center mt-6" style={{ gap: 8 }}>
            <Calendar size={32} color="#94A3B8" />
            <Text className="text-sm font-black text-slate-800">No {activeTab} appointments</Text>
            <Text className="text-xs text-slate-400 text-center">
              New patient bookings for this queue will appear here in real-time.
            </Text>
          </View>
        ) : (
          filtered?.map((apt) => (
            <View
              key={apt.id}
              className="bg-white/95 p-4 rounded-2xl border border-slate-200/80 shadow-sm"
              style={{ gap: 12 }}
            >
              <View className="flex-row items-center justify-between pb-2 border-b border-slate-100">
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} color="#1E58C8" />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A' }}>
                    {apt.date} at {apt.time}
                  </Text>
                </View>
                <Badge
                  label={apt.status === 'upcoming' ? 'In-Clinic' : apt.status.toUpperCase()}
                  variant={apt.status === 'completed' ? 'teal' : apt.status === 'cancelled' ? 'danger' : 'blue'}
                  size="sm"
                />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Avatar
                  uri={apt.patientAvatar}
                  name={apt.patientName}
                  size="md"
                />
                <View className="flex-1">
                  <Text className="text-base font-black text-slate-900">{apt.patientName}</Text>
                  <Text className="text-xs text-slate-500 mt-0.5" numberOfLines={1}>
                    Symptoms: {apt.symptoms?.join(', ') || 'General OPD Evaluation'}
                  </Text>
                </View>
              </View>

              {apt.status === 'upcoming' && (
                <View style={{ gap: 6, paddingTop: 4 }}>
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => router.push(`/(doctor)/consultation/${apt.id}`)}
                      className="flex-1 bg-[#1E58C8] py-2.5 rounded-xl items-center shadow-xs"
                    >
                      <Text className="text-xs font-black text-white">Open Consultation</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleConfirmArrival(apt)}
                      className="bg-emerald-50 border border-emerald-200 py-2.5 px-3 rounded-xl flex-row items-center justify-center"
                      style={{ gap: 4 }}
                    >
                      <UserCheck size={14} color="#059669" />
                      <Text className="text-xs font-bold text-emerald-800">Confirm Arrival</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleOpenPostpone(apt)}
                      className="bg-amber-50 border border-amber-200/90 py-2.5 px-3 rounded-xl flex-row items-center justify-center"
                      style={{ gap: 4 }}
                    >
                      <Clock3 size={14} color="#D97706" />
                      <Text className="text-xs font-bold text-amber-800">Postpone</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Doctor Postpone / Reschedule Modal */}
      {selectedApt && (
        <Modal
          visible={postponeModalVisible}
          onClose={() => setPostponeModalVisible(false)}
          title="Postpone Patient Appointment"
        >
          <View style={{ gap: 14, paddingVertical: 4 }}>
            {/* Patient Header Card */}
            <View className="bg-slate-50 p-3 rounded-2xl border border-slate-200/90 flex-row items-center" style={{ gap: 10 }}>
              <Avatar uri={selectedApt.patientAvatar} name={selectedApt.patientName} size="md" />
              <View className="flex-1">
                <Text className="text-sm font-black text-slate-900">{selectedApt.patientName}</Text>
                <Text className="text-xs text-slate-500 font-medium">
                  Current Schedule: {selectedApt.date} at {selectedApt.time}
                </Text>
              </View>
            </View>

            {/* Delay Interval Picker */}
            <View style={{ gap: 6 }}>
              <Text className="text-xs font-bold text-slate-700">Add Delay to Schedule</Text>
              <View className="flex-row" style={{ gap: 6 }}>
                {POSTPONE_PRESETS.map((p) => {
                  const isSelected = selectedMinutes === p.minutes;
                  return (
                    <TouchableOpacity
                      key={p.minutes}
                      onPress={() => setSelectedMinutes(p.minutes)}
                      className={`flex-1 py-2.5 rounded-xl border items-center ${
                        isSelected ? 'bg-[#1E58C8] border-[#1E58C8]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* New Projected Time */}
            <View className="bg-blue-50 border border-blue-200/80 p-3 rounded-2xl flex-row items-center justify-between">
              <View>
                <Text className="text-[10px] font-black text-[#1E58C8] uppercase tracking-wider">
                  New Projected Slot
                </Text>
                <Text className="text-sm font-black text-slate-900 mt-0.5">
                  {addMinutesToTimeString(selectedApt.time || '10:30 AM', selectedMinutes)}
                </Text>
              </View>
              <Badge label={`+${selectedMinutes} MINS`} variant="blue" size="sm" />
            </View>

            {/* Reason Presets */}
            <View style={{ gap: 6 }}>
              <Text className="text-xs font-bold text-slate-700">Clinical Reason for Delay</Text>
              <View style={{ gap: 6 }}>
                {REASON_PRESETS.map((reason) => {
                  const isSelected = selectedReason === reason && !customReason;
                  return (
                    <TouchableOpacity
                      key={reason}
                      onPress={() => {
                        setSelectedReason(reason);
                        setCustomReason('');
                      }}
                      className={`p-2.5 rounded-xl border flex-row items-center ${
                        isSelected ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'
                      }`}
                      style={{ gap: 8 }}
                    >
                      <View
                        className={`w-3.5 h-3.5 rounded-full border ${
                          isSelected ? 'border-amber-600 bg-amber-600' : 'border-slate-400 bg-white'
                        }`}
                      />
                      <Text
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-amber-900 font-bold' : 'text-slate-600'
                        }`}
                      >
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                placeholder="Or type custom reason..."
                placeholderTextColor="#94A3B8"
                value={customReason}
                onChangeText={setCustomReason}
                style={{
                  height: 40,
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#CBD5E1',
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  fontSize: 12,
                  color: '#0F172A',
                  marginTop: 4,
                }}
              />
            </View>

            {/* Confirm Action */}
            <TouchableOpacity
              onPress={handleConfirmPostpone}
              activeOpacity={0.85}
              className="bg-amber-600 py-3.5 rounded-2xl flex-row items-center justify-center mt-2 shadow-sm"
              style={{ gap: 8 }}
            >
              <Clock3 size={16} color="#FFFFFF" />
              <Text className="text-sm font-black text-white">Confirm Delay & Alert Patient</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      )}

      {/* Patient Confirmation Animation Modal */}
      {confirmedApt && (
        <Modal
          visible={confirmModalVisible}
          onClose={() => setConfirmModalVisible(false)}
          title="Patient Arrival Confirmed"
        >
          <View style={{ gap: 16, paddingVertical: 8, alignItems: 'center' }}>
            <ConfirmationAnimation
              title="Patient Arrival Confirmed!"
              subtitle={`Patient ${confirmedApt.patientName} has been checked into the OPD priority queue.`}
              color="#10B981"
              size={68}
            />

            <View className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200" style={{ gap: 8 }}>
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-slate-500 font-bold uppercase">Queue Status</Text>
                <Badge label="IN-CLINIC READY" variant="teal" size="sm" />
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-slate-500 font-bold uppercase">Scheduled Slot</Text>
                <Text className="text-xs font-black text-slate-900">{confirmedApt.date} at {confirmedApt.time}</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-xs text-slate-500 font-bold uppercase">Symptoms</Text>
                <Text className="text-xs font-bold text-slate-700" numberOfLines={1}>
                  {confirmedApt.symptoms?.join(', ') || 'General OPD Evaluation'}
                </Text>
              </View>
            </View>

            <View className="flex-row gap-2 w-full">
              <TouchableOpacity
                onPress={() => {
                  setConfirmModalVisible(false);
                  router.push(`/(doctor)/consultation/${confirmedApt.id}`);
                }}
                activeOpacity={0.85}
                className="flex-1 bg-[#1E58C8] py-3.5 rounded-2xl items-center justify-center shadow-sm"
              >
                <Text className="text-sm font-black text-white">Open Consultation Room</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
