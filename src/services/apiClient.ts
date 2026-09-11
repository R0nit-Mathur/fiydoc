import Constants from 'expo-constants';
import { useAuthStore } from '@/store/useAuthStore';

function getBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  // 1. If configured with a production/cloud HTTPS backend, prioritize it immediately
  if (envUrl && envUrl.startsWith('https://')) {
    return envUrl;
  }

  // 2. If in Expo Go / Dev client without cloud HTTPS, extract Metro LAN IP dynamically
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
      return `http://${ip}:3000`;
    }
  }

  // 3. Fallback to production cloud service
  return envUrl || 'https://fiydoc.onrender.com';
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
      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        console.warn(`[apiClient] 401 Unauthorized on authenticated endpoint "${endpoint}". Triggering session expiration.`);
        useAuthStore.getState().signOutAll?.('SESSION_EXPIRED');
        throw new Error('[Session Expired] Your session has expired for security. Please sign in again.');
      }

      const errorData = await response.json().catch(() => ({ message: 'API request failed' }));
      throw new Error(errorData.message || `HTTP error ${response.status}`);
    }

    return response.json();
  } catch (err: any) {
    console.warn(`[apiClient] Request to ${url} failed:`, err.message);
    throw err;
  }
}

apiClient.get = <T>(endpoint: string, options?: RequestInit): Promise<T> =>
  apiClient<T>(endpoint, { ...options, method: 'GET' });

apiClient.post = <T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

apiClient.patch = <T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> =>
  apiClient<T>(endpoint, {
    ...options,
    method: 'PATCH',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

apiClient.delete = <T>(endpoint: string, options?: RequestInit): Promise<T> =>
  apiClient<T>(endpoint, { ...options, method: 'DELETE' });

