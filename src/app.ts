import bodyRawHtml from './raw/body.raw.html?raw';
import { render, bindEvents, applyLang, setConditional, type Values } from './dc-engine';

type Tier = 'trauung' | 'party' | 'alles';
type Lang = 'de' | 'en' | 'sv';

const GUEST_CODES: Record<Tier, string[]> = {
  trauung: ['trauung', 'kirche', 'glockenschlag', 'glocke'],
  party: ['tanz', 'tanzschuh', 'party', 'discokugel'],
  alles: ['ganzertag', 'ganzer tag', 'sonnenaufgang', 'hochzeit', 'kuchengabel']
};

const CAKE_TYPES: Record<string, [string, string]> = {
  Kuchen: ['#ecd8b4', '#c07a44'],
  Torte: ['#f3e4cf', '#a8562f'],
  'Muffins / Kleingebäck': ['#f0dfc0', '#c98b4b'],
  Herzhaftes: ['#eadfc6', '#8d7a4e'],
  Getränk: ['#e3ecef', '#6f93a4']
};

interface Cake {
  name: string;
  who: string;
  slices: number;
  kind: string;
}

const state = {
  phase: 0,
  letterVisible: true,
  navOpen: false,
  sent: false,
  cakeSent: false,
  cakes: [
    { name: 'Käsekuchen', who: 'Oma Renate', slices: 16, kind: 'Kuchen' },
    { name: 'Schokotorte', who: 'Familie Beispiel', slices: 12, kind: 'Torte' }
  ] as Cake[],
  lang: 'de' as Lang,
  knock: 0,
  desktop: false,
  guest: null as Tier | null,
  admin: false,
  gateError: '',
  fanOpen: {} as Record<number, number>,
  postActive: 0,
  pops: 0,
  best: 0
};

let root: HTMLElement;

function resolveCode(raw: string): Tier | 'admin' | null {
  const v = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-zäöüß ]/g, '');
  if (!v) return null;
  if (v === 'ruthundmax') return 'admin';
  for (const tier of Object.keys(GUEST_CODES) as Tier[]) {
    if (tier === v || GUEST_CODES[tier].includes(v)) return tier;
  }
  return null;
}

function applyGuest(tier: Tier | null): void {
  document.documentElement.setAttribute('data-guest', tier ?? 'none');
  if (tier) {
    try {
      localStorage.setItem('rm-guest', tier);
    } catch {
      /* private mode */
    }
  }
  state.guest = tier;
  setConditional(root, 'gateOpen', !tier);
  refreshAdminPanel();
  setTimeout(layoutAblaufLine, 60);
}

function initGuest(): void {
  let tier: Tier | null = null;
  let admin = false;
  try {
    const p = new URLSearchParams(location.search).get('g');
    const resolved = p ? resolveCode(p) : null;
    if (resolved === 'admin') {
      admin = true;
      tier = 'alles';
    } else if (resolved) {
      tier = resolved;
    }
    if (!tier) {
      const cached = localStorage.getItem('rm-guest');
      if (cached === 'trauung' || cached === 'party' || cached === 'alles') tier = cached;
    }
    if (localStorage.getItem('rm-admin') === '1') admin = true;
  } catch {
    /* private mode */
  }
  if (admin) {
    try {
      localStorage.setItem('rm-admin', '1');
    } catch {
      /* private mode */
    }
  }
  state.admin = admin;
  applyGuest(tier);
}

function refreshAdminPanel(): void {
  const onAndSet = state.admin && !!state.guest;
  setConditional(root, 'adminOn', onAndSet);
  const ink = (t: Tier) => (state.guest === t ? '#a8562f' : 'rgba(91,42,16,.75)');
  (['trauung', 'party', 'alles'] as Tier[]).forEach((t) => {
    root.querySelectorAll<HTMLElement>(`[data-tier-color="${t}"]`).forEach((el) => (el.style.color = ink(t)));
  });
}

// -- language -----------------------------------------------------------

function setLang(lang: Lang): void {
  state.lang = lang;
  applyLang(root, lang);
  root.querySelectorAll<HTMLElement>('[data-lang-btn]').forEach((el) => {
    el.style.opacity = el.dataset.langBtn === lang ? '1' : '.4';
  });
}

