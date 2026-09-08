import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Palette, BorderRadius, Shadows } from '@/constants/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: StyleProp<ViewStyle | ImageStyle>;
}

const SIZE_MAP = {
  sm: { size: 36, text: 12, radius: 12 },
  md: { size: 44, text: 15, radius: 14 },
  lg: { size: 56, text: 18, radius: 18 },
  xl: { size: 72, text: 22, radius: 22 },
};

export function Avatar({ uri, name = 'User', size = 'md', style }: AvatarProps) {
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
        style={[
          styles.fallback,
          {
            width: config.size,
            height: config.size,
            borderRadius: config.radius,
          },
          Shadows.subtle,
          style as StyleProp<ViewStyle>,
        ]}
      >
        <Text
          style={[
            styles.initials,
            { fontSize: config.text },
          ]}
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
      style={[
        styles.image,
        {
          width: config.size,
          height: config.size,
          borderRadius: config.radius,
        },
        style as StyleProp<ImageStyle>,
      ]}
      resizeMode="cover"
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: Palette.healthcareTeal,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Palette.healthcareTealHover,
    flexShrink: 0,
  },
  initials: {
    fontWeight: '800',
    color: Palette.white,
    letterSpacing: 0.5,
  },
  image: {
    backgroundColor: Palette.cardBorderLight,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    flexShrink: 0,
  },
});
