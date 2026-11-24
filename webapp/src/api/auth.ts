import { api, setStoredAuth, clearStoredAuth, getStoredRefreshToken } from './client';
import type { ApiResponse, TokenResponseData, AuthUser } from './types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<TokenResponseData> => {
    const res = await api.post<ApiResponse<TokenResponseData>>('/auth/login', payload, {
      skipAuth: true,
    });
    if (res.data) {
      setStoredAuth(res.data);
    }
    return res.data;
  },

  register: async (payload: RegisterPayload): Promise<AuthUser> => {
    const res = await api.post<ApiResponse<AuthUser>>('/auth/register', payload, {
      skipAuth: true,
    });
    return res.data;
  },

  getMe: async (): Promise<AuthUser> => {
    const res = await api.get<ApiResponse<AuthUser>>('/auth/me');
    return res.data;
  },

  logout: async (): Promise<void> => {
    const refreshToken = getStoredRefreshToken();
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      }
    } finally {
      clearStoredAuth();
    }
  },
};
