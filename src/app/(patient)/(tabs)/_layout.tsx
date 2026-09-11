/**
 * Patient Tab Layout — Stitch "Animated Pill Nav"
 *
 * Custom pill tab bar built on top of expo-router's Tabs.
 * - Active tab: primaryContainer pill behind icon, primary text
 * - Inactive: textMuted
 * - BlurView background (iOS) / fallback translucent surface
 * - Reanimated layout transitions for pill sliding
 */
import React, { useEffect } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  withTiming,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Compass,
  CalendarDays,
  FileText,
  type LucideIcon,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { BorderRadius, Shadows, Spacing, StitchColors } from '@/constants/theme';

type TabKey = 'home' | 'appointments' | 'health';

interface TabConfig {
  key: TabKey;
  label: string;
  icon: LucideIcon;
  badge?: string;
}

const TABS: TabConfig[] = [
  { key: 'home', label: 'Explore', icon: Compass },
  { key: 'appointments', label: 'Visits', icon: CalendarDays, badge: '1' },
  { key: 'health', label: 'Records', icon: FileText },
];

/* -------------------------------------------------------------------------- */
/*                              Animated Pill Nav                             */
/* -------------------------------------------------------------------------- */

function PillTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 20);
  const [barWidth, setBarWidth] = React.useState(320);

  // Map route name to primary tab index (or fallback to -1 if on auxiliary screen)
  const currentRouteName = state.routes[state.index]?.name;
  const activeTabIndex = TABS.findIndex((t) => t.key === currentRouteName);
  const pillIndex = activeTabIndex >= 0 ? activeTabIndex : (currentRouteName === 'discovery' ? 0 : 0);

  const pillX = useSharedValue(pillIndex);
  const opacity = useSharedValue(0);

  useEffect(() => {
    pillX.value = withSpring(pillIndex, { damping: 22, stiffness: 260 });
    opacity.value = withTiming(1, { duration: 300 });
  }, [pillIndex, pillX, opacity]);

  const singleTabWidth = barWidth / TABS.length;
  const pillPadding = 4;
  const pillWidth = Math.max(0, singleTabWidth - pillPadding * 2);

  const animatedPillStyle = useAnimatedStyle(() => ({
    width: pillWidth,
    transform: [
      {
        translateX: pillX.value * singleTabWidth + pillPadding,
      },
    ],
  }));

  const containerAnimated = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.tabBarWrap,
        { paddingBottom: bottomInset },
      ]}
    >
      <Animated.View
        onLayout={(e) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - barWidth) > 1) {
            setBarWidth(w);
          }
        }}
        style={[
          styles.tabBarInner,
          containerAnimated,
        ]}
      >
        {Platform.OS === 'ios' && (
          <BlurView
            tint="light"
            intensity={95}
            style={StyleSheet.absoluteFill}
          />
        )}

        {/* Animated background pill */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activePill,
            animatedPillStyle,
          ]}
        />

        {TABS.map((tab, index) => {
          const isActive = activeTabIndex === index;
          const Icon = tab.icon;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              onPress={() => {
                if (!isActive) {
                  navigation.navigate(tab.key);
                }
              }}
              style={styles.tabBtn}
            >
              <View style={styles.iconContainer}>
                <Icon
                  size={19}
                  color={isActive ? '#ffffff' : '#64748b'}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
                {tab.badge && !isActive && (
                  <View style={styles.badgeWrap}>
                    <Text style={styles.badgeText}>{tab.badge}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? '#ffffff' : '#64748b',
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Layout                                    */
/* -------------------------------------------------------------------------- */

export default function PatientTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <PillTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="appointments" />
      <Tabs.Screen name="health" />
      <Tabs.Screen name="discovery" options={{ href: null }} />
      <Tabs.Screen name="pharmacy" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 360 : 340,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    paddingHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#002350',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 18,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 10px 30px -6px rgba(0, 35, 80, 0.15)',
      },
    }),
  },
  activePill: {
    position: 'absolute',
    left: 0,
    top: 5,
    bottom: 5,
    backgroundColor: StitchColors.primary,
    borderRadius: 25,
    ...Platform.select({
      ios: {
        shadowColor: StitchColors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 14px rgba(0, 57, 126, 0.32)',
      },
    }),
  },
  tabBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: 25,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWrap: {
    position: 'absolute',
    top: -4,
    right: -8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: StitchColors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 11,
  },
  label: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
