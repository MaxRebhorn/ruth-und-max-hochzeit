# Apps Script backend

This is the only server-side piece of the site — everything else is static
(GitHub Pages). `apps-script.gs` is versioned here for review/history, but the
live copy runs as its own Google Apps Script project.

## Deploy (manual, one-time setup + whenever `apps-script.gs` changes)

```
npm install -g @google/clasp
clasp login
cd apps-script
clasp create --type webapp --title "Ruth & Max Hochzeit" --rootDir .
clasp push
clasp deploy
```

`clasp deploy` prints the `/exec` URL — put it in `config/config.json` as
`appsScriptUrl`.

## Script properties to set (Project Settings → Script properties)

| Key | Purpose |
|---|---|
| `RSVP_SHEET_ID` | Spreadsheet ID for the RSVP sheet (rsvp/essen/lied/uebernachtung upserts) |
| `SURPRISE_SHEET_ID` | Spreadsheet ID for the Überraschungen sheet (Trauzeugen-only) |
| `FRAGEN_SHEET_ID` | Spreadsheet ID for the Fragen sheet |
| `GUESTS_SHEET_ID` | Spreadsheet ID for the Gäste sheet (Name, E-Mail, Stufe) |
| `KUCHEN_SHEET_ID` | Spreadsheet ID for the Kuchen sheet |
| `DRIVE_FOTOS_FOLDER_ID` | Google Drive folder for guest photo uploads |
| `WEDDING_DATE_ISO` | e.g. `2027-08-07T11:00:00` — gates the photo-upload endpoint server-side |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Client-credentials flow for the Liedwunsch search proxy |
| `CLI_TOKEN` | Shared secret the `wedding mail` CLI command must send |
| `COUPLE_EMAIL` | Where "Frage stellen" notifications go |

None of these values are ever shipped to the browser.
