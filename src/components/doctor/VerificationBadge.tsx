/**
 * VerificationBadge Component
 * Shows verified doctor badge with certification details
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, Award, CheckCircle2 } from 'lucide-react-native';
import { Palette, BorderRadius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface VerificationBadgeProps {
  status: 'verified' | 'pending' | 'rejected' | 'info_required';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  registrationNumber?: string;
  style?: any;
}

export function VerificationBadge({
  status,
  size = 'md',
  showLabel = true,
  registrationNumber,
  style,
}: VerificationBadgeProps) {
  const { colors, isDark } = useAppTheme();

  const config = {
    verified: {
      icon: <ShieldCheck size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} color="#00A896" />,
      label: 'Verified Practitioner',
      bgColor: isDark ? 'rgba(0, 168, 150, 0.15)' : '#E0F7F5',
      borderColor: isDark ? 'rgba(0, 168, 150, 0.3)' : '#76F4E0',
      textColor: colors.teal,
    },
    pending: {
      icon: <Award size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} color="#F59E0B" />,
      label: 'Credential Review',
      bgColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
      borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
      textColor: colors.warning,
    },
    rejected: {
      icon: <ShieldCheck size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} color="#BA1A1A" />,
      label: 'Verification Rejected',
      bgColor: isDark ? 'rgba(186, 26, 26, 0.15)' : '#FFDAD6',
      borderColor: isDark ? 'rgba(186, 26, 26, 0.3)' : '#FFB4AB',
      textColor: colors.danger,
    },
    info_required: {
      icon: <CheckCircle2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} color="#F59E0B" />,
      label: 'Info Required',
      bgColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
      borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
      textColor: colors.warning,
    },
  };

  const current = config[status];

  const sizeStyles = {
    sm: { paddingH: 8, paddingV: 4, fontSize: 10, gap: 4 },
    md: { paddingH: 10, paddingV: 6, fontSize: 12, gap: 6 },
    lg: { paddingH: 14, paddingV: 8, fontSize: 13, gap: 8 },
  };

  const s = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: current.bgColor,
          borderColor: current.borderColor,
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
        },
        style,
      ]}
    >
      {current.icon}
      {showLabel && (
        <Text style={[styles.label, { color: current.textColor, fontSize: s.fontSize }]}>
          {current.label}
        </Text>
      )}
      {registrationNumber && size === 'lg' && (
        <Text style={[styles.regNumber, { color: current.textColor }]}>
          {registrationNumber}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  regNumber: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    opacity: 0.8,
  },
});
