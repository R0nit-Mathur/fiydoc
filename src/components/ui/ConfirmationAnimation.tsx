import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { CheckCircle2, FileText } from 'lucide-react-native';
import { Palette, Spacing, Typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ConfirmationAnimationProps {
  title?: string;
  subtitle?: string;
  color?: string;
  size?: number;
  variant?: 'success' | 'record';
  onAnimationEnd?: () => void;
}

export function ConfirmationAnimation({
  title,
  subtitle,
  color = Palette.healthcareTeal,
  size = 72,
  variant = 'success',
  onAnimationEnd,
}: ConfirmationAnimationProps) {
  const { colors } = useAppTheme();
  const callback = useRef(onAnimationEnd);
  callback.current = onAnimationEnd;
  useEffect(() => {
    const timer = setTimeout(() => callback.current?.(), 250);
    return () => clearTimeout(timer);
  }, []);
  const Icon = variant === 'success' ? CheckCircle2 : FileText;

  return (
    <Animated.View entering={FadeIn.duration(250).reduceMotion(ReduceMotion.System)} style={styles.container}>
      <View style={[styles.iconWrapper, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.backgroundElement }]}>
        <Icon size={size * 0.58} color={color} />
      </View>
      {(title || subtitle) && (
        <View style={styles.textContainer}>
          {title && <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{title}</Text>}
          {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm },
  iconWrapper: { alignItems: 'center', justifyContent: 'center' },
  textContainer: { alignItems: 'center', marginTop: Spacing.md, gap: Spacing.xs },
  title: { ...Typography.h2, textAlign: 'center' },
  subtitle: { ...Typography.caption, textAlign: 'center' },
});
