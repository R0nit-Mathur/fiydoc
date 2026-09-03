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
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const textStyles = {
    sm: 'text-xs font-semibold px-2 py-0.5 rounded-lg border',
    md: 'text-xs font-bold px-2.5 py-1 rounded-xl border',
  };

  return (
    <View className={`flex-row items-center self-start space-x-1 ${variantStyles[variant]} ${textStyles[size]}`}>
      {icon}
      <Text className={`font-semibold ${variantStyles[variant].split(' ')[1]}`}>{label}</Text>
    </View>
  );
}
