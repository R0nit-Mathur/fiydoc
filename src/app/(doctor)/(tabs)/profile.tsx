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

import React, { useState } from 'react';
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
  Fingerprint,
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
import { signOutAll } from '@/services/authService';
import { useAppTheme } from '@/hooks/useAppTheme';
import { BorderRadius, Shadows, StitchColors, Palette, DEFAULT_DOCTOR_AVATAR } from '@/constants/theme';
import { AppUpdateModal } from '@/components/ui/AppUpdateModal';
import { Avatar } from '@/components/ui/Avatar';

const DOCTOR_AVATAR = DEFAULT_DOCTOR_AVATAR;

const AVATAR_PRESETS = [
  DEFAULT_DOCTOR_AVATAR,
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1594824813682-14c1e405a76e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&auto=format&fit=crop&q=80',
];

export default function DoctorProfileScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { user, updateUser } = useAuthStore();

  // Profile data state bound to user
  const initialName = user?.name || 'Dr. Rajesh Sharma';
  const initialSpec = user?.specialization || user?.specialty || 'Senior Interventional Cardiologist • AIIMS';
  const initialFee = user?.consultationFee ? String(user.consultationFee) : '800';
  const initialReg = user?.licenseNumber || user?.registrationNumber || 'MCI-48291 • Karnataka Medical Council';

  const [docName, setDocName] = useState(initialName);
  const [docSpec, setDocSpec] = useState(initialSpec);
  const [docAvatar, setDocAvatar] = useState(user?.avatar || DOCTOR_AVATAR);
  const [opdFee, setOpdFee] = useState(initialFee);
  const [upiId, setUpiId] = useState('rajesh.doc@okhdfcbank');

  // Toggles
  const [activeForOpd, setActiveForOpd] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(true);
  const [settlementCycle, setSettlementCycle] = useState<'weekly' | 'monthly'>('weekly');

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
  const [tempClinic, setTempClinic] = useState(user?.clinicName || '');

  const handleSaveFee = () => {
    setOpdFee(tempFee);
    updateUser({ consultationFee: tempFee });
    setShowFeeModal(false);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSavePayout = () => {
    setUpiId(tempUpi);
    setShowPayoutModal(false);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSaveProfile = () => {
    setDocName(tempName);
    setDocSpec(tempSpec);
    setDocAvatar(tempAvatar);
    updateUser({
      name: tempName,
      specialization: tempSpec,
      specialty: tempSpec,
      avatar: tempAvatar,
      qualification: tempQual,
      clinicName: tempClinic,
    });
    setShowEditProfileModal(false);
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
            setTempClinic(user?.clinicName || '');
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
      >
        {/* 2. Doctor Identity Card */}
        <Animated.View
          entering={FadeInUp.delay(50).duration(300)}
          style={[styles.identityCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.identityTopRow}>
            <View style={styles.avatarWrap}>
              <Avatar uri={docAvatar || null} name={docName || 'Doctor'} size="xl" />
              <View style={styles.verifiedMiniBadge}>
                <ShieldCheck size={12} color="#FFFFFF" />
              </View>
            </View>

            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.docName, { color: colors.text }]}>{docName}</Text>
                <View style={[styles.mdPill, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={styles.mdPillText}>MD</Text>
                </View>
              </View>
              <Text style={[styles.docSpec, { color: colors.textSecondary }]}>{docSpec}</Text>
              <Text style={[styles.docLicense, { color: colors.textMuted }]}>
                {user?.licenseNumber ? `${user.licenseNumber} • Verified Council` : 'MCI-48291 • Karnataka Medical Council'}
              </Text>

              <View style={styles.verifiedTagRow}>
                <View style={[styles.verifiedTag, { backgroundColor: '#CCFBF1' }]}>
                  <ShieldCheck size={13} color={StitchColors.secondary} />
                  <Text style={styles.verifiedTagText}>Profile 100% Verified</Text>
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
              <Text style={[styles.metricTileAmt, { color: colors.text }]}>₹1,42,800</Text>
              <Text style={[styles.metricTileSub, { color: StitchColors.secondaryContainer }]}>
                Settles Fri, 1 Nov
              </Text>
            </View>
            <Text style={[styles.consultCountText, { color: colors.textSecondary }]}>28 consultations</Text>
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
            {/* Primary UPI */}
            <View style={styles.payoutAccountRow}>
              <View style={[styles.accountIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Zap size={18} color={StitchColors.primaryContainer} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.accountName, { color: colors.text }]}>Instant UPI Settlement</Text>
                  <View style={[styles.defaultTag, { backgroundColor: '#CCFBF1' }]}>
                    <Text style={styles.defaultTagText}>Default</Text>
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

            <View style={[styles.autoNoticePill, { backgroundColor: colors.backgroundElement }]}>
              <ShieldCheck size={14} color={StitchColors.secondaryContainer} />
              <Text style={[styles.autoNoticeText, { color: colors.textSecondary }]}>
                Automated instant payout after consultation conclusion
              </Text>
            </View>

            {/* Secondary Bank */}
            <View style={[styles.bankRow, { borderTopColor: colors.border }]}>
              <Building2 size={18} color={colors.textSecondary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.bankName, { color: colors.text }]}>HDFC Bank •••• 4920</Text>
                <Text style={[styles.bankIfsc, { color: colors.textMuted }]}>IFSC: HDFC0001245 • Secondary fallback</Text>
              </View>
              <View style={[styles.activePill, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.activePillText, { color: colors.textSecondary }]}>Active</Text>
              </View>
            </View>

            {/* Settlement Cycle Selector (Weekly / Monthly only) */}
            <View style={[styles.cycleRow, { borderTopColor: colors.border }]}>
              <Text style={[styles.cycleLabel, { color: colors.textSecondary }]}>Settlement Cycle</Text>
              <View style={[styles.cycleSegment, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                <Pressable
                  onPress={() => setSettlementCycle('weekly')}
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
                  onPress={() => setSettlementCycle('monthly')}
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
            <View style={styles.groupItem}>
              <Building2 size={18} color={StitchColors.primaryContainer} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.groupItemSub, { color: colors.textSecondary }]}>Primary Hospital / Clinic</Text>
                <Text style={[styles.groupItemMain, { color: colors.text }]}>
                  {user?.clinicName ? `${user.clinicName}${user.clinicAddress ? `, ${user.clinicAddress}` : ''}` : 'Apollo Hospitals, Bannerghatta Rd'}
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </View>

            <View style={[styles.groupItem, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Clock size={18} color={StitchColors.primaryContainer} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.groupItemSub, { color: colors.textSecondary }]}>OPD Working Shifts</Text>
                <Text style={[styles.groupItemMain, { color: colors.text }]}>
                  10:30 AM – 1:30 PM • 5:00 PM – 8:00 PM
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </View>

            <View style={[styles.groupItem, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Timer size={18} color={StitchColors.primaryContainer} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.groupItemSub, { color: colors.textSecondary }]}>Consultation Cadence</Text>
                <Text style={[styles.groupItemMain, { color: colors.text }]}>
                  15 Mins / Patient (Buffer: 5 Mins)
                </Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </View>

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

            <View style={[styles.groupItem, { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Fingerprint size={18} color={StitchColors.primaryContainer} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.groupItemMain, { color: colors.text }]}>Biometric Two-Factor Authentication</Text>
                <Text style={[styles.groupItemSub, { color: colors.textMuted }]}>Require FaceID / Fingerprint for payouts</Text>
              </View>
              <Switch
                value={biometricAuth}
                onValueChange={setBiometricAuth}
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
            <Pressable onPress={handleSaveFee} style={[styles.modalSaveBtn, { backgroundColor: StitchColors.primaryContainer }]}>
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.modalSaveBtnText}>Save Consultation Fee</Text>
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
                  {/* Initials Option (Default Name Initials) */}
                  <Pressable
                    onPress={() => setTempAvatar(null as any)}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 26,
                      borderWidth: 2,
                      borderColor: !tempAvatar ? StitchColors.primaryContainer : colors.border,
                      overflow: 'hidden',
                      backgroundColor: Palette.healthcareTeal,
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
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

                  {AVATAR_PRESETS.map((preset, idx) => {
                    const isSelected = tempAvatar === preset;
                    return (
                      <Pressable
                        key={idx}
                        onPress={() => setTempAvatar(preset)}
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 26,
                          borderWidth: 2,
                          borderColor: isSelected ? StitchColors.primaryContainer : colors.border,
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <Image source={{ uri: preset }} style={{ width: '100%', height: '100%' }} />
                        {isSelected && (
                          <View style={{ position: 'absolute', top: 2, right: 2, backgroundColor: StitchColors.primaryContainer, borderRadius: 10 }}>
                            <CheckCircle2 size={14} color="#FFFFFF" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
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
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Clinic / Chamber Name & Address</Text>
                <TextInput
                  value={tempClinic}
                  onChangeText={setTempClinic}
                  placeholder="e.g. Apollo Hospitals / City Care Clinic, Bangalore"
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
                  {user?.licenseNumber || 'MCI-48291 • Karnataka Medical Council'}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                  Medical Council license numbers cannot be edited after initial onboarding. You may add additional qualifications or update clinic details above.
                </Text>
              </View>
            </ScrollView>

            <Pressable onPress={handleSaveProfile} style={[styles.modalSaveBtn, { backgroundColor: StitchColors.primaryContainer, marginTop: 8 }]}>
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.modalSaveBtnText}>Save Changes</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <AppUpdateModal
        visible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
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
    paddingBottom: 90,
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
