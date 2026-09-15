# FAQ & Geschenke-Blacklist — eine Markdown-Datei pro Liste

Anders als bei "Unsere Geschichte", "Ablauf" und dem Vogtland-Guide (ein
Ordner pro Eintrag, weil da jeweils ein Foto dazugehört) reichen hier zwei
einfache Textdateien, weil kein Foto nötig ist:

- **`faq.md`** — jede Frage im FAQ-Bereich
- **`wunschliste-blacklist.md`** — die "bitte nicht"-Liste in der
  Wunschliste

**Neuen Eintrag hinzufügen:** einfach unten in der Datei anhängen, getrennt
durch eine Zeile mit genau `====` (vier Gleichheitszeichen) von den anderen
Einträgen. Reihenfolge in der Datei = Reihenfolge auf der Seite.

## `faq.md` — Format pro Eintrag

```
frage: Wo kann ich parken?

Am Hof gibt es Plätze direkt an der Zufahrt.
```

`frage:` ist Pflicht, danach eine Leerzeile, dann die Antwort als Fließtext.
Optional ein `hinweis:` für einen kleinen gelben Hinweis-Kasten unter der
Antwort (z. B. `[Details ergänzen]`, solange etwas noch fehlt).

## `wunschliste-blacklist.md` — Format pro Eintrag

```
Handtücher & Bettwäsche
```

Nur ein kurzer Satz oder Begriff, keine Felder nötig.

## Übersetzung (beide Dateien gleich)

Wie überall: `---en---`/`---sv---` darunter, gleiche Felder, fehlt eine
Übersetzung, wird Deutsch angezeigt.

```
frage: Wo kann ich parken?

Am Hof gibt es Plätze direkt an der Zufahrt.

---en---
frage: Where can I park?

There is parking right by the farm entrance.

====

frage: nächste Frage ...
```
