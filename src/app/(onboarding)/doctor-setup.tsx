import React from 'react';
import { View, ScrollView, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UniversalTopBar } from '@/components/ui/UniversalTopBar';
import { DoctorRegistrationView } from '@/components/doctor/DoctorRegistrationView';
import { StitchColors } from '@/constants/theme';

export default function DoctorSetupScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Soft Ambient Medical Glow Header Background */}
      <View style={styles.ambientGlowContainer} pointerEvents="none">
        <View style={styles.glow1} />
        <View style={styles.glow2} />
        <View style={styles.glow3} />
      </View>

      {/* Universal Top Navigation Header */}
      <UniversalTopBar
        onBackPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(auth)/login');
          }
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.innerContent}>
            <DoctorRegistrationView
              showRoleSelector
              onSwitchToPatient={() => {
                router.replace({ pathname: '/(auth)/signup', params: { role: 'patient' } });
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: StitchColors.surface,
  },
  ambientGlowContainer: {
    ...StyleSheet.absoluteFill,
    height: 380,
    overflow: 'hidden',
    zIndex: -1,
  },
  glow1: {
    position: 'absolute',
    top: -60,
    right: -80,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(118, 244, 224, 0.2)',
    ...Platform.select({ web: { filter: 'blur(64px)' } }),
  },
  glow2: {
    position: 'absolute',
    top: 180,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(216, 226, 255, 0.25)',
    ...Platform.select({ web: { filter: 'blur(64px)' } }),
  },
  glow3: {
    position: 'absolute',
    bottom: 40,
    right: 16,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(121, 247, 227, 0.15)',
    ...Platform.select({ web: { filter: 'blur(48px)' } }),
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 36,
  },
  innerContent: {
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
});