// -- nav ------------------------------------------------------------------

function toggleNav(): void {
  state.navOpen = !state.navOpen;
  setConditional(root, 'navOpen', state.navOpen);
}

// -- countdown --------------------------------------------------------------

const WEDDING_DATE = new Date(2027, 7, 7, 11, 0, 0).getTime();

function tickCountdown(): void {
  const diff = Math.max(0, WEDDING_DATE - Date.now());
  const pad = (n: number) => String(n).padStart(2, '0');
  const set = (key: string, val: string) => root.querySelectorAll<HTMLElement>(`[data-cd="${key}"]`).forEach((el) => (el.textContent = val));
  set('d', String(Math.floor(diff / 86400000)));
  set('h', pad(Math.floor(diff / 3600000) % 24));
  set('m', pad(Math.floor(diff / 60000) % 60));
  set('s', pad(Math.floor(diff / 1000) % 60));
}

// -- responsive (desktop breakpoint) -----------------------------------------

function applyResponsive(): void {
  const d = window.innerWidth >= 860;
  state.desktop = d;
  const vals: Record<string, string> = {
    cardMax: d ? '1180px' : '100%',
    headerAlign: d ? 'center' : 'flex-start',
    navPanelMax: d ? '360px' : '100%',
    contentMax: d ? '640px' : '430px',
    ablaufMax: d ? '1040px' : '430px',
    formMax: d ? '560px' : '430px'
  };
  root.querySelectorAll<HTMLElement>('[data-w]').forEach((el) => {
    const key = el.dataset.w!;
    if (vals[key] !== undefined) el.style.maxWidth = vals[key];
  });
  root.querySelectorAll<HTMLElement>('[data-align="headerAlign"]').forEach((el) => (el.style.alignItems = vals.headerAlign));
  const card = root.querySelector<HTMLElement>('[data-w="cardMax"]');
  if (card) card.style.boxShadow = d ? '0 0 60px rgba(70,45,20,.22)' : 'none';
}

// -- Ablauf connector line (matches the mockup's layoutAblaufLine()) --------

function layoutAblaufLine(): void {
  const svg = root.querySelector<SVGSVGElement>('[data-ablauf-line]');
  const wrap = root.querySelector<HTMLElement>('[data-ablauf-items]');
  if (!svg || !wrap) return;
  const box = wrap.getBoundingClientRect();
  const items = Array.from(wrap.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el.hasAttribute('data-reveal') && el.offsetParent !== null && getComputedStyle(el).display !== 'none'
  );
  const vb = `0 0 ${Math.max(1, box.width).toFixed(0)} ${Math.max(1, box.height).toFixed(0)}`;
  let d = '';
  for (let i = 0; i < items.length - 1; i++) {
    const a = items[i].firstElementChild as HTMLElement | null;
    const b = items[i + 1].firstElementChild as HTMLElement | null;
    if (!a || !b) continue;
    const ra = a.getBoundingClientRect();
    const rb = b.getBoundingClientRect();
    const x1 = ra.left + ra.width / 2 - box.left;
    const y1 = ra.bottom - box.top - ra.height * 0.22;
    const x2 = rb.left + rb.width / 2 - box.left;
    const y2 = rb.top - box.top + rb.height * 0.22;
    if (y2 - y1 < 10) continue;
    const dy = Math.max(26, (y2 - y1) * (items.length <= 2 ? 0.92 : 0.62));
    d += `M${x1.toFixed(1)} ${y1.toFixed(1)} C ${x1.toFixed(1)} ${(y1 + dy).toFixed(1)} ${x2.toFixed(1)} ${(y2 - dy).toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)} `;
  }
  svg.setAttribute('viewBox', vb);
  const path = svg.querySelector('path');
  if (path) path.setAttribute('d', d || 'M0 0');
}

// -- scroll reveal (matches initReveal()) ------------------------------------

