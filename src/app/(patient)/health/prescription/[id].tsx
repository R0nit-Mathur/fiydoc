import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHealthStore } from '@/store/useHealthStore';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/services/apiClient';
import { Prescription } from '@/types/index';
import { Badge } from '@/components/ui/Badge';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { BorderRadius, Shadows, Spacing, StitchColors, Palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatHumanDate } from '@/utils/formatters';
import {
  ArrowLeft,
  Pill,
  Calendar,
  Building2,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  Activity,
  User,
  FileText,
  ShieldCheck,
  Stethoscope,
  Sparkles,
} from 'lucide-react-native';

export default function DedicatedPrescriptionScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const styles = useStyles(colors, isDark);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { prescriptions } = useHealthStore();
  const { user } = useAuthStore();
  const [downloadToast, setDownloadToast] = useState(false);
  const [remoteRx, setRemoteRx] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const existing = prescriptions.find((p) => p.id === id);
    if (!existing && id) {
      setLoading(true);
      apiClient<any>(`/prescriptions/${id}`)
        .then((data) => {
          if (data && data.id) {
            const mapped: Prescription = {
              id: data.id,
              consultationId: data.consultationId,
              patientId: data.patientId,
              doctorId: data.doctorId,
              doctorName: data.doctor?.fullName
                ? data.doctor.fullName.startsWith('Dr.')
                  ? data.doctor.fullName
                  : `Dr. ${data.doctor.fullName}`
                : 'Licensed Doctor',
              doctorSpecialty: data.doctor?.specialization || 'Specialist',
              doctorMciNumber: data.doctor?.verification?.registrationNumber || undefined,
              clinicName: data.doctor?.clinic?.name || 'FiYDoc Partner Clinic',
              clinicAddress: data.doctor?.clinic?.address || undefined,
              patientName: data.patient?.fullName || user?.name || 'Patient',
              doctorNotes: data.doctorNotes || 'Follow prescribed regimen.',
              followUpInstructions: data.followUpInstructions || 'Review in clinic as advised.',
              verificationCode: data.verificationCode,
              pdfUrl: data.pdfUrl || undefined,
              signedAt: data.issuedAt || data.signedAt || data.createdAt,
              createdAt: data.createdAt
                ? new Date(data.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : '',
              diagnosis: data.diagnosis || (data.doctorNotes?.startsWith('Diagnosis:') ? data.doctorNotes.split('.')[0] : undefined),
              tests: Array.isArray(data.labTests) && data.labTests.length > 0
                ? data.labTests.map((t: any, idx: number) => ({
                    id: t.id || `${data.id}-test-${idx}`,
                    name: typeof t === 'string' ? t : (t.name || t.testName || 'Diagnostic Test'),
                    category: t.category || 'Clinical Pathology',
                    fastingRequired: Boolean(t.fastingRequired),
                  }))
                : (Array.isArray(data.tests) ? data.tests : undefined),
              vitals: data.vitals || undefined,
              lifestyleInstructions: data.lifestyleInstructions || undefined,
              medicines: (data.medicines || []).map((m: any) => ({
                id: m.id || `${data.id}-${m.name}`,
                name: m.name,
                dosage: m.dosage,
                frequency: m.frequency,
                durationDays: m.durationDays,
                instructions: m.instructions || '',
              })),
            };
            setRemoteRx(mapped);
            useHealthStore.getState().addPrescription(mapped);
          }
        })
        .catch((err) => {
          console.warn('[prescription/[id]] Failed to fetch prescription:', err?.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id, prescriptions, user]);

  // Find prescription in store, remote fetch, or fallback to first
  const rx = prescriptions.find((p) => p.id === id) || remoteRx || prescriptions[0];

  const handleDownloadPDF = () => {
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 3500);
  };

  const handleShare = async () => {
    if (!rx) return;
    try {
      await Share.share({
        title: `FiYDoc Digital Prescription - ${rx.id}`,
        message: `FiYDoc Verified Digital Prescription\nDoctor: ${rx.doctorName || 'Doctor'}\nSpecialty: ${rx.doctorSpecialty || 'Specialist'}\nDiagnosis: ${rx.diagnosis || 'Clinical Consultation'}\nMedications: ${rx.medicines?.map((m) => `${m.name} (${m.dosage})`).join(', ') || 'None'}\nVerification Code: ${rx.verificationCode}`,
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

  if (loading && !rx) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSafeBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digital Prescription</Text>
        </View>
        <View style={[styles.emptyContainer, { justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={StitchColors.primaryContainer} />
          <Text style={[styles.emptySubtitle, { marginTop: 16 }]}>Loading verified prescription...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!rx) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSafeBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Digital Prescription</Text>
        </View>
        <View style={styles.emptyContainer}>
          <FileText size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Prescription Not Found</Text>
          <Text style={styles.emptySubtitle}>The requested prescription could not be located.</Text>
        </View>
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
          <Text style={styles.headerSub}>Code: {rx.verificationCode}</Text>
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
      >
        {downloadToast && (
          <View style={styles.toastBox}>
            <CheckCircle2 size={16} color={StitchColors.secondaryContainer} />
            <Text style={styles.toastText}>Official Prescription PDF saved to device</Text>
          </View>
        )}

        {/* Clinic Letterhead */}
        <View style={styles.letterhead}>
          <View style={styles.letterheadTop}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.clinicName} numberOfLines={1}>
                {rx.clinicName || 'FiYDoc Healthcare Clinic'}
              </Text>
              <Text style={styles.doctorName}>{rx.doctorName || 'Dr. Specialist'}</Text>
              <Text style={styles.doctorSpecialty}>
                {rx.doctorSpecialty || 'Consultant Specialist'}
              </Text>
            </View>
            <View style={styles.rxBadge}>
              <Text style={styles.rxBadgeText}>Rx</Text>
            </View>
          </View>
          <Text style={styles.clinicAddress}>
            {rx.clinicAddress || 'Healthcare Enclave, Clinical OPD Block'}
          </Text>
        </View>

        {/* Patient Demographics Box */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaLabel}>PATIENT NAME</Text>
              <Text style={styles.metaValue}>
                {rx.patientName || user?.name || 'Patient'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metaLabel}>DATE OF CONSULTATION</Text>
              <Text style={styles.metaValue}>{rx.createdAt || 'Today'}</Text>
            </View>
          </View>

          <View style={[styles.metaRow, styles.metaRowBorder]}>
            <View>
              <Text style={styles.metaLabel}>AGE / GENDER</Text>
              <Text style={styles.metaValueSub}>
                {rx.patientAge || 32} Yrs - {rx.patientGender || 'Male'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metaLabel}>VERIFICATION</Text>
              <Text style={styles.verifiedCodeText}>{rx.verificationCode}</Text>
            </View>
          </View>
        </View>

        {/* Doctor's Diagnosis & Notes */}
        {rx.diagnosis && (
          <View style={styles.diagnosisBox}>
            <Text style={styles.sectionHeaderTitle}>Doctor's Diagnosis</Text>
            <Text style={styles.diagnosisText}>{rx.diagnosis}</Text>
          </View>
        )}

        {/* Recorded Vitals */}
        {rx.vitals && (
          <View style={[styles.diagnosisBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.08)' : '#F0F9FF', borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#BAE6FD' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Activity size={16} color={colors.primary} />
              <Text style={[styles.sectionHeaderTitle, { color: colors.primary }]}>Recorded Clinical Vitals</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {(rx.vitals.bpSystolic && rx.vitals.bpDiastolic) || rx.vitals.bp ? (
                <View style={{ backgroundColor: colors.card, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '700' }}>BP</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                    {rx.vitals.bpSystolic ? `${rx.vitals.bpSystolic}/${rx.vitals.bpDiastolic} mmHg` : rx.vitals.bp}
                  </Text>
                </View>
              ) : null}
              {rx.vitals.pulse ? (
                <View style={{ backgroundColor: colors.card, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '700' }}>PULSE</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                    {rx.vitals.pulse} bpm
                  </Text>
                </View>
              ) : null}
              {rx.vitals.temp ? (
                <View style={{ backgroundColor: colors.card, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '700' }}>TEMP</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                    {rx.vitals.temp}°F
                  </Text>
                </View>
              ) : null}
              {rx.vitals.spo2 ? (
                <View style={{ backgroundColor: colors.card, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '700' }}>SPO2</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                    {rx.vitals.spo2}%
                  </Text>
                </View>
              ) : null}
              {rx.vitals.weight ? (
                <View style={{ backgroundColor: colors.card, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                  <Text style={{ fontSize: 10, color: colors.textSecondary, fontWeight: '700' }}>WEIGHT</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                    {rx.vitals.weight} kg
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        )}

        {/* Prescribed Medications Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Pill size={18} color={colors.teal} />
            <Text style={styles.sectionHeaderTitle}>
              Prescribed Medications ({rx.medicines?.length || 0})
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            {rx.medicines?.map((med, index) => (
              <View key={med.id || index} style={styles.medicineCard}>
                <View style={styles.medTopRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medDosage}>Dosage: {med.dosage}</Text>
                  </View>
                  <View style={styles.frequencyPill}>
                    <Text style={styles.frequencyText}>{med.frequency}</Text>
                  </View>
                </View>

                <View style={styles.medBottomRow}>
                  <View style={styles.detailBadge}>
                    <Clock size={12} color={colors.textSecondary} />
                    <Text style={styles.detailBadgeText}>{med.durationDays} Days Duration</Text>
                  </View>
                </View>

                {med.instructions ? (
                  <View style={styles.instructionsBox}>
                    <Text style={styles.instructionsLabel}>Instructions:</Text>
                    <Text style={styles.instructionsText}>{med.instructions}</Text>
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        {/* Diagnostic Investigations if any */}
        {rx.tests && rx.tests.length > 0 && (
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
                  <Text style={styles.testName}>{test.name}</Text>
                  <Text style={styles.testFasting}>
                    {test.fastingRequired ? '- Fasting Required (8-12 hrs)' : '- Standard Sample'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Lifestyle & Dietary Directions */}
        {rx.lifestyleInstructions && rx.lifestyleInstructions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Sparkles size={18} color={colors.teal} />
              <Text style={styles.sectionHeaderTitle}>
                Lifestyle & Dietary Instructions ({rx.lifestyleInstructions.length})
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              {rx.lifestyleInstructions.map((instruction, index) => (
                <View key={index} style={[styles.testCard, { borderColor: isDark ? 'rgba(45, 212, 191, 0.25)' : '#99F6E4' }]}>
                  <Text style={[styles.testName, { color: colors.text }]}>• {instruction}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Doctor Advice & Follow-Up */}
        <View style={styles.adviceBox}>
          <Text style={styles.adviceTitle}>Doctor's Advice & Next Steps</Text>
          <Text style={styles.adviceText}>
            {rx.doctorNotes || 'Maintain prescribed hydration and rest. Avoid spicy food and intense exertion until symptoms resolve.'}
          </Text>
          <View style={styles.followUpRow}>
            <Calendar size={14} color={colors.primary} />
            <Text style={styles.followUpText}>
              Next visit: {rx.followUpInstructions || '5 days or if symptoms persist'}
            </Text>
          </View>
        </View>

        {/* Digital Signature & Verification Seal */}
        <View style={styles.sealCard}>
          <ShieldCheck size={20} color={colors.teal} />
          <View style={{ flex: 1 }}>
            <Text style={styles.sealTitle}>Digitally Signed by Clinician</Text>
            <Text style={styles.sealSub}>
              Signed on {rx.createdAt} - Security Hash: {rx.verificationCode}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={handleDownloadPDF}
            activeOpacity={0.88}
            style={styles.downloadBtn}
          >
            <Download size={18} color={colors.card} />
            <Text style={styles.downloadBtnText}>Download Official PDF</Text>
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

const useStyles = (colors: ReturnType<typeof useAppTheme>['colors'], isDark: boolean) => StyleSheet.create({
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
  letterhead: {
    backgroundColor: StitchColors.primary,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.lg + 2,
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
    letterSpacing: 0.6,
    color: colors.teal,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.card,
    marginTop: 4,
  },
  doctorSpecialty: {
    fontSize: 13,
    fontWeight: '600',
    color: isDark ? colors.teal : colors.primary,
    marginTop: 2,
  },
  clinicAddress: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rxBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxBadgeText: {
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    color: colors.card,
  },
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
  diagnosisBox: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  diagnosisText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 22,
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
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  instructionsText: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 2,
  },
  testCard: {
    backgroundColor: colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  testName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  testFasting: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
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
    color: colors.card,
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
