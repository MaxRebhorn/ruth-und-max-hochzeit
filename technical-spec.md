# Technical Specification --- Ausführbares Spec

## 0. Eckdaten

-   Datum: 7. August 2027
-   Hosting: GitHub Pages (statisch), keine Backend-Schicht
-   Backend/Zwischenschicht: Google Apps Script
-   Sprachen: Deutsch, Englisch, Schwedisch --- vollständige
    Übersetzungen
-   Gäste: 60--80 Personen

## 1. Zugriffssystem (3-tier, Token statt geteiltem Wort)

### 1.1 Konzepte

Ersetzt die frühere 4-Stufen-/geteiltes-Token-Idee dieses Dokuments (siehe
Git-Historie, falls die alte Fassung interessiert). Umgesetzt ist stattdessen:

-   Drei Stufen wie im Code bereits vorhanden: `trauung`, `party`, `alles`
    (`GUEST_CODES`-Konzept in `src/app.ts`, wird durch das Folgende ersetzt).
-   **Ein Token pro Einladung** (nicht pro Stufe) — identifiziert Gast *und*
    Stufe in einem Schritt, keine Namens-/E-Mail-Eingabe nötig.
-   Ein 6-stelliger Code (auf der physischen Einladung gedruckt) ist der
    Rückfallweg für Gäste ohne funktionierenden QR-Code.
-   Beides führt zur selben Identität, die anschließend als Upsert-Schlüssel
    für alle Formulare (RSVP, Kuchenbuffet, Überraschung, Fragen,
    Trauzeugen-Nachricht) mitgeschickt wird — kein Email-/Namens-Abgleich in
    den Formularen selbst nötig, der Gast ist beim Ausfüllen schon bekannt.

### 1.2 Datenmodell (`Gäste`-Tab)

