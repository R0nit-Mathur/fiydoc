import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react-native';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const handleRetry = () => {
    setIsReconnecting(true);
    setTimeout(() => {
      setIsReconnecting(false);
      setIsOffline(false);
    }, 1200);
  };

  if (!isOffline) return null;

  return (
    <View className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex-row items-center justify-between z-50">
      <View className="flex-row items-center space-x-2 flex-1 mr-2">
        <WifiOff size={16} color="#EF4444" />
        <View className="flex-1">
          <Text className="text-xs font-bold text-white">Offline Mode Active</Text>
          <Text className="text-[10px] text-slate-400">Serving cached demo records & offline store.</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleRetry}
        disabled={isReconnecting}
        className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 flex-row items-center space-x-1"
      >
        <RefreshCw size={12} color="#FFFFFF" className={isReconnecting ? 'animate-spin' : ''} />
        <Text className="text-[11px] font-bold text-white">
          {isReconnecting ? 'Testing...' : 'Reconnect'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
