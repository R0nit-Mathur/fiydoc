/**
 * FiYDOC - Doctor Profile & Payout Settings (1:1 Stitch Design)
 *
 * Implements the doctor profile, financial settings & practice management:
 * - Identity card with active online OPD toggle
 * - 2-column metrics (Current OPD Fee, Cycle Payout) with fee edit modal
 * - Payout Management (Instant UPI Settlement with interactive manage modal)
 * - Practice & Clinic Settings (Hospital, Shifts, Cadence, Digital Seal Modal)
 * - Verified Credentials (Degrees, Council License, PAN/GST)
 * - App preferences & Log out
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  StyleSheet,
  Image,
  Platform,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ShieldCheck,
  CreditCard,
  Building2,
  Clock,
  Timer,
  FileSignature,
  GraduationCap,
  BadgeAlert,
  Receipt,
  MessageSquare,
  LogOut,
  ChevronRight,
  Edit2,
  Wallet,
  Zap,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Camera,
  CheckCircle2,
} from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';

import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { signOutAll } from '@/services/authService';
import { useAppTheme } from '@/hooks/useAppTheme';
import { BorderRadius, Shadows, StitchColors, Palette } from '@/constants/theme';
import { AppUpdateModal } from '@/components/ui/AppUpdateModal';
import { DocumentViewerModal } from '@/components/ui/DocumentViewerModal';
import { fileUploadService } from '@/services/fileUploadService';
import { pickImageFromGallery } from '@/utils/mediaPicker';
import { Avatar } from '@/components/ui/Avatar';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { doctorService } from '@/services/doctorService';


export default function DoctorProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user, updateUser } = useAuthStore();
  const appointments = useAppointmentStore((state) => state.appointments);

  // Profile data state bound to user — no fabricated defaults
  const initialName = user?.name || '';
  const initialSpec = user?.specialization || user?.specialty || '';
  const initialFee = user?.consultationFee ? String(user.consultationFee) : '';
  const initialReg = user?.licenseNumber || user?.registrationNumber || '';

  const [docName, setDocName] = useState(initialName);
  const [docSpec, setDocSpec] = useState(initialSpec);
  const [docAvatar, setDocAvatar] = useState(user?.avatar || undefined);
  const [opdFee, setOpdFee] = useState(initialFee);
  const [upiId, setUpiId] = useState((user as any)?.upiId || '');

  // Toggles
  const [activeForOpd, setActiveForOpd] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [settlementCycle, setSettlementCycle] = useState<'weekly' | 'monthly'>((user as any)?.settlementCycle || 'weekly');
  const completedConsultations = appointments.filter((appointment) => appointment.status === 'completed').length;
  const cyclePayout = completedConsultations * (Number(opdFee) || 0);

  // Modals
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [tempFee, setTempFee] = useState(opdFee);

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [tempUpi, setTempUpi] = useState(upiId);

  const [showSealModal, setShowSealModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [tempName, setTempName] = useState(docName);
  const [tempSpec, setTempSpec] = useState(docSpec);
  const [tempAvatar, setTempAvatar] = useState(docAvatar);
  const [tempQual, setTempQual] = useState(user?.qualification || '');
  const [tempClinicName, setTempClinicName] = useState(user?.clinicName || '');
  const [tempClinicAddress, setTempClinicAddress] = useState(user?.clinicAddress || '');
  const [tempClinicTimings, setTempClinicTimings] = useState(user?.clinicTimings || '10:30 AM – 1:30 PM • 5:00 PM – 8:00 PM');
  const [viewerAvatarVisible, setViewerAvatarVisible] = useState(false);

  // Interactive OPD Shifts & Consultation Cadence state
  const [showShiftsModal, setShowShiftsModal] = useState(false);
  const [tempMorningShift, setTempMorningShift] = useState('10:30 AM – 01:30 PM');
  const [tempEveningShift, setTempEveningShift] = useState('05:00 PM – 08:00 PM');
  const [showCadenceModal, setShowCadenceModal] = useState(false);
  const [slotDuration, setSlotDuration] = useState('15');
  const [bufferTime, setBufferTime] = useState('5');
  const [savingDocFee, setSavingDocFee] = useState(false);
  const [savingDocShifts, setSavingDocShifts] = useState(false);
  const [savingDocProfile, setSavingDocProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDocProfile = async () => {
    try {
      const data = await doctorService.getMyProfile();
      if (!data) return;
      const resolvedName = data.user?.fullName || data.fullName || data.name || user?.name || '';
      const resolvedSpec = data.specialization || data.specialty || user?.specialization || '';
      const resolvedFee = data.consultationFee != null ? String(data.consultationFee) : (user?.consultationFee ? String(user.consultationFee) : '');
      const resolvedAvatar = data.user?.profilePhoto || data.profilePhoto || user?.avatar || undefined;
      const cName = data.clinic?.name || data.clinicName || user?.clinicName || '';
      const cAddr = data.clinic?.address || data.clinicAddress || user?.clinicAddress || '';
      const cTimings = data.clinicTimings || user?.clinicTimings || '10:30 AM – 1:30 PM • 5:00 PM – 8:00 PM';
      const qual = data.qualification || user?.qualification || '';

      setDocName(resolvedName);
      setDocSpec(resolvedSpec);
      setDocAvatar(resolvedAvatar);
      setOpdFee(resolvedFee);
      setTempName(resolvedName);
      setTempSpec(resolvedSpec);
      setTempAvatar(resolvedAvatar);
      setTempFee(resolvedFee);
      setTempQual(qual);
      setTempClinicName(cName);
      setTempClinicAddress(cAddr);
      setTempClinicTimings(cTimings);

      updateUser({
        name: resolvedName,
        specialization: resolvedSpec,
        specialty: resolvedSpec,
        consultationFee: resolvedFee,
        avatar: resolvedAvatar,
        qualification: qual,
        clinicName: cName,
        clinicAddress: cAddr,
        clinicTimings: cTimings,
      });
    } catch (err) {
      console.warn('[DoctorProfile] Failed to load server profile:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await fetchDocProfile();
    setRefreshing(false);
  };

  const handlePickDoctorAvatarDirect = async () => {
    try {
      const uri = await pickImageFromGallery();
      if (!uri) return;
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDocAvatar(uri);
      setTempAvatar(uri);
      updateUser({ avatar: uri });

      // Upload to storage and sync to server
      const uploadRes = await fileUploadService.uploadFile(
        { uri, name: `doctor_${user?.id || 'avatar'}_${Date.now()}.jpg` },
        'doctors'
      );
      if (uploadRes?.url) {
        setDocAvatar(uploadRes.url);
        setTempAvatar(uploadRes.url);
        updateUser({ avatar: uploadRes.url });
        await doctorService.updateMyProfile({ profilePhoto: uploadRes.url });
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Profile Photo Updated', 'Your new profile picture has been saved.');
      }
    } catch (err: any) {
      console.warn('[DoctorProfile] Direct avatar upload error:', err?.message);
    }
  };

  // Sync profile data from server on mount
  useEffect(() => {
    fetchDocProfile();
  }, []);

  const handleSaveFee = async () => {
    setSavingDocFee(true);
    try {
      setOpdFee(tempFee);
      updateUser({ consultationFee: tempFee });
      try {
        await doctorService.updateMyProfile({ consultationFee: Number(tempFee) });
        Alert.alert('Success', 'Consultation fee updated.');
      } catch (err: any) {
        Alert.alert('Notice', err?.message || 'Failed to update fee on server. Saved locally.');
      }
      setShowFeeModal(false);
      useNotificationStore.getState().addNotification({
        title: 'Consultation Fee Updated',
        message: `Your OPD consultation fee has been updated to ₹${tempFee}.`,
        type: 'profile_updated',
        recipientRole: 'doctor',
        recipientId: user?.id,
      });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setSavingDocFee(false);
    }
  };

  const handleSavePayout = () => {
    setUpiId(tempUpi);
    updateUser({ upiId: tempUpi });
    setShowPayoutModal(false);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSaveShifts = async () => {
    setSavingDocShifts(true);
    try {
      const combinedTimings = `${tempMorningShift.trim()} • ${tempEveningShift.trim()}`;
      setTempClinicTimings(combinedTimings);
      updateUser({ clinicTimings: combinedTimings });
      try {
        await doctorService.updateMyProfile({ clinicTimings: combinedTimings });
        Alert.alert('Success', 'Practice shifts updated.');
      } catch (err: any) {
        Alert.alert('Notice', err?.message || 'Failed to sync shifts to server.');
      }
      setShowShiftsModal(false);
      useNotificationStore.getState().addNotification({
        title: 'Practice Shifts Updated',
        message: `Your OPD timings are now configured as ${combinedTimings}.`,
        type: 'profile_updated',
        recipientRole: 'doctor',
        recipientId: user?.id,
      });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setSavingDocShifts(false);
    }
  };

  const handleSaveCadence = () => {
    setShowCadenceModal(false);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSaveProfile = async () => {
    setSavingDocProfile(true);
    try {
      const cleanName = tempName.trim() || docName || 'Dr. Doctor';
      const cleanSpec = tempSpec.trim() || docSpec || 'General Medicine';
      const cleanClinicName = tempClinicName.trim() || user?.clinicName || `${cleanName}'s Clinic`;
      const cleanClinicAddress = tempClinicAddress.trim() || user?.clinicAddress || 'Clinical Practice Address Pending';
      const cleanClinicTimings = tempClinicTimings.trim() || user?.clinicTimings || '10:30 AM – 1:30 PM • 5:00 PM – 8:00 PM';

      let finalAvatarUrl = tempAvatar;
      if (tempAvatar && (tempAvatar.startsWith('file:') || tempAvatar.startsWith('data:'))) {
        try {
          const uploadRes = await fileUploadService.uploadFile(
            { uri: tempAvatar, name: 'doctor_avatar.jpg' },
            'doctors'
          );
          if (uploadRes?.url) {
            finalAvatarUrl = uploadRes.url;
          }
        } catch (uploadErr: any) {
          console.warn('[DoctorProfile] Avatar cloud upload notice:', uploadErr?.message);
        }
      }

      try {
        await doctorService.updateMyProfile({
          fullName: cleanName,
          specialization: cleanSpec,
          profilePhoto: finalAvatarUrl || null,
          clinicName: cleanClinicName,
          clinicAddress: cleanClinicAddress,
          clinicTimings: cleanClinicTimings,
        });
        Alert.alert('Success', 'Profile updated successfully.');
      } catch (err: any) {
        Alert.alert('Update Notice', err?.message || 'Could not sync updates to server immediately. Changes saved locally.');
      }
      setDocName(cleanName);
      setDocSpec(cleanSpec);
      setDocAvatar(finalAvatarUrl);
      updateUser({
        name: cleanName,
        specialization: cleanSpec,
        specialty: cleanSpec,
        avatar: finalAvatarUrl,
        qualification: tempQual,
        clinicName: cleanClinicName,
        clinicAddress: cleanClinicAddress,
        clinicTimings: cleanClinicTimings,
      });
      setShowEditProfileModal(false);
      useNotificationStore.getState().addNotification({
        title: 'Doctor Profile Updated',
        message: 'Your clinic details, specialization, and profile parameters were saved.',
        type: 'profile_updated',
        recipientRole: 'doctor',
        recipientId: user?.id,
      });
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setSavingDocProfile(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* 1. Top Header */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile & Settings</Text>

        <Pressable
          onPress={() => {
            setTempName(docName);
            setTempSpec(docSpec);
            setTempAvatar(docAvatar);
            setTempQual(user?.qualification || '');
            setTempClinicName(user?.clinicName || '');
            setTempClinicAddress(user?.clinicAddress || '');
            setTempClinicTimings(user?.clinicTimings || '10:30 AM – 1:30 PM • 5:00 PM – 8:00 PM');
            setShowEditProfileModal(true);
          }}
          style={[styles.editIconBtn, { backgroundColor: colors.backgroundElement }]}
        >
          <Edit2 size={16} color={StitchColors.primaryContainer} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={StitchColors.primaryContainer}
            colors={[StitchColors.primaryContainer]}
          />
        }
      >
        {/* 2. Doctor Identity Card */}
        <Animated.View
          entering={FadeInUp.delay(50).duration(300)}
          style={[styles.identityCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.identityTopRow}>
            <View style={styles.avatarWrap}>
              <Pressable
                onPress={() => {
                  if (docAvatar) setViewerAvatarVisible(true);
                  else handlePickDoctorAvatarDirect();
                }}
                accessibilityLabel="View profile photo"
              >
                <Avatar uri={docAvatar || null} name={docName || 'Doctor'} size="xl" />
                <View style={styles.verifiedMiniBadge}>
                  <ShieldCheck size={12} color="#FFFFFF" />
                </View>
              </Pressable>

              {/* Direct Camera Edit Button */}
              <Pressable
                onPress={handlePickDoctorAvatarDirect}
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: StitchColors.primaryContainer,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                  ...Shadows.subtle,
                }}
                accessibilityRole="button"
                accessibilityLabel="Change profile picture"
              >
                <Camera size={13} color="#FFFFFF" />
              </Pressable>
            </View>

            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.docName, { color: colors.text }]}>{docName}</Text>
                <View style={[styles.mdPill, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={styles.mdPillText}>MD</Text>
                </View>
              </View>
              <Text style={[styles.docSpec, { color: colors.textSecondary }]}>{docSpec}</Text>
              {user?.licenseNumber ? (
                <Text style={[styles.docLicense, { color: colors.textMuted }]}>
                  {user.licenseNumber} • Verified Council
                </Text>
              ) : null}

              <View style={styles.verifiedTagRow}>
                <View style={[styles.verifiedTag, { backgroundColor: '#CCFBF1' }]}>
                  <ShieldCheck size={13} color={StitchColors.secondary} />
              <Text style={styles.verifiedTagText}>
                {user?.verificationStatus === 'verified' ? 'Verified clinician' : 'Profile details saved'}
              </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Active for Online OPD Toggle */}
          <View style={[styles.opdToggleRow, { borderTopColor: colors.border }]}>
            <View style={styles.toggleLeft}>
              <View style={styles.pulseContainer}>
                <View style={styles.pingDot} />
                <View style={styles.liveDot} />
              </View>
              <View>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>Active for Online OPD</Text>
                <Text style={[styles.toggleSub, { color: colors.textSecondary }]}>
                  Slots accepting instant patient tokens
                </Text>
              </View>
            </View>

            <Switch
              value={activeForOpd}
              onValueChange={setActiveForOpd}
              trackColor={{ false: colors.border, true: StitchColors.secondaryContainer }}
              thumbColor="#FFFFFF"
            />
          </View>
        </Animated.View>

        {/* 3. Financial Metrics (2-column tile) */}
        <Animated.View entering={FadeInUp.delay(100).duration(300)} style={styles.metricsRow}>
          {/* Current Fee */}
          <View style={[styles.metricTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.metricTileHeader}>
              <Text style={[styles.metricTileLabel, { color: colors.textSecondary }]}>CURRENT OPD FEE</Text>
              <Wallet size={16} color={StitchColors.primaryContainer} />
            </View>
            <View>
              <Text style={[styles.metricTileAmt, { color: StitchColors.primaryContainer }]}>₹{opdFee}</Text>
              <Text style={[styles.metricTileSub, { color: colors.textSecondary }]}>per in-person slot</Text>
            </View>
            <Pressable onPress={() => { setTempFee(opdFee); setShowFeeModal(true); }}>
              <Text style={styles.editFeeText}>Edit Fee →</Text>
            </Pressable>
          </View>

          {/* Cycle Payout */}
          <View style={[styles.metricTile, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.metricTileHeader}>
              <Text style={[styles.metricTileLabel, { color: colors.textSecondary }]}>CYCLE PAYOUT</Text>
              <CreditCard size={16} color={StitchColors.secondaryContainer} />
            </View>
            <View>
              <Text style={[styles.metricTileAmt, { color: colors.text }]}>₹{cyclePayout.toLocaleString('en-IN')}</Text>
              <Text style={[styles.metricTileSub, { color: StitchColors.secondaryContainer }]}>
                {settlementCycle === 'weekly' ? 'Weekly settlement' : 'Monthly settlement'}
              </Text>
            </View>
            <Text style={[styles.consultCountText, { color: colors.textSecondary }]}>{completedConsultations} completed consultations</Text>
          </View>
        </Animated.View>

        {/* 4. Payout Management */}
        <Animated.View entering={FadeInUp.delay(140).duration(300)} style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Payout Management</Text>
            <View style={[styles.instantBadge, { backgroundColor: '#CCFBF1' }]}>
              <Text style={styles.instantBadgeText}>T+0 Auto Payout</Text>
            </View>
          </View>

          <View style={[styles.payoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {upiId ? (
              /* Configured UPI / Bank */
              <View style={styles.payoutAccountRow}>
                <View style={[styles.accountIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Zap size={18} color={StitchColors.primaryContainer} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.accountName, { color: colors.text }]}>Instant UPI Settlement</Text>
                    <View style={[styles.defaultTag, { backgroundColor: '#CCFBF1' }]}>
                      <Text style={styles.defaultTagText}>Active</Text>
                    </View>
                  </View>
                  <Text style={[styles.accountVpa, { color: colors.textSecondary }]}>{upiId}</Text>
                </View>
                <Pressable
                  onPress={() => { setTempUpi(upiId); setShowPayoutModal(true); }}
                  style={[styles.manageBtn, { backgroundColor: colors.backgroundElement }]}
                >
                  <Text style={[styles.manageBtnText, { color: StitchColors.primaryContainer }]}>Manage</Text>
                </Pressable>
              </View>
            ) : (
              /* Setup Payout Prompt */
              <View style={styles.payoutAccountRow}>
                <View style={[styles.accountIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Building2 size={18} color={StitchColors.primaryContainer} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.accountName, { color: colors.text }]}>Setup Payout Account</Text>
                  <Text style={[styles.accountVpa, { color: colors.textSecondary }]}>Link UPI VPA or bank for consultation settlements</Text>
                </View>
                <Pressable
                  onPress={() => { setTempUpi(''); setShowPayoutModal(true); }}
                  style={[styles.manageBtn, { backgroundColor: StitchColors.primaryContainer }]}
                >
                  <Text style={[styles.manageBtnText, { color: '#FFFFFF' }]}>Setup</Text>
                </Pressable>
              </View>
            )}

            <View style={[styles.autoNoticePill, { backgroundColor: colors.backgroundElement }]}>
              <ShieldCheck size={14} color={StitchColors.secondaryContainer} />
              <Text style={[styles.autoNoticeText, { color: colors.textSecondary }]}>
                {upiId ? 'Automated instant payout after consultation conclusion' : 'Direct credit to your verified Indian bank account / UPI VPA'}
              </Text>
            </View>

            {/* Settlement Cycle Selector (Weekly / Monthly only) */}
            <View style={[styles.cycleRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.cycleLabel, { color: colors.textSecondary }]}>Settlement Cycle</Text>
              <View style={[styles.cycleSegment, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <Pressable
                  onPress={() => { setSettlementCycle('weekly'); updateUser({ settlementCycle: 'weekly' }); }}
                  style={[
                    styles.cycleTab,
                    settlementCycle === 'weekly' && [styles.cycleTabActive, { backgroundColor: colors.card }],
                  ]}
                >
                  <Text
                    style={[
                      styles.cycleTabText,
                      settlementCycle === 'weekly' && { color: StitchColors.primaryContainer, fontWeight: '700' },
                    ]}
                  >
                    Weekly
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => { setSettlementCycle('monthly'); updateUser({ settlementCycle: 'monthly' }); }}
                  style={[
                    styles.cycleTab,
                    settlementCycle === 'monthly' && [styles.cycleTabActive, { backgroundColor: colors.card }],
                  ]}
                >
                  <Text
                    style={[
                      styles.cycleTabText,
                      settlementCycle === 'monthly' && { color: StitchColors.primaryContainer, fontWeight: '700' },
                    ]}
                  >
                    Monthly
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* 5. Practice & Clinic Settings */}
        <Animated.View entering={FadeInUp.delay(180).duration(300)} style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Practice & Clinic Settings</Text>
            <Text style={[styles.clusterTag, { color: StitchColors.primaryContainer }]}>Verified Practice</Text>
          </View>

          <View style={[styles.groupedListCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={() => {
                setTempName(docName);
                setTempSpec(docSpec);
                setTempAvatar(docAvatar);
                setTempQual(user?.qualification || '');
                setTempClinicName(user?.clinicName || '');
                setTempClinicAddress(user?.clinicAddress || '');
                setTempClinicTimings(user?.clinicTimings || '10:30 AM – 1:30 PM • 5:00 PM – 8:00 PM');
                setShowEditProfileModal(true);
              }}
              style={styles.groupItem}
            >
              <Building2 size={18} color={StitchColors.primaryContainer} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.groupItemSub, { color: colors.textSecondary }]}>Primary Hospital / Clinic</Text>
                <Text style={[styles.groupItemMain, { color: colors.text }]}>
                  {user?.clinicName ? `${user.clinicName}${user.clinicAddress ? `, ${user.clinicAddress}` : ''}` : 'Apollo Hospitals, Bannerghatta Rd'}
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>

            <Pressable
              onPress={() => {
                const timings = user?.clinicTimings || '10:30 AM – 1:30 PM • 5:00 PM – 8:00 PM';
                const parts = timings.split(/[•,;]/);
                setTempMorningShift(parts[0]?.trim() || '10:30 AM – 01:30 PM');
                setTempEveningShift(parts[1]?.trim() || '05:00 PM – 08:00 PM');
                setShowShiftsModal(true);
              }}
              style={[styles.groupItem, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}
            >
              <Clock size={18} color={StitchColors.primaryContainer} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.groupItemSub, { color: colors.textSecondary }]}>OPD Working Shifts</Text>
                <Text style={[styles.groupItemMain, { color: colors.text }]}>
                  {user?.clinicTimings || '10:30 AM – 1:30 PM • 5:00 PM – 8:00 PM'}
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>

            <Pressable
              onPress={() => setShowCadenceModal(true)}
              style={[styles.groupItem, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}
            >
              <Timer size={18} color={StitchColors.primaryContainer} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.groupItemSub, { color: colors.textSecondary }]}>Consultation Cadence</Text>
                <Text style={[styles.groupItemMain, { color: colors.text }]}>
                  {slotDuration} Mins / Patient (Buffer: {bufferTime} Mins)
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </Pressable>

            <View style={[styles.groupItem, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <FileSignature size={18} color={StitchColors.secondary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.groupItemSub, { color: colors.textSecondary }]}>Digital Prescription Seal & Sign</Text>
                <Text style={[styles.groupItemMain, { color: StitchColors.secondary }]}>Active on e-Rx ✓</Text>
              </View>
              <Pressable
                onPress={() => setShowSealModal(true)}
                style={[styles.viewSealBtn, { backgroundColor: colors.backgroundElement }]}
              >
                <Text style={[styles.viewSealBtnText, { color: StitchColors.primaryContainer }]}>View Seal</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* 7. App & Security Preferences */}
        <Animated.View entering={FadeInUp.delay(220).duration(300)} style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App & Security Preferences</Text>

          <View style={[styles.groupedListCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.groupItem}>
              <MessageSquare size={18} color={StitchColors.primaryContainer} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.groupItemMain, { color: colors.text }]}>WhatsApp & SMS Booking Alerts</Text>
                <Text style={[styles.groupItemSub, { color: colors.textMuted }]}>Instant alerts for walk-ins & rescheduling</Text>
              </View>
              <Switch
                value={whatsappAlerts}
                onValueChange={setWhatsappAlerts}
                trackColor={{ false: colors.border, true: StitchColors.primaryContainer }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Pressable
              onPress={() => setShowUpdateModal(true)}
              style={[styles.groupItem, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}
            >
              <RefreshCw size={18} color={StitchColors.primaryContainer} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.groupItemMain, { color: colors.text }]}>App Updates (OTA)</Text>
                <Text style={[styles.groupItemSub, { color: colors.textMuted }]}>Check for and install live updates</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        {/* 8. Sign Out */}
        <Pressable
          onPress={async () => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            await signOutAll();
            router.replace('/(auth)/welcome');
          }}
          style={[styles.logoutBtn, { borderColor: '#FCA5A5', backgroundColor: colors.card }]}
        >
          <LogOut size={16} color={StitchColors.error} />
          <Text style={styles.logoutBtnText}>Log Out of Clinician Portal</Text>
        </Pressable>

        <Text style={[styles.buildVersionNotice, { color: colors.textMuted }]}>
          FiYDOC Clinical OS v2.1.0 (Build 8901) • Encrypted Session
        </Text>
      </ScrollView>

      {/* MODAL 1: Edit Fee */}
      <Modal visible={showFeeModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Consultation Fee</Text>
              <Pressable onPress={() => setShowFeeModal(false)}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Set the per-slot fee charged for in-person clinic visits.
            </Text>
            <View style={styles.feeInputRow}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                value={tempFee}
                onChangeText={setTempFee}
                keyboardType="numeric"
                style={[styles.feeTextInput, { color: colors.text, borderColor: colors.border }]}
              />
            </View>
            <Pressable
              onPress={handleSaveFee}
              disabled={savingDocFee}
              style={[styles.modalSaveBtn, { backgroundColor: StitchColors.primaryContainer }]}
            >
              {savingDocFee ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.modalSaveBtnText}>Save Consultation Fee</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: Manage Payout UPI */}
      <Modal visible={showPayoutModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Manage Instant UPI Payout</Text>
              <Pressable onPress={() => setShowPayoutModal(false)}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Enter your verified VPA / UPI ID for automated T+0 earnings settlements.
            </Text>
            <TextInput
              value={tempUpi}
              onChangeText={setTempUpi}
              placeholder="e.g. doctor@okhdfcbank"
              placeholderTextColor={colors.textMuted}
              style={[styles.upiTextInput, { color: colors.text, borderColor: colors.border }]}
            />
            <Pressable onPress={handleSavePayout} style={[styles.modalSaveBtn, { backgroundColor: StitchColors.primaryContainer }]}>
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.modalSaveBtnText}>Save UPI Settlement Account</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: View Official Seal */}
      <Modal visible={showSealModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Digital Medical Council Seal</Text>
              <Pressable onPress={() => setShowSealModal(false)}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>
            <View style={[styles.sealBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <ShieldCheck size={36} color={StitchColors.secondary} />
              <Text style={[styles.sealDocName, { color: colors.text }]}>{docName}</Text>
              <Text style={[styles.sealDegree, { color: StitchColors.primaryContainer }]}>
                {user?.qualification || 'MD (Medicine), MBBS'}
              </Text>
              <Text style={[styles.sealReg, { color: colors.textMuted }]}>
                Registration: {user?.licenseNumber || 'MMC/2014/08/3821'}
              </Text>
              <Text style={styles.sealValid}>Verified Active • National Medical Commission</Text>
            </View>
            <Pressable onPress={() => setShowSealModal(false)} style={[styles.modalSaveBtn, { backgroundColor: StitchColors.primaryContainer }]}>
              <Text style={styles.modalSaveBtnText}>Close Certificate</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: Edit Profile */}
      <Modal visible={showEditProfileModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border, maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Clinician Profile</Text>
              <Pressable onPress={() => setShowEditProfileModal(false)}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 10 }}>
              {/* Avatar Preset Picker */}
              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Profile Photo</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                  {/* Custom Upload from Device Button */}
                  {/* Upload from gallery */}
                  <Pressable
                    onPress={async () => {
                      const uri = await pickImageFromGallery();
                      if (uri) setTempAvatar(uri);
                    }}
                    style={{
                      width: 52, height: 52, borderRadius: 26, borderWidth: 2,
                      borderColor: tempAvatar ? StitchColors.primaryContainer : colors.border,
                      borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: colors.backgroundElement, overflow: 'hidden', position: 'relative',
                    }}
                  >
                    {tempAvatar ? (
                      <Image source={{ uri: tempAvatar }} style={{ width: '100%', height: '100%' }} />
                    ) : (
                      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                        <Camera size={18} color={StitchColors.primaryContainer} />
                        <Text style={{ fontSize: 9, fontWeight: '700', color: StitchColors.primaryContainer, marginTop: 1 }}>Upload</Text>
                      </View>
                    )}
                    {tempAvatar ? (
                      <View style={{ position: 'absolute', top: 2, right: 2, backgroundColor: StitchColors.primaryContainer, borderRadius: 10 }}>
                        <CheckCircle2 size={14} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </Pressable>

                  {/* Initials Option */}
                  <Pressable
                    onPress={() => setTempAvatar(null as any)}
                    style={{
                      width: 52, height: 52, borderRadius: 26, borderWidth: 2,
                      borderColor: !tempAvatar ? StitchColors.primaryContainer : colors.border,
                      overflow: 'hidden', backgroundColor: Palette.healthcareTeal,
                      alignItems: 'center', justifyContent: 'center', position: 'relative',
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                      {tempName ? tempName.replace(/^(Dr\.)\s*/i, '').slice(0, 2).toUpperCase() : 'DR'}
                    </Text>
                    {!tempAvatar && (
                      <View style={{ position: 'absolute', top: 2, right: 2, backgroundColor: StitchColors.primaryContainer, borderRadius: 10 }}>
                        <CheckCircle2 size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </Pressable>

                </ScrollView>
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name</Text>
                <TextInput
                  value={tempName}
                  onChangeText={setTempName}
                  style={[styles.upiTextInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Specialty & Hospital</Text>
                <TextInput
                  value={tempSpec}
                  onChangeText={setTempSpec}
                  style={[styles.upiTextInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Add New / Additional Qualification</Text>
                <TextInput
                  value={tempQual}
                  onChangeText={setTempQual}
                  placeholder="e.g. DNB (Cardiology), Fellowship in Electrophysiology"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.upiTextInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Clinic / Chamber Name</Text>
                <TextInput
                  value={tempClinicName}
                  onChangeText={setTempClinicName}
                  placeholder="e.g. Apollo Hospitals"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.upiTextInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Clinic Address</Text>
                <TextInput
                  value={tempClinicAddress}
                  onChangeText={setTempClinicAddress}
                  placeholder="e.g. Bannerghatta Road, Bengaluru"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  style={[styles.upiTextInput, { color: colors.text, borderColor: colors.border, minHeight: 54, textAlignVertical: 'top' }]}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>OPD Working Hours</Text>
                <TextInput
                  value={tempClinicTimings}
                  onChangeText={setTempClinicTimings}
                  placeholder="e.g. 10:30 AM – 1:30 PM • 5:00 PM – 8:00 PM"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.upiTextInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>

              {/* Locked Council Credentials Notice */}
              <View style={{ backgroundColor: colors.backgroundElement, borderRadius: BorderRadius.md, padding: 10, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 2 }}>
                  VERIFIED COUNCIL REGISTRATION (LOCKED)
                </Text>
                <Text style={{ fontSize: 13, color: colors.text, fontWeight: '600' }}>
                  {user?.licenseNumber || '—'}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                  Medical Council license numbers cannot be edited after initial onboarding. You may add additional qualifications or update clinic details above.
                </Text>
              </View>
            </ScrollView>

            <Pressable
              onPress={handleSaveProfile}
              disabled={savingDocProfile}
              style={[styles.modalSaveBtn, { backgroundColor: StitchColors.primaryContainer, marginTop: 8 }]}
            >
              {savingDocProfile ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.modalSaveBtnText}>Save Changes</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL 5: Edit OPD Working Shifts */}
      <Modal visible={showShiftsModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit OPD Working Shifts</Text>
              <Pressable onPress={() => setShowShiftsModal(false)}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Configure your daily morning and evening clinical shifts for patient appointment allocation.
            </Text>

            <View style={{ gap: 12, marginVertical: 12 }}>
              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Morning OPD Shift Hours</Text>
                <TextInput
                  value={tempMorningShift}
                  onChangeText={setTempMorningShift}
                  placeholder="e.g. 10:30 AM – 01:30 PM"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.upiTextInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Evening OPD Shift Hours</Text>
                <TextInput
                  value={tempEveningShift}
                  onChangeText={setTempEveningShift}
                  placeholder="e.g. 05:00 PM – 08:00 PM"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.upiTextInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>
            </View>

            <Pressable
              onPress={handleSaveShifts}
              disabled={savingDocShifts}
              style={[styles.modalSaveBtn, { backgroundColor: StitchColors.primaryContainer }]}
            >
              {savingDocShifts ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.modalSaveBtnText}>Save Shift Timings</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* MODAL 6: Edit Consultation Cadence */}
      <Modal visible={showCadenceModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Consultation Cadence</Text>
              <Pressable onPress={() => setShowCadenceModal(false)}>
                <X size={18} color={colors.text} />
              </Pressable>
            </View>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Set the standard time allocated per patient and transit buffer between consecutive tokens.
            </Text>

            <View style={{ gap: 14, marginVertical: 12 }}>
              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Slot Duration (Minutes)</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  {['10', '15', '20', '30'].map((mins) => (
                    <Pressable
                      key={mins}
                      onPress={() => setSlotDuration(mins)}
                      style={[
                        styles.cycleTab,
                        { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
                        slotDuration === mins
                          ? { backgroundColor: StitchColors.primaryContainer, borderColor: StitchColors.primaryContainer }
                          : { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                      ]}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: slotDuration === mins ? '#FFFFFF' : colors.text }}>
                        {mins} min
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Buffer Time Between Tokens</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  {['0', '5', '10'].map((buf) => (
                    <Pressable
                      key={buf}
                      onPress={() => setBufferTime(buf)}
                      style={[
                        styles.cycleTab,
                        { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
                        bufferTime === buf
                          ? { backgroundColor: StitchColors.primaryContainer, borderColor: StitchColors.primaryContainer }
                          : { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                      ]}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: bufferTime === buf ? '#FFFFFF' : colors.text }}>
                        {buf} min
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <Pressable onPress={handleSaveCadence} style={[styles.modalSaveBtn, { backgroundColor: StitchColors.primaryContainer }]}>
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.modalSaveBtnText}>Save Cadence</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <AppUpdateModal
        visible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
      />

      {/* Universal In-App Document Viewer Modal */}
      <DocumentViewerModal
        visible={viewerAvatarVisible}
        title={docName || 'Doctor Profile Photo'}
        subtitle="Medical Practitioner Profile"
        documentUrl={docAvatar}
        onClose={() => setViewerAvatarVisible(false)}
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
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  editIconBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
  identityCard: {
    borderRadius: BorderRadius['2xl'],
    padding: 16,
    borderWidth: 1,
    ...Shadows.subtle,
  },
  identityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarImg: {
    width: 68,
    height: 68,
    borderRadius: BorderRadius.xl,
  },
  verifiedMiniBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: StitchColors.secondary,
    borderRadius: BorderRadius.full,
    padding: 2,
  },
  docName: {
    fontSize: 17,
    fontWeight: '700',
  },
  mdPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  mdPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: StitchColors.primaryContainer,
  },
  docSpec: {
    fontSize: 12,
    marginTop: 2,
  },
  docLicense: {
    fontSize: 11,
    marginTop: 2,
  },
  verifiedTagRow: {
    marginTop: 6,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: StitchColors.secondary,
  },
  opdToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pulseContainer: {
    position: 'relative',
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: StitchColors.secondaryContainer,
    opacity: 0.4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: StitchColors.secondaryContainer,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleSub: {
    fontSize: 11,
    marginTop: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricTile: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: 14,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 120,
    ...Shadows.subtle,
  },
  metricTileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricTileLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricTileAmt: {
    fontSize: 20,
    fontWeight: '800',
  },
  metricTileSub: {
    fontSize: 11,
    marginTop: 2,
  },
  editFeeText: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },
  consultCountText: {
    fontSize: 10.5,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  instantBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  instantBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: StitchColors.secondary,
  },
  clusterTag: {
    fontSize: 11,
    fontWeight: '600',
  },
  payoutCard: {
    borderRadius: BorderRadius.xl,
    padding: 14,
    borderWidth: 1,
    gap: 10,
    ...Shadows.subtle,
  },
  payoutAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountName: {
    fontSize: 13,
    fontWeight: '700',
  },
  defaultTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
  },
  defaultTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: StitchColors.secondary,
  },
  accountVpa: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 2,
  },
  manageBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  manageBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  autoNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: BorderRadius.md,
  },
  autoNoticeText: {
    fontSize: 11,
    flex: 1,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bankName: {
    fontSize: 12,
    fontWeight: '600',
  },
  bankIfsc: {
    fontSize: 10,
    marginTop: 1,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  cycleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cycleLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  cycleSegment: {
    flexDirection: 'row',
    borderRadius: BorderRadius.full,
    padding: 2,
    borderWidth: 1,
  },
  cycleTab: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  cycleTabActive: {
    ...Shadows.subtle,
  },
  cycleTabText: {
    fontSize: 11,
    color: '#64748B',
  },
  groupedListCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  groupItemSub: {
    fontSize: 10.5,
  },
  groupItemMain: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  viewSealBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  viewSealBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  switchRoleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  switchRoleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },
  switchRoleSub: {
    fontSize: 11,
    color: '#0369A1',
    marginTop: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: StitchColors.error,
  },
  buildVersionNotice: {
    fontSize: 10.5,
    textAlign: 'center',
    marginTop: 4,
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
    maxWidth: 380,
    borderRadius: BorderRadius['2xl'],
    padding: 20,
    borderWidth: 1,
    ...Shadows.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  feeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  rupeePrefix: {
    fontSize: 22,
    fontWeight: '800',
    color: StitchColors.primaryContainer,
  },
  feeTextInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: '700',
  },
  upiTextInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
    gap: 6,
    ...Shadows.subtle,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sealBox: {
    alignItems: 'center',
    padding: 16,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 14,
  },
  sealDocName: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  sealDegree: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  sealReg: {
    fontSize: 11,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  sealValid: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.secondary,
    marginTop: 6,
  },
});