function initReveal(): void {
  const blocks = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
  blocks.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(26px)';
    el.style.transition = 'opacity .7s ease, transform .9s cubic-bezier(.2,.9,.25,1)';
  });

  const lineWrap = root.querySelector<HTMLElement>('[data-line-wrap]');
  if (lineWrap) {
    const onScroll = () => {
      const r = lineWrap.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (window.innerHeight * 0.86 - r.top) / (r.height * 0.72)));
      lineWrap.style.clipPath = `inset(0 0 ${((1 - p) * 100).toFixed(1)}% 0)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const grows = Array.from(root.querySelectorAll<HTMLElement>('[data-grow]'));
  grows.forEach((el) => {
    const delay = parseInt(el.dataset.grow || '0', 10);
    el.style.opacity = '0';
    el.style.transform = 'scale(.3) rotate(-16deg)';
    el.style.transition = `opacity 1s ease ${delay}ms, transform 1.5s cubic-bezier(.2,.9,.25,1) ${delay}ms`;
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.querySelectorAll<HTMLElement>('[data-fly]').forEach((n) => (n.style.animationPlayState = 'running'));
        io.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.15 }
  );
  blocks.forEach((el) => io.observe(el));

  const showGrow = (el: HTMLElement) => {
    el.style.opacity = '1';
    el.style.transform = 'none';
  };
  const hosts = new Set(grows.map((el) => el.parentElement).filter((x): x is HTMLElement => !!x));
  const growIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll<HTMLElement>(':scope > [data-grow]').forEach(showGrow);
        growIo.unobserve(entry.target);
      });
    },
    { threshold: 0, rootMargin: '0px 0px -8% 0px' }
  );
  hosts.forEach((el) => growIo.observe(el));
  requestAnimationFrame(() =>
    grows.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) showGrow(el);
    })
  );
}

// -- photo fan (unsere Geschichte) -------------------------------------------

function fanToggle(n: number): void {
  const stack = root.querySelector<HTMLElement>(`[data-fan-id="${n}"]`);
  if (!stack) return;
  const cur = state.fanOpen[n] || 0;
  const set = (v: number) => {
    state.fanOpen[n] = v;
    stack.setAttribute('data-open', String(v));
  };
  if (cur === 2) {
    set(1);
    setTimeout(() => set(0), 190);
  } else {
    set(cur + 1);
  }
}

// -- Vogtland postcards -------------------------------------------------------

function postToggle(n: number): void {
  const cur = state.postActive === n ? 0 : n;
  state.postActive = cur;
  root.querySelectorAll<HTMLElement>('[data-post-id]').forEach((el) => {
    el.setAttribute('data-active', el.dataset.postId === String(cur) ? '1' : '0');
  });
}

// -- doves easter egg ---------------------------------------------------------

let flockBusy = false;

function flyFlock(_e: Event): void {
  if (flockBusy) return;
  const wrap = root.querySelector<HTMLElement>('[data-flock]');
  if (!wrap) return;
  let longest = 0;
  wrap.querySelectorAll<HTMLElement>('[data-fly]').forEach((n) => {
    const a = n.style.animation;
    n.style.display = '';
    n.style.animation = 'none';
    void n.offsetWidth;
    n.style.animation = a;
    n.style.animationPlayState = 'running';
    const cs = getComputedStyle(n);
    const secs = (s: string) =>
      (s || '')
        .split(',')
        .reduce((m, v) => Math.max(m, parseFloat(v) || 0), 0);
    longest = Math.max(longest, secs(cs.animationDuration) + secs(cs.animationDelay));
  });
  flockBusy = true;
  setTimeout(() => (flockBusy = false), Math.max(1200, longest * 1000 + 200));
}

function popDove(e: Event): void {
  e.stopPropagation();
  const n = e.currentTarget as HTMLElement;
  if (!n || n.dataset.popped) return;
  n.dataset.popped = '1';
  const r = n.getBoundingClientRect();
  const host = (n.offsetParent as HTMLElement) || document.body;
  const hr = host.getBoundingClientRect();
  const cx = r.left - hr.left + r.width / 2;
  const cy = r.top - hr.top + r.height / 2;
  const burst = document.createElement('div');
  burst.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;width:0;height:0;pointer-events:none;z-index:4`;
  for (let i = 0; i < 11; i++) {
    const ang = (i / 11) * Math.PI * 2 + Math.random() * 0.5;
    const d = 26 + Math.random() * 40;
    const w = 5 + Math.random() * 5;
    const f = document.createElement('div');
    f.style.cssText =
      `position:absolute;left:0;top:0;width:${w.toFixed(1)}px;height:${(w * 2.1).toFixed(1)}px;` +
      `border-radius:60% 60% 50% 50%/70% 70% 40% 40%;background:#f6f1e7;border:1px solid #5b2a10;` +
      `--fx:${(Math.cos(ang) * d).toFixed(1)}px;--fy:${(Math.sin(ang) * d - 10).toFixed(1)}px;` +
      `--fr:${Math.round(-200 + Math.random() * 400)}deg;animation:puff ${(0.7 + Math.random() * 0.5).toFixed(2)}s cubic-bezier(.2,.7,.3,1) both`;
    burst.appendChild(f);
  }
  host.appendChild(burst);
  n.style.display = 'none';
  setTimeout(() => {
    burst.remove();
    delete n.dataset.popped;
  }, 1400);
  countPop();
}

