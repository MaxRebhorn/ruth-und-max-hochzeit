# Mobile Touch & Form Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the mobile usability issues a responsive audit (Claude in Chrome) found: form fields trigger iOS Safari's auto-zoom, several tap targets are under Apple's 44×44px minimum, and the fixed header (language flags + menu button) overlaps page content while scrolling with no safe-area padding for notched phones.

**Architecture:** Every fix is CSS-only except the header backdrop (also CSS) and the form-field type/attribute additions (markup-only, `src/raw/body.raw.html`). No JS changes. All CSS additions go inside `@media (max-width: 600px)` blocks in `src/style.css`, following the file's existing convention (see `src/style.css:461`), using `!important` where needed to win over the page's inline styles (every element in this codebase is styled inline, by design — see `CLAUDE.md`-equivalent convention: `src/raw/body.raw.html` has no external classes to hook most elements, so overriding requires `!important` the same way the existing mobile overrides already do).

**Tech Stack:** Plain CSS (`src/style.css`), hand-written HTML-in-template markup (`src/raw/body.raw.html`, `src/ablauf-entries.ts`, `src/vogtland-entries.ts`, `src/story-entries.ts`). Vite dev server on port 5173 for live verification; no test framework in this repo.

**Spec:** This plan's spec is the Claude-in-Chrome mobile responsive audit, reproduced inline in each task below — there is no separate spec doc.

## Global Constraints

- CSS-only fixes must live inside `@media (max-width: 600px)` blocks — desktop/tablet layout must not change.
- Every element in this codebase is styled via inline `style="..."` attributes (no CSS classes on content elements) — any override needs `!important` or an attribute/structural selector (`[data-x]`, `:has(...)`), matching the existing pattern at `src/style.css:461-485`.
- Don't change any element's *visible* size or appearance (flag icons, checkbox squares, button labels) — only its tap/hit area, via padding and (where the visible art must not stretch into the new padding) `background-origin: content-box`.
- Don't introduce a shared helper/component for the "Route"/"MAPS ÖFFNEN" link padding pattern — it only appears twice (`src/ablauf-entries.ts`, `src/vogtland-entries.ts`) and both already hand-roll the same inline values; fix both inline, consistent with how the codebase already duplicates this pattern rather than extracting it.

## Review Focus

- A user filling the RSVP form on an iPhone: every text field must stay at 16px+ font so Safari never auto-zooms, and zoom must not get stuck zoomed-in afterward (this is the literal failure mode the audit named — not just a font-size number to hit).
- A user scrolling past the hero on a phone: the fixed flag/menu bar must have an opaque-enough background that scrolled content doesn't visually collide with it, and on a notched phone (iPhone X+) the bar must not sit flush against the notch/status bar.
- A user tapping a checkbox label, a flag, the menu button, a "+2" photo-stack toggle, or a "Route"/"MAPS ÖFFNEN" link on a phone: the tappable area must be close to 44×44px even though the visible glyph/icon stays small — a near-miss tap must still register.
- A user whose phone offers autofill/autocomplete or a numeric/email keyboard: the email and phone RSVP fields should surface the right keyboard layout (currently both are plain `type="text"` with no `inputmode`/`autocomplete`, so the audit's font-size/height fixes alone don't fully address "the form is hard to fill on a phone").
- Nothing in this plan should affect desktop/tablet (>600px) rendering — every task's manual verification step includes a desktop check specifically to catch an `!important` rule that leaked outside its media query.

---

### Task 1: Form fields — stop iOS auto-zoom, grow tap height, add correct keyboards

**User request (from the audit):** "Eingabefelder unter 16 px... iOS Safari zoomt dann beim Antippen automatisch in die Seite hinein... Setze auf Mobile `font-size: 16px` für input, textarea und select. Die Felder sind außerdem nur etwa 28 px hoch, besser sind mindestens 44 px."

**Files:**
- Modify: `src/style.css` (new rules inside the existing `@media (max-width: 600px)` block at line 461, or a new block right after it)
- Modify: `src/raw/body.raw.html` (add `type`/`inputmode`/`autocomplete` to the email and phone fields — two `<input>` tags)

- [ ] **Step 1: Read the current mobile media query block to find the insertion point**

```
src/style.css:461:
@media (max-width: 600px) {
  [data-grow] img {
    width: min(38px, 9vw) !important;
  }
  ...
```

