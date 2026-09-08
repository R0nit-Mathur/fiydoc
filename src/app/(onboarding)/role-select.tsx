import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MedicalIllustration } from '@/components/ui/MedicalIllustration';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { BorderRadius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { CheckCircle2, ArrowRight } from 'lucide-react-native';

export default function RoleSelectScreen() {
  const router = useRouter();
  const { colors } = useAppTheme();
  const { setRole } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor'>('patient');

  const handleContinue = () => {
    setRole(selectedRole);
    if (selectedRole === 'patient') {
      router.push('/(onboarding)/patient-setup');
    } else {
      router.push('/(onboarding)/doctor-setup');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardContainer}>
          {/* Patient Card */}
          <TouchableOpacity
            onPress={() => setSelectedRole('patient')}
            activeOpacity={0.7}
            style={[
              styles.roleCard,
              selectedRole === 'patient' && styles.roleCardPatientActive,
            ]}
          >
            <MedicalIllustration variant="welcome" size="md" enableParallax={false} />

            <View style={styles.cardTitleRow}>
              <Text style={styles.roleTitle}>I am a Patient</Text>
              {selectedRole === 'patient' && (
                <CheckCircle2 size={20} color={colors.primary} />
              )}
            </View>
            <Text style={styles.roleDesc}>
              Book clinic appointments, review prescriptions, and track personal medical records.
            </Text>
          </TouchableOpacity>

          {/* Doctor Card */}
          <TouchableOpacity
            onPress={() => setSelectedRole('doctor')}
            activeOpacity={0.7}
            style={[
              styles.roleCard,
              selectedRole === 'doctor' && styles.roleCardDoctorActive,
            ]}
          >
            <MedicalIllustration variant="welcome" size="md" enableParallax={false} />

            <View style={styles.cardTitleRow}>
              <Text style={styles.roleTitle}>I am a Doctor</Text>
              {selectedRole === 'doctor' && (
                <CheckCircle2 size={20} color={colors.primary} />
              )}
            </View>
            <Text style={styles.roleDesc}>
              Manage patient queues, approve consultation slots, and create digital prescriptions.
            </Text>
          </TouchableOpacity>

          {/* Continue Button */}
          <View style={styles.actionWrap}>
            <Button
              title={`Continue as ${selectedRole === 'patient' ? 'Patient' : 'Doctor'}`}
              onPress={handleContinue}
              variant={selectedRole === 'patient' ? 'primary' : 'teal'}
              size="lg"
              icon={<ArrowRight size={18} color={colors.card} />}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8FF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: Spacing.lg,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    width: '100%',
    alignItems: 'center',
  },
  roleCardPatientActive: {
    borderColor: '#1450A3',
    backgroundColor: '#F0F7FF',
  },
  roleCardDoctorActive: {
    borderColor: '#00A896',
    backgroundColor: '#F0FAF8',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#131B2E',
  },
  roleDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: '#424752',
    textAlign: 'center',
  },
  actionWrap: {
    width: '100%',
    marginTop: Spacing.md,
  },
});