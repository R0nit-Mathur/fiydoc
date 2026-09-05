import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';

interface ConfirmationAnimationProps {
  title?: string;
  subtitle?: string;
  color?: string;
  size?: number;
  onAnimationEnd?: () => void;
}

export function ConfirmationAnimation({
  title,
  subtitle,
  color = '#10B981',
  size = 72,
  onAnimationEnd,
}: ConfirmationAnimationProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rippleAnim1 = useRef(new Animated.Value(0)).current;
  const rippleAnim2 = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    // 1. Spring pop for the checkmark icon
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();

    // 2. Ripple pulse waves
    Animated.loop(
      Animated.stagger(400, [
        Animated.timing(rippleAnim1, {
          toValue: 1,
          duration: 1600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(rippleAnim2, {
          toValue: 1,
          duration: 1600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Staggered text reveal
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(textTranslateY, {
        toValue: 0,
        friction: 6,
        tension: 50,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onAnimationEnd?.();
    });
  }, []);

  const rippleScale1 = rippleAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.8],
  });
  const rippleOpacity1 = rippleAnim1.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.6, 0.25, 0],
  });

  const rippleScale2 = rippleAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.8],
  });
  const rippleOpacity2 = rippleAnim2.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0.6, 0.25, 0],
  });

  return (
    <View style={styles.container}>
      {/* Icon with Concentric Ripple Halos */}
      <View style={[styles.haloContainer, { width: size * 1.8, height: size * 1.8 }]}>
        <Animated.View
          style={[
            styles.ripple,
            {
              width: size * 1.5,
              height: size * 1.5,
              borderRadius: (size * 1.5) / 2,
              backgroundColor: color,
              opacity: rippleOpacity1,
              transform: [{ scale: rippleScale1 }],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.ripple,
            {
              width: size * 1.5,
              height: size * 1.5,
              borderRadius: (size * 1.5) / 2,
              backgroundColor: color,
              opacity: rippleOpacity2,
              transform: [{ scale: rippleScale2 }],
            },
          ]}
        />

        <Animated.View
          style={[
            styles.iconWrapper,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: '#ECFDF5',
              borderColor: '#D1FAE5',
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <CheckCircle2 size={size * 0.58} color={color} />
        </Animated.View>
      </View>

      {/* Optional Animated Title & Subtitle */}
      {(title || subtitle) && (
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  haloContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 12,
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
