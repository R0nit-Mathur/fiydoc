import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck, AlertTriangle } from 'lucide-react-native';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { StitchColors, Palette, BorderRadius } from '@/constants/theme';

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tkuycqvzchsqrbeilogy.supabase.co';

export default function GoogleOAuthCallback() {
  const router = useRouter();
  const searchParams = useLocalSearchParams<{
    access_token?: string;
    token?: string;
    code?: string;
    error?: string;
    error_description?: string;
    role?: 'patient' | 'doctor';
    email?: string;
    name?: string;
    sub?: string;
  }>();

  const [statusMessage, setStatusMessage] = useState('Verifying Google credentials...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function processOAuthCallback() {
      try {
        let token = searchParams.access_token || searchParams.token;
        let role = searchParams.role;
        const oauthError = searchParams.error || searchParams.error_description;

        // On Web, check window.location.hash for access_token=... if not in query
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          if (!token && window.location.hash) {
            const hashMatch = window.location.hash.match(/access_token=([^&#]+)/);
            if (hashMatch) {
              token = decodeURIComponent(hashMatch[1]);
            }
          }
        }

        if (oauthError) {
          console.warn('[GoogleOAuthCallback] OAuth returned error:', oauthError);
          if (isMounted) {
            setErrorMessage(`[Google Sign-In] ${oauthError}`);
          }
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 2000);
          return;
        }

        // If direct user info is already provided by backend callback
        if (searchParams.email) {
          setStatusMessage('Finalizing user profile...');
          const session = await authService.loginWithGoogle(
            searchParams.email,
            searchParams.name || 'Google User',
            searchParams.sub,
            undefined,
            role
          );
          useAuthStore.getState().setSession(session);
          if (session.role === 'doctor') {
            router.replace('/(doctor)/(tabs)/home');
          } else {
            router.replace('/(patient)/(tabs)/home');
          }
          return;
        }

        if (token) {
          setStatusMessage('Retrieving Google account details...');
          let profile: any = null;

          // 1. Try Google UserInfo endpoint
          try {
            const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (googleRes.ok) {
              profile = await googleRes.json();
            }
          } catch (e) {
            console.warn('[GoogleOAuthCallback] Google userinfo fetch failed:', e);
          }

          // 2. Fallback to Supabase User endpoint
          if (!profile) {
            try {
              const sbRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  apikey:
                    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
                    'sb_publishable_U8syjfx6EGt_7I5dfFIAVw_cVkF1CKy',
                },
              });
              if (sbRes.ok) {
                const sbUser = await sbRes.json();
                profile = {
                  email: sbUser.email,
                  name: sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || 'Google User',
                  sub: sbUser.id,
                  picture: sbUser.user_metadata?.avatar_url,
                };
              }
            } catch (e) {
              console.warn('[GoogleOAuthCallback] Supabase user fetch failed:', e);
            }
          }

          if (profile && profile.email) {
            setStatusMessage('Establishing secure clinical session...');
            const session = await authService.loginWithGoogle(
              profile.email,
              profile.name || 'Google User',
              profile.sub,
              profile.picture,
              role
            );
            useAuthStore.getState().setSession(session);

            if (session.role === 'doctor') {
              router.replace('/(doctor)/(tabs)/home');
            } else {
              router.replace('/(patient)/(tabs)/home');
            }
            return;
          }
        }

        // If no token or profile could be extracted, navigate back to login
        console.warn('[GoogleOAuthCallback] No valid OAuth token found in callback.');
        if (isMounted) {
          setErrorMessage('[Google Sign-In] Authentication was not completed. Redirecting to login...');
        }
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 1500);
      } catch (err: any) {
        console.error('[GoogleOAuthCallback] Error processing callback:', err);
        if (isMounted) {
          setErrorMessage(err.message || '[Google Sign-In] Unable to complete authentication.');
        }
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 2500);
      }
    }

    processOAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {errorMessage ? (
          <>
            <View style={styles.errorIconWrap}>
              <AlertTriangle size={36} color={Palette.danger} />
            </View>
            <Text style={styles.errorTitle}>Authentication Failed</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          </>
        ) : (
          <>
            <View style={styles.iconWrap}>
              <ShieldCheck size={36} color="#0284c7" />
            </View>
            <Text style={styles.title}>Completing Google Verification</Text>
            <Text style={styles.subtitle}>{statusMessage}</Text>
            <ActivityIndicator size="large" color="#0284c7" style={styles.spinner} />
            <Text style={styles.footerText}>Securing your FiYDoc session</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1120',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1e293b',
    borderRadius: BorderRadius.xl,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  errorIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
  },
  spinner: {
    marginVertical: 12,
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 16,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Palette.danger,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    marginTop: 8,
  },
});
