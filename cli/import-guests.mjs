import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { addGuests } from './generate-qr.mjs';

/**
 * Imports the planner's guest-list CSV (`;`-separated, columns Name + Gruppe)
 * into the Gäste tab. Gruppe "Kommen nur zur Trauung" → trauung, everyone
 * else → alles. Use --dry to preview without writing.
 */
export async function importGuests({ csv, dry, extra }) {
  if (!csv) {
    console.error('Usage: wedding import-guests --csv <liste.csv> [--dry true] [--extra "Test (temporär)"]');
    process.exit(1);
  }
  const [header, ...lines] = (await readFile(csv, 'utf8')).replace(/^﻿/, '').split(/\r?\n/).filter(Boolean).map((l) => l.split(';'));
  const nameIdx = header.indexOf('Name');
  const groupIdx = header.indexOf('Gruppe');
  const codes = new Set();
  const newCode = () => {
    let c;
    do c = String(Math.floor(1000 + Math.random() * 9000));
    while (codes.has(c));
    codes.add(c);
    return c;
  };
  const guests = lines.map((r) => {
    let name = r[nameIdx].replace(/\s+/g, ' ').trim();
    // "Markus (Begleitung von Damaris Schumann)" → linked row, no own QR.
    const m = name.match(/^(.*?) \(Begleitung von (.*)\)$/);
    if (m) name = m[1].trim();
    return {
      name,
      zuName: m?.[2].trim(),
      stufe: r[groupIdx].trim() === 'Kommen nur zur Trauung' ? 'trauung' : 'alles',
      token: m ? '' : randomUUID(),
      code: m ? '' : newCode()
    };
  });
  if (extra) guests.push({ name: extra, stufe: 'alles', token: randomUUID(), code: newCode() });

  if (dry) {
    guests.forEach((g) => console.log(`${g.stufe.padEnd(8)} ${g.code || '----'} ${g.name}${g.zuName ? '  → ' + g.zuName : ''}`));
    return console.log(`\n${guests.length} Gäste (Dry run, nichts geschrieben).`);
  }
  if (!(await addGuests(guests))) process.exit(1);
  console.log(`${guests.length} Gäste im Sheet angelegt.`);
}
