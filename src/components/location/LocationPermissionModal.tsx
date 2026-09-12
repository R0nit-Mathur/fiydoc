import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { useLocationStore, INDIAN_LOCATION_HUBS, LocationHub } from '@/store/useLocationStore';
import { Palette, Typography, BorderRadius, Shadows, Spacing, StitchColors } from '@/constants/theme';
import {
  MapPin,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Settings,
  Globe2,
  X,
  Search as SearchIcon,
  ArrowRight,
  PlusCircle,
} from 'lucide-react-native';

interface LocationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationResolved?: () => void;
}

const REGION_FILTERS = ['All', 'Delhi NCR', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Pune'];

export function LocationPermissionModal({
  visible,
  onClose,
  onLocationResolved,
}: LocationPermissionModalProps) {
  const { city, formattedAddress, detectCurrentLocation, setHub, setManualLocation } = useLocationStore();
  const [loading, setLoading] = useState(false);
  const [statusState, setStatusState] = useState<'prompt' | 'denied' | 'blocked'>('prompt');
  const [errorMessage, setErrorMessage] = useState('');
  const [showManualPicker, setShowManualPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState('All');

  const requestNativePermission = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // 1. Check existing permission status first
      const { status: existingStatus, canAskAgain } = await Location.getForegroundPermissionsAsync();

      if (existingStatus === 'granted') {
        const success = await detectCurrentLocation();
        if (success) {
          onLocationResolved?.();
          onClose();
          return;
        }
      }

      // 2. Trigger genuine native OS dialog
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const success = await detectCurrentLocation();
        if (success) {
          onLocationResolved?.();
          onClose();
        } else {
          setErrorMessage('Could not determine coordinates. Please choose or type your city below.');
          setShowManualPicker(true);
        }
      } else {
        if (!canAskAgain && Platform.OS !== 'web') {
          setStatusState('blocked');
          setErrorMessage('Location permission was denied. Please allow location in your device settings or enter your locality manually.');
          setShowManualPicker(true);
        } else {
          setStatusState('denied');
          setErrorMessage('Location permission is needed to show nearby verified doctors.');
          setShowManualPicker(true);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error requesting location permission.');
      setStatusState('denied');
      setShowManualPicker(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHub = (hub: LocationHub) => {
    setHub(hub);
    onLocationResolved?.();
    onClose();
  };

  const handleApplyCustom = (customText: string) => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    const parts = trimmed.split(',').map((p) => p.trim());
    const areaName = parts[0];
    const cityName = parts.length > 1 ? parts[1] : parts[0];

    // Use default coordinates centered in India / major metro
    setManualLocation(28.6139, 77.2090, cityName, trimmed, areaName);
    onLocationResolved?.();
    onClose();
  };

  const openDeviceSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else if (Platform.OS === 'android') {
      Linking.openSettings();
    }
  };

  // Filter hubs based on search input and active region pill
  const filteredHubs = useMemo(() => {
    return INDIAN_LOCATION_HUBS.filter((hub) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        hub.name.toLowerCase().includes(q) ||
        hub.city.toLowerCase().includes(q) ||
        hub.state.toLowerCase().includes(q);

      const matchesRegion =
        activeRegion === 'All' ||
        (activeRegion === 'Delhi NCR' &&
          (hub.state === 'Delhi' || hub.city === 'Noida' || hub.city === 'Gurgaon')) ||
        hub.city.toLowerCase().includes(activeRegion.toLowerCase());

      return matchesQuery && matchesRegion;
    });
  }, [searchQuery, activeRegion]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Close location modal"
          >
            <X size={18} color={Palette.textPrimary} />
          </TouchableOpacity>

          {/* Location Pin Hero Icon */}
          <View style={styles.heroIconBox}>
            <MapPin size={26} color="#ffffff" />
          </View>

          {/* Title & Patient Explanation */}
          <Text style={styles.title}>Find doctors near you</Text>
          <Text style={styles.subtitle}>
            Use your current location or enter your locality to see nearby verified doctors, real-time token queues, and distance estimates.
          </Text>

          {/* Current Address Pill */}
          {formattedAddress && (
            <View style={styles.activePill}>
              <Text style={styles.activePillLabel}>Current Area:</Text>
              <Text style={styles.activePillValue} numberOfLines={1}>
                {formattedAddress}
              </Text>
            </View>
          )}

          {/* Error Message if Denied */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color={Palette.danger} style={{ flexShrink: 0 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Action CTAs */}
          <View style={styles.actionGroup}>
            {statusState === 'blocked' ? (
              <TouchableOpacity
                onPress={openDeviceSettings}
                activeOpacity={0.85}
                style={styles.primaryButton}
              >
                <Settings size={16} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Open Device Settings</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={requestNativePermission}
                disabled={loading}
                activeOpacity={0.85}
                style={styles.primaryButton}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Navigation size={16} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>
                      {statusState === 'denied' ? 'Use Device GPS' : 'Allow Location Access'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Custom Location Picker Toggle */}
            <TouchableOpacity
              onPress={() => setShowManualPicker(!showManualPicker)}
              activeOpacity={0.8}
              style={styles.secondaryButton}
            >
              <Globe2 size={16} color={Palette.textSecondary} />
              <Text style={styles.secondaryButtonText}>
                {showManualPicker ? 'Hide Custom Picker' : 'Search Custom Locality or City'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Custom Locality Search & Hubs Container */}
          {showManualPicker && (
            <View style={styles.hubsContainer}>
              {/* Custom Search Input */}
              <View style={styles.searchBox}>
                <SearchIcon size={16} color={StitchColors.outline} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Type any locality, colony, or city..."
                  placeholderTextColor={Palette.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    if (searchQuery.trim()) {
                      handleApplyCustom(searchQuery);
                    }
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={15} color={Palette.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Fast Region Chips */}
              <View style={styles.regionsWrap}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {REGION_FILTERS.map((region) => {
                    const isSelected = activeRegion === region;
                    return (
                      <TouchableOpacity
                        key={region}
                        onPress={() => setActiveRegion(region)}
                        style={[styles.regionChip, isSelected && styles.regionChipActive]}
                      >
                        <Text style={[styles.regionChipText, isSelected && styles.regionChipTextActive]}>
                          {region}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Scrollable list of matched locations & custom option */}
              <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                <View style={{ gap: 6, paddingVertical: 4 }}>
                  {/* Custom typed address option */}
                  {searchQuery.trim().length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleApplyCustom(searchQuery)}
                      activeOpacity={0.8}
                      style={styles.customApplyItem}
                    >
                      <PlusCircle size={16} color={Palette.healthcareTeal} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.customApplyTitle} numberOfLines={1}>
                          Set as "{searchQuery.trim()}"
                        </Text>
                        <Text style={styles.customApplySub}>
                          Use this custom locality for search
                        </Text>
                      </View>
                      <ArrowRight size={14} color={Palette.healthcareTeal} />
                    </TouchableOpacity>
                  )}

                  {filteredHubs.map((hub) => {
                    const isSelected = city?.toLowerCase() === hub.city.toLowerCase() ||
                      formattedAddress?.toLowerCase().includes(hub.name.toLowerCase());
                    return (
                      <TouchableOpacity
                        key={hub.id}
                        onPress={() => handleSelectHub(hub)}
                        activeOpacity={0.75}
                        style={[styles.hubItem, isSelected && styles.hubItemActive]}
                      >
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={[styles.hubName, isSelected && styles.hubNameActive]}>
                            {hub.name}
                          </Text>
                          <Text style={styles.hubSub}>
                            {hub.city}, {hub.state}
                          </Text>
                        </View>
                        {isSelected && (
                          <CheckCircle2 size={16} color={Palette.healthcareTeal} />
                        )}
                      </TouchableOpacity>
                    );
                  })}

                  {filteredHubs.length === 0 && searchQuery.trim().length === 0 && (
                    <Text style={styles.noResultsText}>No healthcare hubs found for this filter</Text>
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 23, 45, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Palette.card,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    alignItems: 'center',
    position: 'relative',
    ...Shadows.modal,
    borderWidth: 1,
    borderColor: Palette.cardBorderLight,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Palette.background,
  },
  heroIconBox: {
    width: 54,
    height: 54,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: StitchColors.secondary,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: 4,
    fontSize: 19,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    color: Palette.textSecondary,
    lineHeight: 18,
    fontSize: 12.5,
    marginBottom: Spacing.md,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
    maxWidth: '100%',
  },
  activePillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.textMuted,
  },
  activePillValue: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textPrimary,
    flexShrink: 1,
  },
  errorBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.dangerBg,
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Palette.dangerBorder,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: Palette.danger,
    flex: 1,
    fontSize: 11.5,
  },
  actionGroup: {
    width: '100%',
    gap: Spacing.xs + 2,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: Palette.primaryDark,
    borderRadius: BorderRadius.xl,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  primaryButtonText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: BorderRadius.xl,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  hubsContainer: {
    width: '100%',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Palette.cardBorderLight,
    gap: Spacing.xs,
  },
  searchBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.background,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    gap: Spacing.xs + 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    padding: 0,
    color: Palette.textPrimary,
  },
  regionsWrap: {
    paddingVertical: 4,
  },
  regionChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  regionChipActive: {
    backgroundColor: Palette.healthcareTealLight,
    borderColor: Palette.healthcareTeal,
  },
  regionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
  regionChipTextActive: {
    color: Palette.healthcareTeal,
    fontWeight: '700',
  },
  customApplyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    borderRadius: BorderRadius.lg,
    backgroundColor: Palette.healthcareTealLight,
    borderWidth: 1,
    borderColor: Palette.healthcareTealBorder,
    gap: Spacing.sm,
  },
  customApplyTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.healthcareTeal,
  },
  customApplySub: {
    fontSize: 10.5,
    color: Palette.textSecondary,
  },
  hubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  hubItemActive: {
    backgroundColor: Palette.healthcareTealLight,
    borderColor: Palette.healthcareTeal,
  },
  hubName: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  hubNameActive: {
    color: Palette.healthcareTeal,
  },
  hubSub: {
    fontSize: 10,
    color: Palette.textMuted,
  },
  noResultsText: {
    textAlign: 'center',
    fontSize: 11.5,
    color: Palette.textMuted,
    paddingVertical: 12,
  },
});
