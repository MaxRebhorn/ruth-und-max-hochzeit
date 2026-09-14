import type { Content, Lang } from './types';
import { emit } from './bus';

const LANG_KEY = 'rm-lang';
const SUPPORTED: Lang[] = ['de', 'en', 'sv'];

let current: Lang = 'de';
let deContent: Content | null = null;

function isLang(v: string | null): v is Lang {
  return !!v && (SUPPORTED as string[]).includes(v);
}

export function initialLang(): Lang {
  const url = new URLSearchParams(location.search).get('lang');
  if (isLang(url)) return url;
  const stored = localStorage.getItem(LANG_KEY);
  if (isLang(stored)) return stored;
  return 'de';
}

/**
 * Fetches content.<lang>.json, falling back key-by-key to the DE source
 * content for anything missing — mirrors the mockup's DE->SV fallback,
 * generalized to any language.
 */
export async function loadI18n(lang: Lang): Promise<Content> {
  if (!deContent) {
    deContent = (await fetch(`${import.meta.env.BASE_URL}content/content.json`).then((r) => r.json())) as Content;
  }
  if (lang === 'de') {
    current = lang;
    return deContent;
  }
  const res = await fetch(`${import.meta.env.BASE_URL}content/content.${lang}.json`);
  const translated = (res.ok ? await res.json() : {}) as Partial<Content>;
  current = lang;
  return deepMerge(deContent, translated) as Content;
}

export function setLang(lang: Lang): void {
  localStorage.setItem(LANG_KEY, lang);
  current = lang;
  emit('lang:changed');
}

export function getLang(): Lang {
  return current;
}

function deepMerge<T>(base: T, patch: Partial<T>): T {
  if (Array.isArray(base)) {
    // Merge index-by-index so a translation file can carry only the
    // text fields for each entry (e.g. `title`) while non-text fields
    // (`mapQuery`, `minLevel`, `photos`, ...) fall back to the DE source.
    if (!Array.isArray(patch)) return base as unknown as T;
    const patchArr = patch as unknown[];
    return (base as unknown[]).map((item, i) => (i < patchArr.length ? deepMerge(item, patchArr[i] as never) : item)) as unknown as T;
  }
  if (base && typeof base === 'object') {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    for (const key of Object.keys(patch ?? {})) {
      const patchVal = (patch as Record<string, unknown>)[key];
      const baseVal = (base as Record<string, unknown>)[key];
      out[key] = patchVal !== undefined ? deepMerge(baseVal, patchVal as never) : baseVal;
    }
    return out as T;
  }
  return (patch as T) ?? base;
}
