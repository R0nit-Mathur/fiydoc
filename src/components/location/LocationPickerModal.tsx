import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Modal } from '@/components/ui/Modal';
import { useLocationStore, INDIAN_LOCATION_HUBS, LocationHub } from '@/store/useLocationStore';
import { MapPin, Navigation, CheckCircle2, Globe2 } from 'lucide-react-native';

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectHub?: (hub: LocationHub) => void;
}

export function LocationPickerModal({ visible, onClose, onSelectHub }: LocationPickerModalProps) {
  const {
    city,
    formattedAddress,
    isLoading,
    error,
    detectCurrentLocation,
    setHub,
  } = useLocationStore();

  const handleUseGps = async () => {
    const success = await detectCurrentLocation();
    if (success) {
      onClose();
    }
  };

  const handleSelectCity = (hub: LocationHub) => {
    setHub(hub);
    if (onSelectHub) {
      onSelectHub(hub);
    }
    onClose();
  };

  return (
    <Modal visible={visible} onClose={onClose} title="Select Your Location">
      <View style={{ gap: 14, paddingVertical: 4 }}>
        {/* Active Detected Location Card */}
        <View
          style={{
            backgroundColor: '#F0FDFA',
            borderWidth: 1,
            borderColor: '#CCFBF1',
            borderRadius: 18,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              backgroundColor: '#00B39B',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MapPin size={20} color="#FFFFFF" />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#00B39B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Current Active Location
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 2 }} numberOfLines={1}>
              {formattedAddress}
            </Text>
            <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
              Clinic proximity is computed relative to this area.
            </Text>
          </View>
        </View>

        {/* GPS Auto-Detect Button */}
        <TouchableOpacity
          onPress={handleUseGps}
          activeOpacity={0.8}
          disabled={isLoading}
          style={{
            backgroundColor: '#0F172A',
            borderRadius: 16,
            paddingVertical: 13,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Navigation size={17} color="#2DD4BF" />
          )}
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
            {isLoading ? 'Detecting via Device GPS...' : 'Use Current Device GPS Location'}
          </Text>
        </TouchableOpacity>

        {error ? (
          <View style={{ backgroundColor: '#FFF1F2', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#FECDD3' }}>
            <Text style={{ fontSize: 11, color: '#BE123C', fontWeight: '600', textAlign: 'center' }}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* Indian Medical City Hubs */}
        <View style={{ gap: 8, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Globe2 size={15} color="#64748B" />
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Major Indian Medical Hubs
            </Text>
          </View>

          <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 8 }}>
              {INDIAN_LOCATION_HUBS.map((hub) => {
                const isSelected = city.toLowerCase() === hub.city.toLowerCase();
                return (
                  <TouchableOpacity
                    key={hub.id}
                    onPress={() => handleSelectCity(hub)}
                    activeOpacity={0.75}
                    style={{
                      backgroundColor: isSelected ? '#F0FDFA' : '#F8FAFC',
                      borderWidth: 1,
                      borderColor: isSelected ? '#00B39B' : '#E2E8F0',
                      borderRadius: 14,
                      paddingHorizontal: 14,
                      paddingVertical: 11,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: isSelected ? '#00B39B' : '#0F172A' }} numberOfLines={1}>
                        {hub.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                        {hub.city}, {hub.state}
                      </Text>
                    </View>

                    {isSelected && (
                      <CheckCircle2 size={17} color="#00B39B" fill="#CCFBF1" style={{ flexShrink: 0 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
