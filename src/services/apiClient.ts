import Constants from 'expo-constants';
import { useAuthStore } from '@/store/useAuthStore';
import { tokenStorage } from '@/utils/tokenStorage';

const PRODUCTION_API_URL = 'https://fiydoc.onrender.com';

function getBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  // If explicitly configured with an API URL, use it
  if (envUrl && envUrl.length > 0) {
    return envUrl.replace(/\/+$/, '');
  }

  // Authoritative default: live production service on Render
  return PRODUCTION_API_URL;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token =
    tokenStorage.getCachedToken() ||
    useAuthStore.getState().user?.accessToken ||
    (await tokenStorage.getToken());
  const baseUrl = getBaseUrl();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${baseUrl}${endpoint}`;
  console.log(`[apiClient] --> ${options.method || 'GET'} ${url}`);
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
      const msg = Array.isArray(errorData.message)
        ? errorData.message.join('. ')
        : errorData.message || `HTTP error ${response.status}`;
      throw new Error(msg);
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

