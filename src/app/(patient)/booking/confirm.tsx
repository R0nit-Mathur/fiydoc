/**
 * FiYDOC - Confirm Booking & Payment Sheet (Google Stitch 1:1)
 *
 * Implements the Clinical Clarity OPD booking confirmation and payment flow:
 * - OPD Clinic Pass Preview (Dr. Rajesh Sharma, Fortis OPD, Token #12, Slot)
 * - Patient Details Card (Rahul Sharma / Self) with Change toggle
 * - Promo / Health Saver coupon (HEALTH150 toggle with live discount calculation)
 * - Transparent Bill Breakdown (Doctor fee, Platform fee FREE, Discount)
 * - Cancellation Guarantee
 * - Full Interactive Payment Modal Bottom-Sheet (UPI Fast Pay, Custom UPI ID, Cards, Net Banking, Pay at Hospital)
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInUp, SlideInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  Ticket,
  User,
  Tag,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Wallet,
  Building,
  Banknote,
  ChevronRight,
  X,
  Sparkles,
  Info,
} from 'lucide-react-native';

import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useBookAppointmentMutation } from '@/hooks/queries/useAppointmentsQuery';
import { BorderRadius, Shadows, Spacing, StitchColors, Palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatHumanDate, formatTimeSlot, formatCurrency } from '@/utils/formatters';

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: 'https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=100&auto=format&fit=crop&q=80', popular: true },
  { id: 'phonepe', name: 'PhonePe', icon: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&auto=format&fit=crop&q=80', popular: true },
  { id: 'paytm', name: 'Paytm UPI', icon: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=100&auto=format&fit=crop&q=80', popular: true },
  { id: 'bhim', name: 'BHIM UPI', icon: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=100&auto=format&fit=crop&q=80', popular: false },
];

const NET_BANKS = [
  { id: 'hdfc', name: 'HDFC Bank' },
  { id: 'icici', name: 'ICICI Bank' },
  { id: 'sbi', name: 'State Bank of India' },
  { id: 'axis', name: 'Axis Bank' },
];

export default function BookingConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    date?: string;
    slot?: string;
    token?: string;
    doctorId?: string;
    doctorName?: string;
    doctorSpecialty?: string;
    slotTime?: string;
    tokenNumber?: string;
    dateLabel?: string;
    fee?: string;
    reason?: string;
    patientName?: string;
  }>();
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { bookingDraft, resetBookingDraft } = useAppointmentStore();
  const bookMutation = useBookAppointmentMutation();

  const doctor = bookingDraft.doctor || (params.doctorName ? {
    id: params.doctorId || 'doc-1',
    fullName: params.doctorName,
    name: params.doctorName,
    specialization: params.doctorSpecialty || 'Cardiologist',
    consultationFee: parseInt((params.fee || '800').replace(/[^0-9]/g, ''), 10) || 800,
    clinicAddress: 'Fortis OPD • Sector 44, Gurugram',
    rating: 4.9,
    experienceYears: 12,
  } as any : null);

  // Guard — no doctor in draft means navigation error; show empty state
  if (!doctor) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ color: colors.text, fontSize: 16, textAlign: 'center' }}>
            No booking in progress. Please select a doctor and slot first.
          </Text>
          <Pressable onPress={() => router.replace('/(patient)/(tabs)/home')} style={{ marginTop: 24, padding: 14, backgroundColor: StitchColors.primaryContainer, borderRadius: 12 }}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>Go to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const date = params.date || bookingDraft.date || new Date().toISOString().slice(0, 10);
  const slot = params.slot || params.slotTime || bookingDraft.timeSlot || '04:15 PM';
  const tokenNumber = params.token || (params.tokenNumber ? (params.tokenNumber.startsWith('Token') ? params.tokenNumber : `Token #${params.tokenNumber}`) : 'Token #12');
  const activeSymptoms = params.reason ? [params.reason] : (bookingDraft.symptoms.length > 0 ? bookingDraft.symptoms : []);

  // Coupon state
  const [couponCode, setCouponCode] = useState('HEALTH150');
  const [couponApplied, setCouponApplied] = useState(true);

  // Patient info state
  const [patientName, setPatientName] = useState(
    params.patientName && params.patientName !== 'Rahul Sharma'
      ? params.patientName
      : (user?.name || '')
  );
  const [patientPhone, setPatientPhone] = useState(user?.phone || '');
  const [patientAge, setPatientAge] = useState(user?.age ? String(user.age) : '28');
  const [patientGender, setPatientGender] = useState(user?.gender || 'Male');
  const [isEditingPatient, setIsEditingPatient] = useState(false);

  // Payment Bottom Sheet
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('gpay');
  const [customUpiId, setCustomUpiId] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('Connecting to payment gateway...');
  const [errorMessage, setErrorMessage] = useState('');

  // Cost calculation
  const baseFee = doctor.consultationFee || 800;
  const discount = couponApplied ? 150 : 0;
  const totalPayable = Math.max(0, baseFee - discount);

  const handleApplyCouponToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCouponApplied(!couponApplied);
  };

  const handleStartPayment = () => {
    if (!patientName.trim() || !patientPhone.trim()) {
      Alert.alert(
        'Missing Required Patient Details',
        'Patient Name and Contact Phone Number are required to issue an OPD appointment token. Please enter them to continue.',
        [
          { text: 'Fill Details', onPress: () => setIsEditingPatient(true) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPaymentSheetVisible(true);
  };

  const executeBooking = async (methodName: string) => {
    if (!patientName.trim() || !patientPhone.trim()) {
      setPaymentSheetVisible(false);
      Alert.alert(
        'Missing Required Patient Details',
        'Patient Name and Contact Phone Number are required to issue an OPD appointment token. Please enter them to continue.',
        [
          { text: 'Fill Details', onPress: () => setIsEditingPatient(true) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    setIsProcessingPayment(true);
    setProcessingStatus(`Authorizing ${methodName}...`);

    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      await new Promise((resolve) => setTimeout(resolve, 800));
      setProcessingStatus('Securing OPD slot...');
      await new Promise((resolve) => setTimeout(resolve, 600));

      if (!user?.id) throw new Error('Please sign in to request an appointment.');
      const bookedAppointment = await bookMutation.mutateAsync({
        patientId: user.id,
        doctorId: doctor.id,
        date,
        time: slot,
        mode: 'clinic',
        fee: totalPayable,
        symptoms: bookingDraft.symptoms.length > 0 ? bookingDraft.symptoms : ['Routine OPD Consultation'],
        notes: bookingDraft.patientNotes || undefined,
      });

      resetBookingDraft();

      setPaymentSheetVisible(false);
      setIsProcessingPayment(false);

      // Navigate to success confirmation with token
      router.replace({
        pathname: '/(patient)/booking/success',
        params: {
          appointmentId: bookedAppointment.id,
          tokenNumber: tokenNumber,
        },
      });
    } catch (err: any) {
      setIsProcessingPayment(false);
      setErrorMessage(err?.message || 'Payment confirmation failed. Please try again.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top App Bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.iconButton, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.2} />
        </Pressable>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Confirm OPD Booking</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {doctor.name} • {doctor.hospital.split(',')[0]}
          </Text>
        </View>

        <View style={styles.verifiedBadge}>
          <ShieldCheck size={14} color={StitchColors.primaryContainer} />
          <Text style={styles.verifiedBadgeText}>100% Verified</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {errorMessage ? (
          <View style={[styles.errorBox, { backgroundColor: Palette.dangerBg, borderColor: Palette.dangerBorder }]}>
            <AlertCircle size={18} color={StitchColors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Doctor & OPD Visit Card */}
        <Animated.View
          entering={FadeInUp.delay(50).duration(350)}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.opdCardHeader}>
            <View style={styles.opdBadge}>
              <View style={styles.opdLiveDot} />
              <Text style={styles.opdBadgeText}>IN-CLINIC OPD VISIT</Text>
            </View>
            <View style={styles.tokenPill}>
              <Ticket size={13} color={StitchColors.primaryContainer} />
              <Text style={styles.tokenPillText}>{tokenNumber}</Text>
            </View>
          </View>

          <View style={styles.doctorInfoRow}>
            <Image
              source={{ uri: doctor.avatar }}
              style={styles.doctorAvatar}
              resizeMode="cover"
            />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.doctorName, { color: colors.text }]}>{doctor.name}</Text>
              <Text style={styles.doctorSpecialty}>{doctor.specialty} • {doctor.experienceYears || 16} yrs exp</Text>
              <View style={styles.hospitalRow}>
                <Building2 size={13} color={colors.textSecondary} />
                <Text style={[styles.hospitalText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {doctor.hospital}
                </Text>
              </View>
            </View>
          </View>

          {/* Date & Reporting Strip */}
          <View style={[styles.stripContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F0F4F8' }]}>
            <View style={styles.stripItem}>
              <Calendar size={15} color={StitchColors.primaryContainer} />
              <View>
                <Text style={[styles.stripLabel, { color: colors.textMuted }]}>DATE</Text>
                <Text style={[styles.stripValue, { color: colors.text }]}>
                  {formatHumanDate(date)}
                </Text>
              </View>
            </View>

            <View style={[styles.stripDivider, { backgroundColor: colors.border }]} />

            <View style={styles.stripItem}>
              <Clock size={15} color={StitchColors.primaryContainer} />
              <View>
                <Text style={[styles.stripLabel, { color: colors.textMuted }]}>REPORTING SLOT</Text>
                <Text style={[styles.stripValue, { color: colors.text }]}>
                  {formatTimeSlot(slot)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Patient Details Card */}
        <Animated.View
          entering={FadeInUp.delay(100).duration(350)}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.cardHeaderRow}>
            <View style={styles.cardHeaderTitleRow}>
              <User size={16} color={StitchColors.primaryContainer} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>Patient For This Visit</Text>
            </View>
            <Pressable
              onPress={() => setIsEditingPatient(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.changeButton, { borderColor: StitchColors.primaryContainer }]}
            >
              <Text style={styles.changeButtonText}>Change</Text>
            </Pressable>
          </View>

          <View style={styles.patientSnapshotRow}>
            <View style={[styles.patientIconWrap, { backgroundColor: isDark ? 'rgba(0,102,153,0.2)' : '#E0F2FE' }]}>
              <Text style={styles.patientInitial}>{patientName ? patientName.charAt(0).toUpperCase() : 'P'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.patientNameLine}>
                <Text style={[styles.patientNameText, { color: patientName ? colors.text : StitchColors.error }]}>
                  {patientName || 'Enter Patient Name *'}
                </Text>
                <View style={[styles.selfTag, { backgroundColor: Palette.healthcareTealLight }]}>
                  <Text style={styles.selfTagText}>Self</Text>
                </View>
              </View>
              <Text style={[styles.patientMetaText, { color: colors.textSecondary }]}>
                {patientAge ? `${patientAge} yrs • ` : ''}{patientGender ? `${patientGender} • ` : ''}{patientPhone || 'No contact phone provided *'}
              </Text>
            </View>
          </View>

          {/* Selected Symptoms Badge Strip */}
          {activeSymptoms.length > 0 && (
            <View style={styles.symptomsPreviewStrip}>
              <Text style={[styles.symptomsLabel, { color: colors.textMuted }]}>REASON FOR VISIT:</Text>
              <View style={styles.symptomPillsRow}>
                {activeSymptoms.map((s) => (
                  <View key={s} style={[styles.symptomPill, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                    <Text style={[styles.symptomPillText, { color: colors.text }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>

        {/* Promo Code & Coupon Card */}
        <Animated.View
          entering={FadeInUp.delay(150).duration(350)}
          style={[styles.card, { backgroundColor: colors.card, borderColor: couponApplied ? StitchColors.primaryContainer : colors.border }]}
        >
          <View style={styles.couponRow}>
            <View style={[styles.couponIconWrap, { backgroundColor: couponApplied ? '#E0F2FE' : colors.backgroundElement }]}>
              <Tag size={18} color={couponApplied ? StitchColors.primaryContainer : colors.textMuted} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.couponCodeText, { color: colors.text }]}>HEALTH150</Text>
                {couponApplied && <CheckCircle2 size={15} color={StitchColors.secondaryContainer} />}
              </View>
              <Text style={[styles.couponDescText, { color: couponApplied ? StitchColors.secondaryContainer : colors.textSecondary }]}>
                {couponApplied ? 'Saved ₹150 with health saver coupon' : 'Save ₹150 on your OPD consultation'}
              </Text>
            </View>
            <Pressable
              onPress={handleApplyCouponToggle}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.applyButton, { backgroundColor: couponApplied ? colors.backgroundElement : StitchColors.primaryContainer }]}
            >
              <Text style={[styles.applyButtonText, { color: couponApplied ? colors.text : '#fff' }]}>
                {couponApplied ? 'Remove' : 'Apply'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Bill Breakdown Card */}
        <Animated.View
          entering={FadeInUp.delay(200).duration(350)}
          style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 14 }]}>Bill Summary</Text>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.textSecondary }]}>Doctor Consultation Fee</Text>
            <Text style={[styles.billValue, { color: colors.text }]}>{formatCurrency(baseFee)}</Text>
          </View>

          <View style={styles.billRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.billLabel, { color: colors.textSecondary }]}>Digital OPD Token Reservation</Text>
              <Text style={[styles.strikeFee, { color: colors.textMuted }]}>₹49</Text>
            </View>
            <Text style={[styles.billValue, { color: StitchColors.secondaryContainer, fontWeight: '700' }]}>FREE</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: colors.textSecondary }]}>Hospital Reception Triage</Text>
            <Text style={[styles.billValue, { color: StitchColors.secondaryContainer, fontWeight: '700' }]}>INCLUDED</Text>
          </View>

          {couponApplied && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: StitchColors.secondaryContainer }]}>Coupon Discount (HEALTH150)</Text>
              <Text style={[styles.billValue, { color: StitchColors.secondaryContainer, fontWeight: '700' }]}>-₹150</Text>
            </View>
          )}

          <View style={[styles.billDivider, { backgroundColor: colors.border }]} />

          <View style={styles.billTotalRow}>
            <View>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount to Pay</Text>
              <Text style={[styles.taxInclusiveText, { color: colors.textMuted }]}>Inclusive of all hospital taxes</Text>
            </View>
            <Text style={[styles.totalValue, { color: StitchColors.primaryContainer }]}>
              {formatCurrency(totalPayable)}
            </Text>
          </View>
        </Animated.View>

        {/* Cancellation Guarantee Notice */}
        <View style={[styles.guaranteeBox, { backgroundColor: isDark ? 'rgba(0,102,153,0.1)' : '#F0F9FF', borderColor: isDark ? 'rgba(0,102,153,0.3)' : '#BAE6FD' }]}>
          <ShieldCheck size={20} color={StitchColors.primaryContainer} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.guaranteeTitle, { color: colors.text }]}>Free Cancellation Guarantee</Text>
            <Text style={[styles.guaranteeBody, { color: colors.textSecondary }]}>
              100% instant refund if cancelled up to 2 hours before the 04:15 PM reporting time slot.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 16),
          },
        ]}
      >
        <View style={styles.bottomPriceCol}>
          <Text style={[styles.bottomPayableLabel, { color: colors.textSecondary }]}>Total Payable</Text>
          <Text style={[styles.bottomPriceValue, { color: colors.text }]}>{formatCurrency(totalPayable)}</Text>
        </View>

        <Pressable
          onPress={handleStartPayment}
          style={[styles.payButton, { backgroundColor: StitchColors.primaryContainer }]}
          accessibilityRole="button"
          accessibilityLabel={`Proceed to Pay ${formatCurrency(totalPayable)}`}
        >
          <ShieldCheck size={18} color="#fff" />
          <Text style={styles.payButtonText}>Proceed to Pay {formatCurrency(totalPayable)}</Text>
        </Pressable>
      </View>

      {/* Interactive Indian Payment Bottom-Sheet Modal */}
      <Modal
        visible={paymentSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !isProcessingPayment && setPaymentSheetVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => !isProcessingPayment && setPaymentSheetVisible(false)}
          />

          <View
            style={[
              styles.paymentSheetContent,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 32 : 24),
              },
            ]}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
            </View>

            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.text }]}>Select Payment Option</Text>
                <Text style={[styles.sheetSub, { color: colors.textSecondary }]}>
                  Amount to Pay: <Text style={{ color: StitchColors.primaryContainer, fontWeight: '700' }}>{formatCurrency(totalPayable)}</Text>
                </Text>
              </View>
              <Pressable
                onPress={() => !isProcessingPayment && setPaymentSheetVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={[styles.closeModalButton, { backgroundColor: colors.backgroundElement }]}
              >
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            {isProcessingPayment ? (
              <View style={styles.processingWrap}>
                <ActivityIndicator size="large" color={StitchColors.primaryContainer} />
                <Text style={[styles.processingTitle, { color: colors.text }]}>{processingStatus}</Text>
                <Text style={[styles.processingSub, { color: colors.textSecondary }]}>
                  Please do not press back or close the app
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                {/* 1. UPI Fast Pay Grid */}
                <Text style={[styles.paymentSectionTitle, { color: colors.textMuted }]}>RECOMMENDED UPI APPS</Text>
                <View style={styles.upiGrid}>
                  {UPI_APPS.map((app) => (
                    <Pressable
                      key={app.id}
                      onPress={() => executeBooking(app.name)}
                      style={[
                        styles.upiAppCard,
                        { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                      ]}
                    >
                      <View style={styles.upiIconContainer}>
                        <Wallet size={20} color={StitchColors.primaryContainer} />
                      </View>
                      <Text style={[styles.upiAppName, { color: colors.text }]}>{app.name}</Text>
                      <Text style={styles.upiFastText}>Instant Pay</Text>
                    </Pressable>
                  ))}
                </View>

                {/* 2. Custom UPI ID Input */}
                <View style={[styles.upiInputCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.upiInputLabel, { color: colors.textMuted }]}>OR ENTER UPI ID / VPA</Text>
                    <TextInput
                      placeholder="e.g. yourname@oksbi"
                      placeholderTextColor={colors.textMuted}
                      value={customUpiId}
                      onChangeText={setCustomUpiId}
                      autoCapitalize="none"
                      style={[styles.upiTextInput, { color: colors.text }]}
                    />
                  </View>
                  <Pressable
                    onPress={() => executeBooking(customUpiId || 'UPI VPA')}
                    disabled={!customUpiId.trim()}
                    style={[
                      styles.verifyPayBtn,
                      { backgroundColor: customUpiId.trim() ? StitchColors.primaryContainer : colors.border },
                    ]}
                  >
                    <Text style={styles.verifyPayBtnText}>Pay</Text>
                  </Pressable>
                </View>

                {/* 3. Cards & Net Banking Options */}
                <Text style={[styles.paymentSectionTitle, { color: colors.textMuted, marginTop: 16 }]}>OTHER PAYMENT METHODS</Text>

                {/* Credit / Debit Card */}
                <Pressable
                  onPress={() => executeBooking('Credit/Debit Card')}
                  style={[styles.methodRow, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                >
                  <View style={styles.methodIconWrap}>
                    <CreditCard size={18} color={StitchColors.primaryContainer} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.methodTitle, { color: colors.text }]}>Credit / Debit Cards</Text>
                    <Text style={[styles.methodSub, { color: colors.textSecondary }]}>Visa, Mastercard, RuPay, Maestro</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </Pressable>

                {/* Net Banking */}
                <Pressable
                  onPress={() => executeBooking('Net Banking (HDFC/ICICI)')}
                  style={[styles.methodRow, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                >
                  <View style={styles.methodIconWrap}>
                    <Building size={18} color={StitchColors.primaryContainer} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.methodTitle, { color: colors.text }]}>Net Banking</Text>
                    <Text style={[styles.methodSub, { color: colors.textSecondary }]}>HDFC, ICICI, SBI, Axis & all major banks</Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </Pressable>

                {/* Pay at Hospital Desk */}
                <Pressable
                  onPress={() => executeBooking('Pay at Clinic Desk')}
                  style={[
                    styles.methodRow,
                    {
                      backgroundColor: isDark ? 'rgba(0,102,153,0.15)' : '#F0FDF4',
                      borderColor: isDark ? 'rgba(0,102,153,0.4)' : '#BBF7D0',
                    },
                  ]}
                >
                  <View style={[styles.methodIconWrap, { backgroundColor: '#DCFCE7' }]}>
                    <Banknote size={18} color={StitchColors.secondaryContainer} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.methodTitle, { color: colors.text }]}>Pay at Hospital Desk</Text>
                      <View style={[styles.popularTag, { backgroundColor: '#BBF7D0' }]}>
                        <Text style={[styles.popularTagText, { color: '#15803D' }]}>CASH / UPI ON ARRIVAL</Text>
                      </View>
                    </View>
                    <Text style={[styles.methodSub, { color: colors.textSecondary }]}>
                      Reserve token now, pay cash/UPI directly at the clinic counter
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Quick Change Patient Modal */}
      <Modal
        visible={isEditingPatient}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingPatient(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.patientEditDialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.editDialogTitle, { color: colors.text }]}>Patient Details</Text>
            <Text style={[styles.editDialogSub, { color: colors.textSecondary }]}>
              Enter the details of the person attending the OPD visit
            </Text>

            <View style={styles.editInputGroup}>
              <Text style={[styles.editLabel, { color: colors.textMuted }]}>Full Name</Text>
              <TextInput
                value={patientName}
                onChangeText={setPatientName}
                style={[styles.editTextInput, { color: colors.text, borderColor: colors.border }]}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.editInputGroup, { flex: 1 }]}>
                <Text style={[styles.editLabel, { color: colors.textMuted }]}>Age</Text>
                <TextInput
                  value={patientAge}
                  onChangeText={setPatientAge}
                  keyboardType="numeric"
                  style={[styles.editTextInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>
              <View style={[styles.editInputGroup, { flex: 1 }]}>
                <Text style={[styles.editLabel, { color: colors.textMuted }]}>Gender</Text>
                <TextInput
                  value={patientGender}
                  onChangeText={setPatientGender}
                  style={[styles.editTextInput, { color: colors.text, borderColor: colors.border }]}
                />
              </View>
            </View>

            <View style={styles.editInputGroup}>
              <Text style={[styles.editLabel, { color: colors.textMuted }]}>Phone Number</Text>
              <TextInput
                value={patientPhone}
                onChangeText={setPatientPhone}
                keyboardType="phone-pad"
                style={[styles.editTextInput, { color: colors.text, borderColor: colors.border }]}
              />
            </View>

            <View style={styles.dialogActionRow}>
              <Pressable
                onPress={() => setIsEditingPatient(false)}
                style={[styles.dialogSaveBtn, { backgroundColor: StitchColors.primaryContainer }]}
              >
                <Text style={styles.dialogSaveBtnText}>Save Details</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },

  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 30,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    color: StitchColors.error,
    fontWeight: '600',
    flex: 1,
  },

  card: {
    padding: 16,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    ...Shadows.subtle,
  },

  /* OPD Card */
  opdCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  opdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,102,153,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  opdLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: StitchColors.primaryContainer,
  },
  opdBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: StitchColors.primaryContainer,
    letterSpacing: 0.5,
  },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  tokenPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: StitchColors.primaryContainer,
  },

  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  doctorSpecialty: {
    fontSize: 12,
    fontWeight: '600',
    color: StitchColors.primaryContainer,
    marginTop: 2,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  hospitalText: {
    fontSize: 11,
    flex: 1,
  },

  stripContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    padding: 12,
    borderRadius: BorderRadius.xl,
  },
  stripItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stripDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 10,
  },
  stripLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stripValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },

  /* Patient Card */
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  changeButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  changeButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },
  patientSnapshotRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patientInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: StitchColors.primaryContainer,
  },
  patientNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patientNameText: {
    fontSize: 15,
    fontWeight: '700',
  },
  selfTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selfTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: StitchColors.secondary,
  },
  patientMetaText: {
    fontSize: 12,
    marginTop: 3,
  },
  symptomsPreviewStrip: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  symptomsLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  symptomPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symptomPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  symptomPillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Coupon */
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponCodeText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  couponDescText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  applyButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  applyButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },

  /* Bill */
  billRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  billLabel: {
    fontSize: 13,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  strikeFee: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  billDivider: {
    height: 1,
    marginVertical: 8,
  },
  billTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  taxInclusiveText: {
    fontSize: 10,
    marginTop: 2,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },

  /* Guarantee */
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  guaranteeTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  guaranteeBody: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },

  /* Bottom Bar */
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 16,
  },
  bottomPriceCol: {
    alignItems: 'flex-start',
  },
  bottomPayableLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bottomPriceValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  payButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
    gap: 8,
    ...Shadows.card,
  },
  payButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },

  /* Payment Modal Bottom Sheet */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  paymentSheetContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderTopWidth: 1,
    ...Shadows.modal,
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sheetSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeModalButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  paymentSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  upiGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  upiAppCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  upiIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  upiAppName: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  upiFastText: {
    fontSize: 9,
    fontWeight: '600',
    color: StitchColors.secondaryContainer,
    marginTop: 2,
  },

  upiInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 10,
  },
  upiInputLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  upiTextInput: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    padding: 0,
  },
  verifyPayBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  verifyPayBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },

  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 8,
  },
  methodIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  methodSub: {
    fontSize: 11,
    marginTop: 2,
  },
  popularTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularTagText: {
    fontSize: 8,
    fontWeight: '800',
  },

  processingWrap: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  processingTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  processingSub: {
    fontSize: 12,
  },

  /* Edit Dialog */
  patientEditDialog: {
    margin: 20,
    marginTop: 'auto',
    marginBottom: 'auto',
    padding: 20,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    ...Shadows.modal,
  },
  editDialogTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  editDialogSub: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  editInputGroup: {
    marginBottom: 12,
  },
  editLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  editTextInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  dialogActionRow: {
    marginTop: 8,
  },
  dialogSaveBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: BorderRadius.xl,
  },
  dialogSaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
