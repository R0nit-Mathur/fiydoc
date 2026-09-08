/**
 * Smart Medical TextInput with Ghost Autocompletion
 *
 * Provides real-time clinical recommendations and ghost text autocompletion
 * based on medical knowledge for Chief Complaints, Clinical Observations,
 * Diagnosis, and Doctor's Advice.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Sparkles, Check } from 'lucide-react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { BorderRadius, StitchColors } from '@/constants/theme';
import { MEDICAL_AUTOCOMPLETES } from '@/constants/medicalCatalog';

interface SmartMedicalTextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  numberOfLines?: number;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  quickSuggestions?: string[];
}

export default function SmartMedicalTextInput({
  value,
  onChangeText,
  placeholder,
  label,
  multiline = false,
  numberOfLines = 3,
  containerStyle,
  inputStyle,
  quickSuggestions = [],
}: SmartMedicalTextInputProps) {
  const { colors, isDark } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);

  // Compute ghost suggestion
  const getGhostSuggestion = (input: string): string | null => {
    if (!input || input.trim().length < 2) return null;
    const lower = input.toLowerCase().trim();

    // Check last word or full sentence
    const words = lower.split(/\s+/);
    const lastWord = words[words.length - 1];

    for (const [key, fullPhrase] of Object.entries(MEDICAL_AUTOCOMPLETES)) {
      if (lower.startsWith(key) && fullPhrase.toLowerCase().startsWith(lower)) {
        return fullPhrase;
      }
      if (lastWord.length >= 3 && key.startsWith(lastWord)) {
        const prefix = input.substring(0, input.lastIndexOf(lastWord));
        return prefix + fullPhrase;
      }
    }
    return null;
  };

  const ghostSuggestion = getGhostSuggestion(value);

  const handleAcceptSuggestion = () => {
    if (ghostSuggestion) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onChangeText(ghostSuggestion);
    }
  };

  const handleKeyPress = (e: any) => {
    // On web, if doctor presses Tab, accept suggestion
    if (Platform.OS === 'web' && e.nativeEvent?.key === 'Tab' && ghostSuggestion) {
      e.preventDefault?.();
      handleAcceptSuggestion();
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
          {ghostSuggestion && (
            <Pressable onPress={handleAcceptSuggestion} style={styles.acceptChip}>
              <Sparkles size={11} color={StitchColors.primaryContainer} />
              <Text style={styles.acceptChipText}>Tap to auto-complete (Tab)</Text>
            </Pressable>
          )}
        </View>
      )}

      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
            borderColor: isFocused ? StitchColors.primaryContainer : colors.border,
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyPress={handleKeyPress}
          style={[
            styles.input,
            multiline && { minHeight: numberOfLines * 22, textAlignVertical: 'top' },
            { color: colors.text },
            inputStyle,
          ]}
        />
      </View>

      {/* Ghost suggestion hint box */}
      {ghostSuggestion && ghostSuggestion !== value && isFocused && (
        <Pressable
          onPress={handleAcceptSuggestion}
          style={[styles.suggestionBox, { backgroundColor: isDark ? '#0F172A' : '#F0F9FF', borderColor: '#BAE6FD' }]}
        >
          <View style={styles.suggestionLeft}>
            <Sparkles size={13} color={StitchColors.primaryContainer} />
            <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={2}>
              <Text style={{ color: colors.textMuted }}>Suggested: </Text>
              {ghostSuggestion}
            </Text>
          </View>
          <View style={styles.acceptBadge}>
            <Check size={12} color="#FFFFFF" />
            <Text style={styles.acceptBadgeText}>Accept</Text>
          </View>
        </Pressable>
      )}

      {/* Quick insertion chips */}
      {quickSuggestions.length > 0 && (
        <View style={styles.quickChipsRow}>
          {quickSuggestions.map((suggestion) => (
            <Pressable
              key={suggestion}
              onPress={() => {
                const updated = value ? `${value} ${suggestion}` : suggestion;
                onChangeText(updated);
                if (Platform.OS !== 'web') Haptics.selectionAsync();
              }}
              style={[styles.quickChip, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}
            >
              <Text style={[styles.quickChipText, { color: StitchColors.primaryContainer }]}>
                + {suggestion}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  acceptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  acceptChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: StitchColors.primaryContainer,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    fontSize: 13,
    lineHeight: 20,
    padding: 0,
  },
  suggestionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginTop: 6,
    gap: 8,
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  suggestionText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  acceptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: StitchColors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  acceptBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  quickChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
