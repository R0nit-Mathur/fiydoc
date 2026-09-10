/**
 * FiYDoc Clinical Clarity Design System
 * Exact match to Stitch Clinical Clarity design tokens
 *
 * Based on Stitch Project 6559997197545880152
 */
import { Platform } from 'react-native';

// ============================================
// STITCH CLINICAL CLARITY EXACT COLORS
// ============================================
export const StitchColors = {
  // Core Colors (exact from Stitch)
  surface: '#faf8ff',
  surfaceDim: '#d2d9f4',
  surfaceBright: '#faf8ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f2f3ff',
  surfaceContainer: '#eaedff',
  surfaceContainerHigh: '#e2e7ff',
  surfaceContainerHighest: '#dae2fd',

  // Text
  onSurface: '#131b2e',
  onSurfaceVariant: '#424752',
  inverseSurface: '#283044',
  inverseOnSurface: '#eef0ff',

  // Outlines
  outline: '#737783',
  outlineVariant: '#c3c6d3',
  surfaceTint: '#275cb0',

  // Primary (Deep Royal Navy)
  primary: '#00397e',
  onPrimary: '#ffffff',
  primaryContainer: '#1450a3',
  onPrimaryContainer: '#adc6ff',
  inversePrimary: '#adc6ff',

  // Secondary (Vitality Teal)
  secondary: '#006b5f',
  onSecondary: '#ffffff',
  secondaryContainer: '#76f4e0',
  onSecondaryContainer: '#006f63',

  // Tertiary (Sky Cyan)
  tertiary: '#004059',
  onTertiary: '#ffffff',
  tertiaryContainer: '#00597a',
  onTertiaryContainer: '#7bd0ff',

  // Error
  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  // Fixed Colors
  primaryFixed: '#d8e2ff',
  primaryFixedDim: '#adc6ff',
  onPrimaryFixed: '#001a41',
  onPrimaryFixedVariant: '#004493',

  secondaryFixed: '#79f7e3',
  secondaryFixedDim: '#59dbc7',
  onSecondaryFixed: '#00201c',
  onSecondaryFixedVariant: '#005047',

  tertiaryFixed: '#c4e7ff',
  tertiaryFixedDim: '#7bd0ff',
  onTertiaryFixed: '#001e2c',
  onTertiaryFixedVariant: '#004c69',

  // Background
  background: '#faf8ff',
  onBackground: '#131b2e',
  surfaceVariant: '#dae2fd',
};

// Aliases for common usage
export const Palette = {
  // Primary (Royal Medical Blue)
  primaryDark: StitchColors.primary,
  primaryBlue: StitchColors.primaryContainer,
  primaryBlueHover: '#004493',
  primaryBlueLight: StitchColors.surfaceContainer,
  primaryBlueBorder: StitchColors.onPrimaryContainer,

  // Vitality Teal
  healthcareTeal: StitchColors.secondaryContainer,
  healthcareTealHover: StitchColors.secondary,
  healthcareTealLight: StitchColors.secondaryFixed,
  healthcareTealBorder: StitchColors.secondaryFixedDim,

  // Sky Cyan
  skyCyan: StitchColors.tertiaryContainer,
  skyCyanLight: StitchColors.tertiaryFixed,

  // Atmospheric Accents
  tertiary: StitchColors.tertiary,

  // Clinical Surfaces
  background: StitchColors.background,
  surfaceLow: StitchColors.surfaceContainerLow,
  surfaceTrack: StitchColors.surfaceContainer,
  surfaceHigh: StitchColors.surfaceContainerHigh,
  card: StitchColors.surfaceContainerLowest,
  cardBorder: StitchColors.outlineVariant,
  cardBorderLight: 'rgba(19, 27, 46, 0.06)',
  white: '#ffffff',

  // Typography
  textPrimary: StitchColors.onSurface,
  textSecondary: StitchColors.onSurfaceVariant,
  textMuted: StitchColors.outline,
  outline: StitchColors.outline,
  outlineVariant: StitchColors.outlineVariant,

  // Status
  success: StitchColors.secondaryContainer,
  successBg: StitchColors.secondaryFixed,
  successBorder: StitchColors.secondaryFixedDim,

  warning: '#f59e0b',
  warningBg: '#fffbeb',
  warningBorder: '#fde68a',

  danger: StitchColors.error,
  dangerBg: StitchColors.errorContainer,
  dangerBorder: '#ffb4ab',
} as const;

// ============================================
// TYPOGRAPHY (exact from Stitch with aliases)
// ============================================
const defaultFont = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'Inter',
}) as string;

