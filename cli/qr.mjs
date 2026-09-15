import { writeFile } from 'node:fs/promises';
import QRCode from 'qrcode';
import { resolveSiteUrl } from './site-url.mjs';

/** One QR for one invitation — the site only understands `?t=<token>` links now (see technical-spec.md §1). */
export async function qr({ token, out, base }) {
  if (!token || !out) {
    console.error('Usage: wedding qr --token <einladungs-token> --out <file.png> [--base <url>]');
    process.exit(1);
  }
  const siteUrl = await resolveSiteUrl(base);
  const url = `${siteUrl.replace(/\/?$/, '/')}?t=${encodeURIComponent(token)}`;
  const buffer = await QRCode.toBuffer(url, { width: 512, margin: 2 });
  await writeFile(out, buffer);
  console.log(`Wrote ${out} → ${url}`);
}
