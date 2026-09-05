import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { DoctorCard } from '@/components/ui/DoctorCard';
import { AppointmentCard } from '@/components/ui/AppointmentCard';
import { DoctorCardSkeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { useDoctorsQuery } from '@/hooks/queries/useDoctorsQuery';
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
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  MapPin,
  Menu,
} from 'lucide-react-native';

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

  const { data: doctors, isLoading: doctorsLoading, isRefetching: isDoctorsRefetching, refetch: refetchDoctors } = useDoctorsQuery();
  const { data: appointments, isRefetching: isAptsRefetching, refetch: refetchApts } = useAppointmentsQuery(user?.id);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['doctors'] }),
        queryClient.invalidateQueries({ queryKey: ['appointments'] }),
        refetchDoctors(),
        refetchApts(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, refetchDoctors, refetchApts]);

  const upcomingApt = appointments?.find(
    (a) => a.status === 'upcoming' || a.status === 'confirmed' || a.status === 'in_progress'
  );

  const POPULAR_SPECIALTIES = [
    { name: 'All Doctors', icon: '🩺' },
    { name: 'General Physician', icon: '👨‍⚕️' },
    { name: 'Cardiologist', icon: '❤️' },
    { name: 'Dermatologist', icon: '✨' },
    { name: 'Pediatrician', icon: '👶' },
    { name: 'Orthopedic', icon: '🦴' },
    { name: 'ENT Specialist', icon: '👂' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Top Bar Header - Zomato / Blinkit / Rapido Locality Style */}
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
        {/* Exact Locality Name Trigger */}
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
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100, gap: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isDoctorsRefetching || isAptsRefetching}
            onRefresh={handleRefresh}
            colors={['#00B39B']}
            tintColor="#00B39B"
          />
        }
      >
        {/* Search Trigger Bar - Zomato / Practo Style */}
        <TouchableOpacity
          onPress={() => router.push('/(patient)/(tabs)/discovery')}
          activeOpacity={0.9}
          style={{
            backgroundColor: '#FFFFFF',
            paddingHorizontal: 16,
            paddingVertical: 13,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            shadowColor: '#000',
            shadowOpacity: 0.03,
            shadowRadius: 6,
            elevation: 1,
          }}
        >
          <Search size={18} color="#00B39B" />
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#94A3B8', flex: 1 }} numberOfLines={1}>
            Search doctors, clinics, symptoms (e.g. fever, cardiologist)...
          </Text>
        </TouchableOpacity>

        {/* Core Services Action Grid - Clean 4-Item Grid */}
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
              minHeight: 100,
            }}
          >
            <View
              style={{
                backgroundColor: '#F0FAF8',
                width: 36,
                height: 36,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#B8EFE7',
              }}
            >
              <Stethoscope size={18} color="#00B39B" />
            </View>
            <View style={{ marginTop: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                Book Clinic
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#64748B', marginTop: 1 }} numberOfLines={1}>
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
              minHeight: 100,
            }}
          >
            <View
              style={{
                backgroundColor: '#FAF5FF',
                width: 36,
                height: 36,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#E9D5FF',
              }}
            >
              <FileText size={18} color="#8B5CF6" />
            </View>
            <View style={{ marginTop: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                Digital Rx
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#64748B', marginTop: 1 }} numberOfLines={1}>
                MCI Prescriptions
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
              minHeight: 100,
            }}
          >
            <View
              style={{
                backgroundColor: '#EFF6FF',
                width: 36,
                height: 36,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#BFDBFE',
              }}
            >
              <Calendar size={18} color="#1E58C8" />
            </View>
            <View style={{ marginTop: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                OPD Passes
              </Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#64748B', marginTop: 1 }} numberOfLines={1}>
                Tokens & Status
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Popular Specialties Horizontal Scroll - Practo Style */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>
            Find by Specialty
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {POPULAR_SPECIALTIES.map((spec, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => router.push('/(patient)/(tabs)/discovery')}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                }}
              >
                <Text style={{ fontSize: 14 }}>{spec.icon}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>
                  {spec.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Upcoming In-Clinic Appointment Section */}
        <View>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-black text-slate-900">Upcoming Clinic Visit</Text>
            {upcomingApt && (
              <TouchableOpacity onPress={() => router.push(`/(patient)/appointments/${upcomingApt.id}`)}>
                <Text className="text-xs font-extrabold text-[#00B39B]">View Full Details</Text>
              </TouchableOpacity>
            )}
          </View>

          {upcomingApt ? (
            <View style={{ gap: 8 }}>
              <AppointmentCard
                appointment={upcomingApt}
                onPress={() => router.push(`/(patient)/appointments/${upcomingApt.id}`)}
              />
              <TouchableOpacity
                onPress={() => router.push(`/(patient)/appointments/${upcomingApt.id}`)}
                activeOpacity={0.85}
                className="bg-[#1E58C8] py-3.5 px-4 rounded-2xl flex-row justify-center items-center shadow-sm"
                style={{ gap: 8 }}
              >
                <MapPin size={16} color="#FFFFFF" />
                <Text className="text-xs font-extrabold text-white uppercase tracking-wider">
                  View Clinic Location & Directions
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-white p-6 rounded-3xl border border-slate-200/80 items-center justify-center shadow-sm">
              <View className="w-12 h-12 rounded-2xl bg-slate-100 items-center justify-center mb-2">
                <Calendar size={24} color="#94A3B8" />
              </View>
              <Text className="text-sm font-extrabold text-slate-800 mt-1">No Upcoming Appointments</Text>
              <Text className="text-xs text-slate-400 text-center mt-1 mb-4">
                Schedule an in-clinic consultation with a verified medical specialist.
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(patient)/(tabs)/discovery')}
                activeOpacity={0.8}
                className="bg-[#00B39B] px-5 py-2.5 rounded-xl shadow-sm"
              >
                <Text className="text-xs font-extrabold text-white">Book Clinic Visit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Verified Specialists Section */}
        <View>
          <View className="flex-row justify-between items-center mb-3.5">
            <View className="flex-row items-center flex-1 mr-2" style={{ gap: 6 }}>
              <Text className="text-base font-black text-slate-900 flex-1" numberOfLines={1}>
                Verified Specialists
              </Text>
              <ShieldCheck size={16} color="#00B39B" />
            </View>
            <TouchableOpacity onPress={() => router.push('/(patient)/(tabs)/discovery')}>
              <Text className="text-xs font-extrabold text-[#00B39B]">See All</Text>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 14 }}>
            {doctorsLoading ? (
              <>
                <DoctorCardSkeleton />
                <DoctorCardSkeleton />
              </>
            ) : (
              doctors?.slice(0, 4).map((doc) => (
                <DoctorCard
                  key={doc.id}
                  doctor={doc}
                  onPress={() => router.push(`/(patient)/doctor/${doc.id}`)}
                  onBookPress={() => router.push(`/(patient)/doctor/${doc.id}`)}
                />
              ))
            )}
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
