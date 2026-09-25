import type { Config } from './types';

export interface KuchenEntry {
  who: string;
  what: string;
  slices: number;
  kind: string;
}

export interface GuestLookup {
  name: string;
  stufe: 'trauung' | 'party' | 'alles';
  token: string;
  /** Names linked to this guest in the sheet ('Gehört zu') — prefill for the RSVP's "who's coming" field. */
  mitglieder?: string[];
}

export interface RsvpPayload {
  token: string;
  name: string;
  email: string;
  phone: string;
  count: number;
  mitkommende: string;
  personen: { name: string; allergien: string; tags: string[] }[];
  teilnahme: string;
  allergien: string;
  song: string;
  uebernachtung: boolean;
  nachricht: string;
}

export interface KuchenPayload {
  token: string;
  who: string;
  what: string;
  slices: number;
  kind: string;
  cooled: boolean;
  veganVeg: boolean;
  nuts: boolean;
  stand: boolean;
}

export interface SurprisePayload {
  who: string;
  contact: string;
  idea: string;
  secret: boolean;
}

export interface FragePayload {
  question: string;
  contact: string;
}

export interface TrauzeugenPayload {
  towhom: string;
  name: string;
  contact: string;
  message: string;
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

/** `t`/`code` are mutually exclusive — pass whichever the gate has (QR token vs typed-in fallback code). */
export async function guestLookup(config: Config, params: { t?: string; code?: string }): Promise<GuestLookup | null> {
  if (!isConfigured(config)) return null;
  try {
    const url = `${config.appsScriptUrl}?${new URLSearchParams({ action: 'guest_lookup', ...params })}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as GuestLookup | { error: string };
    return 'error' in data ? null : data;
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

export function submitSurprise(config: Config, payload: SurprisePayload): void {
  if (!isConfigured(config)) return;
  post(config, { type: 'ueberraschung', ...payload });
}

export function submitFrage(config: Config, payload: FragePayload): void {
  if (!isConfigured(config)) return;
  post(config, { type: 'frage', ...payload });
}

export function submitTrauzeugenMsg(config: Config, payload: TrauzeugenPayload): void {
  if (!isConfigured(config)) return;
  post(config, { type: 'trauzeugen', ...payload });
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
