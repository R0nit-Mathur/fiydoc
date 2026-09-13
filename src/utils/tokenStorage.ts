import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'fiydoc_auth_token';

let inMemoryToken: string | null = null;

export const tokenStorage = {
  getCachedToken(): string | null {
    return inMemoryToken;
  },

  async getToken(): Promise<string | null> {
    if (inMemoryToken) {
      return inMemoryToken;
    }

    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          inMemoryToken = window.localStorage.getItem(TOKEN_KEY);
          return inMemoryToken;
        }
        return null;
      }
      inMemoryToken = await SecureStore.getItemAsync(TOKEN_KEY);
      return inMemoryToken;
    } catch (err) {
      console.warn('[tokenStorage] Error getting token:', err);
      return null;
    }
  },

  async setToken(token: string): Promise<void> {
    inMemoryToken = token;
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(TOKEN_KEY, token);
        }
        return;
      }
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (err) {
      console.warn('[tokenStorage] Error setting token:', err);
    }
  },

  async removeToken(): Promise<void> {
    inMemoryToken = null;
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(TOKEN_KEY);
        }
        return;
      }
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (err) {
      console.warn('[tokenStorage] Error deleting token:', err);
    }
  },
};
