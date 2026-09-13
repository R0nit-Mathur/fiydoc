import React, { useEffect, useState, useRef } from 'react';
import { Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { RotateCcw, X } from 'lucide-react-native';
import { StitchColors, BorderRadius, Shadows } from '@/constants/theme';

interface UndoToastProps {
  /** Show the toast */
  visible: boolean;
  /** Message describing the performed action */
  message: string;
  /** Called when the user taps the Undo button */
  onUndo: () => void;
  /** Optional callback when dismissed */
  onDismiss?: () => void;
  /** Duration in milliseconds before auto-hiding (default: 8000ms). Pass 0 to keep until action. */
  durationMs?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  visible,
  message,
  onUndo,
  onDismiss,
  durationMs = 8000,
}) => {
  const [show, setShow] = useState(visible);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      setShow(true);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      ]).start();

      if (durationMs > 0) {
        const timer = setTimeout(() => {
          hideToast();
        }, durationMs);
        return () => clearTimeout(timer);
      }
    } else {
      hideToast();
    }
  }, [visible, durationMs]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 20, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setShow(false);
      onDismiss?.();
    });
  };

  if (!show) return null;

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <RotateCcw size={16} color="#5EEAD4" style={styles.icon} />
      <Text style={styles.message} numberOfLines={2}>
        {message}
      </Text>
      <TouchableOpacity
        onPress={() => {
          onUndo();
          hideToast();
        }}
        activeOpacity={0.8}
        style={styles.undoButton}
        accessibilityRole="button"
        accessibilityLabel="Undo action"
      >
        <Text style={styles.undoText}>Undo</Text>
      </TouchableOpacity>
      {onDismiss ? (
        <TouchableOpacity onPress={hideToast} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.closeBtn}>
          <X size={16} color="#94A3B8" />
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
};

export default UndoToast;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 70,
    left: 16,
    right: 16,
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    borderWidth: 1,
    borderColor: '#334155',
    ...Shadows.modal,
  },
  icon: {
    marginRight: 10,
  },
  message: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
    lineHeight: 18,
  },
  undoButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: StitchColors.primaryContainer,
    borderRadius: BorderRadius.full,
  },
  undoText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  closeBtn: {
    marginLeft: 8,
    padding: 2,
  },
});
