import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface FiYLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export function FiYLogo({ size = 'md', showText = true, variant = 'light' }: FiYLogoProps) {
  const iconSizes = {
    sm: { width: 28, height: 34, fontSize: 'text-xl', iconScale: 0.7 },
    md: { width: 38, height: 46, fontSize: 'text-2xl', iconScale: 1.0 },
    lg: { width: 56, height: 68, fontSize: 'text-4xl', iconScale: 1.5 },
    xl: { width: 80, height: 96, fontSize: 'text-5xl', iconScale: 2.1 },
  };

  const current = iconSizes[size];

  return (
    <View className="flex-row items-center space-x-2">
      {/* FiYDoc Icon — Teal 'Y' Doctor avatar with Stethoscope accent */}
      <Svg width={current.width} height={current.height} viewBox="0 0 50 60" fill="none">
        {/* Head */}
        <Circle cx="25" cy="12" r="9" fill="#00B39B" />
        {/* 'Y' Body Arms & Trunk */}
        <Path
          d="M 10 24 C 10 24, 18 29, 25 38 C 32 29, 40 24, 40 24 C 44 21, 46 27, 43 32 L 29 55 C 27 58, 23 58, 21 55 L 7 32 C 4 27, 6 21, 10 24 Z"
          fill="#00B39B"
        />
        {/* Stethoscope Loop */}
        <Path
          d="M 28 22 C 34 22, 38 27, 36 37 C 35 44, 38 48, 41 49"
          stroke="#0F2454"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        <Circle cx="41" cy="51" r="3.5" fill="#FFFFFF" stroke="#0F2454" strokeWidth="2.5" />
        <Path d="M 17 28 L 19 32" stroke="#0F2454" strokeWidth="2" strokeLinecap="round" />
      </Svg>

      {showText && (
        <View className="flex-row items-baseline">
          <Text className={`font-black ${current.fontSize} text-[#1E58C8]`}>
            Fi
          </Text>
          <Text className={`font-black ${current.fontSize} text-[#00B39B]`}>
            Y
          </Text>
          <Text className={`font-black ${current.fontSize} text-[#1E58C8]`}>
            Doc
          </Text>
        </View>
      )}
    </View>
  );
}
