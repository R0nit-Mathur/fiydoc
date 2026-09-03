import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm: { size: 36, text: 12, radius: 12 },
  md: { size: 44, text: 15, radius: 14 },
  lg: { size: 56, text: 18, radius: 18 },
  xl: { size: 72, text: 22, radius: 22 },
};

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

  const config = SIZE_MAP[size] || SIZE_MAP.md;
  const initials = getInitials(name);

  if (!uri || hasError) {
    return (
      <View
        style={{
          width: config.size,
          height: config.size,
          borderRadius: config.radius,
          flexShrink: 0,
        }}
        className={`bg-teal-600 items-center justify-center border border-teal-500 shadow-sm ${className}`}
      >
        <Text
          style={{ fontSize: config.text, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}
        >
          {initials}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      onError={() => setHasError(true)}
      style={{
        width: config.size,
        height: config.size,
        borderRadius: config.radius,
        flexShrink: 0,
      }}
      className={`bg-slate-100 border border-slate-200 ${className}`}
      resizeMode="cover"
    />
  );
}
