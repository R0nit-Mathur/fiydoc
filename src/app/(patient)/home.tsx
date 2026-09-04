import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DoctorCard } from '@/components/ui/DoctorCard';
import { AppointmentCard } from '@/components/ui/AppointmentCard';
import { DoctorCardSkeleton } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { useDoctorsQuery } from '@/hooks/queries/useDoctorsQuery';
import { useAppointmentsQuery } from '@/hooks/queries/useAppointmentsQuery';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Stethoscope,
  FileText,
  Search,
  Calendar,
  Bell,
  ShieldCheck,
  ChevronRight,
  MapPin,
} from 'lucide-react-native';

export default function PatientHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: doctors, isLoading: doctorsLoading } = useDoctorsQuery();
  const { data: appointments } = useAppointmentsQuery(user?.id);

  const upcomingApt = appointments?.find(
    (a) => a.status === 'upcoming' || a.status === 'confirmed' || a.status === 'in_progress'
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Top Bar Header */}
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
        <TouchableOpacity
          onPress={() => router.push('/(patient)/profile')}
          activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 12, gap: 10 }}
        >
          <Avatar uri={user?.avatar} name={user?.name || 'Patient'} size="md" />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">
              Welcome back
            </Text>
            <Text
              style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {user?.name || 'Patient User'}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Notification Bell */}
        <TouchableOpacity
          onPress={() => router.push('/(patient)/notifications')}
          activeOpacity={0.8}
          className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/80 items-center justify-center relative"
          style={{ flexShrink: 0 }}
        >
          <Bell size={18} color="#0F172A" />
          <View className="w-2.5 h-2.5 rounded-full bg-[#00B39B] absolute top-1.5 right-1.5 border-2 border-white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 100, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Trigger Bar */}
        <TouchableOpacity
          onPress={() => router.push('/(patient)/discovery')}
          activeOpacity={0.9}
          className="bg-white px-4 py-3 rounded-2xl border border-slate-200/90 shadow-sm flex-row items-center"
          style={{ gap: 10 }}
        >
          <Search size={18} color="#00B39B" />
          <Text className="text-xs font-semibold text-slate-400 flex-1" numberOfLines={1}>
            Search specialists, clinics, or conditions...
          </Text>
        </TouchableOpacity>

        {/* Core Services Action Grid */}
        <View>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 10 }}>
            Healthcare Services
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={() => router.push('/(patient)/discovery')}
              activeOpacity={0.85}
              style={{
                flex: 1,
                minWidth: 0,
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                paddingHorizontal: 12,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                justifyContent: 'space-between',
                minHeight: 106,
                shadowColor: '#000',
                shadowOpacity: 0.03,
                shadowRadius: 5,
                elevation: 1,
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
              <View style={{ marginTop: 8 }}>
                <Text
                  style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Find Specialists
                </Text>
                <Text
                  style={{ fontSize: 10, fontWeight: '600', color: '#64748B', marginTop: 2 }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  In-Clinic Bookings
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(patient)/health/index')}
              activeOpacity={0.85}
              style={{
                flex: 1,
                minWidth: 0,
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                paddingHorizontal: 12,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                justifyContent: 'space-between',
                minHeight: 106,
                shadowColor: '#000',
                shadowOpacity: 0.03,
                shadowRadius: 5,
                elevation: 1,
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
              <View style={{ marginTop: 8 }}>
                <Text
                  style={{ fontSize: 13, fontWeight: '800', color: '#0F172A' }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Medical Records
                </Text>
                <Text
                  style={{ fontSize: 10, fontWeight: '600', color: '#64748B', marginTop: 2 }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Prescriptions & OCR
                </Text>
              </View>
            </TouchableOpacity>
          </View>
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
                onPress={() => router.push('/(patient)/discovery')}
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
            <TouchableOpacity onPress={() => router.push('/(patient)/discovery')}>
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
    </SafeAreaView>
  );
}
