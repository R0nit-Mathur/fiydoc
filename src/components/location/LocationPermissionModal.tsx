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
import { useLocationStore } from '@/store/useLocationStore';
import { Palette, Typography, BorderRadius, Shadows, Spacing, StitchColors } from '@/constants/theme';
import {
  MapPin,
  Navigation,
  AlertCircle,
  Settings,
  X,
  RefreshCw,
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
  } = useLocationStore();

  const [loading, setLoading] = useState(false);
  const [statusState, setStatusState] = useState<'prompt' | 'denied' | 'blocked'>('prompt');
  const [errorMessage, setErrorMessage] = useState('');

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
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.cardContainer}>
          {/* Close button always available */}
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

          {/* Title & Healthcare Justification */}
          <Text style={styles.title}>Choose Your Location</Text>
          <Text style={styles.subtitle}>
            FiYDoc uses your location to show clinic distance and local token queues. You can allow location access, pick a city, or browse all doctors nationwide.
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
  },
});
