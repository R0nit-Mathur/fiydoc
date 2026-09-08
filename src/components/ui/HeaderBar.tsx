/**
 * HeaderBar Component
 * Reusable top header bar for tabbed and detail screens
 *
 * Features:
 * - Optional back button (left)
 * - Title with Stitch typography (22px bold)
 * - Optional right action
 * - Transparent background to show page content
 *
 * Part of FiYDoc Clinical Clarity design system
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, LucideProps } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { Typography, Spacing, StitchColors } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface HeaderBarProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  rightActionTitle?: string;
  onRightAction?: () => void;
  rightActionIcon?: React.ReactElement<LucideProps>;
  transparent?: boolean;
  style?: object;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HeaderBar({
  title,
  subtitle,
  showBackButton = false,
  onBackPress,
  rightAction,
  rightActionTitle,
  onRightAction,
  rightActionIcon,
  transparent = true,
  style,
  testID,
}: HeaderBarProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const backScale = useSharedValue(1);

  const handleBackPressIn = () => {
    backScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
  };

  const handleBackPressOut = () => {
    backScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const backButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: backScale.value }],
  }));

  const hasRightAction = rightAction || rightActionTitle || rightActionIcon || onRightAction;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === 'android' ? Spacing.xs : 0),
          backgroundColor: transparent ? 'transparent' : colors.background,
        },
        style,
      ]}
      testID={testID}
    >
      <StatusBar
        barStyle={colors.text === StitchColors.onSurface ? 'dark-content' : 'light-content'}
        translucent
        backgroundColor="transparent"
      />

      {/* Left section */}
      <View style={styles.leftSection}>
        {showBackButton && (
          <AnimatedPressable
            onPress={onBackPress}
            onPressIn={handleBackPressIn}
            onPressOut={handleBackPressOut}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={[styles.backButton, backButtonAnimatedStyle]}
            testID={`${testID}-back-button`}
          >
            <ChevronLeft
              size={28}
              color={colors.text}
              strokeWidth={2.5}
            />
          </AnimatedPressable>
        )}
      </View>

      {/* Center section - Title */}
      <View style={styles.centerSection}>
        {title && (
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
                ...Typography.title,
                fontSize: 22,
                fontWeight: '600',
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
        {subtitle && (
          <Text
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
              },
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right section */}
      <View style={styles.rightSection}>
        {rightAction || (
          hasRightAction ? (
            <Pressable
              onPress={onRightAction}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.rightActionButton}
              testID={`${testID}-right-action`}
            >
              {rightActionIcon || (
                rightActionTitle && (
                  <Text
                    style={[
                      styles.rightActionText,
                      { color: colors.primary },
                    ]}
                  >
                    {rightActionTitle}
                  </Text>
                )
              )}
            </Pressable>
          ) : null
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    minHeight: 56,
  },
  leftSection: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSection: {
    width: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backButton: {
    padding: Spacing['2xs'],
    marginLeft: -Spacing['2xs'],
    borderRadius: 8,
  },
  title: {
    textAlign: 'center',
    letterSpacing: -0.015,
  },
  subtitle: {
    ...Typography.bodySm,
    marginTop: 2,
  },
  rightActionButton: {
    padding: Spacing['2xs'],
    marginRight: -Spacing['2xs'],
    borderRadius: 8,
  },
  rightActionText: {
    ...Typography.labelMd,
    fontWeight: '600',
  },
});

export default HeaderBar;
