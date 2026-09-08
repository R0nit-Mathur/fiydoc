import React from 'react';
import { View, Pressable, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, HelpCircle } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { FiYLogo } from '@/components/ui/FiYLogo';
import { StitchColors } from '@/constants/theme';

export interface UniversalTopBarProps {
  onBackPress?: () => void;
  showBackButton?: boolean;
  onHelpPress?: () => void;
  showHelpButton?: boolean;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  style?: any;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function UniversalTopBar({
  onBackPress,
  showBackButton = true,
  onHelpPress,
  showHelpButton = true,
  leftAction,
  rightAction,
  transparent = true,
  style,
}: UniversalTopBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const leftScale = useSharedValue(1);
  const rightScale = useSharedValue(1);

  const leftAnim = useAnimatedStyle(() => ({
    transform: [{ scale: leftScale.value }],
  }));

  const rightAnim = useAnimatedStyle(() => ({
    transform: [{ scale: rightScale.value }],
  }));

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  const handleHelp = () => {
    if (onHelpPress) {
      onHelpPress();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 12),
          backgroundColor: transparent ? 'transparent' : StitchColors.surface,
        },
        style,
      ]}
    >
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Left Action Button (40x40 circle) */}
      <View style={styles.buttonSlot}>
        {leftAction ? (
          leftAction
        ) : showBackButton ? (
          <AnimatedPressable
            accessibilityLabel="Go back"
            onPress={handleBack}
            onPressIn={() => (leftScale.value = withSpring(0.92, { damping: 15 }))}
            onPressOut={() => (leftScale.value = withSpring(1, { damping: 15 }))}
            style={[styles.circularButton, leftAnim]}
          >
            <ChevronLeft size={20} color="#334155" strokeWidth={2.2} />
          </AnimatedPressable>
        ) : (
          <View style={styles.placeholderButton} />
        )}
      </View>

      {/* Center Logo */}
      <View style={styles.centerSlot}>
        <FiYLogo size="sm" />
      </View>

      {/* Right Action Button (40x40 circle) */}
      <View style={styles.buttonSlot}>
        {rightAction ? (
          rightAction
        ) : showHelpButton ? (
          <AnimatedPressable
            accessibilityLabel="Help & Support"
            onPress={handleHelp}
            onPressIn={() => (rightScale.value = withSpring(0.92, { damping: 15 }))}
            onPressOut={() => (rightScale.value = withSpring(1, { damping: 15 }))}
            style={[styles.circularButton, rightAnim]}
          >
            <HelpCircle size={20} color="#475569" strokeWidth={2} />
          </AnimatedPressable>
        ) : (
          <View style={styles.placeholderButton} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 50,
  },
  buttonSlot: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
      },
    }),
  },
  placeholderButton: {
    width: 40,
    height: 40,
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
