/**
 * FadeIn - Screen transition and fade-in animation components
 * Apple HIG-style entrance animations with staggered reveals
 */
import React, { useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInUp,
  SlideInLeft,
  SlideInRight,
  SlideOutDown,
  SlideOutUp,
} from 'react-native-reanimated';

/**
 * FadeInView - Simple fade-in wrapper with configurable duration
 */
export interface FadeInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}

export function FadeInView({ children, duration = 400, delay = 0, style }: FadeInViewProps) {
  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(duration)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

/**
 * StaggeredFadeIn - Staggered list item animations
 */
export interface StaggeredFadeInProps {
  children: React.ReactNode[];
  delayInterval?: number; // Delay between each item in ms
  duration?: number;
  initialDelay?: number;
}

export function StaggeredFadeIn({
  children,
  delayInterval = 50,
  duration = 300,
  initialDelay = 0,
}: StaggeredFadeInProps) {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <Animated.View
          entering={FadeIn.delay(initialDelay + index * delayInterval).duration(duration)}
        >
          {child}
        </Animated.View>
      ))}
    </>
  );
}

/**
 * SlideInCard - Card slide-in animation from bottom
 */
export interface SlideInCardProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: ViewStyle | ViewStyle[];
}

export function SlideInCard({ children, delay = 0, duration = 400, style }: SlideInCardProps) {
  return (
    <Animated.View
      entering={SlideInDown.delay(delay).springify().damping(15).stiffness(100)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

/**
 * SlideInHeader - Header slide-in from top
 */
export function SlideInHeader({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: ViewStyle }) {
  return (
    <Animated.View
      entering={SlideInUp.delay(delay).duration(350)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}

/**
 * ScaleIn - Scale animation with fade
 */
export interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  initialScale?: number;
  style?: ViewStyle;
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 300,
  initialScale = 0.8,
  style,
}: ScaleInProps) {
  return (
    <Animated.View
      entering={FadeIn.delay(delay).duration(duration)}
      style={[{ opacity: 0, transform: [{ scale: initialScale }] }, style]}
    >
      <Animated.View style={{ flex: 1 }}>
        {children}
      </Animated.View>
    </Animated.View>
  );
}

/**
 * ListSkeletonLoader - Animated skeleton for lists
 */
export interface ListSkeletonLoaderProps {
  count?: number;
  itemHeight?: number;
  itemStyle?: ViewStyle;
}

export function ListSkeletonLoader({
  count = 5,
  itemHeight = 80,
  itemStyle,
}: ListSkeletonLoaderProps) {
  return (
    <StaggeredFadeIn delayInterval={30} duration={200}>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            {
              height: itemHeight,
              marginBottom: 12,
            },
            itemStyle,
          ]}
        />
      ))}
    </StaggeredFadeIn>
  );
}

/**
 * SkeletonScreen - Full skeleton loading state
 */
export interface SkeletonScreenProps {
  type?: 'list' | 'detail' | 'profile' | 'settings';
}

export function SkeletonScreen({ type = 'list' }: SkeletonScreenProps) {
  const { CardSkeleton, ListItemSkeleton, HeaderSkeleton, AvatarSkeleton, TextBlockSkeleton } = require('./Skeleton');

  switch (type) {
    case 'detail':
      return (
        <View style={{ padding: 16 }}>
          <HeaderSkeleton />
          <CardSkeleton style={{ marginTop: 16 }} />
          <TextBlockSkeleton lines={4} style={{ marginTop: 16 }} />
          <CardSkeleton style={{ marginTop: 16 }} />
        </View>
      );
    case 'profile':
      return (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <AvatarSkeleton size={100} />
          <TextBlockSkeleton lines={2} style={{ marginTop: 16, alignItems: 'center', width: 200 }} />
          <CardSkeleton style={{ marginTop: 24, width: '100%' }} />
        </View>
      );
    case 'settings':
      return (
        <View style={{ padding: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ListItemSkeleton key={i} style={{ marginBottom: 8 }} />
          ))}
        </View>
      );
    default:
      return (
        <View style={{ padding: 16 }}>
          <HeaderSkeleton />
          <View style={{ marginTop: 16 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <ListItemSkeleton key={i} style={{ marginBottom: 12 }} />
            ))}
          </View>
        </View>
      );
  }
}

// Pre-built animation configurations
export const animations = {
  // Quick fade for lists
  listItem: {
    entering: FadeIn.delay(50).duration(200),
  },
  // Smooth slide for cards
  card: {
    entering: SlideInDown.springify().damping(15).stiffness(100),
  },
  // Fast press feedback
  press: {
    scale: 0.97,
    duration: 100,
  },
  // Screen transition
  screen: {
    entering: FadeIn.duration(300),
  },
};

// Animation helpers for use with Animated.View
export const slideInCard = (delay = 0, index = 0) =>
  SlideInDown.delay(delay + index * 60).springify().damping(15).stiffness(100);

export const fadeInItem = (delay = 0, index = 0) =>
  FadeIn.delay(delay + index * 50).duration(200);

// Helper to create stagger delay
export function staggerDelay(index: number, baseDelay = 50): number {
  return index * baseDelay;
}
