export type Lang = 'de' | 'en' | 'sv';
export type Level = 0 | 1 | 2 | 3;

export interface Content {
  hero: {
    eyebrow: string;
    names: string;
    date: string;
    scrollHint: string;
    countdownEyebrow: string;
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
  anfahrt: { title: string; venues: Array<{ name: string; address: string; lat: number; lng: number }> };
  faqTitle: string;
  faq: Array<{ q: string; a: string }>;
  wunschliste: { title: string; intro: string; notWantedTitle: string; notWanted: string[]; wantedTitle: string; wanted: string };
  fotos: { title: string; lockedLabel: string; lockedHint: string; opensLabel: string; unlockedIntro: string };
  vogtland: {
    title: string;
    subtitle: string;
    minLevel: Level;
    entries: Array<{ title: string; place: string; distance: string; desc: string; image: string; mapQuery: string }>;
  };
  forms: {
    rsvp: {
      title: string;
      intro: string;
      sentTitle: string;
      sentBody: string;
      deadline: string;
      submitLabel: string;
      fields: Record<string, string>;
    };
    essenswahl: { title: string; minLevel: Level; fields: Record<string, string> };
    liedwunsch: { title: string; minLevel: Level; searchPlaceholder: string; fallback: string };
    ueberraschung: { title: string; minLevel: Level; intro: string };
    uebernachtung: { title: string; minLevel: Level; needLabel: string; detailsLabel: string };
    frage: { title: string; fields: Record<string, string> };
    kuchen: {
      title: string;
      intro: string;
      sentTitle: string;
      sentBody: string;
      submitLabel: string;
      towerTitle: string;
      emptyLabel: string;
      kinds: string[];
      fields: Record<string, string>;
    };
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
