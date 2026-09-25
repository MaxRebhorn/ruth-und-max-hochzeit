import { randomUUID } from 'node:crypto';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import QRCode from 'qrcode';
import { slugify } from './slugify.mjs';
import { resolveSiteUrl } from './site-url.mjs';

const STUFE_BY_LEVEL = { 1: 'trauung', 2: 'party', 3: 'alles' };

/**
 * Generates a fresh Token + 4-digit Code for one new guest and a QR PNG in
 * transfer/. Without WEDDING_ADMIN_KEY in .env it does NOT write to the live
 * Gäste sheet (see addGuests for the opt-in, key-guarded write). A plain
 * unguarded remote "add guest" call would be wrong: the Apps Script `/exec` URL ships to every
 * visitor's browser, so a write-capable action there would be an
 * effectively public "add any guest" endpoint — worse than the guest-list
 * export endpoint we already decided against. Prints a ready-to-paste row
 * instead; leave Einladung-ID blank when pasting it in, the sheet's own
 * "Tokens & Codes für neue Gäste erzeugen" menu fills that in without
 * touching the Token/Code you already have.
 *
 * Note: Stufe only gates Feier/Afterparty/Kuchenbuffet/etc — the
 * Übernachtung checkbox on the RSVP form is visible to every guest
 * regardless of Stufe (not gated at all today), so there's no way to grant
 * "alles minus overnight" specifically. See technical-spec.md §1.
 */
export async function generateQr({ _: args = [], base }) {
  const [name, levelRaw] = args;
  const level = Number(levelRaw);
  const stufe = STUFE_BY_LEVEL[level];
  if (!name || !stufe) {
    console.error('Usage: wedding generate-qr <Name> <1|2|3> [--base <url>]   (1=trauung, 2=+party, 3=+alles)');
    process.exit(1);
  }

  const siteUrl = await resolveSiteUrl(base);

  const token = randomUUID();
  const code = String(Math.floor(1000 + Math.random() * 9000));
  const url = `${siteUrl.replace(/\/?$/, '/')}?t=${encodeURIComponent(token)}`;

  await mkdir('transfer', { recursive: true });
  const file = join('transfer', `${slugify(name)}.png`);
  const buffer = await QRCode.toBuffer(url, { width: 512, margin: 2 });
  await writeFile(file, buffer);

  console.log(`QR geschrieben: ${file}`);
  if (await addGuests([{ name, stufe, token, code }])) return console.log(`Gast im Sheet angelegt. Link: ${url}`);
  console.log(`Link: ${url}`);
  console.log('');
  console.log('Neue Zeile im Gäste-Tab (Einladung-ID leer lassen):');
  console.log(`  Name:  ${name}`);
  console.log(`  Stufe: ${stufe}`);
  console.log(`  Token: ${token}`);
  console.log(`  Code:  ${code}`);
}

/** Writes the rows via Apps Script `add_guest` when ADMIN_KEY (in .env) is set; returns false to fall back to the manual paste flow. */
export async function addGuests(guests) {
  try {
    process.loadEnvFile('.env');
  } catch {
    /* no .env */
  }
  const key = process.env.WEDDING_ADMIN_KEY;
  if (!key) return false;
  const config = JSON.parse(await readFile(new URL('../public/config/config.json', import.meta.url), 'utf8'));
  const res = await fetch(config.appsScriptUrl, { method: 'POST', body: JSON.stringify({ type: 'add_guest', adminKey: key, guests }) });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) console.error(`Sheet-Eintrag fehlgeschlagen: ${data.error ?? res.status}`);
  return !!data.ok;
}
