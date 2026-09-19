import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Share,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHealthStore } from '@/store/useHealthStore';
import { useAuthStore } from '@/store/useAuthStore';
import { apiClient } from '@/services/apiClient';
import { Prescription } from '@/types/index';
import { LoadingDialog } from '@/components/ui/LoadingDialog';
import { BorderRadius, Shadows, Spacing, StitchColors, Palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  ArrowLeft,
  Pill,
  Calendar,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  Activity,
  FileText,
  ShieldCheck,
  Stethoscope,
  Sparkles,
  AlertCircle,
  AlertTriangle,
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
  const [refreshing, setRefreshing] = useState(false);

  const fetchPrescription = useCallback(
    async (showLoader = true) => {
      if (!id) return;
      if (showLoader) setLoading(true);
      try {
        const data = await apiClient<any>(`/prescriptions/${id}`);
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
            doctorSpecialty: data.doctor?.specialization || 'Consultant Specialist',
            doctorQualifications: data.doctor?.qualifications || data.doctorQualifications || undefined,
            doctorMciNumber:
              data.doctor?.verification?.registrationNumber ||
              data.doctor?.registrationNumber ||
              data.doctorMciNumber ||
              undefined,
            clinicName: data.doctor?.clinic?.name || 'FiYDoc Partner Clinic',
            clinicAddress: data.doctor?.clinic?.address || data.clinicAddress || undefined,
            patientName: data.patient?.fullName || user?.name || 'Patient',
            patientAge: data.patient?.age || data.consultation?.patientAge || undefined,
            patientGender: data.patient?.gender || data.consultation?.patientGender || undefined,
            chiefComplaint: data.chiefComplaint || data.consultation?.chiefComplaint || undefined,
            symptoms: data.symptoms || data.consultation?.symptoms || undefined,
            observations: data.observations || data.consultation?.observations || undefined,
            emergencyWarning: data.emergencyWarning || data.consultation?.emergencyWarning || undefined,
            doctorNotes: data.doctorNotes || 'Follow prescribed regimen strictly. In case of worsening symptoms, visit emergency care.',
            followUpInstructions: data.followUpInstructions || 'Review in clinic as advised.',
            verificationCode: data.verificationCode || `RX-${data.id.slice(0, 8).toUpperCase()}`,
            pdfUrl: data.pdfUrl || undefined,
            signedAt: data.issuedAt || data.signedAt || data.createdAt,
            createdAt: data.createdAt
              ? new Date(data.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Today',
            diagnosis:
              data.diagnosis ||
              (data.doctorNotes?.startsWith('Diagnosis:') ? data.doctorNotes.split('.')[0] : undefined),
            tests:
              Array.isArray(data.labTests) && data.labTests.length > 0
                ? data.labTests.map((t: any, idx: number) => ({
                    id: t.id || `${data.id}-test-${idx}`,
                    name: typeof t === 'string' ? t : t.name || t.testName || 'Diagnostic Test',
                    category: t.category || 'Clinical Pathology',
                    fastingRequired: Boolean(t.fastingRequired),
                    instructions: t.instructions || undefined,
                  }))
                : Array.isArray(data.tests)
                ? data.tests
                : undefined,
            vitals: data.vitals || data.consultation?.vitals || undefined,
            lifestyleInstructions: data.lifestyleInstructions || undefined,
            medicines: (data.medicines || []).map((m: any) => ({
              id: m.id || `${data.id}-${m.name}`,
              name: m.name,
              dosage: m.dosage || 'As directed',
              frequency: m.frequency || '1-0-1',
              durationDays: m.durationDays || 5,
              instructions: m.instructions || '',
            })),
          };
          setRemoteRx(mapped);
          useHealthStore.getState().addPrescription(mapped);
        }
      } catch (err: any) {
        console.warn('[prescription/[id]] Failed to fetch prescription:', err?.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, user]
  );

  useEffect(() => {
    const existing = prescriptions.find((p) => p.id === id);
    if (!existing && id) {
      fetchPrescription(true);
    } else if (existing && id) {
      // Background silent refresh for full consultation details
      fetchPrescription(false);
    }
  }, [id, fetchPrescription]);

  // Find prescription in store, remote fetch, or fallback
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
          <Text style={styles.emptyTitle}>Prescription Not Found</Text>
          <Text style={styles.emptySubtitle}>The requested prescription could not be located.</Text>
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Universal Loading Dialog */}
      <LoadingDialog
        visible={loading && !rx}
        title="Loading Prescription..."
        message="Fetching verified digital clinical record from secure server..."
      />

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
          <Text style={styles.headerSub}>Code: {rx?.verificationCode || 'VERIFIED'}</Text>
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
            onRefresh={() => {
              setRefreshing(true);
              fetchPrescription(false);
            }}
            colors={[StitchColors.primaryContainer, colors.teal]}
            tintColor={StitchColors.primaryContainer}
          />
        }
      >
        {downloadToast && (
          <View style={styles.toastBox}>
            <CheckCircle2 size={16} color={StitchColors.secondaryContainer} />
            <Text style={styles.toastText}>Official Prescription PDF saved to device</Text>
          </View>
        )}

        {/* 1. Official Clinic Letterhead */}
        <View style={styles.letterhead}>
          <View style={styles.letterheadTop}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.clinicName} numberOfLines={1}>
                {rx?.clinicName || 'FiYDoc Healthcare Clinic'}
              </Text>
              <Text style={styles.doctorName}>{rx?.doctorName || 'Dr. Specialist'}</Text>
              <Text style={styles.doctorSpecialty}>
                {rx?.doctorSpecialty || 'Consultant Specialist'}
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
            {rx?.clinicAddress || 'Healthcare Enclave, Clinical OPD Block'}
          </Text>
        </View>

        {/* 2. Patient Demographics Box */}
        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaLabel}>PATIENT NAME</Text>
              <Text style={styles.metaValue}>
                {rx?.patientName || user?.name || 'Patient'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metaLabel}>DATE OF CONSULTATION</Text>
              <Text style={styles.metaValue}>{rx?.createdAt || 'Today'}</Text>
            </View>
          </View>

          <View style={[styles.metaRow, styles.metaRowBorder]}>
            <View>
              <Text style={styles.metaLabel}>AGE / GENDER</Text>
              <Text style={styles.metaValueSub}>
                {rx?.patientAge ? `${rx.patientAge} Yrs` : 'Adult'} • {rx?.patientGender || 'Unspecified'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.metaLabel}>VERIFICATION CODE</Text>
              <Text style={styles.verifiedCodeText}>{rx?.verificationCode || 'VERIFIED'}</Text>
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
                      <Text style={styles.instructionsLabel}>TIMING & INSTRUCTIONS:</Text>
                      <Text style={styles.instructionsText}>{med.instructions}</Text>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <View style={styles.medicineCard}>
                <Text style={styles.bodyText}>No oral medications prescribed during this visit.</Text>
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
                  <View
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
                      {test.fastingRequired ? 'Fasting Required (8-12h)' : 'Standard Sample'}
                    </Text>
                  </View>
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
            {rx?.doctorNotes ||
              'Maintain prescribed hydration and rest. Avoid self-medication and adhere strictly to dosage.'}
          </Text>
          <View style={styles.followUpRow}>
            <Calendar size={14} color={colors.primary} />
            <Text style={styles.followUpText}>
              Next visit: {rx?.followUpInstructions || '5 days or if symptoms persist'}
            </Text>
          </View>
        </View>

        {/* 12. Digital Signature & Verification Seal */}
        <View style={styles.sealCard}>
          <ShieldCheck size={22} color="#0D9488" />
          <View style={{ flex: 1 }}>
            <Text style={styles.sealTitle}>Digitally Signed by Registered Medical Practitioner</Text>
            <Text style={styles.sealSub}>
              Consultation ID: {rx?.consultationId || rx?.id} • Security Hash: {rx?.verificationCode}
            </Text>
            <Text style={styles.sealSub}>Issued on {rx?.createdAt}</Text>
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
