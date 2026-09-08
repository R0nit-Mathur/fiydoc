import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { Palette, BorderRadius } from '@/constants/theme';

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
    <View style={styles.banner}>
      <View style={styles.messageWrap}>
        <WifiOff size={16} color={Palette.danger} />
        <View style={styles.textColumn}>
          <Text style={styles.title}>Offline Mode Active</Text>
          <Text style={styles.subtitle}>Serving cached medical records & offline store.</Text>
        </View>
      </View>

      <Pressable
        onPress={handleRetry}
        disabled={isReconnecting}
        style={({ pressed }) => [
          styles.retryBtn,
          pressed && styles.retryBtnPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Retry connection"
      >
        <RefreshCw size={12} color={Palette.white} />
        <Text style={styles.retryText}>
          {isReconnecting ? 'Testing...' : 'Reconnect'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: Palette.primaryDark,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
  },
  messageWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.white,
  },
  subtitle: {
    fontSize: 11,
    color: Palette.textMuted,
    marginTop: 1,
  },
  retryBtn: {
    backgroundColor: '#27272A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#3F3F46',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retryBtnPressed: {
    backgroundColor: '#3F3F46',
  },
  retryText: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.white,
  },
});
