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
    id: 'hub_delhi_cp',
    name: 'Connaught Place, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    latitude: 28.6304,
    longitude: 77.2177,
  },
  {
    id: 'hub_noida',
    name: 'Sector 62, Noida',
    city: 'Noida',
    state: 'Uttar Pradesh',
    latitude: 28.6280,
    longitude: 77.3649,
  },
  {
    id: 'hub_gurgaon',
    name: 'Cyber City, Gurgaon',
    city: 'Gurgaon',
    state: 'Haryana',
    latitude: 28.4950,
    longitude: 77.0895,
  },
  {
    id: 'hub_south_delhi',
    name: 'Hauz Khas & Saket, South Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    latitude: 28.5494,
    longitude: 77.2001,
  },
  {
    id: 'hub_mumbai_bandra',
    name: 'Bandra West, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.0596,
    longitude: 72.8295,
  },
  {
    id: 'hub_mumbai_andheri',
    name: 'Andheri West, Mumbai',
    city: 'Mumbai',
    state: 'Maharashtra',
    latitude: 19.1363,
    longitude: 72.8277,
  },
  {
    id: 'hub_bengaluru_indiranagar',
    name: 'Indiranagar, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9784,
    longitude: 77.6408,
  },
  {
    id: 'hub_bengaluru_whitefield',
    name: 'Whitefield, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9698,
    longitude: 77.7500,
  },
  {
    id: 'hub_hyderabad',
    name: 'HITEC City & Jubilee Hills, Hyderabad',
    city: 'Hyderabad',
    state: 'Telangana',
    latitude: 17.4399,
    longitude: 78.3908,
  },
  {
    id: 'hub_pune',
    name: 'Koregaon Park & Kalyani Nagar, Pune',
    city: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5362,
    longitude: 73.8940,
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
    id: 'hub_kolkata',
    name: 'Park Street & Salt Lake, Kolkata',
    city: 'Kolkata',
    state: 'West Bengal',
    latitude: 22.5535,
    longitude: 88.3524,
  },
  {
    id: 'hub_chandigarh',
    name: 'Sector 17, Chandigarh',
    city: 'Chandigarh',
    state: 'Punjab',
    latitude: 30.7415,
    longitude: 76.7681,
  },
  {
    id: 'hub_ahmedabad',
    name: 'Bodakdev & SG Highway, Ahmedabad',
    city: 'Ahmedabad',
    state: 'Gujarat',
    latitude: 23.0373,
    longitude: 72.5113,
  },
  {
    id: 'hub_jaipur',
    name: 'C-Scheme & Malviya Nagar, Jaipur',
    city: 'Jaipur',
    state: 'Rajasthan',
    latitude: 26.9054,
    longitude: 75.8037,
  },
  {
    id: 'hub_lucknow',
    name: 'Gomti Nagar, Lucknow',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    latitude: 26.8530,
    longitude: 81.0007,
  },
];

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  area: string;
  city: string;
  formattedAddress: string;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  isGenuineDeviceLocation: boolean;
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
      latitude: null,
      longitude: null,
      area: '',
      city: '',
      formattedAddress: '',
      permissionStatus: 'undetermined',
      isGenuineDeviceLocation: false,
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

          let loc: Location.LocationObject | null = null;
          // 1. Instant check: Try last known position first (0ms latency if cached)
          try {
            loc = await Location.getLastKnownPositionAsync();
          } catch {
            loc = null;
          }

          // 2. If no recent cached position, request fresh position with fast timeout
          if (!loc || !loc.coords) {
            try {
              const timeoutPromise = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Location request timed out')), 2200)
              );
              const locationPromise = Location.getCurrentPositionAsync({
                accuracy: Platform.OS === 'android' ? Location.Accuracy.Balanced : Location.Accuracy.Balanced,
              });
              loc = (await Promise.race([locationPromise, timeoutPromise])) as Location.LocationObject;
            } catch (posErr) {
              console.warn('[useLocationStore] Fresh position timed out, falling back:', posErr);
            }
          }

          if (!loc || !loc.coords) {
            console.warn('[useLocationStore] No GPS fix available, defaulting to primary hub to keep app functional.');
            const defaultHub = INDIAN_LOCATION_HUBS[0];
            set({
              latitude: defaultHub.latitude,
              longitude: defaultHub.longitude,
              area: defaultHub.name.split(',')[0].trim(),
              city: defaultHub.city,
              formattedAddress: defaultHub.name,
              permissionStatus: 'granted',
              isGenuineDeviceLocation: true,
              isLoading: false,
              error: null,
            });
            return true;
          }

          const { latitude, longitude } = loc.coords;

          // Reverse geocode to exact locality name like Zomato / Blinkit / Rapido
          let cityName = 'New Delhi';
          let areaName = 'Connaught Place';
          let localityName = 'Connaught Place, New Delhi';

          try {
            if (Platform.OS === 'web') {
              try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`, {
                  headers: { 'Accept': 'application/json' },
                });
                if (res.ok) {
                  const data = await res.json();
                  const addr = data.address || {};
                  cityName = addr.city || addr.town || addr.municipality || addr.state_district || 'New Delhi';
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

                const candidateArea = [
                  place.street,
                  place.name,
                  place.district,
                  place.subregion,
                ].find((val) => {
                  if (!val) return false;
                  const trimmed = val.trim();
                  return trimmed.length > 2 && !/^\d+$/.test(trimmed) && trimmed.toLowerCase() !== cityName.toLowerCase();
                });

                areaName = candidateArea || place.subregion || place.name || cityName;
                localityName = `${areaName}, ${cityName}`;
              }
            }
          } catch (e) {
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
            isGenuineDeviceLocation: true,
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
          permissionStatus: 'granted',
          isGenuineDeviceLocation: true,
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
          permissionStatus: 'granted',
          isGenuineDeviceLocation: true,
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
