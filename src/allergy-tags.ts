/**
 * Free-text food/allergy answers → standardized tags. The tag `id` (German) is
 * what lands in the sheet's `Tags` column, so counting is a plain text match.
 * Add a line here to teach it a new keyword; misspellings go into the regex.
 */
const TAGS: { id: string; en: string; re: RegExp }[] = [
  { id: 'vegan', en: 'vegan', re: /vegan/ },
  { id: 'vegetarisch', en: 'vegetarian', re: /veg(e|i)tari|veggie|vegi\b|kein fleisch|ohne fleisch|vegetarian/ },
  { id: 'glutenfrei', en: 'gluten-free', re: /gluten|zöliak|zoeliak|zeliak|celiac|coeliac/ },
  { id: 'laktosefrei', en: 'lactose-free', re: /laktos|lactos|milchzucker/ },
  { id: 'Milchallergie', en: 'dairy allergy', re: /\bmilch\b|milchallerg|milcheiwei|milchprodukt|kuhmilch|dairy|\bmilk\b|kein(e)? milch/ },
  { id: 'Erdnussallergie', en: 'peanut allergy', re: /erd\s?nu(ss|ß|ss?e|es)|erdnüs|erdnues|peanut|arachis/ },
  { id: 'Nussallergie', en: 'nut allergy', re: /(?<!erd|pea)(nuss|nuß|nüss|nuess|nuts?\b)|mandel|walnu|haselnu|cashew|pistazi|pekan|macadamia|almond/ },
  { id: 'Eiallergie', en: 'egg allergy', re: /\bei(er)?\b|hühnerei|eiallerg|egg/ },
  { id: 'Fischallergie', en: 'fish allergy', re: /fisch|lachs|thunfisch|\bfish\b|salmon|tuna/ },
  { id: 'Schalentierallergie', en: 'shellfish allergy', re: /meeresfr|schalentier|krebs|garnele|shrimp|shellfish|muschel|krustentier/ },
  { id: 'Sojaallergie', en: 'soy allergy', re: /soja|soy/ },
  { id: 'Sesamallergie', en: 'sesame allergy', re: /sesam/ },
  { id: 'Selleriallergie', en: 'celery allergy', re: /sellerie|celery/ },
  { id: 'Senfallergie', en: 'mustard allergy', re: /senf|mustard/ },
  { id: 'kein Schwein', en: 'no pork', re: /kein\s?e?s? schwein|ohne schwein|no pork|halal|koscher|kosher/ },
  { id: 'Kind', en: 'child', re: /\bkind|kinder|child|kids?\b|kindermenü/ }
];

const norm = (s: string): string => s.toLowerCase().normalize('NFC');
/** Umlauts folded so "nu" finds "Nussallergie" and "fru" finds "Früchte…". */
const fold = (s: string): string => norm(s).replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss');

export function tagsFor(text: string): string[] {
  const t = norm(text);
  return TAGS.filter((x) => x.re.test(t)).map((x) => x.id);
}

export function tagLabel(id: string, lang: string): string {
  return lang === 'en' ? (TAGS.find((x) => x.id === id)?.en ?? id) : id;
}

/**
 * Tags whose name (either language, umlauts folded) starts with what the guest is typing, or whose keywords
 * match it. Unlike `tagsFor`, a tag the text only matches loosely ("Nüsse") is still offered so it can be
 * swapped for the standard word; only tags already written out in full are skipped.
 */
export function suggestTags(fragment: string, fullText: string): string[] {
  const f = fold(fragment).trim();
  if (f.length < 2) return [];
  const written = fold(fullText);
  return TAGS.filter((x) => !written.includes(fold(x.id)) && !written.includes(x.en) && (fold(x.id).startsWith(f) || x.en.startsWith(f) || x.re.test(norm(fragment)))).map((x) => x.id);
}
