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

function renderLeaf(src: string, leaf: number, toggleLabel: string | null, clickable: boolean): string {
  const inner = `<img class="raw-photo" src="${src}" alt="">${
    toggleLabel !== null
      ? `<button type="button" data-fan-toggle-btn style="position:absolute;left:0;right:0;bottom:0;height:44px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font:400 17px/1 Caveat,cursive;color:rgba(91,42,16,.6);letter-spacing:.04em"><span data-fanoc="open">${toggleLabel}</span><span data-fanoc="more">&#187;</span><span data-fanoc="close">&#215;</span></button>`
      : ''
  }`;
  const cursor = clickable ? 'cursor:pointer;' : '';
  return `<div data-leaf="${leaf}" style="position:absolute;inset:0;box-sizing:border-box;padding:8px 8px 26px;background:#fffdf8;border:1px solid rgba(91,42,16,.22);box-shadow:0 3px 10px rgba(91,42,16,.12);${cursor}">${inner}</div>`;
}

function renderStack(photos: string[], dir: 'r' | 'l', seed: number, size: number): string {
  const count = photos.length;
  const rotate = ((seed % 2 ? 1 : -1) * (1.4 + (seed % 5) * 0.25)).toFixed(2);
  fanCounter += 1;
  const clickable = count > 1;
  const leaves = [
    count > 2 ? renderLeaf(photos[2], 2, null, clickable) : '',
    count > 1 ? renderLeaf(photos[1], 1, null, clickable) : '',
    renderLeaf(photos[0], 0, count > 1 ? `+${count - 1}` : null, clickable)
  ].join('');
  // The stack itself still owns the tilt/fan-out transform (the open-state CSS resets it to
  // rotate(0) !important) — the hint below needs to stay unrotated, so it's a sibling positioned
  // against this outer, never-rotated wrapper instead of a child of the stack.
  const stack = `<div data-stack="1" data-dir="${dir}" data-open="0" data-fan-id="${fanCounter}" style="position:absolute;inset:0;transform:rotate(${rotate}deg)">${leaves}</div>`;
  const hint = clickable ? renderStackHint() : '';
  return `<div style="flex:none;width:min(${size}px,42%);aspect-ratio:196/244;position:relative">${stack}${hint}</div>`;
}

/** Nudges first-time visitors that the photo stack fans out on click/tap — easy to miss otherwise
 * (confirmed in user testing: "the '+2' underneath, I don't get what that means"). Appears once this
 * stack scrolls into view (data-reveal, same mechanism as everywhere else) and is hidden again the
 * moment its stack is actually opened (setupStoryFanToggles in app.ts). */
function renderStackHint(): string {
  return `<div data-stack-hint="1" data-reveal="1" aria-hidden="true" style="position:absolute;left:-8px;bottom:-30px;z-index:5;pointer-events:none;display:flex;flex-direction:column;align-items:center;gap:1px">
<div style="animation:bob 1.6s ease-in-out infinite"><svg width="20" height="24" viewBox="0 0 20 24" fill="none" style="display:block;transform:rotate(22deg)"><path d="M10 23V2M10 2 4 8M10 2l6 6" stroke="#a8562f" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
<span style="font:400 13px/1 Caveat,cursive;color:#a8562f;white-space:nowrap"><span data-de="1">antippen</span><span data-en="1" style="display:none">tap</span><span data-sv="1" style="display:none">tryck</span></span>
</div>`;
}

/** A photo-less entry (e.g. the future-facing closing row) — an empty frame instead of a stack, no photo yet. */
function renderFutureStack(size: number): string {
  return `<div style="flex:none;width:min(${size}px,42%);aspect-ratio:196/244"></div>`;
}

/** A plain (non-fanning) extra photo card — same polaroid look as a stack leaf, no toggle. */
function renderExtraThumb(src: string): string {
  return `<div style="flex:none;width:min(${EXTRA_SIZE}px,28%);aspect-ratio:196/244;position:relative;box-sizing:border-box;padding:6px 6px 6px;background:#fffdf8;border:1px solid rgba(91,42,16,.22);box-shadow:0 3px 10px rgba(91,42,16,.12)"><img class="raw-photo" src="${src}" alt=""></div>`;
}

function langSpans(text: LangText): string {
  return `<span data-de="1">${text.de}</span><span data-en="1" style="display:none">${text.en}</span><span data-sv="1" style="display:none">${text.sv}</span>`;
}

const PRIMARY_SIZE = 230; // the "hero" fan-stack — same footprint the mockup's own 9 entries always used
const EXTRA_SIZE = 108; // extra photos beyond the first 3 read as small flat thumbnails, so 3+ fit per row even on mobile

/** Turns single line breaks of a multi-paragraph text into visible paragraph gaps. */
function paragraphs(text: LangText): LangText {
  const br = (s: string) => s.replace(/\n+/g, '<br><br>');
  return { de: br(text.de), en: br(text.en), sv: br(text.sv) };
}

function langSpansLang(text: LangText): string {
  return `<span data-de="1" lang="de">${text.de}</span><span data-en="1" lang="en" style="display:none">${text.en}</span><span data-sv="1" lang="sv" style="display:none">${text.sv}</span>`;
}

/** The closing "…" entry has no photos: a centred, wider, justified text block instead of a photo + narrow column. */
function renderClosingRow(entry: StoryEntry): string {
  return `
