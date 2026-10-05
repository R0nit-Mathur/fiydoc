import React, { useState, useLayoutEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  StyleSheet,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHealthStore } from '@/store/useHealthStore';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/services/apiClient';
import { Prescription } from '@/types/index';
import { mapPrescription } from '@/utils/prescriptionMapper';
import { CardSkeleton, TextBlockSkeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { BorderRadius, Shadows, Spacing, StitchColors, Palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  ArrowLeft,
  Pill,
  Calendar,
  Download,
  Share2,
  Clock,
  Activity,
  FileText,
  Stethoscope,
  Sparkles,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react-native';

export default function DedicatedPrescriptionScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useStyles(colors, isDark);
  const { id: routeId } = useLocalSearchParams<{ id: string | string[] }>();
  const id = typeof routeId === 'string' ? routeId : undefined;
  const { prescriptions } = useHealthStore();
  const { user } = useAuthStore();
  const userId = user?.id;
  const userRole = user?.role;
  const accessToken = user?.accessToken;
  const [remoteRx, setRemoteRx] = useState<{ accountId: string; prescription: Prescription } | null>(null);
  const [loading, setLoading] = useState(Boolean(id && userId));
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState('');
  const activeRequest = useRef<{ controller: AbortController; id: string; accountId: string } | null>(null);
  const currentScope = useRef({ id, userId, userRole, accessToken });
  currentScope.current = { id, userId, userRole, accessToken };

  const fetchPrescription = useCallback(
    async (showLoader = true, isRefresh = false) => {
      if (!id || !userId) { setLoading(false); setRefreshing(false); return; }
      const previous = activeRequest.current;
      if (previous?.id === id && previous.accountId === userId && !previous.controller.signal.aborted) return;
      previous?.controller.abort();
      const request = { controller: new AbortController(), id, accountId: userId };
      activeRequest.current = request;
      const isCurrent = () => {
        const currentUser = useAuthStore.getState().user;
        const scope = currentScope.current;
        return activeRequest.current === request && !request.controller.signal.aborted
          && scope.id === id && scope.userId === userId && scope.userRole === userRole && scope.accessToken === accessToken
          && currentUser?.id === userId && currentUser.role === userRole && currentUser.accessToken === accessToken;
      };
      setLoadError('');
      if (showLoader) setLoading(true);
      if (isRefresh) setRefreshing(true);
      try {
        const data = await apiClient<unknown>(`/prescriptions/${encodeURIComponent(id)}`, { signal: request.controller.signal });
        if (!isCurrent()) return;
        const mapped = mapPrescription(data);
        if (mapped.id !== id) throw new Error('The requested prescription was not returned.');
        setRemoteRx({ accountId: userId, prescription: mapped });
        useHealthStore.getState().addPrescription(mapped);
      } catch (err: any) {
        if (isCurrent()) setLoadError(err?.message || 'Unable to load this prescription.');
      } finally {
        if (isCurrent()) {
          setLoading(false);
          setRefreshing(false);
        }
        if (activeRequest.current === request) activeRequest.current = null;
      }
    },
    [id, userId, userRole, accessToken]
  );

  useLayoutEffect(() => {
    setRemoteRx(null);
    setLoadError('');
    setRefreshing(false);
    const existing = useHealthStore.getState().prescriptions.find((p) => p.id === id && p.patientId === userId);
    setLoading(Boolean(id && userId && !existing));
    void fetchPrescription(!existing);
    return () => {
      activeRequest.current?.controller.abort();
      activeRequest.current = null;
    };
  }, [id, fetchPrescription]);

  // Stored records are usable only with an exact patient ID match. Canonical
  // patient UUIDs that differ from the account UUID need a fresh authorized fetch.
  const rx = userId ? (remoteRx?.accountId === userId && remoteRx.prescription.id === id ? remoteRx.prescription : null)
    || prescriptions.find((p) => p.id === id && p.patientId === userId) : undefined;

  const handleDownloadPDF = async () => {
    if (!rx?.pdfUrl) {
      Alert.alert('PDF unavailable', 'A downloadable PDF has not been provided for this prescription.');
      return;
    }
    try {
      const url = new URL(rx.pdfUrl);
      if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Invalid PDF link.');
      await Linking.openURL(url.toString());
    } catch {
      Alert.alert('Unable to open PDF', 'Please try again or ask your clinic for a copy.');
    }
  };

  const handleShare = async () => {
    if (!rx) return;
    try {
      await Share.share({
        title: `FiYDoc Digital Prescription - ${rx.id}`,
        message: `FiYDoc Digital Prescription\nDoctor: ${rx.doctorName || 'Doctor details unavailable'}\nSpecialty: ${rx.doctorSpecialty || 'Specialty not provided'}\nDiagnosis: ${rx.diagnosis || 'Not recorded'}\nMedications: ${rx.medicines?.map((m) => `${m.name} (${m.dosage})`).join(', ') || 'None recorded'}${rx.verificationCode ? `\nVerification Code: ${rx.verificationCode}` : ''}`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSafeBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(patient)/(tabs)/health');
    }
  };

  if (!rx && !loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleSafeBack}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digital Prescription</Text>
        </View>
        <View style={styles.emptyContainer}>
          <FileText size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>{loadError ? 'Prescription unavailable' : 'Prescription not found'}</Text>
          <Text selectable style={styles.emptySubtitle}>{loadError || 'The requested prescription could not be located.'}</Text>
          <TouchableOpacity
            onPress={() => fetchPrescription(true)}
            style={[styles.downloadBtn, { paddingHorizontal: 24, height: 44, marginTop: 12 }]}
          >
            <Text style={styles.downloadBtnText}>Retry Fetch</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!rx && loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.scrollContent} accessibilityLabel="Loading prescription" accessibilityState={{ busy: true }}>
          <CardSkeleton />
          <TextBlockSkeleton lines={5} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleSafeBack}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Digital Prescription
          </Text>
          <Text style={styles.headerSub}>{rx?.verificationCode ? `Code: ${rx.verificationCode}` : 'Prescription record'}</Text>
        </View>
        <TouchableOpacity
          onPress={handleShare}
          style={styles.iconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Share prescription"
        >
          <Share2 size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { void fetchPrescription(false, true); }}
            colors={[StitchColors.primaryContainer, colors.teal]}
            tintColor={StitchColors.primaryContainer}
          />
        }
      >
        {loadError && (
          <View style={styles.toastBox}>
            <AlertCircle size={16} color={StitchColors.secondaryContainer} />
            <Text selectable style={styles.toastText}>Couldn't refresh. Showing saved record. Pull down to retry.</Text>
          </View>
        )}

        {/* 1. Recorded clinic details */}
        <View style={styles.letterhead}>
          <View style={styles.letterheadTop}>
            <Avatar
              uri={rx?.doctorAvatar}
              name={rx?.doctorName || 'Doctor details unavailable'}
              size="lg"
            />
            <View style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
              <Text style={styles.clinicName} numberOfLines={1}>
                {rx?.clinicName || 'Clinic details unavailable'}
              </Text>
              <Text style={styles.doctorName}>{rx?.doctorName || 'Doctor details unavailable'}</Text>
              <Text style={styles.doctorSpecialty}>
                {rx?.doctorSpecialty || 'Specialty not provided'}
              </Text>
              {rx?.doctorQualifications ? (
                <Text style={styles.doctorQualifications}>{rx.doctorQualifications}</Text>
              ) : null}

              {rx?.doctorMciNumber ? (
                <View style={styles.mciBadge}>
                  <Text style={styles.mciBadgeText}>REG / NMC: {rx.doctorMciNumber}</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.rxBadge}>
              <Text style={styles.rxBadgeText}>Rx</Text>
            </View>
          </View>
          <Text style={styles.clinicAddress}>
            {rx?.clinicAddress || 'Clinic address not recorded'}
          </Text>
        </View>

        {/* 2. Patient Demographics Box */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaLabel}>PATIENT NAME</Text>
              <Text style={styles.metaValue}>
                {rx?.patientName || 'Patient name not recorded'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metaLabel}>RECORD DATE</Text>
              <Text style={styles.metaValue}>{rx?.createdAt || 'Date unavailable'}</Text>
            </View>
          </View>

          <View style={[styles.metaRow, styles.metaRowBorder]}>
            <View>
              <Text style={styles.metaLabel}>AGE / GENDER</Text>
              <Text style={styles.metaValueSub}>
                {rx?.patientAge !== undefined ? `${rx.patientAge} Yrs` : 'Age not recorded'} • {rx?.patientGender || 'Gender not recorded'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metaLabel}>VERIFICATION CODE</Text>
              <Text style={styles.verifiedCodeText}>{rx?.verificationCode || 'Code not provided'}</Text>
            </View>
          </View>
        </View>

        {/* 3. Chief Complaints & Presenting Symptoms */}
        {(rx?.chiefComplaint || (rx?.symptoms && rx.symptoms.length > 0)) && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <AlertCircle size={18} color={colors.primary} />
              <Text style={styles.sectionHeaderTitle}>Chief Complaints & Symptoms</Text>
            </View>
            {rx.symptoms && rx.symptoms.length > 0 && (
              <View style={styles.tagsContainer}>
                {rx.symptoms.map((s, idx) => (
                  <View key={idx} style={styles.symptomTag}>
                    <Text style={styles.symptomTagText}>{s}</Text>
                  </View>
                ))}
              </View>
            )}
            {rx.chiefComplaint ? (
              <Text style={styles.bodyText}>{rx.chiefComplaint}</Text>
            ) : null}
          </View>
        )}

        {/* 4. Clinical Observations & Physical Findings */}
        {rx?.observations && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Stethoscope size={18} color={colors.teal} />
              <Text style={styles.sectionHeaderTitle}>Clinical Observations & Findings</Text>
            </View>
            <Text style={styles.bodyText}>{rx.observations}</Text>
          </View>
        )}

        {/* 5. Doctor's Clinical Diagnosis */}
        {rx?.diagnosis && (
          <View style={styles.diagnosisBox}>
            <Text style={styles.diagnosisLabel}>CLINICAL DIAGNOSIS</Text>
            <Text style={styles.diagnosisText}>{rx.diagnosis}</Text>
          </View>
        )}

        {/* 6. Recorded Clinical Vitals */}
        {rx?.vitals && (
          <View
            style={[
              styles.diagnosisBox,
              {
                backgroundColor: isDark ? 'rgba(56, 189, 248, 0.08)' : '#F0F9FF',
                borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#BAE6FD',
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Activity size={16} color={colors.primary} />
              <Text style={[styles.sectionHeaderTitle, { color: colors.primary }]}>
                Recorded Clinical Vitals
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {(rx.vitals.bpSystolic && rx.vitals.bpDiastolic) || rx.vitals.bp ? (
                <View style={styles.vitalBadge}>
                  <Text style={styles.vitalBadgeLabel}>BP</Text>
                  <Text style={styles.vitalBadgeValue}>
                    {rx.vitals.bpSystolic
                      ? `${rx.vitals.bpSystolic}/${rx.vitals.bpDiastolic} mmHg`
                      : rx.vitals.bp}
                  </Text>
                </View>
              ) : null}
              {rx.vitals.pulse ? (
                <View style={styles.vitalBadge}>
                  <Text style={styles.vitalBadgeLabel}>PULSE</Text>
                  <Text style={styles.vitalBadgeValue}>{rx.vitals.pulse} bpm</Text>
                </View>
              ) : null}
              {rx.vitals.temp ? (
                <View style={styles.vitalBadge}>
                  <Text style={styles.vitalBadgeLabel}>TEMP</Text>
                  <Text style={styles.vitalBadgeValue}>{rx.vitals.temp}°F</Text>
                </View>
              ) : null}
              {rx.vitals.spo2 ? (
                <View style={styles.vitalBadge}>
                  <Text style={styles.vitalBadgeLabel}>SPO2</Text>
                  <Text style={styles.vitalBadgeValue}>{rx.vitals.spo2}%</Text>
                </View>
              ) : null}
              {rx.vitals.weight ? (
                <View style={styles.vitalBadge}>
                  <Text style={styles.vitalBadgeLabel}>WEIGHT</Text>
                  <Text style={styles.vitalBadgeValue}>{rx.vitals.weight} kg</Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* 7. Prescribed Medications */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Pill size={18} color={colors.teal} />
            <Text style={styles.sectionHeaderTitle}>
              Prescribed Medications ({rx?.medicines?.length || 0})
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            {rx?.medicines && rx.medicines.length > 0 ? (
              rx.medicines.map((med, index) => (
                <View key={med.id || index} style={styles.medicineCard}>
                  <View style={styles.medTopRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.medName}>{med.name}</Text>
                      <Text style={styles.medDosage}>Dosage: {med.dosage || 'Not recorded'}</Text>
                    </View>
                    <View style={styles.frequencyPill}>
                      <Text style={styles.frequencyText}>{med.frequency || 'Frequency not recorded'}</Text>
                    </View>
                  </View>

                  <View style={styles.medBottomRow}>
                    <View style={styles.detailBadge}>
                      <Clock size={12} color={colors.textSecondary} />
                      <Text style={styles.detailBadgeText}>{med.durationDays !== undefined && med.durationDays > 0 ? `${med.durationDays} Days Duration` : 'Duration not recorded'}</Text>
                    </View>
                  </View>

                  {med.instructions ? (
                    <View style={styles.instructionsBox}>
                      <Text style={styles.instructionsLabel}>TIMING & INSTRUCTIONS:</Text>
                      <Text style={styles.instructionsText}>{med.instructions}</Text>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <View style={styles.medicineCard}>
                <Text style={styles.bodyText}>No medications recorded.</Text>
              </View>
            )}
          </View>
        </View>

        {/* 8. Diagnostic Investigations */}
        {rx?.tests && rx.tests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Activity size={18} color={colors.primary} />
              <Text style={styles.sectionHeaderTitle}>
                Recommended Health Tests ({rx.tests.length})
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              {rx.tests.map((test, index) => (
                <View key={index} style={styles.testCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.testName}>{test.name}</Text>
                    <Text style={styles.testCategory}>{test.category || 'Diagnostic Investigation'}</Text>
                  </View>
                  {test.fastingRequired !== undefined && <View
                    style={[
                      styles.fastingPill,
                      test.fastingRequired
                        ? { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' }
                        : { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.fastingText,
                        test.fastingRequired ? { color: '#B91C1C' } : { color: '#047857' },
                      ]}
                    >
                      {test.fastingRequired ? 'Fasting required' : 'Fasting not required'}
                    </Text>
                  </View>}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 9. Lifestyle & Dietary Directions */}
        {rx?.lifestyleInstructions && rx.lifestyleInstructions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Sparkles size={18} color={colors.teal} />
              <Text style={styles.sectionHeaderTitle}>
                Lifestyle & Dietary Instructions ({rx.lifestyleInstructions.length})
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              {rx.lifestyleInstructions.map((instruction, index) => (
                <View
                  key={index}
                  style={[
                    styles.testCard,
                    { borderColor: isDark ? 'rgba(45, 212, 191, 0.25)' : '#99F6E4' },
                  ]}
                >
                  <Text style={[styles.testName, { color: colors.text, fontSize: 13, lineHeight: 19 }]}>
                    • {instruction}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 10. Emergency Warnings / Red Flags */}
        {rx?.emergencyWarning && (
          <View style={styles.emergencyBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#DC2626" />
              <Text style={styles.emergencyTitle}>EMERGENCY WARNINGS / RED FLAGS</Text>
            </View>
            <Text style={styles.emergencyText}>{rx.emergencyWarning}</Text>
          </View>
        )}

        {/* 11. Doctor's Advice & Next Steps */}
        <View style={styles.adviceBox}>
          <Text style={styles.adviceTitle}>Doctor's Advice & Care Plan</Text>
          <Text style={styles.adviceText}>
            {rx?.doctorNotes || 'Doctor advice not recorded.'}
          </Text>
          <View style={styles.followUpRow}>
            <Calendar size={14} color={colors.primary} />
            <Text style={styles.followUpText}>
              Follow-up: {rx?.followUpInstructions || 'Not recorded'}
            </Text>
          </View>
        </View>

        {/* 12. Record reference (not a signature or verification claim) */}
        <View style={styles.sealCard}>
          <FileText size={22} color={colors.teal} />
          <View style={{ flex: 1 }}>
            <Text style={styles.sealTitle}>Prescription record</Text>
            <Text style={styles.sealSub}>
              {rx?.consultationId ? `Consultation ID: ${rx.consultationId}` : `Prescription ID: ${rx?.id}`}{rx?.verificationCode ? ` • Record code: ${rx.verificationCode}` : ''}
            </Text>
            <Text style={styles.sealSub}>Record date: {rx?.createdAt || 'Not recorded'}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={handleDownloadPDF}
            activeOpacity={0.88}
            style={styles.downloadBtn}
          >
            <Download size={18} color="#FFFFFF" />
            <Text style={styles.downloadBtnText}>Open Prescription PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.8}
            style={styles.shareBtn}
          >
            <Share2 size={18} color={colors.text} />
            <Text style={styles.shareBtnText}>Share Document</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = (colors: ReturnType<typeof useAppTheme>['colors'], isDark: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: 12,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.backgroundElement : colors.surfaceContainer,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    headerSub: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 1,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? colors.backgroundElement : colors.surfaceContainer,
      borderWidth: 1,
      borderColor: colors.border,
    },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: 50,
      gap: Spacing.lg,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    toastBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(118, 244, 224, 0.15)' : Palette.healthcareTealLight,
      padding: Spacing.md,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(118, 244, 224, 0.3)' : Palette.healthcareTealBorder,
      gap: 8,
    },
    toastText: {
      fontSize: 13,
      fontWeight: '700',
      color: StitchColors.secondaryContainer,
    },
    // CLINIC LETTERHEAD - authoritative medical slate design
    letterhead: {
      backgroundColor: '#0F172A',
      borderRadius: BorderRadius['2xl'],
      padding: Spacing.lg + 2,
      borderWidth: 1,
      borderColor: '#1E293B',
      ...Shadows.card,
    },
    letterheadTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    clinicName: {
      fontSize: 11,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      color: '#2DD4BF', // Bright medical teal
    },
    doctorName: {
      fontSize: 20,
      fontWeight: '800',
      color: '#FFFFFF', // High-contrast crisp white
      marginTop: 4,
    },
    doctorSpecialty: {
      fontSize: 13,
      fontWeight: '600',
      color: '#93C5FD', // Clear ice-blue
      marginTop: 2,
    },
    doctorQualifications: {
      fontSize: 11,
      fontWeight: '500',
      color: '#CBD5E1',
      marginTop: 2,
    },
    mciBadge: {
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(45, 212, 191, 0.15)',
      borderColor: 'rgba(45, 212, 191, 0.4)',
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginTop: 6,
    },
    mciBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#5EEAD4',
      letterSpacing: 0.4,
    },
    clinicAddress: {
      fontSize: 12,
      color: '#94A3B8',
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: '#334155',
      lineHeight: 18,
    },
    rxBadge: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: '#0D9488',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: '#2DD4BF',
    },
    rxBadgeText: {
      fontSize: 20,
      fontWeight: '900',
      fontStyle: 'italic',
      color: '#FFFFFF',
    },
    // PATIENT META
    metaCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      ...Shadows.subtle,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metaRowBorder: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    metaLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.5,
    },
    metaValue: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginTop: 3,
    },
    metaValueSub: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: 3,
    },
    verifiedCodeText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.teal,
      marginTop: 3,
    },
    // CLINICAL SECTION CARDS
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 10,
      ...Shadows.subtle,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    symptomTag: {
      backgroundColor: isDark ? 'rgba(20, 80, 163, 0.25)' : '#EFF6FF',
      borderColor: isDark ? 'rgba(20, 80, 163, 0.4)' : '#BFDBFE',
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
    },
    symptomTagText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    bodyText: {
      fontSize: 14,
      lineHeight: 21,
      color: colors.text,
    },
    diagnosisBox: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
      ...Shadows.subtle,
    },
    diagnosisLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.6,
    },
    diagnosisText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 22,
    },
    vitalBadge: {
      backgroundColor: colors.card,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    vitalBadgeLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '700',
    },
    vitalBadgeValue: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
    },
    section: {
      gap: 10,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sectionHeaderTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    // MEDICINE CARDS
    medicineCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.md + 2,
      borderWidth: 1,
      borderColor: colors.border,
      ...Shadows.subtle,
      gap: 8,
    },
    medTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 10,
    },
    medName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    medDosage: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    frequencyPill: {
      backgroundColor: isDark ? 'rgba(0, 168, 150, 0.2)' : colors.teal + '15',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.md,
      borderWidth: 0.5,
      borderColor: isDark ? 'rgba(0, 168, 150, 0.4)' : colors.teal + '30',
    },
    frequencyText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.teal,
    },
    medBottomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surfaceContainerLow,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
    },
    detailBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    instructionsBox: {
      backgroundColor: colors.surfaceContainerLow,
      padding: 10,
      borderRadius: BorderRadius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    instructionsLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.textMuted,
      letterSpacing: 0.4,
    },
    instructionsText: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.text,
      marginTop: 2,
      fontWeight: '500',
    },
    testCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    testName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    testCategory: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    fastingPill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
    },
    fastingText: {
      fontSize: 11,
      fontWeight: '700',
    },
    // EMERGENCY WARNING BOX
    emergencyBox: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
      gap: 8,
    },
    emergencyTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: '#DC2626',
      letterSpacing: 0.6,
    },
    emergencyText: {
      fontSize: 13,
      lineHeight: 20,
      color: isDark ? '#FCA5A5' : '#991B1B',
      fontWeight: '600',
    },
    adviceBox: {
      backgroundColor: isDark ? 'rgba(20, 80, 163, 0.2)' : colors.primary + '15',
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(20, 80, 163, 0.3)' : colors.primary + '30',
      gap: 8,
    },
    adviceTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    adviceText: {
      fontSize: 13,
      lineHeight: 20,
      color: colors.text,
    },
    followUpRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    followUpText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
    },
    sealCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.md + 2,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    sealTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    sealSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    actionsContainer: {
      gap: 10,
      marginTop: 6,
    },
    downloadBtn: {
      height: 52,
      borderRadius: 16,
      backgroundColor: StitchColors.primaryContainer,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    downloadBtnText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    shareBtn: {
      height: 48,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    shareBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
  });
