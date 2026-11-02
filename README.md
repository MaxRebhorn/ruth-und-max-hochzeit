# Ruth & Max — Hochzeitswebsite

Static site (Vite + TypeScript, no UI framework), hosted on GitHub Pages.
Google Apps Script + Google Sheets is the intended eventual backend. See
`technical-spec.md` for the full feature spec, `ARCHITECTURE.md` for how the
Sheets backend that exists today is actually laid out (data structures +
request flows, with diagrams).

## Current phase: 1:1 mockup port

The site right now is a faithful, interactive port of the Claude Design
mockup (`design/wedding-website-ui-mockups/`) — same markup, same CSS, same
guest-tier word-gate, same animations. The spec's 4-level QR/email access
system, real Apps Script persistence, and the extra forms it defines
(Essenswahl, Liedwunsch, Überraschung, Übernachtung, Frage stellen) are a
later phase — see "Not yet wired up" below.

### How the port works

Rather than hand-re-deriving the mockup's styles and layout (which drifted
badly from the real design the first time around), the site is built by
**literally reusing the mockup's own HTML and CSS**:

- `src/raw/body.raw.html` — the mockup's actual body markup, extracted
  verbatim from `design/.../Ruth und Max Hochzeit.dc.html` (only the
  Claude-Design-editor-only `data-comment-anchor` attributes stripped, plus a
  handful of `data-*` hook attributes added for our own JS to find elements —
  see the `data-w`, `data-cd`, `data-lang-btn`, `data-tier-color`,
  `data-cake-*`, `data-envelope-*`, `data-photobox`, `data-gate-error` hooks).
- `src/raw/style.raw.css` — the mockup's `<style>` block, copied verbatim
  into `src/style.css` (converted to a normal formatted stylesheet, same
  rules).
- `src/dc-engine.ts` — a tiny runtime for the subset of the mockup's own
  templating syntax that survives in the raw HTML: `{{ identifier }}`
  interpolation, `<sc-if>` (kept in the DOM and toggled via
  `[data-if]`/`display`, never re-rendered — re-rendering would blow away
  scroll-reveal state and in-flight CSS transitions elsewhere on the page),
  `<sc-for>` (used once, for the cake tower), `onClick`/`onSubmit` → real
  event listeners, and `<image-slot>` → a plain `<img>` or placeholder box.
- `src/app.ts` — the actual state machine (guest-tier gate, language switch,
  countdown, envelope-opening animation, RSVP/Kuchenbuffet forms, photo-fan
  and postcard accordions, the Ablauf connector line layout, the dove
  easter egg), a straight imperative port of the mockup's own
  `class Component extends DCLogic` script — same algorithms, same timings,
  just plain DOM APIs instead of the prototype's React runtime.

**If you need to change how a section looks**, prefer editing
`src/raw/body.raw.html` / `src/raw/style.raw.css` over hand-writing new
markup — that's what keeps this in sync with the design.

### Real backend (RSVP, Kuchenbuffet, Überraschung, Frage stellen, die Trauzeugen)

All five forms persist for real via Google Apps Script + Sheets
(`apps-script/apps-script.gs`), **without touching any markup/CSS** beyond
adding an E-Mail/Telefon field to RSVP (see below) — everything else is a
`fetch()` POST alongside the existing UI. See `technical-spec.md` §1–3 for
the full design; short version:

- Guests are identified by a **per-invitation token**, not a shared
  tier-word. A QR link (`?t=<token>`) or a 6-character fallback code (typed
  into the gate) both resolve to `{ name, stufe, token }` via Apps Script's
  `guest_lookup` action — see `src/app.ts`'s `initGuest()`/`gateSubmit()`.
  That token then rides along on every submission as the upsert key.
- **RSVP** upserts by that token (merge-only — a blank field in a
  resubmission never blanks out a previously-filled one), plus every raw
  submission also lands in an untouched `RSVP-Log` tab. Fields are still
  read **positionally** off the form (no `name` attributes in the mockup's
  markup) — see the index table in `src/app.ts`'s `persistRsvp()`.
- **Kuchenbuffet, Fragen, Überraschungen, Trauzeugen-Nachrichten** stay
  append-only, same as before, each submission tagged with the guest's
  token where relevant.
- Überraschungen/Trauzeugen-Nachrichten live in a **separate spreadsheet
  file** from RSVP/Kuchen/Fragen — same Google account, just not one Ruth
  or Max would open day-to-day, since the whole point of that section is
  they aren't supposed to see it.
