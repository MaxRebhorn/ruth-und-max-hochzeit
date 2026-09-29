# KI-Platzhaltertexte — zum Ersetzen

Stand: 2026-09-29. Alles hier klingt nach KI oder ist ein offener Platzhalter.
Jede Zeile zeigt die Datei und die aktuelle Stelle. Text in eigenen Worten
ersetzen, dann diese Datei löschen.

## Kontaktdaten (fiktiv, unbedingt vor Live-Gang ersetzen)

- `src/content/trauzeugen.md` — `witness1email: lena@beispiel.de`
- `src/content/trauzeugen.md` — `witness2phone: 0170 1234 5678` / `witness2tel: +4917012345678`
- `src/content/trauzeugen.md` — `deinnameplatzhalter: Ruth Beispiel`
- `src/content/trauzeugen.md` — `kontaktplatzhalter: ruth@beispiel.de · 0170 1234567`
- `src/content/ueberraschung.md` — `vonwemplatzhalter: Ruth Beispiel`
- `src/content/ueberraschung.md` — `kontaktplatzhalter: ruth@beispiel.de · 0170 1234567`
- `src/content/frage-stellen.md` — `antwortanplatzhalter: ruth@beispiel.de`

Prüfen: sind `Lena (für Ruth)` und `Jonas (für Max)` die echten Trauzeugen,
oder auch nur Platzhalternamen? Nur Telefon/E-Mail sehen erfunden aus.

## Offene Lücken (Autor hat "später ausfüllen" markiert)

- `src/content/faq.md` — Frage "Wo kann ich parken?" hat `hinweis: [Details ergänzen]`
- `src/photos/ablauf/2-ankommen/entry.md` — `hinweis: [Uhrzeit ergänzen]`
- `src/content/ueberraschung.md` — `donehinweis: [dieses formular hat sich selbst zerstört]`
  (könnte Absicht/Scherz sein — trotzdem gegenlesen)

## Story — "Unsere Geschichte" (`src/photos/story/*/entry.md`)

Deutscher Text liest sich schon persönlich, die EN/SV-Kurzfassungen sind
knappe Ein-Zeiler, wirken generisch:

- `2019` — EN: "we met online — first messages, gaming together, endless phone calls"
- `2021` — EN: "we met in person for the first time"
- `2022-02-24` — EN: "we officially became a couple"
- `2022-07-interrail` — EN: "we crossed Europe by Interrail"
- `2023` — EN: "we both moved to Dresden"
- `2024-normandie` — EN: "we travelled to Normandy with friends"
- `2025` — EN: "we moved into our first shared flat"
- `2026-05-23-antrag` — EN: "the proposal followed"
- `2027` — EN/SV volle Absätze ("The story does not end with the engagement...")
  wirken übersetzt statt in eigener Stimme geschrieben

## Vogtland-Guide (`src/photos/vogtland-guide/*/entry.md`)

- **Bug, kein Text-Problem:** `4-bad-schlema` und `5-bad-schlema` haben
  identischen Inhalt (Titel, Ort, Text) — einer der beiden Ordner ist wohl
  ein Duplikat oder sollte einen anderen Ort zeigen.
- Alle 5 Karten (Brücke, Talsperre, Burg Mylau, Bad Schlema ×2) klingen wie
  aus einer Reisebroschüre generiert ("Das Vogtland-Meer", "für fünf Minuten
  Mittelalter") — gegenlesen, ob das Ruths/Max' Ton trifft oder umformuliert
  werden soll.

## Platzhalter-Bilder

Alle Orte ohne Bild zeigen `noch kein Bild` (in `vogtland-entries.ts` und
`ablauf-entries.ts`) — kein Text zum Ersetzen, aber Reminder: echte Fotos
fehlen noch für mehrere Vogtland-Karten und ggf. Ablauf-Punkte.

## Nicht geprüft / vermutlich schon original

- `src/content/faq.md` — restliche 3 Fragen (Kleidung, Kinder, Zusagefrist)
  wirken schon wie echte Antworten, kein KI-Ton erkennbar.
- Haupttexte in `src/raw/body.raw.html` (Hero, RSVP-Intro, Fotobox-Hinweis
  etc.) — klingen bereits persönlich, keine Änderung vorgeschlagen.
