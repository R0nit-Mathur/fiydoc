import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Timeline } from '@/components/ui/Timeline';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useHealthRecordsQuery, useUploadDocumentMutation } from '@/hooks/queries/useHealthRecordsQuery';
import { FileUp, Sparkles, Plus, ScanText, CheckCircle2, ArrowLeft } from 'lucide-react-native';

export default function HealthHubScreen() {
  const router = useRouter();
  const { data: records, isLoading } = useHealthRecordsQuery('pat_1');
  const uploadMutation = useUploadDocumentMutation();

  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<'Lab Result' | 'Prescription' | 'Scan/X-Ray'>('Lab Result');
  const [scanStep, setScanStep] = useState<'idle' | 'scanning' | 'complete'>('idle');

  const handleSimulateScan = async () => {
    try {
      setScanStep('scanning');
      await uploadMutation.mutateAsync({
        patientId: 'pat_1',
        title: docTitle || 'HbA1c & Fasting Glucose Report',
        type: docType,
      });
      setScanStep('complete');
      setTimeout(() => {
        setScanStep('idle');
        setUploadModalVisible(false);
        setDocTitle('');
      }, 1200);
    } catch (err) {
      setScanStep('idle');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header Bar */}
      <View className="px-5 py-3.5 bg-white border-b border-slate-100 flex-row items-center justify-between shadow-sm">
        <Text className="text-xl font-black text-slate-900">Health Hub & Timeline</Text>
        <TouchableOpacity
          onPress={() => setUploadModalVisible(true)}
          className="bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 flex-row items-center"
          style={{ gap: 6 }}
        >
          <Plus size={16} color="#00B39B" />
          <Text className="text-xs font-bold text-[#00B39B]">Upload Report</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 18 }}>
        {/* Banner */}
        <View className="bg-gradient-to-r from-teal-500 to-emerald-600 bg-[#00B39B] p-4.5 rounded-3xl flex-row items-center justify-between shadow-md">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center bg-white/20 self-start px-2 py-0.5 rounded-md mb-1.5">
              <Sparkles size={12} color="#FFFFFF" />
              <Text className="text-[10px] font-extrabold text-white ml-1 uppercase">AI OCR Scanner Active</Text>
            </View>
            <Text className="text-white font-extrabold text-base">Smart Record Extraction</Text>
            <Text className="text-teal-100 text-xs mt-0.5">Upload any paper prescription or lab sheet for automatic medical tagging.</Text>
          </View>
          <TouchableOpacity
            onPress={() => setUploadModalVisible(true)}
            className="bg-white p-3 rounded-2xl"
          >
            <ScanText size={24} color="#00B39B" />
          </TouchableOpacity>
        </View>

        {/* Timeline Header */}
        <Text className="text-base font-extrabold text-slate-900">Interactive Medical Timeline</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#00B39B" className="py-10" />
        ) : (
          <Timeline records={records || []} />
        )}
      </ScrollView>

      {/* OCR Simulator Modal */}
      <Modal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        title="Simulate Document OCR Upload"
      >
        <View style={{ gap: 16, paddingVertical: 8 }}>
          {scanStep === 'scanning' ? (
            <View className="items-center py-8 space-y-3">
              <ActivityIndicator size="large" color="#00B39B" />
              <Text className="text-sm font-bold text-slate-900">Scanning Document with FiYDoc OCR...</Text>
              <Text className="text-xs text-slate-500">Extracting biomarkers, laboratory units, and dosages</Text>
            </View>
          ) : scanStep === 'complete' ? (
            <View className="items-center py-6 space-y-2">
              <CheckCircle2 size={48} color="#10B981" />
              <Text className="text-base font-bold text-slate-900">Extraction Complete! (97.2% Confidence)</Text>
              <Text className="text-xs text-slate-500">Saved to health timeline.</Text>
            </View>
          ) : (
            <>
              <Input
                label="Document Title"
                placeholder="e.g. Lipid Profile & HbA1c"
                value={docTitle}
                onChangeText={setDocTitle}
              />

              <View>
                <Text className="text-xs font-bold text-slate-700 mb-2">Record Category</Text>
                <View className="flex-row space-x-2">
                  {(['Lab Result', 'Prescription', 'Scan/X-Ray'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setDocType(t)}
                      className={`flex-1 py-2 rounded-xl border items-center ${
                        docType === t ? 'bg-teal-50 border-[#00B39B]' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text className={`text-xs font-bold ${docType === t ? 'text-[#00B39B]' : 'text-slate-700'}`}>
                        {t}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View className="bg-slate-50 p-4 rounded-2xl border border-dashed border-slate-300 items-center justify-center py-6">
                <FileUp size={32} color="#00B39B" />
                <Text className="text-xs font-bold text-slate-700 mt-2">Simulated Camera / File Picker</Text>
                <Text className="text-[10px] text-slate-400">Supports PDF, JPG, PNG medical scans</Text>
              </View>

              <Button
                title="Start AI OCR Processing"
                onPress={handleSimulateScan}
                variant="teal"
                size="lg"
                icon={<ScanText size={20} color="#FFFFFF" />}
              />
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
