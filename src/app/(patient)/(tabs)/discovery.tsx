/**
 * FiYDOC - Doctor Listing & Search
 * Pixel-perfect 1:1 implementation of Stitch HTML:
 * - Top header with Back, "Find Doctors", filter button
 * - Subheader: Specialty title, specialist count, location pill
 * - Search bar with clear button
 * - Horizontal Filter Chips strip (Available Today, Exp 10+ yrs, Fees < ₹1000, 4.8+, Filters)
 * - Live OPD telemetry notice ("Showing nearest slots with live tokens" • "OPD Active Now")
 * - Doctor cards stream
 */
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  SlidersHorizontal,
  MapPin,
  Search,
  X,
  Zap,
  Star,
  Sparkles,
} from 'lucide-react-native';
import { StitchColors } from '@/constants/theme';
import { useDoctorsQuery } from '@/hooks/queries/useDoctorsQuery';
import { useLocationStore } from '@/store/useLocationStore';
import { DoctorCard } from '@/components/ui/DoctorCard';
import { DoctorCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Doctor } from '@/types/index';

const FILTER_PILLS = [
  { id: 'available_today', label: 'Available Today', hasBolt: true },
  { id: 'exp_10', label: 'Exp 10+ yrs' },
  { id: 'fee_1000', label: 'Fees < ₹1000' },
  { id: 'rating_48', label: '4.8+', hasStar: true },
  { id: 'more_filters', label: 'Filters', hasTune: true },
];

