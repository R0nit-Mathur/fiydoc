import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ uri, name = 'User', size = 'md', className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const getInitials = (text: string) => {
    const clean = text.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, '').trim();
    const parts = clean.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (clean.slice(0, 2) || 'FD').toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-9 h-9 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-20 h-20 text-lg',
  }[size];

  const initials = getInitials(name);

  if (!uri || hasError) {
    return (
      <View
        className={`${sizeClasses} rounded-2xl bg-teal-600 items-center justify-center border border-teal-500 shadow-sm ${className}`}
      >
        <Text className="font-extrabold text-white tracking-wider">{initials}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      onError={() => setHasError(true)}
      className={`${sizeClasses} rounded-2xl bg-slate-100 border border-slate-200 ${className}`}
      resizeMode="cover"
    />
  );
}
