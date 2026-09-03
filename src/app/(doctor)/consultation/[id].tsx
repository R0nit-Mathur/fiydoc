import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppointmentDetailQuery } from '@/hooks/queries/useAppointmentsQuery';
import { BodyRegion3D } from '@/components/doctor/BodyRegion3D';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ArrowLeft,
  Stethoscope,
  Pill,
  Activity,
  FileCheck,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  FileText,
} from 'lucide-react-native';

export default function DoctorConsultationWorkspaceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: apt } = useAppointmentDetailQuery(id as string);

  // SOAP Clinical State
  const [subjective, setSubjective] = useState('Patient reports tightness in chest and occasional breathlessness after walking 2 flights of stairs.');
  const [objective, setObjective] = useState('BP: 130/84 mmHg, HR: 76 bpm, SpO2: 98% on room air. Normal S1 S2 heard.');
  const [assessment, setAssessment] = useState('Atypical Angina / Exertional Chest Discomfort.');
  
  // Smart Rx Medications Builder State
  const [meds, setMeds] = useState([
    { name: 'Telmikind-40', dosage: '1 tablet daily', frequency: 'Morning after breakfast', duration: '30 Days' },
    { name: 'Pan-D Capsule', dosage: '1 capsule daily', frequency: 'Empty stomach 30m before breakfast', duration: '14 Days' },
  ]);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');

  // Generated Prescription Modal
  const [showIssuedModal, setShowIssuedModal] = useState(false);

  const addMedication = () => {
    if (!newMedName) return;
    setMeds([...meds, { name: newMedName, dosage: newMedDosage || '1 tablet daily', frequency: 'After food', duration: '15 Days' }]);
    setNewMedName('');
    setNewMedDosage('');
  };

  const removeMedication = (idx: number) => {
    setMeds(meds.filter((_, i) => i !== idx));
  };

  const handleIssuePrescription = () => {
    setShowIssuedModal(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white justify-between">
      <View>
        <View className="px-5 py-3 flex-row items-center justify-between border-b border-slate-100">
          <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
            <ArrowLeft size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-base font-bold text-slate-900">Clinical Consultation Workspace</Text>
          <View className="w-6" />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60, gap: 20 }} showsVerticalScrollIndicator={false}>
          {/* Patient Quick Info Header */}
          <View className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex-row items-center" style={{ gap: 14 }}>
            <Avatar
              uri={apt?.patientAvatar}
              name={apt?.patientName || 'Aarav Mehta'}
              size="lg"
            />
            <View className="flex-1">
              <Text className="text-base font-black text-slate-900">{apt?.patientName || 'Aarav Mehta'}</Text>
              <Text className="text-xs text-slate-500">Age: 32 • Gender: Male • Blood: O+</Text>
              <Text className="text-[11px] font-bold text-red-600 mt-0.5">Allergies: Penicillin, Dust Mites</Text>
            </View>
          </View>

          {/* 3D Anatomical Region Annotator Component */}
          <BodyRegion3D />

          {/* SOAP Clinical Notes Section */}
          <View style={{ gap: 14 }}>
            <Text className="text-base font-extrabold text-slate-900">SOAP Clinical Evaluation</Text>

            <Input
              label="Subjective (Chief Complaints)"
              value={subjective}
              onChangeText={setSubjective}
              multiline
              numberOfLines={2}
            />

            <Input
              label="Objective (Vitals & Clinical Examination)"
              value={objective}
              onChangeText={setObjective}
              multiline
              numberOfLines={2}
            />

            <Input
              label="Assessment & Clinical Diagnosis"
              value={assessment}
              onChangeText={setAssessment}
            />
          </View>

          {/* Smart Prescription Builder */}
          <View style={{ gap: 14 }}>
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-extrabold text-slate-900">Smart Prescription Builder (Rx)</Text>
              <Badge label={`${meds.length} Medicines`} variant="blue" size="sm" />
            </View>

            <View style={{ gap: 8 }}>
              {meds.map((m, idx) => (
                <View
                  key={idx}
                  className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-extrabold text-slate-900">{m.name}</Text>
                    <Text className="text-xs font-semibold text-[#00B39B]">{m.dosage} • {m.frequency}</Text>
                    <Text className="text-[10px] text-slate-400">Duration: {m.duration}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeMedication(idx)} className="p-2">
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Quick Add Form */}
            <View className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100" style={{ gap: 10 }}>
              <Text className="text-xs font-bold text-[#1E58C8]">Add Prescription Item</Text>
              <View className="flex-row" style={{ gap: 8 }}>
                <View className="flex-1">
                  <Input
                    placeholder="Medicine Name (e.g. Dolo 650)"
                    value={newMedName}
                    onChangeText={setNewMedName}
                  />
                </View>
                <View className="flex-1">
                  <Input
                    placeholder="Dosage (e.g. 1 tab BD)"
                    value={newMedDosage}
                    onChangeText={setNewMedDosage}
                  />
                </View>
              </View>
              <Button
                title="Add to Rx List"
                onPress={addMedication}
                variant="primary"
                size="sm"
                icon={<Plus size={14} color="#FFFFFF" />}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      <View className="p-4 bg-white border-t border-slate-100">
        <Button
          title="Sign & Issue Digital Prescription (Rx)"
          onPress={handleIssuePrescription}
          variant="teal"
          size="lg"
          icon={<FileCheck size={20} color="#FFFFFF" />}
        />
      </View>

      {/* Signed Prescription Modal */}
      <Modal
        visible={showIssuedModal}
        onClose={() => setShowIssuedModal(false)}
        title="Prescription Signed & Transmitted"
      >
        <View style={{ gap: 16, paddingVertical: 8 }}>
          <View className="items-center" style={{ gap: 8 }}>
            <View className="w-16 h-16 rounded-full bg-teal-100 items-center justify-center border-4 border-teal-50">
              <CheckCircle2 size={36} color="#00B39B" />
            </View>
            <Text className="text-xl font-black text-slate-900 text-center">Prescription Rx Issued</Text>
            <Text className="text-xs text-slate-500 text-center">
              Signed by {user?.name || 'Dr. Priya Sharma'} (MCI-847291). Attached to patient's clinical file.
            </Text>
          </View>

          <Button
            title="Done & Return to Queue"
            onPress={() => {
              setShowIssuedModal(false);
              router.replace('/(doctor)/home');
            }}
            variant="primary"
            size="lg"
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}
