/**
 * Button - Clinical Clarity design system button
 * Apple HIG-style with Stitch Clinical Clarity colors
 */
import React, { useState } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  View,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { StitchColors, BorderRadius } from '@/constants/theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'teal' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  style,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const [pressed, setPressed] = useState(false);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      setPressed(true);
      scale.value = withSpring(0.97, { damping: 15, stiffness: 220 });
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      setPressed(false);
      scale.value = withSpring(1, { damping: 15, stiffness: 220 });
    }
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      onPress();
    }
  };

  // Clinical Clarity button styles
  const variantStyles = {
    primary: {
      backgroundColor: StitchColors.primaryContainer,
      borderColor: StitchColors.primaryContainer,
    },
    teal: {
      backgroundColor: StitchColors.secondary,
      borderColor: StitchColors.secondary,
    },
    secondary: {
      backgroundColor: StitchColors.surfaceContainerLow,
      borderColor: StitchColors.outlineVariant,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: StitchColors.primaryContainer,
      borderWidth: 1.5,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    danger: {
      backgroundColor: StitchColors.error,
      borderColor: StitchColors.error,
    },
    glass: {
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderColor: StitchColors.outlineVariant,
      borderWidth: 1,
    },
  };

  const pressedStyles = {
    primary: { opacity: 0.88 },
    teal: { opacity: 0.88 },
    secondary: { opacity: 0.75 },
    outline: { backgroundColor: 'rgba(20, 80, 163, 0.08)' },
    ghost: { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
    danger: { opacity: 0.85 },
    glass: { opacity: 0.8 },
  };

  const textColors = {
    primary: '#ffffff',
    teal: '#ffffff',
    secondary: StitchColors.onSurface,
    outline: StitchColors.primaryContainer,
    ghost: StitchColors.onSurfaceVariant,
    danger: '#ffffff',
    glass: StitchColors.onSurface,
  };

  return (
    <Animated.View style={[fullWidth ? styles.fullWidth : styles.autoWidth, animatedStyle]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={title}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={[
          styles.base,
          sizeStyles[size],
          variantStyles[variant],
          (variant === 'primary' || variant === 'teal') && styles.shadows,
          disabled && styles.disabled,
          pressed && !disabled && !loading && pressedStyles[variant],
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'outline' || variant === 'ghost' ? StitchColors.primaryContainer : '#fff'}
            size="small"
          />
        ) : (
          <>
            {icon && <View style={styles.iconWrap}>{icon}</View>}
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[textSizeStyles[size], { color: textColors[variant] }]}
            >
              {title}
            </Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fullWidth: { width: '100%' },
  autoWidth: { alignSelf: 'flex-start' },
  disabled: { opacity: 0.45 },
  iconWrap: { flexShrink: 0, marginRight: 8 },
  shadows: {
    shadowColor: '#1450a3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
});

const sizeStyles = StyleSheet.create({
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 38,
    borderRadius: 19,
  },
  md: {
    paddingVertical: 12,
    paddingHorizontal: 22,
    minHeight: 52,
    borderRadius: 26,
  },
  lg: {
    paddingVertical: 14,
    paddingHorizontal: 26,
    minHeight: 56,
    borderRadius: 28,
  },
});

const textSizeStyles = StyleSheet.create({
  sm: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    textAlignVertical: 'center',
  },
  md: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlignVertical: 'center',
  },
  lg: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
    textAlignVertical: 'center',
  },
});
