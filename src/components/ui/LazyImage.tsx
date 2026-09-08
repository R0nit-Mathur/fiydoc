/**
 * LazyImage - Image component with lazy loading and shimmer placeholder
 * Uses expo-image for optimized image loading
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Shimmer } from './Shimmer';
import { useAppTheme } from '@/hooks/useAppTheme';
import { BorderRadius } from '@/constants/theme';

export interface LazyImageProps {
  source: string | { uri: string };
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  placeholder?: React.ReactNode;
  showPlaceholder?: boolean;
  contentFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  transition?: number; // Transition duration in ms
  priority?: 'low' | 'normal' | 'high';
  blurRadius?: number;
  borderRadius?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  source,
  style,
  containerStyle,
  placeholder,
  showPlaceholder: controlledPlaceholder,
  contentFit = 'cover',
  transition = 300,
  priority = 'normal',
  blurRadius = 10,
  borderRadius,
  onLoad,
  onError,
}: LazyImageProps) {
  const { isDark } = useAppTheme();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const opacity = useSharedValue(0);

  const handleLoad = () => {
    setLoaded(true);
    opacity.value = withTiming(1, {
      duration: transition,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    onError?.();
  };

  const animatedImageStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const showPlaceholder = controlledPlaceholder ?? !loaded;
  const blurhash = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4'; // Placeholder blurhash

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Placeholder */}
      {showPlaceholder && !error && (
        <View style={[styles.placeholderContainer, containerStyle]}>
          {placeholder || (
            <Shimmer
              width="100%"
              height={200}
              borderRadius={borderRadius ?? BorderRadius.md}
            />
          )}
        </View>
      )}

      {/* Actual Image */}
      {!error && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedImageStyle]}>
          <Image
            source={typeof source === 'string' ? { uri: source } : source}
            style={[styles.image, { borderRadius: borderRadius }, style]}
            contentFit={contentFit}
            transition={transition}
            placeholder={{ blurhash }}
            placeholderContentFit={contentFit}
            onLoad={handleLoad}
            onError={handleError}
          />
        </Animated.View>
      )}

      {/* Error Placeholder */}
      {error && (
        <View style={[styles.errorContainer, containerStyle]}>
          <View style={[styles.errorPlaceholder, { borderRadius: borderRadius ?? BorderRadius.md }]}>
            {/* Could add an error icon here */}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  placeholderContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
  },
  image: {
    flex: 1,
  },
  errorContainer: {
    ...StyleSheet.absoluteFill,
  },
  errorPlaceholder: {
    flex: 1,
    backgroundColor: '#E8E8ED',
  },
});
