import React, { useState, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { patientService } from '@/services/patientService';
import { Spacing, Typography, BorderRadius, StitchColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { AlertCircle, Activity, ChevronLeft, ChevronRight, ShieldCheck, Calendar, MapPin } from 'lucide-react-native';
import { calculateAgeFromDOB } from '@/utils/formatters';

const STEPS = ['Basic Info', 'Health Details'];
const TOTAL_STEPS = 2;

export default function PatientSetupScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user, setSession, setOnboardingCompleted } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(0);

  // Step 1 Fields
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');

  const calculatedAge = useMemo(() => calculateAgeFromDOB(dob), [dob]);

  // Step 2 Fields
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const computedAge = calculatedAge ?? (age ? parseInt(age, 10) : undefined);
      if (user?.id) {
        await patientService.updateProfile(user.id, {
          dob: dob.trim() || (age ? `${age} years` : undefined),
          address: address.trim() || undefined,
          gender: gender.toUpperCase() as any,
          bloodGroup: bloodGroup.trim() || undefined,
          allergies: allergies.trim() ? allergies.split(',').map((s) => s.trim()) : [],
          emergencyContact: emergencyContact.trim() ? { phone: emergencyContact.trim() } : undefined,
          onboardingComplete: true,
        }).catch((err) => console.warn('[patient-setup] Remote save notice:', err.message));

        setSession({
          ...user,
          role: 'patient',
          onboardingCompleted: true,
          dob: dob.trim() || undefined,
          address: address.trim() || undefined,
          age: computedAge,
          gender,
          bloodGroup,
          allergies,
          phone: emergencyContact || user.phone,
        } as any);
      } else {
        setOnboardingCompleted(true);
      }
      router.replace('/(patient)/(tabs)/home');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Indicator */}
          <View style={styles.progressSection}>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>
                Step {currentStep + 1} of {TOTAL_STEPS} · Health Profile
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={[styles.progressBarTrack, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%`,
                  },
                ]}
              />
            </View>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, Typography.h2, { color: colors.text }]}>
              Health Profile
            </Text>
            <Text style={[styles.subtitle, Typography.body, { color: colors.textSecondary }]}>
              Basic vitals and allergy warnings shared securely with consulting doctors.
            </Text>
          </View>

          {/* Step 1: Basic Info */}
          {currentStep === 0 && (
            <View style={styles.formSection}>
              <View>
                <Input
                  label="Date of Birth (DOB)"
                  placeholder="YYYY-MM-DD (e.g. 1998-05-14)"
                  value={dob}
                  onChangeText={(val) => {
                    setDob(val);
                    const computed = calculateAgeFromDOB(val);
                    if (computed !== null) {
                      setAge(String(computed));
                    }
                  }}
                  leftIcon={<Calendar size={18} color={colors.textMuted} />}
                />
                <Text
                  style={{
                    fontSize: 12,
                    color: calculatedAge !== null ? StitchColors.secondary : colors.textMuted,
                    marginTop: 4,
                    marginBottom: 8,
                    marginLeft: 2,
                    fontWeight: calculatedAge !== null ? '600' : '400',
                  }}
                >
                  {calculatedAge !== null
                    ? `✓ Age calculated: ${calculatedAge} years old`
                    : 'Age is calculated automatically from your Date of Birth'}
                </Text>
              </View>

              <View style={styles.row}>
                <View style={styles.flex1}>
                  <Input
                    label="Age (Calculated)"
                    placeholder="Auto from DOB"
                    keyboardType="number-pad"
                    value={calculatedAge !== null ? `${calculatedAge} yrs` : age}
                    onChangeText={setAge}
                    editable={calculatedAge === null}
                  />
                </View>

                <View style={styles.flex1}>
                  <Input
                    label="Blood Group"
                    placeholder="e.g. O+, B+"
                    value={bloodGroup}
                    onChangeText={setBloodGroup}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <Input
                label="Residential Address"
                placeholder="e.g. Flat 302, Sector 18, Noida"
                value={address}
                onChangeText={setAddress}
                leftIcon={<MapPin size={18} color={colors.textMuted} />}
              />

              <View style={styles.genderSection}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Gender</Text>
                <View style={[styles.genderRow, { backgroundColor: colors.backgroundElement }]}>
                  {(['Male', 'Female', 'Other'] as const).map((g) => {
                    const isSelected = gender === g;
                    return (
                      <Pressable
                        key={g}
                        onPress={() => setGender(g)}
                        style={[
                          styles.genderOption,
                          isSelected && [styles.genderOptionActive, { backgroundColor: colors.card }],
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Gender ${g}`}
                      >
                        <Text
                          style={[
                            styles.genderOptionText,
                            { color: isSelected ? colors.text : colors.textSecondary },
                          ]}
                        >
                          {g}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Button
                title="Continue"
                onPress={handleNext}
                variant="primary"
                size="lg"
                fullWidth
                icon={<ChevronRight size={18} color="#FFFFFF" />}
              />
            </View>
          )}

          {/* Step 2: Health Details */}
          {currentStep === 1 && (
            <View style={styles.formSection}>
              <Input
                label="Known Allergies & Conditions"
                placeholder="e.g. Penicillin, Pollen (or none)"
                value={allergies}
                onChangeText={setAllergies}
                leftIcon={<AlertCircle size={18} color={colors.textMuted} />}
              />

              <Input
                label="Emergency Contact Number"
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                leftIcon={<Activity size={18} color={colors.textMuted} />}
              />

              <View style={styles.buttonRow}>
                <Pressable
                  onPress={handleBack}
                  style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronLeft size={20} color={colors.text} />
                </Pressable>

                <Button
                  title="Complete Setup"
                  onPress={handleFinish}
                  loading={loading}
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<ShieldCheck size={18} color="#FFFFFF" />}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  progressSection: {
    marginBottom: Spacing.lg,
  },
  progressBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    backgroundColor: StitchColors.primaryFixed,
    borderColor: StitchColors.onPrimaryFixedVariant,
    marginBottom: Spacing.sm,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },
  progressBarTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    letterSpacing: -0.02,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    lineHeight: 22,
  },
  formSection: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  genderSection: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  genderRow: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: BorderRadius.lg,
    gap: 4,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderOptionActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  genderOptionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});