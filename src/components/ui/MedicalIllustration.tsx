/**
 * MedicalIllustration Component
 * Reusable medical illustration with glassmorphism card and parallax animation
 *
 * Part of FiYDoc Clinical Clarity design system
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
import { BorderRadius, Shadows, StitchColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export type IllustrationSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type IllustrationVariant = 'welcome' | 'doctor-search' | 'calendar' | 'records' | 'prescription';

export interface MedicalIllustrationProps {
  variant?: IllustrationVariant;
  size?: IllustrationSize;
  enableParallax?: boolean;
  scrollY?: SharedValue<number>;
  style?: object;
  showGlassCard?: boolean;
}

const STATIC_SIZE_MAP: Record<Exclude<IllustrationSize, 'full'>, number> = {
  sm: 120,
  md: 200,
  lg: 280,
  xl: 360,
};

const PARALLAX_FACTOR = 0.3;

export function MedicalIllustration({
  variant = 'welcome',
  size = 'lg',
  enableParallax = false,
  scrollY,
  style,
  showGlassCard = true,
}: MedicalIllustrationProps) {
  const { width: windowWidth } = useWindowDimensions();
  const { isDark } = useAppTheme();
  const animatedY = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const illustrationSize = size === 'full' ? Math.max(windowWidth - 64, 260) : STATIC_SIZE_MAP[size];

  // Get the correct image source based on variant
  // For now, we use welcome_illustration as the primary asset
  // In production, you'd have variant-specific images
  const imageSource = require('../../../assets/images/welcome_illustration.jpg');

  useEffect(() => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    });
  }, [scale]);

  useEffect(() => {
    if (scrollY && enableParallax) {
      animatedY.value = scrollY.value;
    }
  }, [scrollY, enableParallax, animatedY]);

  const animatedImageStyle = useAnimatedStyle(() => {
    const parallaxOffset = enableParallax
      ? interpolate(
          animatedY.value,
          [-200, 200],
          [-50, 50],
          Extrapolation.CLAMP
        )
      : 0;

    return {
      transform: [
        { translateY: parallaxOffset * PARALLAX_FACTOR },
        { scale: scale.value },
      ],
    };
  });

  const cardStyle = showGlassCard
    ? [
        styles.glassCard,
        {
          width: illustrationSize,
          height: illustrationSize,
          backgroundColor: isDark
            ? 'rgba(45, 53, 72, 0.6)'
            : 'rgba(255, 255, 255, 0.7)',
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.12)'
            : 'rgba(255, 255, 255, 0.5)',
        },
      ]
    : {};

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[cardStyle, { borderRadius: size === 'full' ? BorderRadius['2xl'] : BorderRadius.xl }]}>
        <Animated.View style={[styles.imageWrapper, animatedImageStyle]}>
          <Image
            source={imageSource}
            style={[
              styles.image,
              {
                width: illustrationSize - 24,
                height: illustrationSize - 24,
              },
            ]}
            contentFit="cover"
            transition={300}
            cachePolicy="memory-disk"
          />
        </Animated.View>

        {/* Glass overlay effect */}
        {showGlassCard && (
          <View
            style={[
              styles.glassOverlay,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.03)'
                  : 'rgba(255, 255, 255, 0.3)',
              },
            ]}
            pointerEvents="none"
          />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassCard: {
    overflow: 'hidden',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: StitchColors.primaryContainer,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
      default: {
        ...Shadows.card,
      },
    }),
  },
  imageWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: BorderRadius.lg,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: BorderRadius.xl,
  },
});

export default MedicalIllustration;
