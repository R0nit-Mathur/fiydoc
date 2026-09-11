import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  User,
  Calendar,
  Smartphone,
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  ShieldCheck,
  MapPin,
  Clock,
  Shield,
} from 'lucide-react-native';
import { StepProgressTracker } from '@/components/ui/StepProgressTracker';
import { CardCarouselTabs, CarouselDots } from '@/components/ui/CardCarouselTabs';
import { FileUploadCard } from '@/components/ui/FileUploadCard';
import { SegmentedRoleSelector } from '@/components/ui/SegmentedRoleSelector';
import { useAuthStore } from '@/store/useAuthStore';
import { StitchColors } from '@/constants/theme';

export interface DoctorRegistrationViewProps {
  onSwitchToPatient?: () => void;
  showRoleSelector?: boolean;
}

export function DoctorRegistrationView({
  onSwitchToPatient,
  showRoleSelector = true,
}: DoctorRegistrationViewProps) {
  const router = useRouter();
  const { user, setSession } = useAuthStore();

  // Primary Step: 1 = Basic Info, 2 = Education & License, 3 = Clinic & Hospital
  const [mainStep, setMainStep] = useState<1 | 2 | 3>(1);

  // Step 1: Basic Info Form State
  const [doctorName, setDoctorName] = useState(
    user?.name ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`) : 'Dr. Rajesh Sharma'
  );
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dob, setDob] = useState('14/08/1984');
  const [contactPhone, setContactPhone] = useState('+91 98201 45872');
  const [contactEmail, setContactEmail] = useState(user?.email || 'dr.rajesh@mumbaicardiocare.in');
  const [step1Loading, setStep1Loading] = useState(false);
  const [step1Success, setStep1Success] = useState(false);

  // Step 2: 4-Card Flow State
  const [cardIndex, setCardIndex] = useState(0); // 0 = UG, 1 = Council, 2 = PG, 3 = ID Proof
  // Card 1: UG
  const [ugDegree, setUgDegree] = useState<'MBBS' | 'BDS' | 'BAMS' | 'BHMS'>('MBBS');
  const [ugCollege, setUgCollege] = useState('Seth GS Medical College & KEM Hospital, Mumbai');
  const [ugState, setUgState] = useState('Maharashtra');
  const [ugYear, setUgYear] = useState('2015');
  const [ugFileUploaded, setUgFileUploaded] = useState(true);

  // Card 2: Council
  const [primaryCouncil, setPrimaryCouncil] = useState('Maharashtra Medical Council (MMC)');
  const [councilRegNumber, setCouncilRegNumber] = useState('MMC-2015/08/3421');
  const [councilRegYear, setCouncilRegYear] = useState('2015');
  const [dualLicenseActive, setDualLicenseActive] = useState(true);
  const [secondaryCouncil, setSecondaryCouncil] = useState('Karnataka Medical Council (KMC)');
  const [secondaryRegNumber, setSecondaryRegNumber] = useState('KMC-108249');
  const [secondaryRegYear, setSecondaryRegYear] = useState('2018');

  // Card 3: PG & Specialization
  const [hasPg, setHasPg] = useState(true);
  const [pgCategory, setPgCategory] = useState('MD / MS (Doctor of Medicine / Surgery)');
  const [specialization, setSpecialization] = useState('Cardiology / General Medicine');
  const [pgCollege, setPgCollege] = useState('Grant Government Medical College & Sir JJ Hospitals');
  const [pgState, setPgState] = useState('Maharashtra');
  const [pgYear, setPgYear] = useState('2019');
  const [pgAqNumber, setPgAqNumber] = useState('AQ-MMC-9932');
  const [pgFileUploaded, setPgFileUploaded] = useState(true);

  // Card 4: ID Proof
  const [idVerified, setIdVerified] = useState(true);
  const [idLoading, setIdLoading] = useState(false);

  // Step 3: 3-Slide Flow State
  const [slideIndex, setSlideIndex] = useState(0); // 0 = Clinic, 1 = Hospital, 2 = Schedule
  // Slide 1: Primary Clinic
  const [practiceType, setPracticeType] = useState<'Own Clinic' | 'Hospital OPD' | 'Polyclinic'>('Own Clinic');
  const [clinicName, setClinicName] = useState('Sharma Heart & Vascular Clinic');
  const [clinicAddress, setClinicAddress] = useState('Suite 302, Green Glen Medical Enclave, Bellandur');
  const [clinicCity, setClinicCity] = useState('Bengaluru, Karnataka');
  const [clinicPin, setClinicPin] = useState('560103');
  const [clinicFileUploaded, setClinicFileUploaded] = useState(true);

  // Slide 2: Hospital Affiliations
  const [hospitalName, setHospitalName] = useState('Apollo Hospitals, Bannerghatta Road');
  const [hospitalDept, setHospitalDept] = useState('Cardiology / Cath Lab');
  const [hospitalDesignation, setHospitalDesignation] = useState('Senior Consultant');
  const [affiliationNature, setAffiliationNature] = useState<'Visiting' | 'Full-Time'>('Visiting');
  const [hospitalFileUploaded, setHospitalFileUploaded] = useState(false);

  // Slide 3: OPD Timings & Consultation Fee
  const [consultationFee, setConsultationFee] = useState('800');
  const [slotDuration, setSlotDuration] = useState('15 Mins / Patient');
  const [selectedDays, setSelectedDays] = useState<string[]>(['M', 'T', 'W', 'T2', 'F', 'S']);
  const [finalSubmitting, setFinalSubmitting] = useState(false);
  const [error, setError] = useState('');

  // ---------------- Handlers ----------------
  const handleStep1Continue = () => {
    setError('');
    if (!doctorName.trim()) {
      setError('Please provide your full professional name.');
      return;
    }
    if (!contactPhone.trim()) {
      setError('Mobile number is required for verification.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setStep1Loading(true);
    setTimeout(() => {
      setStep1Loading(false);
      setStep1Success(true);
      setTimeout(() => {
        setMainStep(2);
        setCardIndex(0);
        setStep1Success(false);
      }, 700);
    }, 1200);
  };

  const handleCard4Verification = () => {
    setIdLoading(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setTimeout(() => {
      setIdLoading(false);
      setIdVerified(true);
      setMainStep(3);
      setSlideIndex(0);
    }, 1200);
  };

  const toggleDay = (dayKey: string) => {
    if (selectedDays.includes(dayKey)) {
      setSelectedDays(selectedDays.filter((d) => d !== dayKey));
    } else {
      setSelectedDays([...selectedDays, dayKey]);
    }
  };

  const handleFinalSubmit = () => {
    setFinalSubmitting(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const updatedUser = {
      ...(user || {}),
      id: user?.id || 'doc-default',
      name: doctorName.trim(),
      email: contactEmail.trim(),
      role: 'doctor' as const,
      onboardingCompleted: true,
      verificationStatus: 'verified' as const,
      specialty: specialization,
      qualification: hasPg ? `${ugDegree}, ${pgCategory.split(' ')[0]}` : ugDegree,
      licenseNumber: councilRegNumber,
      hospital: hospitalName || clinicName,
      consultationFee: consultationFee,
    };

    setTimeout(() => {
      setSession(updatedUser as any);
      setFinalSubmitting(false);
      router.replace('/(doctor)/(tabs)/home');
    }, 1500);
  };

  return (
    <View style={styles.container}>
      {/* Segmented Role Selector */}
      {showRoleSelector && (
        <View style={styles.segmentedControlWrap}>
          <SegmentedRoleSelector
            selectedRole="doctor"
            onSelectRole={(selected) => {
              if (selected === 'patient' && onSwitchToPatient) {
                onSwitchToPatient();
              }
            }}
            patientLabel="Patient"
            doctorLabel="Doctor"
            showIcons
          />
        </View>
      )}

      {/* Stepper Progress Bar (Step 1, 2, 3) */}
      <StepProgressTracker currentStep={mainStep} />

      {/* Error Message */}
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* ============================================================ */}
      {/* STEP 1: BASIC INFO                                            */}
      {/* ============================================================ */}
      {mainStep === 1 && (
        <View style={styles.stepContainer}>
          <View style={styles.screenTitleBox}>
            <View style={styles.screenTitleTagRow}>
              <Text style={styles.screenTitle}>Doctor Registration</Text>
              <View style={styles.stepBadgePill}>
                <Text style={styles.stepBadgeText}>Step 1 of 3</Text>
              </View>
            </View>
            <Text style={styles.screenSubtitle}>
              Provide your personal and professional contact details to begin verification.
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Full Name with Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name with Title</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color="#737783" style={styles.inputIcon} />
                <TextInput
                  value={doctorName}
                  onChangeText={setDoctorName}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  placeholderTextColor="#737783"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Gender Pills */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {(['Male', 'Female', 'Other'] as const).map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setGender(item)}
                    style={[
                      styles.genderButton,
                      gender === item ? styles.genderButtonActive : styles.genderButtonInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.genderButtonText,
                        gender === item && styles.genderButtonTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <View style={styles.inputWrapper}>
                <Calendar size={18} color="#737783" style={styles.inputIcon} />
                <TextInput
                  value={dob}
                  onChangeText={setDob}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#737783"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Number (for OTP & NMC Linkage)</Text>
              <View style={styles.inputWrapper}>
                <Smartphone size={18} color="#737783" style={styles.inputIcon} />
                <TextInput
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#737783"
                  style={styles.textInput}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Professional Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Professional / Hospital Work Email</Text>
              <View style={styles.inputWrapper}>
                <Mail size={18} color="#737783" style={styles.inputIcon} />
                <TextInput
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  placeholder="doctor@hospital.in"
                  placeholderTextColor="#737783"
                  style={styles.textInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <Pressable
              onPress={handleStep1Continue}
              disabled={step1Loading}
              style={({ pressed }) => [
                styles.primaryPillButton,
                step1Success && styles.primaryPillButtonSuccess,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
            >
              {step1Loading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.primaryPillButtonText}>Verifying license credentials...</Text>
                </View>
              ) : step1Success ? (
                <View style={styles.loadingRow}>
                  <CheckCircle2 size={18} color="#ffffff" />
                  <Text style={styles.primaryPillButtonText}>License Confirmed!</Text>
                </View>
              ) : (
                <View style={styles.loadingRow}>
                  <Text style={styles.primaryPillButtonText}>Continue to Education & License</Text>
                  <ArrowRight size={18} color="#ffffff" strokeWidth={2.4} />
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.push('/(doctor)/(tabs)/home')}
              style={styles.draftButton}
            >
              <Text style={styles.draftButtonText}>Save draft & continue later</Text>
            </Pressable>
          </View>

          <View style={styles.alreadyRegisteredRow}>
            <Text style={styles.alreadyRegisteredText}>Already registered?</Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.signInLinkText}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ============================================================ */}
      {/* STEP 2: EDUCATION & LICENSE (4-CARD FLOW)                    */}
      {/* ============================================================ */}
      {mainStep === 2 && (
        <View style={styles.stepContainer}>
          <View style={styles.stepHeaderRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.screenTitleTagRow}>
                <Text style={styles.screenTitle}>Education & License</Text>
                <View style={styles.stepBadgePill}>
                  <Text style={styles.stepBadgeText}>Step 2 of 3</Text>
                </View>
              </View>
              <Text style={styles.screenSubtitle}>
                Provide your medical degrees, State Medical Council & credentials.
              </Text>
            </View>
            <View style={styles.partBadge}>
              <Text style={styles.partBadgeText}>Part {cardIndex + 1} of 4</Text>
            </View>
          </View>

          {/* Sub-step 4-Tab Bar */}
          <CardCarouselTabs
            activeIndex={cardIndex}
            onSelectTab={setCardIndex}
            tabs={[
              { id: 1, label: 'UG Degree' },
              { id: 2, label: 'Council' },
              { id: 3, label: 'PG & Spec.' },
              { id: 4, label: 'ID Proof' },
            ]}
          />

          {/* ---------------- CARD 1: UG DEGREE ---------------- */}
          {cardIndex === 0 && (
            <View style={styles.formCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.cardHeaderTitle}>1. PRIMARY MEDICAL DEGREE (UG)</Text>
                  <Text style={styles.cardHeaderSubtitle}>Recognized under NMC / MCI Schedule</Text>
                </View>
                <View style={styles.mandatoryBadge}>
                  <Text style={styles.mandatoryBadgeText}>Mandatory</Text>
                </View>
              </View>

              {/* Degree Type Radio Chips */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Degree Type</Text>
                <View style={styles.radioChipsGrid}>
                  {(['MBBS', 'BDS', 'BAMS', 'BHMS'] as const).map((deg) => (
                    <Pressable
                      key={deg}
                      onPress={() => setUgDegree(deg)}
                      style={[
                        styles.radioChip,
                        ugDegree === deg ? styles.radioChipActive : styles.radioChipInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.radioChipText,
                          ugDegree === deg && styles.radioChipTextActive,
                        ]}
                      >
                        {deg}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Medical College */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Medical College / Institution</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={ugCollege}
                    onChangeText={setUgCollege}
                    placeholder="e.g. Seth GS Medical College & KEM Hospital"
                    placeholderTextColor="#737783"
                    style={styles.textInput}
                  />
                </View>
              </View>

              {/* State of College & Graduation Year */}
              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>State of College</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={ugState}
                      onChangeText={setUgState}
                      style={styles.textInput}
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Graduation Year</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={ugYear}
                      onChangeText={setUgYear}
                      style={[styles.textInput, { textAlign: 'center' }]}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </View>

              {/* MBBS Degree Certificate Upload */}
              <FileUploadCard
                label="Degree Certificate / Diploma"
                isUploaded={ugFileUploaded}
                fileName="MBBS_Degree_KEM_Mumbai.pdf"
                fileSize="2.1 MB"
                subtitle="Verified File"
                onRemove={() => setUgFileUploaded(false)}
                onUpload={() => setUgFileUploaded(true)}
              />

              {/* Card 1 Action */}
              <Pressable
                onPress={() => setCardIndex(1)}
                style={({ pressed }) => [
                  styles.primaryPillButton,
                  { marginTop: 12 },
                  pressed && styles.buttonPressed,
                ]}
              >
                <View style={styles.loadingRow}>
                  <Text style={styles.primaryPillButtonText}>Next: Council Registration</Text>
                  <ArrowRight size={18} color="#ffffff" strokeWidth={2.4} />
                </View>
              </Pressable>
            </View>
          )}

          {/* ---------------- CARD 2: COUNCIL REGISTRATION ---------------- */}
          {cardIndex === 1 && (
            <View style={styles.formCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.cardHeaderTitle}>2. COUNCIL REGISTRATION & LICENSE</Text>
                  <Text style={styles.cardHeaderSubtitle}>Primary registration & cross-state licenses</Text>
                </View>
                <View style={styles.verifiedGreenBadge}>
                  <CheckCircle2 size={11} color="#047857" />
                  <Text style={styles.verifiedGreenBadgeText}>Active in NMR</Text>
                </View>
              </View>

              {/* Primary State Medical Council */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Primary State Medical Council</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={primaryCouncil}
                    onChangeText={setPrimaryCouncil}
                    style={styles.textInput}
                  />
                </View>
              </View>

              {/* Council Reg Number & Reg Year */}
              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.inputLabel}>Council Reg. Number</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={councilRegNumber}
                      onChangeText={setCouncilRegNumber}
                      style={styles.textInput}
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Reg. Year</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={councilRegYear}
                      onChangeText={setCouncilRegYear}
                      style={[styles.textInput, { textAlign: 'center' }]}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </View>

              {/* Dual License Toggle */}
              <View style={styles.dualLicenseBox}>
                <View style={styles.dualLicenseToggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dualLicenseTitle}>Practice in another State / Dual License?</Text>
                    <Text style={styles.dualLicenseDesc}>For multi-state clinics or reciprocal NMC registration</Text>
                  </View>
                  <Pressable
                    onPress={() => setDualLicenseActive(!dualLicenseActive)}
                    style={[
                      styles.switchTrack,
                      dualLicenseActive ? styles.switchTrackActive : styles.switchTrackInactive,
                    ]}
                  >
                    <View
                      style={[
                        styles.switchThumb,
                        dualLicenseActive && styles.switchThumbActive,
                      ]}
                    />
                  </Pressable>
                </View>

                {dualLicenseActive && (
                  <View style={styles.secondaryCouncilBox}>
                    <Text style={styles.secondaryCouncilTitle}>Secondary Council: Karnataka (KMC)</Text>
                    <View style={styles.rowTwoCols}>
                      <View style={{ flex: 2 }}>
                        <TextInput
                          value={secondaryRegNumber}
                          onChangeText={setSecondaryRegNumber}
                          style={styles.miniTextInput}
                          placeholder="KMC-108249"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <TextInput
                          value={secondaryRegYear}
                          onChangeText={setSecondaryRegYear}
                          style={[styles.miniTextInput, { textAlign: 'center' }]}
                          placeholder="Year"
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Card 2 Navigation Buttons */}
              <View style={styles.buttonRowTwo}>
                <Pressable
                  onPress={() => setCardIndex(0)}
                  style={styles.secondaryButton}
                >
                  <ArrowLeft size={16} color="#334155" />
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={() => setCardIndex(2)}
                  style={styles.primaryFlexButton}
                >
                  <Text style={styles.primaryFlexButtonText}>Next: PG & Spec.</Text>
                  <ArrowRight size={16} color="#ffffff" />
                </Pressable>
              </View>
            </View>
          )}

          {/* ---------------- CARD 3: PG & SPECIALIZATION ---------------- */}
          {cardIndex === 2 && (
            <View style={styles.formCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.cardHeaderTitle}>3. POST-GRADUATE & SPECIALIZATION</Text>
                  <Text style={styles.cardHeaderSubtitle}>MD, MS, DNB, DM, MCh & Fellowships</Text>
                </View>
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalBadgeText}>Optional</Text>
                </View>
              </View>

              {/* Has PG Toggle */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Do you hold a PG or Super-Specialty degree?</Text>
                <View style={styles.pillToggleBox}>
                  <Pressable
                    onPress={() => setHasPg(true)}
                    style={[
                      styles.pillToggleBtn,
                      hasPg ? styles.pillToggleBtnActive : styles.pillToggleBtnInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillToggleBtnText,
                        hasPg && styles.pillToggleBtnTextActive,
                      ]}
                    >
                      Yes, Post-Graduate
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setHasPg(false)}
                    style={[
                      styles.pillToggleBtn,
                      !hasPg ? styles.pillToggleBtnActive : styles.pillToggleBtnInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.pillToggleBtnText,
                        !hasPg && styles.pillToggleBtnTextActive,
                      ]}
                    >
                      No, General (MBBS)
                    </Text>
                  </Pressable>
                </View>
              </View>

              {hasPg && (
                <View style={styles.pgFormContainer}>
                  {/* Qualification Level */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Degree Category / Qualification Level</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        value={pgCategory}
                        onChangeText={setPgCategory}
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  {/* Clinical Specialization */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Clinical Specialization / Department</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        value={specialization}
                        onChangeText={setSpecialization}
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  {/* PG College */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>PG College / Teaching Hospital</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        value={pgCollege}
                        onChangeText={setPgCollege}
                        style={styles.textInput}
                      />
                    </View>
                  </View>

                  {/* State & Year */}
                  <View style={styles.rowTwoCols}>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>State of Training</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          value={pgState}
                          onChangeText={setPgState}
                          style={styles.textInput}
                        />
                      </View>
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Completion Year</Text>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          value={pgYear}
                          onChangeText={setPgYear}
                          style={[styles.textInput, { textAlign: 'center' }]}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                  </View>

                  {/* Upload PG Certificate */}
                  <FileUploadCard
                    label="PG Degree Certificate"
                    isUploaded={pgFileUploaded}
                    fileName="MD_Cardiology_GrantGovt.pdf"
                    fileSize="3.4 MB"
                    subtitle="Form 8 Additional Qualification"
                    onRemove={() => setPgFileUploaded(false)}
                    onUpload={() => setPgFileUploaded(true)}
                  />
                </View>
              )}

              {/* Card 3 Navigation */}
              <View style={styles.buttonRowTwo}>
                <Pressable
                  onPress={() => setCardIndex(1)}
                  style={styles.secondaryButton}
                >
                  <ArrowLeft size={16} color="#334155" />
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={() => setCardIndex(3)}
                  style={styles.primaryFlexButton}
                >
                  <Text style={styles.primaryFlexButtonText}>Next: ID Proof</Text>
                  <ArrowRight size={16} color="#ffffff" />
                </Pressable>
              </View>
            </View>
          )}

          {/* ---------------- CARD 4: GOVERNMENT ID PROOF ---------------- */}
          {cardIndex === 3 && (
            <View style={styles.formCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.cardHeaderTitle}>4. GOVERNMENT IDENTITY PROOF</Text>
                  <Text style={styles.cardHeaderSubtitle}>UIDAI e-KYC or Official Photo ID Verification</Text>
                </View>
                <View style={styles.actionRequiredBadge}>
                  <Text style={styles.actionRequiredBadgeText}>Action Required</Text>
                </View>
              </View>

              {/* Verification Box */}
              <View style={styles.verificationBox}>
                <View style={styles.verificationBoxHeader}>
                  <View style={styles.shieldIconBox}>
                    <ShieldCheck size={22} color={StitchColors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.verificationTitle}>Aadhaar / Passport / Voter ID</Text>
                    <Text style={styles.verificationDesc}>Instant DigiLocker OTP or PDF Upload</Text>
                  </View>
                  <View style={styles.verifiedTag}>
                    <Text style={styles.verifiedTagText}>Linked</Text>
                  </View>
                </View>
                <View style={styles.encryptionNoteRow}>
                  <Shield size={14} color="#059669" />
                  <Text style={styles.encryptionNoteText}>
                    Direct 256-bit encrypted integration with UIDAI / DigiLocker
                  </Text>
                </View>
              </View>

              {/* Verification Summary Card */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>VERIFICATION SUMMARY</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItemLeft}>
                    <CheckCircle2 size={15} color="#059669" />
                    <Text style={styles.summaryLabel}>MBBS Degree File</Text>
                  </View>
                  <Text style={styles.summaryValueVerified}>Verified</Text>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItemLeft}>
                    <CheckCircle2 size={15} color="#059669" />
                    <Text style={styles.summaryLabel}>NMC / State Council</Text>
                  </View>
                  <Text style={styles.summaryValueMono}>MMC-2015</Text>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItemLeft}>
                    <CheckCircle2 size={15} color="#059669" />
                    <Text style={styles.summaryLabel}>Post-Graduate MD</Text>
                  </View>
                  <Text style={styles.summaryValueVerified}>Completed</Text>
                </View>
              </View>

              {/* Card 4 CTA */}
              <View style={styles.actionContainer}>
                <Pressable
                  onPress={handleCard4Verification}
                  disabled={idLoading}
                  style={({ pressed }) => [
                    styles.primaryPillButton,
                    pressed && styles.buttonPressed,
                  ]}
                >
                  {idLoading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.primaryPillButtonText}>Validating credentials...</Text>
                    </View>
                  ) : (
                    <View style={styles.loadingRow}>
                      <Text style={styles.primaryPillButtonText}>Continue to Clinic & Hospital</Text>
                      <ArrowRight size={18} color="#ffffff" strokeWidth={2.4} />
                    </View>
                  )}
                </Pressable>

                <Pressable
                  onPress={() => setCardIndex(2)}
                  style={styles.backSecondaryButton}
                >
                  <ArrowLeft size={16} color="#475569" />
                  <Text style={styles.backSecondaryButtonText}>Back to Post-Graduate</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Dots Carousel Indicator */}
          <CarouselDots
            total={4}
            activeIndex={cardIndex}
            onSelectIndex={setCardIndex}
          />
        </View>
      )}

      {/* ============================================================ */}
      {/* STEP 3: CLINIC & HOSPITAL (3-SLIDE FLOW)                     */}
      {/* ============================================================ */}
      {mainStep === 3 && (
        <View style={styles.stepContainer}>
          <View style={styles.stepHeaderRow}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <View style={styles.screenTitleTagRow}>
                <Text style={styles.screenTitle}>Clinic & Hospital</Text>
                <View style={styles.stepBadgePill}>
                  <Text style={styles.stepBadgeText}>Step 3 of 3</Text>
                </View>
              </View>
              <Text style={styles.screenSubtitle}>
                Practice locations, verification & schedule setup.
              </Text>
            </View>
            <View style={styles.partBadge}>
              <Text style={styles.partBadgeText}>Part {slideIndex + 1} of 3</Text>
            </View>
          </View>

          {/* Sub-step 3-Tab Bar */}
          <CardCarouselTabs
            activeIndex={slideIndex}
            onSelectTab={setSlideIndex}
            tabs={[
              { id: 1, label: '1. Clinic' },
              { id: 2, label: '2. Hospital' },
              { id: 3, label: '3. Schedule' },
            ]}
          />

          {/* ---------------- SLIDE 1: PRIMARY CLINIC ---------------- */}
          {slideIndex === 0 && (
            <View style={styles.formCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={styles.cardTitleTagRow}>
                    <Text style={styles.cardHeaderTitle}>1. PRIMARY CLINIC INFORMATION</Text>
                    <View style={styles.stepBadgePill}>
                      <Text style={styles.stepBadgeText}>Step 3 of 3</Text>
                    </View>
                  </View>
                  <Text style={styles.cardHeaderSubtitle}>Your registered OPD or private consultation clinic</Text>
                </View>
                <View style={styles.mandatoryBadge}>
                  <Text style={styles.mandatoryBadgeText}>Mandatory</Text>
                </View>
              </View>

              {/* Practice Type */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Practice Type</Text>
                <View style={styles.radioChipsGrid}>
                  {(['Own Clinic', 'Hospital OPD', 'Polyclinic'] as const).map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => setPracticeType(type)}
                      style={[
                        styles.radioChip,
                        practiceType === type ? styles.radioChipActive : styles.radioChipInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.radioChipText,
                          practiceType === type && styles.radioChipTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Clinic Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Clinic or Chamber Name</Text>
                <View style={styles.inputWrapper}>
                  <Building2 size={18} color="#737783" style={styles.inputIcon} />
                  <TextInput
                    value={clinicName}
                    onChangeText={setClinicName}
                    style={styles.textInput}
                    placeholder="Sharma Heart & Vascular Clinic"
                  />
                </View>
              </View>

              {/* Address */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Complete Clinic Address</Text>
                <View style={styles.inputWrapper}>
                  <MapPin size={18} color="#737783" style={styles.inputIcon} />
                  <TextInput
                    value={clinicAddress}
                    onChangeText={setClinicAddress}
                    style={styles.textInput}
                    placeholder="Suite 302, Green Glen Medical Enclave"
                  />
                </View>
              </View>

              {/* City & PIN */}
              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.inputLabel}>City / Region</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={clinicCity}
                      onChangeText={setClinicCity}
                      style={styles.textInput}
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>PIN Code</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={clinicPin}
                      onChangeText={setClinicPin}
                      style={[styles.textInput, { textAlign: 'center' }]}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </View>

              {/* Clinic Proof Upload */}
              <FileUploadCard
                label="Clinic Establishment / GST Proof"
                isUploaded={clinicFileUploaded}
                fileName="Clinic_Establishment_Reg.pdf"
                fileSize="1.8 MB"
                subtitle="Clinical Establishment Act"
                onRemove={() => setClinicFileUploaded(false)}
                onUpload={() => setClinicFileUploaded(true)}
              />

              {/* Slide 1 CTA */}
              <Pressable
                onPress={() => setSlideIndex(1)}
                style={({ pressed }) => [
                  styles.primaryPillButton,
                  { marginTop: 12 },
                  pressed && styles.buttonPressed,
                ]}
              >
                <View style={styles.loadingRow}>
                  <Text style={styles.primaryPillButtonText}>Next: Hospital Affiliation</Text>
                  <ArrowRight size={18} color="#ffffff" strokeWidth={2.4} />
                </View>
              </Pressable>
            </View>
          )}

          {/* ---------------- SLIDE 2: HOSPITAL AFFILIATIONS ---------------- */}
          {slideIndex === 1 && (
            <View style={styles.formCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={styles.cardTitleTagRow}>
                    <Text style={styles.cardHeaderTitle}>2. HOSPITAL AFFILIATIONS</Text>
                    <View style={styles.stepBadgePill}>
                      <Text style={styles.stepBadgeText}>Step 3 of 3</Text>
                    </View>
                  </View>
                  <Text style={styles.cardHeaderSubtitle}>Visiting consultant or inpatient admitting rights</Text>
                </View>
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalBadgeText}>Optional</Text>
                </View>
              </View>

              {/* Primary Hospital Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Primary Hospital Name</Text>
                <View style={styles.inputWrapper}>
                  <Building2 size={18} color="#737783" style={styles.inputIcon} />
                  <TextInput
                    value={hospitalName}
                    onChangeText={setHospitalName}
                    style={styles.textInput}
                    placeholder="Apollo Hospitals, Bannerghatta Road"
                  />
                </View>
              </View>

              {/* Department & Designation */}
              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Department</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={hospitalDept}
                      onChangeText={setHospitalDept}
                      style={styles.textInput}
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Designation</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      value={hospitalDesignation}
                      onChangeText={setHospitalDesignation}
                      style={styles.textInput}
                    />
                  </View>
                </View>
              </View>

              {/* Affiliation Nature */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Affiliation Nature</Text>
                <View style={styles.rowTwoCols}>
                  <Pressable
                    onPress={() => setAffiliationNature('Visiting')}
                    style={[
                      styles.natureCard,
                      affiliationNature === 'Visiting' && styles.natureCardActive,
                    ]}
                  >
                    <Text style={styles.natureCardTitle}>Visiting Consultant</Text>
                    <Text style={styles.natureCardDesc}>Scheduled OPD slots</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setAffiliationNature('Full-Time')}
                    style={[
                      styles.natureCard,
                      affiliationNature === 'Full-Time' && styles.natureCardActive,
                    ]}
                  >
                    <Text style={styles.natureCardTitle}>Full-Time Staff</Text>
                    <Text style={styles.natureCardDesc}>Exclusively on campus</Text>
                  </Pressable>
                </View>
              </View>

              {/* Hospital ID Upload */}
              <FileUploadCard
                label="Hospital ID Card / Empanelment Letter"
                isUploaded={hospitalFileUploaded}
                fileName="Apollo_Consultant_Empanelment.pdf"
                fileSize="1.2 MB"
                subtitle="Empanelment verified"
                uploadPrompt="Tap to upload ID / Letter"
                onRemove={() => setHospitalFileUploaded(false)}
                onUpload={() => setHospitalFileUploaded(true)}
              />

              {/* Slide 2 Navigation */}
              <View style={styles.buttonRowTwo}>
                <Pressable
                  onPress={() => setSlideIndex(0)}
                  style={styles.secondaryButton}
                >
                  <ArrowLeft size={16} color="#334155" />
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={() => setSlideIndex(2)}
                  style={styles.primaryFlexButton}
                >
                  <Text style={styles.primaryFlexButtonText}>Next: Timings & Fee</Text>
                  <ArrowRight size={16} color="#ffffff" />
                </Pressable>
              </View>
            </View>
          )}

          {/* ---------------- SLIDE 3: TIMINGS & FEES ---------------- */}
          {slideIndex === 2 && (
            <View style={styles.formCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={styles.cardTitleTagRow}>
                    <Text style={styles.cardHeaderTitle}>3. OPD TIMINGS & CONSULTATION FEE</Text>
                    <View style={styles.stepBadgePill}>
                      <Text style={styles.stepBadgeText}>Step 3 of 3</Text>
                    </View>
                  </View>
                  <Text style={styles.cardHeaderSubtitle}>Configure appointment tokens and in-person slots</Text>
                </View>
                <View style={styles.mandatoryBadge}>
                  <Text style={styles.mandatoryBadgeText}>Mandatory</Text>
                </View>
              </View>

              {/* Consultation Fee & Slot Duration */}
              <View style={styles.rowTwoCols}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Standard OPD Fee (₹)</Text>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.rupeeSymbol}>₹</Text>
                    <TextInput
                      value={consultationFee}
                      onChangeText={setConsultationFee}
                      style={[styles.textInput, { fontWeight: '700' }]}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Slot Duration</Text>
                  <View style={styles.inputWrapper}>
                    <Clock size={16} color="#737783" style={styles.inputIcon} />
                    <TextInput
                      value={slotDuration}
                      onChangeText={setSlotDuration}
                      style={styles.textInput}
                    />
                  </View>
                </View>
              </View>

              {/* Available Practice Days */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Available Practice Days</Text>
                <View style={styles.daysRow}>
                  {[
                    { key: 'M', label: 'M' },
                    { key: 'T', label: 'T' },
                    { key: 'W', label: 'W' },
                    { key: 'T2', label: 'T' },
                    { key: 'F', label: 'F' },
                    { key: 'S', label: 'S' },
                    { key: 'S2', label: 'S' },
                  ].map((item) => {
                    const isDaySelected = selectedDays.includes(item.key);
                    return (
                      <Pressable
                        key={item.key}
                        onPress={() => toggleDay(item.key)}
                        style={[
                          styles.dayCircle,
                          isDaySelected ? styles.dayCircleActive : styles.dayCircleInactive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayCircleText,
                            isDaySelected && styles.dayCircleTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Shift Timings */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Daily OPD Shift Timings</Text>
                <View style={styles.shiftCard}>
                  <View style={styles.shiftRow}>
                    <View style={styles.shiftGreenDot} />
                    <Text style={styles.shiftName}>Morning Shift:</Text>
                    <Text style={styles.shiftTime}>10:30 AM – 01:30 PM</Text>
                  </View>
                  <View style={styles.tokenBadge}>
                    <Text style={styles.tokenBadgeText}>12 Tokens</Text>
                  </View>
                </View>
                <View style={styles.shiftCard}>
                  <View style={styles.shiftRow}>
                    <View style={styles.shiftGreenDot} />
                    <Text style={styles.shiftName}>Evening Shift:</Text>
                    <Text style={styles.shiftTime}>05:00 PM – 08:00 PM</Text>
                  </View>
                  <View style={styles.tokenBadge}>
                    <Text style={styles.tokenBadgeText}>12 Tokens</Text>
                  </View>
                </View>
              </View>

              {/* Digital Seal Notice */}
              <View style={styles.sealNoticeCard}>
                <ShieldCheck size={20} color={StitchColors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.sealNoticeTitle}>Digital Seal & Prescription Auto-Setup</Text>
                  <Text style={styles.sealNoticeDesc}>
                    Your OPD location details will be stamped on compliant e-Prescriptions automatically.
                  </Text>
                </View>
              </View>

              {/* Final Submit Actions */}
              <View style={styles.buttonRowTwo}>
                <Pressable
                  onPress={() => setSlideIndex(1)}
                  style={styles.secondaryButton}
                >
                  <ArrowLeft size={16} color="#334155" />
                  <Text style={styles.secondaryButtonText}>Back</Text>
                </Pressable>
                <Pressable
                  onPress={handleFinalSubmit}
                  disabled={finalSubmitting}
                  style={[styles.primaryFlexButton, styles.completeButton]}
                >
                  {finalSubmitting ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.primaryFlexButtonText}>Submitting application...</Text>
                    </View>
                  ) : (
                    <View style={styles.loadingRow}>
                      <CheckCircle2 size={16} color="#ffffff" strokeWidth={2.4} />
                      <Text style={styles.primaryFlexButtonText}>Complete & Submit</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* Dots Carousel Indicator */}
          <CarouselDots
            total={3}
            activeIndex={slideIndex}
            onSelectIndex={setSlideIndex}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  segmentedControlWrap: {
    marginBottom: 8,
  },
  stepContainer: {
    width: '100%',
  },
  screenTitleBox: {
    marginBottom: 16,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: StitchColors.onSurface,
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    fontSize: 13,
    color: StitchColors.onSurfaceVariant,
    marginTop: 4,
    lineHeight: 18,
  },
  screenTitleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  cardTitleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  stepBadgePill: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1d4ed8',
    letterSpacing: 0.1,
  },
  partBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  partBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#002350',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      web: { boxShadow: '0 2px 8px rgba(0, 35, 80, 0.04)' },
    }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  cardHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: StitchColors.primary,
    letterSpacing: 0.2,
  },
  cardHeaderSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  mandatoryBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  mandatoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#047857',
  },
  optionalBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  optionalBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748b',
  },
  actionRequiredBadge: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  actionRequiredBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#b45309',
  },
  verifiedGreenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  verifiedGreenBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#047857',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: StitchColors.surfaceContainerLow,
    borderRadius: 12,
    height: 46,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: StitchColors.onSurface,
    height: '100%',
  },
  genderRow: {
    flexDirection: 'row',
    backgroundColor: StitchColors.surfaceContainerLow,
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  genderButton: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  genderButtonActive: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
      web: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' },
    }),
  },
  genderButtonInactive: {
    backgroundColor: 'transparent',
  },
  genderButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  genderButtonTextActive: {
    color: StitchColors.primary,
    fontWeight: '700',
  },
  radioChipsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  radioChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioChipActive: {
    backgroundColor: StitchColors.primary,
    borderColor: StitchColors.primary,
  },
  radioChipInactive: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  radioChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  radioChipTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 10,
  },
  dualLicenseBox: {
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  dualLicenseToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dualLicenseTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  dualLicenseDesc: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  switchTrack: {
    width: 38,
    height: 22,
    borderRadius: 11,
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: StitchColors.primary,
  },
  switchTrackInactive: {
    backgroundColor: '#e2e8f0',
  },
  switchThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  secondaryCouncilBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  secondaryCouncilTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  miniTextInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    color: '#1e293b',
  },
  pillToggleBox: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
  },
  pillToggleBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  pillToggleBtnActive: {
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  pillToggleBtnInactive: {
    backgroundColor: 'transparent',
  },
  pillToggleBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  pillToggleBtnTextActive: {
    color: StitchColors.primary,
    fontWeight: '700',
  },
  pgFormContainer: {
    gap: 10,
  },
  verificationBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  verificationBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shieldIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  verificationDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  verifiedTag: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  encryptionNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  encryptionNoteText: {
    fontSize: 10,
    color: '#475569',
    flex: 1,
  },
  summaryCard: {
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#334155',
  },
  summaryValueVerified: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  summaryValueMono: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  actionContainer: {
    gap: 8,
    marginTop: 10,
  },
  primaryPillButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: StitchColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: StitchColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
      web: { boxShadow: '0 4px 14px rgba(0, 57, 126, 0.3)' },
    }),
  },
  primaryPillButtonSuccess: {
    backgroundColor: StitchColors.secondary,
  },
  primaryPillButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  draftButton: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftButtonText: {
    fontSize: 12,
    color: StitchColors.outline,
  },
  alreadyRegisteredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    gap: 4,
  },
  alreadyRegisteredText: {
    fontSize: 13,
    color: StitchColors.onSurfaceVariant,
  },
  signInLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  buttonRowTwo: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  secondaryButton: {
    width: 90,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  primaryFlexButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: StitchColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  primaryFlexButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  completeButton: {
    backgroundColor: '#059669',
  },
  backSecondaryButton: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backSecondaryButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  natureCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  natureCardActive: {
    borderColor: StitchColors.primary,
    backgroundColor: '#eff6ff',
  },
  natureCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e293b',
  },
  natureCardDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  rupeeSymbol: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
    marginRight: 4,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleActive: {
    backgroundColor: StitchColors.primary,
  },
  dayCircleInactive: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dayCircleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  dayCircleTextActive: {
    color: '#ffffff',
  },
  shiftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 8,
  },
  shiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shiftGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  shiftName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  shiftTime: {
    fontSize: 11,
    color: '#64748b',
  },
  tokenBadge: {
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tokenBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  sealNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 12,
    padding: 10,
    marginTop: 2,
  },
  sealNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  sealNoticeDesc: {
    fontSize: 10,
    color: '#1e40af',
    marginTop: 2,
    lineHeight: 14,
  },
});
