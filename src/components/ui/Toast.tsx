import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react-native';
import { Palette, BorderRadius, Shadows } from '@/constants/theme';

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
    success: <CheckCircle2 size={20} color={Palette.success} />,
    error: <XCircle size={20} color={Palette.danger} />,
    warning: <AlertTriangle size={20} color={Palette.warning} />,
    info: <Info size={20} color={Palette.primaryBlue} />,
  };

  return (
    <View style={styles.outerContainer} pointerEvents="box-none">
      <View style={[styles.card, cardVariantStyles[toast.type], Shadows.modal]}>
        {icons[toast.type]}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{toast.title}</Text>
          {toast.message && <Text style={styles.message}>{toast.message}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.white,
  },
  message: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
});

const cardVariantStyles = StyleSheet.create({
  success: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
  },
  error: {
    backgroundColor: '#7F1D1D',
    borderColor: '#DC2626',
  },
  warning: {
    backgroundColor: '#78350F',
    borderColor: '#D97706',
  },
  info: {
    backgroundColor: '#1E3A8A',
    borderColor: '#2563EB',
  },
});
