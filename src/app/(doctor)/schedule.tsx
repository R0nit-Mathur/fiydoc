import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Calendar, Clock, CheckCircle2, Save } from 'lucide-react-native';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DoctorScheduleScreen() {
  const router = useRouter();
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [fee, setFee] = useState('750');
  const [onlineEnabled, setOnlineEnabled] = useState(true);
  const [inPersonEnabled, setInPersonEnabled] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSaveSchedule = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <SafeAreaView className="flex-1 bg-white justify-between">
      <View>
        <View className="px-4 py-3 border-b border-slate-100 shadow-sm">
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Availability & Slots</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          {savedToast && (
            <View className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex-row items-center" style={{ gap: 8 }}>
              <CheckCircle2 size={16} color="#10B981" />
              <Text className="text-xs font-bold text-emerald-800">Weekly Slot Schedule Updated!</Text>
            </View>
          )}

          {/* Working Days Selector */}
          <View>
            <Text className="text-sm font-bold text-slate-900 mb-2">Available Consultation Days</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {DAYS.map((d) => {
                const active = selectedDays.includes(d);
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => toggleDay(d)}
                    className={`flex-1 py-2.5 rounded-xl border items-center ${
                      active ? 'bg-[#1E58C8] border-[#1E58C8]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: active ? '#FFFFFF' : '#334155' }}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Modes Switcher */}
          <View className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-3">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consultation Channels</Text>

            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-bold text-slate-900">Enable Telehealth Video Slots</Text>
              <Switch value={onlineEnabled} onValueChange={setOnlineEnabled} trackColor={{ true: '#00B39B' }} />
            </View>

            <View className="flex-row justify-between items-center pt-2 border-t border-slate-200">
              <Text className="text-sm font-bold text-slate-900">Enable In-Clinic Hospital Visits</Text>
              <Switch value={inPersonEnabled} onValueChange={setInPersonEnabled} trackColor={{ true: '#1E58C8' }} />
            </View>
          </View>

          {/* Fee Configurator */}
          <Input
            label="Base Consultation Fee (₹)"
            value={fee}
            onChangeText={setFee}
            keyboardType="number-pad"
          />
        </ScrollView>
      </View>

      <View className="p-4 bg-white border-t border-slate-100">
        <Button
          title="Save Availability Settings"
          onPress={handleSaveSchedule}
          variant="primary"
          size="lg"
          icon={<Save size={20} color="#FFFFFF" />}
        />
      </View>
    </SafeAreaView>
  );
}
