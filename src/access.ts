import type { Level } from './types';
import { emit } from './bus';

const GUEST_KEY = 'rm-guest';
const ADMIN_KEY = 'rm-admin';

export type TierName = 'trauung' | 'party' | 'alles';

const TIER_CODES: Record<TierName, string[]> = {
  trauung: ['trauung', 'kirche', 'glockenschlag', 'glocke'],
  party: ['tanz', 'tanzschuh', 'party', 'discokugel'],
  alles: ['ganzertag', 'ganzer tag', 'sonnenaufgang', 'hochzeit', 'kuchengabel']
};

const TIER_LEVEL: Record<TierName, Level> = { trauung: 0, party: 1, alles: 2 };

let tier: TierName | null = null;
let admin = false;

export function getLevel(): Level | null {
  return tier === null ? null : TIER_LEVEL[tier];
}

export function getTier(): TierName | null {
  return tier;
}

export function isAdmin(): boolean {
  return admin;
}

function resolveCode(raw: string): TierName | 'admin' | null {
  const v = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-zäöüß ]/g, '');
  if (!v) return null;
  if (v === 'ruthundmax') return 'admin';
  for (const name of Object.keys(TIER_CODES) as TierName[]) {
    if (name === v || TIER_CODES[name].includes(v)) return name;
  }
  return null;
}

export function applyTier(next: TierName | null): void {
  tier = next;
  if (next) localStorage.setItem(GUEST_KEY, next);
  else localStorage.removeItem(GUEST_KEY);
  emit('level:changed');
}

export function setAdmin(on: boolean): void {
  admin = on;
  if (on) localStorage.setItem(ADMIN_KEY, '1');
}

export function resetGate(): void {
  localStorage.removeItem(GUEST_KEY);
  applyTier(null);
}

function isTierName(v: string | null): v is TierName {
  return v === 'trauung' || v === 'party' || v === 'alles';
}

/** Mirrors the mockup's initGuest(): URL ?g=<code> wins, else cached localStorage tier. */
export function initFromUrlOrCache(): boolean {
  if (localStorage.getItem(ADMIN_KEY) === '1') admin = true;

  const codeParam = new URLSearchParams(location.search).get('g');
  const resolved = codeParam ? resolveCode(codeParam) : null;
  if (resolved === 'admin') {
    setAdmin(true);
    applyTier('alles');
    return true;
  }
  if (resolved) {
    applyTier(resolved);
    return true;
  }

  const cached = localStorage.getItem(GUEST_KEY);
  if (isTierName(cached)) {
    tier = cached;
    return true;
  }
  return false;
}

export interface GateResult {
  ok: boolean;
  error?: string;
}

export function submitGateWord(raw: string, errorText: string): GateResult {
  const resolved = resolveCode(raw);
  if (resolved === 'admin') {
    setAdmin(true);
    applyTier('alles');
    return { ok: true };
  }
  if (resolved) {
    applyTier(resolved);
    return { ok: true };
  }
  return { ok: false, error: errorText };
}
