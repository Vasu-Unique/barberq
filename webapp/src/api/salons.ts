import { api } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  SalonOut,
  SalonDetailOut,
  ServiceOut,
} from './types';

export interface ListSalonsParams {
  search?: string;
  city?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

export interface SalonCreatePayload {
  salon_name: string;
  description?: string;
  address: string;
  city: string;
  phone: string;
  logo_url?: string;
  opening_time: string;
  closing_time: string;
  max_queue_capacity?: number;
  is_active?: boolean;
}

export interface SalonUpdatePayload {
  salon_name?: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  logo_url?: string;
  opening_time?: string;
  closing_time?: string;
  max_queue_capacity?: number;
  is_active?: boolean;
}

export interface ServiceCreatePayload {
  service_name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  is_available?: boolean;
}

export interface ServiceUpdatePayload {
  service_name?: string;
  description?: string;
  duration_minutes?: number;
  price?: number;
  is_available?: boolean;
}

export const salonsApi = {
  listSalons: async (
    params?: ListSalonsParams
  ): Promise<PaginatedResponse<SalonOut>> => {
    const res = await api.get<ApiResponse<PaginatedResponse<SalonOut>>>(
      '/salons/',
      params
    );
    return res.data;
  },

  getSalon: async (salonId: string): Promise<SalonDetailOut> => {
    const res = await api.get<ApiResponse<SalonDetailOut>>(`/salons/${salonId}`);
    return res.data;
  },

  createSalon: async (payload: SalonCreatePayload): Promise<SalonOut> => {
    const res = await api.post<ApiResponse<SalonOut>>('/salons/', payload);
    return res.data;
  },

  updateSalon: async (
    salonId: string,
    payload: SalonUpdatePayload
  ): Promise<SalonOut> => {
    const res = await api.patch<ApiResponse<SalonOut>>(`/salons/${salonId}`, payload);
    return res.data;
  },

  deleteSalon: async (salonId: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(`/salons/${salonId}`);
  },

  listServices: async (salonId: string): Promise<ServiceOut[]> => {
    const res = await api.get<ApiResponse<ServiceOut[]>>(
      `/salons/${salonId}/services/`
    );
    return res.data;
  },

  createService: async (
    salonId: string,
    payload: ServiceCreatePayload
  ): Promise<ServiceOut> => {
    const res = await api.post<ApiResponse<ServiceOut>>(
      `/salons/${salonId}/services/`,
      payload
    );
    return res.data;
  },

  updateService: async (
    salonId: string,
    serviceId: string,
    payload: ServiceUpdatePayload
  ): Promise<ServiceOut> => {
    const res = await api.patch<ApiResponse<ServiceOut>>(
      `/salons/${salonId}/services/${serviceId}`,
      payload
    );
    return res.data;
  },

  deleteService: async (salonId: string, serviceId: string): Promise<void> => {
    await api.delete<ApiResponse<null>>(
      `/salons/${salonId}/services/${serviceId}`
    );
  },
};
