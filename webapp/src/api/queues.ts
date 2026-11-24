import { api } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  QueueStateOut,
  QueueTokenOut,
} from './types';

export interface JoinQueuePayload {
  service_id: string;
  customer_name?: string;
  customer_phone?: string;
}

export interface WalkInPayload {
  service_id: string;
  customer_name: string;
  customer_phone?: string;
}

export interface ListQueueEntriesParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const queuesApi = {
  // Customer endpoints
  getSalonQueue: async (salonId: string): Promise<QueueStateOut> => {
    const res = await api.get<ApiResponse<QueueStateOut>>(
      `/queues/salon/${salonId}`
    );
    return res.data;
  },

  joinQueue: async (
    salonId: string,
    payload: JoinQueuePayload
  ): Promise<QueueTokenOut> => {
    const res = await api.post<ApiResponse<QueueTokenOut>>(
      `/queues/join/${salonId}`,
      payload
    );
    return res.data;
  },

  getMyQueue: async (): Promise<QueueTokenOut[]> => {
    const res = await api.get<ApiResponse<QueueTokenOut[]>>('/queues/my-queue');
    return res.data;
  },

  getTokenDetails: async (entryId: string): Promise<QueueTokenOut> => {
    const res = await api.get<ApiResponse<QueueTokenOut>>(
      `/queues/token/${entryId}`
    );
    return res.data;
  },

  cancelToken: async (entryId: string): Promise<QueueTokenOut> => {
    const res = await api.patch<ApiResponse<QueueTokenOut>>(
      `/queues/${entryId}/cancel`
    );
    return res.data;
  },

  // Staff & Admin Queue endpoints
  getStaffDashboard: async (salonId: string): Promise<QueueStateOut> => {
    const res = await api.get<ApiResponse<QueueStateOut>>(
      `/admin/queues/${salonId}/`
    );
    return res.data;
  },

  listQueueEntries: async (
    salonId: string,
    params?: ListQueueEntriesParams
  ): Promise<PaginatedResponse<QueueTokenOut>> => {
    const res = await api.get<ApiResponse<PaginatedResponse<QueueTokenOut>>>(
      `/admin/queues/${salonId}/entries`,
      params
    );
    return res.data;
  },

  callNext: async (salonId: string): Promise<QueueTokenOut> => {
    const res = await api.post<ApiResponse<QueueTokenOut>>(
      `/admin/queues/${salonId}/call-next`
    );
    return res.data;
  },

  startService: async (
    salonId: string,
    entryId: string
  ): Promise<QueueTokenOut> => {
    const res = await api.patch<ApiResponse<QueueTokenOut>>(
      `/admin/queues/${salonId}/${entryId}/start`
    );
    return res.data;
  },

  completeService: async (
    salonId: string,
    entryId: string
  ): Promise<QueueTokenOut> => {
    const res = await api.patch<ApiResponse<QueueTokenOut>>(
      `/admin/queues/${salonId}/${entryId}/complete`
    );
    return res.data;
  },

  skipToken: async (
    salonId: string,
    entryId: string
  ): Promise<QueueTokenOut> => {
    const res = await api.patch<ApiResponse<QueueTokenOut>>(
      `/admin/queues/${salonId}/${entryId}/skip`
    );
    return res.data;
  },

  addWalkIn: async (
    salonId: string,
    payload: WalkInPayload
  ): Promise<QueueTokenOut> => {
    const res = await api.post<ApiResponse<QueueTokenOut>>(
      `/admin/queues/${salonId}/walk-in`,
      payload
    );
    return res.data;
  },
};
