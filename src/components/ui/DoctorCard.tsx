import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Doctor } from '@/types/index';
import { Star, MapPin, Building2, CheckCircle2 } from 'lucide-react-native';
import { Avatar } from './Avatar';

interface DoctorCardProps {
  doctor: Doctor;
  onPress: () => void;
  onBookPress?: () => void;
}

export function DoctorCard({ doctor, onPress, onBookPress }: DoctorCardProps) {
  const qualification =
    doctor.qualification || doctor.qualifications || 'MBBS, MD Specialist';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-white rounded-3xl p-4.5 mb-4 border border-slate-200/90 shadow-sm"
      style={{ marginVertical: 4 }}
    >
      <View className="flex-row items-start" style={{ gap: 14 }}>
        <View className="relative">
          <Avatar uri={doctor.avatar} name={doctor.name} size="xl" />
          <View className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
            <CheckCircle2 size={16} color="#00B39B" fill="#E0F7F4" />
          </View>
        </View>

        <View className="flex-1 justify-between">
          <View>
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-black text-slate-900 flex-1 mr-2" numberOfLines={1}>
                {doctor.name}
              </Text>
              <View className="flex-row items-center bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200" style={{ gap: 4 }}>
                <Star size={11} color="#F59E0B" fill="#F59E0B" />
                <Text className="text-xs font-bold text-amber-800">{doctor.rating || 4.9}</Text>
              </View>
            </View>

            <Text className="text-xs font-bold text-[#00B39B] mt-1">
              {doctor.specialty} • {doctor.experienceYears || 12} yrs exp
            </Text>
            <Text className="text-xs text-slate-500 font-medium mt-1" numberOfLines={1}>
              {qualification}
            </Text>
          </View>

          <View className="flex-row items-center mt-2.5" style={{ gap: 8 }}>
            <View className="flex-row items-center bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100" style={{ gap: 6 }}>
              <Building2 size={12} color="#1E58C8" />
              <Text className="text-[11px] font-bold text-[#1E58C8]">In-Clinic Visit</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Hospital Location & Fee Bar */}
      <View className="flex-row items-center justify-between pt-3 mt-3.5 border-t border-slate-100">
        <View className="flex-row items-center flex-1 mr-3" style={{ gap: 6 }}>
          <MapPin size={13} color="#64748B" />
          <Text className="text-xs text-slate-600 font-medium flex-1" numberOfLines={1}>
            {doctor.hospital ? `${doctor.hospital}, ` : ''}{doctor.location}
          </Text>
        </View>

        <View className="flex-row items-center" style={{ gap: 10 }}>
          <Text className="text-sm font-black text-slate-900">
            ₹{doctor.consultationFee}
          </Text>
          <TouchableOpacity
            onPress={onBookPress || onPress}
            activeOpacity={0.8}
            className="bg-[#00B39B] px-3.5 py-1.5 rounded-xl shadow-sm"
          >
            <Text className="text-xs font-extrabold text-white">Book Visit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