- [ ] **Step 2: Add the font-size and min-height override inside that block**

Insert this new rule inside the `@media (max-width: 600px) { ... }` block at `src/style.css:461` (anywhere inside the braces, e.g. right after the opening `{`):

```css
  /* Every form control is styled inline with font sizes under 16px (13.5–15px),
     which makes iOS Safari auto-zoom the whole page on focus — and the zoom
     often doesn't reset when the field blurs. 16px is the documented iOS
     threshold that disables that auto-zoom. Fields are also only ~24-28px
     tall (padding:5px/6px/7px around the text); Apple's touch target
     guideline is 44px, so pad them out without changing their visible
     appearance (border/background/placeholder text stay as-is). */
  input,
  textarea,
  select {
    font-size: 16px !important;
    min-height: 44px !important;
    box-sizing: border-box !important;
  }

  /* Checkboxes should keep their small 14-16px visual square (changing that
     would look wrong next to their label text) — only the textual inputs
     above get taller. */
  input[type='checkbox'] {
    min-height: 0 !important;
  }
```

- [ ] **Step 3: Add correct mobile keyboards for the email and phone fields**

In `src/raw/body.raw.html`, find the E-Mail field (currently `type="text" placeholder="ruth@beispiel.de"`):

```html
<input type="text" placeholder="ruth@beispiel.de" style="width:100%;border:none;border-bottom:1.5px solid rgba(91,42,16,.45);background:transparent;padding:5px 2px;font:300 14px Karla,sans-serif;outline:none">
```

becomes

```html
<input type="email" autocomplete="email" placeholder="ruth@beispiel.de" style="width:100%;border:none;border-bottom:1.5px solid rgba(91,42,16,.45);background:transparent;padding:5px 2px;font:300 14px Karla,sans-serif;outline:none">
```

And the Telefon field (currently `type="text" placeholder="0170 1234567"`):

```html
<input type="text" placeholder="0170 1234567" style="width:100%;border:none;border-bottom:1.5px solid rgba(91,42,16,.45);background:transparent;padding:5px 2px;font:300 14px Karla,sans-serif;outline:none">
```

becomes

```html
<input type="tel" inputmode="tel" autocomplete="tel" placeholder="0170 1234567" style="width:100%;border:none;border-bottom:1.5px solid rgba(91,42,16,.45);background:transparent;padding:5px 2px;font:300 14px Karla,sans-serif;outline:none">
```