Eine Zeile pro Einladung/Haushalt (nicht pro Einzelperson — passt zum
RSVP-Formular, das schon eine „Anzahl"-Angabe hat):

`Einladung-ID | Name | Stufe | Token | Code | E-Mail | Telefon | RSVP-Status | Notizen`

-   Wird vom Paar vorab gepflegt, bevor Einladungen verschickt werden.
-   `Token`/`Code` werden über ein gebundenes Apps-Script-Menü
    ("Tokens & Codes für neue Gäste erzeugen", `onOpen()`-Trigger) direkt in
    Google Sheets erzeugt — kein externes Tool nötig.
-   `Token`: `Utilities.getUuid()` (lang, nicht erratbar, wandert in den
    QR-Link).
-   `Code`: 6 Zeichen aus Großbuchstaben und Ziffern ohne leicht
    verwechselbare Zeichen (kein 0/O, 1/I/L), zufällig, für die manuelle
    Eingabe. Etwa 887 Millionen Kombinationen; zusammen mit der
    Ratenbegrenzung (siehe 1.5) lassen sich die Codes nicht durchprobieren.
    (Früher 4 Ziffern: 9.000 Möglichkeiten waren in ca. 15 Stunden
    durchprobiert.)
-   `E-Mail`/`Telefon`/`RSVP-Status` werden vom Backend zurückgeschrieben,
    sobald der Gast etwas einreicht — informativ, keine Zugriffsprüfung.

### 1.3 QR-Code & Link

-   QR-Code enthält ausschließlich `?t=<token>`, keine weiteren
    personenbezogenen Daten in der URL.
-   URL-Format: `https://<site>/?t=<einladungs-token>`
-   Ein Link ohne Token zeigt stattdessen das Gate mit dem 6-stelligen
    Code-Feld.

### 1.4 Zugriffswege

**QR-Link** — URL enthält `t`. `doGet(?action=guest_lookup&t=…)` wird beim
Laden aufgerufen, liefert `{ name, stufe }` oder einen Fehler. Bei Treffer:
Stufe wird freigegeben, `{ token, name, stufe }` landet in `localStorage`
(ersetzt das bisherige reine `rm-guest`-Stufen-Flag) — bei Wiederbesuch auf
demselben Gerät ist kein erneuter Call nötig.

**Direkter Link ohne Token** — Gate zeigt ein Feld für den 6-stelligen Code.
`doGet(?action=guest_lookup&code=…)`, gleiche Antwortform, gleiches
`localStorage`-Verhalten bei Treffer. Bei Fehlversuch: Fehlermeldung, keine
Sperre nach einem einzelnen Fehlversuch (siehe Ratenbegrenzung für den
Schutz gegen wiederholtes Raten).

Datenschutz: keine IP-Erfassung (Apps-Script-Web-Apps bekommen die
Aufrufer-IP technisch gar nicht mitgeteilt — siehe 1.5), keine Cookies zur
Identifikation außerhalb von `localStorage` auf dem Gerät des Gasts selbst.

### 1.5 Fehler-/Latenz-/Ratenbegrenzungsfall

-   Der Apps-Script-Call kann 1–3 Sekunden dauern und fehlschlagen —
    während der Anfrage ein Ladezustand, bei Fehler/Timeout bleibt die Seite
    gesperrt (Neuladen oder erneuter QR-Scan als Hinweis).
-   Ratenbegrenzung für den 6-stelligen Code: Apps-Script-Web-Apps erhalten
    keine Aufrufer-IP, ein Schutz pro Angreifer ist technisch nicht möglich.
    Stattdessen ein **globaler** Zähler über `CacheService` — nach z. B. 10
    fehlgeschlagenen Code-Versuchen von irgendwem innerhalb eines kurzen
    Zeitfensters greift eine kurze Abkühlphase für alle. Bei 60–80 Gästen
    kein praktisches Problem, macht aber stures Durchprobieren unpraktikabel.
-   Nebenläufige Schreibzugriffe: Google Sheets ist nicht transaktional.
    Der Upsert-Pfad (`Gast-Zeile finden → mergen → schreiben`) läuft unter
    `LockService.getScriptLock()`, damit zwei gleichzeitige Einreichungen
    sich nicht überschreiben.

## 2. Formularsystem

  ---------------------------------------------------------------------------------------------
  \#     Formular          Ziel-Tab            Upsert-Schlüssel       Status
  ------ ----------------- ------------------- ---------------------- -------------------------
  1      Anmeldung (RSVP)  `RSVP`              Einladung-ID (Token)   gebaut, Upsert folgt
                                                                       diesem Rework

  2      Kuchenbuffet      `Kuchenbuffet`      — (append-only Liste,  gebaut
                                                Einladung-ID nur als
                                                Referenzspalte)

  3      Überraschung      `Überraschungen`    — (append-only)        gebaut, Backend folgt
                                                (separate Datei, s.
                                                3.1)

  4      Frage stellen     `Fragen`            — (append-only)        gebaut, Backend folgt

  5      Trauzeugen-       `Trauzeugen-        — (append-only,        gebaut, Backend folgt
         Nachricht         Nachrichten`        separate Datei)

  6      Essenswahl        `RSVP` (eigene      Einladung-ID (Token)   noch kein Formular, Spalten
                            Spalten, reserviert)                      in RSVP schon reserviert

  7      Liedwunsch        `RSVP`              Einladung-ID (Token)   noch kein Formular, Spalte
                                                                       reserviert

  8      Übernachtung      `RSVP`              Einladung-ID (Token)   noch kein Formular, Spalte
                                                                       reserviert
  ---------------------------------------------------------------------------------------------

Datenmodell für RSVP: eine Zeile pro **Einladung** (nicht pro Gast-Formular),
Schlüssel ist die `Einladung-ID` (aus dem Token aufgelöst), nicht die
E-Mail-Adresse — die kommt oft erst mit der ersten Einreichung dazu.
Upsert ist **merge-only**: ein leeres Feld in einer neuen Einreichung
überschreibt nie einen vorher ausgefüllten Wert. Jede Einreichung landet
zusätzlich unverändert im `RSVP-Log`-Tab (Audit-Trail, nie bearbeitet) —
falls ein Upsert doch einmal etwas Unerwartetes tut, ist der Rohzustand
nicht verloren.

