# Ruth & Max — Hochzeitswebsite

Static site (Vite + TypeScript, no UI framework), hosted on GitHub Pages.
Google Apps Script + Google Sheets is the only backend. See
`technical-spec.md` for the full feature spec and
`/home/mrebhorn/.claude/plans/fancy-puzzling-deer.md` (or ask Claude) for the
implementation plan this repo follows.

## Develop

```
npm install
npm run dev
```

By default the app runs against mock API responses (see `src/api.ts`) so the
UI is clickable without a live Apps Script deployment. Set
`VITE_API_MODE=live` to hit the real `appsScriptUrl` from `config/config.json`
during development.

## Build & deploy

`npm run build` outputs to `dist/`. Pushing to `main` builds and deploys to
GitHub Pages automatically via `.github/workflows/deploy.yml`.

The Apps Script backend deploys separately — see `apps-script/README.md`.

## Content & config

- `public/content/content.json` (+ `.en.json` / `.sv.json`) — all page copy.
  DE is the source language; translations only need to include the keys that
  differ, everything else falls back to DE. Lives under `public/` (not the
  repo root) so Vite copies it into `dist/` as a static, fetchable file.
- `public/config/config.json` — guest-level tokens, the Apps Script exec URL,
  and the site URL used for QR generation. Replace the `CHANGE-ME`
  placeholders before going live.

## Design sync

`design/wedding-website-ui-mockups/` is a reference-only snapshot of the
Claude Design handoff bundle — never deployed. When new changes are made in
Claude Design, re-export the bundle over this folder and `git diff` it to see
exactly what changed, then port that into `content/` and `src/`.

## CLI

```
npm run wedding -- qr --level 2 --out qr_stufe2.png
WEDDING_CLI_TOKEN=... npm run wedding -- mail --subject "…" --body "…"
```
