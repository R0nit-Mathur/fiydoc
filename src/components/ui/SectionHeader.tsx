/**
 * SectionHeader Component
 * Reusable section header with title, optional subtitle, and right-side action
 *
 * Part of FiYDoc Clinical Clarity design system
 * Matches Stitch typography: headlineSm, onSurface color
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Typography, Spacing, StitchColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionTitle?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  style?: ViewStyle;
  titleColor?: string;
  actionColor?: string;
}

export function SectionHeader({
  title,
  subtitle,
  actionTitle,
  onAction,
  actionIcon,
  style,
  titleColor,
  actionColor,
}: SectionHeaderProps) {
  const { colors } = useAppTheme();

  const hasAction = actionTitle || onAction;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleContainer}>
        <Text
          style={[
            styles.title,
            {
              color: titleColor || colors.text,
              ...Typography.headlineSm,
            },
          ]}
        >
          {title}
        </Text>

        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {hasAction && (
        <Pressable
          onPress={onAction}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.actionButton,
            pressed && styles.actionButtonPressed,
          ]}
        >
          {actionIcon ? (
            actionIcon
          ) : (
            <Text
              style={[
                styles.actionText,
                {
                  color: actionColor || colors.primary,
                  ...Typography.labelSm,
                },
              ]}
            >
              {actionTitle}
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  titleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    letterSpacing: -0.015,
  },
  subtitle: {
    marginTop: 2,
    ...Typography.bodySm,
  },
  actionButton: {
    paddingVertical: Spacing['2xs'],
    paddingHorizontal: Spacing.xs,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPressed: {
    opacity: 0.7,
  },
  actionText: {
    color: StitchColors.primaryContainer,
    textTransform: 'none',
  },
});

export default SectionHeader;
