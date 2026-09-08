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

const LOGO_SOURCE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD5y4hxrqMIyv35mNr7U3flxK5wyvDXkUKgDWQFZB8HC2su2ztOJxAclRjQY2sjw6Fqf32ORvXfR7j8LsKWj4D7FemJ0J-zYHiNxyfRmGb5NM-JecLcFAeWpgu6afoNBzWwvEOyH7Bc4XYXSg2nFbO6MADEufPdrN6JiFNf8_1u-mN_PihzoL4iWJVY8NUK7OO4B4sAmB6tKN8-bXhn8fCpfsLRSYsNxZR-uPHJopjzKSXb8L6bGo7YqpSdqaRC8WjZPA';
const WALLPAPER_IMAGE = require('../../../assets/images/ultra_minimalist_apple_style_3d_medical_illustration_on_a_clean_soft_porcelain.png');

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleGetStarted = async () => {
    if (isLoading) return;
    setIsLoading(true);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setTimeout(() => {
      setIsLoading(false);
      router.push('/(auth)/signup');
    }, 2200);
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
            <Image
              source={{ uri: LOGO_SOURCE }}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="FiYDOC Logo"
            />
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
            disabled={isLoading}
            style={({ pressed }) => [
              styles.primaryCta,
              pressed && { transform: [{ scale: 0.97 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Get Started"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {/* Default state content */}
            <View
              style={[
                styles.ctaContent,
                isLoading && styles.ctaContentHidden,
              ]}
            >
              <Text style={styles.primaryCtaText}>Get Started</Text>
              <ChevronRight size={20} color={StitchColors.onPrimary} strokeWidth={2.5} />
            </View>

            {/* Apple Activity Spinner State */}
            {isLoading && (
              <View style={styles.ctaSpinner}>
                <ActivityIndicator size="small" color={StitchColors.onPrimary} />
                <Text style={styles.ctaSpinnerText}>Connecting to Care Portal...</Text>
              </View>
            )}
          </Pressable>

          {/* Secondary Clean Pill Action */}
          {Platform.OS === 'ios' ? (
            <Pressable
              onPress={handleSignIn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                styles.secondaryCta,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="I already have an account"
            >
              <BlurView
                tint="light"
                intensity={90}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.secondaryCtaOverlay} />
              <Text style={styles.secondaryCtaText}>I already have an account</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleSignIn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                styles.secondaryCtaAndroid,
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="I already have an account"
            >
              <Text style={styles.secondaryCtaText}>I already have an account</Text>
            </Pressable>
          )}

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
    borderRadius: 9999,
    backgroundColor: StitchColors.primaryContainer,
    shadowColor: StitchColors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaContentHidden: {
    opacity: 0,
  },
  ctaSpinner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryCtaText: {
    color: StitchColors.onPrimary,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.43,
  },
  ctaSpinnerText: {
    color: StitchColors.onPrimary,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  secondaryCta: {
    width: '100%',
    height: 50,
    borderRadius: 9999,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.4)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  secondaryCtaAndroid: {
    width: '100%',
    height: 50,
    borderRadius: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(195, 198, 211, 0.4)',
  },
  secondaryCtaOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryCtaText: {
    color: StitchColors.primaryContainer,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.075,
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
    borderRadius: 9999,
    backgroundColor: 'rgba(19, 27, 46, 0.2)',
  },
});
