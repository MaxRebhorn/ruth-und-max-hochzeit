import { readFile } from 'node:fs/promises';

export async function mail({ subject, body }) {
  if (!subject || !body) {
    console.error('Usage: wedding mail --subject "…" --body "…"');
    process.exit(1);
  }
  const config = JSON.parse(await readFile(new URL('../public/config/config.json', import.meta.url), 'utf8'));
  const cliToken = process.env.WEDDING_CLI_TOKEN;
  if (!cliToken) {
    console.error('Set WEDDING_CLI_TOKEN in your environment (must match CLI_TOKEN in Apps Script properties).');
    process.exit(1);
  }
  const url = new URL(config.appsScriptUrl);
  url.searchParams.set('action', 'mail_send');
  url.searchParams.set('subject', subject);
  url.searchParams.set('body', body);
  url.searchParams.set('cliToken', cliToken);

  const res = await fetch(url);
  const data = await res.json();
  if (!data.ok) {
    console.error('Failed:', data.error ?? res.status);
    process.exit(1);
  }
  console.log('Mail sent to all opted-in guests.');
}
