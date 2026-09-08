/**
 * StitchCard Component
 * Premium card with proper Stitch Clinical Clarity styling
 *
 * Features:
 * - White background (surfaceContainerLowest)
 * - Border with outlineVariant color
 * - 20px border radius
 * - Hairline border
 * - Soft card shadow from Shadows.card
 *
 * Part of FiYDoc Clinical Clarity design system
 */

import React, { ReactNode } from 'react';
import { View, Pressable, StyleSheet, ViewStyle, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Shadows, Spacing, StitchColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface StitchCardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  elevated?: boolean;
  outlined?: boolean;
  noPadding?: boolean;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function StitchCard({
  children,
  style,
  onPress,
  disabled = false,
  elevated = true,
  outlined = false,
  noPadding = false,
  testID,
}: StitchCardProps) {
  const { colors, isDark } = useAppTheme();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardBgColor = isDark
    ? StitchColors.surfaceContainer
    : StitchColors.surfaceContainerLowest;

  const cardBorderColor = outlined
    ? colors.border
    : StitchColors.outlineVariant;

  const cardShadow = elevated
    ? Platform.select({
        ios: {
          shadowColor: isDark ? '#000' : StitchColors.primaryContainer,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.03,
          shadowRadius: 12,
        },
        android: {
          elevation: 2,
        },
        default: {
          ...Shadows.card,
        },
      })
    : {};

  const cardStyle: ViewStyle = {
    backgroundColor: cardBgColor,
    borderColor: cardBorderColor,
    borderWidth: outlined ? 1 : 0.5,
    borderRadius: 20,
    ...cardShadow,
    ...(noPadding ? {} : { padding: Spacing.md }),
  };

  const content = (
    <View style={styles.contentContainer}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={[
          styles.card,
          cardStyle,
          disabled && styles.disabled,
          animatedStyle,
          style,
        ]}
        testID={testID}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return (
    <View
      style={[
        styles.card,
        cardStyle,
        disabled && styles.disabled,
        style,
      ]}
      testID={testID}
    >
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  contentContainer: {
    flex: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default StitchCard;
