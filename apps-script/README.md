# Apps Script backend

This is the only server-side piece of the site — everything else is static
(GitHub Pages). `apps-script.gs` is versioned here for review/history, but the
live copy runs as its own Google Apps Script project.

**Live status:** deployed. `public/config/config.json`'s `appsScriptUrl`
points at the real `/exec` URL. The live project is **standalone** (not
bound to the "Hochzeit" spreadsheet — an existing project was reused rather
than creating a fresh bound one), which matters for one thing: a plain
`onOpen()` only fires automatically for a *bound* script. Standalone needs
an *installable* trigger instead — already set up on the live project via
`installOnOpenTrigger_()` (see that function's comment in `apps-script.gs`).
If this ever moves to a fresh/bound project, that step isn't needed; a plain
`onOpen()` just works there.

Guests are identified by a per-invitation token (QR link `?t=<token>`) or a
4-digit fallback code, looked up against the `Gäste` tab — see
`technical-spec.md` §1 for the full design. RSVP upserts by the matched
guest's `Einladung-ID` (merge-only, never blanks a previously-filled field);
Kuchenbuffet/Fragen/Überraschungen/Trauzeugen-Nachrichten stay append-only.
No Spotify proxy, no mail sending, no photo upload yet — later phase.

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

**Redeploying after a change:** `clasp deploy` on its own creates a *new*
deployment with a *new* URL. To update the existing one in place (so
`config.json` never goes stale), find the current deployment ID first:

```
clasp deployments
clasp deploy -i <that-deployment-id>
```

## Script properties to set (Project Settings → Script properties)

| Key | Purpose |
|---|---|
| `HOCHZEIT_SHEET_ID` | Spreadsheet ID for the main file — shared with Ruth & Max. Holds the `Gäste`, `RSVP`, `RSVP-Log`, `Kuchenbuffet`, `Fragen` tabs. |
| `HOCHZEIT_GEHEIM_SHEET_ID` | Spreadsheet ID for a **separate** file, same Google account, just not opened day-to-day. Holds `Überraschungen` and `Trauzeugen-Nachrichten` — sections the couple isn't meant to see. |

None of these values are ever shipped to the browser. Missing tabs are
created automatically (with a header row) the first time they're written to
or read from — you only need to create the two spreadsheet *files* and set
their IDs here, not pre-build every tab by hand.

## Setting up the guest list

1. Create the `Gäste` tab (or just open the spreadsheet once — the script
   creates it with headers on first request) and fill in `Name` + `Stufe`
   (`trauung`/`party`/`alles`) for each invitation. One row per
   invitation/household, not per individual guest.
2. From the spreadsheet's own menu bar: **Hochzeit → Tokens & Codes für
   neue Gäste erzeugen**. Fills `Einladung-ID`, `Token`, and `Code` for any
   row missing them — safe to re-run any time you add new rows.
3. Build each guest's QR link as `https://<site>/?t=<their-token>`, or give
   them the site URL + their 4-digit `Code` to type into the gate manually.

`E-Mail`, `Telefon`, and `RSVP-Status` on this tab fill in automatically
once a guest submits the RSVP form — no need to enter those yourself ahead
of time.
