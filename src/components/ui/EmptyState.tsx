/**
 * EmptyState Component
 * Reusable empty state display with illustration and action
 *
 * Updated to use MedicalIllustration component for the icon
 *
 * Part of FiYDoc Clinical Clarity design system
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Button } from './Button';
import { MedicalIllustration, type IllustrationVariant } from './MedicalIllustration';
import { BorderRadius, Shadows, Spacing, Typography, StitchColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionTitle?: string;
  onAction?: () => void;
  illustration?: IllustrationVariant;
  icon?: React.ReactNode;
  variant?: 'compact' | 'full';
}

export function EmptyState({
  title,
  description,
  actionTitle,
  onAction,
  illustration,
  icon,
  variant = 'compact',
}: EmptyStateProps) {
  const { colors, isDark } = useAppTheme();
  const scale = useSharedValue(0.9);

  React.useEffect(() => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
    });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const showIllustration = illustration !== undefined;
  const isFullVariant = variant === 'full';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          paddingVertical: isFullVariant ? Spacing.xl : Spacing.lg,
        },
        animatedStyle,
      ]}
    >
      {/* Icon / Illustration */}
      <View style={[styles.iconContainer, isFullVariant && styles.iconContainerFull]}>
        {illustration && !icon ? (
          <MedicalIllustration
            variant={illustration}
            size={isFullVariant ? 'md' : 'sm'}
            showGlassCard={true}
          />
        ) : (
          <>
            {/* Outer subtle halo ring */}
            <View
              style={[
                styles.outerCircle,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.04)'
                    : 'rgba(39, 92, 176, 0.04)',
                },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(39, 92, 176, 0.08)',
                  },
                ]}
              >
                {icon}
              </View>
            </View>
          </>
        )}
      </View>

      {/* Text Content */}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>

      {description && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          {description}
        </Text>
      )}

      {/* Action Button */}
      {actionTitle && onAction ? (
        <View style={styles.actionWrap}>
          <Button
            title={actionTitle}
            onPress={onAction}
            variant="primary"
            size="md"
            fullWidth={false}
          />
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    marginVertical: Spacing.md,
    ...Shadows.subtle,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  iconContainerFull: {
    marginBottom: Spacing.xl,
  },
  outerCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.titleMd,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: -0.01,
  },
  description: {
    ...Typography.bodyMd,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    maxWidth: 280,
    lineHeight: 22,
  },
  actionWrap: {
    marginTop: Spacing.xs,
  },
});

export default EmptyState;
