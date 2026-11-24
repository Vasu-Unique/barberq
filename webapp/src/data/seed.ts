import type { Salon, Customer, QueueToken } from './types';

const now = Date.now();
const iso = (offsetMs: number) => new Date(now + offsetMs).toISOString();

export const seedSalons: Salon[] = [
  {
    id: 'salon-1',
    name: 'Sharp & Co. Barbershop',
    address: '12 King Street West',
    city: 'Toronto',
    phone: '+1 (416) 555-0142',
    openTime: '09:00',
    closeTime: '19:00',
    rating: 4.8,
    reviewCount: 214,
    imageUrl:
      'https://images.pexels.com/photos/1813947/pexels-photo-1813947.jpeg?auto=compress&cs=tinysrgb&w=800',
    defaultServiceDuration: 30,
    isActive: true,
    services: [
      { id: 'svc-1a', name: 'Haircut', durationMinutes: 30, price: 35, description: 'Standard cut and finish', active: true },
      { id: 'svc-1b', name: 'Beard Trim', durationMinutes: 15, price: 18, description: 'Shape and line-up', active: true },
      { id: 'svc-1c', name: 'Haircut + Beard', durationMinutes: 45, price: 48, description: 'Full grooming package', active: true },
      { id: 'svc-1d', name: 'Hot Towel Shave', durationMinutes: 30, price: 32, description: 'Traditional straight razor', active: true },
      { id: 'svc-1e', name: "Kid's Cut", durationMinutes: 20, price: 25, description: 'Under 12 years', active: true },
    ],
  },
  {
    id: 'salon-2',
    name: 'The Gentlemen’s Den',
    address: '88 Bloor Street East',
    city: 'Toronto',
    phone: '+1 (416) 555-0188',
    openTime: '08:30',
    closeTime: '20:00',
    rating: 4.9,
    reviewCount: 367,
    imageUrl:
      'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800',
    defaultServiceDuration: 30,
    isActive: true,
    services: [
      { id: 'svc-2a', name: 'Classic Cut', durationMinutes: 30, price: 40, description: 'Scissor and clipper cut', active: true },
      { id: 'svc-2b', name: 'Skin Fade', durationMinutes: 40, price: 50, description: 'Precision fade', active: true },
      { id: 'svc-2c', name: 'Beard Sculpt', durationMinutes: 20, price: 22, description: 'Detailed beard shaping', active: true },
      { id: 'svc-2d', name: 'Executive Package', durationMinutes: 60, price: 75, description: 'Cut, shave, wash, style', active: true },
    ],
  },
  {
    id: 'salon-3',
    name: 'Uptown Fade Lounge',
    address: '45 College Avenue',
    city: 'Mississauga',
    phone: '+1 (905) 555-0199',
    openTime: '09:00',
    closeTime: '18:30',
    rating: 4.6,
    reviewCount: 128,
    imageUrl:
      'https://images.pexels.com/photos/2050994/pexels-photo-2050994.jpeg?auto=compress&cs=tinysrgb&w=800',
    defaultServiceDuration: 25,
    isActive: true,
    services: [
      { id: 'svc-3a', name: 'Fade Cut', durationMinutes: 35, price: 38, description: 'Low, mid, or high fade', active: true },
      { id: 'svc-3b', name: 'Line-up', durationMinutes: 15, price: 15, description: 'Crisp edge-up', active: true },
      { id: 'svc-3c', name: 'Design Cut', durationMinutes: 45, price: 55, description: 'Custom hair art', active: true },
    ],
  },
];

export const seedCustomers: Customer[] = [
  { id: 'cust-1', name: 'James Carter', phone: '+1 (647) 555-0101', email: 'james.c@example.com' },
  { id: 'cust-2', name: 'Michael Chen', phone: '+1 (647) 555-0102' },
  { id: 'cust-3', name: 'David Okafor', phone: '+1 (647) 555-0103', email: 'dokafor@example.com' },
  { id: 'cust-4', name: 'Ryan Patel', phone: '+1 (647) 555-0104' },
  { id: 'cust-5', name: 'Marcus Webb', phone: '+1 (647) 555-0105' },
  { id: 'cust-6', name: 'Liam Foster', phone: '+1 (647) 555-0106', email: 'liam.f@example.com' },
  { id: 'cust-7', name: 'Noah Rahman', phone: '+1 (647) 555-0107' },
];

export const seedTokens: QueueToken[] = [
  {
    id: 'tok-1', salonId: 'salon-1', customerId: 'cust-1', customerName: 'James Carter',
    customerPhone: '+1 (647) 555-0101', serviceId: 'svc-1a', serviceName: 'Haircut',
    serviceDurationMinutes: 30, number: 1, status: 'serving', joinedAt: iso(-25 * 60000),
    calledAt: iso(-5 * 60000), barberName: 'Tony',
  },
  {
    id: 'tok-2', salonId: 'salon-1', customerId: 'cust-2', customerName: 'Michael Chen',
    customerPhone: '+1 (647) 555-0102', serviceId: 'svc-1c', serviceName: 'Haircut + Beard',
    serviceDurationMinutes: 45, number: 2, status: 'waiting', joinedAt: iso(-20 * 60000),
  },
  {
    id: 'tok-3', salonId: 'salon-1', customerId: 'cust-3', customerName: 'David Okafor',
    customerPhone: '+1 (647) 555-0103', serviceId: 'svc-1b', serviceName: 'Beard Trim',
    serviceDurationMinutes: 15, number: 3, status: 'waiting', joinedAt: iso(-15 * 60000),
  },
  {
    id: 'tok-4', salonId: 'salon-1', customerId: 'cust-4', customerName: 'Ryan Patel',
    customerPhone: '+1 (647) 555-0104', serviceId: 'svc-1a', serviceName: 'Haircut',
    serviceDurationMinutes: 30, number: 4, status: 'waiting', joinedAt: iso(-10 * 60000),
  },
  {
    id: 'tok-5', salonId: 'salon-1', customerId: 'cust-5', customerName: 'Marcus Webb',
    customerPhone: '+1 (647) 555-0105', serviceId: 'svc-1d', serviceName: 'Hot Towel Shave',
    serviceDurationMinutes: 30, number: 5, status: 'waiting', joinedAt: iso(-5 * 60000),
  },
  {
    id: 'tok-6', salonId: 'salon-2', customerId: 'cust-6', customerName: 'Liam Foster',
    customerPhone: '+1 (647) 555-0106', serviceId: 'svc-2a', serviceName: 'Classic Cut',
    serviceDurationMinutes: 30, number: 1, status: 'serving', joinedAt: iso(-18 * 60000),
    calledAt: iso(-3 * 60000), barberName: 'Sophia',
  },
  {
    id: 'tok-7', salonId: 'salon-2', customerId: 'cust-7', customerName: 'Noah Rahman',
    customerPhone: '+1 (647) 555-0107', serviceId: 'svc-2b', serviceName: 'Skin Fade',
    serviceDurationMinutes: 40, number: 2, status: 'waiting', joinedAt: iso(-12 * 60000),
  },
];
