import { photosInFolder } from './photos';
import { parseEntry, byOrderPrefix, langSpans } from './entry-format';

function asset(path: string): string {
  return `${import.meta.env.BASE_URL}assets/${path}`;
}

export interface AblaufEntry {
  slug: string;
  zeit: { de: string; en: string; sv: string };
  hinweis: { de: string; en: string; sv: string };
  titel: { de: string; en: string; sv: string };
  ort: string;
  karte: string;
  link: string;
  linktext: { de: string; en: string; sv: string };
  tier: 'alle' | 'party' | 'ganzer-tag';
  body: { de: string; en: string; sv: string };
  icons: string[];
  doves: boolean;
  tanzt: boolean;
}

const mdModules = import.meta.glob<string>('./photos/ablauf/*/entry.md', { eager: true, query: '?raw', import: 'default' });

export const ablaufEntries: AblaufEntry[] = Object.entries(mdModules)
  .map(([path, raw]) => {
    const slug = path.match(/\.\/photos\/ablauf\/([^/]+)\/entry\.md$/)?.[1] ?? path;
    const { de, en, sv } = parseEntry(raw);
    const tier = (de.fields.tier as AblaufEntry['tier']) || 'alle';
    return {
      slug,
      zeit: { de: de.fields.zeit || '', en: en.fields.zeit || '', sv: sv.fields.zeit || '' },
      hinweis: { de: de.fields.hinweis || '', en: en.fields.hinweis || '', sv: sv.fields.hinweis || '' },
      titel: { de: de.fields.titel || '', en: en.fields.titel || de.fields.titel || '', sv: sv.fields.titel || de.fields.titel || '' },
      ort: de.fields.ort || '',
      karte: de.fields.karte || de.fields.ort || '',
      link: de.fields.link || '',
      linktext: { de: de.fields.linktext || 'Maps öffnen', en: en.fields.linktext || 'open in maps', sv: sv.fields.linktext || 'öppna i kartor' },
      tier,
      body: { de: de.body, en: en.body || de.body, sv: sv.body || de.body },
      icons: photosInFolder(`ablauf/${slug}`),
      doves: de.fields.doves === 'ja',
      tanzt: de.fields.tanzt === 'ja'
    };
  })
  .sort((a, b) => byOrderPrefix(a.slug, b.slug));

function renderIcons(icons: string[], alt: string, tanzt: boolean): string {
  if (!icons.length) return '';
  if (icons.length === 1) {
    return `<img src="${icons[0]}" alt="${alt}" style="width:100%;height:auto;object-fit:contain;mix-blend-mode:multiply">`;
  }
  if (tanzt) {
    // Exact mockup animation: disco ball sways, dancers bounce — kept as its
    // own case (rather than generic) so it survives folder-driven rendering.
    // The flex/column wrapper is the icon slot itself (see iconWrapAttrs),
    // matching the mockup's markup exactly (no extra nested div).
    return `<img src="${icons[0]}" alt="${alt}" style="width:78%;height:auto;display:block;animation:sway 5.5s ease-in-out infinite;transform-origin:50% 0">
<img src="${icons[1]}" alt="" style="width:90%;height:auto;display:block;margin-top:-22%;animation:dance 2.4s ease-in-out infinite;transform-origin:50% 96%">`;
  }
  // Two images, generic case: main + a smaller accent overlapping at the bottom.
  return `<div style="display:flex;flex-direction:column;align-items:center">
<img src="${icons[0]}" alt="${alt}" style="width:78%;height:auto;display:block">
<img src="${icons[1]}" alt="" style="width:90%;height:auto;display:block;margin-top:-18%">
</div>`;
}

// Exact values from the mockup's own flying-doves easter egg (kept verbatim
// so the animation timing/spread stays identical to before).
const DOVE_SPECS = [
  { dx: 62, dy: -130, dur: 2.64, delay: 0.1, size: 41, rot: -6, flap: 0.26 },
  { dx: 74, dy: -215, dur: 2.99, delay: 0.4, size: 33, rot: -12, flap: 0.3 },
  { dx: 86, dy: -95, dur: 2.42, delay: 0.62, size: 45, rot: -3, flap: 0.24 },
  { dx: 96, dy: -300, dur: 3.22, delay: 0.95, size: 30, rot: -14, flap: 0.32 },
  { dx: 70, dy: -370, dur: 2.76, delay: 1.28, size: 38, rot: -9, flap: 0.28 },
  { dx: 104, dy: -180, dur: 2.88, delay: 0.25, size: 36, rot: -8, flap: 0.27 },
  { dx: 82, dy: -425, dur: 3.33, delay: 0.78, size: 29, rot: -13, flap: 0.31 },
  { dx: 112, dy: -255, dur: 2.64, delay: 1.05, size: 43, rot: -5, flap: 0.25 },
  { dx: 58, dy: -330, dur: 3.11, delay: 1.5, size: 31, rot: -11, flap: 0.29 }
];

