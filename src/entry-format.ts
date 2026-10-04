/**
 * Shared parser for the "folder = entry" markdown format used by the story
 * timeline, Ablauf, and the Vogtland guide: leading `key: value` lines,
 * then a blank line, then free-text body — repeated per language behind
 * `---en---`/`---sv---` markers. Missing en/sv fields/body fall back to DE,
 * same fallback principle applyLang() already uses for missing spans
 * elsewhere on the page.
 */

export interface ParsedBlock {
  fields: Record<string, string>;
  body: string;
}

export interface ParsedEntry {
  de: ParsedBlock;
  en: ParsedBlock;
  sv: ParsedBlock;
}

function parseBlock(raw: string): ParsedBlock {
  // Leading blank lines (left over after a `---en---` marker) must not end the field block before it starts.
  const lines = raw.replace(/\r\n/g, '\n').replace(/^\s*\n/, '').split('\n');
  const fields: Record<string, string> = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      break;
    }
    const m = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (!m) break;
    fields[m[1].toLowerCase()] = m[2].trim();
    i++;
  }
  const body = lines
    .slice(i)
    .join('\n')
    .trim();
  return { fields, body };
}

export function parseEntry(raw: string): ParsedEntry {
  const sections = raw.split(/^---(en|sv)---\s*$/im);
  const de = parseBlock(sections[0]);
  const en: ParsedBlock = { fields: { ...de.fields }, body: de.body };
  const sv: ParsedBlock = { fields: { ...de.fields }, body: de.body };
  for (let i = 1; i < sections.length; i += 2) {
    const lang = sections[i].toLowerCase() as 'en' | 'sv';
    const target = lang === 'en' ? en : sv;
    const block = parseBlock(sections[i + 1] ?? '');
    Object.assign(target.fields, block.fields);
    if (block.body) target.body = block.body;
  }
  return { de, en, sv };
}

/**
 * Splits one markdown file into several entries, separated by a line
 * containing only `====`. Used for lists that don't need their own photo
 * per item (FAQ, gift blacklist) — everything lives in one file instead of
 * one subfolder per entry. Each chunk is parsed with `parseEntry()` as
 * usual, so `---en---`/`---sv---` still work per entry.
 */
export function splitEntries(raw: string): string[] {
  return raw
    .replace(/\r\n/g, '\n')
    .split(/^====\s*$/m)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

export interface LangFields {
  de: Record<string, string>;
  en: Record<string, string>;
  sv: Record<string, string>;
}

function parseFieldLines(raw: string): Record<string, string> {
  const fields: Record<string, string> = {};
  raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .forEach((line) => {
      const m = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
      if (m) fields[m[1].toLowerCase()] = m[2].trim();
    });
  return fields;
}

/**
 * Parses a file of plain `key: value` lines (one line per field, unlike
 * parseEntry()'s "fields then one free-text body") behind the usual
 * `---en---`/`---sv---` markers — used for one-off UI copy (Überraschung,
 * Frage stellen, die Trauzeugen) where each section has many short labels
 * rather than one body paragraph. Missing en/sv fields fall back to DE.
 */
export function parseLangFields(raw: string): LangFields {
  const sections = raw.replace(/\r\n/g, '\n').split(/^---(en|sv)---\s*$/im);
  const de = parseFieldLines(sections[0]);
  const en: Record<string, string> = { ...de };
  const sv: Record<string, string> = { ...de };
  for (let i = 1; i < sections.length; i += 2) {
    const lang = sections[i].toLowerCase() as 'en' | 'sv';
    const target = lang === 'en' ? en : sv;
    Object.assign(target, parseFieldLines(sections[i + 1] ?? ''));
  }
  return { de, en, sv };
}

/** Sorts by the leading `<number>-` prefix in a folder slug (e.g. "2-ankommen" before "10-x"), falling back to plain string order. */
export function byOrderPrefix(a: string, b: string): number {
  const na = parseInt(a, 10);
  const nb = parseInt(b, 10);
  if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
  return a.localeCompare(b);
}

export function langSpans(de: string, en: string, sv: string): string {
  return `<span data-de="1">${de}</span><span data-en="1" style="display:none">${en}</span><span data-sv="1" style="display:none">${sv}</span>`;
}
