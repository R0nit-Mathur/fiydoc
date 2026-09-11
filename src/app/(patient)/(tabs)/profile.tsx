/**
 * Patient Profile Screen — Stitch Clinical Clarity
 *
 * Features:
 * - Avatar, name, role pill
 * - Account info (vitals, allergies, conditions)
 * - Settings list (Personal Info, Health Records, Notifications, Help, Sign Out)
 */
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Platform,
  TextInput,
  Image,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/store/useAuthStore';
import { usePatientProfileQuery } from '@/hooks/queries/usePatientQuery';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useAppTheme } from '@/hooks/useAppTheme';
import { patientService } from '@/services/patientService';
import {
  LogOut,
  ChevronRight,
  Edit3,
  Camera,
  CheckCircle2,
  User,
  FileText,
  Bell,
  HelpCircle,
  Heart,
  ShieldCheck,
  Phone,
  Mail,
  Droplet,
  Calendar,
  MapPin,
  RefreshCw,
} from 'lucide-react-native';
import { AppUpdateModal } from '@/components/ui/AppUpdateModal';
import { calculateAgeFromDOB, formatHumanDate } from '@/utils/formatters';
import { StitchColors, BorderRadius, Shadows, Spacing, Palette, DEFAULT_PATIENT_AVATAR } from '@/constants/theme';

const AVATAR_PRESETS = [
  DEFAULT_PATIENT_AVATAR,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
];

