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
        <View className="px-5 py-3 border-b border-slate-100 shadow-sm">
          <Text className="text-xl font-black text-slate-900">Availability & Slots</Text>
        </View>

        <ScrollView contentContainerClassName="p-5 space-y-5">
          {savedToast && (
            <View className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 flex-row items-center space-x-2">
              <CheckCircle2 size={18} color="#10B981" />
              <Text className="text-xs font-bold text-emerald-800">Weekly Slot Schedule Updated!</Text>
            </View>
          )}

          {/* Working Days Selector */}
          <View>
            <Text className="text-base font-bold text-slate-900 mb-2">Available Consultation Days</Text>
            <View className="flex-row justify-between space-x-1">
              {DAYS.map((d) => {
                const active = selectedDays.includes(d);
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => toggleDay(d)}
                    className={`flex-1 py-3 rounded-xl border items-center ${
                      active ? 'bg-[#1E58C8] border-[#1E58C8]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${active ? 'text-white' : 'text-slate-700'}`}>
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
