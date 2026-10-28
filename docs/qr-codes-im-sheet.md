# QR-Codes direkt im Google Sheet erzeugen

Status: Plan, noch nicht gebaut.

Dieses Dokument beschreibt, wie das QR-Code-Fenster im Google Sheet
funktionieren soll. Es ersetzt die öffentliche QR-Seite `/qr/` der Website.

## Ziel

Ruth und Max öffnen das Gäste-Sheet und klicken auf
**Hochzeit → QR-Codes anzeigen**. Ein Fenster zeigt pro Einladung eine Karte
mit QR-Code, Name und Code. Die Karten kann man drucken oder als PNG speichern.

Die Website muss dafür keine Gästedaten mehr ausliefern.

## Warum

Heute holt die Seite `/qr/` alle Tokens über das Apps Script (`guest_list`).
Ein Passwort schützt den Zugang. Das hat Schwächen:

- Jeder im Internet kann Passwörter raten (10 Versuche pro Minute).
- Wer absichtlich falsche Passwörter schickt, sperrt alle für eine Minute aus.
- Ein richtiges Passwort gibt alle Tokens und Codes frei.

Im Sheet schützt stattdessen das Google-Konto. Nur wer Bearbeitungsrechte am
Sheet hat, kann das Fenster öffnen. Es gibt dann keinen öffentlichen Zugang zu
den Tokens mehr.

## Ablauf für den Nutzer

1. Gäste-Sheet öffnen (am Computer, nicht in der Handy-App).
2. Menü **Hochzeit → QR-Codes anzeigen** klicken.
3. Beim ersten Mal: Google fragt nach der Berechtigung für das Script. Erlauben.
4. Das Fenster zeigt alle Karten.
5. Oben steht die Adresse der Website. Wenn sie fehlt oder falsch ist, zeigt
   das Fenster eine Warnung (siehe unten).
6. Optional: nach Namen filtern.
7. **Drucken** druckt alle sichtbaren Karten. **PNG speichern** lädt eine
   einzelne Karte als Bild herunter.

## Inhalt einer Karte

