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
} from 'react-native';
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
} from 'lucide-react-native';
import { StitchColors, DEFAULT_DOCTOR_AVATAR } from '@/constants/theme';
import * as DocumentPicker from 'expo-document-picker';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useAuthStore } from '@/store/useAuthStore';

const DEFAULT_DOC_IMG = DEFAULT_DOCTOR_AVATAR;

const REASONS = [
  'Chest Discomfort',
  'Blood Pressure',
  'Routine Checkup',
  'Follow-up',
  'Lab Review',
];

const INITIAL_ALLERGIES = ['Sulfa Drugs', 'Dust / Pollen', 'Food Allergies'];
const INITIAL_CONDITIONS = ['Diabetes Type 2', 'Thyroid (Hypo)', 'Asthma'];

export default function MedicalIntakeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const familyMembers = useAuthStore((state) => state.familyMembers || []);
  const addFamilyMember = useAuthStore((state) => state.addFamilyMember);

  const params = useLocalSearchParams<{
    doctorId?: string;
    doctorName?: string;
    doctorSpecialty?: string;
    slotTime?: string;
    tokenNumber?: string;
    dateLabel?: string;
    fee?: string;
  }>();

  const doctorName = params.doctorName || 'Dr. Rajesh Sharma';
  const slotTime = params.slotTime || '04:15 PM';
  const tokenNumber = params.tokenNumber || '12';
  const dateLabel = params.dateLabel || 'Today, 18 Oct';
  const fee = params.fee || '800';

  const userFirstName = user?.name ? user.name.split(' ')[0] : 'Me';
  const userInitials = (user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
    : 'PT'
  ).toUpperCase();

  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0);
  const [patientType, setPatientType] = useState<'self' | 'family'>('self');
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);
  const [familyMemberName, setFamilyMemberName] = useState('');
  const [familyMemberRelation, setFamilyMemberRelation] = useState('Parent');
  const [familyMemberPhone, setFamilyMemberPhone] = useState('');

  const [selectedReason, setSelectedReason] = useState('Chest Discomfort');
  const [customReasons, setCustomReasons] = useState<string[]>([]);
  const [symptomNotes, setSymptomNotes] = useState('');

  // Allergies & Conditions state
  const [severeAllergies, setSevereAllergies] = useState<string[]>(['Penicillin']);
  const [allergies, setAllergies] = useState<string[]>(INITIAL_ALLERGIES);
  const [activeConditions, setActiveConditions] = useState<string[]>(['Hypertension']);
  const [conditions, setConditions] = useState<string[]>(INITIAL_CONDITIONS);

  // File upload state
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets[0]) {
        const file = res.assets[0];
        const sizeMb = file.size ? (file.size / (1024 * 1024)).toFixed(1) : '1.0';
        setAttachedFile(`${file.name} (${sizeMb} MB)`);
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
    let finalPatientName = '';
    if (patientType === 'self') {
      finalPatientName = user?.name?.trim() || '';
      if (!finalPatientName) {
        Alert.alert(
          'Patient Name Required',
          'Please complete your patient profile name before booking an OPD slot.',
          [
            { text: 'Go to Profile', onPress: () => router.push('/(patient)/(tabs)/profile') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }
    } else {
      finalPatientName = familyMemberName.trim();
      if (!finalPatientName) {
        Alert.alert(
          'Family Member Name Required',
          'Please enter the patient\'s name before continuing.'
        );
        return;
      }
      // Save family member into persisted store for future one-tap reuse
      addFamilyMember({
        name: finalPatientName,
        relation: familyMemberRelation.trim() || 'Family',
        phone: familyMemberPhone.trim() || undefined,
      });
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const cleanFee = parseInt(fee.replace(/[^0-9]/g, ''), 10) || 800;
    useAppointmentStore.getState().setBookingDoctor({
      id: params.doctorId || 'doc-1',
      fullName: doctorName,
      specialization: params.doctorSpecialty || 'Cardiologist',
      consultationFee: cleanFee,
      clinicAddress: 'Fortis OPD • Sector 44, Gurugram',
      rating: 4.9,
      experienceYears: 12,
    } as any);
    useAppointmentStore.getState().setBookingSlot(slotTime, dateLabel);
    if (selectedReason) {
      useAppointmentStore.getState().setBookingSymptoms([selectedReason]);
    }
    router.push({
      pathname: '/(patient)/booking/confirm',
      params: {
        doctorId: params.doctorId || 'doc-1',
        doctorName,
        doctorSpecialty: params.doctorSpecialty || 'Cardiologist',
        slotTime,
        tokenNumber,
        dateLabel,
        fee,
        reason: selectedReason,
        patientName: finalPatientName,
      },
    });
  };

  const handleAddCustomReason = () => {
    Alert.prompt
      ? Alert.prompt('Add Custom Reason', 'Enter primary symptom or visit purpose:', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: (text?: string) => {
              if (text && text.trim()) {
                setCustomReasons([...customReasons, text.trim()]);
                setSelectedReason(text.trim());
              }
            },
          },
        ])
      : (() => {
          const val = prompt('Enter primary symptom or visit purpose:');
          if (val && val.trim()) {
            setCustomReasons([...customReasons, val.trim()]);
            setSelectedReason(val.trim());
          }
        })();
  };

  const handleAddAllergy = () => {
    const val = prompt ? prompt('Add Allergy Name:') : null;
    if (val && val.trim()) {
      setSevereAllergies([...severeAllergies, val.trim()]);
    }
  };

  const handleAddCondition = () => {
    const val = prompt ? prompt('Add Pre-existing Condition:') : null;
    if (val && val.trim()) {
      setActiveConditions([...activeConditions, val.trim()]);
    }
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
              Step {currentStep + 1} of 3 • {doctorName} • Fortis Hospital
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Help"
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            onPress={() => {
              Alert.alert(
                'Medical Intake Info',
                `Your intake card details help ${doctorName} pre-assess your cardiology token #${tokenNumber} before you arrive at the Fortis OPD desk.`
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
              <Image
                source={{ uri: DEFAULT_DOC_IMG }}
                style={styles.miniAvatar}
                contentFit="cover"
              />
              <View style={styles.tokenMiniBadge}>
                <Text style={styles.tokenMiniText}>Token #{tokenNumber}</Text>
              </View>
            </View>

            <View style={styles.miniInfo}>
              <View style={styles.miniDocNameRow}>
                <Text style={styles.miniDocName}>{doctorName}</Text>
                <ShieldCheck size={15} color={StitchColors.primary} />
              </View>
              <Text style={styles.miniDocSub}>MD, DM Cardiology • Fortis OPD</Text>
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
                  <Text style={styles.patientBadgeText}>Primary Patient</Text>
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
                  {familyMembers.length > 0 ? (
                    <View style={styles.savedFamilySection}>
                      <Text style={styles.familyInputLabel}>Select Saved Family Member:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedFamilyList}>
                        {familyMembers.map((member) => {
                          const isSelected = selectedFamilyId === member.id;
                          return (
                            <Pressable
                              key={member.id}
                              onPress={() => {
                                if (isSelected) {
                                  setSelectedFamilyId(null);
                                } else {
                                  setSelectedFamilyId(member.id);
                                  setFamilyMemberName(member.name);
                                  if (member.relation) setFamilyMemberRelation(member.relation);
                                  if (member.phone) setFamilyMemberPhone(member.phone);
                                }
                              }}
                              style={[
                                styles.savedFamilyChip,
                                isSelected && styles.savedFamilyChipActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.savedFamilyChipText,
                                  isSelected && styles.savedFamilyChipTextActive,
                                ]}
                              >
                                {member.name} ({member.relation})
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  ) : null}

                  <View style={styles.familyInputRow}>
                    <Text style={styles.familyInputLabel}>Family Member's Full Name *</Text>
                    <TextInput
                      value={familyMemberName}
                      onChangeText={(val) => {
                        setFamilyMemberName(val);
                        if (selectedFamilyId) setSelectedFamilyId(null);
                      }}
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
                    onPress={handleAddCustomReason}
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
                  Your selection helps prioritize cardiology triage slot #{tokenNumber}.
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

                  <Pressable onPress={handleAddAllergy} style={styles.bgAddChip}>
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
                  <Text style={styles.bgGroupSub}>Cardiology context</Text>
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

                  <Pressable onPress={handleAddCondition} style={styles.bgAddChip}>
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
                    BP, Pulse, Blood Sugar & Temp will be recorded by clinic staff upon OPD triage check-in at Fortis desk.
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

                <Pressable
                  onPress={() => {
                    setAttachedFile('ecg_report_aug2023.pdf (1.2 MB)');
                  }}
                  style={styles.dropzone}
                >
                  <View style={styles.dropzoneIconWrap}>
                    <FileUp size={20} color={StitchColors.primary} />
                  </View>
                  <Text style={styles.dropzoneTitle}>Upload ECG, Blood Reports or Prescriptions</Text>
                  <Text style={styles.dropzoneSubtitle}>
                    PDF, JPG up to 15MB • Reviewed by doctor before OPD
                  </Text>

                  {attachedFile && (
                    <View style={styles.filePill}>
                      <FileText size={14} color={StitchColors.secondary} />
                      <Text style={styles.fileNameText}>{attachedFile}</Text>
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          setAttachedFile(null);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <X size={13} color={StitchColors.outline} />
                      </Pressable>
                    </View>
                  )}
                </Pressable>
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
              style={({ pressed }) => [styles.primaryActionBtn, pressed && styles.buttonPressed]}
            >
              <Text style={styles.primaryActionText}>
                {currentStep === 0
                  ? 'Continue to History'
                  : currentStep === 1
                  ? 'Continue to Vitals'
                  : 'Proceed to Confirm Booking'}
              </Text>
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>
                  {currentStep === 2 ? `Token #${tokenNumber}` : `Step ${currentStep + 1}/3`}
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
  },
  bgGroupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  filePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: StitchColors.surfaceContainerLowest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.3)',
  },
  fileNameText: {
    fontSize: 11,
    color: StitchColors.onSurface,
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
});