function countPop(): void {
  state.pops += 1;
  try {
    state.best = Math.max(state.best, parseInt(localStorage.getItem('rm-dove-best') || '0', 10) || 0);
    if (state.pops > state.best) {
      state.best = state.pops;
      localStorage.setItem('rm-dove-best', String(state.best));
    }
  } catch {
    /* private mode */
  }
  root.querySelectorAll<HTMLElement>('[data-pop-score]').forEach((el) => (el.textContent = String(state.pops)));
  root.querySelectorAll<HTMLElement>('[data-pop-best]').forEach((el) => (el.textContent = String(state.best)));
  setConditional(root, 'showScore', state.pops >= 3);
}

// -- envelope intro (open/replay) --------------------------------------------

let envelopeTimers: number[] = [];

function open(): void {
  if (state.phase > 0) return;
  state.phase = 1;
  const seal = root.querySelector<HTMLElement>('[data-envelope-seal]');
  const hint = root.querySelector<HTMLElement>('[data-envelope-hint]');
  const flapL = root.querySelector<HTMLElement>('[data-envelope-flap="l"]');
  const flapR = root.querySelector<HTMLElement>('[data-envelope-flap="r"]');
  const overlay = root.querySelector<HTMLElement>('[data-envelope-overlay]');
  if (seal) {
    seal.style.transform = 'scale(1.5) rotate(9deg)';
    seal.style.opacity = '0';
  }
  if (hint) hint.style.opacity = '0';
  envelopeTimers.push(
    window.setTimeout(() => {
      if (flapL) flapL.style.transform = 'rotateY(-108deg)';
    }, 380)
  );
  envelopeTimers.push(
    window.setTimeout(() => {
      if (flapR) flapR.style.transform = 'rotateY(112deg)';
    }, 1450)
  );
  envelopeTimers.push(
    window.setTimeout(() => {
      if (overlay) overlay.style.pointerEvents = 'none';
    }, 2300)
  );
  envelopeTimers.push(
    window.setTimeout(() => {
      state.letterVisible = false;
      if (overlay) overlay.style.opacity = '0';
    }, 2750)
  );
}

function replay(): void {
  envelopeTimers.forEach(clearTimeout);
  envelopeTimers = [];
  state.phase = 0;
  state.letterVisible = true;
  const seal = root.querySelector<HTMLElement>('[data-envelope-seal]');
  const hint = root.querySelector<HTMLElement>('[data-envelope-hint]');
  const flapL = root.querySelector<HTMLElement>('[data-envelope-flap="l"]');
  const flapR = root.querySelector<HTMLElement>('[data-envelope-flap="r"]');
  const overlay = root.querySelector<HTMLElement>('[data-envelope-overlay]');
  if (seal) {
    seal.style.transform = 'none';
    seal.style.opacity = '1';
  }
  if (hint) hint.style.opacity = '1';
  if (flapL) flapL.style.transform = 'none';
  if (flapR) flapR.style.transform = 'none';
  if (overlay) {
    overlay.style.pointerEvents = 'auto';
    overlay.style.opacity = '1';
  }
  window.scrollTo(0, 0);
}

