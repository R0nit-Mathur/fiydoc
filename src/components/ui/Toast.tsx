import React from 'react';
import { View, Text, Animated } from 'react-native';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react-native';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss?: () => void;
}

export function Toast({ toast }: ToastProps) {
  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 size={20} color="#10B981" />,
    error: <XCircle size={20} color="#EF4444" />,
    warning: <AlertTriangle size={20} color="#F59E0B" />,
    info: <Info size={20} color="#1E58C8" />,
  };

  const bgStyles = {
    success: 'bg-emerald-900/90 border-emerald-700',
    error: 'bg-red-900/90 border-red-700',
    warning: 'bg-amber-900/90 border-amber-700',
    info: 'bg-blue-900/90 border-blue-700',
  };

  return (
    <View className="absolute top-12 left-4 right-4 z-50">
      <View
        className={`flex-row items-center space-x-3 p-4 rounded-2xl border shadow-lg ${
          bgStyles[toast.type]
        }`}
      >
        {icons[toast.type]}
        <View className="flex-1">
          <Text className="text-sm font-bold text-white">{toast.title}</Text>
          {toast.message && (
            <Text className="text-xs text-slate-200 mt-0.5">{toast.message}</Text>
          )}
        </View>
      </View>
    </View>
  );
}
