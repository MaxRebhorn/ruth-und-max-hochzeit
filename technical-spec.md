# Technical Specification --- Ausführbares Spec

## 0. Eckdaten

-   Datum: 7. August 2027
-   Hosting: GitHub Pages (statisch), keine Backend-Schicht
-   Backend/Zwischenschicht: Google Apps Script
-   Sprachen: Deutsch, Englisch, Schwedisch --- vollständige
    Übersetzungen
-   Gäste: 60--80 Personen

## 1. Zugriffssystem (Stufen 0--3)

### 1.1 Konzepte

-   Einladungs-Stufe (0--3): wird pro Gast vergeben und steuert, was der
    Gast sehen darf.
-   Anmeldung (RSVP): wird vom Gast selbst gewählt und darf nur Optionen
    bis zur eigenen Stufe enthalten.

### 1.2 Stufen-Matrix

  ---------------------------------------------------------------------------------
  Stufe                   Bedeutung               Sichtbar
  ----------------------- ----------------------- ---------------------------------
  0                       nur Trauung             Kirchen-Infos (wo/wann), Timeline
                                                  nur bis zur Trauung

  1                       Trauung + Afterparty    alles aus 0 + Afterparty (wo/wann
                                                  in der Timeline) +
                                                  Überraschungs-Formular

  2                       ganzer Tag              alles aus 1 + Essenswahl-Formular

  3                       von außerhalb           alles aus 2 +
                                                  Übernachtungs-Infos/-Formular +
                                                  Vogtland-Guide
  ---------------------------------------------------------------------------------

Für Stufe 0 sind Afterparty-Daten, Essenswahl, Liedwünsche,
Übernachtung, Vogtland und Überraschung verborgen.

### 1.3 QR-Code & Level-Token

-   QR-Code enthält nur Stufe + Level-Token; keine persönlichen Daten.
-   Jede Stufe hat einen gemeinsamen Token (Shared Secret).
-   URL-Format: `https://<site>/?access=2&t=<token-stufe-2>`
-   Tokens liegen in der Repository-Config und in `apps-script.gs`.
-   Die vier geteilten Tokens sind bewusst keine echte
    Sicherheitslösung. Eine vollständige Zugriffskontrolle mit
    persönlichen Gast-Tokens und echtem Backend ist nicht vorgesehen.

### 1.4 Zugriffswege

**QR-Link** - URL enthält `access` + `token`. - Stufe wird sofort
freigegeben, ohne zusätzliche Abfrage.

**Direkter Link ohne Token** - Zeigt zunächst nur den Zugang zum Gate
mit Feldern für Name + E-Mail. - Apps Script wird über `guest`
aufgerufen. - Der Endpoint prüft die Einladungsliste und liefert die
Stufe oder `null`. - Bei Treffer: Freigabe; Stufe + E-Mail werden in
`localStorage` gespeichert. - Bei Wiederbesuch auf demselben Gerät
erfolgt die Freigabe direkt. - Bei `null`: Hinweis, dass die Person
nicht in der Einladungsliste gefunden wurde.

Datenschutz: - Keine IP-Erfassung. - Keine Cookies zur Identifikation. -
Name und E-Mail werden vom Gast zur Verifikation angegeben.

### 1.5 Fehler-/Latenzfall

-   Der erste Apps-Script-Call kann 1--3 Sekunden dauern und
    fehlschlagen.
-   Während der Anfrage wird ein Ladezustand angezeigt.
-   Bei Fehler oder Timeout bleibt die Seite gesperrt.
-   Es wird auf Neuladen oder die Nutzung des QR-Codes hingewiesen.

## 2. Formularsystem

Die Anmeldung wird auf mehrere Formulare verteilt.

  ------------------------------------------------------------------------------------------
  \#            Formular                   Stufe Felder               Ziel
  ------------- -------------- ----------------- -------------------- ----------------------
  1             Anmeldung                   alle Name, E-Mail,        RSVP
                                                 Teilnahme-Auswahl,   
                                                 Opt-in               
                                                 „Info-Mail-Liste"    

  2             Essenswahl                    2+ vegan, vegetarisch,  RSVP
                                                 glutenfrei,          
                                                 laktosefrei,         
                                                 Allergien (Freitext) 

  3             Liedwunsch                    1+ Spotify-Suche +      RSVP
                                                 Freitext-Fallback    

  4             Überraschung                  1+ Freitext             Überraschungen-Sheet

  5             Übernachtung                   3 Schlafmöglichkeit    RSVP
                                                 nötig? ja/nein +     
                                                 Details              
  ------------------------------------------------------------------------------------------

Datenmodell: - Eine Zeile pro Gast im RSVP-Sheet. - Schlüssel ist die
E-Mail-Adresse. - Jedes Formular aktualisiert nur seine eigenen
Spalten. - Upsert erfolgt anhand der E-Mail-Adresse.

