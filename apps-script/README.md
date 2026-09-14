# Apps Script backend

This is the only server-side piece of the site — everything else is static
(GitHub Pages). `apps-script.gs` is versioned here for review/history, but the
live copy runs as its own Google Apps Script project.

Current pass is intentionally minimal: RSVP + Kuchenbuffet only, append-only
(no per-guest upsert — the RSVP form has no email field). No guest lookup, no
Spotify proxy, no mail sending, no photo upload — those belong to a later
phase that layers `technical-spec.md`'s fuller feature set on top.

## Deploy (manual, one-time setup + whenever `apps-script.gs` changes)

```
npm install -g @google/clasp
clasp login
cd apps-script
clasp create --type webapp --title "Ruth & Max Hochzeit" --rootDir .
clasp push
clasp deploy
```

`clasp deploy` prints the `/exec` URL — put it in `public/config/config.json`
as `appsScriptUrl`.

## Script properties to set (Project Settings → Script properties)

| Key | Purpose |
|---|---|
| `RSVP_SHEET_ID` | Spreadsheet ID for the RSVP sheet (append-only rows) |
| `KUCHEN_SHEET_ID` | Spreadsheet ID for the Kuchen sheet |

None of these values are ever shipped to the browser.
