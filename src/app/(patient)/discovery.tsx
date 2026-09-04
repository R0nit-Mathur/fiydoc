import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { DoctorCard } from '@/components/ui/DoctorCard';
import { DoctorCardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useDoctorsQuery } from '@/hooks/queries/useDoctorsQuery';
import {
  Search,
  ArrowLeft,
  Building2,
  X,
  Sparkles,
  Heart,
  Shield,
  Activity,
  UserCheck,
  Stethoscope,
  SlidersHorizontal,
  Star,
} from 'lucide-react-native';

const SPECIALTIES = [
  { name: 'All', icon: Sparkles },
  { name: 'Cardiology', icon: Heart },
  { name: 'Dermatology', icon: Shield },
  { name: 'Neurology', icon: Activity },
  { name: 'Pediatrics', icon: UserCheck },
  { name: 'Orthopedics', icon: Stethoscope },
];

const SORT_OPTIONS = ['Recommended', 'Top Rated', 'Experience', 'Consultation Fee'];

export default function DoctorDiscoveryScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Recommended');

  const { data: doctors, isLoading } = useDoctorsQuery({
    query: searchQuery,
    specialty: selectedSpecialty,
  });

  const handleSafeBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(patient)/home');
    }
  };

  const sortedDoctors = useMemo(() => {
    if (!doctors) return [];
    const list = [...doctors];
    if (selectedSort === 'Top Rated') {
      return list.sort((a, b) => b.rating - a.rating);
    }
    if (selectedSort === 'Experience') {
      return list.sort((a, b) => b.experienceYears - a.experienceYears);
    }
    if (selectedSort === 'Consultation Fee') {
      return list.sort((a, b) => a.consultationFee - b.consultationFee);
    }
    return list;
  }, [doctors, selectedSort]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Premium Header */}
      <View className="px-4 pt-3 pb-2.5 bg-white border-b border-slate-100 shadow-xs" style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, marginRight: 8, gap: 10 }}>
            <TouchableOpacity
              onPress={handleSafeBack}
              activeOpacity={0.7}
              className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center -ml-1"
            >
              <ArrowLeft size={18} color="#0F172A" />
            </TouchableOpacity>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                Verified Specialists
              </Text>
              <Text style={{ fontSize: 11, fontWeight: '500', color: '#64748B' }}>
                Book In-Clinic Physical Consultations
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F0FAF8',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: '#B8EFE7',
              flexShrink: 0,
              gap: 4,
            }}
          >
            <View className="w-1.5 h-1.5 rounded-full bg-[#00B39B]" />
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#00B39B' }}>
              MCI Accredited
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <Input
          placeholder="Search by doctor name, specialty, or clinic..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color="#00B39B" />}
          rightIcon={
            searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : undefined
          }
        />

        {/* Specialty Filter Scrollable Chips with Icons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-0.5">
          <View className="flex-row" style={{ gap: 6 }}>
            {SPECIALTIES.map((item) => {
              const IconComp = item.icon;
              const isSelected = selectedSpecialty === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  onPress={() => setSelectedSpecialty(item.name)}
                  activeOpacity={0.8}
                  className={`flex-row items-center px-3 py-2 rounded-xl border ${
                    isSelected
                      ? 'bg-[#00B39B] border-[#00B39B] shadow-xs'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                  style={{ gap: 5 }}
                >
                  <IconComp size={13} color={isSelected ? '#FFFFFF' : '#64748B'} />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: isSelected ? '800' : '600',
                      color: isSelected ? '#FFFFFF' : '#334155',
                    }}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Secondary Sort & Count Filter Strip */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: '#FFFFFF',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottomWidth: 1,
          borderBottomColor: '#F8FAFC',
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>
          {sortedDoctors.length} Specialists Available
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
          <View className="flex-row" style={{ gap: 4 }}>
            {SORT_OPTIONS.map((opt) => {
              const isSel = selectedSort === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => setSelectedSort(opt)}
                  activeOpacity={0.8}
                  className={`px-2.5 py-1 rounded-lg border ${
                    isSel ? 'bg-slate-900 border-slate-900' : 'bg-slate-100 border-slate-200'
                  }`}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: isSel ? '800' : '600',
                      color: isSel ? '#FFFFFF' : '#475569',
                    }}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Doctor Listings */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 100, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <>
            <DoctorCardSkeleton />
            <DoctorCardSkeleton />
            <DoctorCardSkeleton />
          </>
        ) : sortedDoctors.length === 0 ? (
          <EmptyState
            title="No Specialists Found"
            description="No accredited doctors match your search or specialty filters. Try clearing your filters."
            actionTitle="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedSpecialty('All');
              setSelectedSort('Recommended');
            }}
          />
        ) : (
          sortedDoctors.map((doc) => (
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
