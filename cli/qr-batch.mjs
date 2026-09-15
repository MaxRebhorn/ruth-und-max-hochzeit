import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import QRCode from 'qrcode';
import { slugify } from './slugify.mjs';
import { resolveSiteUrl } from './site-url.mjs';

/**
 * Reads a CSV export of the `Gäste` tab (Google Sheets → File → Download →
 * .csv, from apps-script's `Gäste` sheet — see apps-script/README.md) and
 * writes one QR PNG per row. Deliberately reads a local file instead of
 * calling Apps Script for the list — an unauthenticated "export all guests"
 * endpoint would be a needless way to scrape the whole guest list, for a
 * task that only needs to run once per invitation round anyway.
 */
export async function qrBatch({ csv, outDir = 'qr', base }) {
  if (!csv) {
    console.error('Usage: wedding qr-batch --csv <gaeste-export.csv> [--outDir qr] [--base <url>]');
    process.exit(1);
  }
  const siteUrl = await resolveSiteUrl(base);

  const rows = parseCsv(await readFile(csv, 'utf8'));
  if (rows.length === 0) {
    console.error('CSV is empty.');
    process.exit(1);
  }
  const header = rows[0].map((h) => h.trim());
  const idIdx = header.indexOf('Einladung-ID');
  const nameIdx = header.indexOf('Name');
  const tokenIdx = header.indexOf('Token');
  if (idIdx === -1 || tokenIdx === -1) {
    console.error('CSV needs at least "Einladung-ID" and "Token" columns — export the Gäste tab as-is, header row included.');
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });
  let written = 0;
  let skipped = 0;
  for (const row of rows.slice(1)) {
    const id = row[idIdx]?.trim();
    const token = row[tokenIdx]?.trim();
    if (!id || !token) {
      skipped++;
      continue;
    }
    const url = `${siteUrl.replace(/\/?$/, '/')}?t=${encodeURIComponent(token)}`;
    const buffer = await QRCode.toBuffer(url, { width: 512, margin: 2 });
    const name = nameIdx !== -1 ? row[nameIdx]?.trim() : '';
    const file = join(outDir, `${id}${name ? '-' + slugify(name) : ''}.png`);
    await writeFile(file, buffer);
    written++;
  }
  console.log(`Wrote ${written} QR code(s) to ${outDir}/${skipped ? ` (${skipped} row(s) skipped — missing Einladung-ID/Token, e.g. run "Tokens & Codes für neue Gäste erzeugen" first)` : ''}`);
}

/** Minimal RFC-4180-ish CSV parser — handles quoted fields, escaped quotes, embedded commas/newlines. No dependency needed for one file format. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
