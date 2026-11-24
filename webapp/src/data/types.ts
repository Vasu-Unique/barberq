export type TokenStatus = 'waiting' | 'serving' | 'completed' | 'cancelled' | 'skipped';

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description?: string;
  active: boolean;
}

export interface Salon {
  id: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  openTime: string;
  closeTime: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  services: Service[];
  defaultServiceDuration: number;
  isActive: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

export interface QueueToken {
  id: string;
  salonId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  serviceName: string;
  serviceDurationMinutes: number;
  number: number;
  status: TokenStatus;
  joinedAt: string;
  calledAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  barberName?: string;
  notes?: string;
}

export interface StoreState {
  salons: Salon[];
  customers: Customer[];
  tokens: QueueToken[];
  version: number;
}
