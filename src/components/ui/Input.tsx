import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  Platform,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useDerivedValue,
  interpolateColor,
} from 'react-native-reanimated';
import { BorderRadius, Shadows } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  multiline,
  style,
  containerStyle,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const { colors } = useAppTheme();
  const errorColor = colors.danger;
  const [isFocused, setIsFocused] = useState(false);

  // Animate border color
  const focusProgress = useDerivedValue(() => {
    return withTiming(isFocused ? 1 : 0, { duration: 200 });
  });

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = error
      ? errorColor
      : interpolateColor(
          focusProgress.value,
          [0, 1],
          [colors.border, colors.primary]
        );

    return {
      borderColor,
      ...(isFocused && !error ? Shadows.focus : {}),
    };
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <Animated.View
        style={[
          styles.inputRow,
          { backgroundColor: colors.card },
          multiline ? styles.multilineRow : styles.singleLineRow,
          animatedBorderStyle,
        ]}
      >
        {leftIcon && (
          <View
            style={[
              styles.iconWrapper,
              styles.leftIcon,
              multiline && styles.multilineIcon,
            ]}
          >
            {leftIcon}
          </View>
        )}
        <TextInput
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.inputField,
            { color: colors.text },
            multiline ? styles.multilineField : styles.singleLineField,
            style,
          ]}
          {...props}
        />
        {rightIcon && (
          <View
            style={[
              styles.iconWrapper,
              styles.rightIcon,
              multiline && styles.multilineIcon,
            ]}
          >
            {rightIcon}
          </View>
        )}
      </Animated.View>
      {error ? <Text style={[styles.errorText, { color: errorColor }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.xl, // Softer borders
    paddingHorizontal: 16,
  },
  singleLineRow: {
    height: 54, // slightly taller for a premium feel
  },
  multilineRow: {
    minHeight: 100,
    maxHeight: 180,
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 12,
  },
  multilineIcon: {
    marginTop: Platform.OS === 'ios' ? 2 : 4,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
  },
  singleLineField: {
    height: 54,
  },
  multilineField: {
    minHeight: 76,
    maxHeight: 156,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
  },
});
