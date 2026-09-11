/**
 * Welcome Screen — Stitch Clinical Clarity
 *
 * Pixel-perfect rebuild from Stitch HTML (welcome.html)
 *
 * Features:
 * - Full-screen 3D medical illustration wallpaper
 * - Apple-style porcelain translucent gradient transitions
 * - Centered brand & copy stage
 * - Primary pill CTA with Apple activity spinner state
 * - Secondary clean pill action with backdrop-blur
 * - Discreet legal disclaimer
 * - Apple home indicator bar
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAppTheme } from '@/hooks/useAppTheme';
import { BorderRadius, Spacing, StitchColors } from '@/constants/theme';
import { ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FiYLogo } from '@/components/ui/FiYLogo';

const WALLPAPER_IMAGE = require('../../../assets/images/ultra_minimalist_apple_style_3d_medical_illustration_on_a_clean_soft_porcelain.png');

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();

  const handleGetStarted = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/(auth)/signup');
  };

  const handleSignIn = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      {/* 3D Medical Illustration Wallpaper Layer */}
      <View style={styles.wallpaperLayer} pointerEvents="none">
        <Image
          source={WALLPAPER_IMAGE}
          style={styles.wallpaper}
          resizeMode="cover"
        />
        {/* Soft porcelain transition at the bottom to ensure crisp CTA contrast without hiding the 3D illustration */}
        <LinearGradient
          colors={[
            'rgba(245, 247, 251, 0)',
            'rgba(245, 247, 251, 0.45)',
            'rgba(245, 247, 251, 0.88)',
            'rgba(245, 247, 251, 0.98)',
          ]}
          locations={[0, 0.35, 0.7, 1]}
          style={styles.bottomGradient}
        />
      </View>

      {/* Main Minimalist iOS Viewport */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.viewport}>
          {/* Top spacer gives breathing room for the 3D Stethoscope & Glowing Crystal Cross */}
          <View style={styles.topSpacer} />

          {/* Center Brand & Copy Stage */}
          <Animated.View
            entering={FadeIn.duration(600)}
            style={styles.brandStage}
          >
          {/* Apple Minimal Squircle App Icon */}
          <View style={styles.logoWrapper}>
            <FiYLogo size="xl" />
          </View>

          {/* Typography Stack */}
          <View style={styles.typographyStack}>
            <Text
              style={[
                styles.title,
                { color: StitchColors.onSurface },
              ]}
            >
              Find Your Doctor
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: StitchColors.onSurfaceVariant },
              ]}
            >
              Healthcare simplified. Connect with verified medical professionals instantly.
            </Text>
          </View>
        </Animated.View>

        {/* Bottom Actions Container */}
        <View style={styles.actionsContainer}>
          {/* Primary Apple Pill CTA */}
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [
              styles.primaryCta,
              pressed && styles.ctaPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.ctaContent}>
              <Text style={styles.primaryCtaText}>Get Started</Text>
              <ChevronRight size={20} color="#ffffff" strokeWidth={2.5} />
            </View>
          </Pressable>

          {/* Secondary Clean Pill Action */}
          <Pressable
            onPress={handleSignIn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.secondaryCta,
              pressed && styles.ctaPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="I already have an account"
          >
            <Text style={styles.secondaryCtaText}>I already have an account</Text>
          </Pressable>

          {/* Discreet Legal Disclaimer */}
          <Text style={[styles.legalText, { color: StitchColors.outline }]}>
            By continuing, you acknowledge FiYDOC's{' '}
            <Text style={styles.legalLink} onPress={() => {}}>
              Terms
            </Text>{' '}
            and{' '}
            <Text style={styles.legalLink} onPress={() => {}}>
              Privacy Policy
            </Text>
            .
          </Text>

          {/* Apple Home Indicator Bar */}
          <View style={styles.homeIndicatorWrap}>
            <View style={styles.homeIndicator} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff2f7',
  },
  safeArea: {
    flex: 1,
  },
  wallpaperLayer: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wallpaper: {
    width: '100%',
    height: '100%',
    maxWidth: 540,
    alignSelf: 'center',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '38%',
  },
  viewport: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: 8,
    maxWidth: 384,
    width: '100%',
    alignSelf: 'center',
    zIndex: 10,
    justifyContent: 'space-between',
  },
  topSpacer: {
    flex: 1,
    minHeight: 120,
  },
  brandStage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.md,
  },
  logoWrapper: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  logo: {
    height: 74,
    width: 126,
  },
  typographyStack: {
    maxWidth: 320,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.56,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: -0.15,
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
    paddingBottom: 8,
  },
  primaryCta: {
    width: '100%',
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1450a3',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1450a3',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 16px rgba(20, 80, 163, 0.32)',
      },
    }),
  },
  ctaPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCtaText: {
    color: '#ffffff',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginRight: 6,
  },
  secondaryCta: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#c3c6d3',
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  secondaryCtaText: {
    color: '#1450a3',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  legalText: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: 4,
    lineHeight: 16,
    fontWeight: '400',
  },
  legalLink: {
    textDecorationLine: 'underline',
    color: StitchColors.onSurfaceVariant,
  },
  homeIndicatorWrap: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  homeIndicator: {
    width: 128,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(19, 27, 46, 0.2)',
  },
});