// -- Fotos box ------------------------------------------------------------------

function knockBox(): void {
  state.knock += 1;
  const box = root.querySelector<HTMLElement>('[data-photobox]');
  if (box) box.style.animation = state.knock % 2 ? 'wiggle .55s ease-in-out' : 'wiggle2 .55s ease-in-out';
  setConditional(root, 'boxKnocked', true);
}

// -- RSVP submit (envelope-close animation, matches the mockup's `submit`) -----

function submit(e: Event): void {
  e.preventDefault();
  const card = root.querySelector<HTMLElement>('[data-rsvp-card]');
  const env = root.querySelector<HTMLElement>('[data-rsvp-env]');
  const sheet = root.querySelector<HTMLElement>('[data-rsvp-sheet]');
  const flap = root.querySelector<HTMLElement>('[data-rsvp-flap]');
  const seal = root.querySelector<HTMLElement>('[data-rsvp-seal]');
  const wrap = root.querySelector<HTMLElement>('[data-rsvp-wrap]');
  const timers: number[] = [];
  const at = (t: number, fn: () => void) => timers.push(window.setTimeout(fn, t));

  if (wrap) {
    const r = wrap.getBoundingClientRect();
    wrap.style.maxHeight = `${r.height}px`;
    const rootEl = document.documentElement;
    const prev = rootEl.style.scrollBehavior;
    rootEl.style.scrollBehavior = 'auto';
    window.scrollTo(0, Math.max(0, window.scrollY + r.top - 86));
    rootEl.style.scrollBehavior = prev;
    void wrap.offsetHeight;
    wrap.style.maxHeight = '250px';
  }
  if (card) {
    card.style.transform = 'rotateX(16deg) scaleY(.2) translateY(52px)';
    card.style.opacity = '.45';
  }
  at(700, () => {
    if (env) {
      env.style.display = 'block';
      void env.offsetHeight;
      env.style.opacity = '1';
      env.style.transform = 'rotateX(8deg) scale(1)';
    }
    if (card) {
      card.style.transform = 'rotateX(26deg) scaleY(.09) translateY(70px) scale(.6)';
      card.style.opacity = '0';
    }
  });
  at(1660, () => {
    if (sheet) sheet.style.transform = 'translateY(24px)';
  });
  at(2440, () => {
    if (flap) flap.style.transform = 'rotateX(0deg)';
  });
  at(3080, () => {
    if (seal) {
      seal.style.opacity = '1';
      seal.style.transform = 'rotate(7deg) scale(1)';
    }
  });
  at(3860, () => {
    if (env) {
      env.style.opacity = '0';
      env.style.transform = 'translate3d(-135%,14px,-260px) rotate3d(.25,1,.18,-30deg) scale(.82)';
    }
  });
  at(4920, () => {
    if (wrap) wrap.style.maxHeight = '';
    if (card) {
      card.style.transform = 'none';
      card.style.opacity = '1';
    }
    if (env) {
      env.style.display = 'none';
      env.style.transform = 'rotateX(8deg) scale(.7)';
    }
    if (sheet) sheet.style.transform = 'translateY(-138px)';
    if (flap) flap.style.transform = 'rotateX(168deg)';
    if (seal) {
      seal.style.opacity = '0';
      seal.style.transform = 'rotate(-16deg) scale(.35)';
    }
    state.sent = true;
    setConditional(root, 'sent', true);
    setConditional(root, 'notSent', false);
  });
}

// -- Kuchenbuffet ---------------------------------------------------------------

function cakeLayerStyle(c: Cake, i: number, total: number): string {
  const [sponge, filling] = CAKE_TYPES[c.kind] ?? ['#ecd8b4', '#c07a44'];
  const w = Math.max(52, 100 - i * (44 / Math.max(1, total - 1 || 1)));
  const rot = (i % 2 ? 0.6 : -0.6) * (1 + (i % 3) * 0.25);
  return (
    'display:flex;align-items:baseline;justify-content:center;gap:9px;box-sizing:border-box;padding:8px 12px 0;' +
    `width:${w.toFixed(1)}%;max-width:340px;height:36px;border-radius:7px 7px 5px 5px;` +
    'border:1.2px solid rgba(91,42,16,.26);box-shadow:0 2px 6px rgba(91,42,16,.13);' +
    `background:linear-gradient(${sponge} 0 64%,${filling} 64% 78%,${sponge} 78% 100%);` +
    `transform:rotate(${rot.toFixed(2)}deg);animation:layerIn .55s cubic-bezier(.34,1.56,.64,1) both`
  );
}

