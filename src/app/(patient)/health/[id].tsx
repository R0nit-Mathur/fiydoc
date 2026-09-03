import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHealthRecordsQuery } from '@/hooks/queries/useHealthRecordsQuery';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Activity, CheckCircle2, Building2, Calendar, FileText } from 'lucide-react-native';

export default function RecordDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: records } = useHealthRecordsQuery('pat_1');

  const rec = records?.find((r) => r.id === id) || records?.[0];

  return (
    <SafeAreaView className="flex-1 bg-white justify-between">
      <View>
        <View className="px-5 py-3 flex-row items-center justify-between border-b border-slate-100">
          <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
            <ArrowLeft size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text className="text-base font-bold text-slate-900">Health Record Details</Text>
          <View className="w-6" />
        </View>

        <ScrollView contentContainerClassName="p-5 space-y-5">
          {rec && (
            <>
              <View className="space-y-1">
                <Badge label={rec.type} variant="teal" size="md" />
                <Text className="text-2xl font-black text-slate-900 mt-2">{rec.title}</Text>
                <Text className="text-xs text-slate-500">Extracted by FiYDoc AI OCR</Text>
              </View>

              <View className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-400">Date Processed</Text>
                  <Text className="text-xs font-bold text-slate-800">{rec.createdAt}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-xs text-slate-400">Facility / Lab</Text>
                  <Text className="text-xs font-bold text-slate-800">{rec.facility || 'FiYDoc AI OCR'}</Text>
                </View>
                {rec.ocrConfidence && (
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-slate-400">OCR Accuracy</Text>
                    <Text className="text-xs font-bold text-emerald-600">{rec.ocrConfidence}%</Text>
                  </View>
                )}
              </View>

              <View className="bg-teal-50 p-4 rounded-3xl border border-teal-100">
                <Text className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-1">
                  Extracted Summary & Tags
                </Text>
                <Text className="text-xs text-slate-700 mb-3">{rec.summary}</Text>
                <View className="flex-row flex-wrap gap-1.5">
                  {rec.extractedTags?.map((tag, i) => (
                    <View key={i} className="bg-white px-2.5 py-1 rounded-lg border border-teal-200">
                      <Text className="text-xs font-bold text-teal-700">{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
