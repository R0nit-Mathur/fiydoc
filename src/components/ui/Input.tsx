import React from 'react';
import { View, Text, TextInput, TextInputProps, Platform } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  containerClassName = '',
  multiline,
  style,
  ...props
}: InputProps) {
  return (
    <View className={`w-full ${containerClassName}`}>
      {label && (
        <Text className="text-sm font-semibold text-slate-700 mb-1.5">
          {label}
        </Text>
      )}
      <View
        className={`flex-row border rounded-2xl bg-slate-50 px-3.5 ${
          error
            ? 'border-red-500 bg-red-50/50'
            : 'border-slate-200 focus:border-[#1E58C8]'
        }`}
        style={{
          minHeight: multiline ? 96 : 52,
          alignItems: multiline ? 'flex-start' : 'center',
          paddingVertical: multiline ? 12 : 0,
        }}
      >
        {leftIcon && (
          <View
            className="mr-2.5"
            style={{ marginTop: multiline ? (Platform.OS === 'ios' ? 2 : 4) : 0 }}
          >
            {leftIcon}
          </View>
        )}
        <TextInput
          placeholderTextColor="#94A3B8"
          multiline={multiline}
          className="flex-1 text-base text-slate-900 font-medium"
          style={[
            {
              textAlignVertical: multiline ? 'top' : 'center',
              includeFontPadding: false,
              paddingVertical: 0,
              paddingHorizontal: 0,
              height: multiline ? 80 : 50,
              fontSize: 15,
            },
            style,
          ]}
          {...props}
        />
        {rightIcon && (
          <View
            className="ml-2.5"
            style={{ marginTop: multiline ? (Platform.OS === 'ios' ? 2 : 4) : 0 }}
          >
            {rightIcon}
          </View>
        )}
      </View>
      {error && <Text className="text-xs text-red-500 font-medium mt-1">{error}</Text>}
    </View>
  );
}
