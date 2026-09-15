import { parseLangFields, type LangFields } from './entry-format';
import type { Values } from './dc-engine';

import ueberraschungRaw from './content/ueberraschung.md?raw';
import frageStellenRaw from './content/frage-stellen.md?raw';
import trauzeugenRaw from './content/trauzeugen.md?raw';

/** Flattens a parsed field set into `{{ prefix_key_de/en/sv }}` values, matching the placeholders in body.raw.html. */
function flatten(prefix: string, lf: LangFields): Values {
  const out: Values = {};
  for (const key of Object.keys(lf.de)) {
    out[`${prefix}_${key}_de`] = lf.de[key];
    out[`${prefix}_${key}_en`] = lf.en[key] ?? lf.de[key];
    out[`${prefix}_${key}_sv`] = lf.sv[key] ?? lf.de[key];
  }
  return out;
}

/**
 * Editable copy for the Überraschung / Frage-stellen / die-Trauzeugen
 * sections, sourced from `src/content/*.md` instead of being hardcoded in
 * body.raw.html — same "content mechanic" as the FAQ/blacklist markdown
 * files, just for one-off UI labels instead of repeatable list entries.
 * Merged into buildInitialValues() and resolved once at boot via `{{ }}`.
 */
export const sectionContentValues: Values = {
  ...flatten('ueb', parseLangFields(ueberraschungRaw)),
  ...flatten('ask', parseLangFields(frageStellenRaw)),
  ...flatten('wz', parseLangFields(trauzeugenRaw))
};
