/**
 * Pill Component
 * Reusable pill-shaped badge for status, categories, etc.
 *
 * Part of FiYDoc Clinical Clarity design system
 * Variants: default, primary, teal, warning, danger, glass
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { BorderRadius, Spacing, Typography, StitchColors, Palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export type PillVariant = 'default' | 'primary' | 'teal' | 'warning' | 'danger' | 'glass';
export type PillSize = 'sm' | 'md' | 'lg';

export interface PillProps {
  label: string;
  variant?: PillVariant;
  size?: PillSize;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  textColor?: string;
  outlined?: boolean;
}

const VARIANT_COLORS: Record<PillVariant, { bg: string; text: string; border: string }> = {
  default: {
    bg: StitchColors.surfaceContainerLow,
    text: StitchColors.onSurface,
    border: StitchColors.outlineVariant,
  },
  primary: {
    bg: StitchColors.primaryContainer,
    text: StitchColors.onPrimaryContainer,
    border: 'transparent',
  },
  teal: {
    bg: StitchColors.secondaryContainer,
    text: StitchColors.onSecondaryContainer,
    border: 'transparent',
  },
  warning: {
    bg: Palette.warningBg,
    text: Palette.warning,
    border: Palette.warningBorder,
  },
  danger: {
    bg: Palette.dangerBg,
    text: Palette.danger,
    border: Palette.dangerBorder,
  },
  glass: {
    bg: 'rgba(255, 255, 255, 0.12)',
    text: StitchColors.onSurface,
    border: 'rgba(255, 255, 255, 0.2)',
  },
};

const SIZE_STYLES: Record<PillSize, { container: ViewStyle; text: object }> = {
  sm: {
    container: {
      paddingVertical: 2,
      paddingHorizontal: Spacing.xs,
      minHeight: 20,
    },
    text: {
      ...Typography.labelSm,
      fontSize: 10,
    },
  },
  md: {
    container: {
      paddingVertical: Spacing['2xs'],
      paddingHorizontal: Spacing.sm,
      minHeight: 26,
    },
    text: {
      ...Typography.labelSm,
    },
  },
  lg: {
    container: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.md,
      minHeight: 32,
    },
    text: {
      ...Typography.labelMd,
    },
  },
};

export function Pill({
  label,
  variant = 'default',
  size = 'md',
  icon,
  onPress,
  style,
  textColor,
  outlined = false,
}: PillProps) {
  const { isDark } = useAppTheme();

  const variantColors = VARIANT_COLORS[variant];
  const sizeStyles = SIZE_STYLES[size];

  // Adjust for dark mode
  const bgColor = isDark && variant === 'glass'
    ? 'rgba(255, 255, 255, 0.08)'
    : variant === 'glass'
    ? 'rgba(255, 255, 255, 0.15)'
    : variantColors.bg;

  const borderColor = outlined ? variantColors.border : 'transparent';
  const finalTextColor = textColor || variantColors.text;

  const containerStyle: ViewStyle = {
    ...styles.container,
    ...sizeStyles.container,
    backgroundColor: outlined ? 'transparent' : bgColor,
    borderColor: outlined ? borderColor : 'transparent',
    borderWidth: outlined ? 1 : 0,
  };

  const content = (
    <>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.text,
          sizeStyles.text,
          { color: finalTextColor },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        style={({ pressed }) => [
          containerStyle,
          pressed && styles.pressed,
          style,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[containerStyle, style]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  pressed: {
    opacity: 0.8,
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    textAlign: 'center',
  },
});

export default Pill;
