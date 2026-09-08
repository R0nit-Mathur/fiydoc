import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Palette, Typography, BorderRadius, Shadows, Spacing } from '@/constants/theme';
import { AlertCircle, AlertTriangle, Info, HelpCircle } from 'lucide-react-native';

export interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary' | 'teal';
  iconVariant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  iconVariant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!visible) return null;

  const iconBg = {
    danger: Palette.dangerBg,
    warning: Palette.warningBg,
    info: Palette.primaryBlueLight,
  }[iconVariant];

  const iconColor = {
    danger: Palette.danger,
    warning: Palette.warning,
    info: Palette.primaryBlue,
  }[iconVariant];

  const confirmBtnBg = {
    danger: Palette.danger,
    primary: Palette.primaryDark,
    teal: Palette.healthcareTeal,
  }[confirmVariant];

  const IconComp = iconVariant === 'warning' ? AlertTriangle : iconVariant === 'danger' ? AlertCircle : Info;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.dialogContainer} onPress={(e) => e.stopPropagation()}>
          {/* Header Icon */}
          <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
            <IconComp size={24} color={iconColor} />
          </View>

          {/* Text content */}
          <View style={styles.textContainer}>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.messageText}>{message}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={onCancel}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={loading}
              activeOpacity={0.8}
              style={[styles.confirmButton, { backgroundColor: confirmBtnBg }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmButtonText}>{confirmText}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(13, 23, 45, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Palette.card,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.cardBorderLight,
    ...Shadows.modal,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    gap: Spacing.xs,
  },
  titleText: {
    ...Typography.h2,
    textAlign: 'center',
  },
  messageText: {
    ...Typography.body,
    textAlign: 'center',
    color: Palette.textSecondary,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    backgroundColor: Palette.background,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  confirmButton: {
    flex: 1.2,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