(The Name field right above it can also take `autocomplete="name"` for free autofill — not strictly in the audit, but zero-risk and matches this step's intent. Add it to the Name `<input>` too: `<input type="text" autocomplete="name" placeholder="Ruth Beispiel" ...>`.)

Note: `type="email"`/`type="tel"` do **not** add browser-native validation that blocks submission here, since neither field has a `required`/`pattern` attribute — they only change which on-screen keyboard phones show. No behavior change beyond that.

- [ ] **Step 4: Type-check and build**

Run: `npm run build`
Expected: no errors (this is markup-in-a-template-string plus CSS, so `tsc` won't catch markup mistakes — the build passing only confirms nothing else broke; Step 5 is the real check).

- [ ] **Step 5: Manual verification**

With the dev server running (`npx vite --host`) on a real phone or Chrome DevTools device emulation (iPhone SE/12/14 preset):
1. Open the RSVP form (Anmeldung section), tap the Name/E-Mail/Telefon/Essen-Allergien/song-search text fields one at a time — the page must not zoom in on any of them.
2. Confirm the E-Mail field brings up the `@`-equipped email keyboard and the Telefon field brings up the numeric phone keypad (visible in DevTools' emulated keyboard hint, or directly on a phone).
3. Confirm each text field is visibly taller than before (compare against the `release`/`main` branch) but the checkboxes did **not** grow.
4. Resize back to desktop width (>600px) and confirm nothing changed there — fonts, field heights, and checkbox sizes must match `main`.

- [ ] **Step 6: Commit**

```bash
git add src/style.css src/raw/body.raw.html
git commit -m "Mobile: 16px Formularfelder gegen iOS-Zoom, groessere Tipphoehe, richtige Tastatur fuer E-Mail/Telefon"
```

---

### Task 2: Enlarge undersized tap targets (flags, menu, photo-stack toggle, "Route"/"MAPS ÖFFNEN" links, checkbox labels)

**User request (from the audit):** "Zu kleine Tippflächen (Apple empfiehlt mindestens 44×44 px). Das betrifft: die drei Sprach-Flaggen (34×23 px) und den Menü-Button (34×28 px), die „+2"/„+1"-Buttons an den Polaroids (alle etwa 30 px hoch), die Links „MAPS ÖFFNEN" und „KUCHEN ANMELDEN" (je etwa 29 px hoch), die Checkboxen, die klein gerendert werden. Hier reichen `min-height: 44px` oder zusätzliches Padding, der Hitbox-Bereich darf größer sein als die sichtbare Fläche."

**Note on "KUCHEN ANMELDEN":** that's actually the Kuchenbuffet submit `<button>` (`src/raw/body.raw.html:201`, `padding:13px;font:400 26px/1 Caveat,cursive`) — at 26px line-height plus 13px padding top and bottom it's already comfortably over 44px tall. The ~29px height the audit measured belongs to the **"Route"/"MAPS ÖFFNEN" links** instead (`src/ablauf-entries.ts:112`, `src/vogtland-entries.ts:43`), which this task fixes. No change needed to the submit button.

**Files:**
- Modify: `src/style.css` (flags, menu button, checkbox label hit area — all via a new `@media (max-width: 600px)` block)
- Modify: `src/story-entries.ts:55` (photo-stack "+N" toggle button height)
- Modify: `src/ablauf-entries.ts:112` (Ablauf "MAPS ÖFFNEN"-style link padding)
- Modify: `src/vogtland-entries.ts:43` ("Route" link padding)

- [ ] **Step 1: Read the three language-flag buttons and the menu button**

```
src/raw/body.raw.html:8:
<button data-lang-btn="de" onClick="{{ setDe }}" aria-label="Deutsch" style="width:34px;height:23px;border-radius:3px;border:1.5px solid #5b2a10;cursor:pointer;padding:0;background-repeat:no-repeat;background-size:100% 100%;background-color:#ffce00;background-image:...">
```
(`data-lang-btn="en"` and `="sv"` are the same shape, different flag gradients — see `src/raw/body.raw.html:9-10`.)
```
src/raw/body.raw.html:12:
<button onClick="{{ toggleNav }}" aria-label="Menü" style="display:flex;flex-direction:column;gap:5px;width:34px;padding:6px 2px;background:none;border:none;cursor:pointer">
```

- [ ] **Step 2: Add a mobile-only CSS block that pads the flags' and menu's hit area without stretching their visible art**

Add this new block in `src/style.css`, after the existing `@media (max-width: 600px) { ... }` block that ends around line 541 (the Vogtland/hero bouquet rules) — i.e. as its own, separate `@media (max-width: 600px) { ... }`:

```css
/* The three language flags and the menu button are 34x23-34x28px — under
   Apple's 44px touch-target guideline. Their *visible* size must not change
   (bigger flags/hamburger bars would look wrong), so the hit area grows via
   padding instead, with background-origin:content-box keeping each flag's
   background graphic locked to its original 34x23 box instead of stretching
   into the new padding. */
@media (max-width: 600px) {
  [data-lang-btn] {
    padding: 7px !important;
    background-origin: content-box !important;
    background-clip: content-box !important;
  }

  /* The menu button's own padding (6px 2px) plus its three 2px bars and
     5px gaps only add up to ~28px tall; pad it out to 44px. */
  button[aria-label='Menü'] {
    padding: 13px 10px !important;
  }
}
```

- [ ] **Step 3: Enlarge checkbox label hit areas**

In the same new `@media (max-width: 600px)` block from Step 2, add:

```css
  /* Every RSVP/Kuchenbuffet/Überraschung checkbox is wrapped in a <label>
     that already toggles the box when its text is tapped (native label
     behavior) — but the label's own box is only as tall as one line of
     13.5px/12px text (~18-20px). Pad the label itself so the full tappable
     row is close to 44px, without resizing the checkbox square itself. */
  label:has(> input[type='checkbox']) {
    min-height: 44px !important;
    padding-block: 6px !important;
  }
```

- [ ] **Step 4: Enlarge the photo-stack "+N" toggle button**

Read `src/story-entries.ts:55`:
```ts
    toggleLabel !== null
      ? `<button type="button" data-fan-toggle-btn style="position:absolute;left:0;right:0;bottom:0;height:26px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font:400 17px/1 Caveat,cursive;color:rgba(91,42,16,.6);letter-spacing:.04em"><span data-fanoc="open">${toggleLabel}</span><span data-fanoc="more">&#187;</span><span data-fanoc="close">&#215;</span></button>`
```

Change `height:26px` to `height:44px`:
```ts
    toggleLabel !== null
      ? `<button type="button" data-fan-toggle-btn style="position:absolute;left:0;right:0;bottom:0;height:44px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font:400 17px/1 Caveat,cursive;color:rgba(91,42,16,.6);letter-spacing:.04em"><span data-fanoc="open">${toggleLabel}</span><span data-fanoc="more">&#187;</span><span data-fanoc="close">&#215;</span></button>`
```

This button is `position:absolute` over the bottom of the photo already (`renderLeaf`'s own padding already reserves `padding:8px 8px 26px` at the bottom for it — see `src/story-entries.ts:59` — so the touch area grows without pushing any other layout; this is the same footprint the desktop view already keeps clear). No desktop-only guard needed — this makes the button easier to tap everywhere, which is also fine on desktop (it's a click target there too).

- [ ] **Step 5: Enlarge the "Route" link (`vogtland-entries.ts`)**

Read `src/vogtland-entries.ts:43`:
```ts
    ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entry.karte)}" target="_blank" rel="noreferrer" style="display:inline-block;margin-top:8px;font:500 10.5px/1 Karla,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#a8562f;border-bottom:1.5px solid rgba(168,86,47,.5);padding:13px 6px 4px;margin:-13px -6px -2px;text-decoration:none">${langSpans('Route', 'route', 'vägen')}</a>`
```

The existing `padding:13px 6px 4px` plus 10.5px line-height is only ~28px tall. Bump the padding (keeping the matching negative `margin` so it doesn't push layout) to `padding:20px 6px 11px;margin:-20px -6px -9px` (20+10.5+11 ≈ 44px):

```ts
    ? `<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entry.karte)}" target="_blank" rel="noreferrer" style="display:inline-block;margin-top:8px;font:500 10.5px/1 Karla,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#a8562f;border-bottom:1.5px solid rgba(168,86,47,.5);padding:20px 6px 11px;margin:-20px -6px -9px;text-decoration:none">${langSpans('Route', 'route', 'vägen')}</a>`
```

- [ ] **Step 6: Enlarge the Ablauf "MAPS ÖFFNEN"/link (`ablauf-entries.ts`)**

Read `src/ablauf-entries.ts:112`:
```ts
    ? `<a href="${linkHref}"${linkAttrs} style="display:inline-block;margin-top:6px;font:500 11px/1 Karla,sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:13px 6px 4px;margin:-13px -6px -2px;border-bottom:1.5px solid rgba(168,86,47,.5)"><span class="line-halo">${langSpans(entry.linktext.de, entry.linktext.en, entry.linktext.sv)}</span></a>`
```

Same adjustment (11px line-height this time, same target padding works): `padding:13px 6px 4px;margin:-13px -6px -2px` → `padding:20px 6px 11px;margin:-20px -6px -9px`:

```ts
    ? `<a href="${linkHref}"${linkAttrs} style="display:inline-block;margin-top:6px;font:500 11px/1 Karla,sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:20px 6px 11px;margin:-20px -6px -9px;border-bottom:1.5px solid rgba(168,86,47,.5)"><span class="line-halo">${langSpans(entry.linktext.de, entry.linktext.en, entry.linktext.sv)}</span></a>`
```

- [ ] **Step 7: Type-check and build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 8: Manual verification**

With the dev server running, in Chrome DevTools device emulation (phone width ≤600px):
1. Inspect each flag button and the menu button in DevTools — the computed box (including padding) should be close to 44×44px, while the visible flag/hamburger-bar graphic is still the original small size (not stretched).
2. Tap each checkbox's label text near its edge (not dead-center on the tiny square) — it should still toggle the checkbox.
3. Open "Unsere Geschichte", tap a "+2"/"+1" photo stack — the toggle button's tappable strip at the bottom of the photo should be visibly taller than before.
4. Open "Ablauf" and the Vogtland guide (if reachable in the current build) and tap near the edges of "Route"/the Ablauf map link — it should register even when not tapped dead-center on the text.
5. Switch DevTools back to a desktop width (>600px) and confirm the flags, menu button, and checkboxes look pixel-identical to `main` — only the Ablauf/Vogtland link padding and the photo-stack button height are desktop-visible too (by design, see Step 4/5/6) — confirm those still look reasonable there (slightly taller tap strip, not visually broken).

- [ ] **Step 9: Commit**

```bash
git add src/style.css src/story-entries.ts src/ablauf-entries.ts src/vogtland-entries.ts
git commit -m "Mobile: Tippflaechen fuer Flaggen, Menue, Checkboxen, Fotostapel-Toggle und Kartenlinks auf ~44px vergroessert"
```

---

### Task 3: Fixed header gets a backdrop and safe-area padding

**User request (from the audit):** "Flaggen und Menü liegen fix über dem Text. Beim Scrollen überdecken Flaggen und Hamburger-Icon den Inhalt... Ein kleiner Hintergrund oder eine feste Leiste mit `env(safe-area-inset-top)` würde das beheben, sonst sitzt der Bereich auf dem iPhone mit Notch zu nah am Rand."

**Files:**
- Modify: `index.html` (viewport meta — add `viewport-fit=cover`, required for `env(safe-area-inset-top)` to return a non-zero value at all on an iPhone)
- Modify: `src/raw/body.raw.html:5` (the fixed header wrapper)

- [ ] **Step 1: Add `viewport-fit=cover` to the viewport meta tag**

Read `index.html:5`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```

Without this, `env(safe-area-inset-top)` always evaluates to `0px` on iOS even where a real inset exists (the page isn't "fullscreen" without `viewport-fit=cover`, so Safari never reports an inset) — the padding added in Step 2 would silently do nothing on exactly the phones it's meant to fix.

- [ ] **Step 2: Give the fixed header a background and safe-area top padding**

Read `src/raw/body.raw.html:5`:
```html
<div style="position:fixed;top:0;left:0;right:0;z-index:50;display:flex;justify-content:center;pointer-events:none">
```

```html
<div style="position:fixed;top:0;left:0;right:0;z-index:50;display:flex;justify-content:center;pointer-events:none;background:linear-gradient(to bottom,#f6f1e7 65%,rgba(246,241,231,0));padding-top:env(safe-area-inset-top,0px)">
```

A solid background would hide the paper texture right at the top edge and look like a harsh bar; a gradient fading from the page's own paper color (`#f6f1e7`, matching the card background set at `src/raw/body.raw.html:3`) down to transparent keeps scrolled content from visually colliding with the flags/menu while staying soft, matching the site's existing aesthetic (soft shadows/gradients elsewhere, e.g. the card's own `background-image` radial gradients at line 3). `padding-top: env(safe-area-inset-top, 0px)` pushes the whole bar down below the notch/status bar on phones that report one, and is a no-op (0px) everywhere else — this is the documented pattern (also already used as guidance in this project's own conventions for anything `position:fixed` to the top).

- [ ] **Step 3: Type-check and build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 4: Manual verification**

With the dev server running:
1. In Chrome DevTools, open device emulation for "iPhone 14 Pro" (has a Dynamic Island/notch) and confirm the flags/menu bar sits visibly below the island, not flush against it.
2. Scroll the page down with that same emulated phone — confirm the hero text/content doesn't read as "popping through" the header as it scrolls under it; the gradient should visibly soften the transition.
3. Switch to desktop width (>600px) — the gradient background is harmless there too (same code, no media query — intentional, since the header is `position:fixed` everywhere), but confirm it doesn't look out of place against the desktop layout's wider card.
4. Confirm the flags/menu button are still clickable/tappable after this change (the new `background` must not have `pointer-events` issues — the inner row already has `pointer-events:auto` at `src/raw/body.raw.html:6`, only the outer full-width wrapper has `pointer-events:none`, so this should be unaffected, but click each flag once to be sure).

- [ ] **Step 5: Commit**

```bash
git add index.html src/raw/body.raw.html
git commit -m "Mobile: Fixierte Kopfzeile bekommt Hintergrund und Safe-Area-Abstand fuer Notch-Handys"
```
