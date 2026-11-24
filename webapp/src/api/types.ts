export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  roles: string[];
  is_active: boolean;
}

export interface TokenResponseData {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface OperatingHoursOut {
  id: string;
  salon_id: string;
  day_of_week: string;
  opening_time?: string | null;
  closing_time?: string | null;
  is_closed: boolean;
}

export interface ServiceOut {
  id: string;
  salon_id: string;
  service_name: string;
  description?: string | null;
  duration_minutes: number;
  price: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalonOut {
  id: string;
  owner_id: string;
  salon_name: string;
  description?: string | null;
  address: string;
  city: string;
  phone: string;
  logo_url?: string | null;
  opening_time: string;
  closing_time: string;
  max_queue_capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  services?: ServiceOut[];
  operating_hours?: OperatingHoursOut[];
}

export interface SalonDetailOut extends SalonOut {
  services: ServiceOut[];
  operating_hours: OperatingHoursOut[];
}

export type QueueTokenStatus =
  | 'WAITING'
  | 'CALLED'
  | 'SERVING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SKIPPED';

export interface QueueTokenOut {
  id: string;
  session_id: string;
  salon_id?: string | null;
  customer_id?: string | null;
  service_id: string;
  service_name?: string | null;
  token_number: number;
  customer_name: string;
  customer_phone?: string | null;
  status: QueueTokenStatus | string;
  estimated_duration: number;
  service_price: number;
  joined_at: string;
  called_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  cancelled_at?: string | null;
  position?: number | null;
  people_ahead?: number | null;
  estimated_wait_minutes?: number | null;
}

export interface QueueStateOut {
  session?: {
    id: string;
    salon_id: string;
    session_date: string;
    last_token_number: number;
    status: string;
    created_at: string;
  } | null;
  salon_id: string;
  is_open: boolean;
  serving_entry?: QueueTokenOut | null;
  waiting_entries: QueueTokenOut[];
  total_waiting: number;
  estimated_total_wait_minutes: number;
}

export interface UserOut {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  is_active: boolean;
  roles: string[];
  created_at: string;
  updated_at: string;
}
