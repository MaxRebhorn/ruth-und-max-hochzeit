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

### Not yet wired up (next phase)

- Real backend: RSVP/Kuchenbuffet submissions are local-only (exactly like
  the mockup — nothing is persisted), matching the prototype's own behavior.
  `src/api.ts`, `public/content/`, `public/config/`, and `apps-script/`
  already contain a first pass at the spec's real data layer from an earlier
  session, but nothing in `app.ts` calls them yet.
- The spec's 4-level QR/email access system (currently: the mockup's own
  3-tier secret-word gate).
- Essenswahl, Liedwunsch (Spotify search), Überraschung, Übernachtung, Frage
  stellen — spec-only forms with no mockup design yet.
- Real MapLibre map for Anfahrt, real Google Drive photo upload for Fotos,
  level-3 gating on Vogtland.

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

## CLI (for the next phase)

```
npm run wedding -- qr --level 2 --out qr_stufe2.png
WEDDING_CLI_TOKEN=... npm run wedding -- mail --subject "…" --body "…"
```
