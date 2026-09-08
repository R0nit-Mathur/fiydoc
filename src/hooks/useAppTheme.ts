/**
 * FiYDoc App Theme Hook
 * Uses Clinical Clarity design system - always light mode
 */
import { Colors } from '@/constants/theme';

export function useAppTheme() {
  // Always use light mode for Clinical Clarity design
  return {
    colors: Colors.light,
    isDark: false,
  };
}
