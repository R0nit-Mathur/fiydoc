import React from 'react';
import { View, Text } from 'react-native';
import { Button } from './Button';
import { AlertCircle } from 'lucide-react-native';

interface EmptyStateProps {
  title: string;
  description: string;
  actionTitle?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionTitle,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-10 px-6 bg-slate-50/50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 my-4">
      <View className="bg-teal-50 dark:bg-teal-950/50 p-4 rounded-full mb-3">
        {icon || <AlertCircle size={32} color="#00B39B" />}
      </View>
      <Text className="text-lg font-bold text-slate-900 dark:text-white text-center">
        {title}
      </Text>
      <Text className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1 mb-5 max-w-xs">
        {description}
      </Text>
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="teal"
          size="sm"
          fullWidth={false}
        />
      )}
    </View>
  );
}
