import Constants from 'expo-constants';
import { useAuthStore } from '@/store/useAuthStore';

function getBaseUrl(): string {
  // 1. If expoConfig has hostUri (Expo Go / Dev Client), extract the LAN IP dynamically
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3000`;
    }
  }

  // 2. Otherwise fall back to env or default
  return process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.3:3000';
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().user?.accessToken;
  const baseUrl = getBaseUrl();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${baseUrl}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'API request failed' }));
      throw new Error(errorData.message || `HTTP error ${response.status}`);
    }

    return response.json();
  } catch (err: any) {
    console.warn(`[apiClient] Request to ${url} failed:`, err.message);
    throw err;
  }
}
