import type { Config, Level } from './types';

export interface KuchenEntry {
  who: string;
  what: string;
  slices: number;
  kind: string;
}

export interface SongResult {
  name: string;
  artist: string;
  uri: string;
}

const MOCK = import.meta.env.DEV && import.meta.env.VITE_API_MODE !== 'live';

function endpoint(config: Config, params: Record<string, string>): string {
  return `${config.appsScriptUrl}?${new URLSearchParams(params).toString()}`;
}

export async function lookupGuest(config: Config, name: string, email: string): Promise<Level | null> {
  if (MOCK) {
    await delay(600);
    return 2;
  }
  const res = await fetch(endpoint(config, { action: 'guest', name, email }));
  const data = (await res.json()) as { level: Level | null };
  return data.level;
}

export async function searchSongs(config: Config, q: string): Promise<SongResult[]> {
  if (MOCK) {
    await delay(200);
    return q ? [{ name: `${q} (Beispiel)`, artist: 'Demo Artist', uri: 'spotify:track:demo' }] : [];
  }
  const res = await fetch(endpoint(config, { action: 'songs', q }));
  return (await res.json()) as SongResult[];
}

export async function listKuchen(config: Config): Promise<KuchenEntry[]> {
  if (MOCK) {
    return [
      { who: 'Oma Renate', what: 'Käsekuchen', slices: 16, kind: 'Kuchen' },
      { who: 'Familie Beispiel', what: 'Schokotorte', slices: 12, kind: 'Torte' }
    ];
  }
  const res = await fetch(endpoint(config, { action: 'kuchen_list' }));
  return (await res.json()) as KuchenEntry[];
}

export async function listFotos(config: Config): Promise<string[]> {
  if (MOCK) return [];
  const res = await fetch(endpoint(config, { action: 'fotos_list' }));
  return (await res.json()) as string[];
}

export type SubmitType = 'rsvp' | 'essen' | 'lied' | 'ueberraschung' | 'uebernachtung' | 'kuchen' | 'foto' | 'frage';

export async function submitForm(config: Config, type: SubmitType, payload: Record<string, unknown>): Promise<void> {
  if (MOCK) {
    await delay(400);
    // eslint-disable-next-line no-console
    console.info('[mock submit]', type, payload);
    return;
  }
  await fetch(config.appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids a CORS preflight against Apps Script
    body: JSON.stringify({ type, ...payload })
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
