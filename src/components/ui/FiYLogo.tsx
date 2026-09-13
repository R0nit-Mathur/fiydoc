import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface FiYLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'horizontal' | 'icon' | 'symbol';
  style?: any;
}

export function FiYLogo({ size = 'md', variant = 'horizontal', style }: FiYLogoProps) {
  if (variant === 'symbol') {
    // Isolated transparent doctor-Y stethoscope symbol (aspect 0.608)
    const symbolDimensions = {
      sm: { width: 20, height: 33 },
      md: { width: 28, height: 46 },
      lg: { width: 38, height: 62 },
      xl: { width: 52, height: 85 },
      '2xl': { width: 68, height: 112 },
    };
    const dim = symbolDimensions[size] || symbolDimensions.md;

    return (
      <View style={[styles.container, style]}>
        <Image
          source={require('../../../assets/images/app_icon_symbol.png')}
          style={{ width: dim.width, height: dim.height }}
          resizeMode="contain"
        />
      </View>
    );
  }

  if (variant === 'icon') {
    const iconDimensions = {
      sm: { width: 28, height: 28 },
      md: { width: 40, height: 40 },
      lg: { width: 56, height: 56 },
      xl: { width: 76, height: 76 },
      '2xl': { width: 96, height: 96 },
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

  // Full Brand Wordmark (tightly-cropped transparent PNG, true aspect ratio 2.616)
  // Scaled down to fit neatly in mobile headers and screens without overflow
  const logoDimensions = {
    sm: { width: 48, height: 18 },
    md: { width: 62, height: 24 },
    lg: { width: 80, height: 31 },
    xl: { width: 100, height: 38 },
    '2xl': { width: 120, height: 46 },
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
    alignSelf: 'center',
  },
});
