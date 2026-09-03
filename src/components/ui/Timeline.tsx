import React from 'react';
import { View, Text } from 'react-native';
import { FileText, Activity, Pill, Stethoscope, CheckCircle2 } from 'lucide-react-native';
import { MedicalRecord } from '@/types/index';

interface TimelineProps {
  records: MedicalRecord[];
  onRecordPress?: (record: MedicalRecord) => void;
}

export function Timeline({ records }: TimelineProps) {
  const getIcon = (type: MedicalRecord['type']) => {
    switch (type) {
      case 'Lab Result':
        return <Activity size={16} color="#00B39B" />;
      case 'Prescription':
        return <Pill size={16} color="#1E58C8" />;
      case 'Scan/X-Ray':
        return <FileText size={16} color="#8B5CF6" />;
      default:
        return <Stethoscope size={16} color="#F59E0B" />;
    }
  };

  return (
    <View className="py-2">
      {records.map((item, index) => {
        const isLast = index === records.length - 1;

        return (
          <View key={item.id} className="flex-row space-x-3.5 mb-5">
            {/* Timeline Bar & Node */}
            <View className="items-center">
              <View className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center border border-slate-200 dark:border-slate-700 z-10">
                {getIcon(item.type)}
              </View>
              {!isLast && (
                <View className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 my-1" />
              )}
            </View>

            {/* Record Card */}
            <View className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/80 shadow-sm">
              <View className="flex-row justify-between items-start">
                <Text className="text-xs font-bold text-[#00B39B] uppercase tracking-wider">
                  {item.type} • {item.createdAt}
                </Text>
                {item.ocrConfidence && (
                  <View className="flex-row items-center bg-emerald-50 px-1.5 py-0.5 rounded">
                    <CheckCircle2 size={10} color="#10B981" />
                    <Text className="text-[10px] font-bold text-emerald-700 ml-1">
                      {item.ocrConfidence}% OCR
                    </Text>
                  </View>
                )}
              </View>

              <Text className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {item.title}
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                {item.facility || 'FiYDoc AI OCR'} {item.doctorName ? `• ${item.doctorName}` : ''}
              </Text>

              <Text className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {item.summary}
              </Text>

              {/* Tag Chips */}
              <View className="flex-row flex-wrap gap-1.5 mt-2.5">
                {item.extractedTags?.map((tag, i) => (
                  <View key={i} className="bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-100 dark:border-teal-900">
                    <Text className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}
