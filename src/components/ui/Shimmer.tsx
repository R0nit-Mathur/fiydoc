/**
 * Shimmer - Apple HIG-style loading shimmer effect
 * Uses Reanimated for smooth 60fps animations
 */
import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  cancelAnimation,
  useReducedMotion,
} from 'react-native-reanimated';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  duration?: number; // Animation duration in ms
}

export function Shimmer({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  duration = 1400,
}: ShimmerProps) {
  const progress = useSharedValue(0);
  const reducedMotion = useReducedMotion();
  const { colors } = useAppTheme();

  useEffect(() => {
    if (reducedMotion) {
      progress.set(0.5);
      return;
    }
    progress.set(withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.bezier(0.3, 0.1, 0.3, 1),
      }),
      -1, // Infinite repeat
      false
    ));
    return () => cancelAnimation(progress);
  }, [duration, progress, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.get(), [0, 0.5, 1], [0.5, 0.8, 0.5]);
    return { opacity };
  });

  // Light mode shimmer colors (Clinical Clarity design)
  const baseColor = colors.backgroundElement;

  return (
    <Animated.View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.shimmer,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: baseColor,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  shimmer: {
    overflow: 'hidden',
  },
});
