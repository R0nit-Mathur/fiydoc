import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { AppointmentCard } from '@/components/ui/AppointmentCard';
import { Avatar } from '@/components/ui/Avatar';
import { useAppointmentsQuery } from '@/hooks/queries/useAppointmentsQuery';
import { useAuthStore } from '@/store/useAuthStore';
import { useLocationStore } from '@/store/useLocationStore';
import { LocationPickerModal } from '@/components/location/LocationPickerModal';
import { SidebarDrawer } from '@/components/ui/SidebarDrawer';
import {
  Stethoscope,
  FileText,
  Search,
  Calendar,
  Bell,
  ChevronRight,
  ChevronDown,
  MapPin,
  Menu,
  Video,
  Sparkles,
} from 'lucide-react-native';

interface SpecialtyOption {
  title: string;
  subtitle: string;
  icon: string;
  searchKey: string;
  bg: string;
  border: string;
}

const DOCTOR_SPECIALTIES: SpecialtyOption[] = [
  {
    title: 'General Physician',
    subtitle: 'Fever, cold, headache, cough',
    icon: '🩺',
    searchKey: 'General Medicine',
    bg: '#F0FDFA',
    border: '#CCFBF1',
  },
  {
    title: 'Cardiologist',
    subtitle: 'Heart care, chest pain, BP',
    icon: '❤️',
    searchKey: 'Cardiology',
    bg: '#FEF2F2',
    border: '#FECACA',
  },
  {
    title: 'Dermatologist',
    subtitle: 'Skin rash, acne, hair fall',
    icon: '✨',
    searchKey: 'Dermatology',
    bg: '#FDF4FF',
    border: '#F5D0FE',
  },
  {
    title: 'Pediatrician',
    subtitle: 'Infant & child healthcare',
    icon: '👶',
    searchKey: 'Pediatrics',
    bg: '#EFF6FF',
    border: '#BFDBFE',
  },
  {
    title: 'Orthopedic',
    subtitle: 'Joint, bone & back pain',
    icon: '🦴',
    searchKey: 'Orthopedics',
    bg: '#FFFBEB',
    border: '#FDE68A',
  },
  {
    title: 'ENT Specialist',
    subtitle: 'Ear, nose, throat & sinus',
    icon: '👂',
    searchKey: 'ENT',
    bg: '#F5F3FF',
    border: '#DDD6FE',
  },
  {
    title: 'Gynecologist',
    subtitle: "Women's health & maternity",
    icon: '🤰',
    searchKey: 'Gynecology',
    bg: '#FFF1F2',
    border: '#FECDD3',
  },
  {
    title: 'Dentist',
    subtitle: 'Toothache, gums & braces',
    icon: '🦷',
    searchKey: 'Dentistry',
    bg: '#F0FDF4',
    border: '#BBF7D0',
  },
];

