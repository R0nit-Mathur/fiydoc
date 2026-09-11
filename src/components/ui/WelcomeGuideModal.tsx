import React from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  UserCheck,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  X,
} from 'lucide-react-native';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { StitchColors, BorderRadius, Shadows } from '@/constants/theme';

interface WelcomeGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export function WelcomeGuideModal({ visible, onClose }: WelcomeGuideModalProps) {
  const router = useRouter();

  const handleGoToProfile = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onClose();
    router.push('/(patient)/(tabs)/profile');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <FiYLogo size="md" />
              <View style={styles.badge}>
                <Sparkles size={12} color="#1450a3" />
                <Text style={styles.badgeText}>Quick Guide</Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.closeBtn}
              accessibilityLabel="Close guide"
            >
              <X size={18} color="#64748b" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            <Text style={styles.title}>Welcome to FiYDOC!</Text>
            <Text style={styles.subtitle}>
              Here is how to get the best clinical experience from your care portal:
            </Text>

            {/* Step 1 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <UserCheck size={20} color="#2563eb" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepHeading}>Complete Your Profile</Text>
                <Text style={styles.stepText}>
                  Add your date of birth, emergency contact, and blood group in the Profile tab. Your consulting doctors rely on these vitals during in-clinic check-ins.
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Stethoscope size={20} color="#16a34a" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepHeading}>Explore Verified Doctors</Text>
                <Text style={styles.stepText}>
                  Find verified doctors and clinics by specialty or location. View live token queues and consultation fees upfront.
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepIconWrap, { backgroundColor: '#FAF5FF' }]}>
                <Calendar size={20} color="#9333ea" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepHeading}>Instant OPD Tokens</Text>
                <Text style={styles.stepText}>
                  Pick your preferred time slot, enter patient details, and receive an instant digital OPD Token with zero waiting room queues.
                </Text>
              </View>
            </View>

            {/* Step 4 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepIconWrap, { backgroundColor: '#FFFBEB' }]}>
                <ShieldCheck size={20} color="#d97706" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepHeading}>Digital Health Records</Text>
                <Text style={styles.stepText}>
                  All electronic prescriptions and lab reports are automatically saved to your encrypted records vault.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleGoToProfile}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
            >
              <Text style={styles.primaryBtnText}>Update Profile Now</Text>
              <ChevronRight size={18} color="#ffffff" strokeWidth={2.4} />
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.secondaryBtnText}>Explore Dashboard</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius['2xl'],
    padding: 20,
    ...Shadows.modal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1450a3',
    marginLeft: 4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  stepIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  stepText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#64748b',
    marginTop: 2,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  primaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1450a3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 6,
  },
  secondaryBtn: {
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
});
