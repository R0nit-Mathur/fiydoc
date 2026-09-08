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
} from 'react-native-reanimated';

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

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration,
        easing: Easing.bezier(0.3, 0.1, 0.3, 1),
      }),
      -1, // Infinite repeat
      false
    );
  }, [duration, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 0.5, 1], [0.5, 0.8, 0.5]);
    return { opacity };
  });

  // Light mode shimmer colors (Clinical Clarity design)
  const baseColor = '#E8E8ED';

  return (
    <Animated.View
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