export default function PatientProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, isDark } = useAppTheme();
  const { user, logout, updateUser } = useAuthStore();

  const { data: patientProfile, isLoading: profileLoading } = usePatientProfileQuery(user?.id);

  const currentDOB = patientProfile?.dob || user?.dob || '';
  const currentAddress = patientProfile?.address || user?.address || '';
  const calculatedAge = useMemo(() => currentDOB ? calculateAgeFromDOB(currentDOB) : null, [currentDOB]);

  const [refreshing, setRefreshing] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editAvatar, setEditAvatar] = useState<string | null>(user?.avatar || null);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editDOB, setEditDOB] = useState(currentDOB);
  const [editAddress, setEditAddress] = useState(currentAddress);
  const [editBloodGroup, setEditBloodGroup] = useState(patientProfile?.bloodGroup || '');
  const [editAllergies, setEditAllergies] = useState(patientProfile?.allergies?.join(', ') || '');
  const [editConditions, setEditConditions] = useState(patientProfile?.conditions?.join(', ') || '');
  const [editEmergency, setEditEmergency] = useState(patientProfile?.emergencyContact?.phone || '');
  const [saveToast, setSaveToast] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);

  const editCalculatedAge = useMemo(() => editDOB ? calculateAgeFromDOB(editDOB) : null, [editDOB]);

  const handleOpenEdit = () => {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditPhone(user?.phone || '');
    setEditAvatar(user?.avatar || null);
    setEditDOB(patientProfile?.dob || user?.dob || '');
    setEditAddress(patientProfile?.address || user?.address || '');
    setEditBloodGroup(patientProfile?.bloodGroup || '');
    setEditAllergies(patientProfile?.allergies?.join(', ') || '');
    setEditConditions(patientProfile?.conditions?.join(', ') || '');
    setEditEmergency(patientProfile?.emergencyContact?.phone || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    const name = editName.trim() || user?.name || '';
    const dob = editDOB.trim() || undefined;
    const address = editAddress.trim() || undefined;
    const bloodGroup = editBloodGroup.trim() || undefined;
    const allergies = editAllergies.trim() ? editAllergies.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const conditions = editConditions.trim() ? editConditions.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const emergencyPhone = editEmergency.trim() || undefined;
    const age = calculateAgeFromDOB(dob) ?? undefined;

    updateUser({ name, avatar: editAvatar || undefined, dob, address, age });
    if (user?.id) {
      try {
        await patientService.updateProfile(user.id, {
          fullName: name,
          dob,
          address,
          bloodGroup,
          profilePhoto: editAvatar || undefined,
          allergies,
          conditions,
          emergencyContact: emergencyPhone ? { phone: emergencyPhone, name: '', relation: '' } : undefined,
        });
        await queryClient.invalidateQueries({ queryKey: ['patient-profile', user.id] });
      } catch {}
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setEditModalVisible(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['patient-profile', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
      ]);
      await new Promise((r) => setTimeout(r, 400));
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, user?.id]);

  const handleConfirmLogout = () => {
    setLogoutDialogVisible(false);
    logout();
    router.replace('/(auth)/login');
  };

  const allergiesStr = patientProfile?.allergies?.join(', ') || '';
  const conditionsStr = patientProfile?.conditions?.join(', ') || '';
  const emergencyPhone = patientProfile?.emergencyContact?.phone;

  const settingsItems = [
    {
      icon: User,
      label: 'Personal Information',
      sub: 'Name, contact, demographics',
      color: StitchColors.primaryContainer,
      bg: Palette.primaryBlueLight,
      onPress: handleOpenEdit,
    },
    {
      icon: FileText,
      label: 'Health Records',
      sub: 'Prescriptions & lab reports',
      color: StitchColors.secondaryContainer,
      bg: Palette.healthcareTealLight,
      onPress: () => router.push('/(patient)/(tabs)/health'),
    },
    {
      icon: Bell,
      label: 'Notifications',
      sub: 'Manage alerts & updates',
      color: '#f59e0b',
      bg: '#fff7e0',
      onPress: () => router.push('/(patient)/notifications'),
    },
    {
      icon: ShieldCheck,
      label: 'Privacy & Security',
      sub: 'Account security settings',
      color: '#8b5cf6',
      bg: '#f3e8ff',
      onPress: () => {},
    },
    {
      icon: RefreshCw,
      label: 'App Updates (OTA)',
      sub: 'Check for Over-The-Air releases',
      color: StitchColors.primaryContainer,
      bg: Palette.primaryBlueLight,
      onPress: () => setUpdateModalVisible(true),
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      sub: 'FAQs, contact us',
      color: '#06b6d4',
      bg: '#e0f7fa',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || profileLoading}
            onRefresh={handleRefresh}
            tintColor={StitchColors.primaryContainer}
          />
        }
      >
        {saveToast && (
          <Animated.View entering={FadeIn.duration(300)} style={[styles.toastBox, { backgroundColor: isDark ? 'rgba(52,199,89,0.15)' : '#E8F5E9', borderColor: isDark ? 'rgba(52,199,89,0.3)' : '#C8E6C9' }]}>
            <CheckCircle2 size={16} color={StitchColors.secondaryContainer} />
            <Text style={[styles.toastText, { color: StitchColors.secondary }]}>Profile updated successfully</Text>
          </Animated.View>
        )}

        {/* User Card */}
        <Animated.View entering={FadeIn.duration(380)}>
          <View style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.avatarWrapper}>
              <Avatar uri={user?.avatar || null} name={user?.name || 'Patient'} size="xl" />
              <Pressable
                onPress={handleOpenEdit}
                style={[styles.avatarCameraBadge, { backgroundColor: StitchColors.primaryContainer, borderColor: colors.card }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Change photo"
              >
                <Camera size={13} color="#fff" />
              </Pressable>
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                {user?.name || 'Patient User'}
              </Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                {user?.email || (user?.phone ? `+91 ${user.phone}` : 'patient@fiydoc.app')}
              </Text>

              <View style={styles.demographicMiniRow}>
                <Calendar size={11} color={StitchColors.primaryContainer} />
                <Text style={[styles.demographicMiniText, { color: colors.textSecondary }]}>
                  {calculatedAge !== null ? `${calculatedAge} yrs` : 'Age —'} • DOB: {currentDOB ? formatHumanDate(currentDOB) : 'Not set'}
                </Text>
              </View>

              {currentAddress ? (
                <View style={styles.demographicMiniRow}>
                  <MapPin size={11} color={StitchColors.secondaryContainer} />
                  <Text style={[styles.demographicMiniText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {currentAddress}
                  </Text>
                </View>
              ) : null}

              <View style={styles.roleTagWrap}>
                <Badge label="VERIFIED PATIENT" variant="blue" size="sm" />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleOpenEdit}
              style={[styles.editCardBtn, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
            >
              <Edit3 size={13} color={StitchColors.primaryContainer} />
              <Text style={[styles.editCardBtnText, { color: StitchColors.primaryContainer }]}>Edit</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Quick Stats: Age (Calculated from DOB), Blood Group, Allergies, Emergency */}
        <Animated.View entering={FadeInDown.delay(80).duration(380)} style={styles.statsGrid}>
          <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Calendar size={18} color={StitchColors.primaryContainer} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {calculatedAge !== null ? `${calculatedAge} yrs` : '—'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Age (from DOB)</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Droplet size={18} color={StitchColors.error} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {patientProfile?.bloodGroup || '—'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Blood Group</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Heart size={18} color={StitchColors.secondaryContainer} />
            <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
              {allergiesStr ? `${patientProfile?.allergies?.length} listed` : 'None'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Allergies</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Phone size={18} color={StitchColors.primaryContainer} />
            <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
              {emergencyPhone || '—'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Emergency</Text>
          </View>
        </Animated.View>

        {/* Demographics & Address Info Card */}
        <Animated.View entering={FadeInDown.delay(120).duration(380)}>
          <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.detailsCardHeader}>
              <Text style={[styles.cardHeader, { color: colors.textMuted, paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0 }]}>
                PATIENT DEMOGRAPHICS & ADDRESS
              </Text>
              <TouchableOpacity
                onPress={handleOpenEdit}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.detailsEditLink}
              >
                <Edit3 size={12} color={StitchColors.primaryContainer} />
                <Text style={styles.detailsEditText}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <View style={[styles.detailIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Calendar size={16} color={StitchColors.primaryContainer} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Date of Birth (DOB) & Age</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {currentDOB
                    ? `${formatHumanDate(currentDOB)}${calculatedAge !== null ? ` • ${calculatedAge} years old (Calculated)` : ''}`
                    : 'No date of birth added yet'}
                </Text>
              </View>
            </View>

            <View style={[styles.detailRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <View style={[styles.detailIconBox, { backgroundColor: '#F0FDFA' }]}>
                <MapPin size={16} color={StitchColors.secondaryContainer} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Residential Address</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {currentAddress || 'No address added yet'}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Settings List */}
        <Animated.View entering={FadeInDown.delay(160).duration(380)}>
          <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardHeader, { color: colors.textMuted }]}>SETTINGS</Text>
            {settingsItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={item.onPress}
                  style={[
                    styles.settingsRow,
                    i < settingsItems.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <View style={[styles.settingsIcon, { backgroundColor: item.bg }]}>
                    <Icon size={18} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingsLabel, { color: colors.text }]}>{item.label}</Text>
                    <Text style={[styles.settingsSub, { color: colors.textMuted }]}>{item.sub}</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Sign Out */}
        <Animated.View entering={FadeInDown.delay(220).duration(380)}>
          <TouchableOpacity
            onPress={() => setLogoutDialogVisible(true)}
            style={[styles.signOutRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <View style={[styles.signOutIcon, { backgroundColor: Palette.dangerBg, borderColor: Palette.dangerBorder }]}>
              <LogOut size={17} color={StitchColors.error} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.signOutTitle, { color: StitchColors.error }]}>Sign Out</Text>
              <Text style={[styles.signOutSub, { color: colors.textMuted }]}>Sign out of this device</Text>
            </View>
            <ChevronRight size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <Text style={[styles.versionText, { color: colors.textMuted }]}>FiYDoc v1.0.0 · Clinical Clarity</Text>
        </Animated.View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        title="Edit Profile"
      >
        <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
          <View style={styles.modalForm}>
            <Text style={[styles.modalFieldLabel, { color: colors.textSecondary }]}>Profile Photo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarPickerRow}>
              {/* Initials Option (Default) */}
              <TouchableOpacity
                onPress={() => setEditAvatar(null)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={[styles.avatarPickItem, { borderColor: !editAvatar ? StitchColors.secondaryContainer : 'transparent' }]}
              >
                <View style={[styles.avatarPickImage, { backgroundColor: Palette.healthcareTeal, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                    {editName ? editName.slice(0, 2).toUpperCase() : 'FD'}
                  </Text>
                </View>
                {!editAvatar && (
                  <View style={[styles.checkPill, { backgroundColor: StitchColors.secondaryContainer }]}>
                    <CheckCircle2 size={12} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              {AVATAR_PRESETS.map((preset, idx) => {
                const isSelected = editAvatar === preset;
                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setEditAvatar(preset)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={[styles.avatarPickItem, { borderColor: isSelected ? StitchColors.secondaryContainer : 'transparent' }]}
                  >
                    <Image source={{ uri: preset }} style={styles.avatarPickImage} />
                    {isSelected && (
                      <View style={[styles.checkPill, { backgroundColor: StitchColors.secondaryContainer }]}>
                        <CheckCircle2 size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.inputGroup}>
              <Text style={[styles.modalFieldLabel, { color: colors.textSecondary }]}>Full Name</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Full Name"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.modalFieldLabel, { color: colors.textSecondary }]}>Email</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="email@example.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.modalFieldLabel, { color: colors.textSecondary }]}>Phone</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            {/* Date of Birth (DOB) Field with live calculated age */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRowWithBadge}>
                <Text style={[styles.modalFieldLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
                  Date of Birth (DOB)
                </Text>
                {editCalculatedAge !== null ? (
                  <View style={styles.ageBadge}>
                    <Text style={styles.ageBadgeText}>Calculated Age: {editCalculatedAge} yrs</Text>
                  </View>
                ) : null}
              </View>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={editDOB}
                onChangeText={setEditDOB}
                placeholder="YYYY-MM-DD (e.g. 1996-05-14)"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
              />
              <Text style={[styles.inputHint, { color: colors.textMuted }]}>
                {editCalculatedAge !== null
                  ? `✓ Age calculated automatically: ${editCalculatedAge} years old`
                  : 'Enter in YYYY-MM-DD or DD/MM/YYYY format to compute age'}
              </Text>
            </View>

            {/* Residential Address Field */}
            <View style={styles.inputGroup}>
              <Text style={[styles.modalFieldLabel, { color: colors.textSecondary }]}>Residential Address</Text>
              <TextInput
                style={[
                  styles.modalInput,
                  styles.modalTextarea,
                  { backgroundColor: colors.background, borderColor: colors.border, color: colors.text },
                ]}
                value={editAddress}
                onChangeText={setEditAddress}
                placeholder="Flat / House No., Street, Colony, City, PIN"
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.modalFieldLabel, { color: colors.textSecondary }]}>Blood Group</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={editBloodGroup}
                onChangeText={setEditBloodGroup}
                placeholder="O+, A+"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.modalFieldLabel, { color: colors.textSecondary }]}>Known Allergies</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={editAllergies}
                onChangeText={setEditAllergies}
                placeholder="Penicillin, Pollen"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.modalFieldLabel, { color: colors.textSecondary }]}>Chronic Conditions</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={editConditions}
                onChangeText={setEditConditions}
                placeholder="Hypertension, Diabetes"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.modalFieldLabel, { color: colors.textSecondary }]}>Emergency Contact</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                value={editEmergency}
                onChangeText={setEditEmergency}
                placeholder="+91 98765 12345"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <TouchableOpacity
              onPress={handleSaveProfile}
              style={[styles.modalSaveBtn, { backgroundColor: StitchColors.primaryContainer }]}
            >
              <Text style={styles.modalSaveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>

      <ConfirmationDialog
        visible={logoutDialogVisible}
        title="Sign Out?"
        message="Are you sure you want to sign out of your FiYDoc account?"
        confirmText="Sign Out"
        cancelText="Stay Signed In"
        confirmVariant="danger"
        iconVariant="warning"
        onConfirm={handleConfirmLogout}
        onCancel={() => setLogoutDialogVisible(false)}
      />

      <AppUpdateModal
        visible={updateModalVisible}
        onClose={() => setUpdateModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 110,
    gap: Spacing.lg,
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 8,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '700',
  },

  /* --- User Card --- */
  userCard: {
    padding: 16,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadows.subtle,
  },
  avatarWrapper: { position: 'relative' },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  roleTagWrap: { marginTop: 6 },
  editCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  editCardBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* --- Stats Grid --- */
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* --- Settings Card --- */
  settingsCard: {
    padding: 4,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  settingsIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingsSub: {
    fontSize: 11,
    marginTop: 1,
  },

  /* --- Sign Out --- */
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
  },
  signOutIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  signOutTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  signOutSub: {
    fontSize: 11,
    marginTop: 1,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 12,
  },

  /* --- Modal --- */
  modalForm: {
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  modalFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  avatarPickerRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  avatarPickItem: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    position: 'relative',
  },
  avatarPickImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  checkPill: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: { width: '100%' },
  modalInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '600',
  },
  modalTextarea: {
    height: 76,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  labelRowWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ageBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  ageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  inputHint: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  modalSaveBtn: {
    height: 50,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalSaveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },

  /* --- Details Card & Demographic Rows --- */
  demographicMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  demographicMiniText: {
    fontSize: 11,
    fontWeight: '500',
  },
  detailsCard: {
    padding: 14,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    gap: 10,
    ...Shadows.subtle,
  },
  detailsCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  detailsEditLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailsEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
});
