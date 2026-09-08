import React from 'react';
import { View, Pressable, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { BorderRadius, Shadows } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
  className?: string;
  style?: ViewStyle;
}

export function Card({
  children,
  onPress,
  variant = 'elevated',
  style,
  ...props
}: CardProps) {
  const { colors, isDark } = useAppTheme();

  const dynamicVariantStyles: Record<string, ViewStyle> = {
    elevated: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(19, 27, 46, 0.06)',
    },
    outlined: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    flat: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(19, 27, 46, 0.06)',
    },
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          dynamicVariantStyles[variant],
          variant === 'elevated' && Shadows.card,
          pressed && styles.pressed,
          style,
        ]}
        accessibilityRole="button"
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.base,
        dynamicVariantStyles[variant],
        variant === 'elevated' && Shadows.card,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius['2xl'],
    padding: 18,
  },
  pressed: {
    opacity: 0.92,
  },
});
