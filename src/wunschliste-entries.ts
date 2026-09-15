import { parseEntry, splitEntries, langSpans } from './entry-format';

const mdModules = import.meta.glob<string>('./content/wunschliste-blacklist.md', { eager: true, query: '?raw', import: 'default' });
const raw = Object.values(mdModules)[0] ?? '';

export interface BlacklistEntry {
  text: { de: string; en: string; sv: string };
}

export const blacklistEntries: BlacklistEntry[] = splitEntries(raw).map((chunk) => {
  const { de, en, sv } = parseEntry(chunk);
  return { text: { de: de.body, en: en.body || de.body, sv: sv.body || de.body } };
});

function renderItem(entry: BlacklistEntry): string {
  return `<li style="display:flex;gap:10px;font:300 14px/1.5 Karla,sans-serif"><span style="color:#b5453a">✕</span><span>${langSpans(entry.text.de, entry.text.en, entry.text.sv)}</span></li>`;
}

export function renderBlacklistItems(): string {
  return blacklistEntries.map(renderItem).join('');
}
