/**
 * Minimal runtime for the literal HTML transcribed from the Claude Design
 * mockup (`*.raw.html` files) — just enough of its `{{ }}` / `<sc-if>` /
 * `<sc-for>` template syntax to reuse the mockup's markup verbatim instead
 * of hand-re-deriving styles (which kept drifting from the real design).
 */

export type Values = Record<string, unknown>;

/** `<image-slot id="x" src="..." shape="rect" placeholder="Foto 2019">...</image-slot>` -> real <img> or a placeholder box. */
function resolveImageSlots(html: string): string {
  return html.replace(/<image-slot([^>]*)>\s*<\/image-slot>/g, (_m, attrs: string) => {
    const get = (name: string) => attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1];
    const id = get('id') ?? '';
    const src = get('src');
    const shape = get('shape') ?? 'rect';
    const placeholder = get('placeholder') ?? '';
    if (src) return `<img src="${src}" alt="${placeholder}" class="raw-photo" data-shape="${shape}" data-slot-id="${id}" loading="lazy">`;
    return `<div class="raw-photo raw-photo-placeholder" data-shape="${shape}" data-slot-id="${id}">${placeholder}</div>`;
  });
}

/** `onClick="{{ handler }}"` / `onSubmit="{{ handler }}"` -> `data-onclick="handler"` so we can wire real listeners after insert. */
function resolveEventBindings(html: string): string {
  return html
    .replace(/onClick="\{\{\s*(\w+)\s*\}\}"/g, 'data-onclick="$1"')
    .replace(/onSubmit="\{\{\s*(\w+)\s*\}\}"/g, 'data-onsubmit="$1"');
}

/**
 * `<sc-if value="{{ flag }}" ...>...</sc-if>` -> always rendered, wrapped in a
 * `[data-if="flag"]` element whose initial display reflects the boolean.
 * Kept in the DOM (not stripped) so later state changes are a plain
 * `setConditional()` visibility toggle instead of a full re-render — a full
 * re-render would blow away scroll-reveal state, in-flight CSS transitions,
 * and IntersectionObserver targets elsewhere on the page. Not nested here.
 */
function resolveIf(html: string, values: Values): string {
  return html.replace(
    /<sc-if value="\{\{\s*(\w+)\s*\}\}"[^>]*>([\s\S]*?)<\/sc-if>/g,
    (_m, key: string, inner: string) => `<div data-if="${key}" style="display:${values[key] ? '' : 'none'}">${inner}</div>`
  );
}

/** Toggles the visibility of every `[data-if="key"]` element without touching the rest of the DOM. */
export function setConditional(root: ParentNode, key: string, value: boolean): void {
  root.querySelectorAll<HTMLElement>(`[data-if="${key}"]`).forEach((el) => (el.style.display = value ? '' : 'none'));
}

/** `<sc-for list="{{ listKey }}" as="l" ...>...{{ l.field }}...</sc-for>` -> concatenated rows. Only one loop exists in this doc. */
function resolveFor(html: string, values: Values): string {
  return html.replace(/<sc-for list="\{\{\s*(\w+)\s*\}\}" as="(\w+)"[^>]*>([\s\S]*?)<\/sc-for>/g, (_m, listKey: string, as: string, inner: string) => {
    const list = (values[listKey] as Values[]) ?? [];
    return list
      .map((item) => inner.replace(new RegExp(`\\{\\{\\s*${as}\\.(\\w+)\\s*\\}\\}`, 'g'), (_mm, field: string) => String(item[field] ?? '')))
      .join('');
  });
}

/** Plain `{{ identifier }}` interpolation in text/attributes. */
function resolveInterpolation(html: string, values: Values): string {
  return html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => {
    const v = values[key];
    return v === undefined || v === null ? '' : String(v);
  });
}

export function render(rawHtml: string, values: Values): string {
  let html = rawHtml;
  html = resolveFor(html, values);
  html = resolveIf(html, values);
  html = resolveEventBindings(html);
  html = resolveImageSlots(html);
  html = resolveInterpolation(html, values);
  return html;
}

/** Wires data-onclick/data-onsubmit attributes to real handlers from `values` after the HTML has been inserted. */
export function bindEvents(root: HTMLElement, values: Values): void {
  root.querySelectorAll<HTMLElement>('[data-onclick]').forEach((el) => {
    const name = el.dataset.onclick!;
    const handler = values[name];
    if (typeof handler === 'function') el.addEventListener('click', handler as EventListener);
  });
  root.querySelectorAll<HTMLFormElement>('[data-onsubmit]').forEach((el) => {
    const name = el.dataset.onsubmit!;
    const handler = values[name];
    if (typeof handler === 'function') el.addEventListener('submit', handler as EventListener);
  });
}

/** Mirrors the mockup's applyLang(): toggles [data-de]/[data-en]/[data-sv] spans, SV falling back to DE where missing. */
export function applyLang(root: ParentNode, lang: 'de' | 'en' | 'sv'): void {
  root.querySelectorAll<HTMLElement>('[data-en]').forEach((e) => (e.style.display = lang === 'en' ? '' : 'none'));
  root.querySelectorAll<HTMLElement>('[data-sv]').forEach((e) => (e.style.display = lang === 'sv' ? '' : 'none'));
  root.querySelectorAll<HTMLElement>('[data-de]').forEach((e) => {
    const hasSv = e.parentElement && e.parentElement.querySelector(':scope > [data-sv]');
    e.style.display = lang === 'de' || (lang === 'sv' && !hasSv) ? '' : 'none';
  });
}
