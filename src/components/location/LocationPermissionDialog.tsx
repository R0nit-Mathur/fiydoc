import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { MapPin, Navigation, X } from 'lucide-react-native';
import { Palette, BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { useLocationStore } from '@/store/useLocationStore';

interface LocationPermissionDialogProps {
  visible: boolean;
  onClose: () => void;
  onSelectManual?: () => void;
}

export function LocationPermissionDialog({
  visible,
  onClose,
  onSelectManual,
}: LocationPermissionDialogProps) {
  const { detectCurrentLocation, isLoading } = useLocationStore();

  const handleAllow = async () => {
    await detectCurrentLocation();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialogCard}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={18} color={Palette.textMuted} />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <MapPin size={32} color={Palette.healthcareTeal} strokeWidth={2.2} />
          </View>

          <Text style={styles.title}>Find Doctors Near You</Text>
          <Text style={styles.description}>
            Allow FiYDoc to access your location to discover verified clinicians in your neighborhood, calculate clinic travel distance, and show real-time slot availability.
          </Text>

          <View style={styles.actionsGroup}>
            <TouchableOpacity
              onPress={handleAllow}
              activeOpacity={0.88}
              disabled={isLoading}
              style={styles.allowButton}
            >
              <Navigation size={16} color="#FFFFFF" />
              <Text style={styles.allowButtonText}>
                {isLoading ? 'Detecting Location...' : 'Allow Location Access'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                onClose();
                onSelectManual?.();
              }}
              activeOpacity={0.8}
              style={styles.manualButton}
            >
              <Text style={styles.manualButtonText}>Choose City Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Palette.card,
    borderRadius: BorderRadius['2xl'],
    padding: 26,
    alignItems: 'center',
    position: 'relative',
    ...Shadows.modal,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.background,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: Palette.healthcareTealLight,
    borderWidth: 1,
    borderColor: Palette.healthcareTealBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.textPrimary,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: Palette.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  actionsGroup: {
    width: '100%',
    gap: 10,
  },
  allowButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: Palette.healthcareTeal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  allowButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  manualButton: {
    height: 46,
    borderRadius: 14,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Palette.textSecondary,
  },
});