- The cake tower hydrates from a real `kuchen_list` GET on boot (falls back
  to the 2 demo cakes if `public/config/config.json`'s `appsScriptUrl` is
  still a placeholder or the fetch fails).

Setting up the guest list (`Gäste` tab, token/code generation) is documented
in `apps-script/README.md`.

### Not yet wired up (later phase, per `technical-spec.md`)

- Essenswahl, Liedwunsch (Spotify search), Übernachtung — no form built yet;
  their columns are already reserved on the `RSVP` tab so wiring them up
  later doesn't need another sheet migration.
- Real MapLibre map for Anfahrt, real Google Drive photo upload for Fotos,
  level-3 gating on Vogtland.

## Adding real photos

Drop-in photo folders under `src/photos/` — any filename, any format, no
code changes needed. See `src/photos/README.md` (written for Ruth/Max, not
just developers). Photos are picked up at build time (`import.meta.glob` in
`src/photos.ts`), so they need a rebuild/redeploy to show up live.

Three sections are fully folder-driven the same way — a new subfolder with
an `entry.md` becomes a new item automatically, no code change needed:

- **Story timeline** (`src/photos/story/*/`, `src/story-entries.ts`) —
  sorted by folder name, no fixed limit on photo count (overflow beyond 3
  wraps into extra stacks). Format: `src/photos/README.md`.
- **Ablauf / day schedule** (`src/photos/ablauf/*/`, `src/ablauf-entries.ts`)
  — supports time/title/place/map-link/tier-gating fields, plus a `doves:
  ja` flag for the flying-doves easter egg. Format: `src/photos/ablauf/README.md`.
- **Vogtland guide** (`src/photos/vogtland-guide/*/`,
  `src/vogtland-entries.ts`) — postcard letter badges (A, B, C, …) assign
  themselves automatically. Format: `src/photos/vogtland-guide/README.md`.

All three use the same folder-name-prefix sort convention and the same
`---en---`/`---sv---` translation-section format (shared parser:
`src/entry-format.ts`).

Two more lists are folder-free — no photo belongs to an entry, so it's one
markdown file per list instead, with entries separated by a `====` line:

- **FAQ** (`src/content/faq.md`, `src/faq-entries.ts`)
- **Wunschliste "bitte nicht"-Liste** (`src/content/wunschliste-blacklist.md`,
  `src/wunschliste-entries.ts`)

Format: `src/content/README.md`.

## Develop

```
npm install
npm run dev
```

## Build & deploy

`npm run build` outputs to `dist/`. Pushing to `main` builds and deploys to
GitHub Pages automatically via `.github/workflows/deploy.yml`.

The Apps Script backend (for the next phase) deploys separately — see
`apps-script/README.md`.

## Design sync

`design/wedding-website-ui-mockups/` is a reference-only snapshot of the
Claude Design handoff bundle — never deployed. When new changes are made in
Claude Design, re-export the bundle over this folder and `git diff` it to see
exactly what changed, then re-run the extraction that produced
`src/raw/body.raw.html`/`src/raw/style.raw.css` (see git history around the
commit that introduced them for the exact `sed`/`python3` steps) and reapply
the `data-*` hook additions.

`reference/` holds real, rendered screenshots of the mockup (not our
reimplementation) for visual comparison — see `reference/README.md`.

## CLI

```
npm run wedding -- generate-qr Thomas 3 [--base <url>]
npm run wedding -- qr --token <einladungs-token> --out qr_einzelperson.png
npm run wedding -- qr-batch --csv gaeste-export.csv --outDir qr/
```

`generate-qr <Name> <1|2|3>` (1=trauung, 2=+party, 3=+alles) is the
one-guest-at-a-time path: generates a fresh Token/Code locally, writes the
QR to `transfer/<name>.png` (git-ignored), and prints a ready-to-paste
`Gäste`-tab row — it does **not** write to the live sheet itself (see the
comment in `cli/generate-qr.mjs` for why: the `/exec` URL is public, so a
remote "add guest" action would be an effectively unauthenticated way to
inject rows). Paste the printed row into `Gäste` with `Einladung-ID` left
blank, then run the sheet's own "Tokens & Codes für neue Gäste erzeugen"
menu to fill that in.

`qr` makes one QR code for a token you already have (e.g. already in the
`Gäste` tab). `qr-batch` reads a CSV export of the whole `Gäste` tab
(Google Sheets → File → Download → .csv) and writes one PNG per row, named
`<Einladung-ID>-<name>.png`. All three use `public/config/config.json`'s
`siteUrl` unless `--base <url>` overrides it (handy for testing against a
tunnel without touching the committed config).
