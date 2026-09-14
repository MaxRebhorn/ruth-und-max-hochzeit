/**
 * Renders the real Claude Design mockup (not our reimplementation) and
 * screenshots it, so `reference/` always reflects exactly how the design
 * is supposed to look — regenerate this after every design/ re-export.
 *
 * Usage (from repo root):
 *   npm install --no-save puppeteer-core   # not a project dependency, dev-only tool
 *   python3 -m http.server 5300 --directory design/wedding-website-ui-mockups/project &
 *   node scripts/capture-reference.mjs
 */
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'reference');
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox']
});
const page = await browser.newPage();
page.on('pageerror', (err) => console.log('[pageerror]', err.message));

await page.setViewport({ width: 420, height: 1000 });
await page.goto('http://localhost:5300/Ruth%20und%20Max%20Hochzeit.dc.html', { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise((r) => setTimeout(r, 4000)); // let React mount + animations settle

await page.screenshot({ path: path.join(OUT, '00-gate.png') });

// triple-tap "R & M" secret to unlock admin + alles tier
const rm = await page.evaluateHandle(() => Array.from(document.querySelectorAll('p')).find((p) => p.textContent.trim() === 'R & M'));
for (let i = 0; i < 3; i++) {
  await rm.asElement().click();
  await new Promise((r) => setTimeout(r, 100));
}
await new Promise((r) => setTimeout(r, 500));

const seal = await page.$('button[aria-label="Siegel öffnen"]');
if (seal) {
  await seal.click();
  await new Promise((r) => setTimeout(r, 4500));
}
await page.screenshot({ path: path.join(OUT, '01-hero.png') });

const sectionIds = await page.evaluate(() => Array.from(document.querySelectorAll('section[id]')).map((s) => s.id));
for (const id of sectionIds) {
  await page.evaluate((sid) => document.getElementById(sid)?.scrollIntoView({ block: 'start' }), id);
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: path.join(OUT, `section-${id}.png`) });
}

await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: path.join(OUT, 'full-mobile.png'), fullPage: true });

await page.setViewport({ width: 1280, height: 1000 });
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: path.join(OUT, 'full-desktop.png'), fullPage: true });

await browser.close();
