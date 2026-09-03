import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { DoctorCard } from '@/components/ui/DoctorCard';
import { DoctorCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDoctorsQuery } from '@/hooks/queries/useDoctorsQuery';
import { Search, ArrowLeft, Building2, X } from 'lucide-react-native';

const SPECIALTIES = [
  'All',
  'Cardiology',
  'Dermatology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
];

export default function DoctorDiscoveryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');

  const { data: doctors, isLoading } = useDoctorsQuery({
    query: searchQuery,
    specialty: selectedSpecialty,
  });

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Search Header */}
      <View className="px-5 py-3.5 bg-white border-b border-slate-100 shadow-sm" style={{ gap: 12 }}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center" style={{ gap: 10 }}>
            <TouchableOpacity onPress={() => router.back()} className="p-1 -ml-1">
              <ArrowLeft size={22} color="#0F172A" />
            </TouchableOpacity>
            <Text className="text-lg font-black text-slate-900">Find Specialists</Text>
          </View>
          <View className="flex-row items-center bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-100">
            <Building2 size={12} color="#1E58C8" />
            <Text className="text-[11px] font-bold text-[#1E58C8] ml-1">In-Clinic Consults</Text>
          </View>
        </View>

        {/* Search Bar */}
        <Input
          placeholder="Search by doctor name, specialty, or clinic..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color="#94A3B8" />}
          rightIcon={
            searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : undefined
          }
        />

        {/* Specialty Filter Scrollable Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pt-1">
          <View className="flex-row" style={{ gap: 8 }}>
            {SPECIALTIES.map((spec) => {
              const isSelected = selectedSpecialty === spec;
              return (
                <TouchableOpacity
                  key={spec}
                  onPress={() => setSelectedSpecialty(spec)}
                  activeOpacity={0.8}
                  className={`px-4 py-2 rounded-2xl border ${
                    isSelected
                      ? 'bg-[#00B39B] border-[#00B39B] shadow-sm'
                      : 'bg-slate-50 border-slate-200/90'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {spec}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Doctor Listings */}
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <>
            <DoctorCardSkeleton />
            <DoctorCardSkeleton />
            <DoctorCardSkeleton />
          </>
        ) : !doctors || doctors.length === 0 ? (
          <EmptyState
            title="No Doctors Found"
            description="No verified specialists match your search criteria. Try clearing filters."
            actionTitle="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedSpecialty('All');
            }}
          />
        ) : (
          doctors.map((doc) => (
            <DoctorCard
              key={doc.id}
              doctor={doc}
              onPress={() => router.push(`/(patient)/doctor/${doc.id}`)}
              onBookPress={() => router.push(`/(patient)/doctor/${doc.id}`)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