| Feld          | Quelle (Tab „Gäste")                                   |
| ------------- | ------------------------------------------------------ |
| QR-Code       | Link `<SITE_URL>?t=<Token>`                            |
| Name          | Spalte `Name`                                          |
| Mitkommende   | Namen der Zeilen, deren `Gehört zu` auf diese Einladung zeigt |
| Stufe         | Spalte `Stufe` (Trauung / Trauung + Party / ganzer Tag) |
| Einladung-ID  | Spalte `Einladung-ID`                                  |
| Code          | Spalte `Code` (4-stellig, für die Eingabe von Hand)    |

Nur Zeilen mit Token bekommen eine Karte. Verknüpfte Personen ohne eigenen
Token stehen als Mitkommende auf der Karte der Haupteinladung. Das ist dieselbe
Regel wie heute in `guestList_()`.

## Aufbau

### 1. Menüpunkt (`apps-script.gs`)

In `onOpen()` einen Eintrag ergänzen:

```js
.addItem('QR-Codes anzeigen', 'showQrDialog')
```

### 2. Fenster öffnen

```js
function showQrDialog() {
  const html = HtmlService.createHtmlOutputFromFile('qr-dialog')
    .setWidth(1100)
    .setHeight(750);
  SpreadsheetApp.getUi().showModalDialog(html, 'QR-Codes');
}
```

`qr-dialog.html` ist eine neue Datei im Apps-Script-Projekt (im Repo:
`apps-script/qr-dialog.html`).

### 3. Daten an das Fenster geben

Das Fenster ruft eine öffentliche Funktion auf:

```js
// Für das QR-Fenster. Nur über google.script.run erreichbar, nicht über doPost/doGet.
function qrData() {
  return {
    siteUrl: PROPS.getProperty('SITE_URL') || '',
    guests: guestList_()
  };
}
```

Wichtig:

- Der Name darf nicht auf `_` enden. Funktionen mit `_` am Ende kann
  `google.script.run` nicht aufrufen.
- `qrData` kommt nicht in `doPost` oder `doGet`. So bleibt sie für die
  Web-App unsichtbar. Aufrufen kann sie nur, wer das Sheet bearbeiten darf.

### 4. Website-Adresse

Neue Script-Property `SITE_URL`, zum Beispiel
`https://maxrebhorn.github.io/hochzeitswebsite/`.

Das Fenster zeigt die Adresse in einem Eingabefeld. Man kann sie dort für einen
Test ändern. Die Änderung gilt nur, solange das Fenster offen ist.

Warnung im Fenster, wenn:

- `SITE_URL` leer ist,
- die Adresse `localhost`, `127.0.0.1` oder `trycloudflare` enthält.

Text: „Achtung: Das ist nicht die echte Website. Gedruckte QR-Codes mit dieser
Adresse funktionieren später nicht."

### 5. QR-Codes erzeugen (`qr-dialog.html`)

- Bibliothek: `qrcode-generator` 1.4.4 von cdnjs, mit fester Version:
  `https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js`
- Der QR-Code entsteht im Fenster selbst. Die Tokens gehen an keinen fremden
  Dienst.
- **Nicht** verwenden: Online-QR-Dienste wie
  `=IMAGE("https://api.qrserver.com/...")`. Diese Dienste sehen jeden Token.
- Fehlerkorrektur: Stufe `M` (wie heute).
- Anzeige und Druck: SVG (scharf in jeder Größe).
- PNG: SVG auf ein Canvas mit 1024 × 1024 px zeichnen, dann
  `canvas.toDataURL('image/png')` herunterladen.
  Dateiname: `<Einladung-ID>-<Name>.png`.

### 6. Aussehen

- Gleicher Stil wie die heutige Seite `/qr/`: Karten im Raster, Schrift
  Karla/Caveat, brauner Text.
- Druck: `@media print` blendet Kopfzeile, Filter und Buttons aus. Jede Karte
  bleibt auf einer Seite zusammen (`break-inside: avoid`).

## Was danach wegfällt

Diese Teile sind dann nicht mehr nötig und kommen weg:

| Teil                          | Datei                                  |
| ----------------------------- | -------------------------------------- |
| Aktion `guest_list`           | `apps-script/apps-script.gs` (`doPost`) |
| Sperre für QR-Passwörter      | `QR_RATE_LIMIT_KEY` in `apps-script.gs` |
| Script-Property `QR_PASSWORD` | Apps-Script-Einstellungen              |
| QR-Seite                      | `qr/index.html`, `src/qr-page.ts`      |
| Zweiter Einstieg im Build     | `qr` in `vite.config.ts`               |
| Hinweise auf `/qr/`           | `apps-script/REDEPLOY-FOR-CLAUDE.md`   |

Das npm-Paket `qrcode` bleibt. Die CLI-Befehle in `cli/` (zum Beispiel
`qr-batch`) brauchen es weiter.

## Sicherheit

- **Zugang:** nur Personen mit Bearbeitungsrechten am Sheet, angemeldet mit
  ihrem Google-Konto. Bei aktivierter Zwei-Faktor-Anmeldung gilt diese auch hier.
- **Kein öffentlicher Weg mehr zu den Tokens.** Die Web-App kennt `guest_list`
  nicht mehr. Raten oder Aussperren über das Internet ist dann nicht mehr möglich.
- **Fremde Dienste:** Nur die Bibliothek kommt von cdnjs. Die Gästedaten
  verlassen Google nicht.
- **Rest-Risiko:** Wer Bearbeitungsrechte am Sheet hat, sieht die Tokens auch
  direkt in der Tabelle. Das Fenster gibt also niemandem mehr Rechte als vorher.
  Das Sheet daher nur mit Ruth und Max (und bei Bedarf den Trauzeugen) teilen.

## Grenzen

- Funktioniert nur im Browser am Computer. Die Google-Sheets-App auf dem Handy
  zeigt solche Fenster nicht an.
- Google begrenzt die Fenstergröße. Bei sehr vielen Gästen scrollt man im
  Fenster.
- Ob `window.print()` im Fenster nur die Karten druckt, muss man in Chrome
  testen. Falls nicht: Druck-Ansicht in einem neuen Tab öffnen oder die PNGs
  nutzen.

## Umsetzung in Schritten

1. `apps-script/qr-dialog.html` anlegen (Karten, Filter, Drucken, PNG).
2. In `apps-script.gs`: `showQrDialog()`, `qrData()` und den Menüpunkt
   ergänzen.
3. Script-Property `SITE_URL` setzen.
4. Apps Script **in-place** neu deployen (die `/exec`-URL bleibt gleich).
5. Testen (siehe unten).
6. Erst danach die alten Teile entfernen (Tabelle oben) und noch einmal
   in-place deployen.

## Tests

- [ ] Menü **Hochzeit → QR-Codes anzeigen** öffnet das Fenster.
- [ ] Anzahl der Karten = Anzahl der Gäste-Zeilen mit Token.
- [ ] Mitkommende stehen auf der richtigen Karte.
- [ ] QR-Code mit dem Handy scannen: Die Website öffnet sich ohne Code-Eingabe
      und zeigt den richtigen Namen.
- [ ] Leere `SITE_URL` oder Tunnel-Adresse: Warnung erscheint.
- [ ] Filter nach Namen funktioniert.
- [ ] Drucken zeigt nur die Karten, ohne Buttons.
- [ ] PNG lässt sich speichern und scannen.
- [ ] Ein Konto ohne Bearbeitungsrechte kann das Fenster nicht öffnen.
- [ ] Nach dem Aufräumen: Eine Anfrage `{"type":"guest_list"}` an die
      `/exec`-URL gibt `unknown` oder einen Fehler zurück, keine Gäste.