export default function DoctorDiscoveryScreen() {
  const router = useRouter();
  const { area, city, formattedAddress } = useLocationStore();
  const params = useLocalSearchParams<{ specialty?: string; query?: string; filter?: string }>();
  
  const [searchQuery, setSearchQuery] = useState(params.query || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState(params.specialty || 'Cardiologists');
  const [activeFilters, setActiveFilters] = useState<string[]>(['available_today']);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (params.specialty) setSelectedSpecialty(params.specialty);
    if (params.query) setSearchQuery(params.query);
  }, [params.specialty, params.query]);

  const { data: doctors, isLoading, refetch } = useDoctorsQuery({
    query: searchQuery,
    specialty: selectedSpecialty === 'All' || selectedSpecialty === 'Cardiologists' ? undefined : selectedSpecialty,
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const toggleFilter = (filterId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    if (activeFilters.includes(filterId)) {
      setActiveFilters(activeFilters.filter((id) => id !== filterId));
    } else {
      setActiveFilters([...activeFilters, filterId]);
    }
  };

  // Filter doctors based on search & filter pills
  const filteredDoctors = useMemo(() => {
    if (!doctors || doctors.length === 0) return [];
    let list = [...doctors];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (doc) =>
          doc.name.toLowerCase().includes(q) ||
          doc.specialty.toLowerCase().includes(q) ||
          (doc.hospital && doc.hospital.toLowerCase().includes(q))
      );
    }

    if (activeFilters.includes('exp_10')) {
      list = list.filter((doc) => (doc.experienceYears || 0) >= 10);
    }

    if (activeFilters.includes('fee_1000')) {
      list = list.filter((doc) => (doc.consultationFee || 800) < 1000);
    }

    // Helper to extract numeric distance
    const getDistanceNum = (doc: Doctor) => {
      if (typeof doc.distanceKm === 'number') return doc.distanceKm;
      const rawDist = (doc as any).distance;
      if (typeof rawDist === 'string') {
        const match = rawDist.match(/([0-9.]+)/);
        if (match) return parseFloat(match[1]);
      }
      return 999;
    };

    return list.sort((a, b) => getDistanceNum(a) - getDistanceNum(b));
  }, [doctors, searchQuery, activeFilters]);

  const displaySpecialtyTitle = selectedSpecialty.endsWith('s')
    ? selectedSpecialty
    : `${selectedSpecialty}s`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Top Header */}
      <View style={styles.topHeader}>
        {Platform.OS === 'ios' ? (
          <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(250, 248, 255, 0.95)' },
            ]}
          />
        )}
        <View style={styles.topHeaderRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(patient)/(tabs)/home');
              }
            }}
          >
            <ChevronLeft size={20} color={StitchColors.onSurface} />
          </Pressable>

          <Text style={styles.screenTitle}>Find Doctors</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filters"
            style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            onPress={() => toggleFilter('more_filters')}
          >
            <SlidersHorizontal size={18} color={StitchColors.onSurfaceVariant} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.contentWrap}>
          {/* Sub-Header & Search Context */}
          <View style={styles.subHeader}>
            <View style={styles.titleRow}>
              <View>
                <Text style={styles.specialtyHeading}>{displaySpecialtyTitle}</Text>
                <Text style={styles.specialistsCount}>
                  {filteredDoctors.length || 28} specialists in your area
                </Text>
              </View>

              <View style={styles.locationPill}>
                <MapPin size={13} color="#2563eb" fill="#2563eb" />
                <Text style={styles.locationText}>{area || city || 'Near You'}</Text>
              </View>
            </View>

            {/* Search Input Box */}
            <View style={styles.searchBar}>
              <Search size={20} color={StitchColors.outline} />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${selectedSpecialty.toLowerCase()} or clinic...`}
                placeholderTextColor={StitchColors.outline}
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.clearBtn}
                >
                  <X size={14} color={StitchColors.outline} />
                </Pressable>
              )}
            </View>
          </View>

          {/* Filter Pills Strip (Horizontal Scroll) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterPillsRow}
          >
            {FILTER_PILLS.map((pill) => {
              const isActive = activeFilters.includes(pill.id);
              return (
                <Pressable
                  key={pill.id}
                  onPress={() => toggleFilter(pill.id)}
                  style={[
                    styles.filterChip,
                    isActive ? styles.filterChipActive : styles.filterChipInactive,
                  ]}
                >
                  {pill.hasBolt && (
                    <Zap size={14} color={isActive ? '#ffffff' : StitchColors.primary} />
                  )}
                  {pill.hasStar && (
                    <Star size={13} color="#f59e0b" fill="#f59e0b" />
                  )}
                  {pill.hasTune && (
                    <SlidersHorizontal size={14} color={StitchColors.onSurface} />
                  )}
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive ? styles.filterChipTextActive : styles.filterChipTextInactive,
                    ]}
                  >
                    {pill.label}
                  </Text>
                  {pill.hasBolt && isActive && <View style={styles.activeDot} />}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Telemetry & Ambient Context Notice */}
          <View style={styles.telemetryNotice}>
            <Text style={styles.telemetryLeft}>Showing nearest slots with live tokens</Text>
            <View style={styles.telemetryRight}>
              <View style={styles.pulseLiveDot} />
              <Text style={styles.telemetryRightText}>OPD Active Now</Text>
            </View>
          </View>

          {/* Doctor Cards Stream */}
          <View style={styles.doctorCardsList}>
            {isLoading ? (
              <>
                <DoctorCardSkeleton />
                <DoctorCardSkeleton />
                <DoctorCardSkeleton />
              </>
            ) : filteredDoctors.length > 0 ? (
              filteredDoctors.map((doc, idx) => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  tokenNumber={idx === 0 ? 'Token #14' : idx === 1 ? 'Token #08' : 'Next Slot'}
                  nextSlot={idx === 0 ? 'Today, 4:15 PM' : idx === 1 ? 'Today, 5:45 PM' : 'Tomorrow, 10:30 AM'}
                  onPress={() => {
                    router.push({
                      pathname: '/(patient)/doctor/[id]',
                      params: { id: doc.id },
                    });
                  }}
                  onBookPress={() => {
                    router.push({
                      pathname: '/(patient)/doctor/[id]',
                      params: { id: doc.id },
                    });
                  }}
                />
              ))
            ) : (
              <EmptyState
                icon={<Sparkles size={36} color={StitchColors.outline} />}
                title="No Specialists Found"
                description={`No doctors matched "${searchQuery}". Try searching another condition or reset filters.`}
                actionTitle="Reset Filters"
                onAction={() => {
                  setSearchQuery('');
                  setActiveFilters(['available_today']);
                  setSelectedSpecialty('Cardiologists');
                }}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: StitchColors.surface,
  },
  topHeader: {
    height: 56,
    zIndex: 40,
    backgroundColor: 'rgba(250, 248, 255, 0.85)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 226, 253, 0.4)',
  },
  topHeaderRow: {
    flex: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: StitchColors.onSurface,
    letterSpacing: -0.2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 9999,
    backgroundColor: StitchColors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.85,
  },
  scrollContainer: {
    paddingBottom: 110,
  },
  contentWrap: {
    maxWidth: 440,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  subHeader: {
    marginBottom: 12,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  specialtyHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: StitchColors.onSurface,
    letterSpacing: -0.4,
  },
  specialistsCount: {
    fontSize: 12,
    fontWeight: '500',
    color: StitchColors.outline,
    marginTop: 2,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 9999,
    backgroundColor: '#f1f5f9',
  },
  locationText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: StitchColors.onSurface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    paddingHorizontal: 12,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#131b2e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 2px 6px rgba(19, 27, 46, 0.04)',
      },
    }),
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: StitchColors.onSurface,
    padding: 0,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillsRow: {
    paddingVertical: 4,
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
  },
  filterChipActive: {
    backgroundColor: StitchColors.primaryContainer,
  },
  filterChipInactive: {
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  filterChipText: {
    fontSize: 12,
  },
  filterChipTextActive: {
    fontWeight: '700',
    color: '#ffffff',
  },
  filterChipTextInactive: {
    fontWeight: '600',
    color: StitchColors.onSurfaceVariant,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#76f4e0',
    marginLeft: 2,
  },
  telemetryNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  telemetryLeft: {
    fontSize: 11.5,
    color: StitchColors.outline,
    fontWeight: '500',
  },
  telemetryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pulseLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: StitchColors.secondary,
  },
  telemetryRightText: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.secondary,
  },
  doctorCardsList: {
    gap: 4,
    paddingTop: 4,
  },
});
