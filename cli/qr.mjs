import { readFile, writeFile } from 'node:fs/promises';
import QRCode from 'qrcode';

// Mirrors GUEST_CODES in src/app.ts — the canonical word used per tier's
// shareable link (kept in sync manually; small enough that duplicating here
// beats importing TS into a plain Node script).
const TIER_CODE = { trauung: 'kirche', party: 'tanz', alles: 'hochzeit' };

export async function qr({ tier, out }) {
  if (!tier || !out || !(tier in TIER_CODE)) {
    console.error('Usage: wedding qr --tier trauung|party|alles --out <file.png>');
    process.exit(1);
  }
  const config = JSON.parse(await readFile(new URL('../public/config/config.json', import.meta.url), 'utf8'));
  if (config.siteUrl.includes('CHANGE-ME')) {
    console.error('Set the real siteUrl in public/config/config.json first.');
    process.exit(1);
  }
  const url = `${config.siteUrl}?g=${encodeURIComponent(TIER_CODE[tier])}`;
  const buffer = await QRCode.toBuffer(url, { width: 512, margin: 2 });
  await writeFile(out, buffer);
  console.log(`Wrote ${out} for tier "${tier}" → ${url}`);
}
