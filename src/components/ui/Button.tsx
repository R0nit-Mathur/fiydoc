import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'teal';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  fullWidth = true,
  className = '',
}: ButtonProps) {
  const sizeClasses = {
    sm: 'py-2 px-4 rounded-xl',
    md: 'py-3 px-5 rounded-2xl',
    lg: 'py-4 px-6 rounded-2xl',
  };

  const textSizes = {
    sm: 'text-sm font-semibold',
    md: 'text-base font-bold',
    lg: 'text-lg font-extrabold',
  };

  const variantClasses = {
    primary: 'bg-[#1E58C8] active:bg-[#15429B] shadow-sm',
    teal: 'bg-[#00B39B] active:bg-[#008C7A] shadow-sm',
    secondary: 'bg-slate-100 dark:bg-slate-800 active:bg-slate-200',
    outline: 'border-2 border-[#1E58C8] bg-transparent active:bg-blue-50',
    ghost: 'bg-transparent active:bg-slate-100',
    danger: 'bg-red-500 active:bg-red-600 shadow-sm',
  };

  const textVariantClasses = {
    primary: 'text-white',
    teal: 'text-white',
    secondary: 'text-slate-800 dark:text-slate-100',
    outline: 'text-[#1E58C8]',
    ghost: 'text-slate-700 dark:text-slate-200',
    danger: 'text-white',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={{ gap: 8 }}
      className={`flex-row items-center justify-center ${sizeClasses[size]} ${
        variantClasses[variant]
      } ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50' : 'opacity-100'} ${className}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#1E58C8' : '#FFFFFF'} />
      ) : (
        <>
          {icon}
          <Text className={`${textSizes[size]} ${textVariantClasses[variant]}`}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
