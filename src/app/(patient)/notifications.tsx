import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationStore } from '@/store/useNotificationStore';
import { NotificationItem } from '@/types/index';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Bell,
  Calendar,
  Pill,
  ShieldCheck,
  CheckCheck,
  ChevronRight,
  Sparkles,
  Inbox,
} from 'lucide-react-native';

import { useAuthStore } from '@/store/useAuthStore';

export default function PatientNotificationsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const patientNotifications = React.useMemo(() => {
    return notifications.filter((n) => {
      if (n.recipientId && user?.id && n.recipientId !== user.id) return false;
      if (n.recipientRole && n.recipientRole !== 'all' && n.recipientRole !== 'patient') return false;
      return true;
    });
  }, [notifications, user?.id]);

  const unreadCount = React.useMemo(() => {
    return patientNotifications.filter((n) => !n.read).length;
  }, [patientNotifications]);

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'appointment':
        return <Calendar size={18} color="#1E58C8" />;
      case 'prescription':
      case 'pharmacy':
        return <Pill size={18} color="#00B39B" />;
      case 'verification':
        return <ShieldCheck size={18} color="#10B981" />;
      default:
        return <Bell size={18} color="#8B5CF6" />;
    }
  };

  const handleNotificationPress = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.type === 'prescription' || item.link === '/(patient)/health' || item.link === '/(patient)/(tabs)/health') {
      router.push('/(patient)/(tabs)/health');
    } else if (item.link) {
      router.push(item.link as any);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header Bar */}
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
        <View className="flex-row items-center" style={{ gap: 10 }}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} className="p-1 -ml-1">
            <ArrowLeft size={22} color="#0F172A" />
          </TouchableOpacity>
          <View>
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>
              Notifications & Alerts
            </Text>
            {unreadCount > 0 && (
              <Text className="text-[11px] font-bold text-[#00B39B]">
                {unreadCount} unread update{unreadCount > 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => markAllAsRead(user?.id, 'patient')}
            activeOpacity={0.75}
            className="flex-row items-center bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200"
            style={{ gap: 4 }}
          >
            <CheckCheck size={15} color="#00B39B" />
            <Text className="text-xs font-bold text-[#00B39B]">Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {patientNotifications.length === 0 ? (
          <View className="py-20 items-center justify-center" style={{ gap: 12 }}>
            <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center border border-slate-200">
              <Inbox size={32} color="#94A3B8" />
            </View>
            <Text className="text-base font-black text-slate-800">No Notifications Yet</Text>
            <Text className="text-xs text-slate-400 text-center max-w-[240px]">
              You will receive instant alerts here when doctors issue prescriptions or confirm appointments.
            </Text>
          </View>
        ) : (
          patientNotifications.map((item) => {
            const isPrescription = item.type === 'prescription';
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.85}
                className={`p-4 rounded-3xl border ${
                  item.read
                    ? 'bg-white border-slate-200/90 shadow-sm'
                    : isPrescription
                    ? 'bg-teal-50/70 border-[#00B39B] shadow-sm'
                    : 'bg-blue-50/70 border-blue-200 shadow-sm'
                }`}
                style={{ gap: 10 }}
              >
                <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, gap: 8 }}>
                    <View
                      className={`w-9 h-9 rounded-2xl items-center justify-center border ${
                        isPrescription
                          ? 'bg-teal-100/70 border-teal-200'
                          : 'bg-slate-100 border-slate-200'
                      }`}
                      style={{ flexShrink: 0 }}
                    >
                      {getIcon(item.type)}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        className="text-xs font-black text-slate-900"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.title}
                      </Text>
                      <Text className="text-[10px] text-slate-400 font-medium">
                        {item.time || item.timestamp || 'Today'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0, gap: 6 }}>
                    {isPrescription && (
                      <Badge label="DIGITAL RX" variant="teal" size="sm" />
                    )}
                    {!item.read && (
                      <View className="w-2.5 h-2.5 rounded-full bg-[#00B39B]" />
                    )}
                  </View>
                </View>

                <Text className="text-xs text-slate-600 leading-5">
                  {item.message}
                </Text>

                <View className="flex-row justify-between items-center pt-2 border-t border-slate-100">
                  <Text className="text-[11px] font-bold text-[#1E58C8]">
                    {isPrescription ? 'View Prescription & Medicines →' : 'View Details →'}
                  </Text>
                  <ChevronRight size={14} color="#94A3B8" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
