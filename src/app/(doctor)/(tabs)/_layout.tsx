/**
 * Doctor Tab Layout — Stitch "Animated Pill Nav" (4 Tabs)
 *
 * Implements the 1:1 Google Stitch Doctor Companion dock navigation:
 * - Home (/(doctor)/(tabs)/home)
 * - Schedule (/(doctor)/(tabs)/schedule)
 * - Patients (/(doctor)/(tabs)/directory)
 * - Profile (/(doctor)/(tabs)/profile)
 */

import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  Home,
  Calendar,
  Users,
  User,
  type LucideIcon,
} from 'lucide-react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { BorderRadius, Shadows, StitchColors } from '@/constants/theme';

interface DoctorTabItem {
  name: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

const DOCTOR_TABS: DoctorTabItem[] = [
  { name: 'home', label: 'Home', icon: Home, href: '/(doctor)/(tabs)/home' },
  { name: 'schedule', label: 'Schedule', icon: Calendar, href: '/(doctor)/(tabs)/schedule' },
  { name: 'directory', label: 'Patients', icon: Users, href: '/(doctor)/(tabs)/directory' },
  { name: 'profile', label: 'Profile', icon: User, href: '/(doctor)/(tabs)/profile' },
];

function DoctorFloatingDock({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 10);

  const currentRouteName = state?.routes?.[state?.index]?.name || 'home';

  const handleTabPress = (tab: DoctorTabItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const isFocused = currentRouteName === tab.name;
    const event = navigation?.emit?.({
      type: 'tabPress',
      target: tab.name,
      canPreventDefault: true,
    });
    if (!isFocused && !event?.defaultPrevented) {
      navigation?.navigate?.(tab.name);
    }
  };

  return (
    <View pointerEvents="box-none" style={[styles.dockWrapper, { paddingBottom: bottomPadding }]}>
      <View style={styles.dockContainer}>
        {Platform.OS === 'ios' ? (
          <BlurView
            tint={isDark ? 'dark' : 'light'}
            intensity={95}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? 'rgba(19, 27, 46, 0.95)'
                  : 'rgba(255, 255, 255, 0.95)',
              },
            ]}
          />
        )}

        <View style={styles.tabBarInner}>
          {DOCTOR_TABS.map((tab) => {
            const isActive = currentRouteName === tab.name;
            const Icon = tab.icon;

            return (
              <Pressable
                key={tab.name}
                onPress={() => handleTabPress(tab)}
                style={[
                  styles.tabButton,
                  isActive && styles.activeTabButton,
                ]}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
              >
                <Icon
                  size={18}
                  color={isActive ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                  strokeWidth={isActive ? 2.4 : 2}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B',
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function DoctorTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <DoctorFloatingDock {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="directory" />
      <Tabs.Screen name="profile" />
      <Tabs.Screen name="appointments" options={{ href: null }} />
      <Tabs.Screen name="workspace" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  dockContainer: {
    width: '92%',
    maxWidth: 380,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    ...Shadows.modal,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 5,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: StitchColors.primaryContainer,
    ...Shadows.subtle,
  },
  tabLabel: {
    fontSize: 12,
    letterSpacing: -0.1,
  },
});
