/**
 * FiYDOC - Doctor Profile & OPD Slots
 * Pixel-perfect 1:1 implementation of Stitch HTML:
 * - Fixed translucent header (Back, "Doctor Profile", Favorite & Share buttons)
 * - Ambient Header Banner with Doctor Photo, Verified Badge, Specialty, Stats row (18+ Yrs, 4.9 Rating, 2.4k+ Patients)
 * - OPD Location Card with image banner, distance, hours, View Route action
 * - Choose Consultation Slot: Date Selector, Morning/Evening tabs, Slot Pills with Token #s
 * - Zero cancellation charge reassurance
 * - Sticky Bottom Checkout Action Card: Fee ₹800, "Book 04:15 PM • Token #12"
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Heart,
  Share2,
  ShieldCheck,
  Star,
  Building2,
  Navigation,
  Calendar,
  Clock,
  Sun,
  Moon,
  CheckCircle2,
  Circle,
  Shield,
  ArrowRight,
  MapPin,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { StitchColors } from '@/constants/theme';
import { getSpecialtyConfig } from '@/constants/specialties';
import { useDoctorsQuery } from '@/hooks/queries/useDoctorsQuery';
import { doctorService } from '@/services/doctorService';



const generateDynamicDates = () => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const result = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()];
    const dateNum = String(d.getDate()).padStart(2, '0');
    const monthName = months[d.getMonth()];
    const isSunday = d.getDay() === 0;

    result.push({
      id: `date_${i}`,
      day: dayName,
      date: dateNum,
      month: `${monthName}, ${days[d.getDay()]}`,
      slots: isSunday ? 'On Leave' : 'Live Availability',
      isLeave: isSunday,
      isoDate: d.toISOString().slice(0, 10),
    });
  }
  return result;
};

const DATES = generateDynamicDates();

export default function DoctorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: doctors, isLoading } = useDoctorsQuery();

  // Strict lookup: NEVER fallback to doctors[0] if doctor is not found
  const doctor = doctors?.find((d) => d.id === id) || null;

  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedSession, setSelectedSession] = useState<'morning' | 'evening'>('evening');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);

  const currentDate = DATES[selectedDateIndex] || DATES[0];

  const { data: serverSlots = [], isLoading: isLoadingSlots } = useQuery({
    queryKey: ['doctor-slots', doctor?.id, currentDate?.isoDate],
    queryFn: () => (doctor?.id && currentDate?.isoDate ? doctorService.getAvailableSlots(doctor.id, currentDate.isoDate) : Promise.resolve([])),
    enabled: Boolean(doctor?.id && currentDate?.isoDate),
  });

  const morningSlots = (serverSlots || []).filter((s) => s.includes('AM') || s.startsWith('09:') || s.startsWith('10:') || s.startsWith('11:'));
  const eveningSlots = (serverSlots || []).filter((s) => !morningSlots.includes(s));
  const currentSlots = selectedSession === 'morning' ? morningSlots : eveningSlots;
  const currentSlotTime = currentSlots[selectedSlotIndex] || currentSlots[0] || serverSlots[0] || '10:30 AM';

  const toggleFavorite = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setIsFavorite(!isFavorite);
  };

  const handleShare = async () => {
    if (!doctor) return;
    try {
      await Share.share({
        message: `Book an in-clinic OPD consultation with ${doctor.name} on FiYDOC: https://fiydoc.app/doctor/${doctor.id}`,
      });
    } catch (error) {
      // dismissed
    }
  };

  const handleBookContinue = () => {
    if (!doctor) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push({
      pathname: '/(patient)/booking/slot-select',
      params: {
        doctorId: doctor.id,
        doctorName: doctor.name,
        doctorSpecialty: doctor.specialty,
        slotTime: currentSlotTime,
        date: currentDate.isoDate,
        dateLabel: `${currentDate.day}, ${currentDate.date} ${currentDate.month}`,
        fee: doctor.consultationFee.toString(),
      },
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { alignItems: 'center', justifyContent: 'center' }]} edges={['top']}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: StitchColors.onSurface, marginBottom: 16 }}>Loading Doctor Profile...</Text>
        <ActivityIndicator size="large" color={StitchColors.primary} />
      </SafeAreaView>
    );
  }

  if (!doctor) {
    return (
      <SafeAreaView style={[styles.safeArea, { alignItems: 'center', justifyContent: 'center', padding: 24 }]} edges={['top']}>
        <Building2 size={52} color={StitchColors.outline} style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 20, fontWeight: '700', color: StitchColors.onSurface, marginBottom: 8, textAlign: 'center' }}>
          Doctor Not Found
        </Text>
        <Text style={{ fontSize: 14, color: StitchColors.outline, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
          This doctor profile is unavailable or no longer in service. Please return to the directory to find an available doctor.
        </Text>
        <Pressable
          style={{ backgroundColor: StitchColors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          onPress={() => router.replace('/(patient)/(tabs)/discovery')}
        >
          <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>Return to Search</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Fixed Top Bar */}
      <View style={styles.topBar}>
        {Platform.OS === 'ios' ? (
          <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(250, 248, 255, 0.95)' }]} />
        )}
        <View style={styles.topBarRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(patient)/(tabs)/discovery');
              }
            }}
          >
            <ChevronLeft size={20} color={StitchColors.onSurface} />
          </Pressable>

          <Text style={styles.topBarTitle}>Doctor Profile</Text>

          <View style={styles.topBarRightActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Favorite doctor"
              style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
              onPress={toggleFavorite}
            >
              <Heart
                size={18}
                color={isFavorite ? '#e11d48' : StitchColors.onSurface}
                fill={isFavorite ? '#e11d48' : 'transparent'}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share profile"
              style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
              onPress={handleShare}
            >
              <Share2 size={18} color={StitchColors.primary} />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 14) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrap}>
          {/* Ambient Header Banner */}
          <View style={styles.headerCard}>
            <View style={styles.doctorHeaderRow}>
              <View style={styles.avatarWrap}>
                {doctor.avatar ? (
                  <Image
                    source={{ uri: doctor.avatar }}
                    style={styles.doctorAvatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.doctorAvatar, { backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ fontSize: 28, fontWeight: '700', color: '#64748b' }}>{(doctor.name || 'D').charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.verifiedIconBadge}>
                  <ShieldCheck size={14} color="#ffffff" />
                </View>
              </View>

              <View style={styles.doctorHeaderInfo}>
                <View style={styles.statusRow}>
                  {(() => {
                    const specialtyConfig = getSpecialtyConfig(doctor.specialty);
                    const SpecialtyIcon = specialtyConfig.icon;
                    return (
                      <View style={[styles.specialtyPill, { backgroundColor: specialtyConfig.lightBg, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                        <SpecialtyIcon size={12} color={specialtyConfig.color} strokeWidth={2.2} />
                        <Text style={[styles.specialtyPillText, { color: specialtyConfig.color }]}>
                          {doctor.specialty.toUpperCase()}
                        </Text>
                      </View>
                    );
                  })()}
                  <View style={styles.availableStatusRow}>
                    <View style={styles.availableDot} />
                    <Text style={styles.availableStatusText}>Available</Text>
                  </View>
                </View>

                <Text style={styles.doctorProfileName}>{doctor.name}</Text>
                <Text style={styles.doctorDegreeText}>
                  {doctor.qualification || null}
                </Text>
                <Text style={styles.doctorClinicText}>
                  {doctor.hospital || doctor.clinic?.name || null}
                </Text>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              {doctor.experienceYears > 0 ? (
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{doctor.experienceYears}+ Yrs</Text>
                  <Text style={styles.statLabel}>Experience</Text>
                </View>
              ) : null}

              {doctor.rating != null ? (
                <View style={styles.statBox}>
                  <View style={styles.ratingValRow}>
                    <Star size={14} color="#f59e0b" fill="#f59e0b" />
                    <Text style={[styles.statValue, { color: '#b45309' }]}>
                      {doctor.rating.toFixed(1)}
                    </Text>
                  </View>
                  <Text style={styles.statLabel}>Rating ({doctor.reviewCount || 0}+)</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* OPD Location Card — only shown if the doctor has a clinic on file */}
          {doctor.clinic?.name ? (
            <Pressable
              style={styles.locationCard}
              onPress={() => {
                const parts = [
                  doctor.clinic?.name,
                  doctor.clinic?.address,
                  doctor.clinic?.timings ? `Timings: ${doctor.clinic.timings}` : null,
                ].filter(Boolean);
                Alert.alert('OPD Location', parts.join('\n') || 'Location details unavailable.');
              }}
            >
              <View style={styles.locationCardHeader}>
                <View>
                  <View style={styles.opdBadgeRow}>
                    <Building2 size={13} color={StitchColors.primary} />
                    <Text style={styles.opdBadgeText}>OPD LOCATION</Text>
                  </View>
                  <Text style={styles.locationCenterName}>{doctor.clinic.name}</Text>
                  {doctor.clinic.address ? (
                    <Text style={styles.locationAddressText}>{doctor.clinic.address}</Text>
                  ) : null}
                </View>

                {doctor.distanceKm != null ? (
                  <View style={styles.distanceBadge}>
                    <Navigation size={12} color={StitchColors.primary} />
                    <Text style={styles.distanceBadgeText}>{doctor.distanceKm} km</Text>
                  </View>
                ) : null}
              </View>

              {doctor.clinic.timings ? (
                <View style={[styles.bannerBottomRow, { paddingHorizontal: 16, paddingVertical: 10 }]}>
                  <View style={styles.timingPill}>
                    <Clock size={13} color={StitchColors.primary} />
                    <Text style={styles.timingPillText}>{doctor.clinic.timings}</Text>
                  </View>
                </View>
              ) : null}
            </Pressable>
          ) : null}

          {/* Choose Consultation Slot Card */}
          <View style={styles.slotCard}>
            <View style={styles.slotCardHeader}>
              <View>
                <View style={styles.slotTitleRow}>
                  <Calendar size={18} color={StitchColors.primary} />
                  <Text style={styles.slotTitle}>Choose Consultation Slot</Text>
                </View>
                <Text style={styles.slotSubtitle}>In-Clinic token allocated on spot</Text>
              </View>

              <View style={styles.slotsLeftBadge}>
                <View style={styles.slotsLeftDot} />
                <Text style={styles.slotsLeftText}>{currentDate.slots}</Text>
              </View>
            </View>

            {/* Date Selector Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateSelectorScroll}
            >
              {DATES.map((item, idx) => {
                const isSelected = selectedDateIndex === idx;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.selectionAsync();
                      }
                      setSelectedDateIndex(idx);
                    }}
                    style={[
                      styles.dateBtn,
                      isSelected ? styles.dateBtnActive : styles.dateBtnInactive,
                      item.isLeave && { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dateBtnDay,
                        isSelected ? styles.dateBtnDayActive : styles.dateBtnDayInactive,
                        item.isLeave && { color: '#DC2626' },
                      ]}
                    >
                      {item.day}
                    </Text>
                    <Text
                      style={[
                        styles.dateBtnDate,
                        isSelected ? styles.dateBtnDateActive : styles.dateBtnDateInactive,
                        item.isLeave && { color: '#DC2626' },
                      ]}
                    >
                      {item.date}
                    </Text>
                    <Text
                      style={[
                        styles.dateBtnMonth,
                        isSelected ? styles.dateBtnMonthActive : styles.dateBtnMonthInactive,
                        item.isLeave && { color: '#EF4444' },
                      ]}
                    >
                      {item.isLeave ? 'Leave' : item.month}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Morning / Evening Toggle Tabs */}
            <View style={styles.sessionToggleWrap}>
              <Pressable
                style={[
                  styles.sessionTab,
                  selectedSession === 'morning' && styles.sessionTabActive,
                ]}
                onPress={() => {
                  setSelectedSession('morning');
                  setSelectedSlotIndex(0);
                }}
              >
                <Sun
                  size={15}
                  color={selectedSession === 'morning' ? StitchColors.primary : StitchColors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.sessionTabText,
                    selectedSession === 'morning' && styles.sessionTabTextActive,
                  ]}
                >
                  Morning ({morningSlots.length})
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.sessionTab,
                  selectedSession === 'evening' && styles.sessionTabActive,
                ]}
                onPress={() => {
                  setSelectedSession('evening');
                  setSelectedSlotIndex(0);
                }}
              >
                <Moon
                  size={15}
                  color={selectedSession === 'evening' ? StitchColors.primary : StitchColors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.sessionTabText,
                    selectedSession === 'evening' && styles.sessionTabTextActive,
                  ]}
                >
                  Evening ({eveningSlots.length})
                </Text>
              </Pressable>
            </View>

            {/* Slot Group Header */}
            <View style={styles.slotGroupHeader}>
              <View style={styles.slotGroupTitleRow}>
                <View style={styles.slotGroupDot} />
                <Text style={styles.slotGroupTitle}>
                  {selectedSession === 'morning' ? 'Morning OPD Consultation' : 'Evening OPD Consultation'}
                </Text>
              </View>
              <Text style={styles.slotGroupWait}>Live OPD schedule</Text>
            </View>

            {/* Slots Grid */}
            {currentSlots.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: StitchColors.outline }}>
                  {isLoadingSlots ? 'Checking slot availability...' : 'No available slots for this session.'}
                </Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {currentSlots.map((slotTimeStr, idx) => {
                  const isSelected = selectedSlotIndex === idx;
                  return (
                    <Pressable
                      key={slotTimeStr}
                      onPress={() => {
                        if (Platform.OS !== 'web') {
                          Haptics.selectionAsync();
                        }
                        setSelectedSlotIndex(idx);
                      }}
                      style={[
                        styles.slotPill,
                        isSelected ? styles.slotPillActive : styles.slotPillInactive,
                      ]}
                    >
                      <View>
                        <Text
                          style={[
                            styles.slotTimeText,
                            isSelected ? styles.slotTimeTextActive : styles.slotTimeTextInactive,
                          ]}
                        >
                          {slotTimeStr}
                        </Text>
                        <Text
                          style={[
                            styles.slotTokenText,
                            isSelected ? styles.slotTokenTextActive : styles.slotTokenTextInactive,
                          ]}
                        >
                          Available Slot
                        </Text>
                      </View>

                      {isSelected ? (
                        <CheckCircle2 size={19} color="#ffffff" />
                      ) : (
                        <Circle size={19} color="#cbd5e1" />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Cancellation Guarantee Reassurance */}
            <View style={styles.cancellationReassurance}>
              <Shield size={16} color={StitchColors.secondary} />
              <Text style={styles.cancellationText}>
                Zero booking cancellation charge up to 2 hrs before OPD
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Checkout Action Card */}
      <View
        style={[
          styles.bottomCheckoutBar,
          { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 24 : 14) },
        ]}
      >
        <View style={styles.bottomCheckoutInner}>
          <View style={styles.feeBlock}>
            <Text style={styles.feeLabel}>TOTAL FEE</Text>
            <View style={styles.feeAmountRow}>
              <Text style={styles.feeAmount}>₹{doctor.consultationFee || 800}</Text>
              <Text style={styles.feeTaxNotice}>incl. tax</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.bookCtaButton, pressed && styles.buttonPressed]}
            onPress={handleBookContinue}
          >
            <Text style={styles.bookCtaText} numberOfLines={1}>
              Book {currentSlotTime}
            </Text>
            <ArrowRight size={17} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: StitchColors.surface,
  },
  topBar: {
    height: 56,
    zIndex: 40,
    backgroundColor: 'rgba(250, 248, 255, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 226, 253, 0.4)',
  },
  topBarRow: {
    flex: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  topBarRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: StitchColors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  scrollContainer: {
    paddingBottom: 110,
  },
  contentWrap: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    ...(Platform.OS === 'web' ? { maxWidth: 440, alignSelf: 'center' as const } : {}),
  },
  headerCard: {
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.35)',
    ...Platform.select({
      ios: {
        shadowColor: '#1450a3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 20px rgba(20, 80, 163, 0.06)',
      },
    }),
  },
  doctorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  avatarWrap: {
    position: 'relative',
  },
  doctorAvatar: {
    width: 76,
    height: 76,
    borderRadius: 18,
    backgroundColor: StitchColors.surfaceContainerHigh,
  },
  verifiedIconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: StitchColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  doctorHeaderInfo: {
    flex: 1,
    minWidth: 0,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specialtyPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: StitchColors.primaryFixed,
  },
  specialtyPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: StitchColors.primary,
    letterSpacing: 0.4,
  },
  availableStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: StitchColors.secondary,
  },
  availableStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: StitchColors.secondary,
  },
  doctorProfileName: {
    fontSize: 18,
    fontWeight: '800',
    color: StitchColors.onSurface,
    marginTop: 4,
  },
  doctorDegreeText: {
    fontSize: 12.5,
    color: StitchColors.onSurfaceVariant,
    marginTop: 1,
  },
  doctorClinicText: {
    fontSize: 11.5,
    color: StitchColors.outline,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 198, 211, 0.25)',
  },
  statBox: {
    flex: 1,
    backgroundColor: StitchColors.surfaceContainerLow,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 14.5,
    fontWeight: '800',
    color: StitchColors.onSurface,
  },
  ratingValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10.5,
    color: StitchColors.onSurfaceVariant,
    marginTop: 2,
  },

  /* OPD Location Card */
  locationCard: {
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.35)',
  },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  opdBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  opdBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.primary,
    letterSpacing: 0.5,
  },
  locationCenterName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: StitchColors.onSurface,
    marginTop: 3,
  },
  locationAddressText: {
    fontSize: 12,
    color: StitchColors.onSurfaceVariant,
    marginTop: 1,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: StitchColors.surfaceContainer,
  },
  distanceBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  locationImageBanner: {
    height: 110,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
    position: 'relative',
  },
  locationBannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  bannerBottomRow: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  timingPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  viewRoutePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  viewRouteText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },

  /* Slot Card */
  slotCard: {
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.35)',
  },
  slotCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  slotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  slotSubtitle: {
    fontSize: 11.5,
    color: StitchColors.onSurfaceVariant,
    marginTop: 2,
  },
  slotsLeftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: 'rgba(118, 244, 224, 0.25)',
  },
  slotsLeftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: StitchColors.secondary,
  },
  slotsLeftText: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.secondary,
  },
  dateSelectorScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  dateBtn: {
    width: 72,
    paddingVertical: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBtnActive: {
    backgroundColor: StitchColors.primary,
    ...Platform.select({
      ios: {
        shadowColor: StitchColors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0, 57, 126, 0.2)',
      },
    }),
  },
  dateBtnInactive: {
    backgroundColor: StitchColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.3)',
  },
  dateBtnDay: {
    fontSize: 11,
  },
  dateBtnDayActive: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },
  dateBtnDayInactive: {
    color: StitchColors.outline,
  },
  dateBtnDate: {
    fontSize: 17,
    fontWeight: '800',
    marginVertical: 1,
  },
  dateBtnDateActive: {
    color: '#ffffff',
  },
  dateBtnDateInactive: {
    color: StitchColors.onSurface,
  },
  dateBtnMonth: {
    fontSize: 10.5,
  },
  dateBtnMonthActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  dateBtnMonthInactive: {
    color: StitchColors.onSurfaceVariant,
  },
  sessionToggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: StitchColors.surfaceContainerLow,
    padding: 3,
    borderRadius: 12,
    marginTop: 14,
    gap: 4,
  },
  sessionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 9,
  },
  sessionTabActive: {
    backgroundColor: StitchColors.surfaceContainerLowest,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  sessionTabText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: StitchColors.onSurfaceVariant,
  },
  sessionTabTextActive: {
    fontWeight: '700',
    color: StitchColors.primary,
  },
  slotGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 8,
  },
  slotGroupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotGroupDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: StitchColors.primary,
  },
  slotGroupTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  slotGroupWait: {
    fontSize: 11,
    color: StitchColors.outline,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotPill: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
  },
  slotPillActive: {
    backgroundColor: StitchColors.primary,
    borderWidth: 2,
    borderColor: StitchColors.primary,
    ...Platform.select({
      ios: {
        shadowColor: StitchColors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 57, 126, 0.25)',
      },
    }),
  },
  slotPillInactive: {
    backgroundColor: StitchColors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.3)',
  },
  slotTimeText: {
    fontSize: 14,
  },
  slotTimeTextActive: {
    fontWeight: '800',
    color: '#ffffff',
  },
  slotTimeTextInactive: {
    fontWeight: '600',
    color: StitchColors.onSurface,
  },
  slotTokenText: {
    fontSize: 11,
    marginTop: 2,
  },
  slotTokenTextActive: {
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  slotTokenTextInactive: {
    color: StitchColors.onSurfaceVariant,
  },
  cancellationReassurance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(242, 243, 255, 0.8)',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.25)',
  },
  cancellationText: {
    fontSize: 11.5,
    color: StitchColors.onSurfaceVariant,
    flex: 1,
    lineHeight: 16,
  },

  /* Bottom Checkout Bar */
  bottomCheckoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(195, 198, 211, 0.4)',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 -6px 24px rgba(15, 23, 42, 0.08)',
      },
    }),
  },
  bottomCheckoutInner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...(Platform.OS === 'web' ? { maxWidth: 440, alignSelf: 'center' as const } : {}),
  },
  feeBlock: {
    minWidth: 84,
  },
  feeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: StitchColors.outline,
    letterSpacing: 0.5,
  },
  feeAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 1,
  },
  feeAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: StitchColors.onSurface,
  },
  feeTaxNotice: {
    fontSize: 10.5,
    fontWeight: '600',
    color: StitchColors.secondary,
  },
  bookCtaButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: StitchColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: StitchColors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 14px rgba(0, 57, 126, 0.3)',
      },
    }),
  },
  bookCtaText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#ffffff',
  },
});
