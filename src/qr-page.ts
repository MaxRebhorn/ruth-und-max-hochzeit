/**
 * Password-protected QR page (/qr/): loads every invitation from the Gäste tab via Apps Script's
 * `guest_list` (the password is checked there — this page is static and public, so the browser side
 * protects nothing) and shows one printable QR card per invitation, linking to `<site>?t=<token>`.
 */
import QRCode from 'qrcode';
import type { Config } from './types';

interface Guest {
  id: string;
  name: string;
  stufe: string;
  token: string;
  code: string;
  mitglieder: string[];
}

const STUFE: Record<string, string> = { trauung: 'Trauung', party: 'Trauung + Party', alles: 'ganzer Tag' };

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const status = $<HTMLParagraphElement>('status');
const site = $<HTMLInputElement>('site');
const cards = $<HTMLDivElement>('cards');

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const qrUrl = (g: Guest) => `${site.value.trim().replace(/\/?$/, '/')}?t=${encodeURIComponent(g.token)}`;

let guests: Guest[] = [];

async function loadConfig(): Promise<Config> {
  const res = await fetch(`${import.meta.env.BASE_URL}config/config.json`);
  return (await res.json()) as Config;
}

async function render(): Promise<void> {
  const q = $<HTMLInputElement>('filter').value.trim().toLowerCase();
  const shown = guests.filter((g) => !q || [g.name, ...g.mitglieder].some((n) => n.toLowerCase().includes(q)));
  const svgs = await Promise.all(shown.map((g) => QRCode.toString(qrUrl(g), { type: 'svg', margin: 1, errorCorrectionLevel: 'M' })));
  cards.innerHTML = shown
    .map(
      (g, i) => `<div class="card">${svgs[i]}
<h2>${esc(g.name)}</h2>
${g.mitglieder.length ? `<div class="meta">+ ${esc(g.mitglieder.join(', '))}</div>` : ''}
<div class="meta">${esc(STUFE[g.stufe] ?? g.stufe)} · ${esc(g.id)}</div>
${g.code ? `<div class="code">${esc(g.code)}</div>` : ''}
<button type="button" data-png="${i}">PNG speichern</button></div>`
    )
    .join('');
  cards.querySelectorAll<HTMLButtonElement>('[data-png]').forEach((b) =>
    b.addEventListener('click', async () => {
      const g = shown[Number(b.dataset.png)];
      const a = document.createElement('a');
      a.href = await QRCode.toDataURL(qrUrl(g), { width: 1024, margin: 2 });
      a.download = `${g.id}-${g.name.replace(/[^\p{L}\p{N}]+/gu, '-')}.png`;
      a.click();
    })
  );
  status.textContent = `${shown.length} von ${guests.length} Einladungen`;
}

async function main(): Promise<void> {
  const config = await loadConfig();
  const placeholder = config.siteUrl.includes('CHANGE-ME');
  site.value = placeholder ? new URL(import.meta.env.BASE_URL, location.origin).href : config.siteUrl;
  const warn = $<HTMLParagraphElement>('site-warn');
  const checkSite = () => {
    // A tunnel or localhost link in a printed invitation stops working — warn before anyone prints it.
    warn.hidden = !/localhost|trycloudflare|127\.0\.0\.1/.test(site.value) && !placeholder;
    warn.textContent = 'Achtung: Dieser Link ist nicht die echte Website. Vor dem Drucken die richtige Adresse eintragen (siteUrl in public/config/config.json).';
  };
  checkSite();

  $<HTMLFormElement>('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'lädt …';
    try {
      const res = await fetch(config.appsScriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // simple request: no CORS preflight, which Apps Script can't answer
        body: JSON.stringify({ type: 'guest_list', password: $<HTMLInputElement>('password').value })
      });
      const data = (await res.json()) as Guest[] | { error: string };
      if (!Array.isArray(data)) {
        status.textContent =
          data.error === 'forbidden' ? 'Passwort falsch.' : data.error === 'rate limited' ? 'Zu viele Versuche, eine Minute warten.' : `Fehler: ${data.error}`;
        return;
      }
      guests = data;
      $<HTMLFormElement>('login').hidden = true;
      $<HTMLElement>('list').hidden = false;
      await render();
    } catch (err) {
      status.textContent = `Server nicht erreichbar (${err instanceof Error ? err.message : err}).`;
    }
  });
  site.addEventListener('input', () => {
    checkSite();
    void render();
  });
  $<HTMLInputElement>('filter').addEventListener('input', () => void render());
  $<HTMLButtonElement>('print').addEventListener('click', () => window.print());
}

void main();
