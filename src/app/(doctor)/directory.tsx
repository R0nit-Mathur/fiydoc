import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Patient } from '@/types/index';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Search, UserCheck, AlertCircle, Phone, Mail, ChevronRight, Activity } from 'lucide-react-native';

export default function PatientDirectoryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const [patients, setPatients] = useState<Patient[]>([]);
  const filtered = patients.filter(
    (p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-4 py-3 bg-white/95 border-b border-slate-100 shadow-sm" style={{ gap: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Patient Directory</Text>
        <Input
          placeholder="Search patient by name, mobile, or ID..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color="#94A3B8" />}
        />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 12 }}>
        {filtered.map((pat) => (
          <TouchableOpacity
            key={pat.id}
            onPress={() => setSelectedPatient(pat)}
            activeOpacity={0.88}
            className="bg-white/95 p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex-row items-center justify-between"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 8, gap: 10 }}>
              <Avatar uri={pat.avatar} name={pat.name} size="md" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                  {pat.name}
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 1 }} numberOfLines={1}>
                  {pat.gender} • {pat.age} Yrs • Blood: {pat.bloodGroup}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#00B39B', marginTop: 1 }} numberOfLines={1}>
                  Allergies: {(pat.allergies || []).join(', ')}
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Patient Profile Detail Modal */}
      <Modal
        visible={Boolean(selectedPatient)}
        onClose={() => setSelectedPatient(null)}
        title="Patient Medical Profile"
      >
        {selectedPatient && (
          <View style={{ gap: 16, paddingVertical: 8 }}>
            <View className="flex-row items-center bg-slate-50 p-3.5 rounded-2xl border border-slate-100" style={{ gap: 12 }}>
              <Image
                source={{ uri: selectedPatient.avatar }}
                className="w-14 h-14 rounded-2xl bg-slate-200"
              />
              <View className="flex-1">
                <Text className="text-lg font-black text-slate-900">{selectedPatient.name}</Text>
                <Text className="text-xs text-slate-500">{selectedPatient.email}</Text>
                <Text className="text-xs font-bold text-[#1E58C8]">{selectedPatient.phone}</Text>
              </View>
            </View>

            <View className="flex-row justify-around bg-teal-50 p-3 rounded-2xl border border-teal-100">
              <View className="items-center">
                <Text className="text-[10px] text-slate-400 font-medium">Age</Text>
                <Text className="text-sm font-bold text-slate-900">{selectedPatient.age} Yrs</Text>
              </View>
              <View className="w-px h-6 bg-teal-200 self-center" />
              <View className="items-center">
                <Text className="text-[10px] text-slate-400 font-medium">Blood Group</Text>
                <Text className="text-sm font-black text-[#00B39B]">{selectedPatient.bloodGroup}</Text>
              </View>
              <View className="w-px h-6 bg-teal-200 self-center" />
              <View className="items-center">
                <Text className="text-[10px] text-slate-400 font-medium">Gender</Text>
                <Text className="text-sm font-bold text-slate-900">{selectedPatient.gender}</Text>
              </View>
            </View>

            <View className="bg-red-50 p-3.5 rounded-2xl border border-red-100">
              <Text className="text-xs font-bold text-red-800 uppercase tracking-wider mb-1">
                Allergy Warnings
              </Text>
              <Text className="text-xs text-red-700 font-semibold">
                {(selectedPatient.allergies || []).join(' • ')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                const pId = selectedPatient.id;
                setSelectedPatient(null);
                router.push(`/(doctor)/consultation/apt_101`);
              }}
              className="bg-[#1E58C8] py-3.5 px-4 rounded-2xl items-center"
            >
              <Text className="text-sm font-bold text-white">Start New Clinical Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}
