import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppointmentsQuery } from '@/hooks/queries/useAppointmentsQuery';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle2,
  Calendar,
  Clock,
  Building2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Activity,
  User,
  Users,
  Settings,
  Bell,
} from 'lucide-react-native';
import { Modal } from '@/components/ui/Modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { BackHandler } from 'react-native';

export default function DoctorHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: appointments } = useAppointmentsQuery(undefined, user?.id);
  const [notificationsVisible, setNotificationsVisible] = React.useState(false);

  const notifications = useNotificationStore((s) => s.notifications);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const doctorNotifications = React.useMemo(() => {
    return notifications.filter((n) => {
      if (n.recipientId && user?.id && n.recipientId !== user.id) return false;
      if (n.recipientRole && n.recipientRole !== 'all' && n.recipientRole !== 'doctor') return false;
      return true;
    });
  }, [notifications, user?.id]);

  const unreadCount = React.useMemo(() => {
    return doctorNotifications.filter((n) => !n.read).length;
  }, [doctorNotifications]);

  // Consume hardware back on doctor home so React Navigation never throws GO_BACK unhandled
  React.useEffect(() => {
    const onBackPress = () => {
      // Stay on doctor home or exit app safely
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  const nextPatient = appointments?.[0];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Doctor Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
            minWidth: 0,
            marginRight: 10,
            gap: 10,
          }}
        >
          <Avatar uri={user?.avatar} name={user?.name || 'Dr. Specialist'} size="md" />
          <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text
                style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', flexShrink: 1 }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {user?.name || 'Dr. Specialist'}
              </Text>
              <CheckCircle2 size={15} color="#00B39B" fill="#E0F7F4" style={{ flexShrink: 0 }} />
            </View>
            <Text
              style={{ fontSize: 11, fontWeight: '700', color: '#00B39B', marginTop: 1 }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {(user as any)?.specialty || 'Medical Specialist'}
            </Text>
          </View>
        </View>

        {/* Portal Tag, Notifications & Settings */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <View className="bg-blue-50 px-2 py-1 rounded-xl border border-blue-200">
            <Text className="text-[10px] font-black text-[#1E58C8] tracking-wider">PORTAL</Text>
          </View>
          <TouchableOpacity
            onPress={() => setNotificationsVisible(true)}
            activeOpacity={0.8}
            className="w-8 h-8 rounded-xl bg-slate-100 items-center justify-center border border-slate-200/80 relative"
          >
            <Bell size={16} color="#475569" />
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[16px] h-4 px-1 items-center justify-center">
                <Text className="text-[9px] font-black text-white">{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(doctor)/settings')}
            activeOpacity={0.8}
            className="w-8 h-8 rounded-xl bg-slate-100 items-center justify-center border border-slate-200/80"
          >
            <Settings size={16} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Status Banner */}
        <View className="bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200/90 flex-row items-center justify-between shadow-sm">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              flex: 1,
              minWidth: 0,
              marginRight: 8,
              gap: 10,
            }}
          >
            <View className="bg-[#1E58C8] p-2 rounded-xl" style={{ flexShrink: 0 }}>
              <ShieldCheck size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text className="text-xs font-black text-slate-900" numberOfLines={1}>
                NMC / State Council Verified Practitioner
              </Text>
              <Text className="text-[11px] text-slate-600 font-medium mt-0.5" numberOfLines={1}>
                Reg: {(user as any)?.registrationNumber || (user as any)?.mciNumber || 'NMC-2024-DOC'} • Active for Consultations
              </Text>
            </View>
          </View>
          <View style={{ flexShrink: 0 }}>
            <Badge label="ACTIVE" variant="blue" size="sm" />
          </View>
        </View>

        {/* Daily Queue Stats Strip */}
        <View className="flex-row items-center bg-white py-3.5 px-2 rounded-2xl border border-slate-200/80 shadow-sm">
          <View className="flex-1 items-center justify-center">
            <Text className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
              Total Today
            </Text>
            <Text className="text-lg font-black text-slate-900 mt-0.5" numberOfLines={1}>
              {appointments?.length ? `${appointments.length}` : '2'}
            </Text>
          </View>
          <View className="w-px h-7 bg-slate-200" />
          <View className="flex-1 items-center justify-center">
            <Text className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
              Completed
            </Text>
            <Text className="text-lg font-black text-emerald-600 mt-0.5" numberOfLines={1}>
              3
            </Text>
          </View>
          <View className="w-px h-7 bg-slate-200" />
          <View className="flex-1 items-center justify-center">
            <Text className="text-[10px] text-slate-400 font-black uppercase tracking-wider">
              Next Slot
            </Text>
            <Text className="text-sm font-black text-[#1E58C8] mt-0.5" numberOfLines={1}>
              {nextPatient?.time || '10:30 AM'}
            </Text>
          </View>
        </View>

        {/* Next Patient Card */}
        {nextPatient ? (
          <View className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm" style={{ gap: 12 }}>
            <View className="flex-row justify-between items-center pb-2.5 border-b border-slate-100">
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  flex: 1,
                  minWidth: 0,
                  marginRight: 8,
                  gap: 6,
                }}
              >
                <Clock size={15} color="#1E58C8" style={{ flexShrink: 0 }} />
                <Text
                  className="text-xs font-black text-slate-900 uppercase tracking-wide flex-1"
                  numberOfLines={1}
                >
                  Next Patient in Queue
                </Text>
              </View>
              <View style={{ flexShrink: 0 }}>
                <Badge label={nextPatient.time || '10:30 AM'} variant="teal" size="sm" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar
                uri={nextPatient.patientAvatar}
                name={nextPatient.patientName || 'Patient'}
                size="md"
              />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text className="text-base font-black text-slate-900" numberOfLines={1}>
                  {nextPatient.patientName || 'Patient'}
                </Text>
                <Text className="text-xs text-slate-500 font-medium mt-0.5" numberOfLines={1}>
                  In-Clinic Consultation • OPD Slot
                </Text>
              </View>
            </View>

            <View className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Chief Reported Symptoms
              </Text>
              <Text className="text-xs font-bold text-slate-800" numberOfLines={2}>
                {nextPatient.symptoms?.join(' • ') || 'General Consultation'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push(`/(doctor)/consultation/${nextPatient.id}`)}
              activeOpacity={0.85}
              className="bg-[#1E58C8] py-3 px-4 rounded-xl flex-row justify-center items-center shadow-sm"
              style={{ gap: 8 }}
            >
              <Sparkles size={16} color="#FFFFFF" style={{ flexShrink: 0 }} />
              <Text className="text-xs font-black text-white" numberOfLines={1}>
                Launch In-Clinic Consultation Workspace
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="bg-white p-5 rounded-2xl border border-slate-200/80 items-center justify-center shadow-sm">
            <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mb-2">
              <Clock size={20} color="#94A3B8" />
            </View>
            <Text className="text-sm font-extrabold text-slate-800">No Patients in Waiting Queue</Text>
            <Text className="text-xs text-slate-400 text-center mt-1">
              New patient bookings will automatically appear here in your live queue.
            </Text>
          </View>
        )}

        {/* Live OPD Queue Timeline (Indian Clinic Queue) */}
        <View style={{ gap: 10 }}>
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Clock size={16} color="#1E58C8" />
              <Text className="text-sm font-black text-slate-900 uppercase tracking-wide">
                Today's OPD Queue Timeline
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(doctor)/(tabs)/appointments')}>
              <Text className="text-xs font-bold text-[#1E58C8]">View All →</Text>
            </TouchableOpacity>
          </View>

          {/* Timeline Nodes */}
          <View className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm" style={{ gap: 10 }}>
            {appointments && appointments.length > 0 ? (
              appointments.map((apt, idx) => (
                <View
                  key={apt.id || idx}
                  className={`p-3 rounded-2xl border flex-row items-center justify-between ${
                    idx === 0
                      ? 'bg-blue-50/80 border-[#1E58C8]'
                      : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <View style={{ gap: 2, flex: 1, marginRight: 8 }}>
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Text className="text-xs font-black text-[#1E58C8]">Token #{String(idx + 1).padStart(2, '0')}</Text>
                      <Text className="text-[11px] text-slate-400 font-bold">• {apt.time}</Text>
                    </View>
                    <Text className="text-sm font-black text-slate-900" numberOfLines={1}>
                      {apt.patientName || 'Patient'}
                    </Text>
                    <Text className="text-[11px] text-slate-500" numberOfLines={1}>
                      {apt.symptoms?.join(', ') || 'General OPD Examination'}
                    </Text>
                  </View>

                  <View className="items-end" style={{ gap: 6 }}>
                    <Badge label={apt.status.toUpperCase()} variant={idx === 0 ? 'blue' : 'slate'} size="sm" />
                    {idx === 0 ? (
                      <TouchableOpacity
                        onPress={() => router.push(`/(doctor)/consultation/${apt.id}`)}
                        className="bg-[#1E58C8] px-3 py-1 rounded-lg"
                      >
                        <Text className="text-[11px] font-bold text-white">Consult</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text className="text-[10px] text-slate-400 font-medium">OPD Room</Text>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View className="py-4 items-center justify-center">
                <Text className="text-xs font-bold text-slate-400">
                  No appointments currently queued for today
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Clinical Suite Shortcuts */}
        <View style={{ gap: 10 }}>
          <Text className="text-sm font-black text-slate-900">Clinical Suite</Text>

          <TouchableOpacity
            onPress={() => router.push(`/(doctor)/consultation/${nextPatient?.id || 'apt_live'}`)}
            activeOpacity={0.85}
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex-row items-center justify-between shadow-sm"
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
                minWidth: 0,
                marginRight: 8,
                gap: 10,
              }}
            >
              <View
                className="bg-teal-50 p-2 rounded-xl border border-teal-100"
                style={{ flexShrink: 0 }}
              >
                <Activity size={18} color="#00B39B" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text className="text-xs font-black text-slate-900" numberOfLines={1}>
                  3D Body Region Visualizer
                </Text>
                <Text
                  className="text-[11px] text-slate-500 font-medium mt-0.5"
                  numberOfLines={1}
                >
                  Interactive pain & symptom annotation
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(doctor)/(tabs)/appointments')}
            activeOpacity={0.85}
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex-row items-center justify-between shadow-sm"
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flex: 1,
                minWidth: 0,
                marginRight: 8,
                gap: 10,
              }}
            >
              <View
                className="bg-blue-50 p-2 rounded-xl border border-blue-100"
                style={{ flexShrink: 0 }}
              >
                <Calendar size={18} color="#1E58C8" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text className="text-xs font-black text-slate-900" numberOfLines={1}>
                  Patient Queue & Schedule
                </Text>
                <Text
                  className="text-[11px] text-slate-500 font-medium mt-0.5"
                  numberOfLines={1}
                >
                  View full roster & in-clinic bookings
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Doctor Notifications Modal */}
      <Modal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
        title="Doctor Alerts & Activity"
      >
        <View style={{ gap: 12, paddingVertical: 4 }}>
          <View className="flex-row justify-between items-center pb-2 border-b border-slate-100">
            <Text className="text-xs font-bold text-slate-500">
              {doctorNotifications.length} Alert(s)
            </Text>
            {doctorNotifications.length > 0 && (
              <TouchableOpacity
                onPress={() => markAllAsRead(user?.id, 'doctor')}
                activeOpacity={0.8}
              >
                <Text className="text-xs font-bold text-[#1E58C8]">Mark all as read</Text>
              </TouchableOpacity>
            )}
          </View>

          {doctorNotifications.length === 0 ? (
            <View className="py-8 items-center justify-center" style={{ gap: 6 }}>
              <Bell size={28} color="#94A3B8" />
              <Text className="text-sm font-black text-slate-800">All Caught Up!</Text>
              <Text className="text-xs text-slate-400 text-center px-4">
                You'll receive instant alerts here whenever a patient books or cancels an appointment.
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 8 }}>
                {doctorNotifications.map((notif) => (
                  <TouchableOpacity
                    key={notif.id}
                    onPress={() => {
                      if (notif.link) {
                        setNotificationsVisible(false);
                        router.push(notif.link as any);
                      }
                    }}
                    activeOpacity={0.85}
                    className={`p-3 rounded-2xl border ${
                      notif.read ? 'bg-white border-slate-200' : 'bg-blue-50/70 border-blue-200'
                    }`}
                    style={{ gap: 4 }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-xs font-black text-slate-900 flex-1 mr-2" numberOfLines={1}>
                        {notif.title}
                      </Text>
                      <Text className="text-[10px] text-slate-400">{notif.time}</Text>
                    </View>
                    <Text className="text-[11px] text-slate-600 leading-4">
                      {notif.message}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
