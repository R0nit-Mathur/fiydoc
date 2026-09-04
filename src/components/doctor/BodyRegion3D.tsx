import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, Activity } from 'lucide-react-native';

export interface BodyRegionMarker {
  id: string;
  name: string;
  painLevel: number;
  clinicalNote: string;
}

interface BodyRegion3DProps {
  onSelectRegion?: (region: BodyRegionMarker) => void;
}

export function BodyRegion3D({ onSelectRegion }: BodyRegion3DProps) {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('chest');
  const [painLevel, setPainLevel] = useState<number>(7);

  const REGIONS = [
    { id: 'head', name: 'Head & Cranium', color: '#8B5CF6' },
    { id: 'chest', name: 'Chest / Cardiac', color: '#EF4444' },
    { id: 'abdomen', name: 'Abdomen & GI', color: '#F59E0B' },
    { id: 'spine', name: 'Spine & Lumbar', color: '#10B981' },
    { id: 'arms', name: 'Upper Extremity', color: '#00B39B' },
    { id: 'legs', name: 'Lower Extremity', color: '#1E58C8' },
  ];

  const handleSelect = (id: string) => {
    setSelectedRegionId(id);
    const reg = REGIONS.find((r) => r.id === id);
    if (reg && onSelectRegion) {
      onSelectRegion({
        id: reg.id,
        name: reg.name,
        painLevel,
        clinicalNote: `Focus clinical examination on ${reg.name}`,
      });
    }
  };

  const selectedRegion = REGIONS.find((r) => r.id === selectedRegionId) || REGIONS[1];

  return (
    <View className="bg-slate-900 p-4 rounded-3xl border border-slate-800" style={{ gap: 14 }}>
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center" style={{ gap: 8 }}>
          <View className="w-2.5 h-2.5 rounded-full bg-teal-400" />
          <Text className="text-xs font-black text-white uppercase tracking-wider">
            Anatomical Exam Focus
          </Text>
        </View>
        <Badge label={selectedRegion.name} variant="teal" size="sm" />
      </View>

      {/* Main Interactive Area */}
      <View className="flex-row items-center" style={{ gap: 14 }}>
        {/* Silhouette Vector */}
        <View
          className="bg-slate-950 rounded-2xl items-center justify-center border border-slate-800"
          style={{ width: 100, height: 170 }}
        >
          <Svg width="80" height="150" viewBox="0 0 100 200" fill="none">
            {/* Head */}
            <Circle
              cx="50"
              cy="25"
              r="15"
              fill={selectedRegionId === 'head' ? '#8B5CF6' : '#334155'}
              stroke="#64748B"
              strokeWidth="1.5"
            />
            {/* Neck */}
            <Rect x="46" y="40" width="8" height="8" fill="#334155" />
            {/* Chest */}
            <Rect
              x="30"
              y="48"
              width="40"
              height="35"
              rx="6"
              fill={selectedRegionId === 'chest' ? '#EF4444' : '#334155'}
              stroke="#64748B"
              strokeWidth="1.5"
            />
            {/* Abdomen */}
            <Rect
              x="32"
              y="85"
              width="36"
              height="30"
              rx="6"
              fill={selectedRegionId === 'abdomen' ? '#F59E0B' : '#334155'}
              stroke="#64748B"
              strokeWidth="1.5"
            />
            {/* Arms */}
            <Rect
              x="12"
              y="48"
              width="15"
              height="65"
              rx="6"
              fill={selectedRegionId === 'arms' ? '#00B39B' : '#334155'}
              stroke="#64748B"
              strokeWidth="1.5"
            />
            <Rect
              x="73"
              y="48"
              width="15"
              height="65"
              rx="6"
              fill={selectedRegionId === 'arms' ? '#00B39B' : '#334155'}
              stroke="#64748B"
              strokeWidth="1.5"
            />
            {/* Legs */}
            <Rect
              x="32"
              y="118"
              width="16"
              height="75"
              rx="6"
              fill={selectedRegionId === 'legs' ? '#1E58C8' : '#334155'}
              stroke="#64748B"
              strokeWidth="1.5"
            />
            <Rect
              x="52"
              y="118"
              width="16"
              height="75"
              rx="6"
              fill={selectedRegionId === 'legs' ? '#1E58C8' : '#334155'}
              stroke="#64748B"
              strokeWidth="1.5"
            />
          </Svg>
        </View>

        {/* Region Pills List */}
        <View className="flex-1" style={{ gap: 6, minWidth: 0 }}>
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Select Focus Area
          </Text>
          <View className="flex-row flex-wrap" style={{ gap: 6 }}>
            {REGIONS.map((r) => {
              const isSel = selectedRegionId === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => handleSelect(r.id)}
                  activeOpacity={0.8}
                  className={`px-2.5 py-1.5 rounded-xl border ${
                    isSel ? 'bg-teal-950 border-teal-400' : 'bg-slate-800/80 border-slate-700/60'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-bold ${isSel ? 'text-teal-300' : 'text-slate-300'}`}
                    numberOfLines={1}
                  >
                    {r.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Responsive Pain Severity Scale (2 rows of 5) */}
      <View style={{ gap: 6 }}>
        <View className="flex-row items-center justify-between">
          <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Patient Pain / Severity Scale
          </Text>
          <Text className="text-xs font-black text-red-400">{painLevel} / 10</Text>
        </View>

        <View style={{ gap: 4 }}>
          <View className="flex-row" style={{ gap: 4 }}>
            {[1, 2, 3, 4, 5].map((num) => {
              const active = painLevel >= num;
              return (
                <TouchableOpacity
                  key={num}
                  onPress={() => setPainLevel(num)}
                  activeOpacity={0.8}
                  className={`flex-1 h-7 rounded-lg items-center justify-center ${
                    active ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <Text className="text-[10px] font-black text-white">{num}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View className="flex-row" style={{ gap: 4 }}>
            {[6, 7, 8, 9, 10].map((num) => {
              const active = painLevel >= num;
              return (
                <TouchableOpacity
                  key={num}
                  onPress={() => setPainLevel(num)}
                  activeOpacity={0.8}
                  className={`flex-1 h-7 rounded-lg items-center justify-center ${
                    active ? 'bg-red-500' : 'bg-slate-800'
                  }`}
                >
                  <Text className="text-[10px] font-black text-white">{num}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}