## 3. Google-Sheets-Architektur / Apps Script

### 3.1 Tabellen

**RSVP** - Eine Zeile pro Gast. - Felder: Zeit, Name, E-Mail, Teilnahme,
Essen, Allergien, Song, Übernachtung, Info-Mail-Opt-in. - Zugriff: nur
Paar.

**Überraschungen** - Felder: Zeit, Name, E-Mail, Überraschung. -
Zugriff: nur Trauzeugen. - `SURPRISE_SHEET_ID` muss konfiguriert werden.

**Fragen** - Felder: Zeit, Name, E-Mail, Frage. - Zugriff: nur Paar.

**Gäste** - Felder: Name, E-Mail, Stufe. - Einladungsliste, gepflegt vom
Paar. - Wird vom Zugriffsgate gelesen. - Zugriff: nur Paar.

### 3.2 `doPost(e)`

Bestehende Sicherheitsmechanismen bleiben erhalten: - Honeypot -
Formel-Injection-Schutz durch Prefix `'` - Längenbegrenzungen

JSON-Feld `type`: - `rsvp` - `essen` - `lied` - `ueberraschung` -
`uebernachtung`

Upsert: - Zeile anhand der E-Mail suchen. - Existierende Zeile: Spalten
des jeweiligen Formular-Typs aktualisieren. - Keine bestehende Zeile:
neue Zeile anlegen.

### 3.3 `doGet(e)`

CORS-fähig, JSON-Antworten.

Endpoints:

-   `?action=guest&name=&email=`
    -   Antwort: `{ level: 0–3 | null }`
    -   Abgleich gegen das Gäste-Sheet.
-   `?action=songs&q=…`
    -   Spotify-Suche über einen Proxy.
-   `?action=mail_send&subject=&body=`
    -   Mail-Versand an alle Opt-in-Adressen.
    -   Wird vom CLI aufgerufen.

### 3.4 E-Mail-Versand

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

-   FAQ bleibt statisch in `content.json`.
-   Formular „Frage stellen" mit Name, E-Mail und Frage.
-   Einsendung wird im Fragen-Sheet gespeichert.
-   Zusätzlich wird eine Mail an das Paar gesendet.
-   Antworten werden manuell in der FAQ-Config gepflegt.
-   Kein Live-Rendering der FAQ aus dem Sheet.

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

### `wedding qr`

Beispiel:

`wedding qr --level 2 --out qr_stufe2.png`

Funktion: - Erzeugt ein QR-PNG. - URL enthält `access` und den Token der
jeweiligen Stufe.

### `wedding mail`

Beispiel:

`wedding mail --subject "…" --body "…"`

Funktion: - Ruft `?action=mail_send` am Apps-Script-Endpoint auf. -
Sendet Info-Mail an Gäste mit Opt-in.

Kein `translate`-Befehl.

## 9. Bestehende technische Bestandteile

Bleiben erhalten: - MapLibre-Karte für Anreise und Route - zwei
Kartenmarker - FAQ-Struktur - WhatsApp-Notruf-/Trauzeugen-Sektion -
Externalisierung über `content.json` - Debug-Lineal über `?debug=1` -
RSVP → Google Sheets - Honeypot-Schutz - Formula-Injection-Schutz -
2D-Fotosektion/Karussell mit Bildern aus `assets/carousel/`

Nicht vorgesehen: - echtes Backend - persönliche Gast-Tokens -
automatischer Mail-Trigger - Spotify-Embed einer eigenen Playlist -
automatische Scroll-/Highlight-Funktion bei Datenänderungen

## 10. Technische Umsetzungsreihenfolge

1.  `content.json` auf 2027 korrigieren.
2.  `config.json` anlegen.
3.  i18n-Dateistruktur anlegen.
4.  Zugriffssystem implementieren:
    -   Level-Token in URL
    -   Sektionen nach Stufe filtern
    -   `guest`-Endpoint
    -   `localStorage`
5.  Formulare aufteilen.
6.  Upsert-Logik in `apps-script.gs` über `type` implementieren.
7.  Gäste-Sheet anlegen.
8.  `SURPRISE_SHEET_ID` eintragen.
9.  Fragen-Sheet und „Frage stellen"-Formular implementieren.
10. Spotify-Live-Suche über Apps-Script-Proxy implementieren.
11. Vogtland-Guide und Übernachtungs-Formular implementieren.
12. CLI-Befehle `qr` und `mail` implementieren.
13. i18n-Lade- und Sprachwahl implementieren.

## 11. Offene technische Punkte

-   Überraschungs-Formular: Stufe 1 oder Stufe 2?
-   Spotify: eigene App / Client-Credentials im Spotify Developer
    Dashboard bereitstellen.
