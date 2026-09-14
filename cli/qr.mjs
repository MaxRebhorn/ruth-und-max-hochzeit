import { readFile, writeFile } from 'node:fs/promises';
import QRCode from 'qrcode';

export async function qr({ level, out }) {
  if (!level || !out) {
    console.error('Usage: wedding qr --level <0-3> --out <file.png>');
    process.exit(1);
  }
  const config = JSON.parse(await readFile(new URL('../config/config.json', import.meta.url), 'utf8'));
  const token = config.levelTokens[String(level)];
  if (!token || token.startsWith('CHANGE-ME')) {
    console.error(`No real token configured for level ${level} in config/config.json yet.`);
    process.exit(1);
  }
  const url = `${config.siteUrl}?access=${encodeURIComponent(level)}&t=${encodeURIComponent(token)}`;
  const buffer = await QRCode.toBuffer(url, { width: 512, margin: 2 });
  await writeFile(out, buffer);
  console.log(`Wrote ${out} for level ${level} → ${url}`);
}
