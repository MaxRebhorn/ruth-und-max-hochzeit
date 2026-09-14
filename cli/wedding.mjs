#!/usr/bin/env node
import { qr } from './qr.mjs';
import { mail } from './mail.mjs';

const [, , command, ...rest] = process.argv;

const commands = { qr, mail };

if (!command || !(command in commands)) {
  console.error(`Usage: wedding <command> [options]\n\nCommands:\n  qr --level <0-3> --out <file.png>\n  mail --subject "…" --body "…"`);
  process.exit(1);
}

await commands[command](parseArgs(rest));

/** Minimal `--flag value` parser — no dependency needed for two commands. */
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    out[key] = argv[i + 1];
  }
  return out;
}
