import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutChangeEvent,
  ViewStyle,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Shadows } from '@/constants/theme';

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedControlProps<T extends string = string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const { colors, isDark } = useAppTheme();
  const [containerWidth, setContainerWidth] = React.useState(0);
  const selectedIndex = options.findIndex((opt) => opt.value === value);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const translateX = useSharedValue(0);

  const numOptions = options.length;
  const padding = 4;
  const tabWidth = containerWidth > 0 ? (containerWidth - padding * 2) / numOptions : 0;

  React.useEffect(() => {
    if (tabWidth > 0) {
      translateX.value = withSpring(activeIndex * tabWidth, {
        damping: 20,
        stiffness: 240,
        mass: 0.8,
      });
    }
  }, [activeIndex, tabWidth]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setContainerWidth(width);
    if (width > 0) {
      const singleWidth = (width - padding * 2) / numOptions;
      translateX.value = activeIndex * singleWidth;
    }
  };

  const handleSelect = (val: T) => {
    if (val !== value) {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
      onChange(val);
    }
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.track,
        {
          backgroundColor: isDark ? '#1E293B' : '#EAEDFF', // Stitch surfaceContainer
          borderColor: isDark ? '#283044' : 'rgba(20, 80, 163, 0.08)',
        },
        style,
      ]}
    >
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabWidth,
              backgroundColor: isDark ? '#283044' : '#FFFFFF',
            },
            Shadows.subtle,
            indicatorStyle,
          ]}
        />
      )}

      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => handleSelect(option.value)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
            style={styles.tab}
          >
            {option.icon && (
              <View style={styles.iconWrap}>{option.icon}</View>
            )}
            <Text
              numberOfLines={1}
              style={[
                styles.tabText,
                {
                  color: isSelected
                    ? isDark ? '#38BDF8' : '#1450A3'
                    : isDark ? '#94A3B8' : '#424752',
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: 24, // Stitch full pill
    position: 'relative',
    borderWidth: 1,
    height: 48,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 20, // Pill indicator
    zIndex: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: '100%',
    zIndex: 2,
  },
  iconWrap: {
    flexShrink: 0,
  },
  tabText: {
    fontSize: 14,
    letterSpacing: -0.1,
  },
});
