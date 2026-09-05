import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { authService, UserSession } from './authService';

WebBrowser.maybeCompleteAuthSession();

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tkuycqvzchsqrbeilogy.supabase.co';

export const googleAuthService = {
  /**
   * Performs authentic Google OAuth 2.0 sign in via system browser.
   * Connects either through Supabase Google Provider or Direct Google OAuth 2.0.
   */
  async signInWithGoogle(): Promise<UserSession | null> {
    const redirectUri = Linking.createURL('oauth/google');

    const clientId =
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ||
      '297703931913-7mcgo80j7ol4evgsnaifij8e76fpn1a3.apps.googleusercontent.com';

    // Primary: Supabase Google OAuth (Handles Google consent + token exchange in production)
    const supabaseAuthUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(
      redirectUri
    )}`;

    // Secondary: Direct Google OAuth 2.0 Web flow
    const directGoogleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent('openid profile email')}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    try {
      // First attempt Supabase Google OAuth
      let result = await WebBrowser.openAuthSessionAsync(supabaseAuthUrl, redirectUri);

      // If Supabase returned an error or provider not enabled, attempt direct Google OAuth
      if (
        result.type === 'success' &&
        result.url &&
        (result.url.includes('error=') || result.url.includes('validation_failed'))
      ) {
        console.log('[googleAuthService] Supabase provider not enabled yet, falling back to direct Google OAuth...');
        result = await WebBrowser.openAuthSessionAsync(directGoogleAuthUrl, redirectUri);
      }

      if (result.type === 'success' && result.url) {
        // 1. Check for access_token in hash or query
        const hashMatch = result.url.match(/access_token=([^&#]+)/);
        const accessToken = hashMatch ? hashMatch[1] : null;

        if (accessToken) {
          // Fetch user profile from Google's UserInfo endpoint
          let profile: any = null;
          try {
            const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (googleRes.ok) {
              profile = await googleRes.json();
            }
          } catch {
            // Try fetching from Supabase user endpoint if token belongs to Supabase
            try {
              const sbRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_U8syjfx6EGt_7I5dfFIAVw_cVkF1CKy',
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
              console.warn('[googleAuthService] User info fetch error:', e);
            }
          }

          if (profile && profile.email) {
            return authService.loginWithGoogle(
              profile.email,
              profile.name || 'Google User',
              profile.sub,
              profile.picture
            );
          }
        }
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return null;
      }
    } catch (err: any) {
      console.warn('[googleAuthService] Browser OAuth session warning:', err.message);
      throw err;
    }

    return null;
  },
};
