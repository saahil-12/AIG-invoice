// ────────────────────────────────────────────────────────────────
// AIG Invoice Generator — localStorage helpers
// ────────────────────────────────────────────────────────────────

import { STORE_PREFIX } from './constants';

export function sGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(STORE_PREFIX + key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function sSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('storage error', e);
  }
}
