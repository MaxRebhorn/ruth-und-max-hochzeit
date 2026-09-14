# Fotos einfügen — ohne Code

Für jedes Foto auf der Seite gibt es einen Ordner. Einfach die Bilddatei(en)
reinziehen — **egal wie die Datei heißt**, kein Umbenennen nötig (funktioniert
z. B. direkt mit dem, was WhatsApp beim Teilen erzeugt). Die Seite nimmt sie
beim nächsten Bauen automatisch in der Reihenfolge, in der sie im Ordner
liegen. Ist ein Ordner leer, bleibt einfach der Platzhaltertext stehen, das
ist kein Fehler.

**Empfehlung:** Fotos vorher verkleinern (max. ca. 1600px breite Seite,
JPEG). Ein Handyfoto direkt aus der Kamera ist oft 5–15 MB — verkleinert
reichen 200–500 KB locker für die Bildschirmgröße hier.

## Unsere Geschichte (die Foto-Stapel im Zeitstrahl)

Jeder Zeitstrahl-Eintrag zeigt bis zu 3 Fotos (Publikum sieht sie als
aufklappbaren Stapel mit "+2"-Knopf). Legt bis zu 3 Dateien in den
passenden Ordner:

| Zeitstrahl-Eintrag | Ordner |
|---|---|
| 2019 — online kennengelernt | `story/2019/` |
| 2021 — erstes echtes Treffen | `story/2021/` |
| 24.02.2022 — offiziell zusammen | `story/2022-02-24/` |
| Juli 2022 — Interrail | `story/2022-07-interrail/` |
| 2023 — Umzug nach Dresden | `story/2023/` |
| Sommer 2024 — Normandie | `story/2024-normandie/` |
| 2025 — erste gemeinsame Wohnung | `story/2025/` |
| 23.05.2026 — der Antrag | `story/2026-05-23-antrag/` |
| 2027 — die Hochzeit | `story/2027/` |

Nur ein Foto für einen Eintrag? Ein File reicht — der "+2"-Knopf verschwindet
automatisch, wenn nur 1 Foto da ist.

## Andere Fotos (nur 1 Bild pro Ordner)

| Wofür | Ordner |
|---|---|
| Anfahrt-Karte / gezeichneter Wegplan | `anfahrt-karte/` |
| Göltzschtalbrücken-Zeichnung (Vogtland-Sektion) | `vogtland-zeichnung/` |

## Wichtig: nach dem Einfügen einmal neu bauen

Die Fotos werden beim **Bauen** der Seite eingesammelt (`npm run build` bzw.
automatisch bei jedem Push, siehe `.github/workflows/deploy.yml`) — nicht
live im Browser. Also: Fotos reinlegen, committen & pushen (oder Claude
bitten, es zu tun), dann sind sie online.

## Vogtland-Ausflugsfotos & Siegel/Deko

Die vier Vogtland-Fotos (Brücke, Talsperre, Burg, Bad Schlema) und die
Deko-Grafiken (Blumen, Tauben, Siegel usw.) liegen woanders
(`public/assets/vogtland/`, `public/assets/flowers/`, …) und sind schon
fertig da — die müsst ihr nicht anfassen, außer ihr wollt sie ersetzen (dann
die gleichnamige Datei überschreiben).
