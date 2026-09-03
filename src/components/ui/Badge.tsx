import React from 'react';
import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'teal' | 'blue' | 'success' | 'warning' | 'danger' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export function Badge({ label, variant = 'teal', size = 'md', icon }: BadgeProps) {
  const variantStyles = {
    teal: { bg: '#F0FAF8', border: '#B8EFE7', text: '#008C7A' },
    blue: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E58C8' },
    success: { bg: '#ECFDF5', border: '#A7F3D0', text: '#047857' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', text: '#B45309' },
    danger: { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' },
    purple: { bg: '#FAF5FF', border: '#E9D5FF', text: '#6B21A8' },
    slate: { bg: '#F8FAFC', border: '#E2E8F0', text: '#475569' },
  };

  const current = variantStyles[variant] || variantStyles.teal;

  const sizeStyle = size === 'sm'
    ? { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, fontSize: 10 }
    : { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10, fontSize: 11 };

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
          fontWeight: '800',
          color: current.text,
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
