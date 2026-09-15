import { randomUUID } from 'node:crypto';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import QRCode from 'qrcode';
import { slugify } from './slugify.mjs';
import { resolveSiteUrl } from './site-url.mjs';

const STUFE_BY_LEVEL = { 1: 'trauung', 2: 'party', 3: 'alles' };

/**
 * Generates a fresh Token + 4-digit Code for one new guest and a QR PNG in
 * transfer/ — but does NOT write to the live Gäste sheet. Deliberately no
 * remote "add guest" call: the Apps Script `/exec` URL ships to every
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
  console.log(`Link: ${url}`);
  console.log('');
  console.log('Neue Zeile im Gäste-Tab (Einladung-ID leer lassen):');
  console.log(`  Name:  ${name}`);
  console.log(`  Stufe: ${stufe}`);
  console.log(`  Token: ${token}`);
  console.log(`  Code:  ${code}`);
}
