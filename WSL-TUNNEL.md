# Seite vom Handy aus testen (WSL + Tunnel)

Unter WSL ist `localhost` vom Handy aus nicht erreichbar. Deshalb: lokal
einen Preview-Server starten und den per Cloudflare-Tunnel nach außen
freigeben — ergibt eine `https://...trycloudflare.com`-Adresse, die man
einfach im Handy-Browser öffnen kann.

## 1. Aktuellen Stand bauen

```
npm run build
```

Baut aus dem aktuellen Code den `dist/`-Ordner. **Wichtig:** Der
Preview-Server unten zeigt genau diesen Stand — nach jeder Code-Änderung
erst neu bauen, sonst sieht man die alte Version.

## 2. Preview-Server starten

```
npx vite preview --port 5199 --host
```

Läuft dann lokal auf `http://localhost:5199/hochzeitswebsite/`. Läuft im
Vordergrund — für Schritt 3 ein zweites Terminal öffnen (oder mit `&`
in den Hintergrund schicken).

## 3. Tunnel starten (zweites Terminal)

```
npx --yes cloudflared tunnel --url http://localhost:5199
```

Nach ein paar Sekunden erscheint im Output ein Kasten mit der
öffentlichen Adresse, z. B.:

```
Your quick Tunnel has been created!
https://irgendein-zufallsname.trycloudflare.com
```

Diese Adresse + `/hochzeitswebsite/` im Handy-Browser öffnen, z. B.:

```
https://irgendein-zufallsname.trycloudflare.com/hochzeitswebsite/
```

Zum direkten Reinspringen (Gate überspringen) `?g=alles` (oder `trauung`/
`party`) an die Adresse anhängen.

## Beenden

Beide Terminals einfach mit `Strg+C` schließen (oder die `npx`-Prozesse
beenden). Der Tunnel ist danach weg, die Adresse funktioniert nicht mehr.

## Hinweise

- **Jedes Mal eine neue Adresse** — das ist ein "Quick Tunnel" ohne
  Cloudflare-Account, die Adresse ändert sich bei jedem Neustart von
  `cloudflared`. Für eine dauerhafte Adresse bräuchte man einen (kostenlosen)
  Cloudflare-Account und einen benannten Tunnel — für schnelles Testen auf
  dem Handy reicht die Quick-Variante aber locker.
- **Kein Auto-Reload:** Änderungen am Code werden erst nach erneutem
  `npm run build` + Neustart des Preview-Servers sichtbar. Für aktives
  Entwickeln mit Live-Reload stattdessen `npm run dev` statt
  `vite preview` verwenden (dann läuft's auf Port 5173) — funktioniert mit
  demselben Tunnel-Befehl, nur die Portnummer in Schritt 3 anpassen.
- Setzt voraus, dass `npx` Internetzugriff hat (lädt `cloudflared` beim
  ersten Mal automatisch herunter).
