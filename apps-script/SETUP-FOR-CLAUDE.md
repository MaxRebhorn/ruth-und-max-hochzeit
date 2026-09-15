# Aufgabe: Google Sheets + Apps Script für diese Hochzeitswebsite einrichten

**Status: erledigt.** Läuft live, URL steht in `public/config/config.json`,
siehe `apps-script/README.md` für den aktuellen Stand (inkl. einer
Abweichung von diesem Plan — bestehendes Apps-Script-Projekt wiederverwendet
statt neu angelegt, dafür ein zusätzlicher `installOnOpenTrigger_()`-Schritt
nötig). Diese Datei bleibt als Blaupause stehen, falls das Ganze noch einmal
von Null aufgesetzt werden muss (neuer Account, neues Projekt, o. ä.).

Dieses Repo (`hochzeitswebsite`) hat schon fertigen Code für ein Google-Sheets-
Backend, aber es läuft noch nirgendwo — es gibt noch keine echte Google-Sheets-
Datei und kein deploytes Apps-Script-Projekt. Deine Aufgabe: das jetzt
aufsetzen, im Google-Account des Nutzers (nicht deinem eigenen), bis eine
funktionierende `/exec`-URL existiert und ins Repo eingetragen ist.

Falls du dabei (wie beim ersten Durchlauf) ein bereits existierendes
Apps-Script-Projekt vorfindest und der Nutzer dich anweist, das
wiederzuverwenden statt ein neues anzulegen: prüfe, ob es an die
„Hochzeit"-Datei **gebunden** ist oder **standalone** läuft. Standalone
heißt, `onOpen()` feuert nicht automatisch — führe dann einmalig
`installOnOpenTrigger_()` aus dem Script-Editor aus (siehe die Funktion in
`apps-script.gs`), sonst erscheint das „Hochzeit"-Menü in der Tabelle nie.

Lies zuerst `apps-script/apps-script.gs` (der komplette Script-Code, fertig
zum Einfügen) und `ARCHITECTURE.md` (erklärt, welche Daten wo landen und
warum), bevor du anfängst — dann verstehst du, wozu jeder Schritt gut ist.

## Schritt 1 — Zwei Google-Sheets-Dateien anlegen

Im Google-Account, der später auch die Hochzeitsseite betreibt:

1. Neues Google Sheet erstellen, nennen: **„Hochzeit"**. Das ist die Datei,
   die später mit Ruth & Max geteilt wird (RSVP, Gästeliste, Kuchenbuffet,
   Fragen landen hier).
2. Zweites, komplett separates Google Sheet erstellen, nennen: **„Hochzeit –
   Geheim"**. Hier landen später die Überraschungen und Nachrichten an die
   Trauzeugen — bewusst eine eigene Datei, nicht nur ein Tab, weil das
   Brautpaar diese Datei nicht routinemäßig öffnen soll.
3. Von beiden Dateien die **Spreadsheet-ID** aus der URL notieren:
   `https://docs.google.com/spreadsheets/d/`**`<DAS-HIER>`**`/edit`

Tabs/Spalten musst du nicht von Hand anlegen — das Script erstellt fehlende
Tabs (mit Kopfzeile) automatisch beim ersten Zugriff.

## Schritt 2 — Apps-Script-Projekt anlegen

1. In der „Hochzeit"-Datei: **Erweiterungen → Apps Script**. Das öffnet ein
   gebundenes Script-Projekt (das reicht — es öffnet beide Spreadsheet-
   Dateien später per ID, unabhängig davon, an welche Datei es gebunden ist).
2. Den kompletten Inhalt von `apps-script/apps-script.gs` aus diesem Repo
   kopieren und den Standard-Code (`Code.gs`) im Script-Editor komplett damit
   ersetzen.
3. Speichern (Diskettensymbol oder Strg/Cmd+S).

## Schritt 3 — Script Properties setzen

Im Script-Editor: **Projekteinstellungen** (Zahnrad links) → ganz unten
**Script-Properties** → **Property hinzufügen**, zweimal:

