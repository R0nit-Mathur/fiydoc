import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Doctor } from '@/types/index';
import { Star, MapPin, Building2, CheckCircle2 } from 'lucide-react-native';
import { Avatar } from './Avatar';
import { formatDistance, calculateDistanceKm } from '@/utils/distance';
import { useLocationStore } from '@/store/useLocationStore';

interface DoctorCardProps {
  doctor: Doctor;
  onPress: () => void;
  onBookPress?: () => void;
}

export function DoctorCard({ doctor, onPress, onBookPress }: DoctorCardProps) {
  const userLat = useLocationStore((s) => s.latitude);
  const userLng = useLocationStore((s) => s.longitude);

  const qualification =
    doctor.qualification || doctor.qualifications || 'MBBS, MD Specialist';

  const effectiveDistance =
    doctor.distanceKm !== undefined && doctor.distanceKm !== null
      ? doctor.distanceKm
      : calculateDistanceKm(userLat, userLng, doctor.latitude, doctor.longitude);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-white/95 rounded-2xl p-4 mb-3 border border-slate-200/80 shadow-sm"
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar uri={doctor.avatar} name={doctor.name} size="lg" />
          <View
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              backgroundColor: '#FFFFFF',
              borderRadius: 99,
              padding: 2,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
          >
            <CheckCircle2 size={14} color="#00B39B" fill="#E0F7F4" />
          </View>
        </View>

        <View style={{ flex: 1, minWidth: 0, justifyContent: 'space-between' }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
              <Text
                style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', flex: 1 }}
                numberOfLines={1}
              >
                {doctor.name}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#FEF3C7',
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 8,
                  gap: 3,
                  flexShrink: 0,
                }}
              >
                <Star size={10} color="#F59E0B" fill="#F59E0B" />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#92400E' }}>
                  {doctor.rating || 4.9}
                </Text>
              </View>
            </View>

            <Text
              style={{ fontSize: 12, fontWeight: '700', color: '#00B39B', marginTop: 2 }}
              numberOfLines={1}
            >
              {doctor.specialty} • {doctor.experienceYears || 12} yrs exp
            </Text>
            <Text
              style={{ fontSize: 11, fontWeight: '500', color: '#64748B', marginTop: 2 }}
              numberOfLines={1}
            >
              {qualification}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#EEF2FF',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                gap: 4,
              }}
            >
              <Building2 size={11} color="#1E58C8" />
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#1E58C8' }}>In-Clinic Visit</Text>
            </View>

            {effectiveDistance !== null && effectiveDistance !== undefined && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#ECFDF5',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  gap: 3,
                  borderWidth: 0.5,
                  borderColor: '#A7F3D0',
                }}
              >
                <MapPin size={10} color="#059669" />
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#059669' }}>
                  {formatDistance(effectiveDistance)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Hospital Location & Fee Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 10,
          marginTop: 10,
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 8, gap: 4 }}>
          <MapPin size={12} color="#64748B" style={{ flexShrink: 0 }} />
          <Text style={{ fontSize: 11, fontWeight: '500', color: '#475569', flex: 1 }} numberOfLines={1}>
            {doctor.hospital ? `${doctor.hospital}, ` : ''}{doctor.location}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>
            ₹{doctor.consultationFee}
          </Text>
          <TouchableOpacity
            onPress={onBookPress || onPress}
            activeOpacity={0.8}
            style={{
              backgroundColor: '#00B39B',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 10,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF' }}>Book Visit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}
