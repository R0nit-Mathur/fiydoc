import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps, Platform } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  activeColor?: string;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerClassName = '',
  activeColor = '#1E58C8',
  multiline,
  style,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Text className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
          {label}
        </Text>
      )}
      <View
        style={{
          height: multiline ? 90 : 50,
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          backgroundColor: 'rgba(248, 250, 252, 0.92)',
          borderWidth: 1.5,
          borderColor: error
            ? '#EF4444'
            : isFocused
            ? activeColor
            : '#E2E8F0',
          borderRadius: 16,
          paddingHorizontal: 14,
          paddingVertical: multiline ? 10 : 0,
        }}
      >
        {leftIcon && (
          <View
            style={{
              marginRight: 10,
              justifyContent: 'center',
              alignItems: 'center',
              flexShrink: 0,
              marginTop: multiline ? (Platform.OS === 'ios' ? 2 : 4) : 0,
            }}
          >
            {leftIcon}
          </View>
        )}
        <TextInput
          placeholderTextColor="#94A3B8"
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
            {
              flex: 1,
              height: multiline ? 70 : '100%',
              textAlignVertical: multiline ? 'top' : 'center',
              includeFontPadding: false,
              paddingVertical: 0,
              paddingHorizontal: 0,
              margin: 0,
              fontSize: 14,
              fontWeight: '600',
              color: '#0F172A',
            },
            style,
          ]}
          {...props}
        />
        {rightIcon && (
          <View
            style={{
              marginLeft: 10,
              justifyContent: 'center',
              alignItems: 'center',
              flexShrink: 0,
              marginTop: multiline ? (Platform.OS === 'ios' ? 2 : 4) : 0,
            }}
          >
            {rightIcon}
          </View>
        )}
      </View>
      {error && <Text className="text-xs text-red-500 font-medium mt-1">{error}</Text>}
    </View>
  );
}
