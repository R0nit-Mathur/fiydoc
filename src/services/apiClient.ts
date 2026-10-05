import { useAuthStore } from '@/store/useAuthStore';
import { tokenStorage } from '@/utils/tokenStorage';

const PRODUCTION_API_URL = 'https://fiydoc.onrender.com';
const DEFAULT_TIMEOUT_MS = 12_000;

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
  // Track identity changes, not profile edits. A logout/login round trip also
  // invalidates the request, even if it ends with the same account and token.
  const session = useAuthStore.getState();
  const userId = session.user?.id;
  const sessionToken = session.user?.accessToken;
  let sessionChanged = false;
  const unsubscribe = useAuthStore.subscribe((state) => {
    if (
      state.user?.id !== userId ||
      state.user?.accessToken !== sessionToken ||
      state.isAuthenticated !== session.isAuthenticated
    ) {
      sessionChanged = true;
    }
  });
  const controller = new AbortController();
  const callerSignal = options.signal;
  const abortFromCaller = () => controller.abort(callerSignal?.reason);
  if (callerSignal?.aborted) {
    abortFromCaller();
  } else {
    callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
  }
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    if (!controller.signal.aborted) {
      timedOut = true;
      controller.abort();
    }
  }, DEFAULT_TIMEOUT_MS);

  const assertNotAborted = () => {
    if (controller.signal.aborted) {
      throw controller.signal.reason || Object.assign(new Error('Request cancelled.'), { name: 'AbortError' });
    }
  };

  try {
    assertNotAborted();
    const token =
      tokenStorage.getCachedToken() ||
      sessionToken ||
      (await tokenStorage.getToken());
    const cachedToken = tokenStorage.getCachedToken();
    const assertRequestCurrent = () => {
      assertNotAborted();
      if (token && (
        sessionChanged ||
        (cachedToken && cachedToken !== token) ||
        tokenStorage.getCachedToken() !== cachedToken
      )) {
        throw new Error('[Session Changed] The session changed while this request was in progress. Please try again.');
      }
    };
    assertRequestCurrent();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${getBaseUrl()}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    assertRequestCurrent();

    if (!response.ok) {
      if (token && response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
        console.warn(`[apiClient] 401 Unauthorized on authenticated endpoint "${endpoint}". Triggering session expiration.`);
        await useAuthStore.getState().signOutAll?.('SESSION_EXPIRED');
        throw new Error('[Session Expired] Your session has expired for security. Please sign in again.');
      }

      const errorData = await response.json().catch(() => ({ message: 'API request failed' }));
      assertRequestCurrent();
      const msg = Array.isArray(errorData.message)
        ? errorData.message.join('. ')
        : errorData.message || `HTTP error ${response.status}`;
      throw new Error(msg);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const data = await response.json();
    assertRequestCurrent();
    return data;
  } catch (err: unknown) {
    if (timedOut) {
      throw new Error('The request took too long. Please check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
    callerSignal?.removeEventListener('abort', abortFromCaller);
    unsubscribe();
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
