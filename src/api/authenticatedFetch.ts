import { useMeetingStore } from '../store/useMeetingStore';
import { authApi } from './authApi';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

/**
 * Smart fetch wrapper that handles:
 * 1. Automatic Authorization header injection (Bearer token via API Gateway)
 * 2. Silent Token Refresh on 401 Unauthorized
 * 3. Automatic Logout & session cleanup when Refresh Token is expired/invalid
 */
export async function authenticatedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const store = useMeetingStore.getState();
  const token = store.user?.accessToken;
  const refreshToken = store.user?.refreshToken;

  const headers = new Headers(init.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response = await fetch(input, { ...init, headers });

  // If token is expired or invalid (401 Unauthorized), attempt automatic token refresh
  if (response.status === 401 && refreshToken) {
    if (isRefreshing) {
      // Queue requests while token refresh is in progress
      await new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });
      const newToken = useMeetingStore.getState().user?.accessToken;
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        return fetch(input, { ...init, headers });
      }
    }

    isRefreshing = true;

    try {
      const refreshData = await authApi.refreshToken(refreshToken);
      if (refreshData && refreshData.accessToken) {
        const currentUser = useMeetingStore.getState().user;
        if (currentUser) {
          useMeetingStore.getState().setUser({
            ...currentUser,
            accessToken: refreshData.accessToken,
            ...(refreshData.refreshToken ? { refreshToken: refreshData.refreshToken } : {}),
          });
        }
        processQueue(null);

        // Retry original request with new access token
        headers.set('Authorization', `Bearer ${refreshData.accessToken}`);
        response = await fetch(input, { ...init, headers });
      } else {
        throw new Error('Refresh token invalid');
      }
    } catch (refreshErr) {
      processQueue(refreshErr);
      // Auto-logout user on expired/invalid session
      await useMeetingStore.getState().logout();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } finally {
      isRefreshing = false;
    }
  }

  return response;
}
