# TODO — Hochzeitswebsite

Stand: 2026-09-25. Ziel: fertig bis übermorgen. Reihenfolge = Priorität.
Erledigtes abhaken (`[x]`), nicht löschen.

## P0 — Blockiert den Start

- [x] **Adresse festgelegt:** https://maxrebhorn.github.io/ruth-und-max-hochzeit/ (Repo `ruth-und-max-hochzeit`, GitHub Pages).
      Der Build nimmt den Pfad aus dem Repo-Namen. Vor dem Drucken der Einladungen
      nicht mehr ändern: Die Adresse steht in den QR-Codes.
- [x] **Apps Script neu deployen** (neuer Code: `add_guest`, `Gehört zu`, `Personen`, `Tags`, Auszählung). In-place redeployt, `/exec`-URL unverändert, per `guest_lookup` getestet.
- [x] `ADMIN_KEY` als Script-Property gesetzt (und `WEDDING_ADMIN_KEY` in `.env` — schon vorher lokal angelegt).
- [x] **Sheet-Überschriften ergänzt:** `Gehört zu` (Gäste J1), `Mitkommende` (RSVP + RSVP-Log O1). `Tags` (Personen E1) legt das Script selbst an, sobald der Tab zum ersten Mal beschrieben wird — noch nicht getestet.
- [ ] **Alles committen und pushen** (viele ungespeicherte Änderungen). GitHub Pages baut erst danach.

## P1 — Inhalt muss stimmen, bevor Gäste die Seite sehen

- [x] **KI-Platzhaltertexte überall ersetzen.** Sie klingen schlecht. Jede Sektion durchgehen
      (Story, Ablauf, FAQ, Vogtland, Wunschliste, Formulare) und in Ruths und Maxens Stimme neu schreiben.
- [x] **Story: Bilder finalisieren.** Alle Jahre prüfen (2019–2027): richtige Bilder, Reihenfolge, Größe.
- [x] **Kuchenbuffet: Platzhalter-Kuchen im Stapel ersetzen.** Das Stapel-Element zeigt noch Beispielkuchen.
- [ ] **Fotobox fertigstellen.**
  - [ ] Ruths Google Drive verknüpfen (Zielordner für die Uploads).
  - [ ] Absichern: Upload nur mit gültigem Gast-Token, nur Bilder und Videos, Größen- und Mengenlimit.
        Der Ordner bleibt privat. Die Seite legt darin nur Dateien ab und zeigt fremde Fotos nicht an.
  - [ ] Auf dem Handy mit echten Fotos testen.
- [ ] **Gästeliste importieren** (`import-guests`), dann echte QR-Codes erzeugen (`qr-batch` mit echter URL).
- [ ] **Familien verknüpfen:** `Gehört zu` für Familien und Kinder von Hand. Platzhalter-Zeilen (Nachname ohne Vorname) löschen oder benennen.

## P2 — Testen

- [ ] **End-to-End auf dem Handy:** QR-Code scannen (kein Code nötig), direkter Link (Code nötig),
      RSVP mit Mitkommenden und Allergien senden, Zeilen in `RSVP` und `Personen` prüfen.
- [ ] Tape-Player mit 3–4 Liedern testen (Tempo, Ausschlag, Spin).
- [ ] Essens-Auszählung einmal im Sheet ausführen.
- [ ] Englisch und Schwedisch: neue Elemente (Personenliste, Tape-Player) übersetzen.

## P3 — Nice to have

- [ ] Tape-Player als Easter Egg umbauen (siehe Abschnitt „Easter Eggs & Sound“ unten). Das Mockup speichert bisher nichts.
- [ ] Essenswahl als Auswahl statt Freitext.
- [ ] Echte Karte für die Anfahrt.
- [ ] Vogtland nur für Stufe 3 sperren (laut README noch offen).

## P3 — Easter Eggs & Sound

Idee: Gäste sollen sich erst wundern („warum steht hier ein Tape-Player?“), später den Zusammenhang entdecken.

### Tape-Player als Easter Egg

- [ ] **Lieblingslied unten im RSVP** (Apple-Music-Suche mit Autovervollständigung, wie bisher über die iTunes API).
      Das Lied wird der Liedwunsch des Gasts.
- [ ] **Kassette fliegt nach oben.** Sobald der Gast das Lied gewählt hat, poppt eine Kassette auf und
      fliegt hoch zum Tape-Player in der Afterparty-Sektion.
- [ ] **Tape-Player oben ist von Anfang an sichtbar, aber leer:** keine Suchleiste, keine Kassette, kein
      Bedien-UI außer dem Player selbst. Erst nach dem Einwurf lässt er sich per Play auslösen.
- [ ] **Tanz-Animation glätten.** Das Wippen zur Musik weicher machen (Übergänge, Spin, Ausschlag).
- [ ] **UI überarbeiten und durch Zeichnungen ersetzen.** Player und Kassette als gezeichnete Grafiken
      im Stil der übrigen Seite statt CSS-Formen. Zeichnungen fehlen noch.
- [ ] **Tracking im Google Sheet:** wer (Einladungs-ID, Name) hat das Easter Egg mit welchem Song
      ausgelöst. Neuer Tab, zum Beispiel `Easter Eggs` (Zeit, Einladung-ID, Name, Song, Interpret).

### Tauben

- [ ] **Tracking:** wie viele Tauben hat jeder Gast erwischt. Neuer Tab oder Spalte im Sheet
      (Einladung-ID, Name, Anzahl, Zeit). Nur senden, wenn der Gast fertig ist, nicht bei jedem Klick.

### Soundeffekte

- [ ] **Tauben flattern** (beim Auffliegen).
- [ ] **Tauben platzen** (beim Erwischen).
- [ ] **Bilder ausfalten** (Story-Fotos beim Öffnen des Fächers).
- [ ] **Glocken läuten** in der Trauung-Sektion, ca. 5 Sekunden lang, gleichzeitig mit dem Wegfliegen der Tauben
      (löst zusammen mit dem Tauben-Easter-Egg aus). Nach 5 s ausblenden, nicht abrupt abschneiden.
- [ ] Dazu klären: Tondateien beschaffen (Lizenz prüfen, kurz und klein halten), Stumm-Schalter
      anbieten, Ton nur nach einer Nutzeraktion starten (Browser erlaubt kein Autoplay), Grundzustand leise.
