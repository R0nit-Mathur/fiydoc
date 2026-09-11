import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { StitchColors } from '@/constants/theme';

export interface CarouselTabItem {
  id: number;
  label: string;
}

export interface CardCarouselTabsProps {
  tabs: CarouselTabItem[];
  activeIndex: number;
  onSelectTab: (index: number) => void;
  style?: any;
}

export function CardCarouselTabs({
  tabs,
  activeIndex,
  onSelectTab,
  style,
}: CardCarouselTabsProps) {
  return (
    <View style={[styles.container, style]}>
      {tabs.map((tab, idx) => {
        const isActive = idx === activeIndex;
        const isCompleted = idx < activeIndex;

        return (
          <Pressable
            key={tab.id}
            onPress={() => onSelectTab(idx)}
            style={[
              styles.tabButton,
              isActive && styles.tabButtonActive,
              isCompleted && styles.tabButtonCompleted,
              !isActive && !isCompleted && styles.tabButtonUpcoming,
            ]}
          >
            <View style={styles.tabContent}>
              <View
                style={[
                  styles.tabBadge,
                  isActive && styles.tabBadgeActive,
                  isCompleted && styles.tabBadgeCompleted,
                  !isActive && !isCompleted && styles.tabBadgeUpcoming,
                ]}
              >
                {isCompleted ? (
                  <Check size={10} color="#ffffff" strokeWidth={3} />
                ) : (
                  <Text
                    style={[
                      styles.tabBadgeText,
                      isActive ? styles.tabBadgeTextActive : styles.tabBadgeTextUpcoming,
                    ]}
                  >
                    {idx + 1}
                  </Text>
                )}
              </View>
              <Text
                numberOfLines={1}
                style={[
                  styles.tabTitle,
                  isActive && styles.tabTitleActive,
                  isCompleted && styles.tabTitleCompleted,
                  !isActive && !isCompleted && styles.tabTitleUpcoming,
                ]}
              >
                {tab.label}
              </Text>
            </View>
            <View
              style={[
                styles.bottomBar,
                isActive && styles.bottomBarActive,
                isCompleted && styles.bottomBarCompleted,
                !isActive && !isCompleted && styles.bottomBarUpcoming,
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

export function CarouselDots({
  total,
  activeIndex,
  onSelectIndex,
  style,
}: {
  total: number;
  activeIndex: number;
  onSelectIndex?: (index: number) => void;
  style?: any;
}) {
  return (
    <View style={[styles.dotsContainer, style]}>
      {Array.from({ length: total }).map((_, idx) => {
        const isActive = idx === activeIndex;
        return (
          <Pressable
            key={idx}
            onPress={() => onSelectIndex && onSelectIndex(idx)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            style={[
              styles.dot,
              isActive ? styles.dotActive : styles.dotInactive,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    gap: 6,
    padding: 6,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  tabButtonActive: {
    backgroundColor: '#f0f5ff',
    borderColor: StitchColors.primary,
  },
  tabButtonCompleted: {
    backgroundColor: 'rgba(236, 253, 245, 0.5)',
    borderColor: '#a7f3d0',
  },
  tabButtonUpcoming: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  tabBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeActive: {
    backgroundColor: StitchColors.primary,
  },
  tabBadgeCompleted: {
    backgroundColor: '#059669',
  },
  tabBadgeUpcoming: {
    backgroundColor: '#e2e8f0',
  },
  tabBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  tabBadgeTextActive: {
    color: '#ffffff',
  },
  tabBadgeTextUpcoming: {
    color: '#64748b',
  },
  tabTitle: {
    fontSize: 10,
    flex: 1,
  },
  tabTitleActive: {
    color: StitchColors.primary,
    fontWeight: '700',
  },
  tabTitleCompleted: {
    color: '#047857',
    fontWeight: '600',
  },
  tabTitleUpcoming: {
    color: '#64748b',
    fontWeight: '500',
  },
  bottomBar: {
    height: 3,
    borderRadius: 2,
    width: '100%',
  },
  bottomBarActive: {
    backgroundColor: StitchColors.primary,
  },
  bottomBarCompleted: {
    backgroundColor: '#10b981',
  },
  bottomBarUpcoming: {
    backgroundColor: '#e2e8f0',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: StitchColors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#cbd5e1',
  },
});