function cakeCountLabel(): string {
  const n = state.cakes.length;
  const total = state.cakes.reduce((a, c) => a + (c.slices || 0), 0);
  return n === 0 ? 'noch keine Böden' : `${n} ${n === 1 ? 'Boden' : 'Böden'}${total ? ` · ca. ${total} Stücke` : ''}`;
}

function submitCake(e: Event): void {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const what = ((form.elements.namedItem('what') as HTMLInputElement)?.value || '').trim();
  const cake: Cake = {
    name: what || 'Überraschungskuchen',
    who: ((form.elements.namedItem('who') as HTMLInputElement)?.value || '').trim(),
    slices: parseInt((form.elements.namedItem('slices') as HTMLInputElement)?.value, 10) || 0,
    kind: (form.elements.namedItem('kind') as HTMLSelectElement)?.value || 'Kuchen'
  };
  const wasEmpty = state.cakes.length === 0;
  state.cakes.push(cake);
  state.cakeSent = true;
  setConditional(root, 'cakeSent', true);
  setConditional(root, 'cakeNotSent', false);

  const layers = root.querySelector<HTMLElement>('[data-cake-layers]');
  if (layers) {
    const div = document.createElement('div');
    div.setAttribute('style', cakeLayerStyle(cake, state.cakes.length - 1, state.cakes.length));
    div.innerHTML =
      `<span style="font:500 13px/1 Karla,sans-serif;letter-spacing:.01em;color:#4a2109;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${cake.name}</span>` +
      `<span style="font:400 10.5px/1 Karla,sans-serif;color:rgba(74,33,9,.72);white-space:nowrap">${[cake.who, cake.slices ? cake.slices + ' Stücke' : ''].filter(Boolean).join(' · ')}</span>`;
    layers.prepend(div);
  }
  if (wasEmpty) {
    setConditional(root, 'cakeAny', true);
    setConditional(root, 'cakeEmpty', false);
  }
  root.querySelectorAll<HTMLElement>('[data-cake-count]').forEach((el) => (el.textContent = cakeCountLabel()));
}

// -- gate -----------------------------------------------------------------------

function gateSubmit(e: Event): void {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const code = (form.elements.namedItem('code') as HTMLInputElement)?.value || '';
  const resolved = resolveCode(code);
  if (resolved === 'admin') {
    state.admin = true;
    try {
      localStorage.setItem('rm-admin', '1');
    } catch {
      /* private mode */
    }
    state.gateError = '';
    applyGuest('alles');
  } else if (resolved) {
    state.gateError = '';
    applyGuest(resolved);
  } else {
    state.gateError = state.lang === 'en' ? 'Hmm, that word does not fit. Check your invitation?' : state.lang === 'sv' ? 'Hmm, ordet passar inte. Kolla inbjudan?' : 'Hmm, das Wort passt nicht. Schau nochmal auf die Einladung?';
    root.querySelectorAll<HTMLElement>('[data-gate-error]').forEach((el) => (el.textContent = state.gateError));
  }
}

let secretHits = 0;
function gateSecret(): void {
  secretHits += 1;
  if (secretHits >= 3) {
    state.admin = true;
    try {
      localStorage.setItem('rm-admin', '1');
    } catch {
      /* private mode */
    }
    applyGuest('alles');
  }
}

function setGate(): void {
  try {
    localStorage.removeItem('rm-guest');
  } catch {
    /* private mode */
  }
  applyGuest(null);
}

// -- boot -------------------------------------------------------------------

