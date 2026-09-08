import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useHealthStore } from '@/store/useHealthStore';
import { useAppTheme } from '@/hooks/useAppTheme';
import { StitchColors, BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { LabReport, LabParameter } from '@/types/index';
import {
  FileText,
  Search,
  Plus,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  X,
  Building2,
  Calendar,
  Activity,
  ChevronRight,
  ShieldCheck,
  Filter,
} from 'lucide-react-native';

interface LabRecordsTabProps {
  patientId?: string;
  patientName?: string;
}

const CATEGORIES = ['All', 'Hematology', 'Lipid Panel', 'Biochemistry', 'Thyroid', 'Urine'];

export function LabRecordsTab({ patientId, patientName }: LabRecordsTabProps) {
  const { colors } = useAppTheme();
  const { labReports, addLabReport } = useHealthStore();

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  // New report form state
  const [newTestName, setNewTestName] = useState('');
  const [newLabName, setNewLabName] = useState('SRL Diagnostics');
  const [newCategory, setNewCategory] = useState<LabReport['category']>('Hematology');
  const [newDoctor, setNewDoctor] = useState('Dr. Rajesh Sharma');
  const [newSummary, setNewSummary] = useState('');

  const filteredReports = useMemo(() => {
    return labReports.filter((rep) => {
      const matchCat = selectedCategory === 'All' || rep.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchQuery =
        !searchQuery.trim() ||
        rep.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.labName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.parameters.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [labReports, selectedCategory, searchQuery]);

  const handleCreateReport = () => {
    if (!newTestName.trim()) {
      if (Platform.OS === 'web') {
        alert('Please enter test name');
      } else {
        Alert.alert('Required', 'Please enter a test panel name.');
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const created: LabReport = {
      id: `lab_${Date.now()}`,
      patientId: patientId || 'patient_default',
      patientName: patientName || 'Rahul Verma',
      testName: newTestName.trim(),
      category: newCategory,
      labName: newLabName.trim() || 'Verified Diagnostic Lab',
      collectedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      reportedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Normal',
      doctorReferred: newDoctor.trim() || undefined,
      summary: newSummary.trim() || 'Patient uploaded lab results verified by lab technician.',
      fileName: `${newTestName.replace(/\s+/g, '_')}_Report.pdf`,
      fileSize: '1.1 MB',
      parameters: [
        { name: `${newTestName} Primary Marker`, value: 'Normal', unit: 'Index', referenceRange: 'Negative / Within Limits' },
      ],
    };

    addLabReport(created);
    setNewTestName('');
    setNewSummary('');
    setUploadModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Search & Actions Bar */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <Search size={16} color={colors.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search blood test, HbA1c, lipid..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
              <X size={15} color={colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => setUploadModalVisible(true)}
          style={[styles.addReportBtn, { backgroundColor: StitchColors.primaryContainer }]}
        >
          <Plus size={15} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.addReportBtnText}>Add Lab</Text>
        </Pressable>
      </View>

      {/* Category Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryChip,
                { backgroundColor: isActive ? StitchColors.primaryContainer : colors.backgroundElement },
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  { color: isActive ? '#ffffff' : colors.textSecondary },
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Reports List */}
      {filteredReports.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Activity size={36} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Lab Reports Found</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            {searchQuery ? 'Try adjusting your search terms.' : 'Upload your first diagnostic test report or blood panel.'}
          </Text>
          <Pressable
            onPress={() => setUploadModalVisible(true)}
            style={[styles.emptyAddBtn, { backgroundColor: StitchColors.primaryContainer }]}
          >
            <Plus size={15} color="#ffffff" />
            <Text style={styles.emptyAddBtnText}>Upload Lab Report</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.reportsGrid}>
          {filteredReports.map((report) => (
            <Pressable
              key={report.id}
              onPress={() => setSelectedReport(report)}
              style={({ pressed }) => [
                styles.reportCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { opacity: 0.92 },
              ]}
            >
              {/* Card Header */}
              <View style={styles.reportCardHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={styles.reportTagRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: '#EFF6FF' }]}>
                      <Text style={styles.categoryBadgeText}>{report.category}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#ECFDF5' }]}>
                      <CheckCircle2 size={11} color="#047857" />
                      <Text style={styles.statusBadgeText}>{report.status}</Text>
                    </View>
                  </View>
                  <Text style={[styles.testName, { color: colors.text }]} numberOfLines={1}>
                    {report.testName}
                  </Text>
                  <View style={styles.metaRow}>
                    <Building2 size={12} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {report.labName}
                    </Text>
                    <Text style={styles.metaDot}>•</Text>
                    <Calendar size={12} color={colors.textSecondary} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                      {report.reportedDate}
                    </Text>
                  </View>
                </View>

                <View style={[styles.iconCircle, { backgroundColor: colors.backgroundElement }]}>
                  <FileText size={18} color={StitchColors.primaryContainer} />
                </View>
              </View>

              {/* Parameter Preview Chips */}
              <View style={styles.paramPreviewBox}>
                {report.parameters.slice(0, 3).map((param, pIdx) => (
                  <View key={pIdx} style={[styles.paramPill, { backgroundColor: colors.backgroundElement }]}>
                    <Text style={[styles.paramLabel, { color: colors.textSecondary }]}>{param.name}:</Text>
                    <Text style={[styles.paramVal, { color: colors.text }]}>
                      {param.value} {param.unit}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Bottom Details Footer */}
              <View style={[styles.reportCardFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.footerRefText, { color: colors.textSecondary }]} numberOfLines={1}>
                  Ref: {report.doctorReferred || 'Self Registered'}
                </Text>
                <View style={styles.viewResultLink}>
                  <Text style={styles.viewResultText}>View Results</Text>
                  <ChevronRight size={13} color={StitchColors.primaryContainer} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* DETAIL MODAL: Lab Report Parameter Breakdown */}
      {selectedReport && (
        <Modal visible={Boolean(selectedReport)} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Modal Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>
                    {selectedReport.testName}
                  </Text>
                  <Text style={[styles.modalHeaderSub, { color: colors.textSecondary }]}>
                    {selectedReport.labName} • Reported on {selectedReport.reportedDate}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedReport(null)}
                  style={[styles.closeBtn, { backgroundColor: colors.backgroundElement }]}
                >
                  <X size={18} color={colors.text} />
                </Pressable>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Summary Alert */}
                {selectedReport.summary ? (
                  <View style={[styles.summaryAlert, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                    <ShieldCheck size={16} color={StitchColors.primaryContainer} />
                    <Text style={[styles.summaryAlertText, { color: StitchColors.primary }]}>
                      {selectedReport.summary}
                    </Text>
                  </View>
                ) : null}

                {/* Parameters Table */}
                <Text style={[styles.tableHeading, { color: colors.text }]}>DIAGNOSTIC TEST PARAMETERS</Text>

                <View style={[styles.paramsTable, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  {selectedReport.parameters.map((p, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.tableRow,
                        idx > 0 && { borderTopWidth: 1, borderTopColor: colors.border },
                      ]}
                    >
                      <View style={{ flex: 2 }}>
                        <Text style={[styles.tableParamName, { color: colors.text }]}>{p.name}</Text>
                        <Text style={[styles.tableRefRange, { color: colors.textSecondary }]}>
                          Ref Range: {p.referenceRange}
                        </Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={[styles.tableParamValue, { color: StitchColors.primaryContainer }]}>
                          {p.value} <Text style={styles.tableParamUnit}>{p.unit}</Text>
                        </Text>
                        <View style={[styles.inRangeTag, { backgroundColor: '#ECFDF5' }]}>
                          <Text style={styles.inRangeTagText}>Normal</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Report Attachment Info */}
                <View style={[styles.fileCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
                  <FileText size={20} color={StitchColors.primaryContainer} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                      {selectedReport.fileName || 'Diagnostic_Report.pdf'}
                    </Text>
                    <Text style={[styles.fileSize, { color: colors.textSecondary }]}>
                      {selectedReport.fileSize || '1.2 MB'} • Digital Lab Signature Verified
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        alert(`Opening official report: ${selectedReport.fileName}`);
                      } else {
                        Alert.alert('Report Download', `Downloading ${selectedReport.fileName} to device.`);
                      }
                    }}
                    style={[styles.downloadBtn, { backgroundColor: StitchColors.primaryContainer }]}
                  >
                    <Download size={14} color="#ffffff" />
                  </Pressable>
                </View>
              </ScrollView>

              {/* Modal Footer */}
              <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                <Pressable
                  onPress={() => setSelectedReport(null)}
                  style={[styles.footerCloseBtn, { backgroundColor: colors.backgroundElement }]}
                >
                  <Text style={[styles.footerCloseBtnText, { color: colors.text }]}>Close</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      alert('Sharing verified lab record link with care provider.');
                    } else {
                      Alert.alert('Share Record', 'Secure health record link ready to share with consulting doctor.');
                    }
                  }}
                  style={[styles.footerShareBtn, { backgroundColor: StitchColors.primaryContainer }]}
                >
                  <Share2 size={15} color="#ffffff" />
                  <Text style={styles.footerShareBtnText}>Share with Doctor</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* UPLOAD MODAL: Add New Diagnostic Report */}
      <Modal visible={uploadModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>Add New Lab Report</Text>
              <Pressable
                onPress={() => setUploadModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: colors.backgroundElement }]}
              >
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Test Panel / Investigation Name *</Text>
                <TextInput
                  value={newTestName}
                  onChangeText={setNewTestName}
                  placeholder="e.g. Thyroid Profile Total (T3, T4, TSH)"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement }]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {(['Hematology', 'Biochemistry', 'Lipid Panel', 'Thyroid', 'Urine'] as const).map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setNewCategory(cat)}
                      style={[
                        styles.categorySelectChip,
                        { backgroundColor: newCategory === cat ? StitchColors.primaryContainer : colors.backgroundElement },
                      ]}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '600', color: newCategory === cat ? '#ffffff' : colors.textSecondary }}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Diagnostic Laboratory Name</Text>
                <TextInput
                  value={newLabName}
                  onChangeText={setNewLabName}
                  placeholder="e.g. SRL Diagnostics, Dr. Lal PathLabs"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement }]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Referring Doctor</Text>
                <TextInput
                  value={newDoctor}
                  onChangeText={setNewDoctor}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  placeholderTextColor={colors.textSecondary}
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement }]}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Report Findings / Summary</Text>
                <TextInput
                  value={newSummary}
                  onChangeText={setNewSummary}
                  placeholder="Brief diagnostic notes (e.g. Normal TSH levels confirmed)"
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={2}
                  style={[styles.modalInput, { height: 64, textAlignVertical: 'top', color: colors.text, borderColor: colors.border, backgroundColor: colors.backgroundElement }]}
                />
              </View>
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Pressable
                onPress={() => setUploadModalVisible(false)}
                style={[styles.footerCloseBtn, { backgroundColor: colors.backgroundElement }]}
              >
                <Text style={[styles.footerCloseBtnText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateReport}
                style={[styles.footerShareBtn, { backgroundColor: StitchColors.primaryContainer }]}
              >
                <Plus size={15} color="#ffffff" />
                <Text style={styles.footerShareBtnText}>Save Lab Report</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  addReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
  },
  addReportBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  categoryScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    gap: 8,
    marginTop: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 260,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    marginTop: 6,
  },
  emptyAddBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  reportsGrid: {
    gap: 10,
  },
  reportCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    ...Shadows.subtle,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  reportTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
  },
  testName: {
    fontSize: 15,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
  },
  metaDot: {
    color: '#94a3b8',
    fontSize: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paramPreviewBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  paramPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  paramLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  paramVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  reportCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  footerRefText: {
    fontSize: 11,
  },
  viewResultLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewResultText: {
    fontSize: 12,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalHeaderSub: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 16,
  },
  summaryAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: 14,
  },
  summaryAlertText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  tableHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  paramsTable: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 8,
    marginBottom: 14,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableParamName: {
    fontSize: 13,
    fontWeight: '600',
  },
  tableRefRange: {
    fontSize: 10.5,
    marginTop: 1,
  },
  tableParamValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  tableParamUnit: {
    fontSize: 11,
    fontWeight: '500',
  },
  inRangeTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  inRangeTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#047857',
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '600',
  },
  fileSize: {
    fontSize: 11,
    marginTop: 1,
  },
  downloadBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  footerCloseBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerCloseBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footerShareBtn: {
    flex: 2,
    height: 44,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerShareBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 12,
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalInput: {
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  categorySelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
});
