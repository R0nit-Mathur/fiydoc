import React from 'react';
import {
  ScrollView,
  RefreshControl,
  ScrollViewProps,
  View,
  Text,
  Animated,
  StyleSheet,
} from 'react-native';

interface PullToRefreshScrollViewProps extends ScrollViewProps {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  tintColor?: string;
  refreshText?: string;
}

export function PullToRefreshScrollView({
  children,
  refreshing,
  onRefresh,
  tintColor = '#00B39B',
  refreshText = 'Refreshing live appointments & records...',
  ...props
}: PullToRefreshScrollViewProps) {
  return (
    <ScrollView
      {...props}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[tintColor]}
          tintColor={tintColor}
          progressBackgroundColor="#FFFFFF"
          title={refreshing ? refreshText : 'Slide down to refresh'}
          titleColor="#64748B"
        />
      }
    >
      {children}
    </ScrollView>
  );
}
