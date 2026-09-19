/**
 * FiYDOC - Doctor Consultation & Step Carousel Prescription (1:1 Google Stitch)
 *
 * Implements the full doctor consultation experience:
 * 1. Active Consultation & Patient History View:
 *    - Running live timer resetting for every fresh patient with quick reset button
 *    - Patient Identity Hero Card (Aarav Mehta, 38 M, B+, UHID: 8021-9811)
 *    - Editable Vitals Row (BP, Pulse, Temp, SpO2, Resp Rate, Weight) with dedicated edit modal
 *    - Editable Chief Complaint with clinical ghost autocompletion
 *    - Editable Physical observations and clinical impression
 *    - Segmented Tabs: Today's Visit, Past History, Lab Reports
 *    - Bottom Action Bar: Audio Dictation toggle, Freehand MS Paint Style Drawing Notepad, Proceed to Prescription
 * 2. 5-Step Prescription Builder Deck:
 *    - Step 1: Diagnosis (ICD-10) with complete medical catalog recommendations & search
 *    - Step 2: Prescribed Medications with dosage, frequency, timing & duration modal editor
 *    - Step 3: Labs & Imaging with comprehensive diagnostics library
 *    - Step 4: Advice, Lifestyle checklist & Emergency warning autocompletion
 *    - Step 5: Digital Prescription Summary, EHR SVG signature & multi-channel delivery
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Image,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { doctorService } from '@/services/doctorService';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Edit3,
  ArrowRight,
  Stethoscope,
  Calendar,
  AlertTriangle,
  History,
  X,
  Plus,
  Trash2,
  Clock,
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
  Share2,
  FileCheck,
  MessageCircle,
  Activity,
  Sliders,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Pill,
  ExternalLink,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useHealthStore } from '@/store/useHealthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAppointmentDetailQuery } from '@/hooks/queries/useAppointmentsQuery';
import { healthService } from '@/services/healthService';
import { consultationService } from '@/services/consultationService';

import { BorderRadius, Shadows, Spacing, StitchColors } from '@/constants/theme';
import { LoadingDialog } from '@/components/ui/LoadingDialog';
import {
  MEDICAL_DIAGNOSES,
  MEDICATIONS_CATALOG,
  LAB_TESTS_CATALOG,
  LIFESTYLE_ADVICE_PRESETS,
  type MedicationCatalogItem,
} from '@/constants/medicalCatalog';
import SmartMedicalTextInput from '@/components/doctor/SmartMedicalTextInput';
import ClinicalDrawingNotepad from '@/components/doctor/ClinicalDrawingNotepad';
import { isNegationAllergy } from '@/utils/allergyNormalizer';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { DocumentViewerModal } from '@/components/ui/DocumentViewerModal';



interface PrescriptionItem {
  id: string;
  name: string;
  generic: string;
  dosage: string;
  frequency: string;
  duration: string;
  timing: string;
  instructions: string;
}

export default function DoctorConsultationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id?: string }>();
  const { colors, isDark } = useAppTheme();

  const appointmentId = params.id || '';
  const { appointments, updateAppointmentStatus } = useAppointmentStore();
  const { user } = useAuthStore();
  const { data: remoteApt, isLoading: isAptLoading } = useAppointmentDetailQuery(appointmentId);
  const currentApt = remoteApt || appointments.find((a) => a.id === appointmentId);

  const { data: pastConsultations = [], isLoading: isPastConsultationsLoading } = useQuery({
    queryKey: ['patient-past-consultations', currentApt?.patientId],
    queryFn: () =>
      currentApt?.patientId
        ? doctorService.getPatientPastConsultations(currentApt.patientId)
        : Promise.resolve([]),
    enabled: Boolean(currentApt?.patientId),
  });

  // Determine next patient in today's queue (same doctor, confirmed/checked_in, future in the list)
  const nextPatient = (() => {
    const today = new Date().toISOString().slice(0, 10);
    const activeStatuses = ['confirmed', 'checked_in', 'upcoming', 'pending'];
    const todayQueue = appointments
      .filter((a) => a.doctorId === currentApt?.doctorId && a.date?.slice(0, 10) === today && activeStatuses.includes(a.status) && a.id !== appointmentId)
      .sort((a, b) => a.time.localeCompare(b.time));
    return todayQueue[0] || null;
  })();

  // 1. ACTIVE SESSION TIMER — Resets for every patient and when opening fresh
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [exitConfirmVisible, setExitConfirmVisible] = useState(false);

  const handleBackPress = () => {
    const hasUnsavedWork =
      (medications && medications.length > 0) ||
      (diagnoses && diagnoses.length > 0) ||
      (chiefComplaint && chiefComplaint.trim().length > 0) ||
      (physicalObservation && physicalObservation.trim().length > 0);

    if (hasUnsavedWork) {
      setExitConfirmVisible(true);
    } else {
      if (router.canGoBack()) router.back();
      else router.replace('/(doctor)/(tabs)/directory');
    }
  };

  useEffect(() => {
    setSessionSeconds(0);
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [appointmentId]);

  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleResetTimer = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSessionSeconds(0);
  };

  // 2. EDITABLE VITALS — Clean baseline
  const [vitals, setVitals] = useState({
    bpSystolic: '',
    bpDiastolic: '',
    pulse: '',
    temp: '',
    spO2: '',
    respRate: '',
    weight: '',
  });
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [tempVitals, setTempVitals] = useState(vitals);

  const handleOpenVitalsModal = () => {
    setTempVitals(vitals);
    setShowVitalsModal(true);
  };

  const handleSaveVitals = () => {
    setVitals(tempVitals);
    setShowVitalsModal(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // 3. EDITABLE CHIEF COMPLAINT & OBSERVATIONS — Clean baseline initialized from patient symptoms
  const [chiefComplaint, setChiefComplaint] = useState(
    currentApt?.symptoms?.length ? currentApt.symptoms.join(', ') : (currentApt?.notes || '')
  );
  const [clinicalImpression, setClinicalImpression] = useState('');
  const [physicalObservation, setPhysicalObservation] = useState('');

  // Attached Clinical Examination Images (Lesions, Throat, Radiographs) — clean by default
  const [clinicalImages, setClinicalImages] = useState<
    Array<{ id: string; title: string; uri: string; date: string }>
  >([]);
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<{ title: string; uri: string } | null>(null);
  const [customImageTitle, setCustomImageTitle] = useState('');
  const [customImageUri, setCustomImageUri] = useState('');
  const [showAttachmentViewer, setShowAttachmentViewer] = useState(false);

  // Dedicated Patient Clinical History — clean by default
  const [patientClinicalHistory, setPatientClinicalHistory] = useState('');

  // Allergies — clean by default (no pre-seeded severe Penicillin)
  const [allergies, setAllergies] = useState<Array<{ id: string; name: string; isSevere: boolean }>>([]);
  const [newAllergyInput, setNewAllergyInput] = useState('');
  const [showAddAllergy, setShowAddAllergy] = useState(false);

  // Chronic conditions — clean by default
  const [chronicConditions, setChronicConditions] = useState<
    Array<{ id: string; name: string; detail: string; status: string }>
  >([]);

  // Sync patient allergies, conditions & symptoms from appointment booking data
  useEffect(() => {
    if (!currentApt) return;

    // 0. Auto-populate Chief Complaint if still empty
    setChiefComplaint((prev) => {
      if (prev && prev.trim().length > 0) return prev;
      if (currentApt.symptoms && currentApt.symptoms.length > 0) {
        return currentApt.symptoms.join(', ');
      }
      if (currentApt.notes) {
        const clean = currentApt.notes.replace(/\[[^\]]*\]/g, '').trim();
        return clean;
      }
      return '';
    });

    // 1. Load patient recorded allergies from appointment or notes
    const allergyList: string[] = [];
    if (currentApt.patientAllergies && Array.isArray(currentApt.patientAllergies)) {
      allergyList.push(...currentApt.patientAllergies);
    }
    const notesAllergyMatch = currentApt.notes?.match(/\[Allergies:\s*([^\]]+)\]/i);
    if (notesAllergyMatch && notesAllergyMatch[1]) {
      notesAllergyMatch[1].split(',').forEach((s) => allergyList.push(s.trim()));
    }
    const cleanAllergies = Array.from(new Set(allergyList.filter(Boolean)));
    if (cleanAllergies.length > 0) {
      setAllergies((prev) => {
        if (prev.length > 0) return prev;
        return cleanAllergies.map((name, i) => ({
          id: `al-${i}`,
          name,
          isSevere: name.toLowerCase().includes('severe') || name.toLowerCase().includes('penicillin'),
        }));
      });
    }

    // 2. Load chronic conditions
    const conditionList: string[] = [];
    if (currentApt.patientConditions && Array.isArray(currentApt.patientConditions)) {
      conditionList.push(...currentApt.patientConditions);
    }
    const notesCondMatch = currentApt.notes?.match(/\[Conditions:\s*([^\]]+)\]/i);
    if (notesCondMatch && notesCondMatch[1]) {
      notesCondMatch[1].split(',').forEach((s) => conditionList.push(s.trim()));
    }
    const cleanConditions = Array.from(new Set(conditionList.filter(Boolean)));
    if (cleanConditions.length > 0) {
      setChronicConditions((prev) => {
        if (prev.length > 0) return prev;
        return cleanConditions.map((name, i) => ({
          id: `cond-${i}`,
          name,
          detail: 'Patient Reported',
          status: 'Active',
        }));
      });
    }
  }, [currentApt]);

  // Consultation Tabs
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'labs'>('today');


  // Freehand Drawing Notepad Modal
  const [showDrawingModal, setShowDrawingModal] = useState(false);
  const [savedNotesCount, setSavedNotesCount] = useState(0);

  // Prescription builder state
  const [rxPadVisible, setRxPadVisible] = useState(false);
  const [rxStep, setRxStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Clinical diagnoses — clean by default
  const [diagnoses, setDiagnoses] = useState<Array<{ code: string; name: string; priority: string }>>([]);
  const [diagSearch, setDiagSearch] = useState('');
  const [selectedDiagCategory, setSelectedDiagCategory] = useState<string>('All');

  // Medications — clean by default (no pre-loaded Augmentin)
  const [medications, setMedications] = useState<PrescriptionItem[]>([]);
  const [medSearch, setMedSearch] = useState('');
  const [editingMed, setEditingMed] = useState<PrescriptionItem | null>(null);
  const [showMedModal, setShowMedModal] = useState(false);

  // Lab Tests — clean by default
  const [labTests, setLabTests] = useState<string[]>([]);
  const [testSearch, setTestSearch] = useState('');
  const [customTestInput, setCustomTestInput] = useState('');

  // Lifestyle advice & emergency warning
  const [lifestyleInstructions, setLifestyleInstructions] = useState([
    { id: 'l1', text: 'Drink warm water regularly (2.5 - 3 Liters)', checked: true },
    { id: 'l2', text: 'Avoid cold exposure & chilled fluids', checked: true },
    { id: 'l3', text: 'Steam inhalation twice daily (5–10 mins)', checked: true },
  ]);
  const [followUpDays, setFollowUpDays] = useState('5 Days (18 March)');
  const [emergencyWarning, setEmergencyWarning] = useState(
    'Seek immediate emergency medical attention if shortness of breath, severe chest pain or high fever (>102°F) develops.'
  );

  // Delivery toggles
  const [deliveryApp, setDeliveryApp] = useState(true);
  const [deliveryWhatsapp, setDeliveryWhatsapp] = useState(true);
  const [deliverySms, setDeliverySms] = useState(false);

  // Signing state
  const [isSigning, setIsSigning] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);


  const handleAddCustomDiagnosis = (name: string, code = 'Unspecified') => {
    if (!name.trim()) return;
    if (diagnoses.some((d) => d.name.toLowerCase() === name.toLowerCase())) return;
    setDiagnoses([
      ...diagnoses,
      { code, name: name.trim(), priority: diagnoses.length === 0 ? 'Primary' : 'Secondary' },
    ]);
    setDiagSearch('');
  };

  const handleToggleDiagPriority = (code: string) => {
    setDiagnoses(
      diagnoses.map((d) =>
        d.code === code ? { ...d, priority: d.priority === 'Primary' ? 'Secondary' : 'Primary' } : d
      )
    );
  };

  const handleRemoveDiag = (code: string) => {
    setDiagnoses(diagnoses.filter((d) => d.code !== code));
  };

  const handleAddMedicationFromCatalog = (item: MedicationCatalogItem) => {
    const newMed: PrescriptionItem = {
      id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: item.name,
      generic: item.generic,
      dosage: item.defaultDosage,
      frequency: item.defaultFrequency,
      duration: item.defaultDuration,
      timing: item.defaultTiming,
      instructions: item.defaultInstructions,
    };
    setMedications([...medications, newMed]);
    setMedSearch('');
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSaveMedicationEdit = () => {
    if (!editingMed) return;
    if (!editingMed.name?.trim()) {
      Alert.alert('Medicine Name Required', 'Please enter a medicine name before saving.');
      return;
    }
    const cleanMed = {
      ...editingMed,
      name: editingMed.name.trim(),
      dosage: editingMed.dosage?.trim() || '1 - 0 - 1',
      timing: editingMed.timing?.trim() || 'After meals',
      duration: editingMed.duration?.trim() || '5 Days',
      instructions: editingMed.instructions?.trim() || 'Complete course',
      frequency: editingMed.frequency?.trim() || 'Twice daily',
    };
    const exists = medications.some((m) => m.id === cleanMed.id);
    if (exists) {
      setMedications(medications.map((m) => (m.id === cleanMed.id ? cleanMed : m)));
    } else {
      setMedications([...medications, cleanMed]);
    }
    setShowMedModal(false);
    setEditingMed(null);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSignAndSend = async () => {
    if (!medications || medications.length === 0) {
      Alert.alert('No Medications', 'Please add at least one medication before signing the prescription.');
      return;
    }

    const invalidMed = medications.find((m) => !m.dosage?.trim() || !m.frequency?.trim());
    if (invalidMed) {
      Alert.alert(
        'Incomplete Medication Details',
        `Please provide a valid dosage and frequency for "${invalidMed.name || 'medication'}" before signing.`
      );
      return;
    }

    if (!diagnoses || diagnoses.length === 0) {
      Alert.alert('No Diagnosis', 'Please add a diagnosis before completing the consultation.');
      return;
    }

    setIsSigning(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const doctorName = user?.name ? `Dr. ${user.name}` : (currentApt?.doctorName || 'Doctor');
    const clinicName = currentApt?.hospital || user?.clinicName || null;

    try {
      // Step 1: Complete the consultation on the server — this transitions appointment to COMPLETED
      // and returns the authoritative consultation record with its real `id`.
      const assessmentText = `Diagnosis: ${diagnoses.map((d) => `${d.name} (${d.code})`).join(', ')}. ${chiefComplaint}`.trim();

      const consultation = await consultationService.upsert({
        appointmentId,
        chiefComplaint: chiefComplaint || undefined,
        symptoms: currentApt?.symptoms || [],
        observations: physicalObservation || undefined,
        assessment: assessmentText,
        completeNow: true,
      });

      // Step 2: Issue the prescription using the authoritative server consultation ID
      const diagnosisString = diagnoses.map((d) => `${d.name} (${d.code})`).join(', ');

      const serverRx = await healthService.createPrescription({
        consultationId: consultation.id,
        diagnosis: diagnosisString,
        doctorNotes: clinicalImpression || chiefComplaint || assessmentText,
        followUpInstructions: `Review after ${followUpDays} in clinic. ${emergencyWarning}`,
        vitals: {
          bpSystolic: vitals.bpSystolic,
          bpDiastolic: vitals.bpDiastolic,
          pulse: vitals.pulse,
          temp: vitals.temp,
          weight: vitals.weight,
          spO2: vitals.spO2,
        },
        labTests: labTests.map((t) => ({ name: t })),
        tests: labTests.map((t) => ({ name: t })),
        lifestyleInstructions: lifestyleInstructions.filter((l) => l.checked).map((l) => l.text),
        medicines: medications.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          durationDays: parseInt(m.duration?.replace(/\D/g, '') || '5', 10) || 5,
          instructions: `${m.timing} • ${m.instructions}`,
        })),
      });

      // Step 3: Reflect the completed state in local stores
      const newPrescription = {
        id: serverRx.id,
        consultationId: consultation.id,
        patientId: currentApt?.patientId ?? '',
        patientName: currentApt?.patientName || 'Patient',
        doctorId: consultation.doctorId,
        doctorName,
        doctorSpecialty: user?.specialization || 'General Medicine',
        doctorMciNumber: (user as any)?.licenseNumber || undefined,
        doctorQualifications: user?.qualification || (user as any)?.qualifications || [],
        clinicName: clinicName ?? undefined,
        clinicAddress: (user as any)?.clinicAddress || undefined,
        chiefComplaint: chiefComplaint || undefined,
        symptoms: currentApt?.symptoms || [],
        observations: physicalObservation || undefined,
        diagnosis: diagnosisString,
        doctorNotes: chiefComplaint,
        emergencyWarning: emergencyWarning || undefined,
        followUpInstructions: `Review after ${followUpDays} in clinic. ${emergencyWarning}`,
        vitals: {
          bpSystolic: vitals.bpSystolic,
          bpDiastolic: vitals.bpDiastolic,
          pulse: vitals.pulse,
          temp: vitals.temp,
          weight: vitals.weight,
          spo2: vitals.spO2,
        },
        tests: labTests.map((t) => ({ id: t, name: t })),
        lifestyleInstructions: lifestyleInstructions.filter((l) => l.checked).map((l) => l.text),
        verificationCode: serverRx.verificationCode,
        createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        signedAt: new Date().toISOString(),
        medicines: medications.map((m) => ({
          id: m.id,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          durationDays: parseInt(m.duration?.replace(/\D/g, '') || '5', 10) || 5,
          instructions: `${m.timing} • ${m.instructions}`,
        })),
      };

      useHealthStore.getState().addPrescription(newPrescription);
      updateAppointmentStatus(appointmentId, 'completed');

      // Invalidate queries so counters, queues, and patient screens update immediately
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] });
      queryClient.invalidateQueries({ queryKey: ['health-records'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Notify patient — prescription dispatched
      useNotificationStore.getState().addNotification({
        recipientId: currentApt?.patientId,
        recipientRole: 'patient',
        title: '📝 Prescription Dispatched',
        message: `${doctorName} has sent your official digital prescription. View it in Health Records.`,
        type: 'prescription',
        link: '/(patient)/(tabs)/health',
      });

      setIsSigning(false);
      setSignSuccess(true);

      setTimeout(() => {
        setRxPadVisible(false);
        setSignSuccess(false);
        // Navigate back to Patient Roster as requested
        router.replace('/(doctor)/(tabs)/directory');
      }, 1500);
    } catch (err: any) {
      setIsSigning(false);
      const message = err?.message || 'Failed to complete consultation or issue prescription.';
      Alert.alert('Error', message);
    }
  };

  // Filter diagnoses
  const filteredDiagnoses = MEDICAL_DIAGNOSES.filter((d) => {
    const matchesCategory = selectedDiagCategory === 'All' || d.category === selectedDiagCategory;
    const matchesSearch =
      !diagSearch ||
      d.name.toLowerCase().includes(diagSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(diagSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Filter medicines - show top recommendations if medSearch is empty
  const filteredMeds = medSearch.trim()
    ? MEDICATIONS_CATALOG.filter((m) =>
        m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
        m.generic.toLowerCase().includes(medSearch.toLowerCase()) ||
        m.category.toLowerCase().includes(medSearch.toLowerCase())
      )
    : MEDICATIONS_CATALOG.slice(0, 8);

  // Filter tests
  const filteredTests = LAB_TESTS_CATALOG.filter((t) =>
    testSearch ? t.name.toLowerCase().includes(testSearch.toLowerCase()) : true
  );

  if (!isAptLoading && !currentApt) {
    return (
      <SafeAreaView style={[styles.safeArea, { alignItems: 'center', justifyContent: 'center', padding: 24 }]} edges={['top']}>
        <Stethoscope size={48} color={StitchColors.outline} style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' }}>
          Appointment Not Found
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
          This consultation record is not active or could not be loaded from the patient queue.
        </Text>
        <Pressable
          style={{ backgroundColor: StitchColors.primaryContainer, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          onPress={() => router.replace('/(doctor)/(tabs)/directory')}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>Return to Patient Roster</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 1. Top Bar: Back, "Consultation", Active Timer & Doctor Avatar */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable
          onPress={handleBackPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.backBtn, { backgroundColor: colors.backgroundElement }]}
        >
          <ArrowLeft size={18} color={colors.text} strokeWidth={2.2} />
        </Pressable>

        <View style={styles.headerCenterCol}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Consultation</Text>
          <View style={styles.timerBadge}>
            <View style={styles.pulseDot} />
            <Text style={styles.activeText}>ACTIVE</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={[styles.timerDigit, { color: colors.textSecondary }]}>{formatTimer(sessionSeconds)}</Text>
            <Pressable
              onPress={handleResetTimer}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              style={styles.resetTimerBtn}
            >
              <RotateCcw size={11} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.headerDoctorImg} />
        ) : (
          <View style={[styles.headerDoctorImg, { backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748b' }}>{user?.name?.charAt(0) || 'D'}</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Patient Identity & Clinical Summary Hero Card */}
        <Animated.View
          entering={FadeInUp.delay(50).duration(350)}
          style={[styles.patientHeroCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          {/* Identity Header */}
          <View style={styles.patientInfoRow}>
            {currentApt?.patientAvatar ? (
              <Image source={{ uri: currentApt.patientAvatar }} style={styles.patientAvatar} />
            ) : (
              <View style={[styles.patientAvatar, { backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#64748b' }}>{(currentApt?.patientName || 'P').charAt(0)}</Text>
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[styles.heroPatientName, { color: colors.text }]}>
                  {currentApt?.patientName || 'Patient'}
                </Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {(currentApt as any)?.age ? (
                    <View style={[styles.demogBadge, { backgroundColor: colors.backgroundElement }]}>
                      <Text style={[styles.demogText, { color: colors.textSecondary }]}>{(currentApt as any).age}</Text>
                    </View>
                  ) : null}
                  {(currentApt as any)?.bloodGroup ? (
                    <View style={[styles.demogBadge, { backgroundColor: '#DBEAFE' }]}>
                      <Text style={[styles.demogText, { color: StitchColors.primaryContainer, fontWeight: '800' }]}>{(currentApt as any).bloodGroup}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              <Text style={[styles.uhidText, { color: colors.textSecondary }]}>
                {(currentApt as any)?.uhid
                  ? `UHID: ${(currentApt as any).uhid}${(currentApt as any)?.mrn ? ` • MRN: ${(currentApt as any).mrn}` : ''}`
                  : currentApt?.id
                    ? `Ref: ${currentApt.id}`
                    : 'No ID on file'}
              </Text>
            </View>
          </View>

          {/* EDITABLE VITALS GRID — Clickable with edit modal */}
          <View style={styles.vitalsHeaderRow}>
            <Text style={[styles.vitalsSectionTitle, { color: colors.textSecondary }]}>BASELINE CLINICAL VITALS</Text>
            <Pressable onPress={handleOpenVitalsModal} style={styles.editVitalsBtn}>
              <Edit3 size={12} color={StitchColors.primaryContainer} />
              <Text style={styles.editVitalsBtnText}>Edit Vitals</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={handleOpenVitalsModal}
            style={[styles.vitalsGrid, { backgroundColor: colors.backgroundElement }]}
          >
            <View style={styles.vitalCol}>
              <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>BP</Text>
              <Text style={[styles.vitalVal, { color: StitchColors.secondaryContainer }]}>
                {vitals.bpSystolic}/{vitals.bpDiastolic}
              </Text>
            </View>
            <View style={[styles.vitalCol, styles.vitalBorderLeft, { borderLeftColor: colors.border }]}>
              <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>PULSE</Text>
              <Text style={[styles.vitalVal, { color: colors.text }]}>
                {vitals.pulse} <Text style={styles.vitalUnit}>bpm</Text>
              </Text>
            </View>
            <View style={[styles.vitalCol, styles.vitalBorderLeft, { borderLeftColor: colors.border }]}>
              <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>TEMP</Text>
              <Text style={[styles.vitalVal, { color: colors.text }]}>
                {vitals.temp}<Text style={styles.vitalUnit}>°F</Text>
              </Text>
            </View>
            <View style={[styles.vitalCol, styles.vitalBorderLeft, { borderLeftColor: colors.border }]}>
              <Text style={[styles.vitalLabel, { color: colors.textMuted }]}>SPO₂</Text>
              <Text style={[styles.vitalVal, { color: StitchColors.secondaryContainer }]}>
                {vitals.spO2}<Text style={styles.vitalUnit}>%</Text>
              </Text>
            </View>
          </Pressable>

          {/* Additional Vitals summary row */}
          <View style={styles.extraVitalsRow}>
            <Text style={[styles.extraVitalText, { color: colors.textSecondary }]}>
              Resp Rate: <Text style={{ color: colors.text, fontWeight: '700' }}>{vitals.respRate} /min</Text>
            </Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={[styles.extraVitalText, { color: colors.textSecondary }]}>
              Weight: <Text style={{ color: colors.text, fontWeight: '700' }}>{vitals.weight} kg</Text>
            </Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={[styles.extraVitalText, { color: colors.textSecondary }]}>
              BMI: <Text style={{ color: colors.text, fontWeight: '700' }}>23.9 (Normal)</Text>
            </Text>
          </View>

          {/* EDITABLE CHIEF COMPLAINT with Ghost Medical Autocomplete */}
          <View style={[styles.complaintBox, { borderTopColor: colors.border }]}>
            <SmartMedicalTextInput
              label="Chief Complaint (Click to edit)"
              value={chiefComplaint}
              onChangeText={setChiefComplaint}
              placeholder="e.g. Cough and cold with fever for 3 days..."
              multiline
              numberOfLines={2}
              quickSuggestions={[
                'Persistent dry cough for 4 days',
                'Mild chest tightness on exertion',
                'Sore throat & painful swallowing',
                'No recorded fever',
              ]}
            />

            {/* Allergies tags with Add/Remove action */}
            <View style={styles.allergiesSection}>
              <View style={styles.allergiesHeader}>
                <Text style={[styles.allergiesLabel, { color: colors.textSecondary }]}>RECORDED ALLERGIES:</Text>
                <Pressable
                  onPress={() => setShowAddAllergy(!showAddAllergy)}
                  style={styles.addAllergyBtn}
                >
                  <Plus size={12} color={StitchColors.primaryContainer} />
                  <Text style={styles.addAllergyBtnText}>Add</Text>
                </Pressable>
              </View>

              <View style={styles.allergiesRow}>
                {allergies.length === 0 && (
                  <Text style={{ fontSize: 13, color: colors.textMuted, fontStyle: 'italic', paddingVertical: 2 }}>
                    0 allergies
                  </Text>
                )}
                {allergies.map((al) => (
                  <View
                    key={al.id}
                    style={[
                      styles.allergyTag,
                      { backgroundColor: al.isSevere ? '#FEE2E2' : colors.backgroundElement },
                    ]}
                  >
                    {al.isSevere && <AlertTriangle size={11} color={StitchColors.error} />}
                    <Text style={[styles.allergyTagText, al.isSevere && { color: StitchColors.error }]}>
                      {al.name}
                    </Text>
                    <Pressable
                      onPress={() => setAllergies(allergies.filter((x) => x.id !== al.id))}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                      <X size={12} color={al.isSevere ? StitchColors.error : colors.textMuted} />
                    </Pressable>
                  </View>
                ))}
              </View>

              {showAddAllergy && (
                <View style={styles.addAllergyInputRow}>
                  <TextInput
                    value={newAllergyInput}
                    onChangeText={setNewAllergyInput}
                    placeholder="Type allergy (e.g. Sulfa, NSAIDs)..."
                    placeholderTextColor={colors.textMuted}
                    style={[styles.smallInput, { color: colors.text, borderColor: colors.border }]}
                  />
                  <Pressable
                    onPress={() => {
                      const trimmed = newAllergyInput.trim();
                      if (trimmed) {
                        if (!isNegationAllergy(trimmed)) {
                          setAllergies([
                            ...allergies,
                            { id: `a_${Date.now()}`, name: trimmed, isSevere: false },
                          ]);
                        }
                        setNewAllergyInput('');
                        setShowAddAllergy(false);
                      }
                    }}
                    style={[styles.smallAddBtn, { backgroundColor: StitchColors.primaryContainer }]}
                  >
                    <Check size={14} color="#FFFFFF" />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* 3. Segmented Navigation Tabs */}
        <View style={[styles.tabsWrap, { backgroundColor: colors.backgroundElement }]}>
          <Pressable
            onPress={() => setActiveTab('today')}
            style={[styles.segTab, activeTab === 'today' && [styles.segTabActive, { backgroundColor: colors.card }]]}
          >
            <Text style={[styles.segTabText, activeTab === 'today' && { color: StitchColors.primaryContainer, fontWeight: '700' }]}>
              Today's Visit
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('history')}
            style={[styles.segTab, activeTab === 'history' && [styles.segTabActive, { backgroundColor: colors.card }]]}
          >
            <Text style={[styles.segTabText, activeTab === 'history' && { color: StitchColors.primaryContainer, fontWeight: '700' }]}>
              Past History
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('labs')}
            style={[styles.segTab, activeTab === 'labs' && [styles.segTabActive, { backgroundColor: colors.card }]]}
          >
            <Text style={[styles.segTabText, activeTab === 'labs' && { color: StitchColors.primaryContainer, fontWeight: '700' }]}>
              Lab Reports
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: Today's Visit */}
        {activeTab === 'today' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.tabContentBlock}>
            {/* Clinical Examination (Formerly Physical Observations) — Directly Editable + Image Attachments */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Stethoscope size={16} color={StitchColors.secondaryContainer} />
                  <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Clinical Examination</Text>
                </View>
                <Pressable
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setShowAddImageModal(true);
                  }}
                  style={[styles.addImageBtn, { backgroundColor: StitchColors.primaryContainer }]}
                  accessibilityRole="button"
                  accessibilityLabel="Add clinical examination photo"
                >
                  <Camera size={13} color="#FFFFFF" />
                  <Text style={styles.addImageBtnText}>+ Add Image</Text>
                </Pressable>
              </View>

              <SmartMedicalTextInput
                label="Chest & Respiratory Auscultation / General Exam"
                value={physicalObservation}
                onChangeText={setPhysicalObservation}
                placeholder="Type clinical examination findings..."
                multiline
                numberOfLines={3}
                quickSuggestions={[
                  'Clear bilateral vesicular breath sounds',
                  'Mild bronchial wheeze on forced expiration',
                  'S1, S2 audible, no murmurs',
                  'Throat mild pharyngeal erythema',
                ]}
              />

              {/* Attached Clinical Examination Images Gallery */}
              {clinicalImages.length > 0 && (
                <View style={styles.clinicalImagesContainer}>
                  <Text style={[styles.clinicalImagesSubhead, { color: colors.textSecondary }]}>
                    Attached Clinical Photos & Imaging ({clinicalImages.length})
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.clinicalImagesScroll}
                  >
                    {clinicalImages.map((img) => (
                      <View
                        key={img.id}
                        style={[
                          styles.clinicalImageCard,
                          { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                        ]}
                      >
                        <Pressable onPress={() => setSelectedPreviewImage(img)}>
                          <Image source={{ uri: img.uri }} style={styles.clinicalImageThumb} />
                        </Pressable>
                        <View style={styles.clinicalImageMeta}>
                          <Text numberOfLines={1} style={[styles.clinicalImageTitle, { color: colors.text }]}>
                            {img.title}
                          </Text>
                          <Text style={[styles.clinicalImageDate, { color: colors.textMuted }]}>
                            {img.date}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => setClinicalImages(clinicalImages.filter((ci) => ci.id !== img.id))}
                          style={styles.removeImageBtn}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          accessibilityLabel="Remove image"
                        >
                          <X size={12} color="#FFFFFF" />
                        </Pressable>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Dedicated Patient Clinical History (Past Medical / Surgical / Illnesses — Not Family) */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionCardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <History size={16} color={StitchColors.primaryContainer} />
                  <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Patient Clinical History</Text>
                </View>
                <View style={[styles.loggedBadge, { backgroundColor: colors.backgroundElement }]}>
                  <Text style={[styles.loggedText, { color: colors.textSecondary }]}>Directly Editable</Text>
                </View>
              </View>

              <Text style={[styles.sectionCardDesc, { color: colors.textSecondary }]}>
                Record patient's personal clinical history: past surgeries, hospitalizations, prior major illnesses & long-term therapies (not family records).
              </Text>

              <SmartMedicalTextInput
                label="Clinical Past History Notes"
                value={patientClinicalHistory}
                onChangeText={setPatientClinicalHistory}
                placeholder="Record past surgeries, hospital admissions, previous illness episodes..."
                multiline
                numberOfLines={4}
                quickSuggestions={[
                  'No past surgical procedures or hospital admissions',
                  'History of COVID-19 pneumonitis (2021, resolved)',
                  'Appendectomy (2018, laparoscopic, uncomplicated)',
                  'Diagnosed dyslipidemia on regular Statin therapy',
                  'No history of TB, Asthma, Epilepsy or CAD',
                ]}
              />
            </View>

            {/* Chronic Conditions */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionCardTitle, { color: colors.text, marginBottom: 10 }]}>Chronic Conditions</Text>

              <View style={styles.conditionList}>
                {chronicConditions.map((cond) => (
                  <View key={cond.id} style={[styles.conditionItem, { backgroundColor: colors.backgroundElement }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.condName, { color: colors.text }]}>{cond.name}</Text>
                      <Text style={[styles.condSub, { color: colors.textSecondary }]}>{cond.detail}</Text>
                    </View>
                    <View style={[styles.condTag, { backgroundColor: '#DBEAFE' }]}>
                      <Text style={styles.condTagText}>{cond.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Recent Consultations */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionCardHeader}>
                <Text style={[styles.sectionCardTitle, { color: colors.text }]}>Recent Consultations</Text>
                {pastConsultations.length > 0 && (
                  <Text style={[styles.viewAllLink, { color: StitchColors.primaryContainer }]}>
                    {pastConsultations.length} {pastConsultations.length === 1 ? 'Record' : 'Records'}
                  </Text>
                )}
              </View>

              {pastConsultations.length > 0 ? (
                <View style={styles.recentVisitsList}>
                  {pastConsultations.map((visit: any, index: number) => (
                    <View key={visit.id || index} style={[styles.recentVisitItem, { backgroundColor: colors.backgroundElement }]}>
                      <View style={styles.recentVisitLeft}>
                        <View style={[styles.recentVisitIcon, { backgroundColor: '#EFF6FF' }]}>
                          <Calendar size={16} color={StitchColors.primaryContainer} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.recentVisitName, { color: colors.text }]} numberOfLines={1}>
                            {visit.diagnosis || 'Clinical Consultation'}
                          </Text>
                          <Text style={[styles.recentVisitDate, { color: colors.textSecondary }]} numberOfLines={1}>
                            {visit.date} • {visit.doctorName || 'Doctor'}
                          </Text>
                        </View>
                      </View>
                      {visit.vitals?.bp ? (
                        <Text style={[styles.recentVisitBp, { color: colors.textSecondary }]}>
                          BP {visit.vitals.bp}
                        </Text>
                      ) : (
                        <View style={[styles.resolvedBadge, { backgroundColor: '#CCFBF1' }]}>
                          <Text style={styles.resolvedBadgeText}>Completed</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
                    First consultation with this patient. No prior consultation records found.
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* TAB 2: Past History */}
        {activeTab === 'history' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.tabContentBlock}>
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionCardTitle, { color: colors.text, marginBottom: 12 }]}>Comprehensive History</Text>

              <View style={styles.historyList}>
                <View style={[styles.historyItem, { backgroundColor: colors.backgroundElement }]}>
                  <Text style={[styles.historyLabel, { color: colors.text }]}>Family History</Text>
                  <Text style={[styles.historyDesc, { color: colors.textSecondary }]}>
                    Paternal: Type-2 Diabetes, CAD at 62. Maternal: No major cardiovascular issues.
                  </Text>
                </View>

                <View style={[styles.historyItem, { backgroundColor: colors.backgroundElement }]}>
                  <Text style={[styles.historyLabel, { color: colors.text }]}>Surgical History</Text>
                  <Text style={[styles.historyDesc, { color: colors.textSecondary }]}>
                    Laparoscopic Appendectomy (2018). Uneventful recovery.
                  </Text>
                </View>

                <View style={[styles.historyItem, { backgroundColor: colors.backgroundElement }]}>
                  <Text style={[styles.historyLabel, { color: colors.text }]}>Active Routine Medications</Text>
                  <Text style={[styles.historyDesc, { color: colors.textSecondary }]}>
                    Telmisartan 40mg (OD morning). Montelukast 10mg PRN for cough/wheezing.
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* TAB 3: Lab Reports */}
        {activeTab === 'labs' && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.tabContentBlock}>
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionCardTitle, { color: colors.text, marginBottom: 12 }]}>Diagnostic Reports</Text>

              <View style={styles.labsList}>
                {currentApt?.attachmentUrl ? (
                  <View style={[styles.labReportCard, { backgroundColor: '#EFF6FF', borderColor: StitchColors.primaryContainer, borderWidth: 1, marginBottom: 10 }]}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.labReportTitle, { color: StitchColors.primaryContainer, fontWeight: '700' }]}>
                        {currentApt.attachmentName || 'Pre-Consultation Record / ECG'}
                      </Text>
                      <Text style={[styles.labReportMeta, { color: colors.textSecondary }]}>
                        Attached by patient during booking
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setShowAttachmentViewer(true)}
                      style={{
                        backgroundColor: StitchColors.primaryContainer,
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 8,
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 12 }}>View</Text>
                    </Pressable>
                  </View>
                ) : null}

                <View style={[styles.labReportCard, { backgroundColor: colors.backgroundElement }]}>
                  <View>
                    <Text style={[styles.labReportTitle, { color: colors.text }]}>Complete Blood Count (CBC)</Text>
                    <Text style={[styles.labReportMeta, { color: colors.textSecondary }]}>12 Jan 2026 • FiYDOC Diagnostics</Text>
                  </View>
                  <View style={[styles.labStatusBadge, { backgroundColor: '#CCFBF1' }]}>
                    <Text style={styles.labStatusBadgeText}>All Normal</Text>
                  </View>
                </View>

                <View style={[styles.labReportCard, { backgroundColor: colors.backgroundElement }]}>
                  <View>
                    <Text style={[styles.labReportTitle, { color: colors.text }]}>Lipid Profile & HbA1c</Text>
                    <Text style={[styles.labReportMeta, { color: colors.textSecondary }]}>12 Jan 2026 • HbA1c: 5.6% | LDL: 108</Text>
                  </View>
                  <View style={[styles.labStatusBadge, { backgroundColor: '#EFF6FF' }]}>
                    <Text style={[styles.labStatusBadgeText, { color: StitchColors.primaryContainer }]}>In Range</Text>
                  </View>
                </View>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* 4. Bottom Action Bar: Audio Dictation, MS Paint Style Drawing Notepad, Proceed to Rx */}
      <View style={[styles.bottomBar, { borderTopColor: colors.border, backgroundColor: colors.card }]}>

        {/* Freehand MS Paint Style Drawing & Notepad Canvas Button */}
        <Pressable
          onPress={() => setShowDrawingModal(true)}
          style={[
            styles.bottomToolBtn,
            { backgroundColor: colors.backgroundElement, borderColor: colors.border },
            savedNotesCount > 0 && { backgroundColor: '#EFF6FF', borderColor: StitchColors.primaryContainer },
          ]}
          accessibilityLabel="Open Freehand Drawing Notepad"
        >
          <Edit3 size={20} color={savedNotesCount > 0 ? StitchColors.primaryContainer : colors.text} />
        </Pressable>

        {/* Primary Action: Proceed to Prescription */}
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            setRxPadVisible(true);
            setRxStep(1);
          }}
          style={[styles.proceedRxBtn, { backgroundColor: StitchColors.primaryContainer }]}
        >
          <Text style={styles.proceedRxBtnText}>Proceed to Prescription</Text>
          <ArrowRight size={16} color="#FFFFFF" strokeWidth={2.4} />
        </Pressable>
      </View>

      {/* 5. Freehand MS Paint Style Drawing Canvas Modal */}
      <ClinicalDrawingNotepad
        visible={showDrawingModal}
        patientName={currentApt?.patientName || 'Patient'}
        initialNotes={physicalObservation}
        onClose={() => setShowDrawingModal(false)}
        onSaveNotes={(notes, hasDrawing) => {
          if (notes) setPhysicalObservation(notes);
          if (hasDrawing) setSavedNotesCount((prev) => prev + 1);
        }}
      />

      {/* 6. EDIT VITALS MODAL */}
      <Modal visible={showVitalsModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Update Patient Vitals</Text>
              <Pressable onPress={() => setShowVitalsModal(false)} style={styles.modalCloseBtn}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.vitalsEditGrid}>
              <View style={styles.vitalsEditItem}>
                <Text style={[styles.vitalsEditLabel, { color: colors.textSecondary }]}>Systolic BP (mmHg)</Text>
                <TextInput
                  value={tempVitals.bpSystolic}
                  onChangeText={(val) => setTempVitals({ ...tempVitals, bpSystolic: val })}
                  keyboardType="numeric"
                  style={[styles.vitalsEditInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>

              <View style={styles.vitalsEditItem}>
                <Text style={[styles.vitalsEditLabel, { color: colors.textSecondary }]}>Diastolic BP (mmHg)</Text>
                <TextInput
                  value={tempVitals.bpDiastolic}
                  onChangeText={(val) => setTempVitals({ ...tempVitals, bpDiastolic: val })}
                  keyboardType="numeric"
                  style={[styles.vitalsEditInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>

              <View style={styles.vitalsEditItem}>
                <Text style={[styles.vitalsEditLabel, { color: colors.textSecondary }]}>Pulse Rate (bpm)</Text>
                <TextInput
                  value={tempVitals.pulse}
                  onChangeText={(val) => setTempVitals({ ...tempVitals, pulse: val })}
                  keyboardType="numeric"
                  style={[styles.vitalsEditInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>

              <View style={styles.vitalsEditItem}>
                <Text style={[styles.vitalsEditLabel, { color: colors.textSecondary }]}>Temperature (°F)</Text>
                <TextInput
                  value={tempVitals.temp}
                  onChangeText={(val) => setTempVitals({ ...tempVitals, temp: val })}
                  keyboardType="numeric"
                  style={[styles.vitalsEditInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>

              <View style={styles.vitalsEditItem}>
                <Text style={[styles.vitalsEditLabel, { color: colors.textSecondary }]}>SpO₂ Saturation (%)</Text>
                <TextInput
                  value={tempVitals.spO2}
                  onChangeText={(val) => setTempVitals({ ...tempVitals, spO2: val })}
                  keyboardType="numeric"
                  style={[styles.vitalsEditInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>

              <View style={styles.vitalsEditItem}>
                <Text style={[styles.vitalsEditLabel, { color: colors.textSecondary }]}>Weight (kg)</Text>
                <TextInput
                  value={tempVitals.weight}
                  onChangeText={(val) => setTempVitals({ ...tempVitals, weight: val })}
                  keyboardType="numeric"
                  style={[styles.vitalsEditInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>
            </View>

            <Pressable
              onPress={handleSaveVitals}
              style={[styles.saveModalBtn, { backgroundColor: StitchColors.primaryContainer }]}
            >
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.saveModalBtnText}>Save Baseline Vitals</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 7. COMPREHENSIVE PRESCRIPTION BUILDER MODAL */}
      <Modal visible={rxPadVisible} animationType="slide">
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          {/* Rx Pad Header */}
          <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
            <Pressable
              onPress={() => {
                if (rxStep > 1) {
                  setRxStep((rxStep - 1) as any);
                } else {
                  setRxPadVisible(false);
                }
              }}
              style={[styles.backBtn, { backgroundColor: colors.backgroundElement }]}
            >
              <ArrowLeft size={18} color={colors.text} />
            </Pressable>

            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Write Prescription</Text>
              <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
                {currentApt?.patientName || 'Patient'}{(currentApt as any)?.age ? ` · ${(currentApt as any).age}` : ''}
              </Text>
            </View>

            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.headerDoctorImg} />
            ) : (
              <View style={[styles.headerDoctorImg, { backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748b' }}>{user?.name?.charAt(0) || 'D'}</Text>
              </View>
            )}
          </View>

          {/* Rx Steps Tab Strip (Horizontal Scrollable, Never Clips on Small Screens) */}
          <View style={[styles.stepTabsContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.stepTabsScrollContent}
            >
              {[
                { num: 1, label: 'Diagnosis' },
                { num: 2, label: 'Medicines' },
                { num: 3, label: 'Tests' },
                { num: 4, label: 'Advice' },
                { num: 5, label: 'Summary' },
              ].map((st) => {
                const isActive = rxStep === st.num;
                const isCompleted = rxStep > st.num;

                return (
                  <Pressable
                    key={st.num}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.selectionAsync();
                      }
                      setRxStep(st.num as any);
                    }}
                    style={[
                      styles.stepTabChip,
                      {
                        backgroundColor: isActive
                          ? StitchColors.primaryContainer
                          : isCompleted
                          ? '#ECFDF5'
                          : colors.backgroundElement,
                        borderColor: isActive
                          ? StitchColors.primaryContainer
                          : isCompleted
                          ? '#A7F3D0'
                          : colors.border,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.stepBadgeCircle,
                        {
                          backgroundColor: isActive
                            ? 'rgba(255, 255, 255, 0.25)'
                            : isCompleted
                            ? '#059669'
                            : colors.border,
                        },
                      ]}
                    >
                      {isCompleted ? (
                        <Check size={10} color="#FFFFFF" strokeWidth={3} />
                      ) : (
                        <Text
                          style={[
                            styles.stepBadgeNum,
                            { color: isActive ? '#FFFFFF' : colors.textSecondary },
                          ]}
                        >
                          {st.num}
                        </Text>
                      )}
                    </View>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.stepTabChipText,
                        {
                          color: isActive ? '#FFFFFF' : isCompleted ? '#065F46' : colors.text,
                          fontWeight: isActive ? '700' : '600',
                        },
                      ]}
                    >
                      {st.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* STEP 1: Diagnosis with Complete Catalog & Recommendations */}
            {rxStep === 1 && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.rxCardBody}>
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.rxCardHeader}>
                    <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Diagnosis (ICD-10)</Text>
                    <Text style={[styles.cardHeaderSub, { color: colors.textSecondary }]}>
                      {diagnoses.length} selected
                    </Text>
                  </View>

                  {/* Diagnosis Search Bar with Comprehensive Autocomplete */}
                  <View style={[styles.rxSearchBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                    <TextInput
                      placeholder="Search any ICD-10 diagnosis (e.g. Bronchitis, Hypertension, Diabetes)..."
                      placeholderTextColor={colors.textMuted}
                      value={diagSearch}
                      onChangeText={setDiagSearch}
                      style={[styles.rxSearchInput, { color: colors.text }]}
                    />
                    {diagSearch.length > 0 && (
                      <Pressable onPress={() => setDiagSearch('')}>
                        <X size={16} color={colors.textMuted} />
                      </Pressable>
                    )}
                  </View>

                  {/* Specialty Category Pills */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {['All', 'Respiratory', 'Cardiovascular', 'Gastrointestinal', 'Endocrine', 'Musculoskeletal', 'Infectious'].map((cat) => (
                      <Pressable
                        key={cat}
                        onPress={() => setSelectedDiagCategory(cat)}
                        style={[
                          styles.catPill,
                          selectedDiagCategory === cat && { backgroundColor: StitchColors.primaryContainer },
                        ]}
                      >
                        <Text
                          style={[
                            styles.catPillText,
                            { color: selectedDiagCategory === cat ? '#FFFFFF' : colors.textSecondary },
                          ]}
                        >
                          {cat}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>

                  {/* Recommendations / Search Results */}
                  <View style={styles.diagSuggestionsBox}>
                    <Text style={[styles.suggestionHeader, { color: colors.textSecondary }]}>
                      {diagSearch ? 'Matching Diagnoses' : 'Recommended OPD Diagnoses'}
                    </Text>
                    <View style={styles.diagChipsWrap}>
                      {filteredDiagnoses.slice(0, 8).map((d) => (
                        <Pressable
                          key={d.code}
                          onPress={() => handleAddCustomDiagnosis(d.name, d.code)}
                          style={[styles.diagAddChip, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                        >
                          <Plus size={12} color={StitchColors.primaryContainer} />
                          <Text style={[styles.diagAddChipText, { color: colors.text }]}>
                            {d.name} <Text style={{ color: colors.textMuted }}>({d.code})</Text>
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Selected Diagnoses with Primary / Secondary priority */}
                  <Text style={[styles.selectedHeader, { color: colors.textSecondary }]}>SELECTED DIAGNOSES</Text>
                  <View style={styles.diagList}>
                    {diagnoses.map((d) => (
                      <View key={d.code} style={[styles.diagItemRow, { backgroundColor: colors.backgroundElement }]}>
                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Pressable
                            onPress={() => handleToggleDiagPriority(d.code)}
                            style={[
                              styles.priorityPill,
                              { backgroundColor: d.priority === 'Primary' ? StitchColors.primaryContainer : colors.border },
                            ]}
                          >
                            <Text style={styles.priorityPillText}>{d.priority}</Text>
                          </Pressable>
                          <Text style={[styles.diagNameText, { color: colors.text }]}>
                            {d.name} <Text style={{ color: colors.textMuted }}>({d.code})</Text>
                          </Text>
                        </View>
                        <Pressable onPress={() => handleRemoveDiag(d.code)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                          <Trash2 size={16} color={StitchColors.error} />
                        </Pressable>
                      </View>
                    ))}
                  </View>

                  {/* Clinical Impression Note with Smart Autocompletion */}
                  <SmartMedicalTextInput
                    label="Doctor's Clinical Impression / Notes"
                    value={clinicalImpression}
                    onChangeText={setClinicalImpression}
                    placeholder="Type clinical summary..."
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </Animated.View>
            )}

            {/* STEP 2: Prescribed Medications with Full Catalog & Form Editor */}
            {rxStep === 2 && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.rxCardBody}>
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.rxCardHeader}>
                    <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Prescribed Medications (Rx)</Text>
                    <Text style={[styles.cardHeaderSub, { color: colors.textSecondary }]}>
                      {medications.length} items
                    </Text>
                  </View>

                  {/* Medication Search Input */}
                  <View style={[styles.rxSearchBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                    <TextInput
                      placeholder="Search medicine (e.g. Augmentin, Dolo, Pantocid, Azithromycin)..."
                      placeholderTextColor={colors.textMuted}
                      value={medSearch}
                      onChangeText={setMedSearch}
                      style={[styles.rxSearchInput, { color: colors.text }]}
                    />
                  </View>

                  {/* Recommended Medications (Shown when search is empty) */}
                  {medSearch.trim().length === 0 && (
                    <View style={{ marginTop: 10, marginBottom: 12 }}>
                      <Text style={[styles.cardHeaderSub, { color: colors.textSecondary, marginBottom: 8, fontWeight: '600' }]}>
                        Recommended OPD Medications:
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
                        {MEDICATIONS_CATALOG.slice(0, 8).map((med) => (
                          <Pressable
                            key={med.name}
                            onPress={() => handleAddMedicationFromCatalog(med)}
                            style={{
                              backgroundColor: colors.backgroundElement,
                              borderColor: colors.border,
                              borderWidth: 1,
                              borderRadius: 10,
                              paddingHorizontal: 12,
                              paddingVertical: 8,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <View>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>{med.name}</Text>
                              <Text style={{ fontSize: 11, color: colors.textMuted }}>{med.defaultDosage} • {med.defaultDuration}</Text>
                            </View>
                            <Plus size={14} color={StitchColors.primaryContainer} />
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Search Results from MEDICATIONS_CATALOG */}
                  {filteredMeds.length > 0 && medSearch.trim().length > 0 && (
                    <View style={[styles.medsDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      {filteredMeds.slice(0, 5).map((med) => (
                        <Pressable
                          key={med.name}
                          onPress={() => handleAddMedicationFromCatalog(med)}
                          style={[styles.medDropdownItem, { borderBottomColor: colors.border }]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.medDropdownName, { color: colors.text }]}>{med.name}</Text>
                            <Text style={[styles.medDropdownGeneric, { color: colors.textSecondary }]}>
                              {med.generic} • {med.defaultDosage}
                            </Text>
                          </View>
                          <Plus size={16} color={StitchColors.primaryContainer} />
                        </Pressable>
                      ))}

                      {/* Quick Add as Custom Medication */}
                      <Pressable
                        onPress={() => {
                          setEditingMed({
                            id: `med_${Date.now()}`,
                            name: medSearch.trim(),
                            generic: '',
                            dosage: '1 - 0 - 1',
                            frequency: 'Twice daily',
                            duration: '5 Days',
                            timing: 'After meals',
                            instructions: 'Complete course',
                          });
                          setMedSearch('');
                          setShowMedModal(true);
                        }}
                        style={[styles.medDropdownItem, { borderBottomColor: 'transparent', backgroundColor: colors.backgroundElement }]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.medDropdownName, { color: StitchColors.primaryContainer, fontWeight: '700' }]}>
                            + Add "{medSearch.trim()}" as custom medication
                          </Text>
                          <Text style={[styles.medDropdownGeneric, { color: colors.textSecondary }]}>
                            Configure custom dosage, frequency & duration
                          </Text>
                        </View>
                        <Plus size={16} color={StitchColors.primaryContainer} />
                      </Pressable>
                    </View>
                  )}

                  {filteredMeds.length === 0 && medSearch.trim().length > 1 && (
                    <View style={[styles.medsDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Pressable
                        onPress={() => {
                          setEditingMed({
                            id: `med_${Date.now()}`,
                            name: medSearch.trim(),
                            generic: '',
                            dosage: '1 - 0 - 1',
                            frequency: 'Twice daily',
                            duration: '5 Days',
                            timing: 'After meals',
                            instructions: 'Complete course',
                          });
                          setMedSearch('');
                          setShowMedModal(true);
                        }}
                        style={[styles.medDropdownItem, { borderBottomColor: 'transparent', backgroundColor: colors.backgroundElement }]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.medDropdownName, { color: StitchColors.primaryContainer, fontWeight: '700' }]}>
                            + Add "{medSearch.trim()}" as custom medication
                          </Text>
                          <Text style={[styles.medDropdownGeneric, { color: colors.textSecondary }]}>
                            Not in standard catalog • Configure dosage & instructions
                          </Text>
                        </View>
                        <Plus size={16} color={StitchColors.primaryContainer} />
                      </Pressable>
                    </View>
                  )}

                  {/* Prescribed Medications List */}
                  <View style={styles.medsList}>
                    {medications.map((m) => (
                      <View key={m.id} style={[styles.medCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                        <View style={styles.medCardTop}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.medName, { color: colors.text }]}>{m.name}</Text>
                            <Text style={[styles.medGeneric, { color: colors.textSecondary }]}>{m.generic}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 10 }}>
                            <Pressable
                              onPress={() => {
                                setEditingMed(m);
                                setShowMedModal(true);
                              }}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Edit3 size={16} color={StitchColors.primaryContainer} />
                            </Pressable>
                            <Pressable
                              onPress={() => setMedications(medications.filter((x) => x.id !== m.id))}
                              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                            >
                              <Trash2 size={16} color={StitchColors.error} />
                            </Pressable>
                          </View>
                        </View>

                        <View style={styles.medPillStrip}>
                          <View style={[styles.medPill, { backgroundColor: colors.card }]}>
                            <Text style={[styles.medPillText, { color: StitchColors.primaryContainer }]}>{m.dosage}</Text>
                          </View>
                          <View style={[styles.medPill, { backgroundColor: colors.card }]}>
                            <Text style={[styles.medPillText, { color: colors.text }]}>{m.timing}</Text>
                          </View>
                          <View style={[styles.medPill, { backgroundColor: colors.card }]}>
                            <Text style={[styles.medPillText, { color: colors.textSecondary }]}>{m.duration}</Text>
                          </View>
                        </View>
                        <Text style={[styles.medInstructions, { color: StitchColors.secondaryContainer }]}>
                          ✓ {m.instructions}
                        </Text>
                      </View>
                    ))}
                  </View>



                  {/* Add Custom Medicine Button */}
                  <Pressable
                    onPress={() => {
                      setEditingMed({
                        id: `med_${Date.now()}`,
                        name: '',
                        generic: '',
                        dosage: '1 - 0 - 1',
                        frequency: 'Twice daily',
                        duration: '5 Days',
                        timing: 'After meals',
                        instructions: 'Complete course',
                      });
                      setShowMedModal(true);
                    }}
                    style={[styles.addMedBtn, { borderColor: StitchColors.primaryContainer }]}
                  >
                    <Plus size={16} color={StitchColors.primaryContainer} />
                    <Text style={styles.addMedBtnText}>Add Custom Medication</Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}

            {/* STEP 3: Tests & Labs with Catalog */}
            {rxStep === 3 && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.rxCardBody}>
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.rxCardHeader}>
                    <Text style={[styles.cardHeaderTitle, { color: colors.text }]}>Labs & Imaging</Text>
                    <Text style={[styles.cardHeaderSub, { color: colors.textSecondary }]}>
                      {labTests.length} tests ordered
                    </Text>
                  </View>

                  {/* Test Search */}
                  <View style={[styles.rxSearchBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                    <TextInput
                      placeholder="Search lab tests (e.g. CBC, HbA1c, LFT, Chest X-Ray, ECG)..."
                      placeholderTextColor={colors.textMuted}
                      value={testSearch}
                      onChangeText={setTestSearch}
                      style={[styles.rxSearchInput, { color: colors.text }]}
                    />
                  </View>

                  {/* Selected Tests Pills */}
                  <View style={styles.labPillsWrap}>
                    {labTests.map((t) => (
                      <View key={t} style={[styles.testBadge, { backgroundColor: '#CCFBF1' }]}>
                        <Text style={styles.testBadgeText}>{t}</Text>
                        <Pressable onPress={() => setLabTests(labTests.filter((x) => x !== t))}>
                          <X size={14} color={StitchColors.secondary} />
                        </Pressable>
                      </View>
                    ))}
                  </View>

                  {/* Common Test Recommendations */}
                  <Text style={[styles.suggestionHeader, { color: colors.textSecondary, marginTop: 12 }]}>
                    Diagnostic Recommendations (Tap to add)
                  </Text>
                  <View style={styles.testRecommendationsGrid}>
                    {filteredTests.slice(0, 10).map((test) => (
                      <Pressable
                        key={test.name}
                        onPress={() => {
                          if (!labTests.includes(test.name)) {
                            setLabTests([...labTests, test.name]);
                            if (Platform.OS !== 'web') Haptics.selectionAsync();
                          }
                        }}
                        style={[
                          styles.testRecChip,
                          {
                            backgroundColor: labTests.includes(test.name) ? '#CCFBF1' : colors.backgroundElement,
                            borderColor: labTests.includes(test.name) ? StitchColors.secondary : colors.border,
                          },
                        ]}
                      >
                        <Plus size={12} color={labTests.includes(test.name) ? StitchColors.secondary : StitchColors.primaryContainer} />
                        <Text style={[styles.testRecChipText, { color: colors.text }]}>{test.name}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Add Custom Test */}
                  <View style={styles.customTestRow}>
                    <TextInput
                      value={customTestInput}
                      onChangeText={setCustomTestInput}
                      placeholder="Type custom test or imaging..."
                      placeholderTextColor={colors.textMuted}
                      style={[styles.customTestInput, { color: colors.text, borderColor: colors.border }]}
                    />
                    <Pressable
                      onPress={() => {
                        if (customTestInput.trim()) {
                          setLabTests([...labTests, customTestInput.trim()]);
                          setCustomTestInput('');
                        }
                      }}
                      style={[styles.customTestAddBtn, { backgroundColor: StitchColors.secondaryContainer }]}
                    >
                      <Plus size={16} color="#FFFFFF" />
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            )}

            {/* STEP 4: Advice, Lifestyle & Review Date */}
            {rxStep === 4 && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.rxCardBody}>
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.cardHeaderTitle, { color: colors.text, marginBottom: 12 }]}>
                    Advice & Review Date
                  </Text>

                  {/* Lifestyle instructions */}
                  <Text style={[styles.selectedHeader, { color: colors.textSecondary }]}>LIFESTYLE INSTRUCTIONS</Text>
                  <View style={styles.adviceChecklist}>
                    {lifestyleInstructions.map((item) => (
                      <Pressable
                        key={item.id}
                        onPress={() => {
                          setLifestyleInstructions(
                            lifestyleInstructions.map((x) =>
                              x.id === item.id ? { ...x, checked: !x.checked } : x
                            )
                          );
                        }}
                        style={[styles.adviceItem, { backgroundColor: colors.backgroundElement }]}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            {
                              borderColor: item.checked ? StitchColors.secondaryContainer : colors.border,
                              backgroundColor: item.checked ? StitchColors.secondaryContainer : 'transparent',
                            },
                          ]}
                        >
                          {item.checked && <Check size={12} color="#FFFFFF" />}
                        </View>
                        <Text style={[styles.adviceText, { color: colors.text }]}>{item.text}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Follow-up Selector */}
                  <Text style={[styles.selectedHeader, { color: colors.textSecondary, marginTop: 14 }]}>
                    FOLLOW-UP CONSULTATION
                  </Text>
                  <View style={styles.followUpGrid}>
                    {['3 Days', '5 Days (18 March)', '1 Week', '2 Weeks', '1 Month'].map((period) => (
                      <Pressable
                        key={period}
                        onPress={() => setFollowUpDays(period)}
                        style={[
                          styles.followUpPill,
                          {
                            backgroundColor: followUpDays === period ? StitchColors.primaryContainer : colors.backgroundElement,
                            borderColor: followUpDays === period ? StitchColors.primaryContainer : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.followUpPillText,
                            { color: followUpDays === period ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {period}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Emergency Warning with Medical Autocompletion */}
                  <SmartMedicalTextInput
                    label="Emergency Red-Flag Warnings"
                    value={emergencyWarning}
                    onChangeText={setEmergencyWarning}
                    placeholder="Type emergency instructions..."
                    multiline
                    numberOfLines={3}
                    quickSuggestions={[
                      'Return immediately if difficulty breathing develops',
                      'Seek emergency care if fever >102°F persists',
                      'Visit ER if chest pressure or severe dizziness occurs',
                    ]}
                  />
                </View>
              </Animated.View>
            )}

            {/* STEP 5: Prescription Summary & Digital Sign-off */}
            {rxStep === 5 && (
              <Animated.View entering={FadeIn.duration(200)} style={styles.rxCardBody}>
                {/* Letterhead Preview Card */}
                <View style={[styles.summaryLetterheadCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {/* Doctor Info */}
                  <View style={styles.letterheadTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.letterheadDocName, { color: colors.text }]}>{user?.name || 'Doctor'}</Text>
                      <Text style={[styles.letterheadDocQual, { color: colors.textSecondary }]}>
                        {user?.qualification || user?.specialization || ''}
                      </Text>
                      <Text style={[styles.letterheadReg, { color: colors.textMuted }]}>
                        {user?.licenseNumber ? `Reg: ${user.licenseNumber}` : ''}
                      </Text>
                    </View>
                    <View style={styles.letterheadHospitalBox}>
                      <Text style={[styles.hospitalName, { color: StitchColors.primaryContainer }]}>
                        {user?.clinicName || 'OPD'}
                      </Text>
                      <Text style={[styles.hospitalDate, { color: colors.textSecondary }]}>
                        {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                  </View>

                  {/* Patient Info Strip */}
                  <View style={[styles.letterheadPatientStrip, { backgroundColor: colors.backgroundElement }]}>
                    <Text style={[styles.lhPatientName, { color: colors.text }]}>
                      Patient: {currentApt?.patientName || 'Patient'}{(currentApt as any)?.age ? ` (${(currentApt as any).age})` : ''}
                    </Text>
                    <Text style={[styles.lhVitalsText, { color: colors.textSecondary }]}>
                      BP: {vitals.bpSystolic}/{vitals.bpDiastolic} • Pulse: {vitals.pulse} bpm • Temp: {vitals.temp}°F
                    </Text>
                  </View>

                  {/* Diagnoses Summary */}
                  <View style={styles.summarySection}>
                    <Text style={[styles.summarySectionHeading, { color: StitchColors.primaryContainer }]}>DIAGNOSIS</Text>
                    <Text style={[styles.summarySectionBody, { color: colors.text }]}>
                      {diagnoses.map((d) => `${d.name} (${d.code}) [${d.priority}]`).join(', ')}
                    </Text>
                  </View>

                  {/* Medicines Table */}
                  <View style={styles.summarySection}>
                    <Text style={[styles.summarySectionHeading, { color: StitchColors.primaryContainer }]}>MEDICATIONS</Text>
                    {medications.map((m, idx) => (
                      <View key={m.id} style={styles.summaryMedRow}>
                        <Text style={[styles.summaryMedNum, { color: colors.textSecondary }]}>{idx + 1}.</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.summaryMedTitle, { color: colors.text }]}>{m.name}</Text>
                          <Text style={[styles.summaryMedDosage, { color: colors.textSecondary }]}>
                            {m.dosage} • {m.timing} • {m.duration} ({m.instructions})
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Lab Tests */}
                  {labTests.length > 0 && (
                    <View style={styles.summarySection}>
                      <Text style={[styles.summarySectionHeading, { color: StitchColors.primaryContainer }]}>INVESTIGATIONS</Text>
                      <Text style={[styles.summarySectionBody, { color: colors.text }]}>
                        {labTests.join(', ')}
                      </Text>
                    </View>
                  )}

                  {/* Advice */}
                  <View style={styles.summarySection}>
                    <Text style={[styles.summarySectionHeading, { color: StitchColors.primaryContainer }]}>ADVICE & FOLLOW-UP</Text>
                    <Text style={[styles.summarySectionBody, { color: colors.text }]}>
                      Follow-up in {followUpDays}. {emergencyWarning}
                    </Text>
                  </View>

                  {/* Digital Signature & Seal */}
                  <View style={styles.signatureRow}>
                    <View>
                      <Text style={styles.signedBadge}>✓ EHR Digitally Signed</Text>
                      <Text style={[styles.signTime, { color: colors.textMuted }]}>
                        Timestamp: {new Date().toLocaleTimeString()}
                      </Text>
                    </View>
                    <View style={styles.svgSignatureBox}>
                      <Svg height="36" width="120" viewBox="0 0 140 40">
                        <Path
                          d="M8 24C20 18 32 8 38 12C44 16 38 32 48 28C58 24 68 12 82 15C96 18 102 28 122 18C130 14 136 12 138 14"
                          stroke={StitchColors.primaryContainer}
                          strokeWidth="2"
                          fill="none"
                        />
                      </Svg>
                      <Text style={[styles.signerName, { color: colors.text }]}>{user?.name || 'Doctor'}</Text>
                    </View>
                  </View>
                </View>

                {/* Delivery Channels */}
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}>
                  <Text style={[styles.cardHeaderTitle, { color: colors.text, marginBottom: 10 }]}>
                    Delivery Channels
                  </Text>
                  <View style={styles.deliveryList}>
                    <Pressable
                      onPress={() => setDeliveryApp(!deliveryApp)}
                      style={[styles.deliveryItem, { backgroundColor: colors.backgroundElement }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.deliveryTitle, { color: colors.text }]}>FiYDOC Patient App</Text>
                        <Text style={[styles.deliverySub, { color: colors.textSecondary }]}>Instant sync to Medical Records</Text>
                      </View>
                      <View style={[styles.toggleCheckbox, { backgroundColor: deliveryApp ? StitchColors.secondaryContainer : colors.border }]}>
                        {deliveryApp && <Check size={14} color="#FFFFFF" />}
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => setDeliveryWhatsapp(!deliveryWhatsapp)}
                      style={[styles.deliveryItem, { backgroundColor: colors.backgroundElement }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.deliveryTitle, { color: colors.text }]}>WhatsApp PDF Dispatch</Text>
                        <Text style={[styles.deliverySub, { color: colors.textSecondary }]}>+91 98201 44821</Text>
                      </View>
                      <View style={[styles.toggleCheckbox, { backgroundColor: deliveryWhatsapp ? StitchColors.secondaryContainer : colors.border }]}>
                        {deliveryWhatsapp && <Check size={14} color="#FFFFFF" />}
                      </View>
                    </Pressable>

                    <Pressable
                      onPress={() => setDeliverySms(!deliverySms)}
                      style={[styles.deliveryItem, { backgroundColor: colors.backgroundElement }]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.deliveryTitle, { color: colors.text }]}>SMS Link Notification</Text>
                        <Text style={[styles.deliverySub, { color: colors.textSecondary }]}>Standard telecom notification</Text>
                      </View>
                      <View style={[styles.toggleCheckbox, { backgroundColor: deliverySms ? StitchColors.secondaryContainer : colors.border }]}>
                        {deliverySms && <Check size={14} color="#FFFFFF" />}
                      </View>
                    </Pressable>
                  </View>
                </View>

                {/* Sign and Send Primary Button */}
                <Pressable
                  onPress={handleSignAndSend}
                  disabled={isSigning || signSuccess}
                  style={[
                    styles.signSendBtn,
                    { backgroundColor: signSuccess ? '#059669' : StitchColors.primaryContainer },
                  ]}
                >
                  {isSigning ? (
                    <Text style={styles.signSendBtnText}>Signing with Digital Seal...</Text>
                  ) : signSuccess ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={18} color="#FFFFFF" />
                      <Text style={styles.signSendBtnText}>Prescription Dispatched Successfully!</Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <FileCheck size={18} color="#FFFFFF" />
                      <Text style={styles.signSendBtnText}>Sign & Send Prescription</Text>
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            )}
          </ScrollView>

          {/* Rx Deck Bottom Navigation Strip (Next / Back) */}
          {rxStep < 5 && (
            <View style={[styles.rxDeckBottomNav, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
              <Pressable
                onPress={() => setRxStep(5)}
                style={styles.skipToSummaryBtn}
              >
                <Text style={[styles.skipToSummaryText, { color: StitchColors.primaryContainer }]}>Review Summary</Text>
              </Pressable>

              <Pressable
                onPress={() => setRxStep((rxStep + 1) as any)}
                style={[styles.nextStepBtn, { backgroundColor: StitchColors.primaryContainer }]}
              >
                <Text style={styles.nextStepBtnText}>
                  {rxStep === 1 ? 'Continue to Medications' : rxStep === 2 ? 'Continue to Tests' : rxStep === 3 ? 'Continue to Advice' : 'Continue to Summary'}
                </Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* 8. MEDICATION EDIT / ADD MODAL */}
      {editingMed && (
        <Modal visible={showMedModal} transparent animationType="slide">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Medication Dosage & Instructions</Text>
                <Pressable onPress={() => setShowMedModal(false)} style={styles.modalCloseBtn}>
                  <X size={18} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={styles.medFormGroup}>
                  <Text style={[styles.medFormLabel, { color: colors.textSecondary }]}>Medicine Name</Text>
                  <TextInput
                    value={editingMed.name}
                    onChangeText={(val) => setEditingMed({ ...editingMed, name: val })}
                    placeholder="e.g. Augmentin 625mg"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.medFormInput, { color: colors.text, borderColor: colors.border }]}
                  />
                </View>

                <View style={styles.medFormGroup}>
                  <Text style={[styles.medFormLabel, { color: colors.textSecondary }]}>Dosage Cadence</Text>
                  <View style={styles.cadencePillsRow}>
                    {['1 - 0 - 1', '1 - 0 - 0', '0 - 0 - 1', '1 - 1 - 1', '10 ml', 'SOS'].map((cad) => (
                      <Pressable
                        key={cad}
                        onPress={() => setEditingMed({ ...editingMed, dosage: cad })}
                        style={[
                          styles.cadencePill,
                          {
                            backgroundColor: editingMed.dosage === cad ? StitchColors.primaryContainer : colors.backgroundElement,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cadencePillText,
                            { color: editingMed.dosage === cad ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {cad}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.medFormGroup}>
                  <Text style={[styles.medFormLabel, { color: colors.textSecondary }]}>Meal Timing</Text>
                  <View style={styles.cadencePillsRow}>
                    {['After meals', 'Before breakfast', 'With food', 'Bedtime'].map((tim) => (
                      <Pressable
                        key={tim}
                        onPress={() => setEditingMed({ ...editingMed, timing: tim })}
                        style={[
                          styles.cadencePill,
                          {
                            backgroundColor: editingMed.timing === tim ? StitchColors.primaryContainer : colors.backgroundElement,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cadencePillText,
                            { color: editingMed.timing === tim ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {tim}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.medFormGroup}>
                  <Text style={[styles.medFormLabel, { color: colors.textSecondary }]}>Duration</Text>
                  <View style={styles.cadencePillsRow}>
                    {['3 Days', '5 Days', '7 Days', '10 Days', '14 Days', '30 Days'].map((dur) => (
                      <Pressable
                        key={dur}
                        onPress={() => setEditingMed({ ...editingMed, duration: dur })}
                        style={[
                          styles.cadencePill,
                          {
                            backgroundColor: editingMed.duration === dur ? StitchColors.primaryContainer : colors.backgroundElement,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.cadencePillText,
                            { color: editingMed.duration === dur ? '#FFFFFF' : colors.text },
                          ]}
                        >
                          {dur}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={styles.medFormGroup}>
                  <Text style={[styles.medFormLabel, { color: colors.textSecondary }]}>Special Instructions</Text>
                  <TextInput
                    value={editingMed.instructions}
                    onChangeText={(val) => setEditingMed({ ...editingMed, instructions: val })}
                    placeholder="e.g. Complete full course, drink plenty of water"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.medFormInput, { color: colors.text, borderColor: colors.border }]}
                  />
                </View>
              </ScrollView>

              <Pressable
                onPress={handleSaveMedicationEdit}
                style={[styles.saveModalBtn, { backgroundColor: StitchColors.primaryContainer }]}
              >
                <Check size={16} color="#FFFFFF" />
                <Text style={styles.saveModalBtnText}>Save Medication</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* 9. ADD CLINICAL EXAMINATION IMAGE MODAL */}
      <Modal visible={showAddImageModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Camera size={18} color={StitchColors.primaryContainer} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add Clinical Image</Text>
              </View>
              <Pressable
                onPress={() => {
                  setShowAddImageModal(false);
                  setCustomImageTitle('');
                  setCustomImageUri('');
                }}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary }]}>
                Attach a clinical image taken during examination (camera or file):
              </Text>

              <Text style={[styles.modalSectionLabel, { color: colors.textSecondary, marginTop: 14 }]}>
                Or Add Custom Clinical Image
              </Text>
              <View style={styles.medFormGroup}>
                <Text style={[styles.medFormLabel, { color: colors.textSecondary }]}>Image Description / Label</Text>
                <TextInput
                  value={customImageTitle}
                  onChangeText={setCustomImageTitle}
                  placeholder="e.g. Left forearm eczema flare"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.medFormInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>
              <View style={styles.medFormGroup}>
                <Text style={[styles.medFormLabel, { color: colors.textSecondary }]}>Image URL / Source</Text>
                <TextInput
                  value={customImageUri}
                  onChangeText={setCustomImageUri}
                  placeholder="https://..."
                  placeholderTextColor={colors.textMuted}
                  style={[styles.medFormInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>
            </ScrollView>

            <Pressable
              onPress={() => {
                if (customImageTitle.trim() && customImageUri.trim()) {
                  const newImg = {
                    id: `img_${Date.now()}`,
                    title: customImageTitle.trim(),
                    uri: customImageUri.trim(),
                    date: 'Today, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  };
                  setClinicalImages([...clinicalImages, newImg]);
                  setCustomImageTitle('');
                  setCustomImageUri('');
                  setShowAddImageModal(false);
                }
              }}
              style={[
                styles.saveModalBtn,
                {
                  backgroundColor:
                    customImageTitle.trim() && customImageUri.trim()
                      ? StitchColors.primaryContainer
                      : colors.border,
                },
              ]}
              disabled={!customImageTitle.trim() || !customImageUri.trim()}
            >
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.saveModalBtnText}>Attach Image to Exam</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* 10. PREVIEW CLINICAL IMAGE MODAL */}
      {selectedPreviewImage && (
        <Modal visible={!!selectedPreviewImage} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.previewModalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text numberOfLines={1} style={[styles.modalTitle, { color: colors.text, flex: 1 }]}>
                  {selectedPreviewImage.title}
                </Text>
                <Pressable onPress={() => setSelectedPreviewImage(null)} style={styles.modalCloseBtn}>
                  <X size={18} color={colors.text} />
                </Pressable>
              </View>
              <Image
                source={{ uri: selectedPreviewImage.uri }}
                style={styles.previewImageFull}
                resizeMode="cover"
              />
              <Pressable
                onPress={() => setSelectedPreviewImage(null)}
                style={[styles.saveModalBtn, { backgroundColor: StitchColors.primaryContainer, marginTop: 12 }]}
              >
                <Text style={styles.saveModalBtnText}>Close Preview</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      {/* 11. EXIT CONFIRMATION DIALOG */}
      <ConfirmationDialog
        visible={exitConfirmVisible}
        title="Leave Active Consultation?"
        message="You have unsaved clinical notes or medications for this patient. Leaving now will discard these changes."
        confirmText="Leave Session"
        cancelText="Continue Consultation"
        confirmVariant="danger"
        iconVariant="danger"
        onConfirm={() => {
          setExitConfirmVisible(false);
          if (router.canGoBack()) router.back();
          else router.replace('/(doctor)/(tabs)/directory');
        }}
        onCancel={() => setExitConfirmVisible(false)}
      />

      {/* 12. PRE-CONSULTATION ATTACHMENT VIEWER */}
      <DocumentViewerModal
        visible={showAttachmentViewer}
        title={currentApt?.attachmentName || 'Pre-Consultation Attached Document'}
        subtitle={`Attached by ${currentApt?.patientName || 'Patient'} during booking`}
        documentUrl={currentApt?.attachmentUrl}
        onClose={() => setShowAttachmentViewer(false)}
      />

      {/* 13. DIGITAL SIGNING BLOCKING LOADER */}
      <LoadingDialog
        visible={isSigning}
        title="Digitally Signing Prescription..."
        message="Locking consultation details and generating secure digital Rx verification..."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenterCol: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: StitchColors.secondaryContainer,
  },
  activeText: {
    fontSize: 10,
    fontWeight: '800',
    color: StitchColors.secondaryContainer,
    letterSpacing: 0.5,
  },
  dotSeparator: {
    fontSize: 10,
    color: '#94A3B8',
  },
  timerDigit: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  resetTimerBtn: {
    marginLeft: 2,
    padding: 2,
  },
  headerDoctorImg: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },
  patientHeroCard: {
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    ...Shadows.subtle,
  },
  patientInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientAvatar: {
    width: 54,
    height: 54,
    borderRadius: BorderRadius.full,
  },
  heroPatientName: {
    fontSize: 17,
    fontWeight: '700',
  },
  demogBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  demogText: {
    fontSize: 11,
    fontWeight: '600',
  },
  uhidText: {
    fontSize: 12,
    marginTop: 3,
  },
  vitalsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 6,
  },
  vitalsSectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  editVitalsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editVitalsBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: StitchColors.primaryContainer,
  },
  vitalsGrid: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  vitalCol: {
    flex: 1,
    alignItems: 'center',
  },
  vitalBorderLeft: {
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  vitalLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  vitalVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  vitalUnit: {
    fontSize: 10,
    fontWeight: '400',
  },
  extraVitalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  extraVitalText: {
    fontSize: 11,
  },
  complaintBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  allergiesSection: {
    marginTop: 10,
  },
  allergiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  allergiesLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addAllergyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addAllergyBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: StitchColors.primaryContainer,
  },
  allergiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  allergyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  allergyTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addAllergyInputRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    alignItems: 'center',
  },
  smallInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
  },
  smallAddBtn: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsWrap: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    padding: 3,
    marginVertical: 14,
  },
  segTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  segTabActive: {
    ...Shadows.subtle,
  },
  segTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  tabContentBlock: {
    gap: 12,
  },
  sectionCard: {
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    ...Shadows.subtle,
  },
  sectionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  loggedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  loggedText: {
    fontSize: 10,
    fontWeight: '600',
  },
  conditionList: {
    gap: 8,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  condName: {
    fontSize: 13,
    fontWeight: '700',
  },
  condSub: {
    fontSize: 11,
    marginTop: 2,
  },
  condTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  condTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  recentVisitsList: {
    gap: 8,
  },
  recentVisitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  recentVisitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recentVisitIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentVisitName: {
    fontSize: 13,
    fontWeight: '600',
  },
  recentVisitDate: {
    fontSize: 11,
    marginTop: 1,
  },
  recentVisitBp: {
    fontSize: 12,
    fontWeight: '600',
  },
  resolvedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  resolvedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: StitchColors.secondary,
  },
  historyList: {
    gap: 10,
  },
  historyItem: {
    padding: 12,
    borderRadius: BorderRadius.lg,
  },
  historyLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  historyDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  labsList: {
    gap: 8,
  },
  labReportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BorderRadius.lg,
  },
  labReportTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  labReportMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  labStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  labStatusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: StitchColors.secondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bottomToolBtn: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedRxBtn: {
    flex: 1,
    height: 46,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.subtle,
  },
  proceedRxBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: BorderRadius['2xl'],
    padding: 20,
    borderWidth: 1,
    ...Shadows.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalCloseBtn: {
    padding: 4,
  },
  vitalsEditGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  vitalsEditItem: {
    width: '48%',
    marginBottom: 6,
  },
  vitalsEditLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  vitalsEditInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  saveModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    gap: 6,
    marginTop: 14,
    ...Shadows.subtle,
  },
  saveModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepTabsStrip: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  stepTabItem: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  stepTabItemActive: {
    ...Shadows.subtle,
  },
  stepTabItemText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rxCardBody: {
    gap: 12,
  },
  rxCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardHeaderSub: {
    fontSize: 11,
  },
  rxSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  rxSearchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    marginRight: 6,
    backgroundColor: '#F1F5F9',
  },
  catPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  diagSuggestionsBox: {
    marginBottom: 14,
  },
  suggestionHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  diagChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  diagAddChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  diagAddChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  selectedHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  diagList: {
    gap: 6,
    marginBottom: 14,
  },
  diagItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  priorityPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  priorityPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  diagNameText: {
    fontSize: 13,
    fontWeight: '600',
  },
  medsDropdown: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: 12,
  },
  medDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  medDropdownName: {
    fontSize: 13,
    fontWeight: '700',
  },
  medDropdownGeneric: {
    fontSize: 11,
    marginTop: 1,
  },
  medsList: {
    gap: 8,
  },
  medCard: {
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  medCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  medName: {
    fontSize: 14,
    fontWeight: '700',
  },
  medGeneric: {
    fontSize: 11,
    marginTop: 1,
  },
  medPillStrip: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 6,
  },
  medPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  medPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  medInstructions: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  combosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 12,
    flexWrap: 'wrap',
  },
  combosLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  comboChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
  },
  comboChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addMedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 6,
  },
  addMedBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },
  labPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  testBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
  },
  testBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: StitchColors.secondary,
  },
  testRecommendationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  testRecChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  testRecChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  customTestRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  customTestInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  customTestAddBtn: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adviceChecklist: {
    gap: 8,
    marginBottom: 10,
  },
  adviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adviceText: {
    fontSize: 13,
    flex: 1,
  },
  followUpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  followUpPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  followUpPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryLetterheadCard: {
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    ...Shadows.subtle,
  },
  letterheadTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  letterheadDocName: {
    fontSize: 16,
    fontWeight: '700',
  },
  letterheadDocQual: {
    fontSize: 11,
    marginTop: 1,
  },
  letterheadReg: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 1,
  },
  letterheadHospitalBox: {
    alignItems: 'flex-end',
  },
  hospitalName: {
    fontSize: 12,
    fontWeight: '700',
  },
  hospitalDate: {
    fontSize: 11,
    marginTop: 1,
  },
  letterheadPatientStrip: {
    padding: 8,
    borderRadius: BorderRadius.md,
    marginVertical: 10,
  },
  lhPatientName: {
    fontSize: 13,
    fontWeight: '700',
  },
  lhVitalsText: {
    fontSize: 11,
    marginTop: 2,
  },
  summarySection: {
    marginVertical: 6,
  },
  summarySectionHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  summarySectionBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  summaryMedRow: {
    flexDirection: 'row',
    gap: 4,
    marginVertical: 2,
  },
  summaryMedNum: {
    fontSize: 12,
    fontWeight: '700',
    width: 16,
  },
  summaryMedTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  summaryMedDosage: {
    fontSize: 11,
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
    marginTop: 10,
  },
  signedBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  signTime: {
    fontSize: 10,
    marginTop: 2,
  },
  svgSignatureBox: {
    alignItems: 'flex-end',
  },
  signerName: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  deliveryList: {
    gap: 8,
  },
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: BorderRadius.lg,
  },
  deliveryTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  deliverySub: {
    fontSize: 11,
    marginTop: 1,
  },
  toggleCheckbox: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signSendBtn: {
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    ...Shadows.subtle,
  },
  signSendBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  rxDeckBottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  skipToSummaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipToSummaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  nextStepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.xl,
    ...Shadows.subtle,
  },
  nextStepBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  medFormGroup: {
    marginBottom: 12,
  },
  medFormLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  medFormInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
  },
  cadencePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cadencePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  cadencePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  addImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  addImageBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  clinicalImagesContainer: {
    marginTop: 14,
    gap: 8,
  },
  clinicalImagesSubhead: {
    fontSize: 12,
    fontWeight: '600',
  },
  clinicalImagesScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  clinicalImageCard: {
    width: 130,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  clinicalImageThumb: {
    width: '100%',
    height: 75,
    backgroundColor: '#E2E8F0',
  },
  clinicalImageMeta: {
    padding: 6,
  },
  clinicalImageTitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  clinicalImageDate: {
    fontSize: 9,
    marginTop: 2,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: BorderRadius.full,
    padding: 3,
  },
  sectionCardDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  stepTabsContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  stepTabsScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  stepTabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  stepBadgeCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeNum: {
    fontSize: 10,
    fontWeight: '700',
  },
  stepTabChipText: {
    fontSize: 12,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  imagePresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  presetImageBtn: {
    width: '48%',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  presetThumb: {
    width: '100%',
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#E2E8F0',
  },
  presetImageTitle: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  previewModalCard: {
    width: '90%',
    maxWidth: 420,
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    ...Shadows.modal,
  },
  previewImageFull: {
    width: '100%',
    height: 260,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#E2E8F0',
    marginTop: 8,
  },
});