## 3. Google-Sheets-Architektur / Apps Script

### 3.1 Zwei Dateien

**„Hochzeit"** (mit Ruth & Max geteilt) — Tabs: `Gäste`, `RSVP`, `RSVP-Log`,
`Kuchenbuffet`, `Fragen`.

**„Hochzeit – Geheim"** (gleicher Account, eigene Datei, nicht im täglichen
Blick) — Tabs: `Überraschungen`, `Trauzeugen-Nachrichten`. Beide Abschnitte
sind explizit dafür gedacht, dass das Brautpaar sie *nicht* sieht — die
Trennung ist eine eigene Datei mit eigener Sheet-ID, nicht nur ein
versteckter Tab in derselben Datei.

Ein Apps-Script-Projekt bedient beide Dateien über je eine Sheet-ID als
Script Property — keine zwei Deployments nötig, `SpreadsheetApp.openById()`
funktioniert unabhängig davon, wie viele Dateien es sind.

### 3.2 Tabellen

**`Gäste`** — `Einladung-ID, Name, Stufe, Token, Code, E-Mail, Telefon,
RSVP-Status, Notizen`. Zugriff: nur Paar. Vom Zugriffsgate gelesen
(`guest_lookup`).

**`RSVP`** — `Zeit, Einladung-ID, Name, E-Mail, Telefon, Anzahl, Teilnahme,
Allergien, Song, Übernachtung, Nachricht, Essenswahl, Liedwunsch,
Übernachtung-Details`. Eine Zeile pro Einladung, gemerged.

**`RSVP-Log`** — dieselben Spalten wie `RSVP`, eine Zeile pro Einreichung,
append-only.

**`Kuchenbuffet`** — `Zeit, Einladung-ID, Beitrag, Stücke, Art, Kühlung
nötig, vegan/vegetarisch, enthält Nüsse, braucht Kuchenplatte`.
Append-only — eine Person kann mehrere Kuchen mitbringen.

**`Fragen`** — `Zeit, Frage, Kontakt`. Append-only, Zugriff: nur Paar.

