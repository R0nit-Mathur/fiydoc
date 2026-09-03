import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, CheckCircle2 } from 'lucide-react-native';

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
  const [markers, setMarkers] = useState<Record<string, BodyRegionMarker>>({
    chest: { id: 'chest', name: 'Chest / Thorax', painLevel: 7, clinicalNote: 'Tightness on exertion' },
  });

  const REGIONS = [
    { id: 'head', name: 'Head & Cranium', color: '#8B5CF6' },
    { id: 'chest', name: 'Chest / Cardiac', color: '#EF4444' },
    { id: 'abdomen', name: 'Abdomen & Gastro', color: '#F59E0B' },
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
        clinicalNote: markers[id]?.clinicalNote || 'Annotated by Dr. Ananya Roy',
      });
    }
  };

  return (
    <View className="bg-slate-900 p-4 rounded-3xl border border-slate-800 space-y-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center space-x-2">
          <View className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
          <Text className="text-xs font-bold text-white uppercase tracking-wider">
            3D Anatomical Body Region Annotator
          </Text>
        </View>
        <Badge label="Conceptual 3D" variant="teal" size="sm" />
      </View>

      <View className="flex-row items-center space-x-4">
        {/* Vector Human Body Silhouette */}
        <View className="w-36 h-64 bg-slate-950 rounded-2xl items-center justify-center border border-slate-800 relative">
          <Svg width="120" height="220" viewBox="0 0 100 200" fill="none">
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
            {/* Chest / Thorax */}
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
            {/* Arms Left/Right */}
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
            {/* Legs Left/Right */}
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

          {/* Holographic grid lines overlay */}
          <View className="absolute inset-0 border border-teal-500/20 rounded-2xl pointer-events-none" />
        </View>

        {/* Region Selector Pills & Pain Level Slider */}
        <View className="flex-1 space-y-2">
          <Text className="text-[11px] font-bold text-slate-400 uppercase">Target Body Part</Text>
          <View className="flex-row flex-wrap gap-1.5">
            {REGIONS.map((r) => {
              const isSel = selectedRegionId === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => handleSelect(r.id)}
                  className={`px-2.5 py-1 rounded-xl border ${
                    isSel ? 'bg-teal-900/80 border-teal-500' : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  <Text className={`text-[11px] font-bold ${isSel ? 'text-teal-300' : 'text-slate-300'}`}>
                    {r.name.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="pt-2">
            <Text className="text-[11px] font-bold text-slate-400 uppercase mb-1">
              Pain Scale Marker: <Text className="text-red-400 font-extrabold">{painLevel} / 10</Text>
            </Text>
            <View className="flex-row space-x-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <TouchableOpacity
                  key={num}
                  onPress={() => setPainLevel(num)}
                  className={`flex-1 h-7 rounded justify-center items-center ${
                    painLevel >= num ? 'bg-red-500' : 'bg-slate-800'
                  }`}
                >
                  <Text className="text-[10px] font-bold text-white">{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
