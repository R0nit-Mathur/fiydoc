import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface FiYLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'horizontal' | 'icon';
  style?: any;
}

export function FiYLogo({ size = 'md', variant = 'horizontal', style }: FiYLogoProps) {
  if (variant === 'icon') {
    const iconDimensions = {
      sm: { width: 32, height: 32 },
      md: { width: 44, height: 44 },
      lg: { width: 64, height: 64 },
      xl: { width: 88, height: 88 },
      '2xl': { width: 110, height: 110 },
    };
    const dim = iconDimensions[size] || iconDimensions.md;

    return (
      <View style={[styles.container, style]}>
        <Image
          source={require('../../../assets/images/app logo.png')}
          style={{ width: dim.width, height: dim.height, borderRadius: dim.width * 0.22 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Full Brand Logo (as in Screenshot 2)
  const logoDimensions = {
    sm: { width: 92, height: 30 },
    md: { width: 125, height: 40 },
    lg: { width: 175, height: 56 },
    xl: { width: 230, height: 74 },
    '2xl': { width: 280, height: 90 },
  };
  const dim = logoDimensions[size] || logoDimensions.md;

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../../assets/images/logo.png')}
        style={{ width: dim.width, height: dim.height }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