**`Überraschungen`** (in „Hochzeit – Geheim") — `Zeit, Von, Kontakt, Idee,
Geheim`. Append-only, Zugriff: nur Trauzeugen.

**`Trauzeugen-Nachrichten`** (in „Hochzeit – Geheim") — `Zeit, An, Name,
Kontakt, Nachricht`. Append-only, Zugriff: nur Trauzeugen.

### 3.3 `doPost(e)`

Bestehende Sicherheitsmechanismen bleiben erhalten: Honeypot,
Formel-Injection-Schutz durch Prefix `'`, Längenbegrenzungen.

JSON-Feld `type`: `rsvp`, `kuchen`, `ueberraschung`, `frage`, `trauzeugen`.
Jede Anfrage trägt zusätzlich `token` (aus `localStorage`, siehe §1) — das
ist der Upsert-Schlüssel für `rsvp`, und die Referenz-Spalte für `kuchen`.

Upsert (`rsvp`): `Einladung-ID` aus dem Token auflösen (`Gäste`-Tab) →
bestehende `RSVP`-Zeile für diese Einladung-ID suchen → nur nicht-leere
Felder der Einreichung übernehmen (merge) → `Zeit` aktualisieren. Kein
Treffer: neue Zeile anlegen. Parallel dazu immer ein append in `RSVP-Log`,
unabhängig vom Upsert-Ergebnis. Läuft unter `LockService.getScriptLock()`.

`kuchen`/`ueberraschung`/`frage`/`trauzeugen`: reine `appendRow_`-Aufrufe
wie bisher, keine Upsert-Logik nötig.

### 3.4 `doGet(e)`

-   `?action=kuchen_list` — wie bisher, liefert die Kuchenliste für die
    Live-Anzeige der Kuchentorte.
-   `?action=guest_lookup&t=<token>` **oder** `&code=<6-stellig>` —
    Antwort: `{ name, stufe }` bei Treffer, `{ error }` sonst. Der
    `code`-Zweig läuft hinter der globalen Ratenbegrenzung aus §1.5.

### 3.5 E-Mail-Versand

-   Content bleibt im Repository in `content.json`.
-   Apps Script überwacht das Repository nicht.
-   Manueller CLI-Aufruf: `wedding mail --subject "…" --body "…"`
-   Der CLI-Aufruf ruft den `mail_send`-Endpoint auf.
-   Mail wird an alle Gäste mit Info-Mail-Opt-in gesendet.
-   Kein automatischer Mail-Trigger.

## 4. Spotify-Live-Suche

-   Gast gibt einen Liedwunsch ein.
-   Während der Eingabe werden Live-Vorschläge geladen.
-   Ausgewählter Track wird mit Name + Spotify-URI im RSVP-Sheet
    gespeichert.
-   Spotify-Suche läuft serverseitig über Apps Script.
-   Apps Script verwendet `UrlFetchApp` und die Spotify Web API.
-   Authentifizierung über Client-Credentials-Flow.
-   Client-Secret liegt nicht im Browser.
-   Browser ruft `?action=songs&q=…` am Apps-Script-Endpoint auf.
-   CORS wird unterstützt.
-   Bei Limit-/Rate-Problemen steht weiterhin ein Freitext-Fallback zur
    Verfügung.

## 5. Fragenverwaltung

-   FAQ ist markdown-getrieben (`src/content/faq.md`, siehe
    `src/content/README.md`) — kein Live-Rendering aus dem Sheet.
-   Formular „Frage stellen" (als letzte, eingeklappte Karte im FAQ-Bereich)
    fragt Frage + Kontakt ab, kein Namensfeld im aktuellen Formular.
-   Einsendung wird im `Fragen`-Tab gespeichert (siehe §3.2), kein
    automatischer Mail-Versand ans Paar — die Sheet-Zeile ist die
    Benachrichtigung.
-   Antworten werden manuell in `faq.md` gepflegt.

## 6. Vogtland-Guide

-   Nur für Stufe 3 sichtbar.
-   Statische Sektion.
-   Inhalt besteht aus Links und Bildern.
-   Pflege erfolgt über `content.json`.
-   Eintrag kann z. B. Titel, Beschreibung, URL und Bild enthalten.

## 7. Config & Internationalisierung

### 7.1 Content

-   `content.json` bleibt die zentrale Content-Quelle für Texte, FAQ,
    Timeline und Guide.
-   Ziel: redaktionelle Inhalte ohne Codeänderung bearbeiten können.

### 7.2 Technische Config

Neue zentrale `config.json` (oder Environment-Konfiguration) für: -
Stufen-Tokens - Apps-Script-/Exec-URL - Site-URL für QR-Generierung

### 7.3 i18n

-   Deutsch ist die Quellsprache.
-   Englisch und Schwedisch sind vollständige Übersetzungen.
-   Übersetzt werden alle Texte einschließlich FAQ, Timeline und
    Formulare.
-   Übersetzungsdateien:
    -   `content.en.json`
    -   `content.sv.json`
-   Identische Struktur zu `content.json`.
-   Ladefunktion: `loadI18n(lang)`
-   Sprachwahl wird in `localStorage` gespeichert.
-   `?lang=`-Parameter kann die Sprache setzen.
-   Default: `de`.
-   Übersetzungen werden manuell erstellt.
-   Kein Übersetzungs-CLI.

## 8. CLI

Kein eigenes Framework. Kleine Node-Skripte über `package.json`-Scripts.

### `wedding qr` / `wedding qr-batch`

Umgesetzt (siehe `cli/qr.mjs`, `cli/qr-batch.mjs`), URL enthält jetzt `t=`
(Einladungs-Token) statt `access`/Stufen-Token:

```
wedding qr --token <einladungs-token> --out qr_einzelperson.png
wedding qr-batch --csv gaeste-export.csv --outDir qr/
```

`qr-batch` liest einen von Hand aus dem `Gäste`-Tab exportierten CSV
(Google Sheets → Datei → Herunterladen → .csv) und schreibt ein PNG pro
Zeile — bewusst kein Apps-Script-Endpoint, der die ganze Gästeliste
unauthentifiziert ausgibt.

### `wedding mail`

Beispiel:

`wedding mail --subject "…" --body "…"`

Funktion: - Ruft `?action=mail_send` am Apps-Script-Endpoint auf. -
Sendet Info-Mail an Gäste mit Opt-in.

Kein `translate`-Befehl.

## 9. Bestehende technische Bestandteile

Bleiben erhalten: - Google Apps Script als einzige Backend-Schicht - RSVP +
Kuchenbuffet → Google Sheets (jetzt per Einladungs-Token statt anonym) -
FAQ-/Blacklist-/Story-/Ablauf-/Vogtland-Struktur über `src/content/` bzw.
`src/photos/*/entry.md` (siehe `README.md`) - Honeypot-Schutz -
Formula-Injection-Schutz

Nicht vorgesehen: - automatischer Mail-Trigger - Spotify-Embed einer
eigenen Playlist - automatische Scroll-/Highlight-Funktion bei
Datenänderungen - echte MapLibre-Karte für Anreise (Platzhalter bleibt
bestehen, siehe `README.md` "Not yet wired up")

Persönliche Gast-Tokens sind jetzt Teil des Designs (§1), nicht mehr
ausgeschlossen — das war die zentrale Änderung dieses Reworks.

## 10. Technische Umsetzungsreihenfolge

Erledigt: RSVP/Kuchenbuffet-Formulare + Sheets (append-only), FAQ/Blacklist/
Story/Ablauf/Vogtland als markdown-Content, Überraschung/Frage
stellen/Trauzeugen-Formulare als UI (ohne Backend).

Als Nächstes (dieses Rework, in Reihenfolge):

1.  `Gäste`-Tab anlegen (`Einladung-ID, Name, Stufe, Token, Code, E-Mail,
    Telefon, RSVP-Status, Notizen`) + `onOpen()`-Menü zur Token/Code-Erzeugung.
2.  `RSVP`/`RSVP-Log`-Tabs auf das neue Schema umstellen, `Kuchenbuffet`
    um `Einladung-ID`-Spalte erweitern.
3.  „Hochzeit – Geheim"-Datei mit `Überraschungen`/`Trauzeugen-Nachrichten`
    anlegen.
4.  `apps-script.gs`: `getSheetByName` statt `.getSheets()[0]`,
    `guest_lookup`-Endpoint, `LockService`-Upsert, `CacheService`-Ratenbegrenzung,
    neue `doPost`-Fälle für `ueberraschung`/`frage`/`trauzeugen`.
5.  `src/app.ts`: Gate auf Token/Code + async `guest_lookup` umstellen,
    `GUEST_CODES`/`resolveCode()`-Stufen-Logik entfernen.
6.  `src/raw/body.raw.html`: E-Mail-/Telefon-Feld im RSVP-Formular, Gate-Formular
    auf Code-Eingabe umstellen.
7.  `src/api.ts`: `submitSurprise`/`submitFrage`/`submitTrauzeugenMsg`,
    Token in allen Payloads.
8.  Danach, nicht Teil dieses Reworks: Spotify-Live-Suche,
    Vogtland-Formular/Übernachtung, i18n-Dateistruktur (aktuell läuft
    Übersetzung über `data-de`/`data-en`/`data-sv`-Spans direkt im Markup,
    nicht über separate `content.*.json`-Dateien), Batch-QR-Generierung für
    alle Einladungen.

## 11. Offene technische Punkte

-   Batch-QR-Generierung für 60–80 Einladungen: `npm run wedding -- qr`
    kann aktuell nur einen Tier-Link erzeugen, kein `--token`/Schleife über
    den `Gäste`-Tab. Folgt, sobald der Kern-Mechanismus mit ein paar echten
    Gästen getestet ist.
-   Überraschungs-Formular: Stufe 1 oder Stufe 2?
-   Spotify: eigene App / Client-Credentials im Spotify Developer
    Dashboard bereitstellen.
