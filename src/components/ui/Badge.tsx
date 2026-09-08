import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';

interface BadgeProps {
  label: string;
  variant?: 'teal' | 'blue' | 'success' | 'warning' | 'danger' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export function Badge({ label, variant = 'teal', size = 'md', icon }: BadgeProps) {
  const { isDark } = useAppTheme();

  const lightStyles = {
    teal: { bg: '#E0F7F5', border: '#76F4E0', text: '#006B5F' },
    blue: { bg: '#EAEDFF', border: '#ADC6FF', text: '#1450A3' },
    success: { bg: '#E0F7F5', border: '#76F4E0', text: '#006B5F' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' },
    danger: { bg: '#FFDAD6', border: '#FFB4AB', text: '#BA1A1A' },
    purple: { bg: '#F5F3FF', border: '#DDD6FE', text: '#6D28D9' },
    slate: { bg: '#F2F3FF', border: '#E2E7FF', text: '#424752' },
  };

  const darkStyles = {
    teal: { bg: 'rgba(0, 168, 150, 0.18)', border: 'rgba(0, 168, 150, 0.35)', text: '#2DD4BF' },
    blue: { bg: 'rgba(20, 80, 163, 0.22)', border: 'rgba(56, 189, 248, 0.35)', text: '#38BDF8' },
    success: { bg: 'rgba(0, 168, 150, 0.18)', border: 'rgba(0, 168, 150, 0.35)', text: '#34D399' },
    warning: { bg: 'rgba(245, 158, 11, 0.18)', border: 'rgba(245, 158, 11, 0.35)', text: '#FBBF24' },
    danger: { bg: 'rgba(186, 26, 26, 0.2)', border: 'rgba(239, 68, 68, 0.35)', text: '#F87171' },
    purple: { bg: 'rgba(147, 51, 234, 0.18)', border: 'rgba(147, 51, 234, 0.35)', text: '#C084FC' },
    slate: { bg: 'rgba(148, 163, 184, 0.14)', border: 'rgba(148, 163, 184, 0.28)', text: '#94A3B8' },
  };

  const current = (isDark ? darkStyles : lightStyles)[variant] || (isDark ? darkStyles.teal : lightStyles.teal);

  const sizeStyle = size === 'sm'
    ? { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 9999, fontSize: 11 }
    : { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 9999, fontSize: 12 };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: current.bg,
        borderColor: current.border,
        borderWidth: 1,
        borderRadius: sizeStyle.borderRadius,
        paddingHorizontal: sizeStyle.paddingHorizontal,
        paddingVertical: sizeStyle.paddingVertical,
        gap: 4,
        flexShrink: 0,
      }}
    >
      {icon && <View style={{ flexShrink: 0 }}>{icon}</View>}
      <Text
        numberOfLines={1}
        style={{
          fontSize: sizeStyle.fontSize,
          fontWeight: '700',
          color: current.text,
          letterSpacing: 0.2,
          flexShrink: 0,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
