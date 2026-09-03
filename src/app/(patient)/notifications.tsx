import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotificationItem } from '@/types/index';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Bell, Calendar, Pill, ShieldCheck, CheckCheck, ChevronRight } from 'lucide-react-native';

export default function PatientNotificationsScreen() {
  const router = useRouter();
  const [items, setItems] = React.useState<NotificationItem[]>();

  const markAllRead = () => {
    setItems(items?.map((n) => ({ ...n, read: true })));
  };

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

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="px-5 py-3 bg-white border-b border-slate-100 shadow-sm flex-row items-center justify-between">
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
            <ArrowLeft size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-xl font-black text-slate-900">Notifications Center</Text>
        </View>

        <TouchableOpacity onPress={markAllRead} className="flex-row items-center space-x-1">
          <CheckCheck size={16} color="#00B39B" />
          <Text className="text-xs font-bold text-[#00B39B]">Mark All Read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerClassName="p-5 space-y-3">
        {items?.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => {
              setItems(items?.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
              if (item.link) router.push(item.link as any);
            }}
            activeOpacity={0.88}
            className={`p-4 rounded-3xl border flex-row items-start space-x-3.5 ${
              item.read
                ? 'bg-white border-slate-100 shadow-sm'
                : 'bg-teal-50/60 border-teal-200 shadow-sm'
            }`}
          >
            <View className="p-2.5 bg-slate-100 rounded-2xl border border-slate-200">
              {getIcon(item.type)}
            </View>

            <View className="flex-1">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm font-bold text-slate-900 flex-1 mr-2" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text className="text-[10px] text-slate-400 font-medium">{item.timestamp}</Text>
              </View>
              <Text className="text-xs text-slate-600 mt-1 leading-4">{item.message}</Text>
            </View>

            {!item.read && <View className="w-2.5 h-2.5 rounded-full bg-[#00B39B] self-center" />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
