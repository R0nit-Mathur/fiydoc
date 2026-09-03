import React from 'react';
import { View, TouchableOpacity, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'elevated' | 'outlined' | 'flat';
  className?: string;
}

export function Card({ children, onPress, variant = 'elevated', className = '', ...props }: CardProps) {
  const variantStyles = {
    elevated: 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700/60',
    outlined: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
    flat: 'bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800',
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        className={`rounded-2xl p-4 ${variantStyles[variant]} ${className}`}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      className={`rounded-2xl p-4 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
