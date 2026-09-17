import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Linking,
  AppState,
  AppStateStatus,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { useLocationStore, INDIAN_LOCATION_HUBS, LocationHub } from '@/store/useLocationStore';
import { Palette, Typography, BorderRadius, Shadows, Spacing, StitchColors } from '@/constants/theme';
import {
  MapPin,
  Navigation,
  AlertCircle,
  Settings,
  X,
  RefreshCw,
  Globe2,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react-native';

interface LocationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onLocationResolved?: () => void;
}

export function LocationPermissionModal({
  visible,
  onClose,
  onLocationResolved,
}: LocationPermissionModalProps) {
  const {
    formattedAddress,
    detectCurrentLocation,
    permissionStatus,
    isGenuineDeviceLocation,
    setHub,
  } = useLocationStore();

  const [loading, setLoading] = useState(false);
  const [statusState, setStatusState] = useState<'prompt' | 'denied' | 'blocked'>('prompt');
  const [errorMessage, setErrorMessage] = useState('');
  const [showManualHubs, setShowManualHubs] = useState(false);

  const isLocationResolved = Boolean(
    useLocationStore.getState().latitude &&
    useLocationStore.getState().longitude &&
    permissionStatus === 'granted' &&
    isGenuineDeviceLocation
  );

  const checkAndResolveLocation = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // 1. Check if location services are enabled on device hardware (native only)
      if (Platform.OS !== 'web') {
        try {
          const servicesEnabled = await Location.hasServicesEnabledAsync();
          if (!servicesEnabled) {
            setStatusState('blocked');
            setErrorMessage(
              'Location services are disabled on your device. Turn on Location in Device Settings to proceed.'
            );
            setLoading(false);
            return;
          }
        } catch (servErr) {
          console.warn('[LocationModal] hasServicesEnabledAsync warning:', servErr);
        }
      }

      // 2. Check current permission status
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const success = await detectCurrentLocation();
        if (success) {
          onLocationResolved?.();
          onClose();
          return;
        } else {
          setErrorMessage('Could not pinpoint GPS position. Please ensure you have a clear GPS signal.');
        }
      } else if (!canAskAgain && Platform.OS !== 'web') {
        setStatusState('blocked');
        setErrorMessage(
          'Location access is permanently blocked or denied. FiYDoc requires your exact pinpoint location without forging. Please enable Location in Device Settings.'
        );
      } else if (status === 'denied' && Platform.OS === 'web') {
        setStatusState('blocked');
        setErrorMessage(
          'Location permission was denied in your browser. Click the lock/site settings icon in your browser address bar to allow Location, then try again.'
        );
      } else {
        setStatusState('prompt');
      }
    } catch (err: any) {
      console.warn('[LocationModal] Check error:', err?.message);
      setErrorMessage(err?.message || 'Error checking location status.');
    } finally {
      setLoading(false);
    }
  }, [detectCurrentLocation, onLocationResolved, onClose]);

  // Initial check when opened
  useEffect(() => {
    if (visible) {
      checkAndResolveLocation();
    }
  }, [visible, checkAndResolveLocation]);

  // Re-check when app returns from background / Settings
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && visible && !isLocationResolved) {
        checkAndResolveLocation();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [visible, isLocationResolved, checkAndResolveLocation]);

  const requestNativePermission = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      if (Platform.OS !== 'web') {
        try {
          const servicesEnabled = await Location.hasServicesEnabledAsync();
          if (!servicesEnabled) {
            setStatusState('blocked');
            setErrorMessage(
              'Location is turned off on your device. Please open Settings and enable Location services.'
            );
            setLoading(false);
            return;
          }
        } catch (servErr) {
          console.warn('[LocationModal] hasServicesEnabledAsync check warning:', servErr);
        }
      }

      // Trigger genuine system permission popup ("Allow While Using App" or "Only This Time")
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === 'granted') {
        const success = await detectCurrentLocation();
        if (success) {
          onLocationResolved?.();
          onClose();
        } else {
          setErrorMessage('Could not pinpoint GPS position. Please try again with GPS enabled.');
        }
      } else {
        setStatusState('blocked');
        setErrorMessage(
          Platform.OS === 'web'
            ? 'Location permission was denied in your browser. Click the lock/site settings icon in your browser address bar to allow Location, then try again.'
            : 'Location permission was denied. FiYDoc requires genuine pinpoint location to connect you with nearby clinicians. Please enable it in Device Settings.'
        );
      }
    } catch (err: any) {
      setStatusState('blocked');
      setErrorMessage(
        Platform.OS === 'web'
          ? 'Could not access browser location. Please allow location in your browser address bar.'
          : err?.message || 'Error requesting location permission. Please enable in Settings.'
      );
    } finally {
      setLoading(false);
    }
  };

  const openDeviceSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else if (Platform.OS === 'android') {
      Linking.openSettings();
    } else {
      requestNativePermission();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        // Disallow dismissing without resolving genuine device location
        if (isLocationResolved) {
          onClose();
        }
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Close button ONLY if location was already successfully resolved */}
          {isLocationResolved && (
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Close location modal"
            >
              <X size={18} color={Palette.textPrimary} />
            </TouchableOpacity>
          )}

          {/* Location Pin Hero Icon */}
          <View style={styles.heroIconBox}>
            <MapPin size={26} color="#ffffff" />
          </View>

          {/* Title & Healthcare Justification */}
          <Text style={styles.title}>Pinpoint Location Required</Text>
          <Text style={styles.subtitle}>
            FiYDoc requires your genuine device location to calculate exact clinic distances, live token queues, and dispatch emergency care. You can choose "While Using App" or "Only This Time".
          </Text>

          {/* Current Address Pill if previously resolved */}
          {formattedAddress && isLocationResolved ? (
            <View style={styles.activePill}>
              <Text style={styles.activePillLabel}>Detected Area:</Text>
              <Text style={styles.activePillValue} numberOfLines={1}>
                {formattedAddress}
              </Text>
            </View>
          ) : null}

          {/* Error Message / Settings Guidance */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color={Palette.danger} style={{ flexShrink: 0 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Action CTAs */}
          <View style={styles.actionGroup}>
            {statusState === 'blocked' ? (
              <>
                <TouchableOpacity
                  onPress={openDeviceSettings}
                  activeOpacity={0.85}
                  style={styles.primaryButton}
                >
                  <Settings size={16} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                    {Platform.OS === 'web' ? 'Allow in Browser Bar' : 'Open Device Settings'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={checkAndResolveLocation}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={styles.secondaryButton}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color={Palette.textSecondary} />
                  ) : (
                    <>
                      <RefreshCw size={15} color={Palette.textSecondary} />
                      <Text style={styles.secondaryButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                        I Enabled Location · Check Again
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
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
                    <Text style={styles.primaryButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      Allow Location Access
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Manual Location Selection Option */}
            <TouchableOpacity
              onPress={() => setShowManualHubs((prev) => !prev)}
              activeOpacity={0.8}
              style={styles.manualSelectToggle}
            >
              <Globe2 size={15} color={StitchColors.primary} />
              <Text style={styles.manualSelectToggleText}>
                {showManualHubs ? 'Hide City Selection' : 'Choose City / Location Manually'}
              </Text>
              {showManualHubs ? (
                <ChevronUp size={15} color={StitchColors.primary} />
              ) : (
                <ChevronDown size={15} color={StitchColors.primary} />
              )}
            </TouchableOpacity>

            {showManualHubs && (
              <View style={styles.hubsBox}>
                <Text style={styles.hubsBoxTitle}>Select Medical Hub</Text>
                <ScrollView
                  style={{ maxHeight: 160 }}
                  showsVerticalScrollIndicator={true}
                  nestedScrollEnabled
                >
                  <View style={{ gap: 6 }}>
                    {INDIAN_LOCATION_HUBS.map((hub) => (
                      <TouchableOpacity
                        key={hub.id}
                        onPress={() => {
                          setHub(hub);
                          onLocationResolved?.();
                          onClose();
                        }}
                        activeOpacity={0.75}
                        style={styles.hubRow}
                      >
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={styles.hubRowName} numberOfLines={1}>
                            {hub.name}
                          </Text>
                          <Text style={styles.hubRowSub}>
                            {hub.city}, {hub.state}
                          </Text>
                        </View>
                        <Check size={14} color={StitchColors.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 23, 45, 0.7)',
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
    width: 56,
    height: 56,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: StitchColors.primary,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: 6,
    fontSize: 19,
    color: Palette.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    color: Palette.textSecondary,
    lineHeight: 19,
    fontSize: 13,
    marginBottom: Spacing.lg,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
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
    padding: Spacing.sm + 4,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Palette.dangerBorder,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: Palette.danger,
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  actionGroup: {
    width: '100%',
    gap: Spacing.sm,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: StitchColors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadows.subtle,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    borderRadius: BorderRadius.xl,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  manualSelectToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    marginTop: 4,
  },
  manualSelectToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: StitchColors.primary,
  },
  hubsBox: {
    width: '100%',
    backgroundColor: Palette.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    marginTop: 4,
  },
  hubsBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Palette.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  hubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Palette.cardBorderLight,
  },
  hubRowName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Palette.textPrimary,
  },
  hubRowSub: {
    fontSize: 10.5,
    color: Palette.textSecondary,
    marginTop: 1,
  },
});
