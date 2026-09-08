import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LucideIcon } from 'lucide-react-native';
import { StitchColors } from '@/constants/theme';

export interface FloatingTabItem {
  key: string;
  label: string;
  icon: LucideIcon;
  badgeCount?: number;
}

export interface FloatingPillNavBarProps {
  tabs: FloatingTabItem[];
  activeTabKey: string;
  onTabPress: (key: string) => void;
  style?: any;
}

export function FloatingPillNavBar({
  tabs,
  activeTabKey,
  onTabPress,
  style,
}: FloatingPillNavBarProps) {
  const insets = useSafeAreaInsets();
  const activeIndex = Math.max(0, tabs.findIndex((t) => t.key === activeTabKey));
  const containerWidth = useSharedValue(0);
  const pillIndex = useSharedValue(activeIndex);

  useEffect(() => {
    pillIndex.value = withSpring(activeIndex, {
      damping: 22,
      stiffness: 280,
    });
  }, [activeIndex]);

  const onLayout = (e: LayoutChangeEvent) => {
    containerWidth.value = e.nativeEvent.layout.width;
  };

  const pillAnimatedStyle = useAnimatedStyle(() => {
    if (containerWidth.value === 0 || tabs.length === 0) return {};
    const tabWidth = (containerWidth.value - 12) / tabs.length;
    return {
      width: tabWidth,
      transform: [{ translateX: pillIndex.value * tabWidth }],
    };
  });

  const handlePress = (key: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onTabPress(key);
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        {
          bottom: Math.max(insets.bottom, 12) + 4,
        },
        style,
      ]}
    >
      <View style={styles.navContainer} onLayout={onLayout}>
        {/* Animated Sliding Pill Backdrop */}
        <Animated.View style={[styles.activePillIndicator, pillAnimatedStyle]} pointerEvents="none" />

        {/* Tab Items */}
        {tabs.map((tab) => {
          const isActive = tab.key === activeTabKey;
          const IconComponent = tab.icon;

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
              onPress={() => handlePress(tab.key)}
              style={styles.tabItem}
            >
              <View style={styles.iconWrapper}>
                <IconComponent
                  size={19}
                  color={isActive ? '#ffffff' : '#64748b'}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
                {tab.badgeCount !== undefined && tab.badgeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {tab.badgeCount > 99 ? '99+' : tab.badgeCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  isActive ? styles.tabLabelActive : styles.tabLabelInactive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  navContainer: {
    width: '92%',
    maxWidth: 340,
    height: 58,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#002350',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 12px 36px -6px rgba(0, 35, 80, 0.18)',
      },
    }),
  },
  activePillIndicator: {
    position: 'absolute',
    top: 5,
    bottom: 5,
    left: 6,
    backgroundColor: StitchColors.primary,
    borderRadius: 9999,
    ...Platform.select({
      ios: {
        shadowColor: StitchColors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 14px rgba(0, 57, 126, 0.32)',
      },
    }),
  },
  tabItem: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: 9999,
    gap: 1,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: StitchColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tabLabelInactive: {
    color: '#64748b',
    fontWeight: '500',
  },
});
