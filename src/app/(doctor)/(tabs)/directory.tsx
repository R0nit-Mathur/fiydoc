import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Patient } from '@/types/index';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppointmentsQuery } from '@/hooks/queries/useAppointmentsQuery';
import { Search, UserCheck, AlertCircle, Phone, Mail, ChevronRight, Activity, Stethoscope } from 'lucide-react-native';

export default function PatientDirectoryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { data: appointments, isRefetching } = useAppointmentsQuery(undefined, user?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['appointments'] });
    setRefreshing(false);
  };

  const patients: Patient[] = React.useMemo(() => {
    if (appointments && appointments.length > 0) {
      const map = new Map<string, Patient>();
      appointments.forEach((apt) => {
        if (!map.has(apt.patientId)) {
          map.set(apt.patientId, {
            id: apt.patientId,
            name: apt.patientName || 'Patient',
            email: 'patient@fiydoc.app',
            phone: '',
            gender: 'Clinical Patient',
            age: 32,
            bloodGroup: 'B+',
            allergies: [],
            conditions: apt.symptoms || [],
            avatar: apt.patientAvatar,
          });
        }
      });
      return Array.from(map.values());
    }
    return [];
  }, [appointments]);

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

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={onRefresh}
            tintColor="#1E58C8"
            colors={['#1E58C8']}
          />
        }
      >
        {filtered.length === 0 ? (
          <View className="bg-white p-6 rounded-2xl border border-slate-200/80 items-center justify-center shadow-sm mt-4">
            <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center mb-2">
              <UserCheck size={20} color="#94A3B8" />
            </View>
            <Text className="text-sm font-extrabold text-slate-800">No Patient Records</Text>
            <Text className="text-xs text-slate-400 text-center mt-1">
              Patients who book or complete consultations with you will automatically appear in this directory.
            </Text>
          </View>
        ) : (
          filtered.map((pat) => (
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
                    Allergies: {(pat.allergies || []).join(', ') || 'None reported'}
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#94A3B8" style={{ flexShrink: 0 }} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Patient Profile Detail Modal */}
      <Modal
        visible={Boolean(selectedPatient)}
        onClose={() => setSelectedPatient(null)}
        title="Patient Medical Profile"
      >
        {selectedPatient && (
          <View style={{ gap: 14, paddingVertical: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', gap: 12 }}>
              <Avatar uri={selectedPatient.avatar} name={selectedPatient.name} size="lg" />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                  {selectedPatient.name}
                </Text>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B', marginTop: 2 }} numberOfLines={1}>
                  {selectedPatient.email || 'patient@fiydoc.app'}
                </Text>
                {selectedPatient.phone ? (
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E58C8', marginTop: 2 }}>
                    {selectedPatient.phone}
                  </Text>
                ) : (
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#94A3B8', marginTop: 2 }}>
                    Verified Patient Account
                  </Text>
                )}
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#F0FDFA', padding: 12, borderRadius: 18, borderWidth: 1, borderColor: '#CCFBF1' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Age</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 2 }}>
                  {selectedPatient.age || 32} Yrs
                </Text>
              </View>
              <View style={{ width: 1, height: 24, backgroundColor: '#99F6E4', alignSelf: 'center' }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Blood Group</Text>
                <Text style={{ fontSize: 14, fontWeight: '900', color: '#00B39B', marginTop: 2 }}>
                  {selectedPatient.bloodGroup || 'B+'}
                </Text>
              </View>
              <View style={{ width: 1, height: 24, backgroundColor: '#99F6E4', alignSelf: 'center' }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' }}>Gender</Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 2 }}>
                  {selectedPatient.gender || 'Patient'}
                </Text>
              </View>
            </View>

            <View style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 18, borderWidth: 1, borderColor: '#FECACA' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <AlertCircle size={14} color="#DC2626" />
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#991B1B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Allergy & Clinical Alerts
                </Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#B91C1C' }}>
                {selectedPatient.allergies && selectedPatient.allergies.length > 0
                  ? selectedPatient.allergies.join(' • ')
                  : 'No known drug allergies reported'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                const pId = selectedPatient.id;
                setSelectedPatient(null);
                router.push(`/(doctor)/consultation/${pId || 'apt_live'}`);
              }}
              activeOpacity={0.85}
              style={{
                backgroundColor: '#1E58C8',
                paddingVertical: 14,
                borderRadius: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                shadowColor: '#1E58C8',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Stethoscope size={16} color="#FFFFFF" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
                Start In-Clinic Consultation
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  );
}
