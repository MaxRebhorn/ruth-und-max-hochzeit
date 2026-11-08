import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { addGuests, newGuestCode } from './generate-qr.mjs';

const STUFEN = ['trauung', 'party', 'alles'];

/**
 * Imports the guest list into the Gäste tab, one invitation per envelope.
 *
 * CSV (`;`-separated), one row per person, header `Umschlag;Name;Stufe;Notiz`:
 * - The first person of an envelope gets the invitation (token + 6-character code).
 * - Everyone else in the same envelope is linked to that person ('Gehört zu') and shows up
 *   on the same card and in the RSVP, without an own code.
 * - Stufe: trauung | party (Trauung + Party) | alles (ganzer Tag). Notiz lands in 'Notizen'.
 *
 * Writes only new rows; it never deletes. Use --dry true to check the result first.
 */
export async function importGuests({ csv, dry }) {
  if (!csv) {
    console.error('Usage: wedding import-guests --csv <liste.csv> [--dry true]   (Spalten: Umschlag;Name;Stufe;Notiz)');
    process.exit(1);
  }
  const [header, ...lines] = (await readFile(csv, 'utf8'))
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((l) => l.replace(/;/g, '').trim())
    .map((l) => l.split(';').map((c) => c.trim()));
  const col = (n) => header.findIndex((h) => h.toLowerCase() === n.toLowerCase());
  const [iEnv, iName, iStufe, iNotiz] = ['Umschlag', 'Name', 'Stufe', 'Notiz'].map(col);
  if ([iEnv, iName, iStufe].includes(-1)) throw new Error('Spalten Umschlag, Name und Stufe müssen da sein.');

  const mainByEnv = new Map();
  const errors = [];
  const guests = lines.map((r, i) => {
    const env = r[iEnv];
    const name = r[iName].replace(/\s+/g, ' ');
    const stufe = r[iStufe].toLowerCase();
    const notiz = iNotiz === -1 ? '' : r[iNotiz] ?? '';
    if (!env || !name) errors.push(`Zeile ${i + 2}: Umschlag und Name dürfen nicht leer sein`);
    if (!STUFEN.includes(stufe)) errors.push(`Zeile ${i + 2}: Stufe "${r[iStufe]}" ist nicht trauung, party oder alles`);
    const main = mainByEnv.get(env);
    if (!main) {
      mainByEnv.set(env, name);
      return { env, name, stufe, notiz, token: randomUUID(), code: newGuestCode() };
    }
    return { env, name, stufe, notiz, zuName: main };
  });
  // Linking goes by name, so a main guest's name must be unique in the list.
  const mains = [...mainByEnv.values()];
  mains.filter((n, i) => mains.indexOf(n) !== i).forEach((n) => errors.push(`Name "${n}" ist mehrfach Hauptgast, bitte eindeutig machen`));
  if (errors.length) {
    errors.forEach((e) => console.error(e));
    process.exit(1);
  }

  if (dry) {
    for (const [env, main] of mainByEnv) {
      const g = guests.find((x) => x.name === main && x.env === env);
      const mit = guests.filter((x) => x.zuName === main).map((x) => x.name);
      console.log(`${env.padStart(3)}  ${g.stufe.padEnd(7)} ${g.code}  ${main}${mit.length ? ' + ' + mit.join(', ') : ''}${g.notiz ? `   [${g.notiz}]` : ''}`);
    }
    return console.log(`\n${mainByEnv.size} Einladungen, ${guests.length} Personen (Probelauf, nichts geschrieben).`);
  }
  if (!(await addGuests(guests))) process.exit(1);
  console.log(`${mainByEnv.size} Einladungen mit ${guests.length} Personen im Sheet angelegt.`);
}
