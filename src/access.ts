import type { Config, Level } from './types';
import { lookupGuest } from './api';
import { emit } from './bus';

const LEVEL_KEY = 'rm-level';
const EMAIL_KEY = 'rm-email';
const ADMIN_KEY = 'rm-admin';

let level: Level | null = null;
let admin = false;

export function getLevel(): Level | null {
  return level;
}

export function isAdmin(): boolean {
  return admin;
}

function setLevel(l: Level | null): void {
  level = l;
  if (l !== null) localStorage.setItem(LEVEL_KEY, String(l));
  else localStorage.removeItem(LEVEL_KEY);
  emit('level:changed');
}

export function setAdmin(on: boolean): void {
  admin = on;
  if (on) localStorage.setItem(ADMIN_KEY, '1');
  else localStorage.removeItem(ADMIN_KEY);
}

export function resetGate(): void {
  localStorage.removeItem(LEVEL_KEY);
  localStorage.removeItem(EMAIL_KEY);
  setLevel(null);
}

/**
 * Tries the QR/token path first (?access=<level>&t=<token>, instant, no
 * network call), then falls back to a cached level from a previous
 * name+email lookup. Returns true if a level was resolved.
 */
export function initFromUrlOrCache(config: Config): boolean {
  if (localStorage.getItem(ADMIN_KEY) === '1') admin = true;

  const params = new URLSearchParams(location.search);
  const accessParam = params.get('access');
  const token = params.get('t');
  if (accessParam !== null && token) {
    const lvl = parseLevel(accessParam);
    if (lvl !== null && config.levelTokens[String(lvl)] === token) {
      setLevel(lvl);
      return true;
    }
  }

  const cached = localStorage.getItem(LEVEL_KEY);
  const lvl = parseLevel(cached);
  if (lvl !== null) {
    setLevel(lvl);
    return true;
  }
  return false;
}

export interface GateResult {
  ok: boolean;
  level: Level | null;
  error?: 'not_found' | 'network';
}

export async function submitGate(config: Config, name: string, email: string): Promise<GateResult> {
  try {
    const lvl = await lookupGuest(config, name.trim(), email.trim());
    if (lvl === null) return { ok: false, level: null, error: 'not_found' };
    localStorage.setItem(EMAIL_KEY, email.trim());
    setLevel(lvl);
    return { ok: true, level: lvl };
  } catch {
    return { ok: false, level: null, error: 'network' };
  }
}

export function getCachedEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY);
}

function parseLevel(raw: string | null): Level | null {
  if (raw === null) return null;
  const n = Number(raw);
  return n === 0 || n === 1 || n === 2 || n === 3 ? (n as Level) : null;
}
