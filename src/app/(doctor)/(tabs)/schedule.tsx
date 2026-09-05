import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Save,
  Building2,
  Video,
  Users,
  ShieldCheck,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react-native';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function DoctorScheduleScreen() {
  const router = useRouter();
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
  const [fee, setFee] = useState('750');
  const [morningStart, setMorningStart] = useState('09:30 AM');
  const [morningEnd, setMorningEnd] = useState('01:30 PM');
  const [eveningStart, setEveningStart] = useState('05:00 PM');
  const [eveningEnd, setEveningEnd] = useState('08:30 PM');
  const [slotDuration, setSlotDuration] = useState<'15' | '20' | '30'>('20');
  const [walkinEnabled, setWalkinEnabled] = useState(true);
  const [onlineEnabled, setOnlineEnabled] = useState(true);
  const [inPersonEnabled, setInPersonEnabled] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== day));
      }
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSaveSchedule = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 justify-between" edges={['top']}>
      {/* Header Bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>
          OPD Schedule & Token Timeline
        </Text>
        <Text className="text-xs text-slate-500 mt-0.5">
          Configure daily clinic sessions, token caps, and patient queue intervals.
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {savedToast && (
          <View className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 flex-row items-center" style={{ gap: 8 }}>
            <CheckCircle2 size={18} color="#10B981" />
            <View>
              <Text className="text-xs font-bold text-emerald-800">Weekly OPD Timetable Updated!</Text>
              <Text className="text-[11px] text-emerald-600">New slot intervals and token caps are active.</Text>
            </View>
          </View>
        )}

        {/* Working Days Selector */}
        <View className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm" style={{ gap: 10 }}>
          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-black text-slate-900">Weekly Consultation Days</Text>
            <Badge label={`${selectedDays.length} Days Active`} variant="teal" size="sm" />
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
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
                  <Text style={{ fontSize: 11, fontWeight: '800', color: active ? '#FFFFFF' : '#475569' }}>
                    {d}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* OPD Shift Timings (Morning & Evening Sessions) */}
        <View className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm" style={{ gap: 14 }}>
          <Text className="text-sm font-black text-slate-900">Daily OPD Shift Timetable</Text>

          {/* Morning Shift */}
          <View className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200" style={{ gap: 10 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Sun size={16} color="#D97706" />
                <Text className="text-xs font-black text-amber-900 uppercase tracking-wider">
                  Morning OPD Session
                </Text>
              </View>
              <Badge label="15 TOKENS" variant="warning" size="sm" />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Session Start"
                  value={morningStart}
                  onChangeText={setMorningStart}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Session End"
                  value={morningEnd}
                  onChangeText={setMorningEnd}
                />
              </View>
            </View>
          </View>

          {/* Evening Shift */}
          <View className="bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200" style={{ gap: 10 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Moon size={16} color="#1E58C8" />
                <Text className="text-xs font-black text-[#1E58C8] uppercase tracking-wider">
                  Evening OPD Session
                </Text>
              </View>
              <Badge label="12 TOKENS" variant="blue" size="sm" />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Session Start"
                  value={eveningStart}
                  onChangeText={setEveningStart}
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Session End"
                  value={eveningEnd}
                  onChangeText={setEveningEnd}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Slot Duration & Token Pace */}
        <View className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm" style={{ gap: 10 }}>
          <Text className="text-sm font-black text-slate-900">Per-Patient Consultation Window</Text>
          <Text className="text-xs text-slate-500">
            Select estimated consultation pacing for automatic token timing calculations.
          </Text>

          <View className="flex-row gap-2 pt-1">
            {[
              { id: '15', label: '15 Minutes (Fast Queue)' },
              { id: '20', label: '20 Minutes (Standard)' },
              { id: '30', label: '30 Minutes (Detailed)' },
            ].map((slot) => {
              const active = slotDuration === slot.id;
              return (
                <TouchableOpacity
                  key={slot.id}
                  onPress={() => setSlotDuration(slot.id as any)}
                  activeOpacity={0.8}
                  className={`flex-1 py-2.5 px-2 rounded-xl border items-center justify-center ${
                    active ? 'bg-[#1E58C8] border-[#1E58C8]' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '800',
                      color: active ? '#FFFFFF' : '#334155',
                      textAlign: 'center',
                    }}
                  >
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Consultation Channels & Walk-in Toggles */}
        <View className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm" style={{ gap: 12 }}>
          <Text className="text-sm font-black text-slate-900">Clinical Channel Preferences</Text>

          <View className="flex-row justify-between items-center py-1">
            <View className="flex-1 mr-3">
              <Text className="text-xs font-bold text-slate-900">In-Clinic Hospital Visits</Text>
              <Text className="text-[11px] text-slate-500">Enable patient in-person OPD appointments</Text>
            </View>
            <Switch value={inPersonEnabled} onValueChange={setInPersonEnabled} trackColor={{ true: '#1E58C8' }} />
          </View>

          <View className="flex-row justify-between items-center py-1 border-t border-slate-100">
            <View className="flex-1 mr-3">
              <Text className="text-xs font-bold text-slate-900">Telehealth Video Calls</Text>
              <Text className="text-[11px] text-slate-500">Enable remote video consultation slots</Text>
            </View>
            <Switch value={onlineEnabled} onValueChange={setOnlineEnabled} trackColor={{ true: '#00B39B' }} />
          </View>

          <View className="flex-row justify-between items-center py-1 border-t border-slate-100">
            <View className="flex-1 mr-3">
              <Text className="text-xs font-bold text-slate-900">Walk-In OPD Token Desk</Text>
              <Text className="text-[11px] text-slate-500">Allow clinic reception to issue on-spot tokens</Text>
            </View>
            <Switch value={walkinEnabled} onValueChange={setWalkinEnabled} trackColor={{ true: '#1E58C8' }} />
          </View>
        </View>

        {/* Consultation OPD Fee */}
        <View className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm" style={{ gap: 8 }}>
          <Text className="text-sm font-black text-slate-900">OPD Consultation Fee (₹)</Text>
          <Input
            value={fee}
            onChangeText={setFee}
            keyboardType="number-pad"
            placeholder="750"
          />
          <Text className="text-[11px] text-slate-400">
            Displayed to patients during booking and shown on official digital receipts.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Save */}
      <View className="p-4 bg-white border-t border-slate-100 shadow-md">
        <Button
          title="Save OPD Schedule & Slots"
          onPress={handleSaveSchedule}
          variant="primary"
          size="lg"
          icon={<Save size={18} color="#FFFFFF" />}
        />
      </View>
    </SafeAreaView>
  );
}
