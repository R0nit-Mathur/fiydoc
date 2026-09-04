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
      {/* 1. Top Navigation Bar */}
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
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0, gap: 10 }}>
          <TouchableOpacity
            onPress={handleSafeBack}
            activeOpacity={0.7}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: '#F1F5F9',
              alignItems: 'center',
              justifyContent: 'center',
            }}
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
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#B8EFE7',
            gap: 5,
            flexShrink: 0,
          }}
        >
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#00B39B' }} />
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#00B39B' }}>
            MCI Accredited
          </Text>
        </View>
      </View>

      {/* 2. Spaced Out Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: '#FFFFFF' }}>
        <Input
          placeholder="Search by doctor name, specialty, or clinic..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={18} color="#00B39B" />}
          rightIcon={
            searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : undefined
          }
        />
      </View>

      {/* 3. Specialty Focus Filter Section */}
      <View style={{ backgroundColor: '#FFFFFF', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <SlidersHorizontal size={13} color="#64748B" />
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Medical Specialties
            </Text>
          </View>
          {selectedSpecialty !== 'All' && (
            <TouchableOpacity onPress={() => setSelectedSpecialty('All')}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#00B39B' }}>Reset to All</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {SPECIALTIES.map((item) => {
            const IconComp = item.icon;
            const isSelected = selectedSpecialty === item.name;
            return (
              <TouchableOpacity
                key={item.name}
                onPress={() => setSelectedSpecialty(item.name)}
                activeOpacity={0.8}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 14,
                  borderWidth: 1,
                  backgroundColor: isSelected ? '#00B39B' : '#F8FAFC',
                  borderColor: isSelected ? '#00B39B' : '#E2E8F0',
                  gap: 6,
                  shadowColor: isSelected ? '#00B39B' : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isSelected ? 0.2 : 0,
                  shadowRadius: 4,
                }}
              >
                <IconComp size={14} color={isSelected ? '#FFFFFF' : '#64748B'} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected ? '800' : '600',
                    color: isSelected ? '#FFFFFF' : '#334155',
                  }}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Secondary Sort Bar with Proper Margins */}
      <View
        style={{
          marginHorizontal: 16,
          marginTop: 12,
          marginBottom: 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F0FDFA',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: '#CCFBF1',
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#00B39B' }}>
            {sortedDoctors.length} Specialists
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ gap: 6 }}
        >
          {SORT_OPTIONS.map((opt) => {
            const isSel = selectedSort === opt;
            return (
              <TouchableOpacity
                key={opt}
                onPress={() => setSelectedSort(opt)}
                activeOpacity={0.8}
                style={{
                  paddingHorizontal: 11,
                  paddingVertical: 6,
                  borderRadius: 10,
                  borderWidth: 1,
                  backgroundColor: isSel ? '#0F172A' : '#FFFFFF',
                  borderColor: isSel ? '#0F172A' : '#E2E8F0',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: isSel ? '800' : '600',
                    color: isSel ? '#FFFFFF' : '#475569',
                  }}
                >
                  {opt}
                </Text>
              </TouchableOpacity>
            );
          })}
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
