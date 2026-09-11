import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { User, Stethoscope } from 'lucide-react-native';
import { StitchColors } from '@/constants/theme';

export interface SegmentedRoleSelectorProps {
  selectedRole: 'patient' | 'doctor';
  onSelectRole: (role: 'patient' | 'doctor') => void;
  patientLabel?: string;
  doctorLabel?: string;
  showIcons?: boolean;
  style?: any;
}

export function SegmentedRoleSelector({
  selectedRole,
  onSelectRole,
  patientLabel = 'Patient',
  doctorLabel = 'Doctor',
  showIcons = true,
  style,
}: SegmentedRoleSelectorProps) {
  const containerWidth = useSharedValue(0);
  const pillOffset = useSharedValue(selectedRole === 'doctor' ? 1 : 0);

  useEffect(() => {
    pillOffset.value = withSpring(selectedRole === 'doctor' ? 1 : 0, {
      damping: 20,
      stiffness: 280,
    });
  }, [selectedRole]);

  const onLayout = (e: LayoutChangeEvent) => {
    containerWidth.value = e.nativeEvent.layout.width;
  };

  const pillAnimatedStyle = useAnimatedStyle(() => {
    if (containerWidth.value === 0) {
      return {
        width: '49%',
        transform: [{ translateX: selectedRole === 'doctor' ? 140 : 0 }],
      };
    }
    const halfWidth = (containerWidth.value - 8) / 2;
    return {
      width: halfWidth,
      transform: [{ translateX: pillOffset.value * halfWidth }],
    };
  });

  return (
    <View style={[styles.container, style]} onLayout={onLayout}>
      {/* Animated Sliding Pill Backdrop */}
      <Animated.View style={[styles.activePill, pillAnimatedStyle]} pointerEvents="none" />

      {/* Patient Tab */}
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: selectedRole === 'patient' }}
        onPress={() => onSelectRole('patient')}
        style={styles.tabButton}
      >
        <View style={styles.tabContent}>
          {showIcons && (
            <User
              size={17}
              color={selectedRole === 'patient' ? StitchColors.primary : StitchColors.onSurfaceVariant}
              strokeWidth={selectedRole === 'patient' ? 2.3 : 1.8}
            />
          )}
          <Text
            style={[
              styles.tabText,
              selectedRole === 'patient' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            {patientLabel}
          </Text>
        </View>
      </Pressable>

      {/* Doctor Tab */}
      <Pressable
        accessibilityRole="tab"
        accessibilityState={{ selected: selectedRole === 'doctor' }}
        onPress={() => onSelectRole('doctor')}
        style={styles.tabButton}
      >
        <View style={styles.tabContent}>
          {showIcons && (
            <Stethoscope
              size={17}
              color={selectedRole === 'doctor' ? StitchColors.primary : StitchColors.onSurfaceVariant}
              strokeWidth={selectedRole === 'doctor' ? 2.3 : 1.8}
            />
          )}
          <Text
            style={[
              styles.tabText,
              selectedRole === 'doctor' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            {doctorLabel}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 44,
    backgroundColor: StitchColors.surfaceContainer,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: StitchColors.surfaceContainerLowest,
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#00397e',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0, 57, 126, 0.12)',
      },
    }),
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: 18,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
  tabTextActive: {
    color: StitchColors.primary,
    fontWeight: '600',
  },
  tabTextInactive: {
    color: StitchColors.onSurfaceVariant,
    fontWeight: '500',
  },
});
