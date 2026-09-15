import { photosInFolder } from './photos';

interface LangText {
  de: string;
  en: string;
  sv: string;
}

export interface StoryEntry {
  slug: string;
  label: string;
  text: LangText;
  photos: string[];
}

const mdModules = import.meta.glob<string>('./photos/story/*/entry.md', { eager: true, query: '?raw', import: 'default' });

/**
 * Parses one entry.md: the DE section (first line = label, blank line, then
 * body) comes first, optionally followed by `---en---`/`---sv---` marker
 * lines each introducing that language's body text. The label itself is
 * never translated — matches the mockup's own markup, where the date/year
 * heading was always plain text, never wrapped in data-de/en/sv spans.
 */
function parseEntry(raw: string): { label: string; text: LangText } {
  const sections = raw.split(/^---(en|sv)---\s*$/im);
  // sections = [de-block, 'en', en-block, 'sv', sv-block] (marker blocks optional/any order)
  const deBlock = sections[0].trim();
  const [label, ...rest] = deBlock.split(/\n\s*\n/);
  const de = rest.join('\n\n').trim();
  const text: LangText = { de, en: de, sv: de };
  for (let i = 1; i < sections.length; i += 2) {
    const lang = sections[i].toLowerCase() as 'en' | 'sv';
    const body = sections[i + 1]?.trim() ?? '';
    if (body) text[lang] = body;
  }
  return { label: label.trim(), text };
}

export const storyEntries: StoryEntry[] = Object.entries(mdModules)
  .map(([path, raw]) => {
    const slug = path.match(/\.\/photos\/story\/([^/]+)\/entry\.md$/)?.[1] ?? path;
    const { label, text } = parseEntry(raw);
    return { slug, label, text, photos: photosInFolder(`story/${slug}`) };
  })
  .sort((a, b) => a.slug.localeCompare(b.slug));

// -- rendering (reproduces the mockup's exact row/photo-fan markup) --------

let fanCounter = 0;

function renderLeaf(src: string, leaf: number, toggleLabel: string | null): string {
  const inner = `<img class="raw-photo" src="${src}" alt="">${
    toggleLabel !== null
      ? `<button type="button" data-fan-toggle-btn style="position:absolute;left:0;right:0;bottom:0;height:26px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font:400 17px/1 Caveat,cursive;color:rgba(91,42,16,.6);letter-spacing:.04em"><span data-fanoc="open">${toggleLabel}</span><span data-fanoc="more">&#187;</span><span data-fanoc="close">&#215;</span></button>`
      : ''
  }`;
  return `<div data-leaf="${leaf}" style="position:absolute;inset:0;box-sizing:border-box;padding:8px 8px 26px;background:#fffdf8;border:1px solid rgba(91,42,16,.22);box-shadow:0 3px 10px rgba(91,42,16,.12)">${inner}</div>`;
}

function renderStack(photos: string[], dir: 'r' | 'l', seed: number): string {
  const count = photos.length;
  const width = 220 + ((seed * 37) % 30);
  const rotate = ((seed % 2 ? 1 : -1) * (1.4 + (seed % 5) * 0.25)).toFixed(2);
  fanCounter += 1;
  const leaves = [
    count > 2 ? renderLeaf(photos[2], 2, null) : '',
    count > 1 ? renderLeaf(photos[1], 1, null) : '',
    renderLeaf(photos[0], 0, count > 1 ? `+${count - 1}` : null)
  ].join('');
  return `<div data-stack="1" data-dir="${dir}" data-open="0" data-fan-id="${fanCounter}" style="flex:none;width:min(${width}px,42%);aspect-ratio:196/244;position:relative;transform:rotate(${rotate}deg)">${leaves}</div>`;
}

function renderPlaceholderStack(): string {
  return `<div style="flex:none;width:min(220px,42%);aspect-ratio:196/244;position:relative"><div class="raw-photo raw-photo-placeholder">noch kein Foto</div></div>`;
}

function langSpans(text: LangText): string {
  return `<span data-de="1">${text.de}</span><span data-en="1" style="display:none">${text.en}</span><span data-sv="1" style="display:none">${text.sv}</span>`;
}

function renderRow(entry: StoryEntry, index: number): string {
  const flip = index % 2 === 1;
  const dir = flip ? 'l' : 'r';
  const chunks: string[][] = [];
  for (let i = 0; i < entry.photos.length; i += 3) chunks.push(entry.photos.slice(i, i + 3));

  const primaryStack = chunks.length ? renderStack(chunks[0], dir, index) : renderPlaceholderStack();
  const extraStacks = chunks
    .slice(1)
    .map((chunk, i) => renderStack(chunk, dir, index + i + 1))
    .join('');

  const dotSide = flip ? 'left' : 'right';
  const justify = flip ? 'flex-end' : 'flex-start';
  const flexDir = flip ? 'row-reverse' : 'row';
  const textAlign = flip ? 'right' : 'left';

  return `
<div data-reveal="1" style="position:relative;display:flex;justify-content:${justify};padding-bottom:14px"><div style="position:absolute;${dotSide}:30.5%;top:50%;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;background:#f6f1e7;border:2.4px solid rgba(91,42,16,.55)"></div>
<div style="width:min(100%,540px);display:flex;flex-wrap:wrap;flex-direction:${flexDir};align-items:center;gap:22px;text-align:${textAlign}">
${primaryStack}
<div style="flex:1 1 190px;min-width:0"><p style="margin:0;font:400 60px/.9 Caveat,cursive">${entry.label}</p><p style="margin:8px 0 0;font:300 14px/1.65 Karla,sans-serif;text-wrap:pretty">${langSpans(entry.text)}</p></div>
</div>
${extraStacks ? `<div style="width:min(100%,540px);display:flex;flex-wrap:wrap;gap:14px;justify-content:${justify};margin-top:10px">${extraStacks}</div>` : ''}
</div>`;
}

export function renderStoryRows(): string {
  fanCounter = 0;
  return storyEntries.map((entry, i) => renderRow(entry, i)).join('');
}
