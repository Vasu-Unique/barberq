import type { StoreState, QueueToken, TokenStatus } from './types';
import { seedSalons, seedCustomers, seedTokens } from './seed';

const STORAGE_KEY = 'barberq-store-v1';
const STORE_VERSION = 1;

function readStore(): StoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoreState;
      if (parsed.version === STORE_VERSION) return parsed;
    }
  } catch {
    // fall through to seeding
  }
  const initial: StoreState = {
    salons: seedSalons,
    customers: seedCustomers,
    tokens: seedTokens,
    version: STORE_VERSION,
  };
  writeStore(initial);
  return initial;
}

function writeStore(state: StoreState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Trigger in-tab event for instant reactivity
    window.dispatchEvent(new CustomEvent('barberq:store-change', { detail: state }));
  } catch {
    // storage may be full or unavailable; keep working in memory
  }
}

export function getStore(): StoreState {
  return readStore();
}

export function saveStore(state: StoreState) {
  writeStore(state);
}

export function resetStore(): StoreState {
  const fresh: StoreState = {
    salons: seedSalons,
    customers: seedCustomers,
    tokens: seedTokens,
    version: STORE_VERSION,
  };
  writeStore(fresh);
  return fresh;
}

export function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getActiveTokens(tokens: QueueToken[], salonId: string): QueueToken[] {
  return tokens
    .filter((t) => t.salonId === salonId && (t.status === 'waiting' || t.status === 'serving'))
    .sort((a, b) => {
      if (a.status === 'serving' && b.status !== 'serving') return -1;
      if (b.status === 'serving' && a.status !== 'serving') return 1;
      return a.number - b.number;
    });
}

export function getWaitingTokens(tokens: QueueToken[], salonId: string): QueueToken[] {
  return tokens
    .filter((t) => t.salonId === salonId && t.status === 'waiting')
    .sort((a, b) => a.number - b.number);
}

export function getServingToken(tokens: QueueToken[], salonId: string): QueueToken | undefined {
  return tokens.find((t) => t.salonId === salonId && t.status === 'serving');
}

export function getNextTokenNumber(tokens: QueueToken[], salonId: string): number {
  const salonTokens = tokens.filter((t) => t.salonId === salonId);
  if (salonTokens.length === 0) return 1;
  return Math.max(...salonTokens.map((t) => t.number)) + 1;
}

export const DEFAULT_DURATION_MIN = 30;
export const SEC_PER_MIN = 60;

export function calcPeopleAhead(tokens: QueueToken[], salonId: string, tokenId: string): number {
  const token = tokens.find((t) => t.id === tokenId);
  if (!token) return 0;
  if (token.status === 'serving') return 0;
  if (token.status !== 'waiting') return 0;
  return tokens.filter(
    (t) =>
      t.salonId === salonId &&
      t.status === 'waiting' &&
      t.number < token.number,
  ).length;
}

export function calcWaitSeconds(
  tokens: QueueToken[],
  salonId: string,
  tokenId: string,
  defaultDurationMin = DEFAULT_DURATION_MIN,
): number {
  const token = tokens.find((t) => t.id === tokenId);
  if (!token) return 0;
  if (token.status === 'serving') return 0;
  if (token.status !== 'waiting') return 0;

  const serving = getServingToken(tokens, salonId);
  let total = 0;

  if (serving && serving.calledAt) {
    const elapsed = (Date.now() - new Date(serving.calledAt).getTime()) / 1000;
    const remaining = serving.serviceDurationMinutes * SEC_PER_MIN - elapsed;
    if (remaining > 0) total += remaining;
  }

  const ahead = tokens.filter(
    (t) =>
      t.salonId === salonId &&
      t.status === 'waiting' &&
      t.number < token.number,
  );
  for (const a of ahead) {
    total += (a.serviceDurationMinutes || defaultDurationMin) * SEC_PER_MIN;
  }
  return Math.max(0, Math.round(total));
}

export const STATUS_META: Record<
  TokenStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  waiting: { label: 'Waiting', color: 'text-gold-700', bg: 'bg-gold-100', dot: 'bg-gold-500' },
  serving: { label: 'Serving', color: 'text-primary-700', bg: 'bg-primary-100', dot: 'bg-primary-500' },
  completed: { label: 'Completed', color: 'text-ink-soft', bg: 'bg-mist', dot: 'bg-ink-soft' },
  cancelled: { label: 'Cancelled', color: 'text-danger-700', bg: 'bg-danger-100', dot: 'bg-danger-500' },
  skipped: { label: 'Skipped', color: 'text-danger-700', bg: 'bg-danger-100', dot: 'bg-danger-500' },
};
