/**
 * AnimatedPressable - Apple HIG-style press animation wrapper
 * Provides smooth scale + opacity feedback on press
 */
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, ViewStyle, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export interface AnimatedPressableProps {
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  className?: string;
  scaleFactor?: number; // How much to scale down on press (default 0.98)
  hapticFeedback?: boolean;
  hapticStyle?: 'light' | 'medium' | 'heavy' | 'none';
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
  accessibilityRole?: 'button' | 'link' | 'none';
  accessibilityLabel?: string;
}

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

export function AnimatedPressable({
  onPress,
  onPressIn,
  onPressOut,
  disabled = false,
  children,
  style,
  scaleFactor = 0.98,
  hapticFeedback = false,
  hapticStyle = 'light',
  hitSlop,
  accessibilityRole = 'button',
  accessibilityLabel,
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS === 'web' || hapticFeedback === false) return;

    switch (hapticStyle) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      default:
        break;
    }
  }, [hapticFeedback, hapticStyle]);

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(scaleFactor, {
      damping: 15,
      stiffness: 300,
      mass: 0.8,
    });
    opacity.value = withSpring(0.85, {
      damping: 15,
      stiffness: 300,
    });
    triggerHaptic();
    onPressIn?.();
  }, [disabled, scaleFactor, onPressIn, scale, opacity, triggerHaptic]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 280,
      mass: 0.8,
    });
    opacity.value = withSpring(1, {
      damping: 12,
      stiffness: 280,
    });
    onPressOut?.();
  }, [disabled, onPressOut, scale, opacity]);

  const handlePress = useCallback(() => {
    if (disabled) return;
    onPress?.();
  }, [disabled, onPress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressableComponent
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressableComponent>
  );
}

// Skeleton loader with shimmer
export { Skeleton } from './Skeleton';
export { CardSkeleton, ListItemSkeleton, TextBlockSkeleton } from './Skeleton';
export { AvatarSkeleton, StatsCardSkeleton, DoctorCardSkeleton } from './Skeleton';
export { AppointmentSkeleton, TabBarSkeleton, HeaderSkeleton, EmptyStateSkeleton } from './Skeleton';
