#!/usr/bin/env node
import { qr } from './qr.mjs';
import { qrBatch } from './qr-batch.mjs';
import { generateQr } from './generate-qr.mjs';
import { importGuests } from './import-guests.mjs';

const [, , command, ...rest] = process.argv;

const commands = { qr, 'qr-batch': qrBatch, 'generate-qr': generateQr, 'import-guests': importGuests };

if (!command || !(command in commands)) {
  console.error(
    `Usage: wedding <command> [options]\n\nCommands:\n` +
      `  qr --token <einladungs-token> --out <file.png>\n` +
      `  qr-batch --csv <gaeste-export.csv> [--outDir qr]\n` +
      `  import-guests --csv <liste.csv> [--dry true] [--extra <Name>]\n` +
      `  generate-qr <Name> <1|2|3> [--base <url>]   (1=trauung, 2=+party, 3=+alles)`
  );
  process.exit(1);
}

await commands[command](parseArgs(rest));

/** `--flag value` pairs plus bare positional args (collected under `_`) — no dependency needed for a CLI this small. */
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (tok.startsWith('--')) {
      out[tok.slice(2)] = argv[++i];
    } else {
      out._.push(tok);
    }
  }
  return out;
}
