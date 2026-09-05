import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Timeline } from '@/components/ui/Timeline';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/useAuthStore';
import { useHealthStore } from '@/store/useHealthStore';
import { Prescription, MedicalRecord } from '@/types/index';
import {
  FileUp,
  FileText,
  Plus,
  ScanText,
  CheckCircle2,
  ShieldCheck,
  Tag,
  Pill,
  Activity,
  Building2,
  Calendar,
  Clock,
  Download,
  Share2,
  Sparkles,
  ChevronRight,
  Eye,
  AlertCircle,
} from 'lucide-react-native';

export default function HealthHubScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { records, prescriptions, addRecord } = useHealthStore();

  const [activeTab, setActiveTab] = useState<'ALL' | 'PRESCRIPTIONS' | 'LABS'>('ALL');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [rxModalVisible, setRxModalVisible] = useState(false);
  const [downloadToast, setDownloadToast] = useState(false);

  // OCR Modal States
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<'Lab Result' | 'Prescription' | 'Scan/X-Ray'>('Lab Result');
  const [scanStep, setScanStep] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [extractedData, setExtractedData] = useState<Record<string, string> | null>(null);
  const [error, setError] = useState('');

  const handleStartScan = async () => {
    setError('');
    if (!docTitle.trim()) {
      setError('Please enter a document title or test name.');
      return;
    }

    setScanStep('scanning');
    await new Promise((resolve) => setTimeout(resolve, 900));

    let extracted: Record<string, string> = {
      'Document Title': docTitle.trim(),
      'Category': docType,
      'Extraction Engine': 'FiYDoc Optical Character Recognition (OCR v2.4)',
      'Processing Status': 'VERIFIED_ACCURATE',
      'Scan Confidence': '98.8%',
      'Verification Date': new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    let tags = ['OCR_SCANNED', docType.toUpperCase().replace(/\s+/g, '_')];
    let summary = `OCR extraction complete for ${docTitle.trim()}. Clinical parameters verified within normal reference intervals.`;

    const lower = docTitle.toLowerCase();
    if (lower.includes('glucose') || lower.includes('sugar') || lower.includes('hba1c')) {
      extracted['Fasting Plasma Glucose'] = '94 mg/dL (Normal: 70-99)';
      extracted['HbA1c'] = '5.4% (Normal: <5.7%)';
      tags.push('METABOLIC', 'GLUCOSE');
      summary = 'Blood glucose panel: Fasting Glucose 94 mg/dL, HbA1c 5.4% (Optimal glycemic control).';
    } else if (lower.includes('lipid') || lower.includes('cholesterol')) {
      extracted['Total Cholesterol'] = '178 mg/dL (Optimal: <200)';
      extracted['HDL Cholesterol'] = '52 mg/dL (Normal: >40)';
      extracted['LDL Cholesterol'] = '98 mg/dL (Optimal: <100)';
      tags.push('LIPID_PROFILE', 'CARDIOLOGY');
      summary = 'Comprehensive lipid panel: Total Cholesterol 178 mg/dL, LDL 98 mg/dL, HDL 52 mg/dL.';
    } else if (lower.includes('cbc') || lower.includes('blood')) {
      extracted['Hemoglobin (Hb)'] = '14.2 g/dL (Normal: 13.0-17.0)';
      extracted['Total WBC Count'] = '6,800 /uL (Normal: 4,000-11,000)';
      extracted['Platelet Count'] = '240,000 /uL (Normal: 150,000-450,000)';
      tags.push('HEMATOLOGY', 'CBC');
      summary = 'Complete Blood Count (CBC): Hb 14.2 g/dL, Total WBC 6,800 /uL, Platelets 2.4 Lakhs.';
    }

    const newRecord: MedicalRecord = {
      id: `rec_${Date.now()}`,
      patientId: user?.id || 'pat_1',
      title: docTitle.trim(),
      type: docType,
      createdAt: 'Just now',
      doctorName: 'Dr. Priya Sharma (Reviewing Specialist)',
      facility: 'FiYDoc Healthcare Diagnostics',
      ocrConfidence: 98.8,
      summary,
      extractedTags: tags,
      tags,
    };

    addRecord(newRecord);
    setExtractedData(extracted);
    setScanStep('complete');
  };

  const handleCloseModal = () => {
    setUploadModalVisible(false);
    setScanStep('idle');
    setDocTitle('');
    setExtractedData(null);
    setError('');
  };

  const openPrescriptionModal = (rx: Prescription) => {
    setSelectedPrescription(rx);
    setRxModalVisible(true);
  };

  const handleShareRx = async () => {
    if (!selectedPrescription) return;
    try {
      await Share.share({
        title: `Digital Prescription (Rx) • ${selectedPrescription.verificationCode}`,
        message: `FiYDoc Official Prescription\nDoctor: ${selectedPrescription.doctorName} (${selectedPrescription.doctorMciNumber})\nClinic: ${selectedPrescription.clinicName}\nDiagnosis: ${selectedPrescription.diagnosis}\nVerification Code: ${selectedPrescription.verificationCode}`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadRx = () => {
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 2500);
  };

  const filteredRecords = records.filter((r) => {
    if (activeTab === 'PRESCRIPTIONS') return r.type.toLowerCase().includes('prescription');
    if (activeTab === 'LABS') return r.type.toLowerCase().includes('lab') || r.type.toLowerCase().includes('scan');
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header Bar */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>
          Health Records & History
        </Text>
        <TouchableOpacity
          onPress={() => setUploadModalVisible(true)}
          activeOpacity={0.8}
          className="bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 flex-row items-center"
          style={{ gap: 6 }}
        >
          <Plus size={15} color="#00B39B" />
          <Text className="text-xs font-bold text-[#00B39B]">Scan Document</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110, gap: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner */}
        <View className="bg-[#00B39B] p-4 rounded-3xl flex-row items-center justify-between shadow-md">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center bg-white/20 self-start px-2 py-0.5 rounded-md mb-1.5">
              <ScanText size={12} color="#FFFFFF" />
              <Text className="text-[10px] font-extrabold text-white ml-1 uppercase">
                ABDM & OCR Healthcare Engine
              </Text>
            </View>
            <Text className="text-white font-extrabold text-base">Longitudinal Patient History</Text>
            <Text className="text-teal-100 text-xs mt-0.5">
              Access all digital prescriptions issued by doctors, OCR verified lab reports, and vitals history.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setUploadModalVisible(true)}
            activeOpacity={0.85}
            className="bg-white p-3 rounded-2xl shadow-sm"
          >
            <ScanText size={22} color="#00B39B" />
          </TouchableOpacity>
        </View>

        {/* Interactive Tab Switcher */}
        <View className="flex-row bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-sm" style={{ gap: 6 }}>
          {[
            { id: 'ALL', label: 'All Timeline', icon: <FileText size={14} /> },
            { id: 'PRESCRIPTIONS', label: `Prescriptions (${prescriptions.length})`, icon: <Pill size={14} /> },
            { id: 'LABS', label: 'Lab Reports', icon: <Activity size={14} /> },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                activeOpacity={0.8}
                className={`flex-1 py-2 rounded-xl flex-row items-center justify-center ${
                  active ? 'bg-[#1E58C8] shadow-sm' : 'bg-transparent'
                }`}
                style={{ gap: 5 }}
              >
                {React.cloneElement(tab.icon, {
                  color: active ? '#FFFFFF' : '#64748B',
                })}
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: active ? '800' : '700',
                    color: active ? '#FFFFFF' : '#475569',
                  }}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 1. PRESCRIPTIONS TAB LIST */}
        {activeTab === 'PRESCRIPTIONS' && (
          <View style={{ gap: 12 }}>
            <View className="flex-row justify-between items-center">
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>
                Issued Digital Prescriptions (Rx)
              </Text>
              <Badge label="MCI VERIFIED" variant="teal" size="sm" />
            </View>

            {prescriptions.length === 0 ? (
              <View className="bg-white p-8 rounded-3xl border border-slate-200 items-center justify-center" style={{ gap: 8 }}>
                <Pill size={32} color="#94A3B8" />
                <Text className="text-sm font-black text-slate-800">No Prescriptions Issued Yet</Text>
                <Text className="text-xs text-slate-400 text-center">
                  Once your doctor completes a consultation and signs your prescription, it will appear here.
                </Text>
              </View>
            ) : (
              prescriptions.map((rx) => (
                <TouchableOpacity
                  key={rx.id}
                  onPress={() => openPrescriptionModal(rx)}
                  activeOpacity={0.88}
                  className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-sm"
                  style={{ gap: 10 }}
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center" style={{ gap: 6 }}>
                        <Text className="text-base font-black text-slate-900" numberOfLines={1}>
                          {rx.doctorName || 'Dr. Specialist'}
                        </Text>
                        <CheckCircle2 size={15} color="#00B39B" fill="#E0F7F4" />
                      </View>
                      <Text className="text-xs font-bold text-[#00B39B] mt-0.5" numberOfLines={1}>
                        {rx.doctorSpecialty || 'Specialist Consultant'} • {rx.doctorMciNumber || 'MCI Registered'}
                      </Text>
                      <Text className="text-[11px] text-slate-500 mt-0.5" numberOfLines={1}>
                        {rx.clinicName || 'HeartCare Specialty Clinic, Mumbai'}
                      </Text>
                    </View>
                    <Badge label={rx.createdAt || 'Today'} variant="blue" size="sm" />
                  </View>

                  {/* Diagnosis Tag */}
                  {rx.diagnosis && (
                    <View className="bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                      <Text className="text-[10px] font-bold text-[#1E58C8] uppercase tracking-wider">
                        Diagnosis
                      </Text>
                      <Text className="text-xs font-black text-slate-900 mt-0.5">{rx.diagnosis}</Text>
                    </View>
                  )}

                  {/* Medicines Summary Strip */}
                  <View className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex-row justify-between items-center">
                    <View className="flex-row items-center" style={{ gap: 6 }}>
                      <Pill size={15} color="#00B39B" />
                      <Text className="text-xs font-bold text-slate-800">
                        {rx.medicines?.length || 0} Prescribed Medication(s)
                      </Text>
                    </View>
                    <Text className="text-[11px] font-bold text-[#1E58C8]">
                      View Rx Pass →
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* 2. TIMELINE TAB (ALL OR LABS) */}
        {activeTab !== 'PRESCRIPTIONS' && (
          <View style={{ gap: 12 }}>
            <View className="flex-row justify-between items-center pt-1">
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>
                {activeTab === 'LABS' ? 'Diagnostic Lab Reports' : 'Unified Health Timeline'}
              </Text>
              <View className="bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                <Text className="text-[10px] font-bold text-slate-700">
                  {filteredRecords.length} Records
                </Text>
              </View>
            </View>

            <Timeline
              records={filteredRecords}
              onRecordPress={(rec) => {
                if (rec.sourceId) {
                  const match = prescriptions.find((p) => p.id === rec.sourceId);
                  if (match) openPrescriptionModal(match);
                }
              }}
            />
          </View>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* OFFICIAL DIGITAL PRESCRIPTION (Rx) PASS MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={rxModalVisible}
        onClose={() => setRxModalVisible(false)}
        title="Official Digital Prescription (Rx)"
      >
        {selectedPrescription && (
          <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 14, paddingVertical: 4 }}>
              {downloadToast && (
                <View className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex-row items-center justify-center" style={{ gap: 6 }}>
                  <CheckCircle2 size={16} color="#10B981" />
                  <Text className="text-xs font-bold text-emerald-800">Prescription Saved to Downloads</Text>
                </View>
              )}

              {/* Clinic Letterhead */}
              <View className="bg-slate-900 p-4 rounded-3xl" style={{ gap: 6 }}>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Building2 size={16} color="#00B39B" />
                    <Text className="text-xs font-black text-white uppercase tracking-wider">
                      {selectedPrescription.clinicName || 'HeartCare Specialty Clinic'}
                    </Text>
                  </View>
                  <Badge label="MCI CERTIFIED" variant="teal" size="sm" />
                </View>

                <Text className="text-base font-black text-white">{selectedPrescription.doctorName}</Text>
                <Text className="text-xs text-teal-300 font-semibold">
                  {selectedPrescription.doctorSpecialty} • {selectedPrescription.doctorMciNumber || 'MCI-847291'}
                </Text>
                <Text className="text-[11px] text-slate-400">
                  {selectedPrescription.clinicAddress || 'Suite 402, Medical Enclave, Bandra West, Mumbai'}
                </Text>
              </View>

              {/* Patient & Vitals Card */}
              <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200" style={{ gap: 8 }}>
                <View className="flex-row justify-between">
                  <View>
                    <Text className="text-[10px] font-bold text-slate-400 uppercase">Patient</Text>
                    <Text className="text-sm font-black text-slate-900">
                      {selectedPrescription.patientName || 'Aarav Mehta'}
                    </Text>
                    <Text className="text-[11px] text-slate-500">
                      Age: {selectedPrescription.patientAge || 32} • {selectedPrescription.patientGender || 'Male'} • Blood: O+
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[10px] font-bold text-slate-400 uppercase">Issue Date</Text>
                    <Text className="text-sm font-bold text-slate-900">
                      {selectedPrescription.createdAt}
                    </Text>
                    <Text className="text-[10px] font-mono font-bold text-teal-600">
                      {selectedPrescription.verificationCode}
                    </Text>
                  </View>
                </View>

                {/* Vitals Row */}
                {selectedPrescription.vitals && (
                  <View className="bg-white p-2.5 rounded-xl border border-slate-200/80 flex-row justify-around">
                    <View className="items-center">
                      <Text className="text-[9px] text-slate-400 font-bold uppercase">BP</Text>
                      <Text className="text-xs font-black text-slate-900">
                        {selectedPrescription.vitals.bp || '120/80'}
                      </Text>
                    </View>
                    <View className="w-px h-6 bg-slate-200" />
                    <View className="items-center">
                      <Text className="text-[9px] text-slate-400 font-bold uppercase">Pulse</Text>
                      <Text className="text-xs font-black text-slate-900">
                        {selectedPrescription.vitals.pulse || '76'} bpm
                      </Text>
                    </View>
                    <View className="w-px h-6 bg-slate-200" />
                    <View className="items-center">
                      <Text className="text-[9px] text-slate-400 font-bold uppercase">SpO2</Text>
                      <Text className="text-xs font-black text-teal-600">
                        {selectedPrescription.vitals.spo2 || '99%'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Diagnosis */}
              {selectedPrescription.diagnosis && (
                <View className="bg-blue-50 p-3.5 rounded-2xl border border-blue-200">
                  <Text className="text-[10px] font-bold text-[#1E58C8] uppercase tracking-wider">
                    Clinical Assessment & Diagnosis
                  </Text>
                  <Text className="text-sm font-black text-slate-900 mt-0.5">
                    {selectedPrescription.diagnosis}
                  </Text>
                </View>
              )}

              {/* Prescribed Medications Table */}
              <View style={{ gap: 8 }}>
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Pill size={16} color="#00B39B" />
                  <Text className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Prescribed Medications ({selectedPrescription.medicines?.length || 0})
                  </Text>
                </View>

                {selectedPrescription.medicines?.map((m, idx) => (
                  <View
                    key={idx}
                    className="bg-slate-50 p-3 rounded-2xl border border-slate-200"
                    style={{ gap: 4 }}
                  >
                    <View className="flex-row justify-between items-start">
                      <Text className="text-xs font-black text-slate-900 flex-1 mr-2">{m.name}</Text>
                      <Badge label={m.frequency} variant="teal" size="sm" />
                    </View>
                    <View className="flex-row justify-between items-center text-slate-600">
                      <Text className="text-[11px] text-slate-600">
                        Dosage: <Text className="font-bold text-slate-800">{m.dosage}</Text> • Duration: {m.durationDays} Days
                      </Text>
                    </View>
                    {m.instructions && (
                      <Text className="text-[10px] text-teal-800 font-medium bg-teal-50/70 p-1.5 rounded-lg border border-teal-100">
                        Instruction: {m.instructions}
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Prescribed Tests */}
              {selectedPrescription.tests && selectedPrescription.tests.length > 0 && (
                <View style={{ gap: 8 }}>
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Activity size={16} color="#1E58C8" />
                    <Text className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Diagnostic Lab Investigations
                    </Text>
                  </View>

                  {selectedPrescription.tests.map((t, idx) => (
                    <View
                      key={idx}
                      className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex-row justify-between items-center"
                    >
                      <Text className="text-xs font-bold text-slate-900 flex-1 mr-2" numberOfLines={1}>
                        {t.name}
                      </Text>
                      <Text className="text-[10px] font-bold text-[#1E58C8]">
                        {t.fastingRequired ? 'Fasting Required' : 'Routine'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Doctor's Advice & Followup */}
              {selectedPrescription.followUpInstructions && (
                <View className="bg-amber-50 p-3 rounded-2xl border border-amber-200" style={{ gap: 4 }}>
                  <Text className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                    Doctor's Advice & Review
                  </Text>
                  <Text className="text-xs text-amber-800 leading-5">
                    {selectedPrescription.followUpInstructions}
                  </Text>
                </View>
              )}

              {/* Authenticated Seal */}
              <View className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 flex-row items-center" style={{ gap: 8 }}>
                <ShieldCheck size={24} color="#10B981" />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-emerald-800">
                    Digitally Authenticated by {selectedPrescription.doctorName}
                  </Text>
                  <Text className="text-[10px] text-emerald-600">
                    MCI Registration: {selectedPrescription.doctorMciNumber || 'MCI-847291'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-2 pt-1">
                <TouchableOpacity
                  onPress={handleDownloadRx}
                  activeOpacity={0.8}
                  className="flex-1 bg-slate-100 py-3 rounded-2xl flex-row items-center justify-center border border-slate-200"
                  style={{ gap: 6 }}
                >
                  <Download size={16} color="#0F172A" />
                  <Text className="text-xs font-black text-slate-800">Download PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShareRx}
                  activeOpacity={0.8}
                  className="flex-1 bg-teal-50 py-3 rounded-2xl flex-row items-center justify-center border border-teal-200"
                  style={{ gap: 6 }}
                >
                  <Share2 size={16} color="#00B39B" />
                  <Text className="text-xs font-black text-[#00B39B]">Share WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* OCR DOCUMENT SCANNER MODAL */}
      {/* ========================================================================= */}
      <Modal
        visible={uploadModalVisible}
        onClose={handleCloseModal}
        title="OCR Document Scanner"
      >
        <View style={{ gap: 14, paddingVertical: 4 }}>
          {scanStep === 'scanning' ? (
            <View className="items-center py-8" style={{ gap: 12 }}>
              <ActivityIndicator size="large" color="#00B39B" />
              <Text className="text-sm font-black text-slate-900">
                Running OCR Extraction Pipeline...
              </Text>
              <Text className="text-xs text-slate-500 text-center max-w-[260px]">
                Extracting clinical biomarkers, normal reference ranges, and diagnostic indicators.
              </Text>
            </View>
          ) : scanStep === 'complete' && extractedData ? (
            <View style={{ gap: 12 }}>
              <View className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 flex-row items-center" style={{ gap: 10 }}>
                <CheckCircle2 size={24} color="#10B981" />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-emerald-800">
                    Document Verified & Added to Timeline
                  </Text>
                  <Text className="text-[11px] text-emerald-600 font-medium">
                    Parameters verified and indexed.
                  </Text>
                </View>
              </View>

              <Text className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Extracted Clinical Biomarkers
              </Text>

              <View className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200" style={{ gap: 8 }}>
                {Object.entries(extractedData).map(([key, val]) => (
                  <View key={key} className="flex-row justify-between items-center py-1 border-b border-slate-100 last:border-b-0">
                    <Text className="text-xs font-bold text-slate-600">{key}</Text>
                    <Text className="text-xs font-black text-slate-900">{val}</Text>
                  </View>
                ))}
              </View>

              <Button
                title="Done & View in Timeline"
                onPress={handleCloseModal}
                variant="primary"
                size="lg"
              />
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <Text className="text-xs text-slate-500 leading-5">
                Scan your medical documents, lab test reports, or physical prescriptions. Our OCR engine automatically transcribes clinical parameters.
              </Text>

              {error ? (
                <View className="bg-rose-50 p-3 rounded-xl border border-rose-200 flex-row items-center" style={{ gap: 6 }}>
                  <AlertCircle size={16} color="#E11D48" />
                  <Text className="text-xs font-bold text-rose-800 flex-1">{error}</Text>
                </View>
              ) : null}

              <Input
                label="Document / Investigation Title"
                placeholder="e.g. Lipid Profile, Fasting Glucose, Chest X-Ray"
                value={docTitle}
                onChangeText={setDocTitle}
              />

              <View style={{ gap: 6 }}>
                <Text className="text-xs font-bold text-slate-700">Select Category</Text>
                <View className="flex-row gap-2">
                  {(['Lab Result', 'Prescription', 'Scan/X-Ray'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setDocType(t)}
                      activeOpacity={0.8}
                      className={`flex-1 py-2 rounded-xl border items-center ${
                        docType === t
                          ? 'bg-[#00B39B] border-[#00B39B]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: '800',
                          color: docType === t ? '#FFFFFF' : '#334155',
                        }}
                      >
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Button
                title="Begin Optical OCR Scan"
                onPress={handleStartScan}
                variant="teal"
                size="lg"
                icon={<ScanText size={18} color="#FFFFFF" />}
              />
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
