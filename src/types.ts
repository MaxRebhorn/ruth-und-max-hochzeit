export type Lang = 'de' | 'en' | 'sv';
export type Level = 0 | 1 | 2 | 3;

export interface Content {
  hero: {
    eyebrow: string;
    names: string;
    date: string;
    scrollHint: string;
    countdownLabels: { days: string; hours: string; minutes: string; seconds: string };
  };
  gate: {
    title: string;
    dateLabel: string;
    intro: string;
    codePlaceholder: string;
    submitLabel: string;
    notFoundError: string;
    nameLabel: string;
    emailLabel: string;
    loadingLabel: string;
    networkError: string;
  };
  envelope: { tapHint: string; replayLabel: string };
  nav: Record<string, string>;
  story: Array<{ year: string; text: string; photos: string[] }>;
  ablauf: Array<{ time: string; title: string; place?: string; mapQuery?: string; minLevel: Level }>;
  anfahrt: { venues: Array<{ name: string; address: string; lat: number; lng: number }> };
  faq: Array<{ q: string; a: string }>;
  wunschliste: { notWanted: string[]; wanted: string };
  vogtland: Array<{ title: string; place: string; distance: string; desc: string; image: string; mapQuery: string }>;
  forms: {
    rsvp: { title: string; fields: Record<string, string> };
    essenswahl: { title: string; fields: Record<string, string> };
    liedwunsch: { title: string; searchPlaceholder: string; fallback: string };
    ueberraschung: { title: string; intro: string };
    uebernachtung: { title: string; needLabel: string };
    frage: { title: string };
    kuchen: { title: string; intro: string; kinds: string[] };
  };
}

export interface Config {
  levelTokens: Record<string, string>;
  appsScriptUrl: string;
  siteUrl: string;
}

export interface AppContext {
  content: Content;
  config: Config;
  lang: Lang;
  level: Level | null;
}
