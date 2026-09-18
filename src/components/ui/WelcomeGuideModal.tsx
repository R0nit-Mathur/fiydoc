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
            <Text style={styles.title}>Getting Started</Text>
            <Text style={styles.subtitle}>
              Key features to help manage your clinical visits and records:
            </Text>

            {/* Step 1 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <UserCheck size={18} color="#2563eb" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepHeading}>Complete Profile</Text>
                <Text style={styles.stepText}>
                  Keep your date of birth, emergency contact, and blood group updated for in-clinic check-ins.
                </Text>
              </View>
            </View>

            {/* Step 2 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepIconWrap, { backgroundColor: '#F0FDF4' }]}>
                <Stethoscope size={18} color="#16a34a" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepHeading}>Find Doctors</Text>
                <Text style={styles.stepText}>
                  Search practitioners by specialty or facility with upfront consultation fees.
                </Text>
              </View>
            </View>

            {/* Step 3 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepIconWrap, { backgroundColor: '#FAF5FF' }]}>
                <Calendar size={18} color="#9333ea" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepHeading}>OPD Queue Tokens</Text>
                <Text style={styles.stepText}>
                  Reserve a consultation slot and receive a verified clinic token pass.
                </Text>
              </View>
            </View>

            {/* Step 4 */}
            <View style={styles.stepItem}>
              <View style={[styles.stepIconWrap, { backgroundColor: '#FFFBEB' }]}>
                <ShieldCheck size={18} color="#d97706" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepHeading}>Health Records</Text>
                <Text style={styles.stepText}>
                  View signed electronic prescriptions and diagnostic reports anytime in your account.
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
                pressed && { opacity: 0.9 },
              ]}
            >
              <Text style={styles.primaryBtnText} numberOfLines={1}>Complete Profile</Text>
              <ChevronRight size={16} color="#ffffff" strokeWidth={2.4} />
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.secondaryBtnText}>Dismiss</Text>
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
    flexShrink: 1,
  },
  stepText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#64748b',
    marginTop: 2,
    flexShrink: 1,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  primaryBtn: {
    width: '100%',
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1450a3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 6,
  },
  secondaryBtn: {
    width: '100%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
});
