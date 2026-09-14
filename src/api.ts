import type { Config } from './types';

export interface KuchenEntry {
  who: string;
  what: string;
  slices: number;
  kind: string;
}

export interface RsvpPayload {
  name: string;
  count: number;
  teilnahme: string;
  allergien: string;
  song: string;
  uebernachtung: boolean;
  nachricht: string;
}

export interface KuchenPayload {
  who: string;
  what: string;
  slices: number;
  kind: string;
  cooled: boolean;
  veganVeg: boolean;
  nuts: boolean;
  stand: boolean;
}

function isConfigured(config: Config): boolean {
  return !!config.appsScriptUrl && !config.appsScriptUrl.includes('CHANGE-ME');
}

export async function listKuchen(config: Config): Promise<KuchenEntry[] | null> {
  if (!isConfigured(config)) return null;
  try {
    const url = `${config.appsScriptUrl}?${new URLSearchParams({ action: 'kuchen_list' })}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as KuchenEntry[];
  } catch {
    return null;
  }
}

/** Fire-and-forget: the caller's own animation/local state is the primary UX, this just persists it. */
export function submitRsvp(config: Config, payload: RsvpPayload): void {
  if (!isConfigured(config)) return;
  post(config, { type: 'rsvp', ...payload });
}

export function submitKuchen(config: Config, payload: KuchenPayload): void {
  if (!isConfigured(config)) return;
  post(config, { type: 'kuchen', ...payload });
}

function post(config: Config, body: Record<string, unknown>): void {
  // text/plain avoids a CORS preflight against Apps Script's web app endpoint
  fetch(config.appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  }).catch(() => {
    /* best-effort — the on-page animation already gave the guest feedback */
  });
}