function buildInitialValues(): Values {
  const d = window.innerWidth >= 860;
  const cakeLayers = state.cakes
    .slice()
    .reverse()
    .map((c, i) => ({ style: cakeLayerStyle(c, i, state.cakes.length), name: c.name, meta: [c.who, c.slices ? c.slices + ' Stücke' : ''].filter(Boolean).join(' · ') }));

  const values: Values = {
    cardMax: d ? '1180px' : '100%',
    cardShadow: d ? '0 0 60px rgba(70,45,20,.22)' : 'none',
    headerAlign: d ? 'center' : 'flex-start',
    contentMax: d ? '640px' : '430px',
    ablaufMax: d ? '1040px' : '430px',
    formMax: d ? '560px' : '430px',
    navPanelMax: d ? '360px' : '100%',
    deOp: 1,
    enOp: 0.4,
    svOp: 0.4,
    setDe: () => setLang('de'),
    setEn: () => setLang('en'),
    setSv: () => setLang('sv'),
    toggleNav: () => toggleNav(),
    navOpen: false,
    cdD: '0',
    cdH: '00',
    cdM: '00',
    cdS: '00',
    showScore: false,
    popScore: '0',
    popBest: '0',
    ablaufVB: '0 0 378 975',
    ablaufD: 'M0 0',
    flyFlock,
    popDove,
    sent: false,
    notSent: true,
    submit,
    cakeSent: false,
    cakeNotSent: true,
    submitCake,
    cakeCount: cakeCountLabel(),
    cakeAny: state.cakes.length > 0,
    cakeEmpty: state.cakes.length === 0,
    cakeLayers,
    letterVisible: true,
    open,
    replay,
    flapL: 'none',
    flapR: 'none',
    overlayPE: 'auto',
    overlayO: '1',
    sealT: 'none',
    sealO: '1',
    grow: 'scale(.12) rotate(-14deg)',
    growO: '0',
    boxAnim: 'none',
    boxKnocked: false,
    knockBox,
    gateOpen: true,
    gateError: '',
    gateSubmit,
    gateSecret,
    adminOn: false,
    cTrauung: 'rgba(91,42,16,.75)',
    cParty: 'rgba(91,42,16,.75)',
    cAlles: 'rgba(91,42,16,.75)',
    setTrauung: () => applyGuest('trauung'),
    setParty: () => applyGuest('party'),
    setAlles: () => applyGuest('alles'),
    setGate
  };

  for (let n = 1; n <= 9; n++) {
    values[`fan${n}`] = '0';
    values[`fanToggle${n}`] = ((i: number) => () => fanToggle(i))(n);
  }
  for (let n = 1; n <= 4; n++) {
    values[`post${n}`] = '0';
    values[`postToggle${n}`] = ((i: number) => () => postToggle(i))(n);
  }
  return values;
}

export function boot(container: HTMLElement): void {
  root = container;
  const values = buildInitialValues();
  root.innerHTML = render(bodyRawHtml, values);
  bindEvents(root, values);

  // Stamp data-fan-id/data-post-id from each stack/postcard's own toggle button
  // (fanToggleN/postToggleN) rather than DOM order — the story timeline's fan
  // numbers (fan1, fan2, fan3, fan7, fan4, ...) are NOT sequential in the DOM.
  root.querySelectorAll<HTMLElement>('[data-stack]').forEach((el) => {
    const btn = el.querySelector<HTMLElement>('[data-onclick^="fanToggle"]');
    const n = btn?.dataset.onclick?.replace('fanToggle', '');
    if (n) el.setAttribute('data-fan-id', n);
  });
  root.querySelectorAll<HTMLElement>('[data-post]').forEach((el) => {
    const btn = el.querySelector<HTMLElement>('[data-onclick^="postToggle"]');
    const n = btn?.dataset.onclick?.replace('postToggle', '');
    if (n) el.setAttribute('data-post-id', n);
  });

  applyLang(root, 'de');
  applyResponsive();
  initGuest();
  initReveal();
  setTimeout(layoutAblaufLine, 260);
  setTimeout(layoutAblaufLine, 1200);
  window.addEventListener('resize', () => {
    applyResponsive();
    layoutAblaufLine();
  });

  tickCountdown();
  setInterval(tickCountdown, 1000);
}
