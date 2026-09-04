import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  BackHandler,
  Share,
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
import { useHealthStore } from '@/store/useHealthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAppointmentStore } from '@/store/useAppointmentStore';
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
  History,
  FileText,
  ChevronDown,
  ChevronUp,
  Share2,
  Download,
  Sparkles,
  SlidersHorizontal,
  Stethoscope,
  HeartPulse,
  Edit3,
  Bookmark,
  Check,
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

interface RxPreset {
  id: string;
  label: string;
  icon: string;
  diagnosis: string;
  notes: string;
  advice: string;
  meds: {
    name: string;
    generic: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  tests?: {
    name: string;
    category: string;
    turnaroundTime: string;
    fastingRequired: boolean;
  }[];
}

const COMMON_PATIENT_VOICE_CHIPS = [
  'Fever x 3 days (बुखार)',
  'Throbbing headache (सिरदर्द)',
  'Persistent dry cough (खांसी)',
  'Chest tightness / discomfort',
  'Stomach cramps & acidity (गैस/एसिडिटी)',
  'Body ache & fatigue (कमजोरी)',
  'Sore throat & cold (गले में खराश)',
  'Dizziness on standing (चक्कर)',
];

const CLINICAL_PRESETS: RxPreset[] = [
  {
    id: 'fever_flu',
    label: 'Viral Fever / URI',
    icon: '🌡️',
    diagnosis: 'Acute Viral Upper Respiratory Infection with Pyrexia',
    notes: 'Patient presented with 3 days fever, body ache, throat irritation. Chest clear on auscultation.',
    advice: 'Steam inhalation twice daily, saline gargles, maintain high fluid intake (2.5L/day), light khichdi/soup diet.',
    meds: [
      {
        name: 'Dolo 650',
        generic: 'Paracetamol IP 650mg',
        dosage: '1 Tab',
        frequency: '1-0-1 (Morning & Night)',
        duration: '5 Days',
        instructions: 'Take after meals for fever > 100°F (SOS if needed)',
      },
      {
        name: 'Levocet 5',
        generic: 'Levocetirizine Dihydrochloride 5mg',
        dosage: '1 Tab',
        frequency: '0-0-1 (Night only)',
        duration: '5 Days',
        instructions: 'Take at bedtime after food',
      },
      {
        name: 'Limcee 500',
        generic: 'Vitamin C (Ascorbic Acid) 500mg',
        dosage: '1 Tab',
        frequency: '1-0-0 (Morning only)',
        duration: '10 Days',
        instructions: 'Chewable tablet after breakfast',
      },
    ],
    tests: [
      {
        name: 'Complete Blood Count (CBC)',
        category: 'Hematology',
        turnaroundTime: '4 Hours',
        fastingRequired: false,
      },
    ],
  },
  {
    id: 'hypertension',
    label: 'Hypertension Protocol',
    icon: '🫀',
    diagnosis: 'Essential Stage-1 Systemic Hypertension',
    notes: 'Serial BP monitoring indicates persistent elevations (144/92 mmHg). No end-organ damage symptoms.',
    advice: 'Strict low sodium diet (<2g salt/day), 30 mins brisk walking daily, maintain home BP diary morning & night.',
    meds: [
      {
        name: 'Telma 40',
        generic: 'Telmisartan IP 40mg',
        dosage: '1 Tab',
        frequency: '1-0-0 (Morning only)',
        duration: '30 Days',
        instructions: 'Take once daily after breakfast at fixed time',
      },
      {
        name: 'Amlong 5',
        generic: 'Amlodipine Besylate 5mg',
        dosage: '1 Tab',
        frequency: '0-0-1 (Night only)',
        duration: '30 Days',
        instructions: 'Take after dinner',
      },
    ],
    tests: [
      {
        name: 'Comprehensive Lipid Profile',
        category: 'Biochemistry',
        turnaroundTime: '8 Hours',
        fastingRequired: true,
      },
      {
        name: 'Serum Creatinine & Electrolytes',
        category: 'Renal Function',
        turnaroundTime: '6 Hours',
        fastingRequired: false,
      },
    ],
  },
  {
    id: 'acidity_gerd',
    label: 'GERD & Acidity',
    icon: '💊',
    diagnosis: 'Gastroesophageal Reflux Disease (GERD) with Non-Ulcer Dyspepsia',
    notes: 'Retrosternal burning sensation, postprandial fullness, acid regurgitation aggravated by spicy foods.',
    advice: 'Avoid spicy/deep-fried food, chocolate, coffee. Eat small frequent meals. Keep 2 hours gap between dinner and sleep.',
    meds: [
      {
        name: 'Pan 40',
        generic: 'Pantoprazole Gastro-resistant 40mg',
        dosage: '1 Tab',
        frequency: '1-0-0 (Morning only)',
        duration: '14 Days',
        instructions: 'Take empty stomach 30 mins before morning breakfast',
      },
      {
        name: 'Domstal 10',
        generic: 'Domperidone 10mg',
        dosage: '1 Tab',
        frequency: '1-0-1 (Morning & Night)',
        duration: '7 Days',
        instructions: 'Take 15 minutes before meals',
      },
    ],
  },
  {
    id: 'diabetes_t2',
    label: 'Diabetes Type-2',
    icon: '🩸',
    diagnosis: 'Type-2 Diabetes Mellitus with Suboptimal Glycemic Control',
    notes: 'HbA1c elevated (7.8%). Fasting blood sugars 142 mg/dL. No microvascular complications detected on exam.',
    advice: 'Dietary carbohydrate restriction. Avoid refined sugars, sweets, and processed snacks. Daily 45 mins exercise.',
    meds: [
      {
        name: 'Glycomet GP 1',
        generic: 'Metformin 500mg + Glimepiride 1mg',
        dosage: '1 Tab',
        frequency: '1-0-1 (Morning & Night)',
        duration: '30 Days',
        instructions: 'Take with or immediately after major meals',
      },
    ],
    tests: [
      {
        name: 'Glycated Hemoglobin (HbA1c)',
        category: 'Biochemistry',
        turnaroundTime: '6 Hours',
        fastingRequired: false,
      },
      {
        name: 'Fasting & Post-Prandial Blood Sugar',
        category: 'Biochemistry',
        turnaroundTime: '4 Hours',
        fastingRequired: true,
      },
    ],
  },
  {
    id: 'cough_bronchitis',
    label: 'Acute Bronchitis / Cough',
    icon: '🫁',
    diagnosis: 'Acute Tracheobronchitis with Spasmodic Cough',
    notes: 'Persistent dry & productive cough x 5 days, nocturnal worsening, chest clear on auscultation.',
    advice: 'Avoid cold beverages, warm water sips, steam inhalation twice daily. Review if breathing difficulty occurs.',
    meds: [
      {
        name: 'Augmentin 625 Duo',
        generic: 'Amoxicillin 500mg + Clavulanic Acid 125mg',
        dosage: '1 Tab',
        frequency: '1-0-1 (Morning & Night)',
        duration: '5 Days',
        instructions: 'Complete full 5-day antibiotic course after meals',
      },
      {
        name: 'Ascoril D Plus',
        generic: 'Dextromethorphan + Phenylephrine + CPM Syrup',
        dosage: '10 ml',
        frequency: '1-1-1 (Morning, Noon, Night)',
        duration: '5 Days',
        instructions: 'Take 10ml with measuring cup after food',
      },
    ],
  },
];

const TIMING_OPTIONS = [
  '1-0-1 (Morning & Night)',
  '1-0-0 (Morning only)',
  '0-0-1 (Night only)',
  '1-1-1 (Morning, Noon, Night)',
  '0-1-0 (Afternoon only)',
  'SOS (As needed / जरूरत पर)',
];

const FOOD_INSTRUCTION_OPTIONS = [
  'After Meals (खाने के बाद)',
  'Before Meals / Empty Stomach (खाली पेट)',
  'With Meals (खाने के साथ)',
  'At Bedtime (रात को सोते समय)',
];

const DURATION_OPTIONS = ['3 Days', '5 Days', '7 Days', '10 Days', '14 Days', '30 Days'];
const DOSAGE_FORM_OPTIONS = ['1 Tab', '2 Tabs', '1 Cap', '5 ml', '10 ml', '1 Sachet', '1 Inj'];

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