| Property | Wert |
|---|---|
| `HOCHZEIT_SHEET_ID` | die ID der „Hochzeit"-Datei aus Schritt 1 |
| `HOCHZEIT_GEHEIM_SHEET_ID` | die ID der „Hochzeit – Geheim"-Datei aus Schritt 1 |

## Schritt 4 — Als Web-App deployen

1. Im Script-Editor oben rechts: **Deployen → Neuer Bereitstellung**.
2. Typ auswählen: **Web-App**.
3. Einstellungen: **Ausführen als: Ich** (der Account-Besitzer),
   **Zugriff: Alle** (die Seite ruft das anonym auf, ohne dass Gäste ein
   Google-Konto brauchen).
4. **Bereitstellen** klicken. Google fragt beim allerersten Mal nach
   Autorisierung (eigenes Konto, „Erweitert" → „Zu [Projektname] (unsicher)
   wechseln" ist hier normal, weil das Script nicht verifiziert ist — es ist
   dein/das eigene Script).
5. Die angezeigte **Web-App-URL** (endet auf `/exec`) kopieren — das ist die
   URL, die die Seite später für alle Anfragen benutzt.

## Schritt 5 — URL ins Repo eintragen

`public/config/config.json` in diesem Repo bearbeiten:

```json
{
  "appsScriptUrl": "<die /exec-URL aus Schritt 4>",
  "siteUrl": "<die echte GitHub-Pages-URL, falls schon bekannt>"
}
```

Falls du das nicht selbst committen sollst (kein Zugriff/nicht gewünscht),
gib die URL stattdessen im Chat zurück, damit der Nutzer sie selbst einträgt.

## Schritt 6 — Testen

1. In der „Hochzeit"-Datei einen `Gäste`-Tab anlegen (falls noch nicht durch
   Schritt 7 automatisch entstanden) mit mindestens einer Testzeile:
   `Name` = „Test Gast", `Stufe` = `alles`, Rest leer lassen.
2. Seite neu laden (F5) — im Menü der Tabelle sollte jetzt ein Menüpunkt
   **„Hochzeit"** mit **„Tokens & Codes für neue Gäste erzeugen"** erscheinen
   (kommt vom `onOpen()`-Trigger im Script). Falls nicht sofort sichtbar:
   einmal die Tabelle schließen und neu öffnen.
3. Diesen Menüpunkt ausführen — füllt `Einladung-ID`, `Token`, `Code` für die
   Testzeile.
4. Im Browser direkt gegen die deployte URL testen (Token/Code aus der
   Tabelle einsetzen):
   ```
   <exec-URL>?action=guest_lookup&t=<Token-aus-der-Tabelle>
   ```
   Erwartete Antwort: `{"name":"Test Gast","stufe":"alles","token":"…"}`
5. Testweise auch mit einem erfundenen Token prüfen — sollte
   `{"error":"not found"}` liefern, nicht crashen.
6. Testzeile danach löschen oder als „Test" markieren, damit sie nicht mit
   einem echten Gast verwechselt wird.

## Danach (nicht Teil dieser Aufgabe, nur zur Einordnung)

- Die echte Gästeliste (`Name`, `Stufe` je Einladung) muss noch von
  Ruth/Max befüllt werden — das ist redaktionelle Arbeit, keine
  Technik-Aufgabe.
- `cli/qr.mjs` im Repo ist aktuell noch auf das alte, abgelöste
  Zugriffssystem eingestellt (baut `?g=<wort>`-Links) und muss noch auf
  `?t=<token>` umgestellt werden, bevor QR-Codes für echte Einladungen
  erzeugt werden.
- Redeploys nach künftigen Änderungen an `apps-script.gs`: im Script-Editor
  **Deployen → Bereitstellungen verwalten** → Stift-Icon bei der bestehenden
  Bereitstellung → **Bereitstellen**, NICHT „Neue Bereitstellung" — sonst
  ändert sich die `/exec`-URL und `config.json` zeigt ins Leere.
