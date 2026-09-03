import React from 'react';
import { View, ViewProps } from 'react-native';

interface SkeletonProps extends ViewProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 12,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  return (
    <View
      className={`bg-slate-200 dark:bg-slate-700/60 animate-pulse ${className}`}
      style={[{ width: width as any, height, borderRadius }, style]}
      {...props}
    />
  );
}

export function DoctorCardSkeleton() {
  return (
    <View className="bg-white dark:bg-slate-800 rounded-3xl p-4 mb-3.5 border border-slate-100 dark:border-slate-700">
      <View className="flex-row space-x-3.5">
        <Skeleton width={80} height={80} borderRadius={16} />
        <View className="flex-1 justify-between py-1">
          <Skeleton width="70%" height={18} />
          <Skeleton width="40%" height={14} />
          <Skeleton width="90%" height={12} />
        </View>
      </View>
      <View className="flex-row justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-700">
        <Skeleton width="40%" height={14} />
        <Skeleton width="25%" height={28} borderRadius={10} />
      </View>
    </View>
  );
}