  // SOAP Clinical Evaluation State - Starts EMPTY so doctor is not forced with mock data
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [adviceNotes, setAdviceNotes] = useState('');

  // Auto-fill patient complaints from booking if available
  useEffect(() => {
    if (apt?.symptoms && apt.symptoms.length > 0 && !subjective) {
      setSubjective(`Patient reported symptoms: ${apt.symptoms.join(', ')}`);
    }
  }, [apt]);

  // Prescribed Medicines & Tests - Starts clean and empty
  const [prescribedMeds, setPrescribedMeds] = useState<PrescribedMedicine[]>([]);
  const [prescribedTests, setPrescribedTests] = useState<PrescribedTest[]>([]);

  // Modals
  const [showMedicineModal, setShowMedicineModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPrescriptionPass, setShowPrescriptionPass] = useState(false);
  const [showDosageModal, setShowDosageModal] = useState(false);
  const [activeEditingMed, setActiveEditingMed] = useState<PrescribedMedicine | null>(null);

  // Dosage Form State
  const [selectedTiming, setSelectedTiming] = useState(TIMING_OPTIONS[0]);
  const [selectedFood, setSelectedFood] = useState(FOOD_INSTRUCTION_OPTIONS[0]);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[1]);
  const [selectedDosageForm, setSelectedDosageForm] = useState(DOSAGE_FORM_OPTIONS[0]);
  const [customDosageInstruction, setCustomDosageInstruction] = useState('');

  // Medicine Search & Filter
  const [medSearch, setMedSearch] = useState('');
  const [selectedMedCategory, setSelectedMedCategory] = useState('All');

  // Test Search & Filter
  const [testSearch, setTestSearch] = useState('');
  const [selectedTestCategory, setSelectedTestCategory] = useState('All');

  const [downloadToast, setDownloadToast] = useState(false);
  const [showPatientHistory, setShowPatientHistory] = useState(false);

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

  const appendPatientVoiceChip = (chip: string) => {
    setSubjective((prev) => (prev ? `${prev}, ${chip}` : chip));
  };

  const fillNormalVitals = () => {
    setObjective('Vitals: BP 120/80 mmHg, Pulse 74 bpm (Regular), SpO2 99% on room air, Temp 98.4°F, Chest clear S1 S2 normal.');
  };

  const applyPreset = (preset: RxPreset) => {
    setAssessment(preset.diagnosis);
    setAdviceNotes(preset.advice);
    if (!objective) {
      setObjective(preset.notes);
    }

    // Map preset meds
    const newMeds: PrescribedMedicine[] = preset.meds.map((m, idx) => ({
      id: `med_preset_${preset.id}_${idx}_${Date.now()}`,
      name: m.name,
      generic: m.generic,
      dosage: m.dosage,
      frequency: m.frequency,
      duration: m.duration,
      instructions: m.instructions,
    }));
    setPrescribedMeds(newMeds);

    // Map preset tests
    if (preset.tests && preset.tests.length > 0) {
      const newTests: PrescribedTest[] = preset.tests.map((t, idx) => ({
        id: `test_preset_${preset.id}_${idx}_${Date.now()}`,
        name: t.name,
        category: t.category,
        turnaroundTime: t.turnaroundTime,
        fastingRequired: t.fastingRequired,
      }));
      setPrescribedTests(newTests);
    }
  };

  const openDosageModalForMed = (med: PrescribedMedicine) => {
    setActiveEditingMed(med);
    setSelectedDosageForm(med.dosage || DOSAGE_FORM_OPTIONS[0]);
    setSelectedTiming(med.frequency || TIMING_OPTIONS[0]);
    setSelectedDuration(med.duration || DURATION_OPTIONS[1]);
    setSelectedFood(FOOD_INSTRUCTION_OPTIONS[0]);
    setCustomDosageInstruction(med.instructions || '');
    setShowDosageModal(true);
  };

  const saveDosageConfiguration = () => {
    if (!activeEditingMed) return;
    const combinedInstructions = `${selectedFood}${customDosageInstruction ? ' • ' + customDosageInstruction : ''}`;

    setPrescribedMeds((prev) =>
      prev.map((m) =>
        m.id === activeEditingMed.id
          ? {
              ...m,
              dosage: selectedDosageForm,
              frequency: selectedTiming,
              duration: selectedDuration,
              instructions: combinedInstructions,
            }
          : m
      )
    );
    setShowDosageModal(false);
    setActiveEditingMed(null);
  };

  const addMedicineFromDirectory = (med: MedicineItem) => {
    if (prescribedMeds.some((m) => m.name === med.name)) {
      return;
    }
    const newMed: PrescribedMedicine = {
      id: med.id + '_' + Date.now(),
      name: med.name,
      generic: med.generic,
      dosage: med.defaultDosage,
      frequency: med.defaultFrequency,
      duration: med.defaultDuration,
      instructions: med.instructions,
    };
    setPrescribedMeds([...prescribedMeds, newMed]);
    setShowMedicineModal(false);
    // Optionally open dosage customization immediately
    openDosageModalForMed(newMed);
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
    const rxId = `rx_${Date.now()}`;
    const verificationCode = `FYD-RX-${Math.floor(100000 + Math.random() * 900000)}-MH`;
    const formattedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newPrescription = {
      id: rxId,
      consultationId: (id as string) || 'apt_live',
      patientId: apt?.patientId || 'pat_1',
      doctorId: user?.id || 'doc_live',
      doctorName,
      doctorSpecialty: 'Senior Consultant Cardiologist',
      doctorMciNumber: 'MCI-847291',
      clinicName: 'HeartCare Specialty Clinic',
      clinicAddress: 'Suite 402, Medical Enclave, Bandra West, Mumbai',
      patientName: apt?.patientName || 'Aarav Mehta',
      patientAge: 32,
      patientGender: 'Male',
      diagnosis: assessment || 'Acute Clinical Evaluation',
      doctorNotes: objective || 'Clinical examination within physiological tolerance.',
      followUpInstructions: adviceNotes || 'Review after 7 days in clinic or SOS if symptoms persist. Low sodium diet and high fluids recommended.',
      verificationCode,
      signedAt: new Date().toISOString(),
      createdAt: formattedDate,
      vitals: {
        bp: '128/82 mmHg',
        pulse: '74 bpm',
        temp: '98.4°F',
        spo2: '99%',
      },
      medicines: prescribedMeds.map((m) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        durationDays: parseInt(m.duration) || 5,
        instructions: m.instructions,
      })),
      tests: prescribedTests.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        turnaroundTime: t.turnaroundTime,
        fastingRequired: t.fastingRequired,
      })),
    };

    useHealthStore.getState().addPrescription(newPrescription);

    useNotificationStore.getState().addNotification({
      title: 'Digital Prescription (Rx) Issued',
      message: `${doctorName} has issued your official digital prescription with ${prescribedMeds.length} medication(s). Tap to review dosage instructions.`,
      type: 'prescription',
      link: '/(patient)/health',
    });

    if (apt?.id) {
      const aptStore = useAppointmentStore.getState();
      const existing = aptStore.appointments.find((a) => a.id === apt.id);
      if (existing) {
        aptStore.addAppointment({ ...existing, status: 'completed' });
      }
    }

    setShowPrescriptionPass(true);
  };

  const handleShareRx = async () => {
    try {
      await Share.share({
        title: `Digital Prescription (Rx) • ${doctorName}`,
        message: `FiYDoc Official Medical Prescription (Rx)\nDoctor: ${doctorName} (MCI-847291)\nClinic: HeartCare Specialty Clinic\nPatient: ${apt?.patientName || 'Aarav Mehta'}\nDiagnosis: ${assessment || 'Clinical Assessment'}\nMedications (${prescribedMeds.length}):\n${prescribedMeds.map((m, i) => `${i + 1}. ${m.name} - ${m.dosage} [${m.frequency}] x ${m.duration} (${m.instructions})`).join('\n')}\nAdvice: ${adviceNotes || 'Take rest and adequate hydration.'}\nRef: FYD-RX-847291`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadPdf = () => {
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 2500);
  };

  const doctorName = user?.name || apt?.doctorName || 'Dr. Priya Sharma';

  return (
    <SafeAreaView className="flex-1 bg-slate-50 justify-between" edges={['top']}>
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
        <View className="items-center">
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
            OPD Clinical Suite
          </Text>
          <Text className="text-[10px] text-teal-600 font-bold">NMC / MCI VERIFIED PRACTITIONER</Text>
        </View>
        <View style={{ flexShrink: 0 }}>
          <Badge label="IN-CLINIC" variant="blue" size="sm" />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 110, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Patient Identity Header Card */}
        <View className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm flex-row items-center" style={{ gap: 12 }}>
          <Avatar uri={apt?.patientAvatar} name={apt?.patientName || 'Aarav Mehta'} size="lg" />
          <View className="flex-1" style={{ minWidth: 0 }}>
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-black text-slate-900" numberOfLines={1}>
                {apt?.patientName || 'Aarav Mehta'}
              </Text>
              <Badge label="TOKEN #02" variant="teal" size="sm" />
            </View>
            <Text className="text-xs text-slate-500 font-medium mt-0.5">
              Age: 32 Yrs • Gender: Male • Blood: O+
            </Text>
            <View className="flex-row items-center mt-1.5" style={{ gap: 6 }}>
              <View className="bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                <Text className="text-[10px] font-bold text-red-600">Allergies: Penicillin</Text>
              </View>
              <View className="bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                <Text className="text-[10px] font-bold text-[#1E58C8]">OPD Follow-up</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Patient Longitudinal Medical History & EHR Card (Indian MedTech EHR) */}
        <View className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <TouchableOpacity
            onPress={() => setShowPatientHistory(!showPatientHistory)}
            activeOpacity={0.8}
            className="p-3.5 flex-row items-center justify-between bg-slate-50/80 border-b border-slate-100"
          >
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <View className="w-8 h-8 rounded-xl bg-blue-50 items-center justify-center border border-blue-200">
                <History size={16} color="#1E58C8" />
              </View>
              <View>
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Text className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    Patient Longitudinal History (EHR)
                  </Text>
                  <Badge label="ABDM CONNECTED" variant="teal" size="sm" />
                </View>
                <Text className="text-[11px] text-slate-500 font-medium">
                  Past visits, chronic conditions, prescriptions & lab records
                </Text>
              </View>
            </View>
            {showPatientHistory ? (
              <ChevronUp size={18} color="#64748B" />
            ) : (
              <ChevronDown size={18} color="#64748B" />
            )}
          </TouchableOpacity>

          {showPatientHistory && (
            <View className="p-4" style={{ gap: 12 }}>
              <View className="bg-slate-50 p-3 rounded-2xl border border-slate-200/70" style={{ gap: 6 }}>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Active Clinical Conditions & Vitals Baseline
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  <View className="bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    <Text className="text-xs font-bold text-[#1E58C8]">Stage-1 Hypertension (2 yrs)</Text>
                  </View>
                  <View className="bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                    <Text className="text-xs font-bold text-teal-700">Type-2 Diabetes Borderline (3 yrs)</Text>
                  </View>
                  <View className="bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                    <Text className="text-xs font-bold text-rose-700">Allergy: Penicillin (Rash)</Text>
                  </View>
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Past Prescriptions & Encounters
                </Text>
                <View className="bg-slate-50 p-3 rounded-xl border border-slate-200/80" style={{ gap: 4 }}>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs font-black text-slate-900">Dr. Priya Sharma • OPD Review</Text>
                    <Text className="text-[10px] font-bold text-slate-500">12 Aug 2026</Text>
                  </View>
                  <Text className="text-[11px] text-slate-600">
                    Rx: Tab Telmisartan 40mg (1-0-0), Tab Atorvastatin 10mg (0-0-1). Good response, BP controlled.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Quick Clinical Rx Presets (One-tap Indian OPD Protocol Loader) */}
        <View className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm" style={{ gap: 10 }}>
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center" style={{ gap: 6 }}>
              <Bookmark size={16} color="#1E58C8" />
              <Text className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Clinical Rx Presets & Protocols
              </Text>
            </View>
            <Text className="text-[10px] text-slate-400 font-bold">1-TAP LOAD</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {CLINICAL_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                onPress={() => applyPreset(preset)}
                activeOpacity={0.8}
                className="bg-blue-50/70 border border-blue-200/80 px-3.5 py-2.5 rounded-2xl flex-row items-center"
                style={{ gap: 6 }}
              >
                <Text style={{ fontSize: 15 }}>{preset.icon}</Text>
                <View>
                  <Text className="text-xs font-black text-[#1E58C8]">{preset.label}</Text>
                  <Text className="text-[10px] text-slate-500">{preset.meds.length} Meds</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Anatomical Examination Focus (Responsive 3D Annotator) */}
        <BodyRegion3D />

        {/* 1. WHAT THE PATIENT IS SAYING (Chief Complaints / Subjective) */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            padding: 16,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            gap: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <View className="w-8 h-8 rounded-xl bg-blue-50 items-center justify-center">
                <Stethoscope size={17} color="#1E58C8" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Patient's Chief Complaints (What Patient is Saying)
              </Text>
            </View>
            <Badge label="SUBJECTIVE" variant="blue" size="sm" />
          </View>

          {/* Quick Tap Complaint Chips */}
          <Text className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Quick Symptom Tags (Tap to Append)
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {COMMON_PATIENT_VOICE_CHIPS.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => appendPatientVoiceChip(chip)}
                activeOpacity={0.75}
                className="bg-slate-100 hover:bg-blue-50 border border-slate-200 px-3 py-1.5 rounded-xl flex-row items-center"
                style={{ gap: 4 }}
              >
                <Plus size={12} color="#475569" />
                <Text className="text-xs font-bold text-slate-700">{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            placeholder="Type verbatim what the patient is describing: onset, duration, triggers..."
            value={subjective}
            onChangeText={setSubjective}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 2. OBJECTIVE (Vitals & Clinical Examination) */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            padding: 16,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            gap: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <View className="w-8 h-8 rounded-xl bg-teal-50 items-center justify-center">
                <HeartPulse size={17} color="#00B39B" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Vitals & Physical Examination
              </Text>
            </View>
            <TouchableOpacity
              onPress={fillNormalVitals}
              className="bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200"
            >
              <Text className="text-[10px] font-bold text-[#00B39B]">+ Normal Vitals</Text>
            </TouchableOpacity>
          </View>

          <Input
            placeholder="e.g. BP: 120/80 mmHg, Pulse: 74 bpm, SpO2: 99%, Heart/Lung sounds..."
            value={objective}
            onChangeText={setObjective}
            multiline
            numberOfLines={2}
          />
        </View>

        {/* 3. ASSESSMENT (Clinical Diagnosis) */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            padding: 16,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            gap: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <View className="w-8 h-8 rounded-xl bg-purple-50 items-center justify-center">
                <ClipboardList size={17} color="#8B5CF6" />
              </View>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Clinical Assessment & Diagnosis
              </Text>
            </View>
            <Badge label="ASSESSMENT" variant="purple" size="sm" />
          </View>

          <Input
            placeholder="e.g. Acute Viral Bronchitis, Essential Hypertension..."
            value={assessment}
            onChangeText={setAssessment}
          />
        </View>

        {/* 4. PRESCRIBED MEDICINES SECTION WITH DOSAGE SELECTOR */}
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
            <Badge label={`${prescribedMeds.length} Added`} variant="teal" size="sm" />
          </View>

          {/* Medicines List */}
          {prescribedMeds.length === 0 ? (
            <View style={{ backgroundColor: '#F8FAFC', padding: 20, borderRadius: 18, borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', alignItems: 'center', gap: 6 }}>
              <Pill size={24} color="#94A3B8" />
              <Text style={{ fontSize: 13, color: '#475569', fontWeight: '700' }}>No medicines prescribed yet.</Text>
              <Text style={{ fontSize: 11, color: '#94A3B8', textAlign: 'center' }}>
                Pick from a clinical preset above or tap "+ Add Medicine from Directory" below.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {prescribedMeds.map((med, idx) => (
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
                        {idx + 1}. {med.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }} numberOfLines={1}>
                        {med.generic}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => openDosageModalForMed(med)}
                        className="bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 flex-row items-center"
                        style={{ gap: 4 }}
                      >
                        <SlidersHorizontal size={12} color="#1E58C8" />
                        <Text className="text-[10px] font-bold text-[#1E58C8]">Dosage</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeMedicine(med.id)}
                        className="p-1 rounded-lg bg-rose-50 border border-rose-200"
                      >
                        <Trash2 size={15} color="#E11D48" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between pt-1 border-t border-slate-200/80">
                    <View className="bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      <Text className="text-[11px] font-bold text-teal-800">{med.dosage} • {med.frequency}</Text>
                    </View>
                    <Text className="text-[11px] font-bold text-slate-600">Duration: {med.duration}</Text>
                  </View>

                  {med.instructions && (
                    <Text className="text-[10px] text-slate-500 font-medium italic">
                      Instruction: {med.instructions}
                    </Text>
                  )}
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
              backgroundColor: '#F0FDF4',
              borderWidth: 1.5,
              borderColor: '#86EFAC',
              borderRadius: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Plus size={16} color="#00B39B" />
            <Text style={{ fontSize: 12, fontWeight: '800', color: '#00B39B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Add Medicine from Directory
            </Text>
          </TouchableOpacity>
        </View>

        {/* 5. DIAGNOSTIC LAB TESTS SECTION */}
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
                Diagnostic Investigations Ordered
              </Text>
            </View>
            <Badge label={`${prescribedTests.length} Tests`} variant="blue" size="sm" />
          </View>

          {prescribedTests.length === 0 ? (
            <View style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>No investigations ordered yet.</Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {prescribedTests.map((test) => (
                <View
                  key={test.id}
                  className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex-row justify-between items-center"
                >
                  <View className="flex-1 mr-2">
                    <Text className="text-xs font-bold text-slate-900" numberOfLines={1}>
                      {test.name}
                    </Text>
                    <Text className="text-[10px] text-slate-500">
                      {test.category} • Turnaround: {test.turnaroundTime}
                    </Text>
                  </View>
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <Badge
                      label={test.fastingRequired ? 'FASTING' : 'ROUTINE'}
                      variant={test.fastingRequired ? 'warning' : 'teal'}
                      size="sm"
                    />
                    <TouchableOpacity
                      onPress={() => removeTest(test.id)}
                      className="p-1 rounded-lg bg-rose-50 border border-rose-200"
                    >
                      <Trash2 size={14} color="#E11D48" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

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

        {/* 6. GENERAL ADVICE & DIET SECTION */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            padding: 16,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            gap: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            General Advice & Dietary Precautions
          </Text>
          <Input
            placeholder="e.g. Low salt diet (<2g/day), warm saline gargles, plenty of fluids, review after 7 days..."
            value={adviceNotes}
            onChangeText={setAdviceNotes}
            multiline
            numberOfLines={2}
          />
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View className="p-4 bg-white border-t border-slate-100 shadow-lg">
        <Button
          title={`Sign & Issue Digital Prescription (${prescribedMeds.length} Meds)`}
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
          <View
            style={{
              height: 48,
              backgroundColor: '#F8FAFC',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              gap: 8,
            }}
          >
            <Search size={16} color="#64748B" />
            <TextInput
              placeholder="Search brand (e.g. Dolo, Pan) or salt (e.g. Paracetamol)..."
              placeholderTextColor="#94A3B8"
              value={medSearch}
              onChangeText={setMedSearch}
              style={{ flex: 1, fontSize: 13, color: '#0F172A', fontWeight: '500' }}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {medCategories.map((cat) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedMedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl border ${
                  selectedMedCategory === cat
                    ? 'bg-[#00B39B] border-[#00B39B]'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: selectedMedCategory === cat ? '#FFFFFF' : '#475569',
                  }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 8 }}>
              {filteredMedicines.map((med) => (
                <TouchableOpacity
                  key={med.id}
                  onPress={() => addMedicineFromDirectory(med)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 16,
                    padding: 12,
                    gap: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>{med.name}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B' }}>{med.generic}</Text>
                    </View>
                    <View style={{ backgroundColor: '#00B39B', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>+ Prescribe</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Badge label={med.defaultFrequency} variant="teal" size="sm" />
                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>• Default: {med.defaultDuration}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 2. DOSAGE & TIMING CONFIGURATION MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={showDosageModal}
        onClose={() => setShowDosageModal(false)}
        title={activeEditingMed ? `Set Dosage: ${activeEditingMed.name}` : 'Configure Medication Dosage'}
      >
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 14, paddingVertical: 4 }}>
            {/* Timing */}
            <View style={{ gap: 6 }}>
              <Text className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Frequency / Timings (कितनी बार)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {TIMING_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setSelectedTiming(opt)}
                    activeOpacity={0.8}
                    className={`px-3 py-2 rounded-xl border ${
                      selectedTiming === opt
                        ? 'bg-[#1E58C8] border-[#1E58C8]'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: selectedTiming === opt ? '#FFFFFF' : '#334155',
                      }}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Food Instruction */}
            <View style={{ gap: 6 }}>
              <Text className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Meal Relationship (भोजन निर्देश)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {FOOD_INSTRUCTION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setSelectedFood(opt)}
                    activeOpacity={0.8}
                    className={`px-3 py-2 rounded-xl border ${
                      selectedFood === opt
                        ? 'bg-[#00B39B] border-[#00B39B]'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: selectedFood === opt ? '#FFFFFF' : '#334155',
                      }}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Duration */}
            <View style={{ gap: 6 }}>
              <Text className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Duration (दवा कितने दिन लेनी है)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setSelectedDuration(opt)}
                    activeOpacity={0.8}
                    className={`px-3 py-2 rounded-xl border ${
                      selectedDuration === opt
                        ? 'bg-[#1E58C8] border-[#1E58C8]'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: selectedDuration === opt ? '#FFFFFF' : '#334155',
                      }}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Dosage Form / Quantity */}
            <View style={{ gap: 6 }}>
              <Text className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Unit Dose (मात्रा)
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {DOSAGE_FORM_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setSelectedDosageForm(opt)}
                    activeOpacity={0.8}
                    className={`px-3 py-2 rounded-xl border ${
                      selectedDosageForm === opt
                        ? 'bg-purple-600 border-purple-600'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: selectedDosageForm === opt ? '#FFFFFF' : '#334155',
                      }}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Notes */}
            <Input
              label="Special Patient Advice (Optional)"
              placeholder="e.g. Take with warm water, avoid alcohol, don't crush..."
              value={customDosageInstruction}
              onChangeText={setCustomDosageInstruction}
            />

            <Button
              title="Save Dosage Configuration"
              onPress={saveDosageConfiguration}
              variant="teal"
              size="lg"
              icon={<Check size={18} color="#FFFFFF" />}
            />
          </View>
        </ScrollView>
      </Modal>

      {/* ========================================================================= */}
      {/* 3. DIAGNOSTIC TESTS DIRECTORY MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={showTestModal}
        onClose={() => setShowTestModal(false)}
        title="Diagnostic Tests Directory"
      >
        <View style={{ gap: 12, paddingVertical: 4 }}>
          <View
            style={{
              height: 48,
              backgroundColor: '#F8FAFC',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              gap: 8,
            }}
          >
            <Search size={16} color="#64748B" />
            <TextInput
              placeholder="Search test (e.g. CBC, ECG, Lipid, HbA1c)..."
              placeholderTextColor="#94A3B8"
              value={testSearch}
              onChangeText={setTestSearch}
              style={{ flex: 1, fontSize: 13, color: '#0F172A', fontWeight: '500' }}
            />
          </View>

          <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 8 }}>
              {filteredTests.map((test) => (
                <TouchableOpacity
                  key={test.id}
                  onPress={() => addTestFromDirectory(test)}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 16,
                    padding: 12,
                    gap: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}>{test.name}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B' }}>
                        {test.category} • {test.turnaroundTime}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#1E58C8', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>+ Order</Text>
                    </View>
                  </View>
                  <Badge
                    label={test.fastingRequired ? 'FASTING REQUIRED' : 'ROUTINE (NON-FASTING)'}
                    variant={test.fastingRequired ? 'warning' : 'teal'}
                    size="sm"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* 4. REDESIGNED OFFICIAL DIGITAL PRESCRIPTION PASS (Rx PAPER SHEET) */}
      {/* ========================================================================= */}
      <Modal
        visible={showPrescriptionPass}
        onClose={() => setShowPrescriptionPass(false)}
        title="Official Medical Prescription Pass (Rx)"
      >
        <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 14, paddingVertical: 4 }}>
            {downloadToast && (
              <View className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex-row items-center justify-center" style={{ gap: 6 }}>
                <CheckCircle2 size={16} color="#10B981" />
                <Text className="text-xs font-bold text-emerald-800">Prescription Saved to Downloads</Text>
              </View>
            )}

            {/* Official Indian Clinic Letterhead Paper Sheet */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: '#CBD5E1',
                padding: 16,
                gap: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              {/* Header: Clinic & Doctor Info */}
              <View className="pb-3 border-b-2 border-slate-900" style={{ gap: 4 }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Building2 size={18} color="#00B39B" />
                    <Text className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      HeartCare Specialty Clinic
                    </Text>
                  </View>
                  <Badge label="NMC / MCI VERIFIED" variant="teal" size="sm" />
                </View>

                <Text className="text-lg font-black text-slate-900 mt-1">{doctorName}</Text>
                <Text className="text-xs font-bold text-[#1E58C8]">
                  MBBS, MD (Medicine), DM (Cardiology) • Reg No: MCI-847291
                </Text>
                <Text className="text-[10px] text-slate-500">
                  Suite 402, Medical Enclave, Bandra West, Mumbai 400050 • Ph: +91 98200 12345
                </Text>
                <Text className="text-[10px] text-slate-400">
                  OPD Timings: 09:30 AM – 01:30 PM, 05:00 PM – 08:30 PM (Mon – Sat)
                </Text>
              </View>

              {/* Patient & Date Meta Strip */}
              <View className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex-row justify-between items-center">
                <View>
                  <Text className="text-[10px] font-bold text-slate-400 uppercase">Patient Details</Text>
                  <Text className="text-sm font-black text-slate-900">
                    {apt?.patientName || 'Aarav Mehta'}
                  </Text>
                  <Text className="text-[11px] text-slate-500 font-semibold">
                    Age: 32 Yrs • Male • Blood: O+ • Token #02
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase">Prescription Date</Text>
                  <Text className="text-xs font-bold text-slate-900">
                    {new Date().toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text className="text-[10px] font-mono font-bold text-teal-700 mt-0.5">
                    FYD-RX-847291
                  </Text>
                </View>
              </View>

              {/* Clinical Diagnosis */}
              {assessment ? (
                <View className="bg-blue-50/70 p-3 rounded-xl border border-blue-200">
                  <Text className="text-[10px] font-black text-[#1E58C8] uppercase tracking-wider">
                    Clinical Diagnosis & Impression
                  </Text>
                  <Text className="text-xs font-black text-slate-900 mt-0.5">{assessment}</Text>
                </View>
              ) : null}

              {/* Prominent Rx Latin Symbol & Medicines Table */}
              <View style={{ gap: 8 }}>
                <View className="flex-row items-center justify-between pb-1 border-b border-slate-200">
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Text className="text-2xl font-serif font-black text-slate-900 leading-none">℞</Text>
                    <Text className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Prescribed Medications ({prescribedMeds.length})
                    </Text>
                  </View>
                  <Text className="text-[10px] text-slate-400 font-bold">Standard Indian Dosage</Text>
                </View>

                {prescribedMeds.length === 0 ? (
                  <Text className="text-xs text-slate-400 italic py-2">No medications prescribed.</Text>
                ) : (
                  prescribedMeds.map((m, idx) => (
                    <View
                      key={idx}
                      className="bg-slate-50 p-3 rounded-xl border border-slate-200/90"
                      style={{ gap: 4 }}
                    >
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1 mr-2">
                          <Text className="text-xs font-black text-slate-900">
                            {idx + 1}. {m.name}
                          </Text>
                          <Text className="text-[10px] text-slate-500">{m.generic}</Text>
                        </View>
                        <Badge label={m.frequency} variant="teal" size="sm" />
                      </View>

                      <View className="flex-row justify-between items-center text-slate-600 pt-1 border-t border-slate-100">
                        <Text className="text-[11px] font-bold text-slate-700">
                          Dose: {m.dosage} • Duration: {m.duration}
                        </Text>
                      </View>

                      {m.instructions ? (
                        <Text className="text-[10px] text-teal-800 font-medium bg-teal-50/80 p-1.5 rounded-md border border-teal-100">
                          {m.instructions}
                        </Text>
                      ) : null}
                    </View>
                  ))
                )}
              </View>

              {/* Prescribed Tests */}
              {prescribedTests.length > 0 && (
                <View style={{ gap: 6 }}>
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Activity size={15} color="#1E58C8" />
                    <Text className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Investigations Ordered ({prescribedTests.length})
                    </Text>
                  </View>

                  {prescribedTests.map((t, idx) => (
                    <View
                      key={idx}
                      className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex-row justify-between items-center"
                    >
                      <Text className="text-xs font-bold text-slate-900 flex-1 mr-2" numberOfLines={1}>
                        • {t.name}
                      </Text>
                      <Text className="text-[10px] font-bold text-[#1E58C8]">
                        {t.fastingRequired ? 'Fasting Required' : 'Routine'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* General Advice */}
              {adviceNotes ? (
                <View className="bg-amber-50/80 p-3 rounded-xl border border-amber-200" style={{ gap: 2 }}>
                  <Text className="text-[10px] font-black text-amber-900 uppercase tracking-wider">
                    Doctor's Advice & Lifestyle Precautions
                  </Text>
                  <Text className="text-xs text-amber-800 leading-5">{adviceNotes}</Text>
                </View>
              ) : null}

              {/* Digital Authentication & Council Seal */}
              <View className="bg-emerald-50/90 p-3.5 rounded-2xl border border-emerald-200 flex-row items-center justify-between">
                <View className="flex-row items-center" style={{ gap: 8 }}>
                  <ShieldCheck size={24} color="#10B981" />
                  <View>
                    <Text className="text-xs font-black text-emerald-900">
                      Digitally Signed by {doctorName}
                    </Text>
                    <Text className="text-[10px] text-emerald-700">
                      National Medical Commission Reg No: MCI-847291
                    </Text>
                  </View>
                </View>
                <Text className="text-[10px] font-bold text-emerald-800 font-mono">VERIFIED</Text>
              </View>

              {/* Action Buttons: WhatsApp, PDF, Done */}
              <View className="flex-row gap-2 pt-1 border-t border-slate-200">
                <TouchableOpacity
                  onPress={handleDownloadPdf}
                  activeOpacity={0.8}
                  className="flex-1 bg-slate-100 py-3 rounded-2xl flex-row items-center justify-center border border-slate-200"
                  style={{ gap: 6 }}
                >
                  <Download size={16} color="#0F172A" />
                  <Text className="text-xs font-black text-slate-800">Save PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShareRx}
                  activeOpacity={0.8}
                  className="flex-1 bg-teal-50 py-3 rounded-2xl flex-row items-center justify-center border border-teal-200"
                  style={{ gap: 6 }}
                >
                  <Share2 size={16} color="#00B39B" />
                  <Text className="text-xs font-black text-[#00B39B]">Share WhatsApp</Text>
                </TouchableOpacity>
              </View>

              <Button
                title="Finish & Return to OPD Queue"
                onPress={() => {
                  setShowPrescriptionPass(false);
                  router.replace('/(doctor)/home');
                }}
                variant="primary"
                size="lg"
              />
            </View>
          </View>
        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}
