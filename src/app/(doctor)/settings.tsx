/**
 * Doctor Settings Screen — Stitch Clinical Clarity design
 *
 * Features:
 * - HeaderBar with title
 * - Grouped settings sections: Account, Notifications, Privacy, About, Sign Out
 * - Switch rows, navigation rows with chevron
 * - Save success toast
 *
 * Part of FiYDoc Clinical Clarity design system
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  BackHandler,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  CheckCircle2,
  Save,
  User,
  Bell,
  Lock,
  Info,
  LogOut,
  ChevronRight,
  CreditCard,
  Globe,
  HelpCircle,
  Star,
  FileText,
  ShieldCheck,
} from 'lucide-react-native';
import { HeaderBar } from '@/components/ui/HeaderBar';
import { Pill } from '@/components/ui/Pill';
import { Button } from '@/components/ui/Button';
import { StitchCard } from '@/components/ui/StitchCard';
import { useAuthStore } from '@/store/useAuthStore';
import { StitchColors, BorderRadius, Shadows, Spacing, Palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SettingsRowProps {
  icon: React.ReactNode;
  iconBg?: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  danger?: boolean;
}

function SettingsRow({ icon, iconBg, title, subtitle, right, onPress, danger }: SettingsRowProps) {
  const { colors, isDark } = useAppTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const content = (
    <View style={styles.settingsRowInner}>
      <View
        style={[
          styles.settingsRowIcon,
          {
            backgroundColor:
              iconBg ||
              (danger
                ? Palette.dangerBg
                : isDark
                ? 'rgba(20,80,163,0.18)'
                : Palette.primaryBlueLight),
          },
        ]}
      >
        {icon}
      </View>
      <View style={styles.settingsRowInfo}>
        <Text
          style={[
            styles.settingsRowTitle,
            { color: danger ? StitchColors.error : colors.text },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingsRowSub, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {right || <ChevronRight size={16} color={colors.textMuted} />}
    </View>
  );

  if (!onPress) {
    return (
      <View
        style={[
          styles.settingsRow,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {content}
      </View>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      style={[
        styles.settingsRow,
        { backgroundColor: colors.card, borderColor: colors.border },
        animatedStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {content}
    </AnimatedPressable>
  );
}

export default function DoctorSettingsScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { logout } = useAuthStore();

  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [autoApprove, setAutoApprove] = useState(false);
  const [biometric, setBiometric] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSafeBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(doctor)/(tabs)/home');
    }
  };

  useEffect(() => {
    const backAction = () => {
      handleSafeBack();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const handleSave = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleToggle = (setter: (v: boolean) => void, current: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setter(!current);
  };

  const handleSignOut = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    logout();
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <HeaderBar
        title="Settings"
        subtitle="Manage your preferences"
        showBackButton
        onBackPress={handleSafeBack}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success toast */}
        {saved && (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={[
              styles.savedCard,
              {
                backgroundColor: isDark
                  ? 'rgba(0,168,150,0.15)'
                  : Palette.healthcareTealLight,
                borderColor: Palette.successBorder,
              },
            ]}
          >
            <CheckCircle2 size={16} color={StitchColors.secondary} />
            <Text style={[styles.savedText, { color: StitchColors.secondary }]}>
              Practice preferences saved.
            </Text>
          </Animated.View>
        )}

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ACCOUNT
          </Text>
          <View style={styles.sectionGroup}>
            <SettingsRow
              icon={<User size={16} color={StitchColors.primaryContainer} />}
              title="Edit Profile"
              subtitle="Name, specialty, photo"
              onPress={() => {}}
            />
            <SettingsRow
              icon={<CreditCard size={16} color={StitchColors.secondary} />}
              iconBg={isDark ? 'rgba(0,168,150,0.18)' : Palette.healthcareTealLight}
              title="Payout Account"
              subtitle="HDFC Bank •••• 8849"
              onPress={() => {}}
            />
            <SettingsRow
              icon={<ShieldCheck size={16} color="#9D174D" />}
              iconBg={isDark ? 'rgba(157,23,77,0.18)' : '#FCE7F3'}
              title="Medical License"
              subtitle="NMC-MH-2024-DOC-8910"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            NOTIFICATIONS
          </Text>
          <View style={styles.sectionGroup}>
            <SettingsRow
              icon={<Bell size={16} color={StitchColors.primaryContainer} />}
              title="Push Notifications"
              subtitle="Appointment alerts & updates"
              right={
                <Switch
                  value={pushNotifs}
                  onValueChange={() => handleToggle(setPushNotifs, pushNotifs)}
                  trackColor={{ true: StitchColors.primaryContainer, false: colors.border }}
                  thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                />
              }
            />
            <SettingsRow
              icon={<Globe size={16} color={StitchColors.primaryContainer} />}
              title="Email Notifications"
              subtitle="Daily practice summary"
              right={
                <Switch
                  value={emailNotifs}
                  onValueChange={() => handleToggle(setEmailNotifs, emailNotifs)}
                  trackColor={{ true: StitchColors.primaryContainer, false: colors.border }}
                  thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                />
              }
            />
            <SettingsRow
              icon={<CheckCircle2 size={16} color={StitchColors.secondary} />}
              iconBg={isDark ? 'rgba(0,168,150,0.18)' : Palette.healthcareTealLight}
              title="Auto-Approve Bookings"
              subtitle="Skip manual slot approval"
              right={
                <Switch
                  value={autoApprove}
                  onValueChange={() => handleToggle(setAutoApprove, autoApprove)}
                  trackColor={{ true: StitchColors.secondary, false: colors.border }}
                  thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                />
              }
            />
          </View>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            PRIVACY & SECURITY
          </Text>
          <View style={styles.sectionGroup}>
            <SettingsRow
              icon={<Lock size={16} color={StitchColors.primaryContainer} />}
              title="Biometric Login"
              subtitle="Use Face ID / fingerprint"
              right={
                <Switch
                  value={biometric}
                  onValueChange={() => handleToggle(setBiometric, biometric)}
                  trackColor={{ true: StitchColors.primaryContainer, false: colors.border }}
                  thumbColor={Platform.OS === 'android' ? '#fff' : undefined}
                />
              }
            />
            <SettingsRow
              icon={<FileText size={16} color={StitchColors.primaryContainer} />}
              title="Data & Privacy"
              subtitle="Manage your data"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            ABOUT
          </Text>
          <View style={styles.sectionGroup}>
            <SettingsRow
              icon={<HelpCircle size={16} color={colors.textSecondary} />}
              iconBg={isDark ? 'rgba(255,255,255,0.06)' : Palette.surfaceTrack}
              title="Help & Support"
              subtitle="FAQ, contact us"
              onPress={() => {}}
            />
            <SettingsRow
              icon={<Star size={16} color="#F59E0B" />}
              iconBg={isDark ? 'rgba(245,158,11,0.18)' : '#FEF3C7'}
              title="Rate FiYDoc"
              subtitle="Help us improve"
              onPress={() => {}}
            />
            <SettingsRow
              icon={<Info size={16} color={colors.textSecondary} />}
              iconBg={isDark ? 'rgba(255,255,255,0.06)' : Palette.surfaceTrack}
              title="App Version"
              subtitle="1.0.0 (build 12)"
              right={
                <Pill label="v1.0.0" variant="default" size="sm" />
              }
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <SettingsRow
            icon={<LogOut size={16} color={StitchColors.error} />}
            title="Sign Out"
            subtitle="Safely exit your account"
            danger
            onPress={handleSignOut}
          />
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <View
        style={[
          styles.footerBar,
          { backgroundColor: colors.card, borderTopColor: colors.border },
        ]}
      >
        <Button
          title="Save Preferences"
          onPress={handleSave}
          variant="primary"
          size="lg"
          icon={<Save size={16} color={StitchColors.onPrimary} />}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: StitchColors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 130,
    gap: 20,
  },
  bottomSpace: {
    height: 20,
  },

  /* Saved */
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  savedText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* Sections */
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    paddingHorizontal: 4,
  },
  sectionGroup: {
    gap: 6,
  },

  /* Row */
  settingsRow: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    ...Shadows.subtle,
  },
  settingsRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  settingsRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsRowInfo: {
    flex: 1,
    minWidth: 0,
  },
  settingsRowTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  settingsRowSub: {
    fontSize: 12,
    marginTop: 1,
  },

  /* Footer */
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
