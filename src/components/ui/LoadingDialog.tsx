import React from 'react';
import {
  Modal,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { StitchColors, BorderRadius, Shadows } from '@/constants/theme';

export interface LoadingDialogProps {
  visible: boolean;
  title?: string;
  message?: string;
  cancelable?: boolean;
}

/**
 * Universal blocking loading dialog with circular progress indicator.
 * Blocks all underlying touch events to prevent accidental clicks or double-submissions.
 */
export function LoadingDialog({
  visible,
  title = 'Please wait...',
  message = 'Processing your request safely...',
  cancelable = false,
}: LoadingDialogProps) {
  const { colors, isDark } = useAppTheme();

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
      onRequestClose={() => {
        // Prevent dismissal on Android back button unless explicitly cancelable
      }}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialogCard,
            {
              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
              borderColor: isDark ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.spinnerWrapper}>
            <ActivityIndicator size="large" color={StitchColors.primaryContainer} />
          </View>

          <Text
            style={[
              styles.title,
              { color: isDark ? '#F8FAFC' : '#0F172A' },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>

          {message ? (
            <Text
              style={[
                styles.message,
                { color: isDark ? '#94A3B8' : '#64748B' },
              ]}
              numberOfLines={3}
            >
              {message}
            </Text>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: BorderRadius['2xl'],
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  spinnerWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(48, 85, 168, 0.08)',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
});