export default function PatientHomeScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { city, formattedAddress, area, detectDeviceLocation } = useLocationStore();

  useEffect(() => {
    if (!city) {
      detectDeviceLocation();
    }
  }, []);

  const { data: appointments, isRefetching: isAptsRefetching, refetch: refetchApts } = useAppointmentsQuery(user?.id);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['doctors'] }),
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        refetchApts(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, refetchApts]);

  const upcomingApt = appointments?.find(
    (a) => a.status === 'upcoming' || a.status === 'confirmed' || a.status === 'in_progress'
  );

  const userName = user?.name ? user.name.split(' ')[0] : 'there';

  const handleSelectSpecialty = (searchKey: string) => {
    router.push({
      pathname: '/(patient)/(tabs)/discovery',
      params: { specialty: searchKey },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FAFC' }} edges={['top']}>
      {/* Top Bar Header - Zomato / Blinkit Style */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#F1F5F9',
        }}
      >
        {/* Exact Locality Selector */}
        <TouchableOpacity
          onPress={() => setLocationModalVisible(true)}
          activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, marginRight: 12 }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: '#EFF6FF',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MapPin size={20} color="#0B3064" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }} numberOfLines={1}>
                {area || city || 'Select Locality'}
              </Text>
              <ChevronDown size={14} color="#64748B" />
            </View>
            <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }} numberOfLines={1}>
              {formattedAddress || `${city}, India`}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Action Controls: Notifications & Sidebar Profile */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <TouchableOpacity
            onPress={() => router.push('/(patient)/notifications')}
            activeOpacity={0.8}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: '#F8FAFC',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Bell size={18} color="#0F172A" />
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#00B39B',
                position: 'absolute',
                top: 8,
                right: 8,
                borderWidth: 1.5,
                borderColor: '#FFFFFF',
              }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setDrawerVisible(true)}
            activeOpacity={0.8}
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: '#F8FAFC',
              borderWidth: 1,
              borderColor: '#E2E8F0',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Menu size={20} color="#0B3064" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 110, gap: 18 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isAptsRefetching}
            onRefresh={handleRefresh}
            colors={['#00B39B']}
            tintColor="#00B39B"
          />
        }
      >
        {/* Warm Welcome Greeting & Direct Question */}
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#00B39B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              👋 Hello, {userName}
            </Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '900', color: '#0A2540', lineHeight: 30, letterSpacing: -0.4 }}>
            What kind of doctor are you looking for?
          </Text>
          <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500', marginTop: 2 }}>
            Tap a specialty below or search symptoms for 1-tap clinic booking.
          </Text>
        </View>

        {/* Clean Prominent Search Input Bar */}
        <TouchableOpacity
          onPress={() => router.push('/(patient)/(tabs)/discovery')}
          activeOpacity={0.9}
          style={{
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderRadius: 18,
            borderWidth: 1.5,
            borderColor: '#E2E8F0',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            shadowColor: '#000',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Search size={20} color="#00B39B" />
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#94A3B8', flex: 1 }} numberOfLines={1}>
            Search 'fever', 'headache', 'skin', or clinic...
          </Text>
        </TouchableOpacity>

        {/* Core Services Strip - Clean & Direct */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.push('/(patient)/(tabs)/discovery')}
            activeOpacity={0.85}
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 12,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              justifyContent: 'space-between',
              minHeight: 92,
            }}
          >
            <View
              style={{
                backgroundColor: '#F0FAF8',
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#B8EFE7',
              }}
            >
              <Stethoscope size={17} color="#00B39B" />
            </View>
            <View style={{ marginTop: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                Book Clinic
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#64748B' }} numberOfLines={1}>
                In-person OPD
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(patient)/(tabs)/health')}
            activeOpacity={0.85}
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 12,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              justifyContent: 'space-between',
              minHeight: 92,
            }}
          >
            <View
              style={{
                backgroundColor: '#FAF5FF',
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#E9D5FF',
              }}
            >
              <FileText size={17} color="#8B5CF6" />
            </View>
            <View style={{ marginTop: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                Digital Rx
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#64748B' }} numberOfLines={1}>
                Prescriptions
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(upcomingApt ? (`/(patient)/appointments/${upcomingApt.id}` as any) : '/(patient)/(tabs)/discovery')}
            activeOpacity={0.85}
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 12,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              justifyContent: 'space-between',
              minHeight: 92,
            }}
          >
            <View
              style={{
                backgroundColor: '#EFF6FF',
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#BFDBFE',
              }}
            >
              <Calendar size={17} color="#1E58C8" />
            </View>
            <View style={{ marginTop: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                OPD Passes
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#64748B' }} numberOfLines={1}>
                Queue Tokens
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Active Upcoming Clinic Visit (Only shown when active appointment exists) */}
        {upcomingApt && (
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>
                Next Clinic Appointment
              </Text>
              <TouchableOpacity onPress={() => router.push(`/(patient)/appointments/${upcomingApt.id}`)}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#00B39B' }}>View Pass →</Text>
              </TouchableOpacity>
            </View>
            <AppointmentCard
              appointment={upcomingApt}
              onPress={() => router.push(`/(patient)/appointments/${upcomingApt.id}`)}
            />
          </View>
        )}

        {/* Doctor Specialties Grid - The Core Focus */}
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '900', color: '#0A2540' }}>
              Medical Specialties
            </Text>
            <TouchableOpacity onPress={() => router.push('/(patient)/(tabs)/discovery')}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#00B39B' }}>
                View All →
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2-Column Responsive Card Grid */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {DOCTOR_SPECIALTIES.map((spec, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleSelectSpecialty(spec.searchKey)}
                activeOpacity={0.82}
                style={{
                  width: '48.5%',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 18,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  justifyContent: 'space-between',
                  minHeight: 112,
                  shadowColor: '#000',
                  shadowOpacity: 0.02,
                  shadowRadius: 4,
                  elevation: 1,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: spec.bg,
                    borderWidth: 1,
                    borderColor: spec.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 20 }}>{spec.icon}</Text>
                </View>

                <View style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                    {spec.title}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: '500', color: '#64748B', marginTop: 2 }} numberOfLines={2}>
                    {spec.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <LocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />

      <SidebarDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onOpenLocationPicker={() => setLocationModalVisible(true)}
      />
    </SafeAreaView>
  );
}
