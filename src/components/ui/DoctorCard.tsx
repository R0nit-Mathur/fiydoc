import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { Doctor } from '@/types/index';
import { Image } from 'expo-image';
import {
  ShieldCheck,
  MapPin,
  Star,
  Heart,
  ArrowRight,
  Clock,
  Footprints,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { StitchColors, DEFAULT_DOCTOR_AVATAR } from '@/constants/theme';
import { formatCurrency } from '@/utils/formatters';
import { getSpecialtyConfig } from '@/constants/specialties';

interface DoctorCardProps {
  doctor: Doctor;
  onPress: () => void;
  onBookPress?: () => void;
  tokenNumber?: string;
  nextSlot?: string;
}

export function DoctorCard({
  doctor,
  onPress,
  onBookPress,
  tokenNumber = 'Token #14',
  nextSlot = 'Today, 4:15 PM',
}: DoctorCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  const toggleFavorite = (e: any) => {
    e.stopPropagation?.();
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    setIsFavorite(!isFavorite);
  };

  const handleBook = (e: any) => {
    e.stopPropagation?.();
    if (onBookPress) {
      onBookPress();
    } else {
      onPress();
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`View ${doctor.name} profile`}
    >
      {/* Top Meta Row: Verified & Distance */}
      <View style={styles.metaRow}>
        <View style={styles.verifiedBadge}>
          <ShieldCheck size={14} color="#2563eb" />
          <Text style={styles.verifiedText}>Verified</Text>
        </View>

        <View style={styles.distanceRow}>
          <Footprints size={14} color={StitchColors.outline} />
          <Text style={styles.distanceText}>
            {doctor.distanceKm ? `${doctor.distanceKm.toFixed(1)} km` : '1.4 km'}
          </Text>
        </View>
      </View>

      {/* Middle Row: Avatar & Doctor Info */}
      <View style={styles.infoRow}>
        <Image
          source={{
            uri:
              doctor.avatar ||
              DEFAULT_DOCTOR_AVATAR,
          }}
          style={styles.avatar}
          contentFit="cover"
        />

        <View style={styles.textContainer}>
          <View style={styles.nameHeader}>
            <Text style={styles.doctorName} numberOfLines={1}>
              {doctor.name}
            </Text>
            <Pressable
              onPress={toggleFavorite}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Heart
                size={18}
                color={isFavorite ? '#e11d48' : '#cbd5e1'}
                fill={isFavorite ? '#e11d48' : 'transparent'}
              />
            </Pressable>
          </View>

          {(() => {
            const specialtyConfig = getSpecialtyConfig(doctor.specialty);
            const SpecialtyIcon = specialtyConfig.icon;
            return (
              <View style={styles.specialtyRow}>
                <View style={[styles.specialtyIconBadge, { backgroundColor: specialtyConfig.lightBg }]}>
                  <SpecialtyIcon size={12} color={specialtyConfig.color} strokeWidth={2.2} />
                </View>
                <Text style={styles.specialtyText} numberOfLines={1}>
                  {doctor.specialty} • {doctor.experienceYears || 12} yrs exp
                </Text>
              </View>
            );
          })()}

          <Text style={styles.hospitalText} numberOfLines={1}>
            {doctor.hospital || 'Fortis Hospital & Associate OPD'}
          </Text>

          <View style={styles.ratingRow}>
            <View style={styles.ratingPill}>
              <Star size={11} color="#b45309" fill="#b45309" />
              <Text style={styles.ratingText}>
                {doctor.rating ? doctor.rating.toFixed(1) : '4.9'}
              </Text>
            </View>
            <Text style={styles.reviewCountText}>
              ({doctor.reviewCount || 342} reviews)
            </Text>
          </View>
        </View>
      </View>

      {/* Token and Fee Strip */}
      <View style={styles.slotFeeStrip}>
        <View style={styles.slotDetails}>
          <View style={styles.tokenPill}>
            <Text style={styles.tokenText}>{tokenNumber}</Text>
          </View>
          <Text style={styles.slotTimeText}>{nextSlot}</Text>
        </View>
        <Text style={styles.feeText}>
          {formatCurrency(doctor.consultationFee || 800)}
        </Text>
      </View>

      {/* Full-width Action Button */}
      <Pressable
        onPress={handleBook}
        style={({ pressed }) => [styles.bookBtn, pressed && styles.buttonPressed]}
        accessibilityRole="button"
        accessibilityLabel={`Book OPD visit with ${doctor.name}`}
      >
        <Text style={styles.bookBtnText}>Book OPD Visit</Text>
        <ArrowRight size={16} color="#ffffff" />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    marginBottom: 14,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#131b2e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(19, 27, 46, 0.04)',
      },
    }),
  },
  cardPressed: {
    transform: [{ scale: 0.99 }],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
  },
  verifiedText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1d4ed8',
    marginLeft: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: StitchColors.onSurfaceVariant,
    fontWeight: '500',
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 16,
    backgroundColor: StitchColors.surfaceContainerHigh,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    minWidth: 0,
  },
  nameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  doctorName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: StitchColors.onSurface,
    flex: 1,
    marginRight: 6,
  },
  specialtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  specialtyIconBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginRight: 6,
  },
  specialtyText: {
    fontSize: 12.5,
    color: StitchColors.onSurfaceVariant,
    fontWeight: '500',
    flex: 1,
  },
  hospitalText: {
    fontSize: 11.5,
    color: StitchColors.outline,
    marginTop: 3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    backgroundColor: '#fffbeb',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    marginLeft: 3,
  },
  reviewCountText: {
    fontSize: 11,
    color: StitchColors.outline,
  },
  slotFeeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  slotDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#ccfbf1',
    marginRight: 8,
  },
  tokenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f766e',
  },
  slotTimeText: {
    fontSize: 12,
    fontWeight: '600',
    color: StitchColors.onSurface,
  },
  feeText: {
    fontSize: 15,
    fontWeight: '700',
    color: StitchColors.onSurface,
  },
  bookBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: StitchColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: StitchColors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 57, 126, 0.2)',
      },
    }),
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  bookBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 6,
  },
});
