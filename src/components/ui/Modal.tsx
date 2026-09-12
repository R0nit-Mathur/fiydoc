import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { X } from 'lucide-react-native';
import { Palette, BorderRadius, Shadows } from '@/constants/theme';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  fullscreen?: boolean;
  contentStyle?: ViewStyle;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  fullscreen = false,
  contentStyle,
}: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.keyboardAvoid}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable
            style={[
              styles.modalCard,
              fullscreen ? styles.modalCardFullscreen : styles.modalCardStandard,
              Shadows.modal,
              contentStyle,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {title && (
              <View style={styles.headerRow}>
                <Text style={styles.titleText} numberOfLines={1}>
                  {title}
                </Text>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.closeButtonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Close modal"
                >
                  <X size={18} color={Palette.textSecondary} />
                </Pressable>
              </View>
            )}
            <View style={styles.contentWrap}>{children}</View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        style={styles.keyboardAvoid}
      >
        <Pressable style={styles.bottomSheetBackdrop} onPress={onClose}>
          <Pressable
            style={[styles.bottomSheetCard, Shadows.modal]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.handleBar} />
            {title && (
              <View style={styles.headerRow}>
                <Text style={styles.titleText} numberOfLines={1}>
                  {title}
                </Text>
                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.closeButtonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Close bottom sheet"
                >
                  <X size={18} color={Palette.textSecondary} />
                </Pressable>
              </View>
            )}
            <View style={styles.contentWrap}>{children}</View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    backgroundColor: Palette.card,
    borderRadius: BorderRadius['2xl'],
    padding: 20,
    borderWidth: 1,
    borderColor: Palette.cardBorderLight,
  },
  modalCardStandard: {
    maxWidth: 460,
    maxHeight: '90%',
  },
  modalCardFullscreen: {
    maxWidth: 680,
    height: '92%',
  },
  bottomSheetCard: {
    width: '100%',
    backgroundColor: Palette.card,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    padding: 20,
    maxHeight: '85%',
    borderTopWidth: 1,
    borderTopColor: Palette.cardBorderLight,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: Palette.cardBorder,
    borderRadius: BorderRadius.full,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Palette.cardBorderLight,
    marginBottom: 16,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: Palette.textPrimary,
    flex: 1,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Palette.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonPressed: {
    backgroundColor: Palette.cardBorderLight,
  },
  contentWrap: {
    flexShrink: 1,
  },
});
