/**
 * FiYDOC - Dedicated Patient Search Screen (Google Stitch 1:1)
 *
 * Exclusively accessible by clicking the search bar on the Patient Home Screen.
 *
 * Features:
 * - Immediate auto-focused search bar with instant clear button
 * - Recent Searches tags with one-tap query trigger and clear option
 * - Common Symptoms & Reasons quick filters (Fever, Chest Pain, Skin Allergy, etc.)
 * - Popular Clinics & Hospital OPDs nearby
 * - Real-time doctor search results using live `useDoctorsQuery`
 * - 1:1 Stitch DoctorCard integration with live token telemetry
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Search as SearchIcon,
  X,
  MapPin,
  Clock,
  Sparkles,
  HeartPulse,
  Stethoscope,
  Bone,
  Smile,
  Baby,
  Activity,
  Building2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';

import { useDoctorsQuery } from '@/hooks/queries/useDoctorsQuery';
import { DoctorCard } from '@/components/ui/DoctorCard';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useLocationStore } from '@/store/useLocationStore';
import { LocationPermissionModal } from '@/components/location/LocationPermissionModal';
import { BorderRadius, Shadows, Spacing, StitchColors, Palette } from '@/constants/theme';
import { Doctor } from '@/types/index';

const RECENT_SEARCHES = [
  'Cardiologist',
  'Chest Pain',
  'General Physician',
  'Dentist',
  'Skin Specialist',
];

const SYMPTOM_TAGS = [
  { label: 'Chest Discomfort', icon: HeartPulse, color: '#EF4444', bg: '#FEE2E2', query: 'Cardiologist' },
  { label: 'Fever & Cold', icon: Stethoscope, color: '#3B82F6', bg: '#DBEAFE', query: 'General Physician' },
  { label: 'Skin Rash & Acne', icon: Sparkles, color: '#10B981', bg: '#D1FAE5', query: 'Dermatologist' },
  { label: 'Joint & Back Pain', icon: Bone, color: '#8B5CF6', bg: '#EDE9FE', query: 'Orthopedic' },
  { label: 'Dental & Toothache', icon: Smile, color: '#0891b2', bg: '#ECFEFF', query: 'Dentist' },
];

const POPULAR_CLINICS = [
  { name: 'City Hospital OPD', area: 'Healthcare Enclave', distance: '0.8 km', tokenWait: '15m wait' },
  { name: 'Max Super Speciality', area: 'Medical District', distance: '1.4 km', tokenWait: '20m wait' },
  { name: 'Apollo Spectra Clinic', area: 'Central OPD Block', distance: '2.3 km', tokenWait: 'No wait' },
];

const FILTER_PILLS = [
  'All',
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Dentist',
  'Pediatrician',
  'Orthopedic',
  'Gynecologist',
  'Eye Specialist',
];

export default function SearchScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { formattedAddress, city, area } = useLocationStore();

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [recentList, setRecentList] = useState<string[]>(RECENT_SEARCHES);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const { data: doctors = [], isLoading } = useDoctorsQuery();

  const displayLocation = formattedAddress || (area ? `${area}, ${city}` : city) || 'Bandra West, Mumbai';

  const handleSelectRecent = (term: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setQuery(term);
  };

  const handleClearRecent = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRecentList([]);
  };

  // Helper to extract numeric distance in km
  const getDistanceNum = (doc: Doctor) => {
    if (typeof doc.distanceKm === 'number') return doc.distanceKm;
    const rawDist = (doc as any).distance;
    if (typeof rawDist === 'string') {
      const match = rawDist.match(/([0-9.]+)/);
      if (match) return parseFloat(match[1]);
    }
    return 999;
  };

  // Filtered doctors list sorted in increasing order of distance (nearest first)
  const filteredDoctors = useMemo(() => {
    return doctors
      .filter((doc) => {
        const q = query.toLowerCase().trim();
        const matchQuery =
          !q ||
          doc.name.toLowerCase().includes(q) ||
          doc.specialty.toLowerCase().includes(q) ||
          doc.hospital.toLowerCase().includes(q);

        const matchCategory =
          activeCategory === 'All' ||
          doc.specialty.toLowerCase().includes(activeCategory.toLowerCase());

        return matchQuery && matchCategory;
      })
      .sort((a, b) => getDistanceNum(a) - getDistanceNum(b));
  }, [doctors, query, activeCategory]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Top Search Bar with Back & Clear */}
      <View style={[styles.headerBar, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.backButton, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.2} />
        </Pressable>

        <View style={[styles.searchBox, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
          <SearchIcon size={18} color={StitchColors.primaryContainer} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search doctors, specialties, clinics..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearButton}
            >
              <X size={16} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Sub-header: Dynamic Location context (No hardcoded radius, tap to change) */}
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setLocationModalVisible(true);
        }}
        style={[styles.locationStrip, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderBottomColor: colors.border }]}
        accessibilityRole="button"
        accessibilityLabel="Change location"
      >
        <View style={styles.locationContent}>
          <MapPin size={13} color={StitchColors.primaryContainer} fill={StitchColors.primaryContainer} />
          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
            Searching near <Text style={{ color: colors.text, fontWeight: '700' }}>{displayLocation}</Text>
          </Text>
        </View>
        <Text style={styles.changeLocationText}>Change</Text>
      </Pressable>

      {/* Horizontal Category Filter Pills */}
      <View style={styles.filterPillsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsContainer}
        >
          {FILTER_PILLS.map((pill) => {
            const isSelected = activeCategory === pill;
            return (
              <Pressable
                key={pill}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.selectionAsync();
                  }
                  setActiveCategory(pill);
                }}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? StitchColors.primaryContainer : colors.backgroundElement,
                    borderColor: isSelected ? StitchColors.primaryContainer : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {pill}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Search Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* If query is empty, show Recent Searches & Quick Symptom Tags */}
        {!query.trim() && (
          <>
            {/* Recent Searches */}
            {recentList.length > 0 && (
              <Animated.View entering={FadeInUp.duration(300)} style={styles.sectionBlock}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionTitleRow}>
                    <Clock size={15} color={colors.textMuted} />
                    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>RECENT SEARCHES</Text>
                  </View>
                  <Pressable onPress={handleClearRecent}>
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </Pressable>
                </View>

                <View style={styles.recentTagsWrap}>
                  {recentList.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => handleSelectRecent(item)}
                      style={[styles.recentTag, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
                    >
                      <Text style={[styles.recentTagText, { color: colors.text }]}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Quick Symptoms & Clinical Reasons */}
            <Animated.View entering={FadeInUp.delay(50).duration(300)} style={styles.sectionBlock}>
              <View style={styles.sectionTitleRow}>
                <TrendingUp size={15} color={StitchColors.primaryContainer} />
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SEARCH BY SYMPTOMS & REASON</Text>
              </View>

              <View style={styles.symptomsGrid}>
                {SYMPTOM_TAGS.map((sym) => {
                  const Icon = sym.icon;
                  return (
                    <Pressable
                      key={sym.label}
                      onPress={() => handleSelectRecent(sym.query)}
                      style={[styles.symptomCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    >
                      <View style={[styles.symptomIconWrap, { backgroundColor: sym.bg }]}>
                        <Icon size={18} color={sym.color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.symptomLabel, { color: colors.text }]}>{sym.label}</Text>
                        <Text style={[styles.symptomSub, { color: colors.textSecondary }]}>Find {sym.query}</Text>
                      </View>
                      <ChevronRight size={16} color={colors.textMuted} />
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            {/* Popular Clinics Nearby */}
            <Animated.View entering={FadeInUp.delay(100).duration(300)} style={styles.sectionBlock}>
              <View style={styles.sectionTitleRow}>
                <Building2 size={15} color={colors.textMuted} />
                <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>POPULAR CLINICS & OPDS</Text>
              </View>

              <View style={styles.clinicsList}>
                {POPULAR_CLINICS.map((clinic) => (
                  <Pressable
                    key={clinic.name}
                    onPress={() => handleSelectRecent(clinic.name.split(' ')[0])}
                    style={[styles.clinicRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.clinicIconBox, { backgroundColor: '#E0F2FE' }]}>
                      <Building2 size={18} color={StitchColors.primaryContainer} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.clinicName, { color: colors.text }]}>{clinic.name}</Text>
                      <Text style={[styles.clinicArea, { color: colors.textSecondary }]}>{clinic.area} • {clinic.distance}</Text>
                    </View>
                    <View style={styles.tokenWaitPill}>
                      <Text style={styles.tokenWaitText}>{clinic.tokenWait}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          </>
        )}

        {/* Live Search Results Header */}
        <View style={styles.resultsHeaderRow}>
          <Text style={[styles.resultsCountText, { color: colors.text }]}>
            {isLoading ? 'Searching doctors...' : `${filteredDoctors.length} Doctor${filteredDoctors.length === 1 ? '' : 's'} Found`}
          </Text>
          {query.trim().length > 0 && (
            <Text style={[styles.queryActiveTag, { color: StitchColors.primaryContainer }]}>
              for "{query}"
            </Text>
          )}
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color={StitchColors.primaryContainer} />
            <Text style={[styles.loadingSub, { color: colors.textSecondary }]}>Finding verified doctors nearby...</Text>
          </View>
        )}

        {/* Doctor Results List */}
        {!isLoading && filteredDoctors.length > 0 && (
          <View style={styles.doctorsListWrap}>
            {filteredDoctors.map((doc, idx) => (
              <Animated.View
                key={doc.id}
                entering={FadeInUp.delay(idx * 40).duration(280)}
                style={styles.doctorCardItem}
              >
                <DoctorCard
                  doctor={doc}
                  onPress={() => router.push(`/(patient)/doctor/${doc.id}`)}
                  onBookPress={() => router.push(`/(patient)/doctor/${doc.id}`)}
                  tokenNumber={`Token #${10 + idx}`}
                  nextSlot="Today, 04:15 PM"
                />
              </Animated.View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!isLoading && filteredDoctors.length === 0 && (
          <View style={[styles.emptyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <SearchIcon size={36} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Doctors Matching "{query}"</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Try searching with another specialty (e.g. Cardiologist, Dentist) or clear filters.
            </Text>
            <Pressable
              onPress={() => {
                setQuery('');
                setActiveCategory('All');
              }}
              style={[styles.clearFilterBtn, { backgroundColor: StitchColors.primaryContainer }]}
            >
              <Text style={styles.clearFilterBtnText}>View All Doctors</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Location Selection & Custom Picker Modal */}
      <LocationPermissionModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
  },

  locationStrip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 10,
  },
  locationText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  changeLocationText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },

  filterPillsWrapper: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(226, 232, 240, 0.4)',
  },
  filterPillsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
  },

  scrollContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 40,
  },

  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: StitchColors.primaryContainer,
  },

  recentTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentTag: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  recentTagText: {
    fontSize: 12,
    fontWeight: '600',
  },

  symptomsGrid: {
    gap: 8,
  },
  symptomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    ...Shadows.subtle,
  },
  symptomIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symptomLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  symptomSub: {
    fontSize: 11,
    marginTop: 2,
  },

  clinicsList: {
    gap: 8,
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    ...Shadows.subtle,
  },
  clinicIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicName: {
    fontSize: 13,
    fontWeight: '700',
  },
  clinicArea: {
    fontSize: 11,
    marginTop: 2,
  },
  tokenWaitPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  tokenWaitText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },

  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  resultsCountText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  queryActiveTag: {
    fontSize: 12,
    fontWeight: '600',
  },

  centerLoading: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  loadingSub: {
    fontSize: 12,
  },

  doctorsListWrap: {
    gap: 14,
  },
  doctorCardItem: {
    width: '100%',
  },

  emptyBox: {
    alignItems: 'center',
    padding: 30,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    gap: 10,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  clearFilterBtn: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  clearFilterBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