export const Typography = {
  display: {
    fontFamily: defaultFont,
    fontSize: 56,
    fontWeight: '700' as const,
    lineHeight: 64,
    letterSpacing: -0.03,
  },
  h1: {
    fontFamily: defaultFont,
    fontSize: 40,
    fontWeight: '600' as const,
    lineHeight: 48,
    letterSpacing: -0.025,
  },
  h2: {
    fontFamily: defaultFont,
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 34,
    letterSpacing: -0.02,
  },
  h3: {
    fontFamily: defaultFont,
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
    letterSpacing: -0.015,
  },
  headlineLg: {
    fontFamily: defaultFont,
    fontSize: 40,
    fontWeight: '600' as const,
    lineHeight: 48,
    letterSpacing: -0.025,
  },
  headlineLgMobile: {
    fontFamily: defaultFont,
    fontSize: 30,
    fontWeight: '600' as const,
    lineHeight: 36,
    letterSpacing: -0.02,
  },
  headlineMd: {
    fontFamily: defaultFont,
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 34,
    letterSpacing: -0.02,
  },
  headlineSm: {
    fontFamily: defaultFont,
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
    letterSpacing: -0.015,
  },
  titleMd: {
    fontFamily: defaultFont,
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.01,
  },
  title: {
    fontFamily: defaultFont,
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: -0.01,
  },
  bodyLg: {
    fontFamily: defaultFont,
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: -0.005,
  },
  body: {
    fontFamily: defaultFont,
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodyMd: {
    fontFamily: defaultFont,
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontFamily: defaultFont,
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodySm: {
    fontFamily: defaultFont,
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    letterSpacing: 0.005,
  },
  caption: {
    fontFamily: defaultFont,
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    letterSpacing: 0.01,
  },
  label: {
    fontFamily: defaultFont,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.02,
  },
  labelMd: {
    fontFamily: defaultFont,
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.02,
  },
  labelSm: {
    fontFamily: defaultFont,
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 0.04,
  },
};

// ============================================
// SPACING (exact from Stitch 8pt grid)
// ============================================
export const Spacing = {
  '2xs': 4,   // 0.25rem
  xs: 8,      // 0.5rem
  sm: 12,     // 0.75rem
  md: 16,     // 1rem
  lg: 24,     // 1.5rem
  xl: 32,     // 2rem
  '2xl': 48,  // 3rem
  '3xl': 64,  // 4rem
  '4xl': 80,  // 5rem
} as const;

// Layout constants
export const MaxContentWidth = 1280;
export const ContainerPaddingMobile = 16;
export const ContainerPaddingDesktop = 40;

// ============================================
// BORDER RADIUS (exact from Stitch)
// ============================================
export const BorderRadius = {
  sm: 4,      // 0.25rem
  DEFAULT: 8, // 0.5rem
  md: 12,     // 0.75rem
  lg: 16,     // 1rem
  xl: 24,     // 1.5rem
  '2xl': 32,  // 2rem
  full: 9999, // Pills
} as const;

// ============================================
// SHADOWS (Apple HIG style)
// ============================================
export const Shadows = {
  subtle: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  card: {
    shadowColor: '#1450a3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  modal: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 8,
  },
  focus: {
    shadowColor: '#007aff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 0,
  },
} as const;

// ============================================
// THEME COLORS FOR useAppTheme HOOK
// ============================================
export const Colors = {
  light: {
    // Base
    text: StitchColors.onSurface,
    background: StitchColors.background,
    card: StitchColors.surfaceContainerLowest,
    border: StitchColors.outlineVariant,

    // Brand
    primary: StitchColors.primaryContainer,
    primaryNavy: StitchColors.primary,
    teal: StitchColors.secondaryContainer,
    secondary: StitchColors.secondary,

    // Text variants
    textSecondary: StitchColors.onSurfaceVariant,
    textMuted: StitchColors.outline,

    // Surfaces
    backgroundElement: StitchColors.surfaceContainerLow,
    backgroundSelected: StitchColors.surfaceContainer,
    surfaceContainerLow: StitchColors.surfaceContainerLow,
    surfaceContainer: StitchColors.surfaceContainer,
    surfaceContainerHighest: StitchColors.surfaceContainerHighest,

    // Status
    success: StitchColors.secondaryContainer,
    warning: '#f59e0b',
    danger: StitchColors.error,
  },
  dark: {
    text: StitchColors.inverseOnSurface,
    background: StitchColors.inverseSurface,
    card: StitchColors.surfaceContainer,
    border: '#3d4556',

    primary: '#4d8fd9',
    primaryNavy: StitchColors.primaryContainer,
    teal: StitchColors.secondaryFixedDim,
    secondary: StitchColors.secondaryContainer,

    textSecondary: '#a0a8b8',
    textMuted: '#6b7280',

    backgroundElement: '#1e2433',
    backgroundSelected: '#283044',
    surfaceContainerLow: '#1a1f2e',
    surfaceContainer: '#232a3b',
    surfaceContainerHighest: '#2d3548',

    success: StitchColors.secondaryFixedDim,
    warning: '#fbbf24',
    danger: '#f87171',
  },
} as const;

// ============================================
// SPECIALTY TOKENS
// ============================================
export const SpecialtyTokens: Record<string, { color: string; bgLight: string; bgDark: string; icon: string }> = {
  'General medicine': { color: StitchColors.primaryContainer, bgLight: StitchColors.surfaceContainer, bgDark: '#002657', icon: 'Stethoscope' },
  'Cardiology': { color: StitchColors.secondaryContainer, bgLight: StitchColors.secondaryFixed, bgDark: '#003630', icon: 'Heart' },
  'Dermatology': { color: '#f59e0b', bgLight: '#fffbeb', bgDark: '#3a2000', icon: 'Sparkles' },
  'Pediatrics': { color: '#6366f1', bgLight: '#eef2ff', bgDark: '#1e1b4b', icon: 'Baby' },
  'Orthopedics': { color: '#059669', bgLight: '#ecfdf5', bgDark: '#064e3b', icon: 'Activity' },
  'Neurology': { color: '#0284c7', bgLight: '#f0f9ff', bgDark: '#0c4a6e', icon: 'Brain' },
};

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// ============================================
// FONTS
// ============================================
export const Fonts = Platform.select({
  ios: {
    sans: 'System',
  },
  android: {
    sans: 'Roboto',
  },
  default: {
    sans: 'System',
  },
});

export type FontFamily = keyof typeof Fonts;

// ============================================
// DEFAULT PROFILE PHOTOS (Crisp Clinical & Patient Portraits)
// ============================================
export const DEFAULT_DOCTOR_AVATAR =
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&auto=format&fit=crop&q=80';
export const DEFAULT_PATIENT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600&auto=format&fit=crop&q=80';
