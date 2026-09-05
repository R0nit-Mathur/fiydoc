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
      sm: { width: 26, height: 43 },
      md: { width: 36, height: 59 },
      lg: { width: 50, height: 82 },
      xl: { width: 70, height: 115 },
      '2xl': { width: 92, height: 151 },
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
      sm: { width: 38, height: 38 },
      md: { width: 54, height: 54 },
      lg: { width: 78, height: 78 },
      xl: { width: 106, height: 106 },
      '2xl': { width: 132, height: 132 },
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
  const logoDimensions = {
    sm: { width: 96, height: 37 },
    md: { width: 130, height: 50 },
    lg: { width: 165, height: 63 },
    xl: { width: 195, height: 75 },
    '2xl': { width: 220, height: 84 },
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
