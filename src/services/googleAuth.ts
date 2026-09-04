import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { authService, UserSession } from './authService';

WebBrowser.maybeCompleteAuthSession();

export const googleAuthService = {
  async signInWithGoogle(): Promise<UserSession | null> {
    const clientId =
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ||
      '297703931913-7mcgo80j7ol4evgsnaifij8e76fpn1a3.apps.googleusercontent.com';

    const redirectUri = Linking.createURL('oauth/google');

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent('openid profile email')}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;

    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        // Extract access token or id token from hash/params
        const hashMatch = result.url.match(/access_token=([^&]+)/);
        const accessToken = hashMatch ? hashMatch[1] : null;

        if (accessToken) {
          // Fetch real user info from Google's UserInfo endpoint
          const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (userInfoResponse.ok) {
            const googleUser = await userInfoResponse.json();
            return authService.loginWithGoogle(
              googleUser.email,
              googleUser.name || 'Google User',
              googleUser.sub,
              googleUser.picture
            );
          }
        }
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        return null;
      }
    } catch (err) {
      console.warn('[googleAuthService] Browser OAuth session prompt ended:', err);
    }

    return null;
  },
};