function renderDove(spec: (typeof DOVE_SPECS)[number]): string {
  const h = (spec.size * 0.93).toFixed(0);
  return `<div data-fly="1" style="pointer-events:auto;cursor:pointer;position:absolute;left:0px;top:0px;--dx:${spec.dx}vw;--dy:${spec.dy}px;animation:flyOut ${spec.dur}s cubic-bezier(.32,.08,.72,.5) ${spec.delay}s both;animation-play-state:paused">
<div style="animation:flapBob ${spec.flap}s ease-in-out infinite alternate">
<div style="position:relative;width:${spec.size}px;height:${h}px;transform:rotate(${spec.rot}deg)">
<img src="${asset('pigeon-a.svg')}" alt="" style="position:absolute;left:0;top:0;width:100%;animation:wingDown ${spec.flap}s steps(1,end) infinite">
<img src="${asset('pigeon-b.svg')}" alt="" style="position:absolute;left:0;top:0;width:100%;animation:wingUp ${spec.flap}s steps(1,end) infinite">
</div></div></div>`;
}

function renderDoves(): string {
  return `<div data-flock="1" aria-hidden="true" style="position:absolute;left:46%;top:calc(86% + 3px);width:0;height:0;pointer-events:none;z-index:3">${DOVE_SPECS.map(renderDove).join('')}</div>`;
}

function renderRow(entry: AblaufEntry, index: number): string {
  const flip = index % 2 === 1;
  const tierAttr = entry.tier === 'party' ? ' data-tier="party"' : entry.tier === 'ganzer-tag' ? ' data-tier="alles"' : '';
  const icon = entry.icons.length ? renderIcons(entry.icons, entry.ort, entry.tanzt) : `<div class="raw-photo raw-photo-placeholder" style="aspect-ratio:1;width:100%">noch kein Bild</div>`;
  const iconWidth = entry.tanzt ? 'min(196px,42%)' : 'min(180px,34%)';
  const iconWrapAttrs = entry.doves ? ` data-doves-trigger style="position:relative;flex:none;width:${iconWidth};cursor:pointer"` : ` style="flex:none;width:${iconWidth}${entry.tanzt ? ';display:flex;flex-direction:column;align-items:center' : ''}"`;
  const iconBlock = `<div${iconWrapAttrs}>${icon}${entry.doves ? renderDoves() : ''}</div>`;

  const linkHref = entry.link || (entry.karte ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entry.karte)}` : '');
  const linkAttrs = entry.link ? '' : ' target="_blank" rel="noreferrer"';
  const linkHtml = linkHref
    ? `<a href="${linkHref}"${linkAttrs} style="display:inline-block;margin-top:6px;font:500 11px/1 Karla,sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:13px 6px 4px;margin:-13px -6px -2px;border-bottom:1.5px solid rgba(168,86,47,.5)">${langSpans(entry.linktext.de, entry.linktext.en, entry.linktext.sv)}</a>`
    : '';

  // Items with a time show it big (34px script) + title small (15px sans);
  // items without one (arrival, cake table) show the title itself big
  // instead — matches the mockup's own two title treatments exactly.
  const headline = entry.zeit.de
    ? `<p style="margin:0;font:400 34px/1 Caveat,cursive">${langSpans(entry.zeit.de, entry.zeit.en, entry.zeit.sv)}</p>
<p style="margin:4px 0 0;font:400 15px/1.35 Karla,sans-serif">${langSpans(entry.titel.de, entry.titel.en, entry.titel.sv)}</p>`
    : `<p style="margin:0;font:400 clamp(24px,6vw,32px)/1.05 Caveat,cursive">${langSpans(entry.titel.de, entry.titel.en, entry.titel.sv)}</p>`;

  return `
<div data-reveal="1"${tierAttr} style="position:relative;display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start${flip ? ';flex-direction:row-reverse' : ''}">
${iconBlock}
<div style="flex:1 1 150px;min-width:0;padding-top:4px${flip ? ';text-align:right' : ''}">
${headline}
${entry.hinweis.de ? `<p style="margin:4px 0 0;font:400 11px/1.5 ui-monospace,Menlo,monospace;color:#a8562f;background:rgba(243,220,147,.4);padding:3px 6px;display:inline-block">${langSpans(entry.hinweis.de, entry.hinweis.en, entry.hinweis.sv)}</p>` : ''}
${entry.ort ? `<p style="margin:2px 0 0;font:300 13px/1.5 Karla,sans-serif;opacity:.7">${entry.ort}</p>` : ''}
${entry.body.de ? `<p style="margin:6px 0 0;font:300 13px/1.55 Karla,sans-serif;opacity:.7">${langSpans(entry.body.de, entry.body.en, entry.body.sv)}</p>` : ''}
${linkHtml}
</div>
</div>`;
}

export function renderAblaufRows(): string {
  return ablaufEntries.map(renderRow).join('');
}
