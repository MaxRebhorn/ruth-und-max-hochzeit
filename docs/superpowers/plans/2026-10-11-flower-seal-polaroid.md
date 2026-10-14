# Flower Grow-In / Loading Seal / Polaroid No-Pop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Change the decorative flower bloom-in to grow outward from the page edge it's anchored to (instead of zooming in from its own center), make the envelope loading seal's "full" state strictly tied to every first-paint image actually finishing, and stop the story-timeline polaroid photo stacks from fading/sliding in on scroll.

**Architecture:** All three changes are small, surgical edits to the existing vanilla TS/CSS site (no framework, no test runner in this repo — `tsc --noEmit` is the only build check, so each task's verification is a concrete manual check against the running dev server). No new files, no new dependencies.

**Tech Stack:** TypeScript (`src/app.ts`), hand-written HTML-in-template markup (`src/raw/body.raw.html`, `src/story-entries.ts`), plain CSS (`src/style.css`). Vite dev server, already running on port 5173.

**Spec:** This plan's spec is the three numbered requests from the user, reproduced inline in each task below — there is no separate spec doc.

## Global Constraints

- No new npm dependencies.
- No new test framework — this repo has none (`package.json` only runs `tsc --noEmit` + `vite build`); verification is a scripted manual check in the browser via the running dev server.
- Don't touch `[data-grow]` elements — they're already `display:none !important` ("removed per request") and out of scope.
- Don't touch `[data-corner]` (RSVP corner flowers) — deliberately excluded from bloom already, per the comment at `src/app.ts:556`.
- Preserve every flower's existing on-screen position and static `rotate`/`scaleX` art direction exactly — only the grow-in animation's pivot point changes.

## Review Focus

- Flipped/rotated flowers (the ones using `transform:scaleX(-1) rotate(...)`) must not visibly jump to a new screen position once the origin changes — this is why Task 1 moves the static transform onto an inner `<img>` instead of changing the existing element's origin directly.
- `fitBouquetsForPhone()` (phone-width text-collision shrinking) must keep working after Task 1's markup change, since it resizes the same elements Task 1 wraps.
- The CSS `:has()` selectors in `src/style.css` that currently match `img[data-bq]` will silently stop matching anything once Task 1 turns those into wrapper `<div data-bq>` — must be updated in the same task, not forgotten.
- Task 2's "wait for everything" list must include decorative CSS `background-image` art, not just `<img>` tags, or the seal can still show full while a background graphic is still loading.
- Task 3's fix must only remove the animation from the photo stack, not from the row's text — the user only complained about photos popping in.

---

### Task 1: Flower bloom grows from its page-edge anchor, not its own center

**User request:** "Fix the flower animations — currently they have a zoom-in kinda popup, I'd rather have them grow in with the origin set as their stem, so they grow in from the sides of the page."

**Why a wrapper is required:** The bloom animation drives the CSS `scale` property, which shares `transform-origin` with the element's own `transform` (`rotate`/`scaleX`). Every bloom flower already has a static `rotate` and/or `scaleX(-1)` baked into its inline `style="transform:..."`. If the bloom code just changes `transform-origin` on that same element, the existing rotate/mirror would also pivot around the new off-center point and visibly relocate the flower. The fix: split "static art direction" (rotate/mirror, stays on the `<img>`) from "grow-in animation" (scale + opacity + origin, moves to a new wrapper `<div>` that has no rotate/mirror of its own).

**Files:**
- Modify: `src/raw/body.raw.html` (14 occurrences of `<img data-bq="1" ...>` / `<img data-bloom="1" ...>`)
- Modify: `src/app.ts:411` (`fitBouquetsForPhone`'s selector)
- Modify: `src/app.ts:558` (bloom selector + the forEach that sets initial scale/opacity)
- Modify: `src/style.css:558` and `src/style.css:569` (`:has()` selectors)

- [ ] **Step 1: Confirm the full list of affected markup**

Run:
```
grep -oE '<img data-b(q|loom)="1"[^>]*>' src/raw/body.raw.html | nl
```
Expected: 14 lines, matching the list in Step 2 below (confirms nothing has drifted since this plan was written).

- [ ] **Step 2: Rewrite each of the 14 images in `src/raw/body.raw.html`**

The transform rule for every occurrence: everything in the original `style="..."` except `transform` and `transform-origin` moves to a new wrapper `<div data-bq="1" ...>` (or `data-bloom="1"`), unchanged. `height:auto` stays on the wrapper. The `<img>` keeps only `src`, `alt`, `aria-hidden`, and gets `style="display:block;width:100%;height:auto"` plus the original `transform:...` value if the original had one (drop any `transform-origin:50% 50%` — no longer needed, the default origin on the static `<img>` is fine since it never animates).

Apply this to each of the 14 occurrences:

1. `<img data-bloom="1" src="assets/flowers/flower-two-rand.svg" alt="" aria-hidden="true" style="position:absolute;left:-13%;top:-15%;width:clamp(300px,58vw,560px);height:auto;pointer-events:none;z-index:0;transform:rotate(90deg);transform-origin:50% 50%">`
   →
   `<div data-bloom="1" style="position:absolute;left:-13%;top:-15%;width:clamp(300px,58vw,560px);height:auto;pointer-events:none;z-index:0"><img src="assets/flowers/flower-two-rand.svg" alt="" aria-hidden="true" style="display:block;width:100%;height:auto;transform:rotate(90deg)"></div>`

2. `<img data-bloom="1" src="assets/flowers/corners/corner-4.svg" alt="" aria-hidden="true" style="position:absolute;left:-30px;top:64%;width:clamp(120px,25vw,210px);height:auto;pointer-events:none;z-index:0">`
   →
   `<div data-bloom="1" style="position:absolute;left:-30px;top:64%;width:clamp(120px,25vw,210px);height:auto;pointer-events:none;z-index:0"><img src="assets/flowers/corners/corner-4.svg" alt="" aria-hidden="true" style="display:block;width:100%;height:auto"></div>`

3. `<img data-bloom="1" src="assets/flowers/flower-two-rand.svg" alt="" aria-hidden="true" style="position:absolute;right:-15%;top:24%;width:clamp(260px,50vw,480px);height:auto;pointer-events:none;z-index:0;transform:scaleX(-1) rotate(90deg);transform-origin:50% 50%">`
   →
   `<div data-bloom="1" style="position:absolute;right:-15%;top:24%;width:clamp(260px,50vw,480px);height:auto;pointer-events:none;z-index:0"><img src="assets/flowers/flower-two-rand.svg" alt="" aria-hidden="true" style="display:block;width:100%;height:auto;transform:scaleX(-1) rotate(90deg)"></div>`

4. `<img data-bq="1" src="assets/flowers/flower-two-rand.svg" alt="" aria-hidden="true" style="position:absolute;left:calc(-0.5 * clamp(260px,44vw,440px));top:85%;width:clamp(260px,44vw,440px);height:auto;pointer-events:none;z-index:-1;transform:rotate(-20deg)">`
   →
   `<div data-bq="1" style="position:absolute;left:calc(-0.5 * clamp(260px,44vw,440px));top:85%;width:clamp(260px,44vw,440px);height:auto;pointer-events:none;z-index:-1"><img src="assets/flowers/flower-two-rand.svg" alt="" aria-hidden="true" style="display:block;width:100%;height:auto;transform:rotate(-20deg)"></div>`

5. `<img data-bq="1" src="assets/flowers/flower-two-rand.svg" alt="" aria-hidden="true" style="position:absolute;left:calc(50% - var(--col-half, 50vw) - 0.3 * clamp(340px,58vw,560px));top:22%;width:clamp(340px,58vw,560px);height:auto;pointer-events:none;z-index:-1;transform:rotate(-8deg)">`
   →
   `<div data-bq="1" style="position:absolute;left:calc(50% - var(--col-half, 50vw) - 0.3 * clamp(340px,58vw,560px));top:22%;width:clamp(340px,58vw,560px);height:auto;pointer-events:none;z-index:-1"><img src="assets/flowers/flower-two-rand.svg" alt="" aria-hidden="true" style="display:block;width:100%;height:auto;transform:rotate(-8deg)"></div>`

6. `<img data-bq="1" src="assets/flowers/blumen-4.svg" alt="" aria-hidden="true" style="position:absolute;left:72%;top:6%;width:52%;transform:rotate(12deg);height:auto;pointer-events:none;z-index:-1">`
   →
   `<div data-bq="1" style="position:absolute;left:72%;top:6%;width:52%;height:auto;pointer-events:none;z-index:-1"><img src="assets/flowers/blumen-4.svg" alt="" aria-hidden="true" style="display:block;width:100%;height:auto;transform:rotate(12deg)"></div>`

7. `<img data-bq="1" src="assets/flowers/blumen-4.svg" alt="" aria-hidden="true" style="position:absolute;left:-31%;top:27%;width:52%;transform:rotate(-20deg);height:auto;pointer-events:none;z-index:-1">`
   →
   `<div data-bq="1" style="position:absolute;left:-31%;top:27%;width:52%;height:auto;pointer-events:none;z-index:-1"><img src="assets/flowers/blumen-4.svg" alt="" aria-hidden="true" style="display:block;width:100%;height:auto;transform:rotate(-20deg)"></div>`

8. `<img data-bq="1" src="assets/flowers/card-5.svg" alt="" aria-hidden="true" style="position:absolute;left:calc(50% - var(--col-half, 50vw) - 0.38 * clamp(170px,27vw,380px));top:8%;width:clamp(170px,27vw,380px);height:auto;pointer-events:none;z-index:-1">`
   →
   `<div data-bq="1" style="position:absolute;left:calc(50% - var(--col-half, 50vw) - 0.38 * clamp(170px,27vw,380px));top:8%;width:clamp(170px,27vw,380px);height:auto;pointer-events:none;z-index:-1"><img src="assets/flowers/card-5.svg" alt="" aria-hidden="true" style="display:block;width:100%;height:auto"></div>`

9. `<img data-bq="1" src="assets/flowers/flower-two-rand.svg" alt="" aria-hidden="true" style="position:absolute;right:calc(50% - var(--col-half, 50vw) - 0.3 * clamp(260px,44vw,640px));top:24%;width:clamp(260px,44vw,640px);height:auto;pointer-events:none;z-index:-1;transform:scaleX(-1)">`
   →
   `<div data-bq="1" style="position:absolute;right:calc(50% - var(--col-half, 50vw) - 0.3 * clamp(260px,44vw,640px));top:24%;width:clamp(260px,44vw,640px);height:auto;pointer-events:none;z-index:-1"><img src="assets/flowers/flower-two-rand.svg" alt="" aria-hidden="true" style="display:block;width:100%;height:auto;transform:scaleX(-1)"></div>`

10. `<img data-bq="1" src="assets/flowers/blume-6.svg" alt="" aria-hidden="true" style="position:absolute;left:calc(50% - var(--col-half, 50vw) - 0.34 * clamp(260px,38vw,450px));top:30%;width:clamp(260px,38vw,450px);height:auto;pointer-events:none;z-index:-1;transform:rotate(48deg)">`
    →
    `<div data-bq="1" style="position:absolute;left:calc(50% - var(--col-half, 50vw) - 0.34 * clamp(260px,38vw,450px));top:30%;width:clamp(260px,38vw,450px);height:auto;pointer-events:none;z-index:-1"><img src="assets/flowers/blume-6.svg" alt="" aria-hidden="true" style="display:block;width:100%;height:auto;transform:rotate(48deg)"></div>`

11. `<img data-bq="1" src="assets/flowers/flower-one.svg" alt="" aria-hidden="true" style="position:absolute;right:calc(50% - var(--col-half, 50vw) - 0.3 * clamp(280px,44vw,500px));top:52%;width:clamp(280px,44vw,500px);height:auto;pointer-events:none;z-index:-1;transform:rotate(-8deg)">`
    →
    `<div data-bq="1" style="position:absolute;right:calc(50% - var(--col-half, 50vw) - 0.3 * clamp(280px,44vw,500px));top:52%;width:clamp(280px,44vw,500px);height:auto;pointer-events:none;z-index:-1"><img src="assets/flowers/flower-one.svg" alt="" aria-hidden="true" style="display:block;width:100%;height:auto;transform:rotate(-8deg)"></div>`

12. `<img data-bq="1" src="assets/flowers/side-links.svg" alt="" aria-hidden="true" style="position:absolute;left:calc(50% - var(--col-half, 50vw) - 0.405 * calc(var(--col-half, 480px) * 1.14));top:calc(var(--col-half, 480px) * 0.455);width:calc(var(--col-half, 480px) * 1.14);height:auto;pointer-events:none;z-index:-1">`
    →
    `<div data-bq="1" style="position:absolute;left:calc(50% - var(--col-half, 50vw) - 0.405 * calc(var(--col-half, 480px) * 1.14));top:calc(var(--col-half, 480px) * 0.455);width:calc(var(--col-half, 480px) * 1.14);height:auto;pointer-events:none;z-index:-1"><img src="assets/flowers/side-links.svg" alt="" aria-hidden="true" style="display:block;width:100%;height:auto"></div>`

13. `<img data-bq="1" src="assets/flowers/side-rechts.svg" alt="" aria-hidden="true" style="position:absolute;right:calc(50% - var(--col-half, 50vw) - 0.17 * calc(var(--col-half, 480px) * 0.97));top:calc(var(--col-half, 480px) * 0.30);width:calc(var(--col-half, 480px) * 0.97);height:auto;pointer-events:none;z-index:-1">`
    →
    `<div data-bq="1" style="position:absolute;right:calc(50% - var(--col-half, 50vw) - 0.17 * calc(var(--col-half, 480px) * 0.97));top:calc(var(--col-half, 480px) * 0.30);width:calc(var(--col-half, 480px) * 0.97);height:auto;pointer-events:none;z-index:-1"><img src="assets/flowers/side-rechts.svg" alt="" aria-hidden="true" style="display:block;width:100%;height:auto"></div>`

14. `<img data-bq="1" src="assets/flowers/flower-two-rand.svg" alt="" aria-hidden="true" style="position:absolute;right:calc(50% - var(--col-half, 50vw) - 0.3 * clamp(220px,34vw,480px));top:58%;width:clamp(150px,34vw,480px);height:auto;pointer-events:none;z-index:-1;transform:scaleX(-1) rotate(-16deg)">`
    →
    `<div data-bq="1" style="position:absolute;right:calc(50% - var(--col-half, 50vw) - 0.3 * clamp(220px,34vw,480px));top:58%;width:clamp(150px,34vw,480px);height:auto;pointer-events:none;z-index:-1"><img src="assets/flowers/flower-two-rand.svg" alt="" aria-hidden="true" style="display:block;width:100%;height:auto;transform:scaleX(-1) rotate(-16deg)"></div>`

- [ ] **Step 3: Update the two CSS `:has()` selectors in `src/style.css`**

At `src/style.css:558`:
```css
section:has(> img[data-bq]) {
```
becomes
```css
section:has(> [data-bq]) {
```

At `src/style.css:569`:
```css
div:has(> section > img[data-bq]) {
```
becomes
```css
div:has(> section > [data-bq]) {
```

- [ ] **Step 4: Update `fitBouquetsForPhone()`'s selector in `src/app.ts:411`**

```ts
const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img[data-bq], img[data-bloom]'));
```
becomes
```ts
const imgs = Array.from(root.querySelectorAll<HTMLElement>('[data-bq], [data-bloom]'));
```
(type narrows from `HTMLImageElement` to `HTMLElement` since these are now `<div>`s — nothing else in that function uses an `HTMLImageElement`-only member, it only reads `.style`, `.dataset`, `.offsetWidth`, `.offsetParent`, `.getBoundingClientRect()`, all present on `HTMLElement`.)

- [ ] **Step 5: Update the bloom selector and add the edge-origin assignment in `src/app.ts`, around line 558**

Current:
```ts
  const bouquets = Array.from(root.querySelectorAll<HTMLElement>('img[data-bq], img[data-bloom]'));
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    bouquets.forEach((el, i) => {
      el.style.scale = '0.4';
      el.style.opacity = '0';
      el.style.transition = `opacity 1.2s ease ${(i % 3) * 140}ms, scale 2s cubic-bezier(.2,.9,.25,1) ${(i % 3) * 140}ms`;
    });
```
becomes
```ts
  const bouquets = Array.from(root.querySelectorAll<HTMLElement>('[data-bq], [data-bloom]'));
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    bouquets.forEach((el, i) => {
      // Grow in from whichever page edge the flower is anchored to (its "stem"), not from its own
      // center — every bouquet wrapper has either `left` or `right` set (see Step 2's markup).
      el.style.transformOrigin = el.style.right ? '100% 50%' : '0% 50%';
      el.style.scale = '0.4';
      el.style.opacity = '0';
      el.style.transition = `opacity 1.2s ease ${(i % 3) * 140}ms, scale 2s cubic-bezier(.2,.9,.25,1) ${(i % 3) * 140}ms`;
    });
```

- [ ] **Step 6: Type-check**

Run: `npm run build`
Expected: no TypeScript errors (this also catches any leftover `HTMLImageElement`-only usage from Step 4).

- [ ] **Step 7: Manual verification in the browser**

With the dev server running (`npx vite --host`, already up on port 5173) and the tunnel pointed at it:
1. Open the site, let the envelope open (or replay the intro).
2. Scroll to "Unsere Geschichte" (section 02) and watch the bottom-left flower bloom in — it should visibly grow outward from the left edge of the page toward the center, not expand outward from its own middle.
3. Scroll to "Anmeldung" (section 06) and "FAQ" (section 05) — same check, confirming both a `left`-anchored and a `right`-anchored flower (FAQ has one of each) grow from their respective edges.
4. Confirm no flower has visibly shifted position or changed its rotation/mirroring compared to `main` before this change — use the tunnel on a phone and compare side-by-side with `git stash` if anything looks off.
5. Resize the browser down to phone width and confirm `fitBouquetsForPhone()` still shrinks/hides bouquets that collide with text (unchanged behavior, just re-verify it didn't break).

- [ ] **Step 8: Commit**

```bash
git add src/raw/body.raw.html src/app.ts src/style.css
git commit -m "Blumen wachsen vom Seitenrand statt aus der Mitte zu zoomen"
```

---

### Task 2: Loading seal only reaches "full" once every first-paint resource (especially images) has actually loaded

**User request:** "Loading Button system — the Seal should really only be full once all resources, especially images, are loaded."

**What's already in place (read `setupLoadingSeal` in `src/app.ts:752-830` before touching anything):** The seal already forces every `<img>` in the DOM to `loading = 'eager'` and builds a promise list covering every image's `load`/`error` event, `assets/paper.png`, `assets/siegel.jpg`, `document.fonts.ready`, the window `load` event, and the guest-config fetch — and the fill animation (`shown`) is mathematically capped below 1 until every one of those promises has resolved (or a 60 s safety-net deadline passes). This task is a **gap audit + fix**, not a rewrite — most of the request is already implemented correctly.

**The one confirmed gap:** The watercolour divider graphic (`assets/flowers/trenner-rechts.svg`) is painted as a CSS `background-image` on `.flower-divider::before`/`::after` (`src/style.css:518`), not as an `<img>`, so it's invisible to the `imgs.forEach(...)` scan and never added to the wait list — the seal can show "full" while that background is still downloading.

**Files:**
- Modify: `src/app.ts:782-789` (the `tasks` array inside `setupLoadingSeal`)

- [ ] **Step 1: Read the current task list to find the exact insertion point**

```ts
  const tasks: Promise<unknown>[] = [
    ...imgs.map((img) => settle(img)),
    settle(undefined, 'assets/paper.png'),
    settle(undefined, 'assets/siegel.jpg'),
    document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => window.addEventListener('load', r, { once: true })), // CSS backgrounds, scripts
    document.fonts?.ready ?? Promise.resolve(),
    guestReady.catch(() => undefined)
  ];
```

- [ ] **Step 2: Add the missing background-image resource**

```ts
  const tasks: Promise<unknown>[] = [
    ...imgs.map((img) => settle(img)),
    settle(undefined, 'assets/paper.png'),
    settle(undefined, 'assets/siegel.jpg'),
    settle(undefined, 'assets/flowers/trenner-rechts.svg'),
    document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => window.addEventListener('load', r, { once: true })), // CSS backgrounds, scripts
    document.fonts?.ready ?? Promise.resolve(),
    guestReady.catch(() => undefined)
  ];
```

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 4: Manual verification — throttled network, watch the seal against the Network panel**

1. With the dev server running, open Chrome DevTools → Network tab → set throttling to "Slow 3G".
2. Hard-reload the page (DevTools → Network → "Disable cache" checked, then reload).
3. Watch the seal: it must stay a dull, unfilled grey/red the entire time any row in the Network panel for an image (`.svg`, `.png`, `.jpg`) is still "Pending"/loading.
4. The seal should only reach full dark-red fill (cursor becomes a pointer, the "open" hint appears) at or after the moment the last image request in the Network panel finishes — not before.
5. Switch throttling back to "No throttling" and reload again — the seal should still visibly pour (not snap instantly to full), confirming the animation isn't purely time-based.

- [ ] **Step 5: Commit**

```bash
git add src/app.ts
git commit -m "Ladesiegel wartet zusaetzlich auf den Bluetenranken-Hintergrund"
```

---

### Task 3: Polaroid photo stacks in "Unsere Geschichte" no longer fade/slide in — they're always visible

**User request:** "Combine with the previous [sic — this task is independent, see note below]: the polaroid image cards should have no loading animation — they should all exist when scrolling down, not popping in."

**Note on scope:** The user's message groups this with Task 2 under one numbered point, but it's a separate, unrelated piece of code (scroll-reveal, not resource loading) — treated here as its own task so it has its own clean verification step, per this plan's task-sizing rule.

**Root cause:** `src/story-entries.ts`'s `renderRow()` wraps the *entire* row — photo stack **and** text together — in one `data-reveal="1"` element (`src/story-entries.ts:136`). `initReveal()` (`src/app.ts:495-536`) sets `opacity:0` + `translateY(26px)` on every `[data-reveal]` element and only clears it once that element scrolls into view. Because CSS `opacity` on a parent dims its entire subtree as a group (a child's own `opacity:1` can't undo an ancestor's `opacity:0`), the photo stack fades in lock-step with the text even though nothing in the photo-stack markup itself asks for that. The fix is to move `data-reveal="1"` off the row wrapper and onto just the text block, so the photo stack is a plain, permanently-visible sibling.

**Files:**
- Modify: `src/story-entries.ts:136` and `:139` (`renderRow`)

- [ ] **Step 1: Read the current markup**

```ts
  return `
<div data-reveal="1" style="position:relative;display:flex;justify-content:${justify};padding-bottom:14px"><div style="position:absolute;${dotSide}:30.5%;top:50%;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;background:#f6f1e7;border:2.4px solid rgba(91,42,16,.55)"></div>
<div style="width:min(100%,540px);display:flex;flex-wrap:wrap;flex-direction:${flexDir};align-items:center;gap:22px;text-align:${textAlign}">
${cluster}
<div style="flex:1 1 190px;min-width:0"><p class="story-label" style="margin:0;font:400 60px/.9 Caveat,cursive"><span class="line-halo">${entry.label}</span></p><p class="story-text" style="margin:8px 0 0;font:300 14px/1.65 Karla,sans-serif;text-wrap:pretty"><span class="line-halo">${langSpans(entry.text)}</span></p></div>
</div>
</div>`;
```

- [ ] **Step 2: Move `data-reveal="1"` from the row wrapper to the text block**

```ts
  return `
<div style="position:relative;display:flex;justify-content:${justify};padding-bottom:14px"><div style="position:absolute;${dotSide}:30.5%;top:50%;width:13px;height:13px;margin:-6.5px 0 0 -6.5px;border-radius:50%;background:#f6f1e7;border:2.4px solid rgba(91,42,16,.55)"></div>
<div style="width:min(100%,540px);display:flex;flex-wrap:wrap;flex-direction:${flexDir};align-items:center;gap:22px;text-align:${textAlign}">
${cluster}
<div data-reveal="1" style="flex:1 1 190px;min-width:0"><p class="story-label" style="margin:0;font:400 60px/.9 Caveat,cursive"><span class="line-halo">${entry.label}</span></p><p class="story-text" style="margin:8px 0 0;font:300 14px/1.65 Karla,sans-serif;text-wrap:pretty"><span class="line-halo">${langSpans(entry.text)}</span></p></div>
</div>
</div>`;
```

Note: the little timeline dot (the absolutely-positioned circle) was also inside the old `data-reveal` wrapper and will now always be visible too instead of fading in with the row — this is a desired side effect (the connecting timeline shouldn't disappear/reappear either), not a regression; call it out in the commit message so it isn't mistaken for scope creep later.

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 4: Manual verification**

1. With the dev server running, open "Unsere Geschichte" and do a hard reload with the section scrolled below the fold (so it starts off-screen).
2. Scroll down slowly into the section: the polaroid photo stacks must already be fully visible and in their final position from the moment they enter the viewport — no fade, no slide, no scale.
3. The text label/paragraph next to each stack should still fade+slide in as before (unchanged behavior — only the photos lost the animation).
4. Repeat for the closing (photo-less) row at the end of the timeline — it has no photo stack, so nothing should visibly change there.

- [ ] **Step 5: Commit**

```bash
git add src/story-entries.ts
git commit -m "Polaroid-Fotostapel in der Geschichte immer sichtbar, kein Pop-in mehr"
```
