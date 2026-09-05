import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

export interface LocationHub {
  id: string;
  name: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
}

export const INDIAN_LOCATION_HUBS: LocationHub[] = [
  {
    id: 'hub_mumbai',
    name: 'Bandra West, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.0596,
    longitude: 72.8295,
  },
  {
    id: 'hub_delhi',
    name: 'Connaught Place, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    latitude: 28.6304,
    longitude: 77.2177,
  },
  {
    id: 'hub_bengaluru',
    name: 'Indiranagar, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9784,
    longitude: 77.6408,
  },
  {
    id: 'hub_hyderabad',
    name: 'HITEC City, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4399,
    longitude: 78.3908,
  },
  {
    id: 'hub_chennai',
    name: 'T. Nagar, Chennai',
    city: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 13.0418,
    longitude: 80.2341,
  },
  {
    id: 'hub_pune',
    name: 'Koregaon Park, Pune',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5362,
    longitude: 73.8940,
  },
  {
    id: 'hub_kolkata',
    name: 'Park Street, Kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    latitude: 22.5535,
    longitude: 88.3524,
  },
];

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  area: string;
  city: string;
  formattedAddress: string;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  isLoading: boolean;
  error: string | null;

  detectCurrentLocation: () => Promise<boolean>;
  detectDeviceLocation: () => Promise<boolean>;
  setHub: (hub: LocationHub) => void;
  setManualLocation: (lat: number, lng: number, city: string, address: string, area?: string) => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      latitude: INDIAN_LOCATION_HUBS[0].latitude,
      longitude: INDIAN_LOCATION_HUBS[0].longitude,
      area: INDIAN_LOCATION_HUBS[0].name.split(',')[0].trim(),
      city: INDIAN_LOCATION_HUBS[0].city,
      formattedAddress: INDIAN_LOCATION_HUBS[0].name,
      permissionStatus: 'undetermined',
      isLoading: false,
      error: null,

      detectDeviceLocation: async () => {
        return get().detectCurrentLocation();
      },

      detectCurrentLocation: async () => {
        set({ isLoading: true, error: null });
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            set({
              permissionStatus: 'denied',
              isLoading: false,
              error: 'Location permission denied. Showing default city hub.',
            });
            return false;
          }

          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const { latitude, longitude } = loc.coords;

          // Reverse geocode to exact locality name like Zomato / Blinkit / Rapido
          let cityName = 'Bengaluru';
          let areaName = 'Indiranagar';
          let localityName = 'Indiranagar, Bengaluru';

          try {
            if (Platform.OS === 'web') {
              // Web: Use lightweight reverse geocode without triggering Expo SDK 49 web geocode removal warning
              try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`, {
                  headers: { 'Accept': 'application/json' },
                });
                if (res.ok) {
                  const data = await res.json();
                  const addr = data.address || {};
                  cityName = addr.city || addr.town || addr.state_district || 'Bengaluru';
                  areaName = addr.suburb || addr.neighbourhood || addr.residential || addr.road || cityName;
                  localityName = `${areaName}, ${cityName}`;
                }
              } catch {
                // fall through to closest hub
              }
            } else {
              const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
              if (geocoded && geocoded.length > 0) {
                const place = geocoded[0];
                cityName = place.city || place.subregion || place.district || 'City Center';

                // Extract clean locality / neighborhood name (ignore numbers/pincodes)
                const candidateArea = [
                  place.subregion,
                  place.district,
                  place.street,
                  place.name,
                ].find((val) => {
                  if (!val) return false;
                  const trimmed = val.trim();
                  return trimmed.length > 2 && !/^\d+$/.test(trimmed) && trimmed.toLowerCase() !== cityName.toLowerCase();
                });

                areaName = candidateArea || place.name || cityName;
                localityName = `${areaName}, ${cityName}`;
              }
            }
          } catch (e) {
            // If reverse geocode fails, find closest Indian hub name mathematically
            let closestHub = INDIAN_LOCATION_HUBS[0];
            let minDiff = Infinity;
            for (const hub of INDIAN_LOCATION_HUBS) {
              const diff = Math.hypot(hub.latitude - latitude, hub.longitude - longitude);
              if (diff < minDiff) {
                minDiff = diff;
                closestHub = hub;
              }
            }
            cityName = closestHub.city;
            areaName = closestHub.name.split(',')[0].trim();
            localityName = closestHub.name;
          }

          set({
            latitude,
            longitude,
            area: areaName,
            city: cityName,
            formattedAddress: localityName,
            permissionStatus: 'granted',
            isLoading: false,
            error: null,
          });

          return true;
        } catch (err: any) {
          console.warn('[useLocationStore] Detection error:', err?.message);
          set({
            isLoading: false,
            error: err?.message || 'Could not fetch device location',
          });
          return false;
        }
      },

      setHub: (hub: LocationHub) => {
        set({
          latitude: hub.latitude,
          longitude: hub.longitude,
          area: hub.name.split(',')[0].trim(),
          city: hub.city,
          formattedAddress: hub.name,
          error: null,
        });
      },

      setManualLocation: (latitude: number, longitude: number, city: string, formattedAddress: string, area?: string) => {
        set({
          latitude,
          longitude,
          area: area || formattedAddress.split(',')[0].trim() || city,
          city,
          formattedAddress,
          error: null,
        });
      },
    }),
    {
      name: 'fiydoc-location-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
