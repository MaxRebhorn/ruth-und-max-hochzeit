import { parseEntry, splitEntries, langSpans } from './entry-format';

const mdModules = import.meta.glob<string>('./content/faq.md', { eager: true, query: '?raw', import: 'default' });
const raw = Object.values(mdModules)[0] ?? '';

export interface FaqEntry {
  frage: { de: string; en: string; sv: string };
  antwort: { de: string; en: string; sv: string };
  hinweis: string;
}

export const faqEntries: FaqEntry[] = splitEntries(raw).map((chunk) => {
  const { de, en, sv } = parseEntry(chunk);
  return {
    frage: { de: de.fields.frage || '', en: en.fields.frage || de.fields.frage || '', sv: sv.fields.frage || de.fields.frage || '' },
    antwort: { de: de.body, en: en.body || de.body, sv: sv.body || de.body },
    hinweis: de.fields.hinweis || ''
  };
});

function renderCard(entry: FaqEntry, index: number): string {
  const rotate = index % 2 === 0 ? -0.5 : 0.5;
  const hinweisHtml = entry.hinweis
    ? `<p style="margin:6px 0 0;text-align:center;font:400 11px/1.5 ui-monospace,Menlo,monospace;color:#a8562f">${entry.hinweis}</p>`
    : '';
  return `
<details data-card="1" style="background:#fffdf8;border:1px solid rgba(91,42,16,.18);padding:15px 20px 17px;transform:rotate(${rotate}deg)"><summary style="font:400 25px/1.2 Caveat,cursive;display:flex;align-items:center;justify-content:center;gap:12px"><span>${langSpans(entry.frage.de, entry.frage.en, entry.frage.sv)}</span><span data-chev="1" style="opacity:.5;font-size:26px;line-height:.8;transform-origin:50% 55%">›</span></summary><p style="margin:8px 0 0;text-align:center;font:300 13.5px/1.7 Karla,sans-serif">${langSpans(entry.antwort.de, entry.antwort.en, entry.antwort.sv)}</p>${hinweisHtml}</details>`;
}

export function renderFaqCards(): string {
  return faqEntries.map(renderCard).join('');
}
