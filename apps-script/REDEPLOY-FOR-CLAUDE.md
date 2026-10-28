# Aufgabe: Apps Script neu deployen

Für einen Browser-Claude (Claude in Chrome / computer use), eingeloggt im
Google-Account von Max/Ruth. Ziel: die neue Version live schalten, ohne die
`/exec`-URL zu ändern (sonst zeigt `public/config/config.json` ins Leere).

**Was neu ist (Stand 28.10.2026):**

- Alle Formulare (RSVP, Kuchen, Fragen, Überraschungen, Trauzeugen) und die
  Kuchenliste brauchen jetzt einen gültigen Einladungs-Token. Pro Token sind
  höchstens 30 Einträge in 10 Minuten möglich.
- Die Kuchenliste gibt nur noch Name, Beitrag, Stücke und Art zurück.
- Neue Codes haben 6 Zeichen (Buchstaben und Ziffern) statt 4 Ziffern.
- Die öffentliche QR-Seite `/qr/` und die Aktion `guest_list` sind weg.
  Neu: Menü **Hochzeit → QR-Codes anzeigen** im Sheet (Datei `qr-dialog.html`).
- Fehlermeldungen geben keine internen Details mehr zurück.

Live-Links stehen in `apps-script/LINKS.md`:

- Apps Script Projekt „WeddingScript": https://script.google.com/home (Projekt
  ist **standalone**, taucht NICHT über „Erweiterungen → Apps Script" der
  Sheets auf, über die Projektliste öffnen).
- Spreadsheet „Hochzeit": siehe `LINKS.md`.

## Schritt 1: Code ersetzen

1. Projekt „WeddingScript" öffnen.
2. Kompletten Inhalt von `Code.gs` (bzw. der Datei mit dem Code) löschen und
   durch den Inhalt von `apps-script/apps-script.gs` aus dem Repo ersetzen.
   1:1 einfügen, nicht umschreiben oder kürzen.
3. Links bei **Dateien** auf **+** → **HTML** klicken. Name genau
   `qr-dialog` (ohne `.html`, das hängt der Editor selbst an). Inhalt komplett
   durch `apps-script/qr-dialog.html` aus dem Repo ersetzen.
4. Speichern (Strg/Cmd+S).

## Schritt 2: Script-Properties

Zahnrad links → **Projekteinstellungen** → **Script-Properties**.

1. Prüfen, dass `HOCHZEIT_SHEET_ID`, `HOCHZEIT_GEHEIM_SHEET_ID` und
   `ADMIN_KEY` da sind. Nicht ändern.
2. **Property hinzufügen** → Key: `SITE_URL`, Wert: die endgültige Adresse der
   Website, zum Beispiel `https://maxrebhorn.github.io/WeddingWebsiteMain/`.
   Max/Ruth fragen, falls unklar.
3. `QR_PASSWORD` löschen, falls vorhanden. Es wird nicht mehr gebraucht.

## Schritt 3: In-place neu deployen (URL bleibt gleich)

**Wichtig:** NICHT „Neue Bereitstellung", das würde eine neue `/exec`-URL
erzeugen.

1. Oben rechts **Deployen → Bereitstellungen verwalten**.
2. Bei der bestehenden Web-App-Bereitstellung auf das Stift-Icon.
3. Version: **Neue Version**.
4. **Bereitstellen** klicken.
5. Prüfen: Die angezeigte URL muss identisch sein mit `appsScriptUrl` in
   `public/config/config.json`. Falls nicht: stoppen, im Chat melden, nichts
   an `config.json` ändern.

## Schritt 4: Alte 4-stellige Codes ersetzen (nur nach Rücksprache)

Nur, wenn noch **keine** Einladungen mit Code verschickt oder gedruckt sind.
Vorher Max/Ruth fragen.

1. Im Sheet, Tab `Gäste`, die Spalte `Code` leeren (nur die Werte, nicht die
   Kopfzeile).
2. Menü **Hochzeit → Tokens & Codes für neue Gäste erzeugen**. Das füllt nur
   leere Zellen, bestehende Tokens bleiben gleich.

## Schritt 5: Testen

1. Sheet neu laden. Menü **Hochzeit → QR-Codes anzeigen**: Das Fenster zeigt
   pro Einladung eine Karte. Einen QR-Code mit dem Handy scannen: Die Website
   öffnet sich mit dem richtigen Namen.
2. Auf der Website mit einem Gast-Link eine Test-Überraschung und einen
   Test-Kuchen eintragen. Beide müssen im Sheet ankommen. Danach löschen.
3. Ohne Token muss das Backend ablehnen. Im Terminal:

   ```
   curl -sL -X POST -H 'Content-Type: text/plain' -d '{"type":"frage","question":"test"}' <exec-URL>
   ```

   Erwartet: `{"error":"forbidden"}`.
4. `curl -sL '<exec-URL>?action=kuchen_list'` muss ebenfalls
   `{"error":"forbidden"}` liefern.
5. Ergebnis kurz im Chat bestätigen.

## Danach (nicht Teil dieser Aufgabe)

- CLI-Import (`npm run wedding -- import-guests ...`) läuft lokal und braucht
  nur die gesetzte `.env`.
- Familien manuell über `Gehört zu` verknüpfen.
