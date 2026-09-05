import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDoctorDetailQuery } from '@/hooks/queries/useDoctorsQuery';
import { useAppointmentStore } from '@/store/useAppointmentStore';

export default function DoctorDirectBookingRedirect() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: doctor } = useDoctorDetailQuery(id as string);

  useEffect(() => {
    if (doctor) {
      useAppointmentStore.getState().setBookingDoctor(doctor);
      router.replace({
        pathname: '/(patient)/booking/slot-select',
        params: { doctorId: doctor.id },
      });
    }
  }, [doctor]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#00B39B" />
    </View>
  );
}
