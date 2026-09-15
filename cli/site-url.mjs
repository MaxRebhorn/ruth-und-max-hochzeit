import { readFile } from 'node:fs/promises';

/** `--base <url>` overrides `config.json`'s `siteUrl` for one invocation — handy for testing against a tunnel without touching the committed config. */
export async function resolveSiteUrl(base) {
  if (base) return base;
  const config = JSON.parse(await readFile(new URL('../public/config/config.json', import.meta.url), 'utf8'));
  if (config.siteUrl.includes('CHANGE-ME')) {
    console.error('Set the real siteUrl in public/config/config.json first, or pass --base <url> (e.g. a test tunnel) for now.');
    process.exit(1);
  }
  return config.siteUrl;
}
