# Ablauf (Tagesplan) — jeder Ordner ist ein eigener Programmpunkt

Genau wie bei "Unsere Geschichte": jeder Unterordner hier wird automatisch zu
einem Punkt im Ablauf. **Neuer Ordner = neuer Programmpunkt**, ohne Code.

**Neuen Punkt hinzufügen:**
1. Neuen Ordner anlegen, z. B. `ablauf/5-brautstrauss/` — die Zahl vorn
   bestimmt nur die Reihenfolge (wird nirgends angezeigt).
2. Darin eine `entry.md` mit den Feldern unten.
3. Ein Bild reinlegen (Zeichnung/Symbol für diesen Punkt) — beliebiger
   Dateiname, wie bei den Fotos.

**`entry.md`-Felder** (jede Zeile `feld: wert`, dann eine Leerzeile, dann
optional Fließtext):

| Feld | Pflicht? | Bedeutung |
|---|---|---|
| `zeit` | nein | z. B. `11:00` oder `ab 21:00`. Fehlt es, wird stattdessen der Titel groß angezeigt. |
| `titel` | ja | Überschrift des Punkts |
| `ort` | nein | Ortsname (klein darunter angezeigt) |
| `karte` | nein | Suchbegriff für den "Maps öffnen"-Link (Google Maps). Ohne `karte` erscheint kein Kartenlink. |
| `link` | nein | Interner Link statt Karte, z. B. `#kuchen` (für einen Link zu einer anderen Sektion der Seite) |
| `linktext` | nein | Text für den Link, Standard "Maps öffnen" |
| `hinweis` | nein | Kleiner gelber Hinweis-Kasten, z. B. `[Uhrzeit ergänzen]` |
| `tier` | nein | `alle` (Standard, immer sichtbar) / `party` (nur ab Party-Einladung) / `ganzer-tag` (nur bei ganzer-Tag-Einladung) |
| `doves` | nein | `ja` nur beim Kirche-Punkt lassen — startet das Tauben-Easter-Egg |

Danach folgt optional ein Absatz Freitext (Beschreibung).

Übersetzung wie überall: `---en---`/`---sv---` darunter, gleiche Felder,
fehlt eine, wird Deutsch angezeigt.

**Zwei Bilder in einem Ordner?** Werden wie bei der Afterparty übereinander
gezeigt (Hauptbild + kleineres Bild darunter, leicht überlappend).
