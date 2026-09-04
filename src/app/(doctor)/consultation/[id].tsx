import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  BackHandler,
} from 'react-native';
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
  MEDICINES_DIRECTORY,
  DIAGNOSTIC_TESTS_DIRECTORY,
  MedicineItem,
  DiagnosticTestItem,
} from '@/constants/medicalDirectory';
import {
  ArrowLeft,
  Pill,
  Activity,
  FileCheck,
  CheckCircle2,
  Plus,
  Trash2,
  Search,
  Clock,
  ShieldCheck,
  Building2,
  Calendar,
  ClipboardList,
} from 'lucide-react-native';

interface PrescribedMedicine {
  id: string;
  name: string;
  generic: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

interface PrescribedTest {
  id: string;
  name: string;
  category: string;
  turnaroundTime: string;
  fastingRequired: boolean;
}

export default function DoctorConsultationWorkspaceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: apt } = useAppointmentDetailQuery(id as string);

  const handleSafeBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(doctor)/home');
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      handleSafeBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  // SOAP Clinical Evaluation State
  const [subjective, setSubjective] = useState(
    'Patient reports recurring chest tightness and mild breathlessness upon climbing stairs.'
  );
  const [objective, setObjective] = useState(
    'BP: 128/82 mmHg, HR: 74 bpm, SpO2: 99% on room air. Normal heart sounds S1 S2.'
  );
  const [assessment, setAssessment] = useState(
    'Exertional Angina / Mild Hypertensive Heart Strain.'
  );

  // Prescribed Medicines State (Initialized with standard protocol)
  const [prescribedMeds, setPrescribedMeds] = useState<PrescribedMedicine[]>([
    {
      id: 'med_4',
      name: 'Telma 40',
      generic: 'Telmisartan IP 40mg',
      dosage: '1 Tab',
      frequency: 'OD (Once Daily morning)',
      duration: '30 Days',
      instructions: 'Maintain daily blood pressure log.',
    },
    {
      id: 'med_3',
      name: 'Pan 40',
      generic: 'Pantoprazole Gastro-resistant 40mg',
      dosage: '1 Tab',
      frequency: 'OD (Once Daily before breakfast)',
      duration: '14 Days',
      instructions: 'Take 30 minutes before morning breakfast.',
    },
  ]);

  // Prescribed Diagnostic Tests State
  const [prescribedTests, setPrescribedTests] = useState<PrescribedTest[]>([
    {
      id: 'test_7',
      name: '12-Lead Electrocardiogram (ECG)',
      category: 'Cardiology',
      turnaroundTime: 'Instant',
      fastingRequired: false,
    },
    {
      id: 'test_3',
      name: 'Comprehensive Lipid Profile',
      category: 'Cardiac & Lipid',
      turnaroundTime: '8 Hours',
      fastingRequired: true,
    },
  ]);

  // Modals
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPrescriptionPass, setShowPrescriptionPass] = useState(false);

  // Medicine Search & Filter
  const [medSearch, setMedSearch] = useState('');
  const [selectedMedCategory, setSelectedMedCategory] = useState('All');

  // Test Search & Filter
  const [testSearch, setTestSearch] = useState('');
  const [selectedTestCategory, setSelectedTestCategory] = useState('All');

  const medCategories = ['All', 'Antibiotics', 'Analgesics', 'Cardiovascular', 'Antidiabetic', 'Gastrointestinal', 'Vitamins'];
  const testCategories = ['All', 'Hematology', 'Metabolic', 'Cardiac', 'Biochemistry', 'Renal', 'Radiology'];

  const filteredMedicines = useMemo(() => {
    return MEDICINES_DIRECTORY.filter((m) => {
      const matchesQuery =
        m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
        m.generic.toLowerCase().includes(medSearch.toLowerCase());
      const matchesCategory =
        selectedMedCategory === 'All' ||
        m.category.toLowerCase().includes(selectedMedCategory.toLowerCase());
      return matchesQuery && matchesCategory;
    });
  }, [medSearch, selectedMedCategory]);

  const filteredTests = useMemo(() => {
    return DIAGNOSTIC_TESTS_DIRECTORY.filter((t) => {
      const matchesQuery =
        t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.category.toLowerCase().includes(testSearch.toLowerCase());
      const matchesCategory =
        selectedTestCategory === 'All' ||
        t.category.toLowerCase().includes(selectedTestCategory.toLowerCase());
      return matchesQuery && matchesCategory;
    });
  }, [testSearch, selectedTestCategory]);

  const addMedicineFromDirectory = (med: MedicineItem) => {
    if (prescribedMeds.some((m) => m.name === med.name)) {
      return;
    }
    setPrescribedMeds([
      ...prescribedMeds,
      {
        id: med.id + '_' + Date.now(),
        name: med.name,
        generic: med.generic,
        dosage: med.defaultDosage,
        frequency: med.defaultFrequency,
        duration: med.defaultDuration,
        instructions: med.instructions,
      },
    ]);
    setShowMedicineModal(false);
  };

  const removeMedicine = (id: string) => {
    setPrescribedMeds(prescribedMeds.filter((m) => m.id !== id));
  };

  const addTestFromDirectory = (test: DiagnosticTestItem) => {
    if (prescribedTests.some((t) => t.name === test.name)) {
      return;
    }
    setPrescribedTests([
      ...prescribedTests,
      {
        id: test.id + '_' + Date.now(),
        name: test.name,
        category: test.category,
        turnaroundTime: test.turnaroundTime,
        fastingRequired: test.fastingRequired,
      },
    ]);
    setShowTestModal(false);
  };

  const removeTest = (id: string) => {
    setPrescribedTests(prescribedTests.filter((t) => t.id !== id));
  };

  const handleSignPrescription = () => {
    setShowPrescriptionPass(true);
  };

  const doctorName = user?.name || apt?.doctorName || 'Dr. Priya Sharma';

  return (
    <SafeAreaView className="flex-1 bg-slate-50 justify-between">
      {/* Top Navigation Bar */}
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
        <TouchableOpacity
          onPress={handleSafeBack}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 }}
        >
          <View className="w-8 h-8 rounded-xl bg-slate-100 items-center justify-center">
            <ArrowLeft size={18} color="#0F172A" />
          </View>
        </TouchableOpacity>
        <Text
          style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', flex: 1, textAlign: 'center', marginHorizontal: 8 }}
          numberOfLines={1}
        >
          Clinical Suite
        </Text>
        <View style={{ flexShrink: 0 }}>
          <Badge label="IN-CLINIC" variant="blue" size="sm" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient Identity Header Card */}
        <View className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm flex-row items-center" style={{ gap: 12 }}>
          <Avatar uri={apt?.patientAvatar} name={apt?.patientName || 'Aarav Mehta'} size="lg" />
          <View className="flex-1" style={{ minWidth: 0 }}>
            <Text className="text-base font-black text-slate-900" numberOfLines={1}>
              {apt?.patientName || 'Aarav Mehta'}
            </Text>
            <Text className="text-xs text-slate-500 font-medium mt-0.5">
              Age: 32 • Gender: Male • Blood: O+
            </Text>
            <View className="flex-row items-center mt-1" style={{ gap: 6 }}>
              <View className="bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                <Text className="text-[10px] font-bold text-red-600">Allergies: Penicillin</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Anatomical Examination Focus (Responsive 3D Annotator) */}
        <BodyRegion3D />

        {/* SOAP Clinical Evaluation Section */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            padding: 16,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            gap: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={17} color="#1E58C8" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                SOAP Clinical Evaluation
              </Text>
            </View>
            <Badge label="CLINICAL NOTES" variant="blue" size="sm" />
          </View>

          {/* Subjective */}
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ backgroundColor: '#1E58C8', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFFFFF' }}>S</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>
                Subjective — Chief Complaints & Symptoms
              </Text>
            </View>
            <Input
              placeholder="Record patient complaints, symptoms onset, severity..."
              value={subjective}
              onChangeText={setSubjective}
              multiline
            />
          </View>

          {/* Objective */}
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ backgroundColor: '#00B39B', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFFFFF' }}>O</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>
                Objective — Vitals & Physical Examination
              </Text>
            </View>
            <Input
              placeholder="Record BP, Pulse, SpO2, Heart/Lung sounds, physical exam..."
              value={objective}
              onChangeText={setObjective}
              multiline
            />
          </View>

          {/* Assessment */}
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ backgroundColor: '#8B5CF6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFFFFF' }}>A</Text>
              </View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>
                Assessment — Clinical Impression & Diagnosis
              </Text>
            </View>
            <Input
              placeholder="Enter confirmed diagnosis or clinical differential..."
              value={assessment}
              onChangeText={setAssessment}
            />
          </View>
        </View>

        {/* Prescribed Medications Section with Medical Directory Picker */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            padding: 16,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            gap: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
                <Pill size={17} color="#00B39B" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Prescribed Medicines (Rx)
              </Text>
            </View>
            <Badge label={`${prescribedMeds.length} Active`} variant="teal" size="sm" />
          </View>

          {/* Medicines List */}
          {prescribedMeds.length === 0 ? (
            <View style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>No medications prescribed yet.</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {prescribedMeds.map((med) => (
                <View
                  key={med.id}
                  style={{
                    backgroundColor: '#F8FAFC',
                    padding: 14,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                        {med.name}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 1 }} numberOfLines={1}>
                        {med.generic}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => removeMedicine(med.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: '#FEF2F2',
                        borderWidth: 1,
                        borderColor: '#FEE2E2',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                    <View style={{ backgroundColor: '#F0FDFA', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#CCFBF1' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#00B39B' }}>{med.dosage}</Text>
                    </View>
                    <View style={{ backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#DBEAFE' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E58C8' }}>{med.frequency}</Text>
                    </View>
                    <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>{med.duration}</Text>
                    </View>
                  </View>

                  {med.instructions ? (
                    <View style={{ backgroundColor: '#FFFBEB', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#FEF3C7', marginTop: 2 }}>
                      <Text style={{ fontSize: 11, color: '#92400E', fontWeight: '500' }}>
                        Note: {med.instructions}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Button to Open Medicine Directory */}
          <TouchableOpacity
            onPress={() => setShowMedicineModal(true)}
            activeOpacity={0.8}
            style={{
              height: 48,
              backgroundColor: '#F0FDFA',
              borderWidth: 1.5,
              borderColor: '#5EEAD4',
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Plus size={16} color="#00B39B" />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#00B39B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Add Medicine (Rx)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Prescribed Diagnostic Tests & Labs with Directory Picker */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            padding: 16,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            gap: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={17} color="#1E58C8" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Diagnostic Investigations & Labs
              </Text>
            </View>
            <Badge label={`${prescribedTests.length} Tests`} variant="blue" size="sm" />
          </View>

          {/* Tests List */}
          {prescribedTests.length === 0 ? (
            <View style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>No diagnostic investigations added.</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {prescribedTests.map((test) => (
                <View
                  key={test.id}
                  style={{
                    backgroundColor: '#F8FAFC',
                    padding: 14,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                        {test.name}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B', marginTop: 1 }}>
                        Category: {test.category}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => removeTest(test.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        backgroundColor: '#FEF2F2',
                        borderWidth: 1,
                        borderColor: '#FEE2E2',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Trash2 size={15} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                    <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#475569' }}>
                        Turnaround: {test.turnaroundTime}
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                        borderWidth: 1,
                        backgroundColor: test.fastingRequired ? '#FFFBEB' : '#F0FDF4',
                        borderColor: test.fastingRequired ? '#FEF3C7' : '#DCFCE7',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: test.fastingRequired ? '#92400E' : '#166534',
                        }}
                      >
                        {test.fastingRequired ? 'Fasting Required' : 'Non-Fasting (Routine)'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Button to Open Diagnostic Tests Directory */}
          <TouchableOpacity
            onPress={() => setShowTestModal(true)}
            activeOpacity={0.8}
            style={{
              height: 48,
              backgroundColor: '#EFF6FF',
              borderWidth: 1.5,
              borderColor: '#93C5FD',
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Plus size={16} color="#1E58C8" />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#1E58C8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Add Diagnostic Test / Lab
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View className="p-4 bg-white border-t border-slate-100 shadow-lg">
        <Button
          title="Sign Digital Prescription (Rx)"
          onPress={handleSignPrescription}
          variant="teal"
          size="lg"
          icon={<FileCheck size={20} color="#FFFFFF" />}
        />
      </View>

      {/* ========================================================================= */}
      {/* 1. MEDICINES DIRECTORY MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={showMedicineModal}
        onClose={() => setShowMedicineModal(false)}
        title="Clinical Medicines Directory"
      >
        <View style={{ gap: 12, paddingVertical: 4 }}>
          {/* Search Box */}
          <View
            className="flex-row items-center bg-slate-100 px-3.5 rounded-2xl border border-slate-200"
            style={{ height: 46, gap: 8 }}
          >
            <Search size={16} color="#94A3B8" />
            <TextInput
              placeholder="Search medicine brand or generic..."
              placeholderTextColor="#94A3B8"
              value={medSearch}
              onChangeText={setMedSearch}
              className="flex-1 text-sm text-slate-900 font-medium"
            />
          </View>

          {/* Category Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 6, paddingVertical: 2 }}>
              {medCategories.map((cat) => {
                const isSel = selectedMedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedMedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      isSel ? 'bg-[#00B39B] border-[#00B39B]' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${isSel ? 'text-white' : 'text-slate-700'}`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Results List */}
          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            <View style={{ gap: 10 }}>
              {filteredMedicines.map((med) => (
                <TouchableOpacity
                  key={med.id}
                  onPress={() => addMedicineFromDirectory(med)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#F8FAFC',
                    padding: 14,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                        {med.name}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 1 }} numberOfLines={1}>
                        {med.generic}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#00B39B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexShrink: 0 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>+ Add Rx</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                    <Badge label={med.dosageForm} variant="blue" size="sm" />
                    <View style={{ backgroundColor: '#F0FDFA', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6, borderWidth: 1, borderColor: '#CCFBF1' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#00B39B' }}>
                        {med.defaultDosage} • {med.defaultFrequency} • {med.defaultDuration}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. DIAGNOSTIC TESTS DIRECTORY MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="Diagnostic Tests Directory"
      >
        <View style={{ gap: 12, paddingVertical: 4 }}>
          {/* Search Box */}
          <View
            className="flex-row items-center bg-slate-100 px-3.5 rounded-2xl border border-slate-200"
            style={{ height: 46, gap: 8 }}
          >
            <Search size={16} color="#94A3B8" />
            <TextInput
              placeholder="Search diagnostic test e.g. CBC, Lipid, ECG..."
              placeholderTextColor="#94A3B8"
              value={testSearch}
              onChangeText={setTestSearch}
              className="flex-1 text-sm text-slate-900 font-medium"
            />
          </View>

          {/* Category Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row" style={{ gap: 6, paddingVertical: 2 }}>
              {testCategories.map((cat) => {
                const isSel = selectedTestCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedTestCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl border ${
                      isSel ? 'bg-[#1E58C8] border-[#1E58C8]' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${isSel ? 'text-white' : 'text-slate-700'}`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Results List */}
          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            <View style={{ gap: 10 }}>
              {filteredTests.map((test) => (
                <TouchableOpacity
                  key={test.id}
                  onPress={() => addTestFromDirectory(test)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#F8FAFC',
                    padding: 14,
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    gap: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                        {test.name}
                      </Text>
                      <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 1 }}>
                        Category: {test.category}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#1E58C8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, flexShrink: 0 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>+ Order</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                    <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2.5, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: '#475569' }}>
                        Turnaround: {test.turnaroundTime}
                      </Text>
                    </View>
                    <View
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 2.5,
                        borderRadius: 6,
                        borderWidth: 1,
                        backgroundColor: test.fastingRequired ? '#FFFBEB' : '#F0FDF4',
                        borderColor: test.fastingRequired ? '#FEF3C7' : '#DCFCE7',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '700',
                          color: test.fastingRequired ? '#92400E' : '#166534',
                        }}
                      >
                        {test.fastingRequired ? 'Fasting Required' : 'Non-Fasting (Routine)'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 3. OFFICIAL DIGITAL PRESCRIPTION PASS MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={showPrescriptionPass}
        onClose={() => setShowPrescriptionPass(false)}
        title="Official Digital Prescription (Rx)"
      >
        <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 16, paddingVertical: 4 }}>
            {/* Clinic Letterhead */}
            <View className="bg-slate-900 p-4 rounded-3xl" style={{ gap: 8 }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Building2 size={16} color="#00B39B" />
                  <Text className="text-xs font-black text-white uppercase tracking-wider">
                    HeartCare Specialty Clinic
                  </Text>
                </View>
                <Badge label="MCI CERTIFIED" variant="teal" size="sm" />
              </View>

              <Text className="text-base font-black text-white">{doctorName}</Text>
              <Text className="text-xs text-teal-300 font-semibold">
                Senior Consultant Cardiologist • MCI-847291
              </Text>
              <Text className="text-[11px] text-slate-400">
                Suite 402, Medical Enclave, Bandra West, Mumbai
              </Text>
            </View>

            {/* Patient & Date Meta */}
            <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex-row justify-between">
              <View>
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Patient</Text>
                <Text className="text-sm font-black text-slate-900">
                  {apt?.patientName || 'Aarav Mehta'}
                </Text>
                <Text className="text-[11px] text-slate-500">Age: 32 • Male • O+</Text>
              </View>
              <View className="items-end">
                <Text className="text-[10px] font-bold text-slate-400 uppercase">Date</Text>
                <Text className="text-sm font-bold text-slate-900">
                  {new Date().toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
                <Text className="text-[11px] font-bold text-teal-600">Status: Signed</Text>
              </View>
            </View>

            {/* Diagnosis */}
            <View className="bg-blue-50 p-3.5 rounded-2xl border border-blue-200">
              <Text className="text-[10px] font-bold text-[#1E58C8] uppercase tracking-wider">
                Clinical Diagnosis
              </Text>
              <Text className="text-sm font-black text-slate-900 mt-0.5">{assessment}</Text>
            </View>

            {/* Prescribed Medications Table */}
            <View style={{ gap: 8 }}>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Pill size={16} color="#00B39B" />
                <Text className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Prescribed Medications ({prescribedMeds.length})
                </Text>
              </View>

              {prescribedMeds.map((m, idx) => (
                <View
                  key={idx}
                  className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex-row justify-between items-center"
                >
                  <View className="flex-1 mr-2" style={{ minWidth: 0 }}>
                    <Text className="text-xs font-black text-slate-900">{m.name}</Text>
                    <Text className="text-[10px] text-slate-500">{m.generic}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[11px] font-bold text-[#00B39B]">{m.dosage} • {m.frequency}</Text>
                    <Text className="text-[10px] text-slate-600">Duration: {m.duration}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Prescribed Tests Table */}
            {prescribedTests.length > 0 && (
              <View style={{ gap: 8 }}>
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Activity size={16} color="#1E58C8" />
                  <Text className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Diagnostic Lab Investigations ({prescribedTests.length})
                  </Text>
                </View>

                {prescribedTests.map((t, idx) => (
                  <View
                    key={idx}
                    className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex-row justify-between items-center"
                  >
                    <Text className="text-xs font-bold text-slate-900 flex-1 mr-2" numberOfLines={1}>
                      {t.name}
                    </Text>
                    <Text className="text-[10px] font-bold text-[#1E58C8]">
                      {t.fastingRequired ? 'Fasting Required' : 'Routine'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Digital Signature Seal */}
            <View className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 flex-row items-center" style={{ gap: 10 }}>
              <ShieldCheck size={28} color="#10B981" />
              <View className="flex-1">
                <Text className="text-xs font-bold text-emerald-800">
                  Digitally Authenticated by {doctorName}
                </Text>
                <Text className="text-[10px] text-emerald-600 font-medium mt-0.5">
                  MCI Registered Practitioner • Direct Transmitted to Patient File
                </Text>
              </View>
            </View>

            <Button
              title="Close & Return to Queue"
              onPress={() => {
                setShowPrescriptionPass(false);
                router.replace('/(doctor)/home');
              }}
              variant="primary"
              size="lg"
            />
          </View>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}