<div data-row="1" data-reveal="1" style="position:relative;display:flex;justify-content:center;padding:30px 0 14px"><div style="position:absolute;left:50%;top:12px;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;background:#f6f1e7;border:2.4px solid rgba(91,42,16,.55)"></div>
<div style="width:min(100%,640px);text-align:center"><p class="story-label" style="margin:0;font:400 60px/.9 Caveat,cursive"><span class="line-halo">${entry.label}</span></p><p class="story-text" style="margin:12px 0 0;font:300 15px/1.7 Karla,sans-serif;text-align:justify;text-justify:inter-word;hyphens:auto;-webkit-hyphens:auto"><span class="line-halo">${langSpansLang(paragraphs(entry.text))}</span></p></div>
</div>`;
}

function renderRow(entry: StoryEntry, index: number): string {
  if (entry.photos.length === 0 && index === storyEntries.length - 1) return renderClosingRow(entry);
  const flip = index % 2 === 1;
  const dir = flip ? 'l' : 'r';
  const primaryPhotos = entry.photos.slice(0, 3);
  const extraPhotos = entry.photos.slice(3);

  const primaryStack = primaryPhotos.length ? renderStack(primaryPhotos, dir, index, PRIMARY_SIZE) : renderFutureStack(PRIMARY_SIZE);
  const extraThumbs = extraPhotos.map(renderExtraThumb).join('');

  const dotSide = flip ? 'left' : 'right';
  const justify = flip ? 'flex-end' : 'flex-start';
  const flexDir = flip ? 'row-reverse' : 'row';
  const textAlign = flip ? 'right' : 'left';

  // One cluster holds the primary fan-stack plus any extra photos as flat
  // thumbnails. Extras always start on their own line below the primary
  // stack (the flex-basis:100% break forces that regardless of viewport
  // width) — putting them beside it let the fan's open-state translateX
  // expand straight into the thumbnails and overlap them. Extras still wrap
  // sideways among themselves if there are more than fit on one line.
  const cluster = extraThumbs
    ? `<div class="story-stack-cluster" style="display:flex;flex-wrap:wrap;gap:10px;flex:none">${primaryStack}<div style="flex-basis:100%;height:0"></div><div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px">${extraThumbs}</div></div>`
    : primaryStack;

  return `
<div data-row="1" style="position:relative;display:flex;justify-content:${justify};padding-bottom:14px"><div style="position:absolute;${dotSide}:30.5%;top:50%;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;background:#f6f1e7;border:2.4px solid rgba(91,42,16,.55)"></div>
<div style="width:min(100%,540px);display:flex;flex-wrap:wrap;flex-direction:${flexDir};align-items:center;gap:22px;text-align:${textAlign}">
${cluster}
<div data-reveal="1" style="flex:1 1 190px;min-width:0"><p class="story-label" style="margin:0;font:400 60px/.9 Caveat,cursive"><span class="line-halo">${entry.label}</span></p><p class="story-text" style="margin:8px 0 0;font:300 14px/1.65 Karla,sans-serif;text-wrap:pretty"><span class="line-halo">${langSpans(entry.text)}</span></p></div>
</div>
</div>`;
}

export function renderStoryRows(): string {
  fanCounter = 0;
  return storyEntries.map((entry, i) => renderRow(entry, i)).join('');
}
