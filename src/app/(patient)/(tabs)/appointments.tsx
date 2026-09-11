/**
 * FiYDOC - Visits & Booking History
 * Fully dynamic implementation — all data from useAppointmentStore.
 * No hardcoded mock data.
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  SlidersHorizontal,
  Calendar,
  FileText,
  QrCode,
  ArrowRight,
  Archive,
  X,
  Building2,
  Clock,
  ShieldCheck,
  Check,
} from 'lucide-react-native';
import { StitchColors } from '@/constants/theme';
import { useAppointmentStore } from '@/store/useAppointmentStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useHealthStore } from '@/store/useHealthStore';
import { Appointment } from '@/types/index';

function AppointmentCard({ apt, onViewPass, onViewRx }: { apt: Appointment; onViewPass?: () => void; onViewRx?: () => void }) {
  const router = useRouter();
  const isUpcoming = ['confirmed', 'checked_in', 'upcoming', 'in_progress', 'pending'].includes(apt.status);
  const isCancelled = apt.status === 'cancelled';

  const statusColor = isCancelled ? '#dc2626' : StitchColors.secondary;
  const statusLabel = isCancelled ? 'Cancelled' : apt.status === 'confirmed' ? 'Confirmed' : apt.status === 'checked_in' ? 'Checked In' : apt.status === 'in_progress' ? 'In Progress' : apt.status === 'completed' ? 'Completed' : 'Upcoming';

  const avatarUri = apt.doctorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(apt.doctorName || 'D')}&background=DBEAFE&color=1D4ED8`;

  return (
    <View style={styles.bookingCard}>
      <View style={styles.cardHeader}>
        <View style={styles.slotRow}>
          <Calendar size={17} color={isCancelled ? StitchColors.outline : StitchColors.primary} />
          <Text style={[styles.slotText, isCancelled && { color: StitchColors.outline }]}>
            {apt.date} • {apt.time}
          </Text>
        </View>
        <View style={[styles.tokenPill, { backgroundColor: isCancelled ? '#fee2e2' : 'rgba(20,164,120,0.1)' }]}>
          {!isCancelled && <View style={styles.tokenDot} />}
          <Text style={[styles.tokenPillText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.doctorInfoRow}>
        <Image
          source={{ uri: avatarUri }}
          style={styles.doctorAvatar}
          contentFit="cover"
        />
        <View style={styles.doctorDetails}>
          <Text style={styles.doctorName}>{apt.doctorName}</Text>
          <Text style={styles.doctorSpecialty}>{apt.doctorSpecialty} • {apt.hospital}</Text>
          {isCancelled && (
            <Text style={[styles.queueTelemetryText, { marginTop: 4, color: '#dc2626' }]}>
              Cancelled — full refund will be processed within 3–5 business days
            </Text>
          )}
          {apt.tokenNumber && isUpcoming && (
            <View style={styles.queueTelemetryRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.queueTelemetryText}>Token {apt.tokenNumber}</Text>
            </View>
          )}
        </View>
      </View>

      {apt.symptoms && apt.symptoms.length > 0 && (
        <View style={styles.triageSnippetRow}>
          <View style={styles.triageLeft}>
            <FileText size={14} color={StitchColors.outline} />
            <Text style={styles.triageText} numberOfLines={1}>
              {apt.symptoms.join(' • ')}
            </Text>
          </View>
        </View>
      )}

      {isUpcoming && onViewPass && (
        <Pressable
          style={({ pressed }) => [styles.passCtaButton, pressed && styles.buttonPressed]}
          onPress={onViewPass}
        >
          <QrCode size={18} color="#ffffff" />
          <Text style={styles.passCtaText}>View Visit Pass & Live Queue →</Text>
        </Pressable>
      )}

      {apt.status === 'completed' && onViewRx && (
        <Pressable
          style={[styles.passCtaButton, { backgroundColor: StitchColors.secondary }]}
          onPress={onViewRx}
        >
          <FileText size={18} color="#ffffff" />
          <Text style={styles.passCtaText}>View Prescription →</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function PatientAppointmentsScreen() {
  const router = useRouter();
  const { appointments } = useAppointmentStore();
  const { user } = useAuthStore();
  const { prescriptions } = useHealthStore();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [visitPassVisible, setVisitPassVisible] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  const handleTabChange = (tab: 'upcoming' | 'completed' | 'cancelled') => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setActiveTab(tab);
  };

  const handleOpenPass = (apt: Appointment) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSelectedApt(apt);
    setVisitPassVisible(true);
  };

  const handleViewRx = (apt: Appointment) => {
    const rx = prescriptions.find((p) => p.patientId === apt.patientId || p.consultationId === apt.id);
    if (rx) {
      router.push(`/(patient)/health/prescription/${rx.id}`);
    } else {
      router.push('/(patient)/(tabs)/health');
    }
  };

  const patientApts = useMemo(() => {
    return appointments.filter((a) => {
      if (!user) return false;
      return a.patientId === user.id ||
        (a.patientName && user.name && a.patientName.toLowerCase() === user.name.toLowerCase());
    });
  }, [appointments, user]);

  const upcoming = useMemo(() =>
    patientApts.filter((a) => ['confirmed', 'checked_in', 'upcoming', 'in_progress', 'pending'].includes(a.status))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [patientApts]
  );
  const completed = useMemo(() =>
    patientApts.filter((a) => a.status === 'completed')
      .sort((a, b) => b.date.localeCompare(a.date)),
    [patientApts]
  );
  const cancelled = useMemo(() =>
    patientApts.filter((a) => a.status === 'cancelled')
      .sort((a, b) => b.date.localeCompare(a.date)),
    [patientApts]
  );

  const currentList = activeTab === 'upcoming' ? upcoming : activeTab === 'completed' ? completed : cancelled;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(patient)/(tabs)/home');
            }
          }}
        >
          <ChevronLeft size={20} color={StitchColors.onSurface} />
        </Pressable>

        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>My Visits</Text>
          <Text style={styles.topBarSubtitle}>Appointments & Queue Passes</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filter appointments"
          style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.selectionAsync();
            }
          }}
        >
          <SlidersHorizontal size={18} color={StitchColors.outline} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrap}>
          {/* Segmented Filter Pills */}
          <View style={styles.segmentedFilter}>
            {(['upcoming', 'completed', 'cancelled'] as const).map((tab) => {
              const count = tab === 'upcoming' ? upcoming.length : tab === 'completed' ? completed.length : cancelled.length;
              return (
                <Pressable
                  key={tab}
                  style={[styles.segmentPill, activeTab === tab && styles.segmentPillActive]}
                  onPress={() => handleTabChange(tab)}
                >
                  <Text style={[styles.segmentText, activeTab === tab && styles.segmentTextActive]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                  <View style={[styles.segmentBadge, activeTab === tab ? styles.segmentBadgeActive : styles.segmentBadgeInactive]}>
                    <Text style={[styles.segmentBadgeText, activeTab === tab && styles.segmentBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Appointment List */}
          <View style={styles.sectionWrap}>
            {currentList.length === 0 ? (
              <View style={{ padding: 32, alignItems: 'center', gap: 12 }}>
                <Calendar size={40} color={StitchColors.outline} />
                <Text style={{ fontSize: 16, fontWeight: '600', color: StitchColors.onSurface }}>
                  No {activeTab} appointments
                </Text>
                <Text style={{ fontSize: 13, color: StitchColors.outline, textAlign: 'center' }}>
                  {activeTab === 'upcoming'
                    ? 'Book a consultation to get started.'
                    : activeTab === 'completed'
                    ? 'Your completed visits will appear here.'
                    : 'Cancelled appointments will appear here.'}
                </Text>
                {activeTab === 'upcoming' && (
                  <Pressable
                    onPress={() => router.push('/(patient)/(tabs)/home')}
                    style={{ marginTop: 8, backgroundColor: StitchColors.primaryContainer, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Find a Doctor</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              currentList.map((apt) => (
                <AppointmentCard
                  key={apt.id}
                  apt={apt}
                  onViewPass={() => handleOpenPass(apt)}
                  onViewRx={() => handleViewRx(apt)}
                />
              ))
            )}

            {/* Health Vault Archive Reassurance Footer */}
            {activeTab === 'upcoming' && upcoming.length > 0 && (
              <Pressable
                style={styles.healthVaultFooter}
                onPress={() => router.push('/(patient)/(tabs)/health')}
              >
                <Archive size={15} color={StitchColors.outline} />
                <Text style={styles.healthVaultText}>
                  Looking for past consultations? View Health Vault
                </Text>
                <ArrowRight size={13} color={StitchColors.outline} />
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Digital Visit Pass Bottom Sheet Modal */}
      <Modal
        visible={visitPassVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisitPassVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setVisitPassVisible(false)}
          />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Digital Visit Pass</Text>
                <Text style={styles.sheetSubtitle}>
                  {selectedApt?.hospital ? `Present at ${selectedApt.hospital}` : 'Present at OPD Reception'}
                </Text>
              </View>
              <Pressable
                style={styles.sheetCloseBtn}
                onPress={() => setVisitPassVisible(false)}
              >
                <X size={18} color={StitchColors.onSurface} />
              </Pressable>
            </View>

            <View style={styles.passBody}>
              <View style={styles.tokenHeroRow}>
                <View style={styles.tokenBigBadge}>
                  <Text style={styles.tokenBigNumber}>{selectedApt?.tokenNumber ?? '#—'}</Text>
                  <Text style={styles.tokenBigLabel}>ENTRY TOKEN</Text>
                </View>
                <View style={styles.qrContainer}>
                  <QrCode size={96} color={StitchColors.primary} />
                  <Text style={styles.qrCaption}>Scan at OPD turnstile</Text>
                </View>
              </View>

              <View style={styles.passDetailsCard}>
                <View style={styles.passDetailItem}>
                  <Building2 size={16} color={StitchColors.primary} />
                  <View style={styles.passDetailText}>
                    <Text style={styles.passDetailLabel}>Location</Text>
                    <Text style={styles.passDetailValue}>{selectedApt?.hospital || '—'}</Text>
                  </View>
                </View>

                <View style={styles.passDetailDivider} />

                <View style={styles.passDetailItem}>
                  <Clock size={16} color={StitchColors.secondary} />
                  <View style={styles.passDetailText}>
                    <Text style={styles.passDetailLabel}>Scheduled Time</Text>
                    <Text style={styles.passDetailValue}>{selectedApt?.date} • {selectedApt?.time}</Text>
                  </View>
                </View>

                <View style={styles.passDetailDivider} />

                <View style={styles.passDetailItem}>
                  <ShieldCheck size={16} color={StitchColors.secondary} />
                  <View style={styles.passDetailText}>
                    <Text style={styles.passDetailLabel}>Status</Text>
                    <Text style={[styles.passDetailValue, { color: StitchColors.secondary, fontWeight: '700' }]}>
                      {selectedApt?.status === 'confirmed' ? 'Confirmed — Please arrive 15 mins early' :
                       selectedApt?.status === 'checked_in' ? 'Checked In — Please enter the consultation room' :
                       selectedApt?.status === 'in_progress' ? 'Consultation in progress' :
                       'Slot Reserved'}
                    </Text>
                  </View>
                </View>
              </View>

              <Pressable
                style={styles.sheetDoneBtn}
                onPress={() => setVisitPassVisible(false)}
              >
                <Check size={18} color="#ffffff" />
                <Text style={styles.sheetDoneText}>Done</Text>
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
    backgroundColor: StitchColors.surface,
  },
  topBar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: StitchColors.surface,
  },
  topBarCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: StitchColors.onSurface,
    letterSpacing: -0.2,
  },
  topBarSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: StitchColors.outline,
    marginTop: 1,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      },
    }),
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  scrollContainer: {
    paddingBottom: 110,
  },
  contentWrap: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    ...(Platform.OS === 'web' ? { maxWidth: 440, alignSelf: 'center' as const } : {}),
  },
  segmentedFilter: {
    padding: 4,
    backgroundColor: 'rgba(218, 226, 253, 0.6)',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.3)',
    marginBottom: 16,
  },
  segmentPill: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentPillActive: {
    backgroundColor: StitchColors.surfaceContainerLowest,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
      },
    }),
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '500',
    color: StitchColors.onSurfaceVariant,
  },
  segmentTextActive: {
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  segmentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  segmentBadgeActive: {
    backgroundColor: 'rgba(20, 80, 163, 0.1)',
  },
  segmentBadgeInactive: {
    backgroundColor: 'rgba(218, 226, 253, 0.6)',
  },
  segmentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: StitchColors.outline,
  },
  segmentBadgeTextActive: {
    fontWeight: '700',
    color: StitchColors.primary,
  },
  sectionWrap: {
    gap: 14,
  },
  bookingCard: {
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.35)',
    ...Platform.select({
      ios: {
        shadowColor: '#131b2e',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 3px 12px rgba(19, 27, 46, 0.05)',
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 198, 211, 0.2)',
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: '#ccfbf1',
  },
  tokenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: StitchColors.secondary,
  },
  tokenPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f766e',
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: StitchColors.surfaceContainerHigh,
  },
  doctorDetails: {
    flex: 1,
    minWidth: 0,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  doctorSpecialty: {
    fontSize: 12,
    color: StitchColors.onSurfaceVariant,
    marginTop: 2,
  },
  queueTelemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: StitchColors.secondary,
  },
  queueTelemetryText: {
    fontSize: 11,
    fontWeight: '600',
    color: StitchColors.secondary,
  },
  triageSnippetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: StitchColors.surfaceContainerLow,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.2)',
    marginBottom: 12,
  },
  triageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  triageText: {
    fontSize: 11.5,
    color: StitchColors.onSurfaceVariant,
  },
  editDetailsLink: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.primary,
    marginLeft: 8,
  },
  passCtaButton: {
    height: 44,
    borderRadius: 14,
    backgroundColor: StitchColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: StitchColors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 3px 10px rgba(0, 57, 126, 0.25)',
      },
    }),
  },
  passCtaText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  historySection: {
    marginTop: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: StitchColors.onSurfaceVariant,
  },
  viewAllLink: {
    fontSize: 11.5,
    fontWeight: '600',
    color: StitchColors.primary,
  },
  historyCard: {
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  historyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  historyAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: StitchColors.surfaceContainerHigh,
  },
  historyTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  historyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyDoctorName: {
    fontSize: 13,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  completedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: StitchColors.surfaceContainer,
  },
  completedBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: StitchColors.secondary,
  },
  historyMeta: {
    fontSize: 11,
    color: StitchColors.outline,
    marginTop: 2,
  },
  rxButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(20, 80, 163, 0.1)',
  },
  rxButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  healthVaultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  healthVaultText: {
    fontSize: 12,
    color: StitchColors.outline,
    fontWeight: '500',
  },

  /* Modal Bottom Sheet */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  modalSheet: {
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
      },
    }),
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: StitchColors.surfaceContainerHighest,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(195, 198, 211, 0.25)',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: StitchColors.onSurfaceVariant,
    marginTop: 1,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: StitchColors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passBody: {
    paddingTop: 16,
    gap: 16,
  },
  tokenHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: StitchColors.surfaceContainerLow,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.3)',
  },
  tokenBigBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenBigNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: StitchColors.primary,
    lineHeight: 52,
  },
  tokenBigLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: StitchColors.onSurfaceVariant,
    letterSpacing: 1,
    marginTop: 2,
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.4)',
  },
  qrCaption: {
    fontSize: 10,
    fontWeight: '600',
    color: StitchColors.outline,
    marginTop: 6,
  },
  passDetailsCard: {
    backgroundColor: StitchColors.surfaceContainerLow,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.25)',
    gap: 10,
  },
  passDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  passDetailText: {
    flex: 1,
  },
  passDetailLabel: {
    fontSize: 11,
    color: StitchColors.outline,
    fontWeight: '500',
  },
  passDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: StitchColors.onSurface,
    marginTop: 1,
  },
  passDetailDivider: {
    height: 1,
    backgroundColor: 'rgba(195, 198, 211, 0.2)',
  },
  sheetDoneBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: StitchColors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  sheetDoneText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
