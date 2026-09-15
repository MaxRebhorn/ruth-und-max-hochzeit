# Ruth & Max — Hochzeitswebsite

Static site (Vite + TypeScript, no UI framework), hosted on GitHub Pages.
Google Apps Script + Google Sheets is the intended eventual backend. See
`technical-spec.md` for the full feature spec and
`/home/mrebhorn/.claude/plans/fancy-puzzling-deer.md` (or ask Claude) for the
implementation plan this repo follows.

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

### Real backend (RSVP + Kuchenbuffet)

RSVP and Kuchenbuffet submissions now persist for real via Google Apps
Script + Sheets (`apps-script/apps-script.gs`), **without touching any
markup/CSS** — `src/app.ts`'s existing envelope-close animation and cake
tower DOM updates run exactly as before, with a fire-and-forget `fetch()`
POST added alongside. The RSVP form has no `name`/email attributes in the
mockup's own markup, so fields are read **positionally** (see the table in
`src/app.ts`'s `persistRsvp()`) and submissions are **append-only** — no
per-guest upsert, since there's no email to key on. The cake tower now
hydrates from a real `kuchen_list` GET on boot (falls back to the 2 demo
cakes if `public/config/config.json`'s `appsScriptUrl` is still a
placeholder or the fetch fails), so it reflects real submissions across
visitors and sessions once deployed.

Access is still the mockup's own 3-tier secret-word gate (trauung/party/
alles) — a `?g=<code>` URL already unlocks instantly with no form shown at
all, which is all three shareable QR links need. Generate them with
`npm run wedding -- qr --tier alles --out alles.png` (see the CLI section).

### Not yet wired up (later phase, per `technical-spec.md`)

- The spec's 4-level QR/token **+** name/email background-check access
  system — deliberately skipped for now in favor of the simpler 3-tier
  instant-unlock above.
- Essenswahl, Liedwunsch (Spotify search), Überraschung, Übernachtung, Frage
  stellen — spec-only forms with no mockup design yet.
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
npm run wedding -- qr --tier alles --out qr_alles.png
```

Generates a QR code (and prints the plain link) for one of the three tiers
(`trauung`, `party`, `alles`) using `public/config/config.json`'s `siteUrl`.
