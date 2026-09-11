/**
 * Patient Home Screen — Stitch Clinical Clarity
 *
 * Pixel-perfect rebuild from Stitch HTML (patient-home.html)
 *
 * Features:
 * - Slide-out navigation drawer with quick profile & menu
 * - Glassmorphism top header (hamburger + logo + notification bell)
 * - Location selector pill
 * - Greeting header ("Good morning, Rahul")
 * - Interactive Search Box -> Only navigates to dedicated Search Screen (/(patient)/search)
 * - Clear, comfortable vertical spacing (gap: 24) between all components
 * - Upcoming Clinic Visit card (deep royal gradient glassmorphism)
 * - Specialties horizontal scroll
 * - Top Rated In-Clinic Doctors list with live DoctorCard token telemetry
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useAppTheme } from '@/hooks/useAppTheme';
import { useDoctorsQuery } from '@/hooks/queries/useDoctorsQuery';
import { useLocationStore } from '@/store/useLocationStore';
import { LocationPermissionModal } from '@/components/location/LocationPermissionModal';
import { DoctorCard } from '@/components/ui/DoctorCard';
import { signOutAll } from '@/services/authService';
import { BorderRadius, Spacing, StitchColors, Shadows, Palette } from '@/constants/theme';
import {
  Menu,
  Bell,
  MapPin,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Verified,
  Calendar,
  Navigation,
  ChevronRight,
  X,
  Stethoscope,
  Sun,
  Sparkles,
  Heart,
  Baby,
  Activity,
  Eye,
  FileText,
  Users,
  CreditCard,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react-native';

import { SPECIALTIES, ALL_SPECIALTIES } from '@/constants/specialties';
import { AllSpecialtiesModal } from '@/components/patient/AllSpecialtiesModal';
import { FiYLogo } from '@/components/ui/FiYLogo';

const DOCTOR_AVATAR =
  'https://images.unsplash.com/photo-1594824813682-14c1e405a76e?w=600&auto=format&fit=crop&q=80';


export default function PatientHomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [allSpecialtiesModalVisible, setAllSpecialtiesModalVisible] = useState(false);

  const { formattedAddress, city, area, permissionStatus } = useLocationStore();
  const { data: doctors = [] } = useDoctorsQuery();

  // Prompt for location on first visit if permission is undetermined
  useEffect(() => {
    if (permissionStatus === 'undetermined') {
      const timer = setTimeout(() => {
        setLocationModalVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [permissionStatus]);

  const handleOpenSearch = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(patient)/search');
  };

  const displayLocation = formattedAddress || (area ? `${area}, ${city}` : city) || 'Bandra West, Mumbai';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: StitchColors.surface }]} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="rgba(246, 248, 252, 0.85)" />

      {/* Top Header Navigation Bar (iOS Glassmorphism) */}
      <View style={styles.headerWrap}>
        {Platform.OS === 'ios' && (
          <BlurView tint="light" intensity={80} style={StyleSheet.absoluteFill} />
        )}
        <View style={styles.headerBg} />
        <View style={styles.header}>
          <Pressable
            onPress={() => setDrawerOpen(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.headerIconButton,
              pressed && styles.headerIconPressed,
            ]}
            accessibilityLabel="Open Sidebar Menu"
          >
            <Menu size={22} color={StitchColors.onSurface} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(patient)/(tabs)/profile')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FiYLogo size="md" />
          </Pressable>
          <Pressable
            onPress={() => router.push('/(patient)/notifications')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.headerIconButton,
              pressed && styles.headerIconPressed,
            ]}
            accessibilityLabel="Notifications"
          >
            <Bell size={21} color={StitchColors.onSurface} />
            <View style={styles.notifDot} />
          </Pressable>
        </View>
      </View>

      {/* Main Scrollable Content with Gaps between every component */}
      <ScrollView
        style={styles.flex1}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Greeting & Location Header */}
        <View style={styles.greetingSection}>
          <View style={styles.locationRow}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setLocationModalVisible(true);
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={({ pressed }) => [
                styles.locationPill,
                pressed && styles.locationPillPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Current location: ${displayLocation}. Tap to change.`}
            >
              <MapPin size={14} color="#2563eb" fill="#2563eb" />
              <Text style={styles.locationText} numberOfLines={1}>
                {displayLocation}
              </Text>
              <ChevronDown size={14} color="#94a3b8" />
            </Pressable>
          </View>

          <View style={styles.greetingBlock}>
            <Text style={styles.greetingSmall}>Good morning,</Text>
            <Text style={styles.greetingBig}>Rahul</Text>
          </View>

          {/* Dedicated Search Trigger Bar (Only opens /(patient)/search) */}
          <Pressable
            onPress={handleOpenSearch}
            style={({ pressed }) => [
              styles.searchBox,
              pressed && styles.searchBoxPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Click search bar to open dedicated search page"
          >
            <Search size={20} color={StitchColors.primaryContainer} />
            <Text style={styles.searchPlaceholderText}>
              Search doctor, clinic, or specialty...
            </Text>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                router.push('/(patient)/(tabs)/discovery');
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={({ pressed }) => [
                styles.filterButton,
                pressed && styles.filterButtonPressed,
              ]}
              accessibilityLabel="Filters"
            >
              <SlidersHorizontal size={17} color="#475569" />
            </Pressable>
          </Pressable>
        </View>

        {/* 2. Upcoming Clinic Visit Card */}
        <View style={styles.sectionSpacer}>
          <Pressable
            onPress={() => router.push('/(patient)/(tabs)/appointments')}
            style={({ pressed }) => pressed && { transform: [{ scale: 0.99 }] }}
          >
            <Animated.View entering={FadeInDown.delay(60).duration(380)} style={styles.upcomingCard}>
              <View style={styles.upcomingHeader}>
                <View style={styles.upcomingHeaderLeft}>
                  <View style={styles.upcomingPulse} />
                  <Text style={styles.upcomingLabel}>UPCOMING APPOINTMENT</Text>
                </View>
                <View style={styles.confirmedBadge}>
                  <View style={styles.confirmedDot} />
                  <Text style={styles.confirmedText}>Confirmed</Text>
                </View>
              </View>

              <View style={styles.doctorRow}>
                <Image
                  source={{ uri: DOCTOR_AVATAR }}
                  style={styles.doctorAvatar}
                />
                <View style={styles.flex1}>
                  <View style={styles.doctorNameRow}>
                    <Text style={styles.doctorName}>Dr. Ananya Sen, MD</Text>
                    <Verified size={15} color="#5eead4" fill="#5eead4" />
                  </View>
                  <Text style={styles.doctorSpecialty}>
                    Cardiologist • Fortis Hospital OPD
                  </Text>
                  <View style={styles.tokenRow}>
                    <View style={styles.tokenPill}>
                      <Text style={styles.tokenText}>Token #A-14</Text>
                    </View>
                    <Text style={styles.tokenLocation}>Floor 2 • OPD Wing</Text>
                  </View>
                </View>
              </View>

              <View style={styles.upcomingFooter}>
                <View style={styles.upcomingTimeRow}>
                  <Calendar size={18} color="#5eead4" />
                  <Text style={styles.upcomingTime}>Tomorrow, 10:30 AM</Text>
                  <Text style={styles.upcomingType}>(In-Clinic)</Text>
                </View>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push('/(patient)/(tabs)/appointments');
                  }}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={({ pressed }) => [
                    styles.directionsButton,
                    pressed && { transform: [{ scale: 0.95 }] },
                  ]}
                >
                  <Navigation size={14} color="#0c1e4a" />
                  <Text style={styles.directionsText}>Directions</Text>
                </Pressable>
              </View>
            </Animated.View>
          </Pressable>
        </View>

        {/* 3. Find by Specialty Section */}
        <Animated.View entering={FadeInUp.delay(100).duration(380)} style={styles.sectionSpacer}>
          <View style={styles.specialtiesHeader}>
            <View>
              <Text style={styles.specialtiesTitle}>Find by Specialty</Text>
              <Text style={styles.specialtiesSubtitle}>
                Choose a category for in-clinic appointments
              </Text>
            </View>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setAllSpecialtiesModalVisible(true);
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={({ pressed }) => [
                styles.seeAllButton,
                pressed && styles.seeAllButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="View all medical specialties"
            >
              <Text style={styles.seeAllButtonText}>
                See all ({ALL_SPECIALTIES.length})
              </Text>
              <ChevronRight size={13} color={StitchColors.primaryContainer} strokeWidth={2.4} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.specialtiesScroll}
          >
            {SPECIALTIES.map((spec, i) => {
              const Icon = spec.icon;
              return (
                <Pressable
                  key={i}
                  onPress={() =>
                    router.push({
                      pathname: '/(patient)/(tabs)/discovery',
                      params: { specialty: spec.name },
                    })
                  }
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={({ pressed }) => [
                    styles.specialtyCard,
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <View
                    style={[
                      styles.specialtyIcon,
                      { backgroundColor: spec.lightBg },
                    ]}
                  >
                    <Icon size={20} color={spec.color} strokeWidth={2} />
                  </View>
                  <Text style={styles.specialtyName}>{spec.name}</Text>
                  <Text style={styles.specialtyDesc}>{spec.desc}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* 4. Top Rated Doctors Available Today Section */}
        <Animated.View entering={FadeInUp.delay(140).duration(380)} style={styles.sectionSpacer}>
          <View style={styles.specialtiesHeader}>
            <View>
              <Text style={styles.specialtiesTitle}>Top Doctors Available Today</Text>
              <Text style={styles.specialtiesSubtitle}>
                Instant OPD token booking with live queue status
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(patient)/(tabs)/discovery')}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              style={({ pressed }) => [
                styles.seeAllButton,
                pressed && styles.seeAllButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="View all available doctors"
            >
              <Text style={styles.seeAllButtonText}>View All</Text>
              <ChevronRight size={13} color={StitchColors.primaryContainer} strokeWidth={2.4} />
            </Pressable>
          </View>

          <View style={styles.doctorsListContainer}>
            {doctors.slice(0, 3).map((doc, idx) => (
              <DoctorCard
                key={doc.id}
                doctor={doc}
                onPress={() => router.push(`/(patient)/doctor/${doc.id}`)}
                onBookPress={() => router.push(`/(patient)/doctor/${doc.id}`)}
                tokenNumber={`Token #${10 + idx}`}
                nextSlot="Today, 04:15 PM"
              />
            ))}
          </View>
        </Animated.View>

        {/* 5. 24/7 OPD Emergency Helpline Banner */}
        <View style={styles.emergencyCard}>
          <View style={styles.emergencyIconWrap}>
            <PhoneCall size={20} color="#DC2626" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.emergencyTitle}>24x7 Medical & OPD Support</Text>
            <Text style={styles.emergencySub}>Immediate assistance for hospital check-in & triage</Text>
          </View>
          <Pressable
            onPress={() => alert('FiYDOC Emergency Support: Call 1800-200-4455')}
            style={styles.callButton}
          >
            <Text style={styles.callButtonText}>Call</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Slide-out Navigation Drawer */}
      {drawerOpen && (
        <View style={styles.drawerBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDrawerOpen(false)}
            accessibilityLabel="Close drawer"
          />
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={styles.drawerPanel}
          >
            <View style={styles.drawerHeader}>
              <FiYLogo size="md" />
              <Pressable
                onPress={() => setDrawerOpen(false)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                style={styles.drawerClose}
              >
                <X size={19} color={StitchColors.onSurfaceVariant} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => {
                setDrawerOpen(false);
                router.push('/(patient)/(tabs)/profile');
              }}
              style={({ pressed }) => [
                styles.drawerProfileCard,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={styles.drawerAvatar}>
                <Text style={styles.drawerAvatarText}>RK</Text>
              </View>
              <View style={styles.flex1}>
                <View style={styles.drawerNameRow}>
                  <Text style={styles.drawerName}>Rahul Kapoor</Text>
                  <Verified size={16} color="#2563eb" fill="#2563eb" />
                </View>
                <Text style={styles.drawerPhone}>+91 98201 42819 • View Profile</Text>
              </View>
              <ChevronRight size={18} color="#94a3b8" />
            </Pressable>

            <View style={styles.drawerMenu}>
              <Pressable
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/(patient)/(tabs)/health');
                }}
                style={({ pressed }) => [
                  styles.drawerMenuItem,
                  pressed && { backgroundColor: '#f8fafc' },
                ]}
              >
                <View style={[styles.drawerMenuIcon, { backgroundColor: '#EFF6FF' }]}>
                  <FileText size={18} color="#2563eb" />
                </View>
                <Text style={styles.drawerMenuText}>My Health Records</Text>
                <View style={styles.drawerMenuBadge}>
                  <Text style={styles.drawerMenuBadgeText}>3 New</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/(patient)/(tabs)/profile');
                }}
                style={({ pressed }) => [
                  styles.drawerMenuItem,
                  pressed && { backgroundColor: '#f8fafc' },
                ]}
              >
                <View style={[styles.drawerMenuIcon, { backgroundColor: '#F0FDFA' }]}>
                  <Users size={18} color="#0d9488" />
                </View>
                <Text style={styles.drawerMenuText}>Family Members</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/(patient)/(tabs)/discovery');
                }}
                style={({ pressed }) => [
                  styles.drawerMenuItem,
                  pressed && { backgroundColor: '#f8fafc' },
                ]}
              >
                <View style={[styles.drawerMenuIcon, { backgroundColor: '#FFF1F2' }]}>
                  <Heart size={18} color="#e11d48" />
                </View>
                <Text style={styles.drawerMenuText}>Saved Doctors</Text>
                <Text style={{ fontSize: 11, color: '#94a3b8', marginRight: 4 }}>4</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setDrawerOpen(false);
                  router.push('/(patient)/(tabs)/profile');
                }}
                style={({ pressed }) => [
                  styles.drawerMenuItem,
                  pressed && { backgroundColor: '#f8fafc' },
                ]}
              >
                <View style={[styles.drawerMenuIcon, { backgroundColor: '#FFFBEB' }]}>
                  <CreditCard size={18} color="#d97706" />
                </View>
                <Text style={styles.drawerMenuText}>Payment Methods</Text>
              </Pressable>

              <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 6, marginHorizontal: 12 }} />

              <Pressable
                onPress={() => {
                  setDrawerOpen(false);
                  alert('Need assistance? Contact FiYDOC Support: 1800-200-4455 (24x7)');
                }}
                style={({ pressed }) => [
                  styles.drawerMenuItem,
                  pressed && { backgroundColor: '#f8fafc' },
                ]}
              >
                <View style={[styles.drawerMenuIcon, { backgroundColor: '#f1f5f9' }]}>
                  <Sparkles size={18} color="#475569" />
                </View>
                <Text style={styles.drawerMenuText}>Help & Support</Text>
              </Pressable>
            </View>

            {/* Drawer Footer with Log Out */}
            <View style={styles.drawerFooter}>
              <Pressable
                onPress={async () => {
                  setDrawerOpen(false);
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  await signOutAll();
                  router.replace('/(auth)/welcome');
                }}
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <X size={17} color="#e11d48" />
                <Text style={styles.logoutText}>Log Out</Text>
              </Pressable>
              <Text style={styles.versionText}>v2.4.0 iOS</Text>
            </View>
          </Animated.View>
        </View>
      )}

      {/* Location Selector & Permission Modal */}
      <LocationPermissionModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
        onLocationResolved={() => setLocationModalVisible(false)}
      />

      {/* All Specialties Comprehensive Grid Modal */}
      <AllSpecialtiesModal
        visible={allSpecialtiesModalVisible}
        onClose={() => setAllSpecialtiesModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex1: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 16,
    paddingBottom: 120,
    maxWidth: 448,
    alignSelf: 'center',
    width: '100%',
    gap: 24, // Clear, comfortable gap between every component
  },

  /* Header */
  headerWrap: {
    position: 'relative',
    height: 56,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.5)',
  },
  headerBg: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
  },
  header: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  headerIconPressed: {
    backgroundColor: '#f1f5f9',
    transform: [{ scale: 0.95 }],
  },
  brandLogo: {
    height: 27,
    width: 80,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f43f5e',
    borderWidth: 2,
    borderColor: '#ffffff',
  },

  /* Spacing Wrapper */
  sectionSpacer: {
    width: '100%',
  },

  /* Greeting */
  greetingSection: {
    gap: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: '#f1f5f9',
  },
  locationPillPressed: {
    backgroundColor: '#e2e8f0',
    transform: [{ scale: 0.95 }],
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  greetingBlock: {
    marginTop: 2,
  },
  greetingSmall: {
    fontSize: 17,
    color: '#64748b',
    fontWeight: '500',
  },
  greetingBig: {
    fontSize: 36,
    color: '#0f172a',
    fontWeight: '800',
    marginTop: 2,
    lineHeight: 42,
    letterSpacing: -0.5,
  },

  /* Search Trigger Box */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    ...Shadows.subtle,
  },
  searchBoxPressed: {
    backgroundColor: '#F8FAFC',
    transform: [{ scale: 0.99 }],
  },
  searchPlaceholderText: {
    flex: 1,
    fontSize: 14,
    color: StitchColors.outline,
    fontWeight: '500',
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonPressed: {
    backgroundColor: '#e2e8f0',
    transform: [{ scale: 0.95 }],
  },

  /* Upcoming Card */
  upcomingCard: {
    backgroundColor: '#0a2654',
    borderRadius: BorderRadius.xl,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#0d3b82',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 8,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  upcomingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upcomingPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5eead4',
  },
  upcomingLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.6,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(94, 234, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  confirmedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#5eead4',
  },
  confirmedText: {
    fontSize: 10,
    color: '#5eead4',
    fontWeight: '700',
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 12,
  },
  doctorAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  doctorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  doctorSpecialty: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  tokenPill: {
    backgroundColor: 'rgba(94, 234, 212, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tokenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5eead4',
  },
  tokenLocation: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  upcomingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  upcomingTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  upcomingTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  upcomingType: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#5eead4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  directionsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0c1e4a',
  },

  /* Specialties */
  specialtiesHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  specialtiesTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  specialtiesSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 11,
    paddingVertical: 5.5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  seeAllButtonPressed: {
    backgroundColor: '#DBEAFE',
    transform: [{ scale: 0.96 }],
  },
  seeAllButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  specialtiesScroll: {
    gap: 12,
    paddingRight: 16,
    paddingVertical: 2,
  },
  specialtyCard: {
    width: 128,
    backgroundColor: '#ffffff',
    borderRadius: BorderRadius.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    ...Shadows.subtle,
  },
  specialtyIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  specialtyName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  specialtyDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },

  /* Doctors List Container */
  doctorsListContainer: {
    gap: 12,
  },

  /* Emergency Helpline */
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: BorderRadius.xl,
    padding: 14,
    marginBottom: 10,
  },
  emergencyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  emergencySub: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 2,
  },
  callButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  /* Drawer */
  drawerBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    zIndex: 9999,
  },
  drawerPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 28,
    ...Shadows.modal,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  drawerLogo: {
    height: 28,
    width: 85,
  },
  drawerClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: BorderRadius.xl,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    gap: 10,
  },
  drawerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  drawerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  drawerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  drawerPhone: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  drawerMenu: {
    gap: 4,
  },
  drawerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.lg,
    gap: 12,
  },
  drawerMenuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerMenuText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
  },
  drawerMenuBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  drawerMenuBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  drawerFooter: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e11d48',
  },
  versionText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
