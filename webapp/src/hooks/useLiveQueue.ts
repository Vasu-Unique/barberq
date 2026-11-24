import { useEffect, useState } from 'react';
import { calcWaitSeconds, getStore } from '@/data/store';
import type { QueueToken } from '@/data/types';

export function useWaitSeconds(salonId: string, tokenId: string, intervalMs = 5000): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const compute = () => {
      const tokens = getStore().tokens;
      const token = tokens.find((t) => t.id === tokenId);
      if (!token || (token.status !== 'waiting' && token.status !== 'serving')) {
        setSeconds(0);
        return;
      }
      setSeconds(calcWaitSeconds(tokens, salonId, tokenId));
    };
    compute();
    const interval = setInterval(compute, intervalMs);
    return () => clearInterval(interval);
  }, [salonId, tokenId, intervalMs]);

  return seconds;
}

export function useNow(intervalMs = 30000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);
  return now;
}

export function usePeopleAhead(salonId: string, tokenId: string): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const compute = () => {
      const tokens = getStore().tokens;
      const token = tokens.find((t) => t.id === tokenId);
      if (!token) return setCount(0);
      setCount(
        tokens.filter(
          (t) =>
            t.salonId === salonId &&
            (t.status === 'waiting' || t.status === 'serving') &&
            t.number < token.number,
        ).length,
      );
    };
    compute();
    const interval = setInterval(compute, 2000);
    return () => clearInterval(interval);
  }, [salonId, tokenId]);
  return count;
}

export function useServingInfo(salonId: string): { token?: QueueToken; elapsedSec: number } {
  const [info, setInfo] = useState<{ token?: QueueToken; elapsedSec: number }>({ elapsedSec: 0 });
  useEffect(() => {
    const compute = () => {
      const tokens = getStore().tokens;
      const serving = tokens.find((t) => t.salonId === salonId && t.status === 'serving');
      let elapsed = 0;
      if (serving?.calledAt) {
        elapsed = Math.round((Date.now() - new Date(serving.calledAt).getTime()) / 1000);
      }
      setInfo({ token: serving, elapsedSec: elapsed });
    };
    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [salonId]);
  return info;
}
