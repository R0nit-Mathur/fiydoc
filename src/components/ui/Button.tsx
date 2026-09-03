import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'teal' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  style?: ViewStyle;
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
  style,
}: ButtonProps) {
  const sizeClasses = {
    sm: 'py-2 px-3 rounded-xl',
    md: 'py-2.5 px-4 rounded-xl',
    lg: 'py-3.5 px-5 rounded-2xl',
  };

  const textSizes = {
    sm: 'text-xs font-bold',
    md: 'text-sm font-bold',
    lg: 'text-sm font-black',
  };

  const variantClasses = {
    primary: 'bg-[#1E58C8] active:bg-[#15429B] shadow-sm',
    teal: 'bg-[#00B39B] active:bg-[#008C7A] shadow-sm',
    secondary: 'bg-slate-100 active:bg-slate-200 border border-slate-200/80',
    outline: 'border border-[#1E58C8] bg-transparent active:bg-blue-50/50',
    ghost: 'bg-transparent active:bg-slate-100',
    danger: 'bg-red-500 active:bg-red-600 shadow-sm',
    glass: 'bg-white/85 active:bg-white border border-slate-200/80 shadow-sm',
  };

  const textVariantClasses = {
    primary: 'text-white',
    teal: 'text-white',
    secondary: 'text-slate-800',
    outline: 'text-[#1E58C8]',
    ghost: 'text-slate-700',
    danger: 'text-white',
    glass: 'text-slate-800',
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, style]}
      className={`${sizeClasses[size]} ${variantClasses[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${disabled ? 'opacity-50' : 'opacity-100'} ${className}`}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' || variant === 'glass' ? '#1E58C8' : '#FFFFFF'}
          size="small"
        />
      ) : (
        <>
          {icon && <View style={{ flexShrink: 0 }}>{icon}</View>}
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            className={`${textSizes[size]} ${textVariantClasses[variant]}`}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
