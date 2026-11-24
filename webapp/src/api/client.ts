import type { ApiResponse, TokenResponseData, AuthUser } from './types';

const TOKEN_KEY = 'barberq_access_token';
const REFRESH_TOKEN_KEY = 'barberq_refresh_token';
const USER_KEY = 'barberq_current_user';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && window.location.origin.includes(':5173') ? 'http://localhost:8000/api/v1' : '/api/v1');

export function getStoredAccessToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(data: TokenResponseData) {
  try {
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    window.dispatchEvent(new CustomEvent('barberq:auth-change', { detail: data.user }));
  } catch {
    // Ignore storage errors
  }
}

export function clearStoredAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new CustomEvent('barberq:auth-change', { detail: null }));
  } catch {
    // Ignore
  }
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      clearStoredAuth();
      return null;
    }

    const payload: ApiResponse<TokenResponseData> = await res.json();
    if (payload.success && payload.data) {
      setStoredAuth(payload.data);
      return payload.data.access_token;
    }
  } catch {
    clearStoredAuth();
  }
  return null;
}

export type QueryParams = Record<string, unknown> | object;

interface RequestOptions extends RequestInit {
  params?: QueryParams;
  skipAuth?: boolean;
}

export async function request<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, skipAuth, headers = {}, ...rest } = options;

  let url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params as Record<string, unknown>).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getStoredAccessToken();
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers: reqHeaders,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Network request failed';
    throw new ApiError(errMsg, 0);
  }

  // Handle 401 Unauthorized - try token refresh once
  if (response.status === 401 && !skipAuth && !endpoint.includes('/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await tryRefreshToken();
      isRefreshing = false;
      if (newToken) {
        onRefreshed(newToken);
        // Retry current request with new token
        reqHeaders['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, {
          ...rest,
          headers: reqHeaders,
        });
      }
    } else {
      // Wait for refresh to complete
      const retryToken = await new Promise<string | null>((resolve) => {
        refreshSubscribers.push(resolve);
      });
      if (retryToken) {
        reqHeaders['Authorization'] = `Bearer ${retryToken}`;
        response = await fetch(url, {
          ...rest,
          headers: reqHeaders,
        });
      }
    }
  }

  let resultData: Record<string, unknown> | string | null = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    resultData = (await response.json()) as Record<string, unknown>;
  } else {
    resultData = await response.text();
  }

  if (!response.ok) {
    const errorMsg =
      (typeof resultData === 'object' && resultData !== null
        ? (resultData.message as string) || (resultData.detail as string)
        : null) ||
      (typeof resultData === 'string' ? resultData : 'An unexpected error occurred');
    throw new ApiError(errorMsg, response.status, resultData);
  }

  return resultData as T;
}

export const api = {
  get: <T = unknown>(endpoint: string, params?: QueryParams, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'GET', params, ...options }),
  post: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  patch: <T = unknown>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
  delete: <T = unknown>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'DELETE', ...options }),
};
