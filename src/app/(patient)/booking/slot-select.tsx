/**
 * FiYDOC - Patient Medical Intake (Carousel Cards)
 * Pixel-perfect 1:1 implementation of Stitch HTML:
 * - Top Fixed Header with step subtitle & help button
 * - Doctor Summary Mini-Banner with Token #12
 * - Stepper Carousel Progress Indicators: 1. Reason, 2. History, 3. Vitals
 * - 3-Card Carousel Deck:
 *   - Card 1: Visit For (Myself vs Family), Profile Snapshot, Reason Chips (+ Custom), Symptoms Notes
 *   - Card 2: Medical Background (Allergies with add/remove, Chronic Conditions with toggle/add)
 *   - Card 3: Physical Triage notice, Vitals Grid, Past ECG/Test Records Uploader Dropzone
 * - "Short on time?" Notice & ABDM Encryption reassurance
 * - Sticky Bottom Navigation with Back, Continue, and Skip & Continue actions
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import { pickClinicalDocument } from '@/utils/mediaPicker';
import { apiClient } from '@/services/apiClient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  HelpCircle,
  ShieldCheck,
  Clock,
  User,
  Users,
  Edit2,
  Heart,
  Plus,
  X,
  AlertTriangle,
  Activity,
  FileUp,
  FileText,
  Shield,
  ArrowRight,
  Check,
  Eye,
} from 'lucide-react-native';
import { DocumentViewerModal } from '@/components/ui/DocumentViewerModal';
import { StitchColors, DEFAULT_DOCTOR_AVATAR, BorderRadius, Shadows, Palette } from '@/constants/theme';
import { Avatar } from '@/components/ui/Avatar';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useAuthStore } from '@/store/useAuthStore';
import { normalizeAllergies, isNegationAllergy } from '@/utils/allergyNormalizer';

const DEFAULT_DOC_IMG = DEFAULT_DOCTOR_AVATAR;

const REASONS = [
  'Chest Discomfort',
  'Blood Pressure',
  'Routine Checkup',
  'Follow-up',
  'Lab Review',
];

const INITIAL_ALLERGIES: string[] = [];
const INITIAL_CONDITIONS: string[] = [];

export default function MedicalIntakeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const params = useLocalSearchParams<{
    doctorId?: string;
    doctorName?: string;
    doctorSpecialty?: string;
    doctorAvatar?: string;
    slotTime?: string;
    tokenNumber?: string;
    date?: string;
    dateLabel?: string;
    fee?: string;
  }>();

  const bookingDoctor = useAppointmentStore((state) => state.bookingDraft?.doctor);
  const doctorName = params.doctorName || bookingDoctor?.name || 'Doctor';
  const slotTime = params.slotTime || '10:30 AM';
  const tokenNumber = params.tokenNumber || null;
  const dateLabel = params.dateLabel || 'Today';
  const fee = params.fee || '800';

  const userFirstName = user?.name ? user.name.split(' ')[0] : 'Me';
  const userInitials = (user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
    : 'PT'
  ).toUpperCase();

  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);
  const [patientType, setPatientType] = useState<'self' | 'family'>('self');
  const [familyMemberName, setFamilyMemberName] = useState('');
  const [familyMemberRelation, setFamilyMemberRelation] = useState('Parent');
  const [familyMemberPhone, setFamilyMemberPhone] = useState('');

  const [selectedReason, setSelectedReason] = useState('Routine Checkup');
  const [customReasons, setCustomReasons] = useState<string[]>([]);
  const [symptomNotes, setSymptomNotes] = useState('');

  // Allergies & Conditions state — clean by default unless patient has real saved history
  const [severeAllergies, setSevereAllergies] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>(
    normalizeAllergies(user?.allergies)
  );
  const [activeConditions, setActiveConditions] = useState<string[]>(
    user?.chronicConditions ? user.chronicConditions.split(',').map((s) => s.trim()).filter(Boolean) : []
  );
  const [conditions, setConditions] = useState<string[]>([]);

  // File upload state
  const [attachedFile, setAttachedFile] = useState<string | null>(null);
  const [attachedFileUri, setAttachedFileUri] = useState<string | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [slotRequiredAlert, setSlotRequiredAlert] = useState(false);

  // In-App Input Modal for Allergies, Conditions & Custom Reasons (Never crashes with window.prompt)
  const [inputModalConfig, setInputModalConfig] = useState<{
    visible: boolean;
    title: string;
    placeholder: string;
    type: 'allergy' | 'condition' | 'reason';
    value: string;
  }>({
    visible: false,
    title: '',
    placeholder: '',
    type: 'allergy',
    value: '',
  });

  const handleOpenInputModal = (type: 'allergy' | 'condition' | 'reason') => {
    if (type === 'allergy') {
      setInputModalConfig({
        visible: true,
        title: 'Add Known Allergy',
        placeholder: 'e.g. Penicillin, Sulfa, Peanuts',
        type: 'allergy',
        value: '',
      });
    } else if (type === 'condition') {
      setInputModalConfig({
        visible: true,
        title: 'Add Pre-existing Condition',
        placeholder: 'e.g. Hypertension, Asthma, Diabetes',
        type: 'condition',
        value: '',
      });
    } else {
      setInputModalConfig({
        visible: true,
        title: 'Add Custom Reason / Symptom',
        placeholder: 'e.g. High fever, Knee joint pain',
        type: 'reason',
        value: '',
      });
    }
  };

  const handleSaveModalInput = () => {
    const val = inputModalConfig.value.trim();
    if (!val) {
      setInputModalConfig((prev) => ({ ...prev, visible: false }));
      return;
    }

    if (inputModalConfig.type === 'allergy') {
      if (!isNegationAllergy(val)) {
        setSevereAllergies((prev) => Array.from(new Set([...prev, val])));
      }
    } else if (inputModalConfig.type === 'condition') {
      setActiveConditions((prev) => Array.from(new Set([...prev, val])));
    } else if (inputModalConfig.type === 'reason') {
      setCustomReasons((prev) => Array.from(new Set([...prev, val])));
      setSelectedReason(val);
    }
    setInputModalConfig((prev) => ({ ...prev, visible: false, value: '' }));
  };

  const handlePickDocument = async () => {
    try {
      const res = await pickClinicalDocument();
      if (res) {
        setAttachedFile(res.name);
        setAttachedFileUri(res.uri);
      }
    } catch (err: any) {
      console.warn('[slot-select] Document pick error:', err?.message);
    }
  };

  const goToStep = (step: 0 | 1 | 2) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStep === 0 && !slotTime) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      setSlotRequiredAlert(true);
      setTimeout(() => setSlotRequiredAlert(false), 3000);
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (currentStep < 2) {
      setCurrentStep((prev) => (prev + 1) as 0 | 1 | 2);
    } else {
      proceedToConfirm();
    }
  };

  const prevStep = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    if (currentStep > 0) {
      setCurrentStep((prev) => (prev - 1) as 0 | 1 | 2);
    }
  };

  const proceedToConfirm = () => {
    if (!slotTime) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      setSlotRequiredAlert(true);
      setCurrentStep(0);
      setTimeout(() => setSlotRequiredAlert(false), 3000);
      return;
    }

    let finalPatientName = '';
    if (patientType === 'self') {
      finalPatientName = user?.name?.trim() || user?.email?.split('@')[0] || 'Patient';
    } else {
      finalPatientName = familyMemberName.trim() || 'Family Member';
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const cleanFee = parseInt(fee.replace(/[^0-9]/g, ''), 10) || 800;
    useAppointmentStore.getState().setBookingDoctor({
      id: params.doctorId || '',
      fullName: doctorName,
      name: doctorName,
      specialization: params.doctorSpecialty || 'Specialist',
      specialty: params.doctorSpecialty || 'Specialist',
      consultationFee: cleanFee,
      clinicAddress: 'In-Clinic OPD',
      hospital: `${doctorName}'s Clinic`,
    } as any);
    useAppointmentStore.getState().setBookingSlot(params.date || new Date().toISOString().slice(0, 10), slotTime);
    if (selectedReason) {
      useAppointmentStore.getState().setBookingSymptoms([selectedReason], symptomNotes);
    }
    const combinedAllergies = Array.from(new Set([...severeAllergies, ...allergies]));
    const combinedConditions = Array.from(new Set([...activeConditions, ...conditions]));
    // Persist to patient profile in background
    if (user?.id && (combinedAllergies.length > 0 || combinedConditions.length > 0)) {
      apiClient('/patients/me/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          allergies: combinedAllergies,
          chronicConditions: combinedConditions.join(', '),
        }),
      }).catch((e: any) => console.warn('[slot-select] Profile allergy update notice:', e?.message));
    }

    const resolvedDoctorAvatar =
      params.doctorAvatar ||
      bookingDoctor?.avatar ||
      bookingDoctor?.profilePhoto ||
      (bookingDoctor as any)?.avatarUrl ||
      (bookingDoctor as any)?.user?.profilePhoto ||
      '';

    router.push({
      pathname: '/(patient)/booking/confirm',
      params: {
        doctorId: params.doctorId || '',
        doctorName,
        doctorSpecialty: params.doctorSpecialty || 'Specialist',
        doctorAvatar: resolvedDoctorAvatar,
        slotTime,
        date: params.date || new Date().toISOString().slice(0, 10),
        dateLabel,
        fee,
        reason: selectedReason,
        patientName: finalPatientName,
        patientRelation: patientType === 'family' ? (familyMemberRelation.trim() || 'Family Member') : 'Self',
        notes: symptomNotes,
        allergies: JSON.stringify(combinedAllergies),
        chronicConditions: JSON.stringify(combinedConditions),
        attachedFile: attachedFile || '',
        attachedFileUri: attachedFileUri || '',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Fixed Header */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            onPress={() => {
              if (currentStep > 0) {
                prevStep();
              } else if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(patient)/(tabs)/home');
              }
            }}
          >
            <ChevronLeft size={22} color={StitchColors.primary} />
          </Pressable>

          <View style={styles.topHeaderCenter}>
            <Text style={styles.topHeaderTitle}>Medical Intake</Text>
            <Text style={styles.topHeaderSubtitle}>
              Step {currentStep + 1} of 3 • {doctorName}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Help"
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            onPress={() => {
              Alert.alert(
                'Medical Intake Info',
                `Your intake card details help ${doctorName} pre-assess your medical history before your OPD consultation.`
              );
            }}
          >
            <HelpCircle size={20} color={StitchColors.onSurfaceVariant} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrap}>
          {/* Doctor Summary Mini-Banner */}
          <View style={styles.miniBanner}>
            <View style={styles.miniAvatarWrap}>
              <Avatar
                uri={params.doctorAvatar || bookingDoctor?.avatar || bookingDoctor?.profilePhoto || (bookingDoctor as any)?.avatarUrl || (bookingDoctor as any)?.user?.profilePhoto || null}
                name={doctorName || 'Doctor'}
                size="md"
                style={styles.miniAvatar}
              />
              {tokenNumber && (
                <View style={styles.tokenMiniBadge}>
                  <Text style={styles.tokenMiniText}>Token #{tokenNumber}</Text>
                </View>
              )}
            </View>

            <View style={styles.miniInfo}>
              <View style={styles.miniDocNameRow}>
                <Text style={styles.miniDocName}>{doctorName}</Text>
                <ShieldCheck size={15} color={StitchColors.primary} />
              </View>
              <Text style={styles.miniDocSub}>{params.doctorSpecialty || null}</Text>
              <View style={styles.miniTimeRow}>
                <Clock size={13} color={StitchColors.primary} />
                <Text style={styles.miniTimeText}>
                  {dateLabel} • {slotTime}
                </Text>
              </View>
            </View>

            <View style={styles.opdTriageBadge}>
              <View style={styles.opdTriageDot} />
              <Text style={styles.opdTriageText}>OPD Triage</Text>
            </View>
          </View>

          {/* Stepper Carousel Progress Indicators */}
          <View style={styles.stepperWrap}>
            {[
              { label: '1. Reason', step: 0 },
              { label: '2. History', step: 1 },
              { label: '3. Vitals', step: 2 },
            ].map((s) => {
              const isCurrent = currentStep === s.step;
              const isDone = currentStep > s.step;
              return (
                <Pressable
                  key={s.step}
                  onPress={() => goToStep(s.step as 0 | 1 | 2)}
                  style={styles.stepperItem}
                >
                  <View
                    style={[
                      styles.stepperBar,
                      isCurrent
                        ? styles.stepperBarCurrent
                        : isDone
                        ? styles.stepperBarDone
                        : styles.stepperBarUpcoming,
                    ]}
                  />
                  <Text
                    style={[
                      styles.stepperLabel,
                      isCurrent
                        ? styles.stepperLabelCurrent
                        : isDone
                        ? styles.stepperLabelDone
                        : styles.stepperLabelUpcoming,
                    ]}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* CAROUSEL DECK */}
          {currentStep === 0 ? (
            /* CARD 1: Patient Profile & Primary Reason */
            <View style={styles.stepCard}>
              <View style={styles.cardTopHeader}>
                <View>
                  <Text style={styles.cardStepIndicator}>Card 1 of 3</Text>
                  <Text style={styles.cardHeading}>Who is this visit for?</Text>
                </View>
                <View style={styles.patientBadge}>
                  <Text style={styles.patientBadgeText}>
                    {patientType === 'family' ? (familyMemberRelation.trim() || 'Family Member') : 'Primary Patient'}
                  </Text>
                </View>
              </View>

              {/* Patient Selector Segmented Tabs */}
              <View style={styles.patientTypeTabs}>
                <Pressable
                  onPress={() => setPatientType('self')}
                  style={[
                    styles.patientTypeTab,
                    patientType === 'self' && styles.patientTypeTabActive,
                  ]}
                >
                  <User
                    size={16}
                    color={patientType === 'self' ? StitchColors.primary : StitchColors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.patientTypeText,
                      patientType === 'self' && styles.patientTypeTextActive,
                    ]}
                  >
                    Myself ({userFirstName})
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPatientType('family')}
                  style={[
                    styles.patientTypeTab,
                    patientType === 'family' && styles.patientTypeTabActive,
                  ]}
                >
                  <Users
                    size={16}
                    color={patientType === 'family' ? StitchColors.primary : StitchColors.onSurfaceVariant}
                  />
                  <Text
                    style={[
                      styles.patientTypeText,
                      patientType === 'family' && styles.patientTypeTextActive,
                    ]}
                  >
                    + Family Member
                  </Text>
                </Pressable>
              </View>

              {patientType === 'self' ? (
                /* Dynamic Self Profile Snapshot Card */
                <View style={styles.profileCard}>
                  <View style={styles.profileCardLeft}>
                    <View style={styles.profileAvatar}>
                      <Text style={styles.profileAvatarText}>{userInitials}</Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.profileNameRow}>
                        <Text style={styles.profileName} numberOfLines={1}>
                          {user?.name || 'Patient (Name not set)'}
                        </Text>
                        {user?.bloodGroup ? (
                          <View style={styles.bloodBadge}>
                            <Text style={styles.bloodText}>{user.bloodGroup}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.profileMeta} numberOfLines={1}>
                        {user?.age ? `${user.age} Yrs` : 'Age —'} • {user?.gender || 'Patient'} • {user?.phone ? `+91 ${user.phone}` : (user?.email || 'No contact set')}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={styles.profileEditBtn}
                    onPress={() => router.push('/(patient)/(tabs)/profile')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Edit2 size={16} color={StitchColors.onSurfaceVariant} />
                  </Pressable>
                </View>
              ) : (
                /* Family Member Input Card */
                <View style={styles.familyCard}>
                  <View style={styles.familyInputRow}>
                    <Text style={styles.familyInputLabel}>Family Member's Full Name *</Text>
                    <TextInput
                      value={familyMemberName}
                      onChangeText={setFamilyMemberName}
                      placeholder="e.g. Meera Sharma"
                      placeholderTextColor={StitchColors.outline}
                      style={styles.familyTextInput}
                    />
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.familyInputLabel}>Relation</Text>
                      <TextInput
                        value={familyMemberRelation}
                        onChangeText={setFamilyMemberRelation}
                        placeholder="Parent / Spouse"
                        placeholderTextColor={StitchColors.outline}
                        style={styles.familyTextInput}
                      />
                    </View>
                    <View style={{ flex: 1.2 }}>
                      <Text style={styles.familyInputLabel}>Contact Number</Text>
                      <TextInput
                        value={familyMemberPhone}
                        onChangeText={setFamilyMemberPhone}
                        placeholder="+91 98765..."
                        placeholderTextColor={StitchColors.outline}
                        style={styles.familyTextInput}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* Primary Reason for Visit Chips */}
              <View style={styles.reasonSection}>
                <View style={styles.reasonSectionHeader}>
                  <Text style={styles.reasonLabel}>Primary Reason for Visit</Text>
                  <Text style={styles.reasonSubLabel}>Select main cause</Text>
                </View>

                <View style={styles.reasonChipsWrap}>
                  {[...REASONS, ...customReasons].map((reason) => {
                    const isSelected = selectedReason === reason;
                    return (
                      <Pressable
                        key={reason}
                        onPress={() => setSelectedReason(reason)}
                        style={[
                          styles.reasonChip,
                          isSelected ? styles.reasonChipActive : styles.reasonChipInactive,
                        ]}
                      >
                        {reason === 'Chest Discomfort' && (
                          <Heart
                            size={15}
                            color={isSelected ? '#ffffff' : StitchColors.onSurface}
                          />
                        )}
                        <Text
                          style={[
                            styles.reasonChipText,
                            isSelected ? styles.reasonChipTextActive : styles.reasonChipTextInactive,
                          ]}
                        >
                          {reason}
                        </Text>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    onPress={() => handleOpenInputModal('reason')}
                    style={styles.addOtherChip}
                  >
                    <Plus size={15} color={StitchColors.primary} />
                    <Text style={styles.addOtherText}>Other</Text>
                  </Pressable>
                </View>

                {/* Symptoms Notes Textarea */}
                <View style={styles.notesWrap}>
                  <View style={styles.notesHeader}>
                    <Text style={styles.notesLabel}>Describe your concern or symptoms</Text>
                    <Text style={styles.notesOptional}>Optional</Text>
                  </View>
                  <View style={styles.textareaContainer}>
                    <TextInput
                      style={styles.textarea}
                      multiline
                      numberOfLines={3}
                      placeholder="Describe what brings you in or any specific concerns, duration, or triggers..."
                      placeholderTextColor={StitchColors.outline}
                      value={symptomNotes}
                      onChangeText={setSymptomNotes}
                    />
                  </View>
                </View>
              </View>

              {/* Micro guidance tip */}
              <View style={styles.tipBox}>
                <Check size={16} color={StitchColors.secondary} />
                <Text style={styles.tipText}>
                  Your clinical notes will be shared securely with your doctor ahead of consultation.
                </Text>
              </View>
            </View>
          ) : currentStep === 1 ? (
            /* CARD 2: Health Background (Allergies & Chronic Conditions) */
            <View style={styles.stepCard}>
              <View style={styles.cardTopHeader}>
                <View>
                  <Text style={styles.cardStepIndicator}>Card 2 of 3</Text>
                  <Text style={styles.cardHeading}>Medical Background</Text>
                </View>
                <View style={[styles.patientBadge, { backgroundColor: StitchColors.surfaceContainerHigh }]}>
                  <Text style={[styles.patientBadgeText, { color: StitchColors.onSurfaceVariant }]}>
                    Safety Vault
                  </Text>
                </View>
              </View>

              {/* Known Allergies */}
              <View style={styles.backgroundGroup}>
                <View style={styles.backgroundGroupHeader}>
                  <View style={styles.bgGroupTitleRow}>
                    <AlertTriangle size={17} color="#ba1a1a" />
                    <Text style={styles.bgGroupTitle}>Known Allergies</Text>
                  </View>
                  <Text style={styles.bgGroupAlert}>Crucial for prescriptions</Text>
                </View>

                <View style={styles.bgChipsWrap}>
                  {severeAllergies.map((item) => (
                    <View key={item} style={styles.severeAllergyTag}>
                      <Text style={styles.severeAllergyText}>{item}</Text>
                      <Pressable
                        onPress={() =>
                          setSevereAllergies(severeAllergies.filter((a) => a !== item))
                        }
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={13} color="#93000a" />
                      </Pressable>
                    </View>
                  ))}

                  {allergies.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => {
                        setSevereAllergies([...severeAllergies, item]);
                        setAllergies(allergies.filter((a) => a !== item));
                      }}
                      style={styles.bgInactiveChip}
                    >
                      <Text style={styles.bgInactiveChipText}>{item}</Text>
                    </Pressable>
                  ))}

                  {severeAllergies.length === 0 && allergies.length === 0 && (
                    <Text style={{ fontSize: 13, color: '#6B7280', fontStyle: 'italic', alignSelf: 'center', marginRight: 8 }}>
                      0 allergies
                    </Text>
                  )}

                  <Pressable onPress={() => handleOpenInputModal('allergy')} style={styles.bgAddChip}>
                    <Plus size={14} color={StitchColors.primary} />
                    <Text style={styles.bgAddChipText}>Add Allergy</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.cardDivider} />

              {/* Chronic Conditions */}
              <View style={styles.backgroundGroup}>
                <View style={styles.backgroundGroupHeader}>
                  <View style={styles.bgGroupTitleRow}>
                    <Activity size={17} color={StitchColors.primary} />
                    <Text style={styles.bgGroupTitle}>Pre-existing Chronic Conditions</Text>
                  </View>
                  <Text style={styles.bgGroupSub}>
                    {params.doctorSpecialty ? `${params.doctorSpecialty} context` : 'Clinical context'}
                  </Text>
                </View>

                <View style={styles.bgChipsWrap}>
                  {activeConditions.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() =>
                        setActiveConditions(activeConditions.filter((c) => c !== item))
                      }
                      style={styles.activeConditionChip}
                    >
                      <Text style={styles.activeConditionText}>{item}</Text>
                      <Check size={13} color="#ffffff" />
                    </Pressable>
                  ))}

                  {conditions.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => {
                        setActiveConditions([...activeConditions, item]);
                        setConditions(conditions.filter((c) => c !== item));
                      }}
                      style={styles.bgInactiveChip}
                    >
                      <Text style={styles.bgInactiveChipText}>{item}</Text>
                    </Pressable>
                  ))}

                  <Pressable onPress={() => handleOpenInputModal('condition')} style={styles.bgAddChip}>
                    <Plus size={14} color={StitchColors.primary} />
                    <Text style={styles.bgAddChipText}>Add Condition</Text>
                  </Pressable>
                </View>
              </View>

              {/* Health locker assurance */}
              <View style={styles.tipBox}>
                <ShieldCheck size={16} color={StitchColors.secondary} />
                <Text style={styles.tipText}>
                  Saved permanently in your Ayushman ABDM Health Locker.
                </Text>
              </View>
            </View>
          ) : (
            /* CARD 3: Vitals & Documents */
            <View style={styles.stepCard}>
              <View style={styles.cardTopHeader}>
                <View>
                  <Text style={styles.cardStepIndicator}>Card 3 of 3</Text>
                  <Text style={styles.cardHeading}>Vitals & Documents</Text>
                </View>
                <View style={styles.patientBadge}>
                  <Text style={styles.patientBadgeText}>Physical Triage</Text>
                </View>
              </View>

              {/* Physical Triage Notice Banner */}
              <View style={styles.triageNoticeBanner}>
                <ShieldCheck size={20} color={StitchColors.primary} />
                <View style={styles.triageNoticeText}>
                  <Text style={styles.triageNoticeTitle}>Clinic Receptionist Vitals Notice</Text>
                  <Text style={styles.triageNoticeDesc}>
                    BP, Pulse, Blood Sugar &amp; Temp will be recorded by clinic staff upon OPD triage check-in at the reception desk.
                  </Text>
                </View>
              </View>

              {/* Placeholder Vitals Grid */}
              <View style={styles.vitalsGrid}>
                <View style={styles.vitalBox}>
                  <View style={styles.vitalHeader}>
                    <Text style={styles.vitalLabel}>Blood Pressure</Text>
                    <Activity size={14} color={StitchColors.primary} />
                  </View>
                  <Text style={styles.vitalVal}>-- / -- <Text style={styles.vitalUnit}>mmHg</Text></Text>
                  <Text style={styles.vitalSub}>Nurse will measure</Text>
                </View>

                <View style={styles.vitalBox}>
                  <View style={styles.vitalHeader}>
                    <Text style={styles.vitalLabel}>Pulse Rate</Text>
                    <Heart size={14} color={StitchColors.primary} />
                  </View>
                  <Text style={styles.vitalVal}>-- <Text style={styles.vitalUnit}>bpm</Text></Text>
                  <Text style={styles.vitalSub}>Nurse will measure</Text>
                </View>

                <View style={styles.vitalBox}>
                  <View style={styles.vitalHeader}>
                    <Text style={styles.vitalLabel}>Blood Sugar</Text>
                    <Activity size={14} color={StitchColors.primary} />
                  </View>
                  <Text style={styles.vitalVal}>-- <Text style={styles.vitalUnit}>mg/dL</Text></Text>
                  <Text style={styles.vitalSub}>Fasting / Random</Text>
                </View>

                <View style={styles.vitalBox}>
                  <View style={styles.vitalHeader}>
                    <Text style={styles.vitalLabel}>Body Temp</Text>
                    <Activity size={14} color={StitchColors.primary} />
                  </View>
                  <Text style={styles.vitalVal}>-- <Text style={styles.vitalUnit}>°F</Text></Text>
                  <Text style={styles.vitalSub}>Infrared triage</Text>
                </View>
              </View>

              {/* Attach Past ECG & Test Records Dropzone */}
              <View style={styles.uploaderSection}>
                <View style={styles.uploaderHeader}>
                  <Text style={styles.uploaderTitle}>Attach Past ECG & Test Records</Text>
                  <Text style={styles.uploaderOptional}>Optional</Text>
                </View>

                {attachedFile ? (
                  <View style={styles.attachedCard}>
                    <View style={styles.attachedCardLeft}>
                      <View style={styles.attachedIconWrap}>
                        <FileText size={20} color={StitchColors.primary} />
                      </View>
                      <View style={styles.attachedTextWrap}>
                        <Text style={styles.attachedFileName} numberOfLines={1}>
                          {attachedFile}
                        </Text>
                        <Text style={styles.attachedFileSub}>
                          Ready for doctor review • 1 document attached
                        </Text>
                      </View>
                    </View>

                    <View style={styles.attachedCardActions}>
                      <Pressable
                        onPress={() => setViewerVisible(true)}
                        style={styles.attachedViewBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="View attached document"
                      >
                        <Eye size={13} color={StitchColors.primary} />
                        <Text style={styles.attachedViewText}>View</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          setAttachedFile(null);
                          setAttachedFileUri(null);
                        }}
                        style={styles.attachedRemoveBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="Remove attached document"
                      >
                        <X size={14} color="#DC2626" />
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <Pressable
                    onPress={handlePickDocument}
                    style={styles.dropzone}
                  >
                    <View style={styles.dropzoneIconWrap}>
                      <FileUp size={20} color={StitchColors.primary} />
                    </View>
                    <Text style={styles.dropzoneTitle}>Upload ECG, Blood Reports or Prescriptions</Text>
                    <Text style={styles.dropzoneSubtitle}>
                      PDF, JPG up to 15MB • Reviewed by doctor before OPD
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {/* "Short on time?" Gentle Freedom Notice */}
          <View style={styles.shortTimeNotice}>
            <View style={styles.shortTimeIconWrap}>
              <Clock size={16} color={StitchColors.secondary} />
            </View>
            <View style={styles.shortTimeTextWrap}>
              <Text style={styles.shortTimeTitle}>Short on time?</Text>
              <Text style={styles.shortTimeDesc}>
                You can skip or update your symptoms and test reports anytime from{' '}
                <Text style={styles.shortTimeBold}>My Appointments</Text> before your turn at the clinic.
              </Text>
            </View>
          </View>

          {/* Privacy Reassurance ABDM Badge */}
          <View style={styles.abdmBadgeRow}>
            <Shield size={14} color={StitchColors.secondary} />
            <Text style={styles.abdmBadgeText}>
              End-to-end encrypted medical data under ABDM compliant guidelines
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Navigation Bar */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) },
        ]}
      >
        <View style={styles.bottomBarInner}>
          {slotRequiredAlert && (
            <View style={{ backgroundColor: '#FEF3C7', borderColor: '#FCD34D', borderWidth: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, marginBottom: 8, alignItems: 'center' }}>
              <Text style={{ color: '#92400E', fontSize: 12, fontWeight: '700' }}>
                ⚠️ Please select an appointment time slot before continuing
              </Text>
            </View>
          )}
          <View style={styles.bottomActionsRow}>
            {currentStep > 0 && (
              <Pressable
                onPress={prevStep}
                style={({ pressed }) => [styles.backStepBtn, pressed && styles.buttonPressed]}
              >
                <ChevronLeft size={18} color={StitchColors.onSurface} />
                <Text style={styles.backStepText}>Back</Text>
              </Pressable>
            )}

            <Pressable
              onPress={nextStep}
              style={({ pressed }) => [
                styles.primaryActionBtn,
                currentStep === 0 && !slotTime && { opacity: 0.88 },
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={styles.primaryActionText}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {currentStep === 0
                  ? (slotTime ? 'Continue to History' : 'Select a Slot to Continue')
                  : currentStep === 1
                  ? 'Continue to Vitals'
                  : 'Proceed to Confirm Booking'}
              </Text>
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>
                  {currentStep === 2 ? 'Review' : `Step ${currentStep + 1}/3`}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Secondary Skip Action */}
          <Pressable onPress={proceedToConfirm} style={styles.skipBtn}>
            <Text style={styles.skipBtnText}>
              I'll update medical history later • <Text style={styles.skipUnderline}>Skip & Continue</Text>
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Dynamic Modal for adding Allergies, Conditions, or Custom Reasons */}
      <Modal
        visible={inputModalConfig.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setInputModalConfig((prev) => ({ ...prev, visible: false }))}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.inputModalBackdrop}
        >
          <View style={styles.inputModalCard}>
            <View style={styles.inputModalHeader}>
              <Text style={styles.inputModalTitle}>{inputModalConfig.title}</Text>
              <Pressable
                onPress={() => setInputModalConfig((prev) => ({ ...prev, visible: false }))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color={StitchColors.onSurfaceVariant} />
              </Pressable>
            </View>

            <TextInput
              style={styles.inputModalTextInput}
              placeholder={inputModalConfig.placeholder}
              placeholderTextColor={StitchColors.outline}
              value={inputModalConfig.value}
              onChangeText={(text) => setInputModalConfig((prev) => ({ ...prev, value: text }))}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveModalInput}
            />

            <View style={styles.inputModalActions}>
              <Pressable
                onPress={() => setInputModalConfig((prev) => ({ ...prev, visible: false }))}
                style={styles.inputModalCancelBtn}
              >
                <Text style={styles.inputModalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveModalInput}
                style={styles.inputModalSaveBtn}
              >
                <Text style={styles.inputModalSaveText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Universal In-App Document Viewer Modal */}
      <DocumentViewerModal
        visible={viewerVisible}
        title={attachedFile || 'Pre-Consultation Document'}
        subtitle="Uploaded Patient Clinical Record"
        documentUrl={attachedFileUri}
        onClose={() => setViewerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: StitchColors.surface,
  },
  topHeader: {
    height: 60,
    backgroundColor: 'rgba(250, 248, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 226, 253, 0.4)',
    justifyContent: 'center',
  },
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topHeaderCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  topHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  topHeaderSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: StitchColors.secondary,
    marginTop: 1,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: StitchColors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.3)',
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  scrollContainer: {
    paddingBottom: 130,
  },
  contentWrap: {
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },

  miniBanner: {
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniAvatarWrap: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: StitchColors.surfaceContainerHigh,
  },
  miniAvatar: {
    width: '100%',
    height: '100%',
  },
  tokenMiniBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 57, 126, 0.85)',
    paddingVertical: 1,
    alignItems: 'center',
  },
  tokenMiniText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  miniInfo: {
    flex: 1,
    minWidth: 0,
  },
  miniDocNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniDocName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  miniDocSub: {
    fontSize: 11.5,
    color: StitchColors.onSurfaceVariant,
    marginTop: 1,
  },
  miniTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  miniTimeText: {
    fontSize: 11,
    fontWeight: '600',
    color: StitchColors.primary,
  },
  opdTriageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 107, 95, 0.1)',
  },
  opdTriageDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: StitchColors.secondary,
  },
  opdTriageText: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.secondary,
  },

  /* Stepper */
  stepperWrap: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  stepperItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  stepperBar: {
    height: 6,
    width: '100%',
    borderRadius: 3,
  },
  stepperBarCurrent: {
    backgroundColor: StitchColors.primary,
  },
  stepperBarDone: {
    backgroundColor: StitchColors.secondary,
  },
  stepperBarUpcoming: {
    backgroundColor: StitchColors.surfaceContainerHigh,
  },
  stepperLabel: {
    fontSize: 10.5,
  },
  stepperLabelCurrent: {
    fontWeight: '700',
    color: StitchColors.primary,
  },
  stepperLabelDone: {
    fontWeight: '600',
    color: StitchColors.secondary,
  },
  stepperLabelUpcoming: {
    color: StitchColors.onSurfaceVariant,
  },

  /* Cards */
  stepCard: {
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.35)',
    gap: 14,
  },
  cardTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 198, 211, 0.2)',
  },
  cardStepIndicator: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: StitchColors.onSurface,
    marginTop: 2,
  },
  patientBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 107, 95, 0.1)',
  },
  patientBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: StitchColors.secondary,
  },
  patientTypeTabs: {
    flexDirection: 'row',
    backgroundColor: StitchColors.surfaceContainerLow,
    padding: 3,
    borderRadius: 12,
    gap: 4,
  },
  patientTypeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  patientTypeTabActive: {
    backgroundColor: StitchColors.surfaceContainerLowest,
  },
  patientTypeText: {
    fontSize: 12.5,
    fontWeight: '500',
    color: StitchColors.onSurfaceVariant,
  },
  patientTypeTextActive: {
    fontWeight: '700',
    color: StitchColors.primary,
  },
  profileCard: {
    backgroundColor: StitchColors.surfaceContainerLow,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.25)',
  },
  profileCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: StitchColors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  bloodBadge: {
    backgroundColor: 'rgba(20, 80, 163, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bloodText: {
    fontSize: 10,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  profileMeta: {
    fontSize: 11.5,
    color: StitchColors.onSurfaceVariant,
    marginTop: 2,
  },
  profileEditBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: StitchColors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyCard: {
    backgroundColor: StitchColors.surfaceContainerLow,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.25)',
  },
  savedFamilySection: {
    marginBottom: 4,
    gap: 6,
  },
  savedFamilyList: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  savedFamilyChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.4)',
  },
  savedFamilyChipActive: {
    backgroundColor: StitchColors.primary,
    borderColor: StitchColors.primary,
  },
  savedFamilyChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: StitchColors.onSurface,
  },
  savedFamilyChipTextActive: {
    color: '#ffffff',
  },
  familyInputRow: {
    gap: 4,
  },
  familyInputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.onSurfaceVariant,
    marginBottom: 4,
  },
  familyTextInput: {
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: StitchColors.onSurface,
  },
  reasonSection: {
    gap: 8,
  },
  reasonSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reasonLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  reasonSubLabel: {
    fontSize: 11,
    color: StitchColors.outline,
  },
  reasonChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  reasonChipActive: {
    backgroundColor: StitchColors.primaryContainer,
  },
  reasonChipInactive: {
    backgroundColor: StitchColors.surfaceContainerLow,
  },
  reasonChipText: {
    fontSize: 12,
  },
  reasonChipTextActive: {
    fontWeight: '700',
    color: '#ffffff',
  },
  reasonChipTextInactive: {
    color: StitchColors.onSurface,
  },
  addOtherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: StitchColors.surfaceContainerHigh,
  },
  addOtherText: {
    fontSize: 12,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  notesWrap: {
    marginTop: 6,
    gap: 6,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notesLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: StitchColors.onSurface,
  },
  notesOptional: {
    fontSize: 11,
    color: StitchColors.outline,
  },
  textareaContainer: {
    backgroundColor: StitchColors.surfaceContainerLow,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.25)',
  },
  textarea: {
    fontSize: 12.5,
    color: StitchColors.onSurface,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  tipBox: {
    backgroundColor: 'rgba(242, 243, 255, 0.6)',
    borderRadius: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    fontSize: 11.5,
    color: StitchColors.onSurfaceVariant,
    flex: 1,
  },

  /* Background Group (Allergies & Conditions) */
  backgroundGroup: {
    gap: 8,
  },
  backgroundGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  bgGroupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  bgGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  bgGroupAlert: {
    fontSize: 10.5,
    color: '#ba1a1a',
    fontWeight: '600',
  },
  bgGroupSub: {
    fontSize: 10.5,
    color: StitchColors.outline,
  },
  bgChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  severeAllergyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#ffdad6',
  },
  severeAllergyText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#93000a',
  },
  bgInactiveChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: StitchColors.surfaceContainerLow,
  },
  bgInactiveChipText: {
    fontSize: 11.5,
    color: StitchColors.onSurface,
  },
  bgAddChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: StitchColors.surfaceContainerHigh,
  },
  bgAddChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(195, 198, 211, 0.25)',
  },
  activeConditionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: StitchColors.primaryContainer,
  },
  activeConditionText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#ffffff',
  },

  /* Card 3: Vitals */
  triageNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(218, 226, 253, 0.4)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(20, 80, 163, 0.15)',
  },
  triageNoticeText: {
    flex: 1,
  },
  triageNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  triageNoticeDesc: {
    fontSize: 11,
    color: StitchColors.onSurface,
    marginTop: 2,
    lineHeight: 15,
  },
  vitalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vitalBox: {
    width: '48.5%',
    backgroundColor: StitchColors.surfaceContainerLow,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.25)',
    justifyContent: 'space-between',
    minHeight: 74,
  },
  vitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  vitalLabel: {
    fontSize: 11,
    color: StitchColors.onSurfaceVariant,
    fontWeight: '500',
  },
  vitalVal: {
    fontSize: 15,
    fontWeight: '700',
    color: StitchColors.onSurface,
    marginVertical: 2,
  },
  vitalUnit: {
    fontSize: 10,
    fontWeight: '400',
    color: StitchColors.outline,
  },
  vitalSub: {
    fontSize: 9.5,
    color: StitchColors.secondary,
    fontWeight: '600',
  },
  uploaderSection: {
    gap: 6,
  },
  uploaderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  uploaderOptional: {
    fontSize: 11,
    color: StitchColors.outline,
  },
  dropzone: {
    backgroundColor: StitchColors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 80, 163, 0.3)',
    borderStyle: 'dashed',
  },
  dropzoneIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: StitchColors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  dropzoneTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: StitchColors.onSurface,
    textAlign: 'center',
  },
  dropzoneSubtitle: {
    fontSize: 10.5,
    color: StitchColors.outline,
    textAlign: 'center',
    marginTop: 2,
  },
  attachedCard: {
    backgroundColor: '#F0F7FF',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  attachedCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  attachedIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachedTextWrap: {
    flex: 1,
  },
  attachedFileName: {
    fontSize: 13,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  attachedFileSub: {
    fontSize: 11,
    color: StitchColors.primary,
    marginTop: 2,
  },
  attachedCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  attachedViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  attachedViewText: {
    fontSize: 12,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  attachedRemoveBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Short on Time Notice */
  shortTimeNotice: {
    backgroundColor: 'rgba(242, 243, 255, 0.8)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.2)',
  },
  shortTimeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 107, 95, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortTimeTextWrap: {
    flex: 1,
  },
  shortTimeTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  shortTimeDesc: {
    fontSize: 11.5,
    color: StitchColors.onSurfaceVariant,
    marginTop: 2,
    lineHeight: 16,
  },
  shortTimeBold: {
    fontWeight: '700',
    color: StitchColors.primary,
  },
  abdmBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  abdmBadgeText: {
    fontSize: 11,
    color: StitchColors.outline,
  },

  /* Sticky Bottom Bar */
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 198, 211, 0.3)',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
  },
  bottomBarInner: {
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    gap: 6,
  },
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backStepBtn: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 24,
    backgroundColor: StitchColors.surfaceContainerLow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  backStepText: {
    fontSize: 13,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  primaryActionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: StitchColors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: StitchColors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 3px 12px rgba(20, 80, 163, 0.25)',
      },
    }),
  },
  primaryActionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
  },
  actionBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  actionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 3,
  },
  skipBtnText: {
    fontSize: 11.5,
    color: StitchColors.onSurfaceVariant,
  },
  skipUnderline: {
    textDecorationLine: 'underline',
    fontWeight: '600',
    color: StitchColors.primary,
  },

  /* Input Modal Styles */
  inputModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inputModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  inputModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  inputModalTextInput: {
    backgroundColor: StitchColors.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: StitchColors.onSurface,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.4)',
  },
  inputModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  inputModalCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  inputModalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: StitchColors.onSurfaceVariant,
  },
  inputModalSaveBtn: {
    backgroundColor: StitchColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  inputModalSaveText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
});
