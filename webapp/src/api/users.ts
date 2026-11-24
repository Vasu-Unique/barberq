import { api } from './client';
import type { ApiResponse, PaginatedResponse, UserOut } from './types';

export interface ListUsersParams {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}

export interface UserUpdatePayload {
  full_name?: string;
  phone?: string;
}

export const usersApi = {
  listUsers: async (
    params?: ListUsersParams
  ): Promise<PaginatedResponse<UserOut>> => {
    const res = await api.get<ApiResponse<PaginatedResponse<UserOut>>>(
      '/users/',
      params
    );
    return res.data;
  },

  getUser: async (userId: string): Promise<UserOut> => {
    const res = await api.get<ApiResponse<UserOut>>(`/users/${userId}`);
    return res.data;
  },

  updateUser: async (
    userId: string,
    payload: UserUpdatePayload
  ): Promise<UserOut> => {
    const res = await api.patch<ApiResponse<UserOut>>(`/users/${userId}`, payload);
    return res.data;
  },
};
