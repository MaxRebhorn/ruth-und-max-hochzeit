#!/usr/bin/env node
import { qr } from './qr.mjs';

const [, , command, ...rest] = process.argv;

const commands = { qr };

if (!command || !(command in commands)) {
  console.error(`Usage: wedding <command> [options]\n\nCommands:\n  qr --tier trauung|party|alles --out <file.png>`);
  process.exit(1);
}

await commands[command](parseArgs(rest));

/** Minimal `--flag value` parser — no dependency needed for one command. */
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.replace(/^--/, '');
    out[key] = argv[i + 1];
  }
  return out;
}
