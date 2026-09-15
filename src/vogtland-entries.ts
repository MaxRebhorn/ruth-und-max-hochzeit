import { photosInFolder } from './photos';
import { parseEntry, byOrderPrefix, langSpans } from './entry-format';

export interface VogtlandEntry {
  slug: string;
  titel: { de: string; en: string; sv: string };
  ort: string;
  distanz: { de: string; en: string; sv: string };
  karte: string;
  body: { de: string; en: string; sv: string };
  photo: string | null;
}

const mdModules = import.meta.glob<string>('./photos/vogtland-guide/*/entry.md', { eager: true, query: '?raw', import: 'default' });

export const vogtlandEntries: VogtlandEntry[] = Object.entries(mdModules)
  .map(([path, raw]) => {
    const slug = path.match(/\.\/photos\/vogtland-guide\/([^/]+)\/entry\.md$/)?.[1] ?? path;
    const { de, en, sv } = parseEntry(raw);
    const photos = photosInFolder(`vogtland-guide/${slug}`);
    return {
      slug,
      titel: { de: de.fields.titel || '', en: en.fields.titel || de.fields.titel || '', sv: sv.fields.titel || de.fields.titel || '' },
      ort: de.fields.ort || '',
      distanz: { de: de.fields.distanz || '', en: en.fields.distanz || de.fields.distanz || '', sv: sv.fields.distanz || de.fields.distanz || '' },
      karte: de.fields.karte || de.fields.ort || '',
      body: { de: de.body, en: en.body || de.body, sv: sv.body || de.body },
      photo: photos[0] ?? null
    };
  })
  .sort((a, b) => byOrderPrefix(a.slug, b.slug));

const ROTATIONS = [-2.6, 2.2, -1.4, 2.8, -2, 1.6, -1.8, 2.4];

function renderCard(entry: VogtlandEntry, index: number): string {
  const letter = String.fromCharCode(65 + index); // A, B, C, ...
  const rotate = ROTATIONS[index % ROTATIONS.length];
  const translateY = (index % 3) * 6;
  const photoHtml = entry.photo
    ? `<img src="${entry.photo}" alt="${entry.ort}" style="width:100%;height:100%;object-fit:cover">`
    : `<div class="raw-photo-placeholder" style="width:100%;height:100%">noch kein Bild</div>`;
  const mapsLink = entry.karte
    ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entry.karte)}" target="_blank" rel="noreferrer" style="display:inline-block;margin-top:8px;font:500 10.5px/1 Karla,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#a8562f;border-bottom:1.5px solid rgba(168,86,47,.5);padding:13px 6px 4px;margin:-13px -6px -2px;text-decoration:none">${langSpans('Route', 'route', 'vägen')}</a>`
    : '';

  return `
<div data-post="1" data-active="0" style="position:relative;box-sizing:border-box;flex:0 1 246px;max-width:270px;padding:11px 12px 12px;background:#fffdf8;border:1px solid rgba(91,42,16,.2);box-shadow:0 3px 11px rgba(91,42,16,.12);transform:rotate(${rotate}deg) translateY(${translateY}px)">
<div style="position:absolute;top:9px;right:10px;width:30px;height:36px;border:1px dashed rgba(91,42,16,.3);background:rgba(243,220,147,.3);display:flex;align-items:center;justify-content:center;font:400 17px/1 Caveat,cursive;color:rgba(91,42,16,.55);transform:rotate(3deg);z-index:2">${letter}</div>
<div style="height:132px;border:1px solid rgba(91,42,16,.14);background:#fdf8ee">${photoHtml}</div>
<p style="margin:10px 0 2px;font:400 25px/1.15 Caveat,cursive;color:#a8562f">${langSpans(entry.titel.de, entry.titel.en, entry.titel.sv)}</p>
<p style="margin:4px 0 0;font:500 14px/1.3 Karla,sans-serif">${entry.ort}</p>
<p style="margin:3px 0 0;font:300 12px/1.5 Karla,sans-serif;opacity:.7">${langSpans(entry.distanz.de, entry.distanz.en, entry.distanz.sv)}</p>
<div data-postdetail="1"><div style="padding-top:9px;border-top:1px solid rgba(91,42,16,.14);margin-top:9px"><p style="margin:0;font:300 12.5px/1.6 Karla,sans-serif;opacity:.8;text-wrap:pretty">${langSpans(entry.body.de, entry.body.en, entry.body.sv)}</p>${mapsLink}</div></div>
<button type="button" data-post-toggle style="margin-top:9px;width:100%;border:none;border-top:1px dashed rgba(91,42,16,.25);background:transparent;cursor:pointer;padding:7px 0 0;font:400 19px/1 Caveat,cursive;color:rgba(91,42,16,.62);display:flex;align-items:center;justify-content:center;gap:7px"><span data-postoc="open">${langSpans('mehr', 'more', 'mer')}</span><span data-postoc="close">${langSpans('zu', 'close', 'stäng')}</span><span data-postchev="1" style="font-size:22px;line-height:.7">&#8250;</span></button>
</div>`;
}

export function renderVogtlandCards(): string {
  return vogtlandEntries.map(renderCard).join('');
}
